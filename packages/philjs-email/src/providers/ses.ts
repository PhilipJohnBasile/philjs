import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
  SendBulkTemplatedEmailCommand,
  GetSendQuotaCommand,
} from '@aws-sdk/client-ses';
import type {
  EmailProvider,
  EmailMessage,
  EmailResult,
  SesConfig,
  EmailAddress,
  BulkEmailMessage,
  BulkEmailResult,
  TemplateEmailMessage,
} from '../types.js';
import { renderReactEmail, normalizeAddress, withRetry } from '../utils.js';

/**
 * AWS SES Email Provider
 *
 * Features:
 * - High volume sending
 * - Cost effective
 * - Integrates with AWS ecosystem
 * - Configuration sets for tracking
 * - Dedicated IPs available
 */
export class SesProvider implements EmailProvider {
  readonly name = 'ses';
  private client: SESClient;
  private config: SesConfig;

  constructor(config: SesConfig) {
    this.config = config;

    const clientConfig: ConstructorParameters<typeof SESClient>[0] = {
      region: config.region,
    };

    // Use explicit credentials if provided, otherwise rely on default AWS credential chain
    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    this.client = new SESClient(clientConfig);
  }

  /**
   * Send a single email via AWS SES
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    const sendFn = async (): Promise<EmailResult> => {
      try {
        // Render React template if provided
        let html = message.html;
        let text = message.text;

        if (message.react) {
          const rendered = await renderReactEmail(message.react);
          html = rendered.html;
          text = text ?? rendered.text;
        }

        const from = message.from ?? this.config.defaultFrom;
        if (!from) {
          throw new Error('From address is required');
        }

        // If we have attachments, we need to use SendRawEmail
        if (message.attachments && message.attachments.length > 0) {
          return this.sendRaw(message, from, html, text);
        }

        // Otherwise, use SendEmail for simplicity
        const command = new SendEmailCommand({
          Source: this.formatAddress(from),
          Destination: {
            ToAddresses: this.formatAddresses(message.to),
            CcAddresses: message.cc
              ? this.formatAddresses(message.cc)
              : undefined,
            BccAddresses: message.bcc
              ? this.formatAddresses(message.bcc)
              : undefined,
          },
          Message: {
            Subject: {
              Data: message.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Text: text
                ? {
                    Data: text,
                    Charset: 'UTF-8',
                  }
                : undefined,
              Html: html
                ? {
                    Data: html,
                    Charset: 'UTF-8',
                  }
                : undefined,
            },
          },
          ReplyToAddresses: message.replyTo
            ? [this.formatAddress(message.replyTo)]
            : undefined,
          ConfigurationSetName: this.config.configurationSetName,
          Tags: message.tags?.map((tag) => ({
            Name: tag,
            Value: 'true',
          })),
        });

        const response = await this.client.send(command);

        if (this.config.debug) {
          console.log(`[SES] Email sent: ${response.MessageId}`);
        }

        return {
          success: true,
          messageId: response.MessageId,
          response,
          timestamp: new Date(),
        };
      } catch (error: any) {
        if (this.config.debug) {
          console.error('[SES] Send error:', error);
        }

        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: new Date(),
        };
      }
    };

    if (this.config.retry) {
      return withRetry(sendFn, this.config.retry);
    }

    return sendFn();
  }

  /**
   * Send raw email with attachments
   */
  private async sendRaw(
    message: EmailMessage,
    from: string | EmailAddress,
    html: string | undefined,
    text: string | undefined
  ): Promise<EmailResult> {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mixedBoundary = `----=_Mixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let rawMessage = '';

    // Headers
    rawMessage += `From: ${this.formatAddress(from)}\r\n`;
    rawMessage += `To: ${this.formatAddresses(message.to).join(', ')}\r\n`;

    if (message.cc) {
      rawMessage += `Cc: ${this.formatAddresses(message.cc).join(', ')}\r\n`;
    }

    if (message.replyTo) {
      rawMessage += `Reply-To: ${this.formatAddress(message.replyTo)}\r\n`;
    }

    rawMessage += `Subject: =?UTF-8?B?${Buffer.from(message.subject).toString('base64')}?=\r\n`;
    rawMessage += 'MIME-Version: 1.0\r\n';

    // Add custom headers
    if (message.headers) {
      for (const [key, value] of Object.entries(message.headers)) {
        rawMessage += `${key}: ${value}\r\n`;
      }
    }

    // Add unsubscribe headers
    if (message.unsubscribe) {
      const unsubValues: string[] = [];
      if (message.unsubscribe.url) {
        unsubValues.push(`<${message.unsubscribe.url}>`);
      }
      if (message.unsubscribe.email) {
        unsubValues.push(`<mailto:${message.unsubscribe.email}>`);
      }
      if (unsubValues.length > 0) {
        rawMessage += `List-Unsubscribe: ${unsubValues.join(', ')}\r\n`;
      }
      if (message.unsubscribe.oneClick) {
        rawMessage += 'List-Unsubscribe-Post: List-Unsubscribe=One-Click\r\n';
      }
    }

    rawMessage += `Content-Type: multipart/mixed; boundary="${mixedBoundary}"\r\n`;
    rawMessage += '\r\n';

    // Body part
    rawMessage += `--${mixedBoundary}\r\n`;
    rawMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
    rawMessage += '\r\n';

    // Text part
    if (text) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += 'Content-Type: text/plain; charset=UTF-8\r\n';
      rawMessage += 'Content-Transfer-Encoding: quoted-printable\r\n';
      rawMessage += '\r\n';
      rawMessage += text + '\r\n';
    }

    // HTML part
    if (html) {
      rawMessage += `--${boundary}\r\n`;
      rawMessage += 'Content-Type: text/html; charset=UTF-8\r\n';
      rawMessage += 'Content-Transfer-Encoding: quoted-printable\r\n';
      rawMessage += '\r\n';
      rawMessage += html + '\r\n';
    }

    rawMessage += `--${boundary}--\r\n`;

    // Attachments
    if (message.attachments) {
      for (const attachment of message.attachments) {
        rawMessage += `--${mixedBoundary}\r\n`;
        rawMessage += `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename}"\r\n`;
        rawMessage += `Content-Disposition: ${attachment.disposition || 'attachment'}; filename="${attachment.filename}"\r\n`;
        rawMessage += 'Content-Transfer-Encoding: base64\r\n';

        if (attachment.cid) {
          rawMessage += `Content-ID: <${attachment.cid}>\r\n`;
        }

        rawMessage += '\r\n';

        const content =
          attachment.content instanceof Buffer
            ? attachment.content.toString('base64')
            : Buffer.from(attachment.content, 'utf-8').toString('base64');

        // Split base64 content into 76-character lines
        const lines = content.match(/.{1,76}/g) || [];
        rawMessage += lines.join('\r\n') + '\r\n';
      }
    }

    rawMessage += `--${mixedBoundary}--\r\n`;

    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
      ConfigurationSetName: this.config.configurationSetName,
      Tags: message.tags?.map((tag) => ({
        Name: tag,
        Value: 'true',
      })),
    });

    const response = await this.client.send(command);

    return {
      success: true,
      messageId: response.MessageId,
      response,
      timestamp: new Date(),
    };
  }

  /**
   * Send bulk emails via SES
   */
  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];

    // SES doesn't have great bulk support without templates
    // We'll send individually with rate limiting
    for (const recipient of message.recipients) {
      const individualMessage: EmailMessage = {
        ...message,
        to: recipient.to,
        metadata: { ...message.metadata, ...recipient.metadata },
      };

      const result = await this.send(individualMessage);
      results.push(result);

      // Rate limit to avoid SES throttling
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return {
      total: message.recipients.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Send using an SES template
   */
  async sendTemplate<T>(
    message: TemplateEmailMessage<T>
  ): Promise<EmailResult> {
    try {
      const from = message.from ?? this.config.defaultFrom;
      if (!from) {
        throw new Error('From address is required');
      }

      const command = new SendBulkTemplatedEmailCommand({
        Source: this.formatAddress(from),
        Template: message.template,
        DefaultTemplateData: JSON.stringify(message.variables),
        Destinations: this.formatAddresses(message.to).map((addr) => ({
          Destination: {
            ToAddresses: [addr],
          },
        })),
        ConfigurationSetName: this.config.configurationSetName,
      });

      const response = await this.client.send(command);

      // Check for failures
      const failed = response.Status?.filter(
        (s) => s.Status !== 'Success'
      );

      if (failed && failed.length > 0) {
        return {
          success: false,
          error: new Error(
            failed.map((f) => f.Error).join(', ')
          ),
          response,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: response.Status?.[0]?.MessageId,
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify SES connection and get sending quota
   */
  async verify(): Promise<boolean> {
    try {
      const command = new GetSendQuotaCommand({});
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current sending quota
   */
  async getQuota(): Promise<{
    max24HourSend: number;
    maxSendRate: number;
    sentLast24Hours: number;
  }> {
    const command = new GetSendQuotaCommand({});
    const response = await this.client.send(command);

    return {
      max24HourSend: response.Max24HourSend || 0,
      maxSendRate: response.MaxSendRate || 0,
      sentLast24Hours: response.SentLast24Hours || 0,
    };
  }

  /**
   * Close the SES client
   */
  async close(): Promise<void> {
    this.client.destroy();
  }

  private formatAddress(address: string | EmailAddress): string {
    const normalized = normalizeAddress(address);
    if (normalized.name) {
      return `${normalized.name} <${normalized.email}>`;
    }
    return normalized.email;
  }

  private formatAddresses(
    addresses: string | EmailAddress | (string | EmailAddress)[]
  ): string[] {
    const list = Array.isArray(addresses) ? addresses : [addresses];
    return list.map((addr) => this.formatAddress(addr));
  }
}

/**
 * Create an AWS SES provider
 */
export function createSesProvider(config: SesConfig): SesProvider {
  return new SesProvider(config);
}

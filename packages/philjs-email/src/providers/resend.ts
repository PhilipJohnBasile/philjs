import { Resend } from 'resend';
import type {
  EmailProvider,
  EmailMessage,
  EmailResult,
  ResendConfig,
  EmailAddress,
  BulkEmailMessage,
  BulkEmailResult,
} from '../types';
import { renderReactEmail, normalizeAddress, withRetry } from '../utils';

/**
 * Resend Email Provider
 *
 * Features:
 * - Modern API design
 * - Native React Email support
 * - Built for developers
 * - Excellent DX
 */
export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private client: Resend;
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
    this.client = new Resend(config.apiKey);
  }

  /**
   * Send a single email via Resend
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    const sendFn = async (): Promise<EmailResult> => {
      try {
        // Render React template if provided
        let html = message.html;
        let text = message.text;
        let react = message.react;

        // If we have a React component, we can pass it directly to Resend
        // or render it ourselves
        if (react && !html) {
          const rendered = await renderReactEmail(react);
          html = rendered.html;
          text = text ?? rendered.text;
          react = undefined; // We've rendered it ourselves
        }

        const from = message.from ?? this.config.defaultFrom;
        if (!from) {
          throw new Error('From address is required');
        }

        // Build Resend message
        const resendMessage: Parameters<Resend['emails']['send']>[0] = {
          from: this.formatAddress(from),
          to: this.formatAddresses(message.to),
          subject: message.subject,
          text: text || undefined,
          html: html || undefined,
          cc: message.cc ? this.formatAddresses(message.cc) : undefined,
          bcc: message.bcc ? this.formatAddresses(message.bcc) : undefined,
          reply_to: message.replyTo
            ? this.formatAddress(message.replyTo)
            : undefined,
          headers: message.headers,
          attachments: message.attachments?.map((att) => ({
            filename: att.filename,
            content:
              att.content instanceof Buffer
                ? att.content
                : Buffer.from(att.content, att.encoding || 'utf-8'),
            content_type: att.contentType,
          })),
          tags: message.tags?.map((tag) => ({
            name: tag,
            value: 'true',
          })),
        };

        // Handle scheduled sending
        if (message.scheduledAt) {
          (resendMessage as any).scheduled_at =
            message.scheduledAt instanceof Date
              ? message.scheduledAt.toISOString()
              : message.scheduledAt;
        }

        const response = await this.client.emails.send(resendMessage);

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (this.config.debug) {
          console.log(`[Resend] Email sent: ${response.data?.id}`);
        }

        return {
          success: true,
          messageId: response.data?.id,
          response: response.data,
          timestamp: new Date(),
        };
      } catch (error: any) {
        if (this.config.debug) {
          console.error('[Resend] Send error:', error);
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
   * Send bulk emails via Resend
   * Resend supports batch sending
   */
  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    const batchSize = 100; // Resend batch limit

    // Render template once
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

    // Process in batches
    for (let i = 0; i < message.recipients.length; i += batchSize) {
      const batch = message.recipients.slice(i, i + batchSize);

      try {
        const batchMessages = batch.map((recipient) => ({
          from: this.formatAddress(from),
          to: this.formatAddresses(recipient.to),
          subject: message.subject,
          text: text || undefined,
          html: html || undefined,
        }));

        const response = await this.client.batch.send(batchMessages);

        if (response.error) {
          throw new Error(response.error.message);
        }

        // Mark all in batch as successful
        response.data?.data.forEach((result) => {
          results.push({
            success: true,
            messageId: result.id,
            timestamp: new Date(),
          });
        });
      } catch (error) {
        // Mark all in batch as failed
        batch.forEach(() => {
          results.push({
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            timestamp: new Date(),
          });
        });
      }
    }

    return {
      total: message.recipients.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Verify Resend API key
   */
  async verify(): Promise<boolean> {
    try {
      const response = await this.client.domains.list();
      return !response.error;
    } catch {
      return false;
    }
  }

  /**
   * Get email by ID
   */
  async getEmail(id: string): Promise<unknown> {
    const response = await this.client.emails.get(id);
    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.data;
  }

  /**
   * Cancel scheduled email
   */
  async cancelScheduled(id: string): Promise<boolean> {
    try {
      const response = await this.client.emails.cancel(id);
      return !response.error;
    } catch {
      return false;
    }
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
 * Create a Resend provider
 */
export function createResendProvider(config: ResendConfig): ResendProvider {
  return new ResendProvider(config);
}

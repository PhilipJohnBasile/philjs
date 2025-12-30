import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type {
  EmailProvider,
  EmailMessage,
  EmailResult,
  SmtpConfig,
  EmailAddress,
  BulkEmailMessage,
  BulkEmailResult,
  EmailAttachment,
} from '../types.js';
import { renderReactEmail, formatAddress, withRetry } from '../utils.js';

/**
 * SMTP Email Provider using Nodemailer
 *
 * Supports any SMTP server including:
 * - Gmail
 * - Outlook/Office 365
 * - Amazon SES (SMTP interface)
 * - Custom SMTP servers
 */
export class SmtpProvider implements EmailProvider {
  readonly name = 'smtp';
  private transporter: Transporter;
  private config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = config;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: config.auth,
      tls: config.tls as Record<string, unknown>,
      pool: config.pool ?? false,
      maxConnections: config.maxConnections ?? 5,
      debug: config.debug,
      connectionTimeout: config.timeout ?? 30000,
    } as SMTPTransport.Options);
  }

  /**
   * Send a single email via SMTP
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

        // Build email options
        const mailOptions: nodemailer.SendMailOptions = {
          from: formatAddress(from),
          to: this.formatRecipients(message.to),
          cc: message.cc ? this.formatRecipients(message.cc) : undefined,
          bcc: message.bcc ? this.formatRecipients(message.bcc) : undefined,
          replyTo: message.replyTo ? formatAddress(message.replyTo) : undefined,
          subject: message.subject,
          text,
          html,
          attachments: message.attachments?.map((att: EmailAttachment) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
            contentDisposition: att.disposition,
            cid: att.cid,
            encoding: att.encoding,
          })),
          headers: this.buildHeaders(message),
          priority: message.priority,
        };

        const result = await this.transporter.sendMail(mailOptions);

        if (this.config.debug) {
          console.log(`[SMTP] Email sent: ${result.messageId}`);
        }

        return {
          success: true,
          messageId: result.messageId,
          response: result,
          timestamp: new Date(),
        };
      } catch (error) {
        if (this.config.debug) {
          console.error('[SMTP] Send error:', error);
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
   * Send bulk emails via SMTP
   * Note: SMTP doesn't have native bulk support, so we send individually
   */
  async sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];

    for (const recipient of message.recipients) {
      // Create individual message with personalization
      const individualMessage: EmailMessage = {
        ...message,
        to: recipient.to,
        metadata: { ...message.metadata, ...recipient.metadata },
      };

      const result = await this.send(individualMessage);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      total: message.recipients.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error('[SMTP] Verification failed:', error);
      }
      return false;
    }
  }

  /**
   * Close the transporter
   */
  async close(): Promise<void> {
    this.transporter.close();
  }

  private formatRecipients(
    recipients: string | EmailAddress | (string | EmailAddress)[]
  ): string | string[] {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => formatAddress(r));
    }
    return formatAddress(recipients);
  }

  private buildHeaders(message: EmailMessage): Record<string, string> {
    const headers: Record<string, string> = { ...message.headers };

    // Add tracking headers if enabled
    if (message.tracking?.metadata) {
      headers['X-Email-Metadata'] = JSON.stringify(message.tracking.metadata);
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
        headers['List-Unsubscribe'] = unsubValues.join(', ');
      }

      if (message.unsubscribe.oneClick && message.unsubscribe.url) {
        headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      }
    }

    // Add priority header
    if (message.priority) {
      const priorityMap: Record<string, string> = {
        high: '1 (Highest)',
        normal: '3 (Normal)',
        low: '5 (Lowest)',
      };
      headers['X-Priority'] = priorityMap[message.priority]!;
    }

    return headers;
  }
}

/**
 * Create an SMTP provider
 */
export function createSmtpProvider(config: SmtpConfig): SmtpProvider {
  return new SmtpProvider(config);
}

/**
 * Common SMTP presets
 */
export const SmtpPresets = {
  gmail: (user: string, pass: string): SmtpConfig => ({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  }),

  outlook: (user: string, pass: string): SmtpConfig => ({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  }),

  office365: (user: string, pass: string): SmtpConfig => ({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  }),

  yahoo: (user: string, pass: string): SmtpConfig => ({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  }),

  zoho: (user: string, pass: string): SmtpConfig => ({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  }),
};

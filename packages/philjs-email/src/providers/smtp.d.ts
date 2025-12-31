import type { EmailProvider, EmailMessage, EmailResult, SmtpConfig, BulkEmailMessage, BulkEmailResult } from '../types.js';
/**
 * SMTP Email Provider using Nodemailer
 *
 * Supports any SMTP server including:
 * - Gmail
 * - Outlook/Office 365
 * - Amazon SES (SMTP interface)
 * - Custom SMTP servers
 */
export declare class SmtpProvider implements EmailProvider {
    readonly name = "smtp";
    private transporter;
    private config;
    constructor(config: SmtpConfig);
    /**
     * Send a single email via SMTP
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Send bulk emails via SMTP
     * Note: SMTP doesn't have native bulk support, so we send individually
     */
    sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Verify SMTP connection
     */
    verify(): Promise<boolean>;
    /**
     * Close the transporter
     */
    close(): Promise<void>;
    private formatRecipients;
    private buildHeaders;
}
/**
 * Create an SMTP provider
 */
export declare function createSmtpProvider(config: SmtpConfig): SmtpProvider;
/**
 * Common SMTP presets
 */
export declare const SmtpPresets: {
    gmail: (user: string, pass: string) => SmtpConfig;
    outlook: (user: string, pass: string) => SmtpConfig;
    office365: (user: string, pass: string) => SmtpConfig;
    yahoo: (user: string, pass: string) => SmtpConfig;
    zoho: (user: string, pass: string) => SmtpConfig;
};
//# sourceMappingURL=smtp.d.ts.map
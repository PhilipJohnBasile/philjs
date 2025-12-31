import type { EmailProvider, EmailMessage, EmailResult, MailgunConfig, BulkEmailMessage, BulkEmailResult, TemplateEmailMessage } from '../types';
/**
 * Mailgun Email Provider
 *
 * Features:
 * - High deliverability
 * - Email validation
 * - Detailed analytics
 * - Template support
 * - Mailing lists
 */
export declare class MailgunProvider implements EmailProvider {
    readonly name = "mailgun";
    private client;
    private config;
    constructor(config: MailgunConfig);
    /**
     * Send a single email via Mailgun
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Send bulk emails via Mailgun using recipient variables
     * Mailgun supports up to 1000 recipients per request
     */
    sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Send using a Mailgun stored template
     */
    sendTemplate<T>(message: TemplateEmailMessage<T>): Promise<EmailResult>;
    /**
     * Verify Mailgun domain
     */
    verify(): Promise<boolean>;
    private formatRecipients;
}
/**
 * Create a Mailgun provider
 */
export declare function createMailgunProvider(config: MailgunConfig): MailgunProvider;
//# sourceMappingURL=mailgun.d.ts.map
import type { EmailProvider, EmailMessage, EmailResult, SendGridConfig, BulkEmailMessage, BulkEmailResult, TemplateEmailMessage } from '../types';
/**
 * SendGrid Email Provider
 *
 * Features:
 * - High deliverability
 * - Native template support
 * - Bulk sending (up to 1000 per API call)
 * - Email tracking (opens, clicks)
 * - Webhooks for events
 */
export declare class SendGridProvider implements EmailProvider {
    readonly name = "sendgrid";
    private config;
    constructor(config: SendGridConfig);
    /**
     * Send a single email via SendGrid
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Send bulk emails via SendGrid
     * SendGrid supports up to 1000 personalizations per request
     */
    sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Send using a SendGrid dynamic template
     */
    sendTemplate<T>(message: TemplateEmailMessage<T>): Promise<EmailResult>;
    /**
     * Verify SendGrid API key
     */
    verify(): Promise<boolean>;
    private toSendGridAddress;
    private toSendGridAddresses;
    private buildHeaders;
    private mapOptions;
}
/**
 * Create a SendGrid provider
 */
export declare function createSendGridProvider(config: SendGridConfig): SendGridProvider;
//# sourceMappingURL=sendgrid.d.ts.map
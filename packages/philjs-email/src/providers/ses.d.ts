import type { EmailProvider, EmailMessage, EmailResult, SesConfig, BulkEmailMessage, BulkEmailResult, TemplateEmailMessage } from '../types';
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
export declare class SesProvider implements EmailProvider {
    readonly name = "ses";
    private client;
    private config;
    constructor(config: SesConfig);
    /**
     * Send a single email via AWS SES
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Send raw email with attachments
     */
    private sendRaw;
    /**
     * Send bulk emails via SES
     */
    sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Send using an SES template
     */
    sendTemplate<T>(message: TemplateEmailMessage<T>): Promise<EmailResult>;
    /**
     * Verify SES connection and get sending quota
     */
    verify(): Promise<boolean>;
    /**
     * Get current sending quota
     */
    getQuota(): Promise<{
        max24HourSend: number;
        maxSendRate: number;
        sentLast24Hours: number;
    }>;
    /**
     * Close the SES client
     */
    close(): Promise<void>;
    private formatAddress;
    private formatAddresses;
}
/**
 * Create an AWS SES provider
 */
export declare function createSesProvider(config: SesConfig): SesProvider;
//# sourceMappingURL=ses.d.ts.map
import type { EmailProvider, EmailMessage, EmailResult, ResendConfig, BulkEmailMessage, BulkEmailResult } from '../types';
/**
 * Resend Email Provider
 *
 * Features:
 * - Modern API design
 * - Native React Email support
 * - Built for developers
 * - Excellent DX
 */
export declare class ResendProvider implements EmailProvider {
    readonly name = "resend";
    private client;
    private config;
    constructor(config: ResendConfig);
    /**
     * Send a single email via Resend
     */
    send(message: EmailMessage): Promise<EmailResult>;
    /**
     * Send bulk emails via Resend
     * Resend supports batch sending
     */
    sendBulk(message: BulkEmailMessage): Promise<BulkEmailResult>;
    /**
     * Verify Resend API key
     */
    verify(): Promise<boolean>;
    /**
     * Get email by ID
     */
    getEmail(id: string): Promise<unknown>;
    /**
     * Cancel scheduled email
     */
    cancelScheduled(id: string): Promise<boolean>;
    private formatAddress;
    private formatAddresses;
}
/**
 * Create a Resend provider
 */
export declare function createResendProvider(config: ResendConfig): ResendProvider;
//# sourceMappingURL=resend.d.ts.map
/**
 * PhilJS Payments Webhooks
 * Webhook handlers for payment providers
 */
export interface WebhookEvent {
    type: string;
    data: unknown;
    timestamp: Date;
    signature?: string;
}
export interface WebhookHandler {
    (event: WebhookEvent): Promise<void> | void;
}
/**
 * Handle Stripe webhooks
 */
export declare function handleStripeWebhook(payload: string | Buffer, signature: string, secret: string): Promise<WebhookEvent>;
/**
 * Handle PayPal webhooks
 */
export declare function handlePayPalWebhook(payload: string | Buffer, headers: Record<string, string>): Promise<WebhookEvent>;
/**
 * Verify webhook signature
 */
export declare function verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): Promise<boolean>;
//# sourceMappingURL=index.d.ts.map
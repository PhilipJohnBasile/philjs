/**
 * Paddle Payment Provider for PhilJS Payments
 *
 * Features:
 * - Paddle API integration (v2)
 * - Subscription management
 * - Webhook signature verification
 * - Idempotency support
 *
 * Note: Paddle is a Merchant of Record, handling taxes and compliance
 */
import type { PaymentProvider, CreateCheckoutRequest, CheckoutSession, CreateSubscriptionRequest, Subscription, CancelSubscriptionRequest, CreateCustomerRequest, Customer, AttachPaymentMethodRequest, PaymentMethod, CreateInvoiceRequest, Invoice, RefundRequest, Refund, WebhookRequest, WebhookEvent } from '../index.js';
export interface PaddleConfig {
    apiKey: string;
    webhookSecret: string;
    environment?: 'sandbox' | 'production';
    sellerId?: string;
}
export declare class PaddleProvider implements PaymentProvider {
    readonly name: "paddle";
    private apiKey;
    private webhookSecret;
    private baseUrl;
    constructor(config: PaddleConfig);
    createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession>;
    retrieveCheckout(sessionId: string): Promise<CheckoutSession>;
    createSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
    retrieveSubscription(subscriptionId: string): Promise<Subscription>;
    updateSubscription(subscriptionId: string, updates: Partial<CreateSubscriptionRequest>): Promise<Subscription>;
    cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription>;
    listSubscriptions(customerId: string): Promise<Subscription[]>;
    createCustomer(request: CreateCustomerRequest): Promise<Customer>;
    retrieveCustomer(customerId: string): Promise<Customer>;
    updateCustomer(customerId: string, updates: Partial<CreateCustomerRequest>): Promise<Customer>;
    deleteCustomer(customerId: string): Promise<void>;
    attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod>;
    detachPaymentMethod(paymentMethodId: string): Promise<void>;
    listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
    setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
    createInvoice(request: CreateInvoiceRequest): Promise<Invoice>;
    retrieveInvoice(invoiceId: string): Promise<Invoice>;
    finalizeInvoice(invoiceId: string): Promise<Invoice>;
    voidInvoice(invoiceId: string): Promise<Invoice>;
    listInvoices(customerId: string): Promise<Invoice[]>;
    refund(request: RefundRequest): Promise<Refund>;
    retrieveRefund(refundId: string): Promise<Refund>;
    handleWebhook(request: WebhookRequest): Promise<WebhookEvent>;
    verifyWebhookSignature(request: WebhookRequest): boolean;
    private makeRequest;
    private mapTransactionStatus;
    private mapSubscription;
    private mapInvoice;
    private mapRefundStatus;
    private handlePaddleError;
}
/**
 * Create a configured Paddle provider instance.
 */
export declare function createPaddleProvider(config: PaddleConfig): PaddleProvider;
//# sourceMappingURL=paddle.d.ts.map
/**
 * Square Payment Provider for PhilJS Payments
 *
 * Features:
 * - Square API integration
 * - Idempotency key support
 * - Webhook signature verification
 * - Subscription and invoice management
 */
import type { PaymentProvider, CreateCheckoutRequest, CheckoutSession, CreateSubscriptionRequest, Subscription, CancelSubscriptionRequest, CreateCustomerRequest, Customer, AttachPaymentMethodRequest, PaymentMethod, CreateInvoiceRequest, Invoice, RefundRequest, Refund, WebhookRequest, WebhookEvent } from '../index.js';
export interface SquareConfig {
    accessToken: string;
    locationId: string;
    webhookSignatureKey: string;
    environment?: 'sandbox' | 'production';
}
export declare class SquareProvider implements PaymentProvider {
    readonly name: "square";
    private client;
    private locationId;
    private webhookSignatureKey;
    constructor(config: SquareConfig);
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
    private generateIdempotencyKey;
    private calculateTotal;
    private mapSubscription;
    private mapCustomer;
    private mapCard;
    private mapInvoice;
    private mapRefund;
    private handleSquareError;
}
/**
 * Create a configured Square provider instance.
 */
export declare function createSquareProvider(config: SquareConfig): SquareProvider;
//# sourceMappingURL=square.d.ts.map
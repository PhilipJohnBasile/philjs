/**
 * Stripe Payment Provider for PhilJS Payments
 *
 * Features:
 * - Full Stripe API integration
 * - Idempotency key support
 * - Webhook signature verification
 * - PCI-compliant checkout
 */
import Stripe from 'stripe';
import { PaymentProvider, CreateCheckoutRequest, CheckoutSession, CreateSubscriptionRequest, Subscription, CancelSubscriptionRequest, CreateCustomerRequest, Customer, AttachPaymentMethodRequest, PaymentMethod, CreateInvoiceRequest, Invoice, RefundRequest, Refund, WebhookRequest, WebhookEvent } from '../index';
export interface StripeConfig {
    secretKey: string;
    webhookSecret: string;
    apiVersion?: Stripe.LatestApiVersion;
}
export declare class StripeProvider implements PaymentProvider {
    readonly name: "stripe";
    private stripe;
    private webhookSecret;
    constructor(config: StripeConfig);
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
    private constructWebhookEvent;
    private mapCheckoutSession;
    private mapSubscription;
    private mapCustomer;
    private mapPaymentMethod;
    private mapInvoice;
    private mapRefund;
    private mapRefundReason;
    private handleStripeError;
}
/**
 * Create a configured Stripe provider instance.
 */
export declare function createStripeProvider(config: StripeConfig): StripeProvider;
//# sourceMappingURL=stripe.d.ts.map
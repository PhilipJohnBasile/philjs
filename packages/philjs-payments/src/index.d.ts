/**
 * PhilJS Payments - Unified payment processing with PCI compliance
 *
 * Supports: Stripe, PayPal, Square, Paddle
 * Features: Idempotency, webhook verification, subscription management
 */
export type Currency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud' | 'jpy' | string;
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';
export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
export interface Money {
    amount: number;
    currency: Currency;
}
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}
export interface Customer {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    address?: Address;
    metadata?: Record<string, string>;
    createdAt: Date;
}
export interface PaymentMethod {
    id: string;
    type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
    card?: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
    };
    isDefault: boolean;
    customerId: string;
}
export interface CheckoutSession {
    id: string;
    url: string;
    status: 'open' | 'complete' | 'expired';
    customerId?: string;
    lineItems: LineItem[];
    successUrl: string;
    cancelUrl: string;
    expiresAt: Date;
    metadata?: Record<string, string>;
}
export interface LineItem {
    name: string;
    description?: string;
    amount: Money;
    quantity: number;
    imageUrl?: string;
}
export interface Subscription {
    id: string;
    customerId: string;
    status: SubscriptionStatus;
    priceId: string;
    quantity: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
    trialEnd?: Date;
    metadata?: Record<string, string>;
}
export interface Invoice {
    id: string;
    customerId: string;
    subscriptionId?: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
    amount: Money;
    amountPaid: Money;
    amountDue: Money;
    lineItems: InvoiceLineItem[];
    dueDate?: Date;
    paidAt?: Date;
    invoicePdf?: string;
    hostedInvoiceUrl?: string;
    createdAt: Date;
}
export interface InvoiceLineItem {
    description: string;
    amount: Money;
    quantity: number;
    periodStart?: Date;
    periodEnd?: Date;
}
export interface Refund {
    id: string;
    paymentId: string;
    amount: Money;
    status: 'pending' | 'succeeded' | 'failed' | 'canceled';
    reason?: RefundReason;
    createdAt: Date;
}
export interface WebhookEvent {
    id: string;
    type: string;
    provider: 'stripe' | 'paypal' | 'square' | 'paddle';
    data: unknown;
    createdAt: Date;
}
export interface IdempotencyOptions {
    idempotencyKey?: string;
}
export interface CreateCheckoutRequest extends IdempotencyOptions {
    customerId?: string;
    customerEmail?: string;
    lineItems: LineItem[];
    successUrl: string;
    cancelUrl: string;
    mode?: 'payment' | 'subscription' | 'setup';
    metadata?: Record<string, string>;
    expiresIn?: number;
}
export interface CreateSubscriptionRequest extends IdempotencyOptions {
    customerId: string;
    priceId: string;
    quantity?: number;
    trialDays?: number;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
    cancelAtPeriodEnd?: boolean;
}
export interface CancelSubscriptionRequest extends IdempotencyOptions {
    subscriptionId: string;
    immediately?: boolean;
    reason?: string;
}
export interface CreateCustomerRequest extends IdempotencyOptions {
    email: string;
    name?: string;
    phone?: string;
    address?: Address;
    metadata?: Record<string, string>;
}
export interface AttachPaymentMethodRequest extends IdempotencyOptions {
    customerId: string;
    paymentMethodId: string;
    setAsDefault?: boolean;
}
export interface CreateInvoiceRequest extends IdempotencyOptions {
    customerId: string;
    lineItems: InvoiceLineItem[];
    dueDate?: Date;
    autoAdvance?: boolean;
    metadata?: Record<string, string>;
}
export interface RefundRequest extends IdempotencyOptions {
    paymentId: string;
    amount?: Money;
    reason?: RefundReason;
    metadata?: Record<string, string>;
}
export interface WebhookRequest {
    body: string | Buffer;
    signature: string;
    timestamp?: string;
}
export interface PaymentProvider {
    readonly name: 'stripe' | 'paypal' | 'square' | 'paddle';
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
}
/**
 * Generate a unique idempotency key for payment requests.
 * Use this to ensure operations are not duplicated on retries.
 */
export declare function generateIdempotencyKey(): string;
/**
 * Create an idempotency key from a deterministic set of values.
 * Useful for ensuring the same operation uses the same key.
 */
export declare function createDeterministicKey(...values: (string | number)[]): string;
export declare function registerProvider(provider: PaymentProvider): void;
export declare function getProvider(name: string): PaymentProvider;
export declare function listProviders(): string[];
export declare function setDefaultProvider(name: string): void;
/**
 * Create a checkout session for one-time or recurring payments.
 * PCI Compliant: Card details never touch your server.
 */
export declare function createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession>;
/**
 * Create a subscription for recurring billing.
 */
export declare function createSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
/**
 * Cancel a subscription immediately or at period end.
 */
export declare function cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription>;
/**
 * Create a customer record for payment processing.
 */
export declare function createCustomer(request: CreateCustomerRequest): Promise<Customer>;
/**
 * Attach a payment method to a customer.
 * PCI Compliant: Payment method tokens are created client-side.
 */
export declare function attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod>;
/**
 * Create an invoice for a customer.
 */
export declare function createInvoice(request: CreateInvoiceRequest): Promise<Invoice>;
/**
 * Process a refund for a payment.
 */
export declare function refund(request: RefundRequest): Promise<Refund>;
/**
 * Handle an incoming webhook from a payment provider.
 * Includes signature verification for security.
 */
export declare function handleWebhook(providerName: string, request: WebhookRequest): Promise<WebhookEvent>;
export declare class PaymentError extends Error {
    readonly code: string;
    readonly provider?: string | undefined;
    readonly requestId?: string | undefined;
    constructor(message: string, code: string, provider?: string | undefined, requestId?: string | undefined);
}
export declare class WebhookVerificationError extends PaymentError {
    constructor(message: string);
}
export declare class IdempotencyError extends PaymentError {
    readonly originalRequestId: string;
    constructor(message: string, originalRequestId: string);
}
export declare class SubscriptionError extends PaymentError {
    constructor(message: string, code: string);
}
/**
 * Mask a card number for safe logging/display.
 * Only shows last 4 digits.
 */
export declare function maskCardNumber(cardNumber: string): string;
/**
 * Validate that no raw card data is present in an object.
 * Use this before logging payment-related data.
 */
export declare function validateNoPCI(data: unknown): void;
/**
 * Sanitize an object for safe logging by removing sensitive fields.
 */
export declare function sanitizeForLogging<T extends Record<string, unknown>>(data: T): Partial<T>;
/**
 * Format money for display.
 */
export declare function formatMoney(money: Money): string;
/**
 * Convert amount to smallest currency unit (cents).
 */
export declare function toCents(amount: number): number;
/**
 * Convert from smallest currency unit to decimal.
 */
export declare function fromCents(cents: number): number;
/**
 * Add two money values (must be same currency).
 */
export declare function addMoney(a: Money, b: Money): Money;
export { StripeProvider, createStripeProvider } from './providers/stripe.js';
export { PayPalProvider, createPayPalProvider } from './providers/paypal.js';
export { SquareProvider, createSquareProvider } from './providers/square.js';
export { PaddleProvider, createPaddleProvider } from './providers/paddle.js';
export { usePayment, useSubscription, useInvoices } from './hooks.js';
export { PaymentForm, SubscriptionManager, PricingTable, InvoiceList, } from './components/index.js';
export { handleStripeWebhook, handlePayPalWebhook, verifyWebhookSignature, } from './webhooks/index.js';
//# sourceMappingURL=index.d.ts.map
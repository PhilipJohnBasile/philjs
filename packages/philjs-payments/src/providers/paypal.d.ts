/**
 * PayPal Payment Provider for PhilJS Payments
 *
 * Features:
 * - PayPal REST API v2 integration
 * - Orders API for checkout flows
 * - Subscription management
 * - Webhook verification with PayPal API
 * - Idempotency support
 * - Full refund capabilities
 *
 * API Documentation:
 * - Orders API: https://developer.paypal.com/docs/api/orders/v2/
 * - Payments API: https://developer.paypal.com/docs/api/payments/v2/
 * - Subscriptions API: https://developer.paypal.com/docs/api/subscriptions/v1/
 */
import type { PaymentProvider, CreateCheckoutRequest, CheckoutSession, CreateSubscriptionRequest, Subscription, CancelSubscriptionRequest, CreateCustomerRequest, Customer, AttachPaymentMethodRequest, PaymentMethod, CreateInvoiceRequest, Invoice, RefundRequest, Refund, WebhookRequest, WebhookEvent, Money } from '../index.js';
interface PayPalLink {
    href: string;
    rel: string;
    method?: string;
}
interface PayPalAmount {
    currency_code: string;
    value: string;
}
interface PayPalBreakdown {
    item_total?: PayPalAmount;
    shipping?: PayPalAmount;
    handling?: PayPalAmount;
    tax_total?: PayPalAmount;
    insurance?: PayPalAmount;
    shipping_discount?: PayPalAmount;
    discount?: PayPalAmount;
}
interface PayPalItem {
    name: string;
    description?: string;
    quantity: string;
    unit_amount: PayPalAmount;
    tax?: PayPalAmount;
    sku?: string;
    category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
}
interface PayPalPurchaseUnit {
    reference_id?: string;
    description?: string;
    custom_id?: string;
    invoice_id?: string;
    soft_descriptor?: string;
    amount: PayPalAmount & {
        breakdown?: PayPalBreakdown;
    };
    items?: PayPalItem[];
    shipping?: {
        name?: {
            full_name: string;
        };
        address?: {
            address_line_1?: string;
            address_line_2?: string;
            admin_area_2?: string;
            admin_area_1?: string;
            postal_code?: string;
            country_code: string;
        };
    };
    payments?: {
        captures?: PayPalCapture[];
        refunds?: PayPalRefundResponse[];
    };
}
interface PayPalCapture {
    id: string;
    status: string;
    amount: PayPalAmount;
    final_capture: boolean;
    create_time: string;
    update_time: string;
}
interface PayPalRefundResponse {
    id: string;
    status: string;
    amount: PayPalAmount;
    note_to_payer?: string;
    create_time: string;
    update_time: string;
    links: PayPalLink[];
}
interface PayPalPayer {
    name?: {
        given_name?: string;
        surname?: string;
    };
    email_address?: string;
    payer_id?: string;
    phone?: {
        phone_number?: {
            national_number: string;
        };
    };
    address?: {
        country_code: string;
    };
}
interface PayPalOrderResponse {
    id: string;
    status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
    intent: 'CAPTURE' | 'AUTHORIZE';
    purchase_units: PayPalPurchaseUnit[];
    payer?: PayPalPayer;
    create_time: string;
    update_time: string;
    links: PayPalLink[];
}
export interface PayPalConfig {
    /** PayPal REST API Client ID */
    clientId: string;
    /** PayPal REST API Client Secret */
    clientSecret: string;
    /** Webhook ID for signature verification */
    webhookId: string;
    /** Environment: sandbox for testing, production for live */
    environment?: 'sandbox' | 'production';
    /** Optional: Brand name to show in PayPal checkout */
    brandName?: string;
    /** Optional: Default currency code (defaults to USD) */
    defaultCurrency?: string;
}
export declare class PayPalProvider implements PaymentProvider {
    readonly name: "paypal";
    private readonly clientId;
    private readonly clientSecret;
    private readonly webhookId;
    private readonly baseUrl;
    private readonly brandName;
    private readonly defaultCurrency;
    private accessToken;
    private tokenExpiresAt;
    constructor(config: PayPalConfig);
    /**
     * Create a PayPal order for checkout.
     * Uses PayPal Orders API v2: POST /v2/checkout/orders
     */
    createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession>;
    /**
     * Retrieve order details.
     * Uses PayPal Orders API v2: GET /v2/checkout/orders/{id}
     */
    retrieveCheckout(sessionId: string): Promise<CheckoutSession>;
    /**
     * Create a PayPal order.
     * Direct access to Orders API v2: POST /v2/checkout/orders
     */
    createOrder(options: {
        amount: Money;
        description?: string;
        customId?: string;
        items?: Array<{
            name: string;
            quantity: number;
            unitAmount: Money;
            description?: string;
        }>;
        returnUrl: string;
        cancelUrl: string;
        idempotencyKey?: string;
    }): Promise<PayPalOrderResponse>;
    /**
     * Capture payment for an approved order.
     * Uses PayPal Orders API v2: POST /v2/checkout/orders/{id}/capture
     *
     * Call this after the buyer approves the order through PayPal checkout.
     */
    captureOrder(orderId: string, idempotencyKey?: string): Promise<PayPalOrderResponse>;
    /**
     * Get order details including payment status.
     * Uses PayPal Orders API v2: GET /v2/checkout/orders/{id}
     */
    getOrderDetails(orderId: string): Promise<PayPalOrderResponse>;
    /**
     * Issue a refund for a captured payment.
     * Uses PayPal Payments API v2: POST /v2/payments/captures/{capture_id}/refund
     *
     * @param captureId - The capture ID (not order ID). Get this from the order's payment details.
     * @param options - Refund options including amount for partial refunds
     */
    refundPayment(captureId: string, options?: {
        amount?: Money;
        invoiceId?: string;
        noteToPayer?: string;
        idempotencyKey?: string;
    }): Promise<PayPalRefundResponse>;
    /**
     * Get the capture ID from an order for refund processing.
     * Helper method to extract capture ID from a completed order.
     */
    getCaptureIdFromOrder(orderId: string): Promise<string | null>;
    /**
     * Create a subscription.
     * Uses PayPal Subscriptions API v1: POST /v1/billing/subscriptions
     */
    createSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
    /**
     * Retrieve subscription details.
     * Uses PayPal Subscriptions API v1: GET /v1/billing/subscriptions/{id}
     */
    retrieveSubscription(subscriptionId: string): Promise<Subscription>;
    /**
     * Update a subscription.
     * Uses PayPal Subscriptions API v1: PATCH /v1/billing/subscriptions/{id}
     */
    updateSubscription(subscriptionId: string, updates: Partial<CreateSubscriptionRequest>): Promise<Subscription>;
    /**
     * Cancel a subscription.
     * Uses PayPal Subscriptions API v1: POST /v1/billing/subscriptions/{id}/cancel
     */
    cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription>;
    /**
     * List subscriptions.
     * Note: PayPal's API doesn't support filtering by customer ID directly.
     * This implementation returns all subscriptions.
     */
    listSubscriptions(_customerId: string): Promise<Subscription[]>;
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
    listInvoices(_customerId: string): Promise<Invoice[]>;
    /**
     * Issue a refund for a captured payment.
     * Uses PayPal Payments API v2: POST /v2/payments/captures/{capture_id}/refund
     *
     * Note: The paymentId should be the capture ID, not the order ID.
     * Use getCaptureIdFromOrder() to get the capture ID from an order.
     */
    refund(request: RefundRequest): Promise<Refund>;
    /**
     * Retrieve refund details.
     * Uses PayPal Payments API v2: GET /v2/payments/refunds/{refund_id}
     */
    retrieveRefund(refundId: string): Promise<Refund>;
    /**
     * Handle incoming webhook from PayPal.
     * Verifies signature using PayPal's Webhooks API.
     */
    handleWebhook(request: WebhookRequest): Promise<WebhookEvent>;
    /**
     * Synchronous signature check (basic validation only).
     * For full verification, use verifyWebhookSignatureAsync().
     */
    verifyWebhookSignature(request: WebhookRequest): boolean;
    /**
     * Verify webhook signature using PayPal's verification API.
     * Uses PayPal Webhooks API v1: POST /v1/notifications/verify-webhook-signature
     *
     * This is the recommended way to verify webhooks in production.
     */
    verifyWebhookSignatureAsync(request: WebhookRequest): Promise<boolean>;
    /**
     * Get OAuth2 access token for API requests.
     * Caches token until near expiration.
     */
    private getAccessToken;
    /**
     * Make an authenticated request to the PayPal REST API.
     */
    private makeRequest;
    /**
     * Format amount from cents to PayPal decimal string format.
     */
    private formatAmount;
    /**
     * Calculate total from line items.
     */
    private calculateTotal;
    /**
     * Extract line items from PayPal order response.
     */
    private extractLineItems;
    /**
     * Map PayPal order status to checkout session status.
     */
    private mapOrderStatus;
    /**
     * Map PayPal subscription to internal Subscription type.
     */
    private mapSubscription;
    /**
     * Map PayPal invoice response to internal Invoice type.
     */
    private mapInvoice;
    /**
     * Map PayPal refund status to internal status.
     */
    private mapRefundStatus;
    /**
     * Handle PayPal API errors and convert to PaymentError.
     */
    private handlePayPalError;
}
/**
 * Create a configured PayPal provider instance.
 */
export declare function createPayPalProvider(config: PayPalConfig): PayPalProvider;
export type { PayPalOrderResponse, PayPalRefundResponse, PayPalCapture, PayPalPurchaseUnit, PayPalItem, PayPalAmount, PayPalLink, PayPalPayer, };
//# sourceMappingURL=paypal.d.ts.map
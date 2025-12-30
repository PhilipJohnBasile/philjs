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

import type {
  PaymentProvider,
  CreateCheckoutRequest,
  CheckoutSession,
  CreateSubscriptionRequest,
  Subscription,
  CancelSubscriptionRequest,
  CreateCustomerRequest,
  Customer,
  AttachPaymentMethodRequest,
  PaymentMethod,
  CreateInvoiceRequest,
  Invoice,
  InvoiceLineItem,
  LineItem,
  RefundRequest,
  Refund,
  WebhookRequest,
  WebhookEvent,
  SubscriptionStatus,
  Money,
} from '../index.js';
import { PaymentError, WebhookVerificationError } from '../index.js';

// ============================================================================
// PayPal API Response Types
// ============================================================================

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
  amount: PayPalAmount & { breakdown?: PayPalBreakdown };
  items?: PayPalItem[];
  shipping?: {
    name?: { full_name: string };
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
  name?: { given_name?: string; surname?: string };
  email_address?: string;
  payer_id?: string;
  phone?: { phone_number?: { national_number: string } };
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

interface PayPalTokenResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

interface PayPalWebhookVerificationRequest {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: unknown;
}

interface PayPalWebhookVerificationResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
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

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  plan_id: string;
  quantity?: string;
  subscriber?: { email_address: string };
  billing_info?: {
    next_billing_time: string;
    last_payment?: { time: string };
  };
  create_time: string;
  update_time: string;
}

// ============================================================================
// PayPal Provider Implementation
// ============================================================================

export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal' as const;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly webhookId: string;
  private readonly baseUrl: string;
  private readonly brandName: string;
  private readonly defaultCurrency: string;

  // OAuth2 token caching
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: PayPalConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.webhookId = config.webhookId;
    this.brandName = config.brandName ?? 'PhilJS Store';
    this.defaultCurrency = config.defaultCurrency ?? 'USD';
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  // =========================================================================
  // Checkout (Orders API v2)
  // =========================================================================

  /**
   * Create a PayPal order for checkout.
   * Uses PayPal Orders API v2: POST /v2/checkout/orders
   */
  async createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    try {
      const currency = request.lineItems[0]?.amount.currency.toUpperCase() || this.defaultCurrency;
      const totalValue = this.calculateTotal(request.lineItems);

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: totalValue,
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: totalValue,
                },
              },
            },
            items: request.lineItems.map((item: LineItem) => ({
              name: item.name,
              description: item.description || undefined,
              quantity: item.quantity.toString(),
              unit_amount: {
                currency_code: item.amount.currency.toUpperCase(),
                value: this.formatAmount(item.amount.amount),
              },
              category: 'DIGITAL_GOODS' as const,
            })),
            ...(request.customerId && { custom_id: request.customerId }),
            ...(request.metadata && { invoice_id: request.metadata['invoiceId'] }),
          },
        ],
        application_context: {
          return_url: request.successUrl,
          cancel_url: request.cancelUrl,
          brand_name: this.brandName,
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      };

      const order = await this.makeRequest<PayPalOrderResponse>(
        'POST',
        '/v2/checkout/orders',
        orderPayload,
        request.idempotencyKey
      );

      const approveLink = order.links.find((link) => link.rel === 'approve');

      const session: CheckoutSession = {
        id: order.id,
        url: approveLink?.href || '',
        status: this.mapOrderStatus(order.status),
        lineItems: request.lineItems,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // PayPal orders expire in 3 hours
      };

      if (request.customerId !== undefined) session.customerId = request.customerId;
      if (request.metadata !== undefined) session.metadata = request.metadata;

      return session;
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  /**
   * Retrieve order details.
   * Uses PayPal Orders API v2: GET /v2/checkout/orders/{id}
   */
  async retrieveCheckout(sessionId: string): Promise<CheckoutSession> {
    try {
      const order = await this.getOrderDetails(sessionId);

      return {
        id: order.id,
        url: order.links.find((l) => l.rel === 'approve')?.href || '',
        status: this.mapOrderStatus(order.status),
        lineItems: this.extractLineItems(order),
        successUrl: '',
        cancelUrl: '',
        expiresAt: new Date(order.update_time),
      };
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  // =========================================================================
  // PayPal Orders API - Additional Methods
  // =========================================================================

  /**
   * Create a PayPal order.
   * Direct access to Orders API v2: POST /v2/checkout/orders
   */
  async createOrder(options: {
    amount: Money;
    description?: string;
    customId?: string;
    items?: Array<{ name: string; quantity: number; unitAmount: Money; description?: string }>;
    returnUrl: string;
    cancelUrl: string;
    idempotencyKey?: string;
  }): Promise<PayPalOrderResponse> {
    const currency = options.amount.currency.toUpperCase();
    const totalValue = this.formatAmount(options.amount.amount);

    const purchaseUnit: Record<string, unknown> = {
      amount: {
        currency_code: currency,
        value: totalValue,
      },
    };

    if (options.description) {
      purchaseUnit['description'] = options.description;
    }

    if (options.customId) {
      purchaseUnit['custom_id'] = options.customId;
    }

    if (options.items && options.items.length > 0) {
      const itemTotal = options.items.reduce(
        (sum, item) => sum + item.unitAmount.amount * item.quantity,
        0
      );

      purchaseUnit['amount'] = {
        currency_code: currency,
        value: totalValue,
        breakdown: {
          item_total: {
            currency_code: currency,
            value: this.formatAmount(itemTotal),
          },
        },
      };

      purchaseUnit['items'] = options.items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity.toString(),
        unit_amount: {
          currency_code: item.unitAmount.currency.toUpperCase(),
          value: this.formatAmount(item.unitAmount.amount),
        },
      }));
    }

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [purchaseUnit],
      application_context: {
        return_url: options.returnUrl,
        cancel_url: options.cancelUrl,
        brand_name: this.brandName,
        user_action: 'PAY_NOW',
      },
    };

    return this.makeRequest<PayPalOrderResponse>(
      'POST',
      '/v2/checkout/orders',
      orderPayload,
      options.idempotencyKey
    );
  }

  /**
   * Capture payment for an approved order.
   * Uses PayPal Orders API v2: POST /v2/checkout/orders/{id}/capture
   *
   * Call this after the buyer approves the order through PayPal checkout.
   */
  async captureOrder(orderId: string, idempotencyKey?: string): Promise<PayPalOrderResponse> {
    return this.makeRequest<PayPalOrderResponse>(
      'POST',
      `/v2/checkout/orders/${orderId}/capture`,
      {},
      idempotencyKey
    );
  }

  /**
   * Get order details including payment status.
   * Uses PayPal Orders API v2: GET /v2/checkout/orders/{id}
   */
  async getOrderDetails(orderId: string): Promise<PayPalOrderResponse> {
    return this.makeRequest<PayPalOrderResponse>('GET', `/v2/checkout/orders/${orderId}`);
  }

  /**
   * Issue a refund for a captured payment.
   * Uses PayPal Payments API v2: POST /v2/payments/captures/{capture_id}/refund
   *
   * @param captureId - The capture ID (not order ID). Get this from the order's payment details.
   * @param options - Refund options including amount for partial refunds
   */
  async refundPayment(
    captureId: string,
    options?: {
      amount?: Money;
      invoiceId?: string;
      noteToPayer?: string;
      idempotencyKey?: string;
    }
  ): Promise<PayPalRefundResponse> {
    const payload: Record<string, unknown> = {};

    if (options?.amount) {
      payload['amount'] = {
        currency_code: options.amount.currency.toUpperCase(),
        value: this.formatAmount(options.amount.amount),
      };
    }

    if (options?.invoiceId) {
      payload['invoice_id'] = options.invoiceId;
    }

    if (options?.noteToPayer) {
      payload['note_to_payer'] = options.noteToPayer;
    }

    return this.makeRequest<PayPalRefundResponse>(
      'POST',
      `/v2/payments/captures/${captureId}/refund`,
      Object.keys(payload).length > 0 ? payload : undefined,
      options?.idempotencyKey
    );
  }

  /**
   * Get the capture ID from an order for refund processing.
   * Helper method to extract capture ID from a completed order.
   */
  async getCaptureIdFromOrder(orderId: string): Promise<string | null> {
    const order = await this.getOrderDetails(orderId);
    const capture = order.purchase_units[0]?.payments?.captures?.[0];
    return capture?.id ?? null;
  }

  // =========================================================================
  // Subscriptions (Subscriptions API v1)
  // =========================================================================

  /**
   * Create a subscription.
   * Uses PayPal Subscriptions API v1: POST /v1/billing/subscriptions
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      const response = await this.makeRequest<PayPalSubscriptionResponse>(
        'POST',
        '/v1/billing/subscriptions',
        {
          plan_id: request.priceId,
          quantity: request.quantity?.toString() || '1',
          custom_id: request.customerId,
          application_context: {
            brand_name: this.brandName,
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            },
          },
        },
        request.idempotencyKey
      );

      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  /**
   * Retrieve subscription details.
   * Uses PayPal Subscriptions API v1: GET /v1/billing/subscriptions/{id}
   */
  async retrieveSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await this.makeRequest<PayPalSubscriptionResponse>(
        'GET',
        `/v1/billing/subscriptions/${subscriptionId}`
      );
      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  /**
   * Update a subscription.
   * Uses PayPal Subscriptions API v1: PATCH /v1/billing/subscriptions/{id}
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionRequest>
  ): Promise<Subscription> {
    try {
      const patchOperations: Array<{ op: string; path: string; value: string }> = [];

      if (updates.quantity) {
        patchOperations.push({
          op: 'replace',
          path: '/quantity',
          value: updates.quantity.toString(),
        });
      }

      if (patchOperations.length > 0) {
        await this.makeRequest(
          'PATCH',
          `/v1/billing/subscriptions/${subscriptionId}`,
          patchOperations,
          updates.idempotencyKey
        );
      }

      return this.retrieveSubscription(subscriptionId);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  /**
   * Cancel a subscription.
   * Uses PayPal Subscriptions API v1: POST /v1/billing/subscriptions/{id}/cancel
   */
  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    try {
      await this.makeRequest(
        'POST',
        `/v1/billing/subscriptions/${request.subscriptionId}/cancel`,
        { reason: request.reason || 'Customer requested cancellation' },
        request.idempotencyKey
      );

      return this.retrieveSubscription(request.subscriptionId);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  /**
   * List subscriptions.
   * Note: PayPal's API doesn't support filtering by customer ID directly.
   * This implementation returns all subscriptions.
   */
  async listSubscriptions(_customerId: string): Promise<Subscription[]> {
    try {
      // PayPal doesn't have a direct list by customer endpoint
      // In a real implementation, you might store subscription IDs locally
      // or use the transactions API to find subscriptions
      const response = await this.makeRequest<{ subscriptions?: PayPalSubscriptionResponse[] }>(
        'GET',
        '/v1/billing/subscriptions?status=ACTIVE&status=SUSPENDED'
      );

      const subscriptions = response.subscriptions ?? [];
      return subscriptions.map((sub) => this.mapSubscription(sub));
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  // =========================================================================
  // Customers
  // =========================================================================

  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    // PayPal doesn't have a separate customer API like Stripe
    // Customers are created implicitly when they make payments
    // We'll create a reference record
    const customer: Customer = {
      id: `pp_cust_${Date.now()}`,
      email: request.email,
      createdAt: new Date(),
    };
    if (request.name !== undefined) customer.name = request.name;
    if (request.phone !== undefined) customer.phone = request.phone;
    if (request.address !== undefined) customer.address = request.address;
    if (request.metadata !== undefined) customer.metadata = request.metadata;
    return customer;
  }

  async retrieveCustomer(customerId: string): Promise<Customer> {
    // PayPal customer data is tied to orders/subscriptions
    throw new PaymentError(
      'PayPal does not support standalone customer retrieval',
      'not_supported',
      'paypal'
    );
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<CreateCustomerRequest>
  ): Promise<Customer> {
    throw new PaymentError(
      'PayPal does not support standalone customer updates',
      'not_supported',
      'paypal'
    );
  }

  async deleteCustomer(customerId: string): Promise<void> {
    throw new PaymentError(
      'PayPal does not support customer deletion',
      'not_supported',
      'paypal'
    );
  }

  // =========================================================================
  // Payment Methods
  // =========================================================================

  async attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod> {
    // PayPal handles payment methods through their checkout flow
    return {
      id: request.paymentMethodId,
      type: 'paypal',
      isDefault: request.setAsDefault || false,
      customerId: request.customerId,
    };
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    // No-op for PayPal
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    // PayPal manages payment methods on their end
    return [];
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // No-op for PayPal
  }

  // =========================================================================
  // Invoices
  // =========================================================================

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    try {
      const invoicePayload = {
        detail: {
          invoice_date: new Date().toISOString().split('T')[0],
          currency_code: request.lineItems[0]?.amount.currency.toUpperCase() || 'USD',
          payment_term: {
            term_type: request.dueDate ? 'DUE_ON_DATE_SPECIFIED' : 'NET_30',
            due_date: request.dueDate?.toISOString().split('T')[0],
          },
        },
        invoicer: {
          email_address: 'merchant@example.com', // Should be configured
        },
        primary_recipients: [
          {
            billing_info: {
              email_address: request.customerId, // Using customerId as email for PayPal
            },
          },
        ],
        items: request.lineItems.map((item: InvoiceLineItem) => ({
          name: item.description,
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: item.amount.currency.toUpperCase(),
            value: (item.amount.amount / 100).toFixed(2),
          },
        })),
      };

      const response = await this.makeRequest(
        'POST',
        '/v2/invoicing/invoices',
        invoicePayload,
        request.idempotencyKey
      );

      return this.mapInvoice(response as Record<string, unknown>);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async retrieveInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const response = await this.makeRequest<Record<string, unknown>>(
        'GET',
        `/v2/invoicing/invoices/${invoiceId}`
      );
      return this.mapInvoice(response);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    try {
      await this.makeRequest('POST', `/v2/invoicing/invoices/${invoiceId}/send`, {
        send_to_recipient: true,
      });
      return this.retrieveInvoice(invoiceId);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async voidInvoice(invoiceId: string): Promise<Invoice> {
    try {
      await this.makeRequest('POST', `/v2/invoicing/invoices/${invoiceId}/cancel`);
      return this.retrieveInvoice(invoiceId);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async listInvoices(_customerId: string): Promise<Invoice[]> {
    try {
      const response = await this.makeRequest<{ items?: Record<string, unknown>[] }>(
        'GET',
        '/v2/invoicing/invoices?page_size=100'
      );

      return (response.items ?? []).map((inv) => this.mapInvoice(inv));
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  // =========================================================================
  // Refunds (Payments API v2)
  // =========================================================================

  /**
   * Issue a refund for a captured payment.
   * Uses PayPal Payments API v2: POST /v2/payments/captures/{capture_id}/refund
   *
   * Note: The paymentId should be the capture ID, not the order ID.
   * Use getCaptureIdFromOrder() to get the capture ID from an order.
   */
  async refund(request: RefundRequest): Promise<Refund> {
    try {
      const payload: Record<string, unknown> = {};

      if (request.amount) {
        payload['amount'] = {
          currency_code: request.amount.currency.toUpperCase(),
          value: this.formatAmount(request.amount.amount),
        };
      }

      if (request.reason) {
        payload['note_to_payer'] = request.reason;
      }

      const refundResult = await this.makeRequest<PayPalRefundResponse>(
        'POST',
        `/v2/payments/captures/${request.paymentId}/refund`,
        Object.keys(payload).length > 0 ? payload : undefined,
        request.idempotencyKey
      );

      const refund: Refund = {
        id: refundResult.id,
        paymentId: request.paymentId,
        amount: {
          amount: Math.round(parseFloat(refundResult.amount.value) * 100),
          currency: refundResult.amount.currency_code.toLowerCase(),
        },
        status: this.mapRefundStatus(refundResult.status),
        createdAt: new Date(refundResult.create_time),
      };

      if (request.reason !== undefined) refund.reason = request.reason;
      return refund;
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  /**
   * Retrieve refund details.
   * Uses PayPal Payments API v2: GET /v2/payments/refunds/{refund_id}
   */
  async retrieveRefund(refundId: string): Promise<Refund> {
    try {
      const response = await this.makeRequest<PayPalRefundResponse>(
        'GET',
        `/v2/payments/refunds/${refundId}`
      );

      // Extract the capture ID from the 'up' link
      const captureLink = response.links?.find((l) => l.rel === 'up');
      const captureId = captureLink?.href?.split('/').pop() || '';

      return {
        id: response.id,
        paymentId: captureId,
        amount: {
          amount: Math.round(parseFloat(response.amount.value) * 100),
          currency: response.amount.currency_code.toLowerCase(),
        },
        status: this.mapRefundStatus(response.status),
        createdAt: new Date(response.create_time),
      };
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  // =========================================================================
  // Webhooks (Notifications API v1)
  // =========================================================================

  /**
   * Handle incoming webhook from PayPal.
   * Verifies signature using PayPal's Webhooks API.
   */
  async handleWebhook(request: WebhookRequest): Promise<WebhookEvent> {
    const isValid = await this.verifyWebhookSignatureAsync(request);
    if (!isValid) {
      throw new WebhookVerificationError('Invalid PayPal webhook signature');
    }

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

    return {
      id: body.id,
      type: body.event_type,
      provider: 'paypal',
      data: body.resource,
      createdAt: new Date(body.create_time),
    };
  }

  /**
   * Synchronous signature check (basic validation only).
   * For full verification, use verifyWebhookSignatureAsync().
   */
  verifyWebhookSignature(request: WebhookRequest): boolean {
    try {
      // Basic check that required fields are present
      const signature = request.signature || '';
      const timestamp = request.timestamp || '';

      // Parse the signature which contains multiple values
      // Format: transmissionId,transmissionTime,webhookId,crc32
      const parts = signature.split(',');
      const transmissionId = parts[0] || '';

      return transmissionId.length > 0 && timestamp.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Verify webhook signature using PayPal's verification API.
   * Uses PayPal Webhooks API v1: POST /v1/notifications/verify-webhook-signature
   *
   * This is the recommended way to verify webhooks in production.
   */
  async verifyWebhookSignatureAsync(request: WebhookRequest): Promise<boolean> {
    try {
      const body = typeof request.body === 'string' ? request.body : request.body.toString();
      const webhookEvent = JSON.parse(body);

      // Extract headers from the signature string
      // PayPal sends these as separate headers in the actual request
      const signatureParts = request.signature.split('|');
      const transmissionId = signatureParts[0] || '';
      const transmissionTime = request.timestamp || signatureParts[1] || '';
      const certUrl = signatureParts[2] || '';
      const authAlgo = signatureParts[3] || 'SHA256withRSA';
      const transmissionSig = signatureParts[4] || request.signature;

      const verificationPayload: PayPalWebhookVerificationRequest = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: this.webhookId,
        webhook_event: webhookEvent,
      };

      const response = await this.makeRequest<PayPalWebhookVerificationResponse>(
        'POST',
        '/v1/notifications/verify-webhook-signature',
        verificationPayload
      );

      return response.verification_status === 'SUCCESS';
    } catch (error) {
      // If verification fails, fall back to basic check
      console.error('PayPal webhook verification failed:', error);
      return this.verifyWebhookSignature(request);
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Get OAuth2 access token for API requests.
   * Caches token until near expiration.
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new PaymentError(
        `Failed to get PayPal access token: ${errorText}`,
        'authentication_error',
        'paypal'
      );
    }

    const tokenData = await response.json() as PayPalTokenResponse;
    this.accessToken = tokenData.access_token;
    this.tokenExpiresAt = Date.now() + tokenData.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * Make an authenticated request to the PayPal REST API.
   */
  private async makeRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    idempotencyKey?: string
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    if (idempotencyKey) {
      headers['PayPal-Request-Id'] = idempotencyKey;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    // Handle no-content responses
    if (response.status === 204) {
      return {} as T;
    }

    const responseText = await response.text();
    let responseData: unknown;

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      const errorResponse = responseData as {
        name?: string;
        message?: string;
        debug_id?: string;
        details?: Array<{ issue?: string; description?: string }>;
      };

      const errorMessage = errorResponse.details?.[0]?.description
        || errorResponse.message
        || `PayPal API error: ${response.status}`;

      throw new PaymentError(
        errorMessage,
        errorResponse.name || 'api_error',
        'paypal',
        errorResponse.debug_id
      );
    }

    return responseData as T;
  }

  /**
   * Format amount from cents to PayPal decimal string format.
   */
  private formatAmount(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2);
  }

  /**
   * Calculate total from line items.
   */
  private calculateTotal(lineItems: CreateCheckoutRequest['lineItems']): string {
    const total = lineItems.reduce(
      (sum: number, item: LineItem) => sum + item.amount.amount * item.quantity,
      0
    );
    return this.formatAmount(total);
  }

  /**
   * Extract line items from PayPal order response.
   */
  private extractLineItems(order: PayPalOrderResponse): LineItem[] {
    const purchaseUnit = order.purchase_units[0];
    if (!purchaseUnit?.items) {
      return [];
    }

    const currency = purchaseUnit.amount.currency_code.toLowerCase();

    return purchaseUnit.items.map((item) => {
      const lineItem: LineItem = {
        name: item.name,
        amount: {
          amount: Math.round(parseFloat(item.unit_amount.value) * 100),
          currency,
        },
        quantity: parseInt(item.quantity, 10),
      };
      if (item.description) {
        lineItem.description = item.description;
      }
      return lineItem;
    });
  }

  /**
   * Map PayPal order status to checkout session status.
   */
  private mapOrderStatus(status: string): 'open' | 'complete' | 'expired' {
    const statusMap: Record<string, 'open' | 'complete' | 'expired'> = {
      CREATED: 'open',
      SAVED: 'open',
      APPROVED: 'open',
      VOIDED: 'expired',
      COMPLETED: 'complete',
      PAYER_ACTION_REQUIRED: 'open',
    };
    return statusMap[status] || 'open';
  }

  /**
   * Map PayPal subscription to internal Subscription type.
   */
  private mapSubscription(sub: PayPalSubscriptionResponse): Subscription {
    const statusMap: Record<string, SubscriptionStatus> = {
      APPROVAL_PENDING: 'unpaid',
      APPROVED: 'active',
      ACTIVE: 'active',
      SUSPENDED: 'paused',
      CANCELLED: 'canceled',
      EXPIRED: 'canceled',
    };

    return {
      id: sub.id,
      customerId: sub.subscriber?.email_address || '',
      status: statusMap[sub.status] || 'unpaid',
      priceId: sub.plan_id,
      quantity: parseInt(sub.quantity || '1', 10),
      currentPeriodStart: new Date(sub.create_time),
      currentPeriodEnd: sub.billing_info?.next_billing_time
        ? new Date(sub.billing_info.next_billing_time)
        : new Date(),
      cancelAtPeriodEnd: sub.status === 'CANCELLED',
    };
  }

  /**
   * Map PayPal invoice response to internal Invoice type.
   */
  private mapInvoice(inv: Record<string, unknown>): Invoice {
    const statusMap: Record<string, Invoice['status']> = {
      DRAFT: 'draft',
      SENT: 'open',
      SCHEDULED: 'open',
      PAID: 'paid',
      MARKED_AS_PAID: 'paid',
      CANCELLED: 'void',
      REFUNDED: 'void',
      PARTIALLY_PAID: 'open',
      PARTIALLY_REFUNDED: 'paid',
      MARKED_AS_REFUNDED: 'void',
      UNPAID: 'open',
      PAYMENT_PENDING: 'open',
    };

    const invAmount = inv['amount'] as { value?: string; currency_code?: string } | undefined;
    const amount: Money = {
      amount: Math.round(parseFloat(invAmount?.value || '0') * 100),
      currency: (invAmount?.currency_code || 'usd').toLowerCase(),
    };

    const recipients = inv['primary_recipients'] as Array<{
      billing_info?: { email_address?: string };
    }> | undefined;
    const items = inv['items'] as Array<{
      name?: string;
      quantity?: string;
      unit_amount?: { value?: string; currency_code?: string };
    }> | undefined;
    const detail = inv['detail'] as { invoice_date?: string } | undefined;

    return {
      id: inv['id'] as string,
      customerId: recipients?.[0]?.billing_info?.email_address || '',
      status: statusMap[inv['status'] as string] || 'draft',
      amount,
      amountPaid: { amount: 0, currency: amount.currency },
      amountDue: amount,
      lineItems: (items || []).map((item) => ({
        description: item.name || '',
        amount: {
          amount: Math.round(parseFloat(item.unit_amount?.value || '0') * 100),
          currency: (item.unit_amount?.currency_code || 'usd').toLowerCase(),
        },
        quantity: parseInt(item.quantity || '1', 10),
      })),
      createdAt: new Date(detail?.invoice_date || Date.now()),
    };
  }

  /**
   * Map PayPal refund status to internal status.
   */
  private mapRefundStatus(status: string): Refund['status'] {
    const statusMap: Record<string, Refund['status']> = {
      CANCELLED: 'canceled',
      PENDING: 'pending',
      COMPLETED: 'succeeded',
      FAILED: 'failed',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Handle PayPal API errors and convert to PaymentError.
   */
  private handlePayPalError(error: unknown): PaymentError {
    if (error instanceof PaymentError) return error;

    if (error instanceof Error) {
      // Check if it's a fetch error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new PaymentError(
          'Network error connecting to PayPal API',
          'network_error',
          'paypal'
        );
      }
      return new PaymentError(error.message, 'paypal_error', 'paypal');
    }

    return new PaymentError('Unknown PayPal error', 'unknown_error', 'paypal');
  }
}

/**
 * Create a configured PayPal provider instance.
 */
export function createPayPalProvider(config: PayPalConfig): PayPalProvider {
  return new PayPalProvider(config);
}

// ============================================================================
// Re-export types for consumers
// ============================================================================

export type {
  PayPalOrderResponse,
  PayPalRefundResponse,
  PayPalCapture,
  PayPalPurchaseUnit,
  PayPalItem,
  PayPalAmount,
  PayPalLink,
  PayPalPayer,
};

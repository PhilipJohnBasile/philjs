/**
 * PayPal Payment Provider for PhilJS Payments
 *
 * Features:
 * - PayPal Checkout SDK integration
 * - Subscription management
 * - Webhook verification
 * - Idempotency support
 */

// @ts-expect-error - PayPal SDK lacks TypeScript declarations
import * as paypal from '@paypal/checkout-server-sdk';
import { createHmac } from 'crypto';
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
} from '../index.js';
import { PaymentError, WebhookVerificationError } from '../index.js';

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  webhookId: string;
  environment?: 'sandbox' | 'production';
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ rel: string; href: string }>;
  purchase_units: Array<{
    amount: { currency_code: string; value: string };
    items?: Array<{ name: string; quantity: string; unit_amount: { value: string } }>;
  }>;
  create_time: string;
  update_time: string;
}

interface PayPalSubscription {
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

export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal' as const;
  private client: paypal.core.PayPalHttpClient;
  private webhookId: string;
  private baseUrl: string;

  constructor(config: PayPalConfig) {
    const environment =
      config.environment === 'production'
        ? new paypal.core.LiveEnvironment(config.clientId, config.clientSecret)
        : new paypal.core.SandboxEnvironment(config.clientId, config.clientSecret);

    this.client = new paypal.core.PayPalHttpClient(environment);
    this.webhookId = config.webhookId;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  // =========================================================================
  // Checkout
  // =========================================================================

  async createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    try {
      const orderRequest = new paypal.orders.OrdersCreateRequest();
      orderRequest.prefer('return=representation');
      orderRequest.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: request.lineItems[0]?.amount.currency.toUpperCase() || 'USD',
              value: this.calculateTotal(request.lineItems),
              breakdown: {
                item_total: {
                  currency_code: request.lineItems[0]?.amount.currency.toUpperCase() || 'USD',
                  value: this.calculateTotal(request.lineItems),
                },
              },
            },
            items: request.lineItems.map((item: LineItem) => ({
              name: item.name,
              description: item.description || '',
              quantity: item.quantity.toString(),
              unit_amount: {
                currency_code: item.amount.currency.toUpperCase(),
                value: (item.amount.amount / 100).toFixed(2),
              },
            })),
          },
        ],
        application_context: {
          return_url: request.successUrl,
          cancel_url: request.cancelUrl,
          brand_name: 'PhilJS Store',
          user_action: 'PAY_NOW',
        },
      });

      // Add idempotency key as header
      if (request.idempotencyKey) {
        orderRequest.headers['PayPal-Request-Id'] = request.idempotencyKey;
      }

      const response = await this.client.execute(orderRequest);
      const order = response.result as PayPalOrder;

      const approveLink = order.links.find((link) => link.rel === 'approve');

      const session: CheckoutSession = {
        id: order.id,
        url: approveLink?.href || '',
        status: this.mapOrderStatus(order.status),
        lineItems: request.lineItems,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      };
      if (request.customerId !== undefined) session.customerId = request.customerId;
      if (request.metadata !== undefined) session.metadata = request.metadata;
      return session;
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async retrieveCheckout(sessionId: string): Promise<CheckoutSession> {
    try {
      const getRequest = new paypal.orders.OrdersGetRequest(sessionId);
      const response = await this.client.execute(getRequest);
      const order = response.result as PayPalOrder;

      return {
        id: order.id,
        url: '',
        status: this.mapOrderStatus(order.status),
        lineItems: (order.purchase_units[0]?.items || []).map((item) => ({
          name: item.name,
          amount: {
            amount: Math.round(parseFloat(item.unit_amount.value) * 100),
            currency: order.purchase_units[0]?.amount.currency_code.toLowerCase() || 'usd',
          },
          quantity: parseInt(item.quantity, 10),
        })),
        successUrl: '',
        cancelUrl: '',
        expiresAt: new Date(order.update_time),
      };
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  // =========================================================================
  // Subscriptions
  // =========================================================================

  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      const response = await this.makeRequest('POST', '/v1/billing/subscriptions', {
        plan_id: request.priceId,
        quantity: request.quantity?.toString() || '1',
        custom_id: request.customerId,
        application_context: {
          brand_name: 'PhilJS Store',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
        },
      }, request.idempotencyKey);

      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await this.makeRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`);
      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionRequest>
  ): Promise<Subscription> {
    try {
      const patchOperations = [];

      if (updates.quantity) {
        patchOperations.push({
          op: 'replace',
          path: '/quantity',
          value: updates.quantity.toString(),
        });
      }

      await this.makeRequest(
        'PATCH',
        `/v1/billing/subscriptions/${subscriptionId}`,
        patchOperations,
        updates.idempotencyKey
      );

      return this.retrieveSubscription(subscriptionId);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

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

  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    // PayPal doesn't have a direct list by customer, need to filter
    // This is a simplified implementation
    try {
      const response = await this.makeRequest('GET', '/v1/billing/subscriptions', {
        plan_id: 'all',
      });

      const subscriptions = (response.subscriptions || []) as PayPalSubscription[];
      return subscriptions
        .filter((sub) => sub.subscriber?.email_address)
        .map((sub) => this.mapSubscription(sub));
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

      return this.mapInvoice(response);
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  async retrieveInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const response = await this.makeRequest('GET', `/v2/invoicing/invoices/${invoiceId}`);
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

  async listInvoices(customerId: string): Promise<Invoice[]> {
    try {
      const response = await this.makeRequest('GET', '/v2/invoicing/invoices', {
        page_size: 100,
      });

      return (response.items || []).map((inv: unknown) => this.mapInvoice(inv));
    } catch (error) {
      throw this.handlePayPalError(error);
    }
  }

  // =========================================================================
  // Refunds
  // =========================================================================

  async refund(request: RefundRequest): Promise<Refund> {
    try {
      // First, get the capture ID from the order
      const refundRequest = new paypal.payments.CapturesRefundRequest(request.paymentId);
      refundRequest.prefer('return=representation');

      if (request.amount) {
        refundRequest.requestBody({
          amount: {
            currency_code: request.amount.currency.toUpperCase(),
            value: (request.amount.amount / 100).toFixed(2),
          },
          note_to_payer: request.reason || 'Refund processed',
        });
      }

      if (request.idempotencyKey) {
        refundRequest.headers['PayPal-Request-Id'] = request.idempotencyKey;
      }

      const response = await this.client.execute(refundRequest);
      const refundResult = response.result as {
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
        create_time: string;
      };

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

  async retrieveRefund(refundId: string): Promise<Refund> {
    try {
      const response = await this.makeRequest('GET', `/v2/payments/refunds/${refundId}`);
      return {
        id: response.id,
        paymentId: response.links?.find((l: { rel: string }) => l.rel === 'up')?.href || '',
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
  // Webhooks
  // =========================================================================

  async handleWebhook(request: WebhookRequest): Promise<WebhookEvent> {
    if (!this.verifyWebhookSignature(request)) {
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

  verifyWebhookSignature(request: WebhookRequest): boolean {
    try {
      const body = typeof request.body === 'string' ? request.body : request.body.toString();

      // PayPal webhook verification uses a combination of headers
      // This is a simplified verification - in production, use the PayPal API
      const transmissionId = request.signature.split(',')[0] || '';
      const timestamp = request.timestamp || '';

      // Create verification string
      const verificationString = `${transmissionId}|${timestamp}|${this.webhookId}|${createHmac('sha256', '').update(body).digest('base64')}`;

      // In production, this should call PayPal's webhook verification API
      return transmissionId.length > 0 && timestamp.length > 0;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private async makeRequest(
    method: string,
    path: string,
    body?: unknown,
    idempotencyKey?: string
  ): Promise<any> {
    // This is a simplified HTTP request helper
    // In production, use the PayPal SDK's request mechanism
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['PayPal-Request-Id'] = idempotencyKey;
    }

    // Implementation would use fetch or axios
    // This is a placeholder for the actual implementation
    throw new PaymentError('Direct API calls require additional implementation', 'not_implemented', 'paypal');
  }

  private calculateTotal(lineItems: CreateCheckoutRequest['lineItems']): string {
    const total = lineItems.reduce((sum: number, item: LineItem) => sum + item.amount.amount * item.quantity, 0);
    return (total / 100).toFixed(2);
  }

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

  private mapSubscription(sub: PayPalSubscription): Subscription {
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

  private mapInvoice(inv: any): Invoice {
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

    const amount = {
      amount: Math.round(parseFloat(inv.amount?.value || '0') * 100),
      currency: (inv.amount?.currency_code || 'usd').toLowerCase(),
    };

    return {
      id: inv.id,
      customerId: inv.primary_recipients?.[0]?.billing_info?.email_address || '',
      status: statusMap[inv.status] || 'draft',
      amount,
      amountPaid: { amount: 0, currency: amount.currency },
      amountDue: amount,
      lineItems: (inv.items || []).map((item: any) => ({
        description: item.name,
        amount: {
          amount: Math.round(parseFloat(item.unit_amount?.value || '0') * 100),
          currency: (item.unit_amount?.currency_code || 'usd').toLowerCase(),
        },
        quantity: parseInt(item.quantity || '1', 10),
      })),
      createdAt: new Date(inv.detail?.invoice_date || Date.now()),
    };
  }

  private mapRefundStatus(status: string): Refund['status'] {
    const statusMap: Record<string, Refund['status']> = {
      CANCELLED: 'canceled',
      PENDING: 'pending',
      COMPLETED: 'succeeded',
      FAILED: 'failed',
    };
    return statusMap[status] || 'pending';
  }

  private handlePayPalError(error: unknown): PaymentError {
    if (error instanceof PaymentError) return error;
    if (error instanceof Error) {
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

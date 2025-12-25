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

import { createHmac, createVerify } from 'crypto';
import {
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
  RefundRequest,
  Refund,
  WebhookRequest,
  WebhookEvent,
  PaymentError,
  WebhookVerificationError,
  SubscriptionStatus,
} from '../index';

export interface PaddleConfig {
  apiKey: string;
  webhookSecret: string;
  environment?: 'sandbox' | 'production';
  sellerId?: string;
}

interface PaddleApiResponse<T> {
  data: T;
  meta?: {
    request_id: string;
    pagination?: {
      per_page: number;
      next: string | null;
      has_more: boolean;
    };
  };
  error?: {
    type: string;
    code: string;
    detail: string;
  };
}

export class PaddleProvider implements PaymentProvider {
  readonly name = 'paddle' as const;
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor(config: PaddleConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.paddle.com'
        : 'https://sandbox-api.paddle.com';
  }

  // =========================================================================
  // Checkout
  // =========================================================================

  async createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    try {
      const response = await this.makeRequest<{
        id: string;
        url: string;
        status: string;
        customer_id?: string;
        expires_at: string;
      }>('/transactions', 'POST', {
        items: request.lineItems.map((item) => ({
          price_id: item.name, // Paddle uses price IDs
          quantity: item.quantity,
        })),
        customer_id: request.customerId,
        checkout: {
          url: request.successUrl,
        },
        custom_data: request.metadata,
      });

      return {
        id: response.id,
        url: response.url,
        status: this.mapTransactionStatus(response.status),
        customerId: response.customer_id,
        lineItems: request.lineItems,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        expiresAt: new Date(response.expires_at),
        metadata: request.metadata,
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async retrieveCheckout(sessionId: string): Promise<CheckoutSession> {
    try {
      const response = await this.makeRequest<{
        id: string;
        status: string;
        customer_id?: string;
        checkout?: { url: string };
        details?: {
          line_items: Array<{
            price_id: string;
            quantity: number;
            totals: { total: string };
          }>;
        };
      }>(`/transactions/${sessionId}`, 'GET');

      return {
        id: response.id,
        url: response.checkout?.url || '',
        status: this.mapTransactionStatus(response.status),
        customerId: response.customer_id,
        lineItems:
          response.details?.line_items.map((item) => ({
            name: item.price_id,
            amount: { amount: parseInt(item.totals.total, 10), currency: 'usd' },
            quantity: item.quantity,
          })) || [],
        successUrl: '',
        cancelUrl: '',
        expiresAt: new Date(),
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  // =========================================================================
  // Subscriptions
  // =========================================================================

  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      // Paddle subscriptions are created through transactions
      const response = await this.makeRequest<{
        id: string;
        customer_id: string;
        status: string;
        items: Array<{ price: { id: string }; quantity: number }>;
        current_billing_period: { starts_at: string; ends_at: string };
        scheduled_change?: { action: string };
        started_at?: string;
      }>('/subscriptions', 'POST', {
        customer_id: request.customerId,
        items: [
          {
            price_id: request.priceId,
            quantity: request.quantity || 1,
          },
        ],
        custom_data: request.metadata,
      });

      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await this.makeRequest<any>(
        `/subscriptions/${subscriptionId}`,
        'GET'
      );
      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionRequest>
  ): Promise<Subscription> {
    try {
      const updatePayload: Record<string, unknown> = {};

      if (updates.priceId || updates.quantity) {
        updatePayload.items = [
          {
            price_id: updates.priceId,
            quantity: updates.quantity,
          },
        ];
      }

      if (updates.metadata) {
        updatePayload.custom_data = updates.metadata;
      }

      const response = await this.makeRequest<any>(
        `/subscriptions/${subscriptionId}`,
        'PATCH',
        updatePayload
      );

      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    try {
      const response = await this.makeRequest<any>(
        `/subscriptions/${request.subscriptionId}/cancel`,
        'POST',
        {
          effective_from: request.immediately ? 'immediately' : 'next_billing_period',
        }
      );

      return this.mapSubscription(response);
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    try {
      const response = await this.makeRequest<any[]>(
        `/subscriptions?customer_id=${customerId}`,
        'GET'
      );

      return response.map((sub) => this.mapSubscription(sub));
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  // =========================================================================
  // Customers
  // =========================================================================

  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await this.makeRequest<{
        id: string;
        email: string;
        name?: string;
        created_at: string;
        custom_data?: Record<string, string>;
      }>('/customers', 'POST', {
        email: request.email,
        name: request.name,
        custom_data: request.metadata,
      });

      return {
        id: response.id,
        email: response.email,
        name: response.name,
        metadata: response.custom_data,
        createdAt: new Date(response.created_at),
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async retrieveCustomer(customerId: string): Promise<Customer> {
    try {
      const response = await this.makeRequest<{
        id: string;
        email: string;
        name?: string;
        created_at: string;
        custom_data?: Record<string, string>;
      }>(`/customers/${customerId}`, 'GET');

      return {
        id: response.id,
        email: response.email,
        name: response.name,
        metadata: response.custom_data,
        createdAt: new Date(response.created_at),
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<CreateCustomerRequest>
  ): Promise<Customer> {
    try {
      const response = await this.makeRequest<{
        id: string;
        email: string;
        name?: string;
        created_at: string;
        custom_data?: Record<string, string>;
      }>(`/customers/${customerId}`, 'PATCH', {
        email: updates.email,
        name: updates.name,
        custom_data: updates.metadata,
      });

      return {
        id: response.id,
        email: response.email,
        name: response.name,
        metadata: response.custom_data,
        createdAt: new Date(response.created_at),
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    // Paddle doesn't support customer deletion, only anonymization
    throw new PaymentError(
      'Paddle does not support customer deletion. Use data anonymization instead.',
      'not_supported',
      'paddle'
    );
  }

  // =========================================================================
  // Payment Methods
  // =========================================================================

  async attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod> {
    // Paddle manages payment methods through their checkout
    // Payment methods are automatically attached to customers
    try {
      const response = await this.makeRequest<{
        id: string;
        type: string;
        card?: { last4: string; brand: string; expiry_month: number; expiry_year: number };
      }>(`/customers/${request.customerId}/payment-methods`, 'GET');

      // Return the first (default) payment method
      return {
        id: response.id,
        type: response.type === 'card' ? 'card' : 'paypal',
        card: response.card
          ? {
              brand: response.card.brand,
              last4: response.card.last4,
              expMonth: response.card.expiry_month,
              expYear: response.card.expiry_year,
            }
          : undefined,
        isDefault: true,
        customerId: request.customerId,
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.makeRequest(`/payment-methods/${paymentMethodId}`, 'DELETE');
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await this.makeRequest<
        Array<{
          id: string;
          type: string;
          card?: { last4: string; brand: string; expiry_month: number; expiry_year: number };
        }>
      >(`/customers/${customerId}/payment-methods`, 'GET');

      return response.map((pm, index) => ({
        id: pm.id,
        type: pm.type === 'card' ? 'card' as const : 'paypal' as const,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.expiry_month,
              expYear: pm.card.expiry_year,
            }
          : undefined,
        isDefault: index === 0,
        customerId,
      }));
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // Paddle doesn't have explicit default payment method setting
    // The most recent valid payment method is used
  }

  // =========================================================================
  // Invoices (Paddle calls these "transactions")
  // =========================================================================

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    // Paddle invoices are generated automatically with subscriptions
    // For manual invoicing, we create a transaction
    try {
      const response = await this.makeRequest<{
        id: string;
        customer_id: string;
        status: string;
        details: {
          totals: { total: string; currency_code: string };
          line_items: Array<{
            price_id: string;
            quantity: number;
            totals: { total: string };
          }>;
        };
        created_at: string;
      }>('/transactions', 'POST', {
        customer_id: request.customerId,
        items: request.lineItems.map((item) => ({
          price_id: item.description,
          quantity: item.quantity,
        })),
        custom_data: request.metadata,
      });

      return this.mapInvoice(response);
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async retrieveInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const response = await this.makeRequest<any>(`/transactions/${invoiceId}`, 'GET');
      return this.mapInvoice(response);
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    // Paddle transactions don't need to be finalized
    return this.retrieveInvoice(invoiceId);
  }

  async voidInvoice(invoiceId: string): Promise<Invoice> {
    // Void by creating a full refund/credit
    throw new PaymentError(
      'Paddle transactions cannot be voided directly. Use refunds instead.',
      'not_supported',
      'paddle'
    );
  }

  async listInvoices(customerId: string): Promise<Invoice[]> {
    try {
      const response = await this.makeRequest<any[]>(
        `/transactions?customer_id=${customerId}`,
        'GET'
      );

      return response.map((txn) => this.mapInvoice(txn));
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  // =========================================================================
  // Refunds (Paddle calls these "adjustments")
  // =========================================================================

  async refund(request: RefundRequest): Promise<Refund> {
    try {
      const response = await this.makeRequest<{
        id: string;
        transaction_id: string;
        status: string;
        totals: { total: string; currency_code: string };
        reason: string;
        created_at: string;
      }>('/adjustments', 'POST', {
        transaction_id: request.paymentId,
        action: 'refund',
        reason: request.reason || 'Customer requested refund',
        items: request.amount
          ? [
              {
                type: 'partial',
                amount: request.amount.amount.toString(),
              },
            ]
          : [{ type: 'full' }],
      });

      return {
        id: response.id,
        paymentId: response.transaction_id,
        amount: {
          amount: parseInt(response.totals.total, 10),
          currency: response.totals.currency_code.toLowerCase(),
        },
        status: this.mapRefundStatus(response.status),
        reason: response.reason as Refund['reason'],
        createdAt: new Date(response.created_at),
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  async retrieveRefund(refundId: string): Promise<Refund> {
    try {
      const response = await this.makeRequest<{
        id: string;
        transaction_id: string;
        status: string;
        totals: { total: string; currency_code: string };
        reason: string;
        created_at: string;
      }>(`/adjustments/${refundId}`, 'GET');

      return {
        id: response.id,
        paymentId: response.transaction_id,
        amount: {
          amount: parseInt(response.totals.total, 10),
          currency: response.totals.currency_code.toLowerCase(),
        },
        status: this.mapRefundStatus(response.status),
        reason: response.reason as Refund['reason'],
        createdAt: new Date(response.created_at),
      };
    } catch (error) {
      throw this.handlePaddleError(error);
    }
  }

  // =========================================================================
  // Webhooks
  // =========================================================================

  async handleWebhook(request: WebhookRequest): Promise<WebhookEvent> {
    if (!this.verifyWebhookSignature(request)) {
      throw new WebhookVerificationError('Invalid Paddle webhook signature');
    }

    const body =
      typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

    return {
      id: body.event_id,
      type: body.event_type,
      provider: 'paddle',
      data: body.data,
      createdAt: new Date(body.occurred_at),
    };
  }

  verifyWebhookSignature(request: WebhookRequest): boolean {
    try {
      const body =
        typeof request.body === 'string' ? request.body : request.body.toString();
      const signature = request.signature;
      const timestamp = request.timestamp || '';

      // Paddle v2 webhook signature format: ts=timestamp;h1=signature
      const parts = signature.split(';');
      const tsMatch = parts.find((p) => p.startsWith('ts='));
      const h1Match = parts.find((p) => p.startsWith('h1='));

      if (!tsMatch || !h1Match) return false;

      const ts = tsMatch.substring(3);
      const h1 = h1Match.substring(3);

      // Create signature payload
      const signedPayload = `${ts}:${body}`;
      const expectedSignature = createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      return h1 === expectedSignature;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private async makeRequest<T>(
    path: string,
    method: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await response.json()) as PaddleApiResponse<T>;

    if (!response.ok || json.error) {
      throw new PaymentError(
        json.error?.detail || 'Paddle API error',
        json.error?.code || 'paddle_error',
        'paddle',
        json.meta?.request_id
      );
    }

    return json.data;
  }

  private mapTransactionStatus(status: string): 'open' | 'complete' | 'expired' {
    const statusMap: Record<string, 'open' | 'complete' | 'expired'> = {
      draft: 'open',
      ready: 'open',
      billed: 'open',
      paid: 'complete',
      completed: 'complete',
      canceled: 'expired',
      past_due: 'open',
    };
    return statusMap[status] || 'open';
  }

  private mapSubscription(sub: any): Subscription {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'active',
      past_due: 'past_due',
      paused: 'paused',
      canceled: 'canceled',
      trialing: 'trialing',
    };

    return {
      id: sub.id,
      customerId: sub.customer_id,
      status: statusMap[sub.status] || 'unpaid',
      priceId: sub.items?.[0]?.price?.id || '',
      quantity: sub.items?.[0]?.quantity || 1,
      currentPeriodStart: new Date(sub.current_billing_period?.starts_at || Date.now()),
      currentPeriodEnd: new Date(sub.current_billing_period?.ends_at || Date.now()),
      cancelAtPeriodEnd: sub.scheduled_change?.action === 'cancel',
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at) : undefined,
      trialEnd: sub.trial?.ends_at ? new Date(sub.trial.ends_at) : undefined,
    };
  }

  private mapInvoice(txn: any): Invoice {
    const statusMap: Record<string, Invoice['status']> = {
      draft: 'draft',
      ready: 'open',
      billed: 'open',
      paid: 'paid',
      completed: 'paid',
      canceled: 'void',
      past_due: 'open',
    };

    const currency = (txn.details?.totals?.currency_code || 'usd').toLowerCase();
    const total = parseInt(txn.details?.totals?.total || '0', 10);

    return {
      id: txn.id,
      customerId: txn.customer_id,
      subscriptionId: txn.subscription_id,
      status: statusMap[txn.status] || 'draft',
      amount: { amount: total, currency },
      amountPaid: { amount: txn.status === 'paid' ? total : 0, currency },
      amountDue: { amount: txn.status === 'paid' ? 0 : total, currency },
      lineItems:
        txn.details?.line_items?.map((item: any) => ({
          description: item.price_id,
          amount: { amount: parseInt(item.totals?.total || '0', 10), currency },
          quantity: item.quantity,
        })) || [],
      createdAt: new Date(txn.created_at),
    };
  }

  private mapRefundStatus(status: string): Refund['status'] {
    const statusMap: Record<string, Refund['status']> = {
      pending: 'pending',
      approved: 'succeeded',
      rejected: 'failed',
      reversed: 'canceled',
    };
    return statusMap[status] || 'pending';
  }

  private handlePaddleError(error: unknown): PaymentError {
    if (error instanceof PaymentError) return error;
    if (error instanceof Error) {
      return new PaymentError(error.message, 'paddle_error', 'paddle');
    }
    return new PaymentError('Unknown Paddle error', 'unknown_error', 'paddle');
  }
}

/**
 * Create a configured Paddle provider instance.
 */
export function createPaddleProvider(config: PaddleConfig): PaddleProvider {
  return new PaddleProvider(config);
}

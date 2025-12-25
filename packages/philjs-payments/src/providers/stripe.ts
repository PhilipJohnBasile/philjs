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
  InvoiceLineItem,
} from '../index';

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion?: Stripe.LatestApiVersion;
}

export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion || '2023-10-16' as Stripe.LatestApiVersion,
      typescript: true,
    });
    this.webhookSecret = config.webhookSecret;
  }

  // =========================================================================
  // Checkout
  // =========================================================================

  async createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    try {
      const session = await this.stripe.checkout.sessions.create(
        {
          customer: request.customerId,
          customer_email: request.customerEmail,
          line_items: request.lineItems.map((item) => ({
            price_data: {
              currency: item.amount.currency,
              product_data: {
                name: item.name,
                description: item.description,
                images: item.imageUrl ? [item.imageUrl] : undefined,
              },
              unit_amount: item.amount.amount,
            },
            quantity: item.quantity,
          })),
          mode: request.mode || 'payment',
          success_url: request.successUrl,
          cancel_url: request.cancelUrl,
          expires_at: request.expiresIn
            ? Math.floor(Date.now() / 1000) + request.expiresIn
            : undefined,
          metadata: request.metadata,
        },
        {
          idempotencyKey: request.idempotencyKey,
        }
      );

      return this.mapCheckoutSession(session);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async retrieveCheckout(sessionId: string): Promise<CheckoutSession> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
      return this.mapCheckoutSession(session);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // =========================================================================
  // Subscriptions
  // =========================================================================

  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create(
        {
          customer: request.customerId,
          items: [{ price: request.priceId, quantity: request.quantity || 1 }],
          trial_period_days: request.trialDays,
          default_payment_method: request.paymentMethodId,
          cancel_at_period_end: request.cancelAtPeriodEnd || false,
          metadata: request.metadata,
        },
        {
          idempotencyKey: request.idempotencyKey,
        }
      );

      return this.mapSubscription(subscription);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return this.mapSubscription(subscription);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionRequest>
  ): Promise<Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (updates.priceId) {
        // Get current subscription to find the item to update
        const current = await this.stripe.subscriptions.retrieve(subscriptionId);
        updateParams.items = [
          {
            id: current.items.data[0].id,
            price: updates.priceId,
            quantity: updates.quantity,
          },
        ];
      }

      if (updates.paymentMethodId) {
        updateParams.default_payment_method = updates.paymentMethodId;
      }

      if (updates.cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = updates.cancelAtPeriodEnd;
      }

      if (updates.metadata) {
        updateParams.metadata = updates.metadata;
      }

      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        updateParams,
        { idempotencyKey: updates.idempotencyKey }
      );

      return this.mapSubscription(subscription);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    try {
      let subscription: Stripe.Subscription;

      if (request.immediately) {
        subscription = await this.stripe.subscriptions.cancel(
          request.subscriptionId,
          { cancellation_details: { comment: request.reason } },
          { idempotencyKey: request.idempotencyKey }
        );
      } else {
        subscription = await this.stripe.subscriptions.update(
          request.subscriptionId,
          {
            cancel_at_period_end: true,
            cancellation_details: { comment: request.reason },
          },
          { idempotencyKey: request.idempotencyKey }
        );
      }

      return this.mapSubscription(subscription);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });

      return subscriptions.data.map((sub) => this.mapSubscription(sub));
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // =========================================================================
  // Customers
  // =========================================================================

  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.create(
        {
          email: request.email,
          name: request.name,
          phone: request.phone,
          address: request.address
            ? {
                line1: request.address.line1,
                line2: request.address.line2,
                city: request.address.city,
                state: request.address.state,
                postal_code: request.address.postalCode,
                country: request.address.country,
              }
            : undefined,
          metadata: request.metadata,
        },
        {
          idempotencyKey: request.idempotencyKey,
        }
      );

      return this.mapCustomer(customer);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async retrieveCustomer(customerId: string): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new PaymentError('Customer has been deleted', 'customer_deleted', 'stripe');
      }
      return this.mapCustomer(customer as Stripe.Customer);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<CreateCustomerRequest>
  ): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        email: updates.email,
        name: updates.name,
        phone: updates.phone,
        address: updates.address
          ? {
              line1: updates.address.line1,
              line2: updates.address.line2,
              city: updates.address.city,
              state: updates.address.state,
              postal_code: updates.address.postalCode,
              country: updates.address.country,
            }
          : undefined,
        metadata: updates.metadata,
      });

      return this.mapCustomer(customer);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.stripe.customers.del(customerId);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // =========================================================================
  // Payment Methods
  // =========================================================================

  async attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        request.paymentMethodId,
        { customer: request.customerId },
        { idempotencyKey: request.idempotencyKey }
      );

      if (request.setAsDefault) {
        await this.stripe.customers.update(request.customerId, {
          invoice_settings: { default_payment_method: request.paymentMethodId },
        });
      }

      return this.mapPaymentMethod(paymentMethod, request.customerId, request.setAsDefault);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const [paymentMethods, customer] = await Promise.all([
        this.stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
        this.stripe.customers.retrieve(customerId),
      ]);

      const defaultPm =
        !customer.deleted && customer.invoice_settings?.default_payment_method;

      return paymentMethods.data.map((pm) =>
        this.mapPaymentMethod(pm, customerId, pm.id === defaultPm)
      );
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // =========================================================================
  // Invoices
  // =========================================================================

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    try {
      // Create invoice
      const invoice = await this.stripe.invoices.create(
        {
          customer: request.customerId,
          auto_advance: request.autoAdvance ?? true,
          due_date: request.dueDate
            ? Math.floor(request.dueDate.getTime() / 1000)
            : undefined,
          metadata: request.metadata,
        },
        { idempotencyKey: request.idempotencyKey }
      );

      // Add line items
      for (const item of request.lineItems) {
        await this.stripe.invoiceItems.create({
          customer: request.customerId,
          invoice: invoice.id,
          description: item.description,
          amount: item.amount.amount,
          currency: item.amount.currency,
          quantity: item.quantity,
          period: item.periodStart && item.periodEnd
            ? {
                start: Math.floor(item.periodStart.getTime() / 1000),
                end: Math.floor(item.periodEnd.getTime() / 1000),
              }
            : undefined,
        });
      }

      // Retrieve updated invoice with line items
      const updatedInvoice = await this.stripe.invoices.retrieve(invoice.id, {
        expand: ['lines'],
      });

      return this.mapInvoice(updatedInvoice);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async retrieveInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId, {
        expand: ['lines'],
      });
      return this.mapInvoice(invoice);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.finalizeInvoice(invoiceId);
      return this.mapInvoice(invoice);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async voidInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await this.stripe.invoices.voidInvoice(invoiceId);
      return this.mapInvoice(invoice);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async listInvoices(customerId: string): Promise<Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 100,
        expand: ['data.lines'],
      });

      return invoices.data.map((inv) => this.mapInvoice(inv));
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // =========================================================================
  // Refunds
  // =========================================================================

  async refund(request: RefundRequest): Promise<Refund> {
    try {
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: request.paymentId,
          amount: request.amount?.amount,
          reason: this.mapRefundReason(request.reason),
          metadata: request.metadata,
        },
        { idempotencyKey: request.idempotencyKey }
      );

      return this.mapRefund(refund);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  async retrieveRefund(refundId: string): Promise<Refund> {
    try {
      const refund = await this.stripe.refunds.retrieve(refundId);
      return this.mapRefund(refund);
    } catch (error) {
      throw this.handleStripeError(error);
    }
  }

  // =========================================================================
  // Webhooks
  // =========================================================================

  async handleWebhook(request: WebhookRequest): Promise<WebhookEvent> {
    const event = this.constructWebhookEvent(request);

    return {
      id: event.id,
      type: event.type,
      provider: 'stripe',
      data: event.data.object,
      createdAt: new Date(event.created * 1000),
    };
  }

  verifyWebhookSignature(request: WebhookRequest): boolean {
    try {
      this.constructWebhookEvent(request);
      return true;
    } catch {
      return false;
    }
  }

  private constructWebhookEvent(request: WebhookRequest): Stripe.Event {
    try {
      const payload = typeof request.body === 'string' ? request.body : request.body.toString();
      return this.stripe.webhooks.constructEvent(
        payload,
        request.signature,
        this.webhookSecret
      );
    } catch (error) {
      throw new WebhookVerificationError(
        `Stripe webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // =========================================================================
  // Mapping Helpers
  // =========================================================================

  private mapCheckoutSession(session: Stripe.Checkout.Session): CheckoutSession {
    return {
      id: session.id,
      url: session.url || '',
      status: session.status as 'open' | 'complete' | 'expired',
      customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      lineItems: (session.line_items?.data || []).map((item) => ({
        name: item.description || '',
        amount: {
          amount: item.amount_total || 0,
          currency: session.currency || 'usd',
        },
        quantity: item.quantity || 1,
      })),
      successUrl: session.success_url || '',
      cancelUrl: session.cancel_url || '',
      expiresAt: new Date((session.expires_at || 0) * 1000),
      metadata: session.metadata as Record<string, string> | undefined,
    };
  }

  private mapSubscription(subscription: Stripe.Subscription): Subscription {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
      trialing: 'trialing',
      paused: 'paused',
      incomplete: 'unpaid',
      incomplete_expired: 'canceled',
    };

    return {
      id: subscription.id,
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      status: statusMap[subscription.status] || 'unpaid',
      priceId: subscription.items.data[0]?.price?.id || '',
      quantity: subscription.items.data[0]?.quantity || 1,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
      metadata: subscription.metadata as Record<string, string> | undefined,
    };
  }

  private mapCustomer(customer: Stripe.Customer): Customer {
    return {
      id: customer.id,
      email: customer.email || '',
      name: customer.name || undefined,
      phone: customer.phone || undefined,
      address: customer.address
        ? {
            line1: customer.address.line1 || '',
            line2: customer.address.line2 || undefined,
            city: customer.address.city || '',
            state: customer.address.state || undefined,
            postalCode: customer.address.postal_code || '',
            country: customer.address.country || '',
          }
        : undefined,
      metadata: customer.metadata as Record<string, string> | undefined,
      createdAt: new Date(customer.created * 1000),
    };
  }

  private mapPaymentMethod(
    pm: Stripe.PaymentMethod,
    customerId: string,
    isDefault?: boolean
  ): PaymentMethod {
    return {
      id: pm.id,
      type: 'card',
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : undefined,
      isDefault: isDefault || false,
      customerId,
    };
  }

  private mapInvoice(invoice: Stripe.Invoice): Invoice {
    const statusMap: Record<Stripe.Invoice.Status | 'deleted', Invoice['status']> = {
      draft: 'draft',
      open: 'open',
      paid: 'paid',
      void: 'void',
      uncollectible: 'uncollectible',
      deleted: 'void',
    };

    const lineItems: InvoiceLineItem[] = (invoice.lines?.data || []).map((line) => ({
      description: line.description || '',
      amount: {
        amount: line.amount,
        currency: invoice.currency,
      },
      quantity: line.quantity || 1,
      periodStart: line.period?.start ? new Date(line.period.start * 1000) : undefined,
      periodEnd: line.period?.end ? new Date(line.period.end * 1000) : undefined,
    }));

    return {
      id: invoice.id,
      customerId:
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
      subscriptionId:
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id,
      status: statusMap[invoice.status || 'draft'] || 'draft',
      amount: { amount: invoice.total, currency: invoice.currency },
      amountPaid: { amount: invoice.amount_paid, currency: invoice.currency },
      amountDue: { amount: invoice.amount_due, currency: invoice.currency },
      lineItems,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      createdAt: new Date(invoice.created * 1000),
    };
  }

  private mapRefund(refund: Stripe.Refund): Refund {
    const statusMap: Record<Stripe.Refund.Status, Refund['status']> = {
      pending: 'pending',
      succeeded: 'succeeded',
      failed: 'failed',
      canceled: 'canceled',
      requires_action: 'pending',
    };

    return {
      id: refund.id,
      paymentId:
        typeof refund.payment_intent === 'string'
          ? refund.payment_intent
          : refund.payment_intent?.id || '',
      amount: { amount: refund.amount, currency: refund.currency },
      status: statusMap[refund.status || 'pending'] || 'pending',
      reason: refund.reason as Refund['reason'],
      createdAt: new Date(refund.created * 1000),
    };
  }

  private mapRefundReason(
    reason?: string
  ): 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined {
    if (!reason) return undefined;
    if (reason === 'duplicate' || reason === 'fraudulent' || reason === 'requested_by_customer') {
      return reason;
    }
    return 'requested_by_customer';
  }

  private handleStripeError(error: unknown): PaymentError {
    if (error instanceof Stripe.errors.StripeError) {
      return new PaymentError(
        error.message,
        error.code || 'stripe_error',
        'stripe',
        error.requestId
      );
    }
    if (error instanceof Error) {
      return new PaymentError(error.message, 'unknown_error', 'stripe');
    }
    return new PaymentError('Unknown Stripe error', 'unknown_error', 'stripe');
  }
}

/**
 * Create a configured Stripe provider instance.
 */
export function createStripeProvider(config: StripeConfig): StripeProvider {
  return new StripeProvider(config);
}

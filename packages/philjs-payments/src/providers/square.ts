/**
 * Square Payment Provider for PhilJS Payments
 *
 * Features:
 * - Square API integration
 * - Idempotency key support
 * - Webhook signature verification
 * - Subscription and invoice management
 */

import { Client, Environment, ApiError } from 'square';
import { createHmac } from 'crypto';
import {
  PaymentError,
  WebhookVerificationError,
} from '../index.js';
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
  RefundRequest,
  Refund,
  WebhookRequest,
  WebhookEvent,
  SubscriptionStatus,
} from '../index.js';

export interface SquareConfig {
  accessToken: string;
  locationId: string;
  webhookSignatureKey: string;
  environment?: 'sandbox' | 'production';
}

export class SquareProvider implements PaymentProvider {
  readonly name = 'square' as const;
  private client: Client;
  private locationId: string;
  private webhookSignatureKey: string;

  constructor(config: SquareConfig) {
    this.client = new Client({
      accessToken: config.accessToken,
      environment:
        config.environment === 'production' ? Environment.Production : Environment.Sandbox,
    });
    this.locationId = config.locationId;
    this.webhookSignatureKey = config.webhookSignatureKey;
  }

  // =========================================================================
  // Checkout
  // =========================================================================

  async createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
    try {
      const paymentLinkRequest: Parameters<typeof this.client.checkoutApi.createPaymentLink>[0] = {
        idempotencyKey: request.idempotencyKey || this.generateIdempotencyKey(),
        quickPay: {
          name: request.lineItems[0]?.name || 'Order',
          priceMoney: {
            amount: BigInt(this.calculateTotal(request.lineItems)),
            currency: request.lineItems[0]?.amount.currency.toUpperCase() || 'USD',
          },
          locationId: this.locationId,
        },
        checkoutOptions: {
          redirectUrl: request.successUrl,
          askForShippingAddress: false,
        },
      };
      if (request.customerEmail) {
        paymentLinkRequest.prePopulatedData = { buyerEmail: request.customerEmail };
      }
      const { result } = await this.client.checkoutApi.createPaymentLink(paymentLinkRequest);

      const paymentLink = result.paymentLink!;

      const checkoutSession: CheckoutSession = {
        id: paymentLink.id!,
        url: paymentLink.url!,
        status: 'open',
        lineItems: request.lineItems,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
      if (request.customerId) {
        checkoutSession.customerId = request.customerId;
      }
      if (request.metadata) {
        checkoutSession.metadata = request.metadata;
      }
      return checkoutSession;
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async retrieveCheckout(sessionId: string): Promise<CheckoutSession> {
    try {
      const { result } = await this.client.checkoutApi.retrievePaymentLink(sessionId);
      const paymentLink = result.paymentLink!;

      return {
        id: paymentLink.id!,
        url: paymentLink.url!,
        status: 'open',
        lineItems: [],
        successUrl: '',
        cancelUrl: '',
        expiresAt: new Date(),
      };
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  // =========================================================================
  // Subscriptions
  // =========================================================================

  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      const subscriptionRequest: Parameters<typeof this.client.subscriptionsApi.createSubscription>[0] = {
        idempotencyKey: request.idempotencyKey || this.generateIdempotencyKey(),
        locationId: this.locationId,
        planVariationId: request.priceId,
        customerId: request.customerId,
        startDate: new Date().toISOString().split('T')[0]!,
      };
      if (request.paymentMethodId) {
        subscriptionRequest.cardId = request.paymentMethodId;
      }
      const { result } = await this.client.subscriptionsApi.createSubscription(subscriptionRequest);

      return this.mapSubscription(result.subscription!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const { result } = await this.client.subscriptionsApi.retrieveSubscription(subscriptionId);
      return this.mapSubscription(result.subscription!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionRequest>
  ): Promise<Subscription> {
    try {
      const subscription: Record<string, string> = {};
      if (updates.priceId) {
        subscription['planVariationId'] = updates.priceId;
      }
      if (updates.paymentMethodId) {
        subscription['cardId'] = updates.paymentMethodId;
      }
      const { result } = await this.client.subscriptionsApi.updateSubscription(subscriptionId, {
        subscription,
      });

      return this.mapSubscription(result.subscription!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    try {
      const { result } = await this.client.subscriptionsApi.cancelSubscription(
        request.subscriptionId
      );

      return this.mapSubscription(result.subscription!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    try {
      const { result } = await this.client.subscriptionsApi.searchSubscriptions({
        query: {
          filter: {
            customerIds: [customerId],
            locationIds: [this.locationId],
          },
        },
      });

      return (result.subscriptions || []).map((sub) => this.mapSubscription(sub));
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  // =========================================================================
  // Customers
  // =========================================================================

  async createCustomer(request: CreateCustomerRequest): Promise<Customer> {
    try {
      const customerRequest: Parameters<typeof this.client.customersApi.createCustomer>[0] = {
        idempotencyKey: request.idempotencyKey || this.generateIdempotencyKey(),
        emailAddress: request.email,
      };
      if (request.name) {
        customerRequest.givenName = request.name.split(' ')[0]!;
        customerRequest.familyName = request.name.split(' ').slice(1).join(' ');
      }
      if (request.phone) {
        customerRequest.phoneNumber = request.phone;
      }
      if (request.address) {
        customerRequest.address = {
          addressLine1: request.address.line1,
          locality: request.address.city,
          postalCode: request.address.postalCode,
          country: request.address.country,
        };
        if (request.address.line2) {
          customerRequest.address.addressLine2 = request.address.line2;
        }
        if (request.address.state) {
          customerRequest.address.administrativeDistrictLevel1 = request.address.state;
        }
      }
      if (request.metadata?.['referenceId']) {
        customerRequest.referenceId = request.metadata['referenceId'];
      }
      const { result } = await this.client.customersApi.createCustomer(customerRequest);

      return this.mapCustomer(result.customer!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async retrieveCustomer(customerId: string): Promise<Customer> {
    try {
      const { result } = await this.client.customersApi.retrieveCustomer(customerId);
      return this.mapCustomer(result.customer!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<CreateCustomerRequest>
  ): Promise<Customer> {
    try {
      const updateRequest: Parameters<typeof this.client.customersApi.updateCustomer>[1] = {};
      if (updates.email) {
        updateRequest.emailAddress = updates.email;
      }
      if (updates.name) {
        updateRequest.givenName = updates.name.split(' ')[0]!;
        updateRequest.familyName = updates.name.split(' ').slice(1).join(' ');
      }
      if (updates.phone) {
        updateRequest.phoneNumber = updates.phone;
      }
      if (updates.address) {
        updateRequest.address = {
          addressLine1: updates.address.line1,
          locality: updates.address.city,
          postalCode: updates.address.postalCode,
          country: updates.address.country,
        };
        if (updates.address.line2) {
          updateRequest.address.addressLine2 = updates.address.line2;
        }
        if (updates.address.state) {
          updateRequest.address.administrativeDistrictLevel1 = updates.address.state;
        }
      }
      const { result } = await this.client.customersApi.updateCustomer(customerId, updateRequest);

      return this.mapCustomer(result.customer!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.client.customersApi.deleteCustomer(customerId);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  // =========================================================================
  // Payment Methods (Cards)
  // =========================================================================

  async attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod> {
    try {
      const { result } = await this.client.cardsApi.createCard({
        idempotencyKey: request.idempotencyKey || this.generateIdempotencyKey(),
        sourceId: request.paymentMethodId,
        card: {
          customerId: request.customerId,
        },
      });

      return this.mapCard(result.card!, request.setAsDefault);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.client.cardsApi.disableCard(paymentMethodId);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const { result } = await this.client.cardsApi.listCards(undefined, customerId);
      return (result.cards || []).map((card, index) => this.mapCard(card, index === 0));
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    // Square doesn't have a built-in default card concept
    // This would need to be managed in your application layer
  }

  // =========================================================================
  // Invoices
  // =========================================================================

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    try {
      // First create the invoice
      const paymentRequest: { requestType: string; automaticPaymentSource: string; dueDate?: string } = {
        requestType: 'BALANCE',
        automaticPaymentSource: 'NONE',
      };
      if (request.dueDate) {
        paymentRequest.dueDate = request.dueDate.toISOString().split('T')[0]!;
      }
      const { result: createResult } = await this.client.invoicesApi.createInvoice({
        idempotencyKey: request.idempotencyKey || this.generateIdempotencyKey(),
        invoice: {
          locationId: this.locationId,
          primaryRecipient: {
            customerId: request.customerId,
          },
          paymentRequests: [paymentRequest],
          deliveryMethod: 'EMAIL',
        },
      });

      const invoice = createResult.invoice!;

      // Add line items via order
      // Note: Square invoices are tied to orders, this is simplified
      return this.mapInvoice(invoice);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async retrieveInvoice(invoiceId: string): Promise<Invoice> {
    try {
      const { result } = await this.client.invoicesApi.getInvoice(invoiceId);
      return this.mapInvoice(result.invoice!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    try {
      // Get current invoice version
      const { result: getResult } = await this.client.invoicesApi.getInvoice(invoiceId);
      const version = getResult.invoice!.version!;

      const { result } = await this.client.invoicesApi.publishInvoice(invoiceId, {
        version,
        idempotencyKey: this.generateIdempotencyKey(),
      });

      return this.mapInvoice(result.invoice!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async voidInvoice(invoiceId: string): Promise<Invoice> {
    try {
      // Get current invoice version
      const { result: getResult } = await this.client.invoicesApi.getInvoice(invoiceId);
      const version = getResult.invoice!.version!;

      const { result } = await this.client.invoicesApi.cancelInvoice(invoiceId, {
        version,
      });

      return this.mapInvoice(result.invoice!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async listInvoices(customerId: string): Promise<Invoice[]> {
    try {
      const { result } = await this.client.invoicesApi.searchInvoices({
        query: {
          filter: {
            locationIds: [this.locationId],
            customerIds: [customerId],
          },
          sort: {
            field: 'INVOICE_SORT_DATE',
            order: 'DESC',
          },
        },
      });

      return (result.invoices || []).map((inv) => this.mapInvoice(inv));
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  // =========================================================================
  // Refunds
  // =========================================================================

  async refund(request: RefundRequest): Promise<Refund> {
    try {
      const refundRequest: Parameters<typeof this.client.refundsApi.refundPayment>[0] = {
        idempotencyKey: request.idempotencyKey || this.generateIdempotencyKey(),
        paymentId: request.paymentId,
        amountMoney: request.amount
          ? {
              amount: BigInt(request.amount.amount),
              currency: request.amount.currency.toUpperCase(),
            }
          : undefined!,
        reason: request.reason || 'Customer requested refund',
      };
      const { result } = await this.client.refundsApi.refundPayment(refundRequest);

      return this.mapRefund(result.refund!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  async retrieveRefund(refundId: string): Promise<Refund> {
    try {
      const { result } = await this.client.refundsApi.getPaymentRefund(refundId);
      return this.mapRefund(result.refund!);
    } catch (error) {
      throw this.handleSquareError(error);
    }
  }

  // =========================================================================
  // Webhooks
  // =========================================================================

  async handleWebhook(request: WebhookRequest): Promise<WebhookEvent> {
    if (!this.verifyWebhookSignature(request)) {
      throw new WebhookVerificationError('Invalid Square webhook signature');
    }

    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

    return {
      id: body.event_id,
      type: body.type,
      provider: 'square',
      data: body.data,
      createdAt: new Date(body.created_at),
    };
  }

  verifyWebhookSignature(request: WebhookRequest): boolean {
    try {
      const body = typeof request.body === 'string' ? request.body : request.body.toString();
      const url = ''; // Would need to be passed in
      const signature = request.signature;

      // Square uses a specific signature format
      const signatureKey = this.webhookSignatureKey;
      const stringToSign = `${url}${body}`;
      const expectedSignature = createHmac('sha256', signatureKey)
        .update(stringToSign)
        .digest('base64');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private generateIdempotencyKey(): string {
    return `sq_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private calculateTotal(lineItems: CreateCheckoutRequest['lineItems']): number {
    return lineItems.reduce((sum: number, item: CreateCheckoutRequest['lineItems'][number]) => sum + item.amount.amount * item.quantity, 0);
  }

  private mapSubscription(sub: any): Subscription {
    const statusMap: Record<string, SubscriptionStatus> = {
      PENDING: 'unpaid',
      ACTIVE: 'active',
      CANCELED: 'canceled',
      DEACTIVATED: 'canceled',
      PAUSED: 'paused',
    };

    const result: Subscription = {
      id: sub.id,
      customerId: sub.customerId,
      status: statusMap[sub.status] || 'unpaid',
      priceId: sub.planVariationId,
      quantity: 1,
      currentPeriodStart: new Date(sub.startDate || Date.now()),
      currentPeriodEnd: sub.chargedThroughDate
        ? new Date(sub.chargedThroughDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: sub.status === 'CANCELED',
    };
    if (sub.canceledDate) {
      result.canceledAt = new Date(sub.canceledDate);
    }
    return result;
  }

  private mapCustomer(customer: any): Customer {
    const result: Customer = {
      id: customer.id,
      email: customer.emailAddress || '',
      createdAt: new Date(customer.createdAt),
    };
    const fullName = [customer.givenName, customer.familyName].filter(Boolean).join(' ');
    if (fullName) {
      result.name = fullName;
    }
    if (customer.phoneNumber) {
      result.phone = customer.phoneNumber;
    }
    if (customer.address) {
      const addr: Customer['address'] = {
        line1: customer.address.addressLine1 || '',
        city: customer.address.locality || '',
        postalCode: customer.address.postalCode || '',
        country: customer.address.country || '',
      };
      if (customer.address.addressLine2) {
        addr!.line2 = customer.address.addressLine2;
      }
      if (customer.address.administrativeDistrictLevel1) {
        addr!.state = customer.address.administrativeDistrictLevel1;
      }
      result.address = addr;
    }
    return result;
  }

  private mapCard(card: any, isDefault?: boolean): PaymentMethod {
    return {
      id: card.id,
      type: 'card',
      card: {
        brand: card.cardBrand?.toLowerCase() || 'unknown',
        last4: card.last4 || '****',
        expMonth: card.expMonth || 0,
        expYear: card.expYear || 0,
      },
      isDefault: isDefault || false,
      customerId: card.customerId,
    };
  }

  private mapInvoice(invoice: any): Invoice {
    const statusMap: Record<string, Invoice['status']> = {
      DRAFT: 'draft',
      UNPAID: 'open',
      SCHEDULED: 'open',
      PARTIALLY_PAID: 'open',
      PAID: 'paid',
      PARTIALLY_REFUNDED: 'paid',
      REFUNDED: 'void',
      CANCELED: 'void',
      FAILED: 'uncollectible',
      PAYMENT_PENDING: 'open',
    };

    const paymentRequest = invoice.paymentRequests?.[0];
    const totalMoney = paymentRequest?.computedAmountMoney || { amount: '0', currency: 'USD' };

    const result: Invoice = {
      id: invoice.id,
      customerId: invoice.primaryRecipient?.customerId || '',
      status: statusMap[invoice.status] || 'draft',
      amount: {
        amount: Number(totalMoney.amount),
        currency: (totalMoney.currency || 'usd').toLowerCase(),
      },
      amountPaid: {
        amount: 0,
        currency: (totalMoney.currency || 'usd').toLowerCase(),
      },
      amountDue: {
        amount: Number(totalMoney.amount),
        currency: (totalMoney.currency || 'usd').toLowerCase(),
      },
      lineItems: [],
      createdAt: new Date(invoice.createdAt),
    };
    if (paymentRequest?.dueDate) {
      result.dueDate = new Date(paymentRequest.dueDate);
    }
    return result;
  }

  private mapRefund(refund: any): Refund {
    const statusMap: Record<string, Refund['status']> = {
      PENDING: 'pending',
      APPROVED: 'pending',
      REJECTED: 'failed',
      COMPLETED: 'succeeded',
      FAILED: 'failed',
    };

    return {
      id: refund.id,
      paymentId: refund.paymentId,
      amount: {
        amount: Number(refund.amountMoney?.amount || 0),
        currency: (refund.amountMoney?.currency || 'usd').toLowerCase(),
      },
      status: statusMap[refund.status] || 'pending',
      reason: refund.reason,
      createdAt: new Date(refund.createdAt),
    };
  }

  private handleSquareError(error: unknown): PaymentError {
    if (error instanceof ApiError) {
      const firstError = error.errors?.[0];
      return new PaymentError(
        firstError?.detail || error.message,
        firstError?.code || 'square_error',
        'square'
      );
    }
    if (error instanceof Error) {
      return new PaymentError(error.message, 'unknown_error', 'square');
    }
    return new PaymentError('Unknown Square error', 'unknown_error', 'square');
  }
}

/**
 * Create a configured Square provider instance.
 */
export function createSquareProvider(config: SquareConfig): SquareProvider {
  return new SquareProvider(config);
}

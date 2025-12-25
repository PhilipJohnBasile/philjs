/**
 * PhilJS Payments - Unified payment processing with PCI compliance
 *
 * Supports: Stripe, PayPal, Square, Paddle
 * Features: Idempotency, webhook verification, subscription management
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Core Types & Interfaces
// ============================================================================

export type Currency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud' | 'jpy' | string;
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';
export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';

export interface Money {
  amount: number; // Amount in smallest currency unit (cents)
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

// ============================================================================
// Request Types with Idempotency Support
// ============================================================================

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
  expiresIn?: number; // seconds
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
  amount?: Money; // Partial refund if specified
  reason?: RefundReason;
  metadata?: Record<string, string>;
}

export interface WebhookRequest {
  body: string | Buffer;
  signature: string;
  timestamp?: string;
}

// ============================================================================
// Payment Provider Interface
// ============================================================================

export interface PaymentProvider {
  readonly name: 'stripe' | 'paypal' | 'square' | 'paddle';

  // Checkout
  createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession>;
  retrieveCheckout(sessionId: string): Promise<CheckoutSession>;

  // Subscriptions
  createSubscription(request: CreateSubscriptionRequest): Promise<Subscription>;
  retrieveSubscription(subscriptionId: string): Promise<Subscription>;
  updateSubscription(subscriptionId: string, updates: Partial<CreateSubscriptionRequest>): Promise<Subscription>;
  cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription>;
  listSubscriptions(customerId: string): Promise<Subscription[]>;

  // Customers
  createCustomer(request: CreateCustomerRequest): Promise<Customer>;
  retrieveCustomer(customerId: string): Promise<Customer>;
  updateCustomer(customerId: string, updates: Partial<CreateCustomerRequest>): Promise<Customer>;
  deleteCustomer(customerId: string): Promise<void>;

  // Payment Methods
  attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;

  // Invoices
  createInvoice(request: CreateInvoiceRequest): Promise<Invoice>;
  retrieveInvoice(invoiceId: string): Promise<Invoice>;
  finalizeInvoice(invoiceId: string): Promise<Invoice>;
  voidInvoice(invoiceId: string): Promise<Invoice>;
  listInvoices(customerId: string): Promise<Invoice[]>;

  // Refunds
  refund(request: RefundRequest): Promise<Refund>;
  retrieveRefund(refundId: string): Promise<Refund>;

  // Webhooks
  handleWebhook(request: WebhookRequest): Promise<WebhookEvent>;
  verifyWebhookSignature(request: WebhookRequest): boolean;
}

// ============================================================================
// Idempotency Key Generation
// ============================================================================

/**
 * Generate a unique idempotency key for payment requests.
 * Use this to ensure operations are not duplicated on retries.
 */
export function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${randomUUID()}`;
}

/**
 * Create an idempotency key from a deterministic set of values.
 * Useful for ensuring the same operation uses the same key.
 */
export function createDeterministicKey(...values: (string | number)[]): string {
  const hash = values.join(':');
  // Simple hash for deterministic key generation
  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    const char = hash.charCodeAt(i);
    hashValue = ((hashValue << 5) - hashValue) + char;
    hashValue = hashValue & hashValue;
  }
  return `idem_det_${Math.abs(hashValue).toString(36)}`;
}

// ============================================================================
// Provider Registry
// ============================================================================

const providers = new Map<string, PaymentProvider>();

export function registerProvider(provider: PaymentProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): PaymentProvider {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Payment provider "${name}" not registered. Available: ${Array.from(providers.keys()).join(', ')}`);
  }
  return provider;
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}

// ============================================================================
// Unified Payment Functions
// ============================================================================

let defaultProviderName: string | null = null;

export function setDefaultProvider(name: string): void {
  if (!providers.has(name)) {
    throw new Error(`Cannot set default provider: "${name}" not registered`);
  }
  defaultProviderName = name;
}

function getDefaultProvider(): PaymentProvider {
  if (!defaultProviderName) {
    const available = listProviders();
    if (available.length === 0) {
      throw new Error('No payment providers registered');
    }
    if (available.length === 1) {
      return providers.get(available[0])!;
    }
    throw new Error(`Multiple providers available but no default set. Call setDefaultProvider()`);
  }
  return getProvider(defaultProviderName);
}

/**
 * Create a checkout session for one-time or recurring payments.
 * PCI Compliant: Card details never touch your server.
 */
export async function createCheckout(request: CreateCheckoutRequest): Promise<CheckoutSession> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.createCheckout(requestWithKey);
}

/**
 * Create a subscription for recurring billing.
 */
export async function createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.createSubscription(requestWithKey);
}

/**
 * Cancel a subscription immediately or at period end.
 */
export async function cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.cancelSubscription(requestWithKey);
}

/**
 * Create a customer record for payment processing.
 */
export async function createCustomer(request: CreateCustomerRequest): Promise<Customer> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.createCustomer(requestWithKey);
}

/**
 * Attach a payment method to a customer.
 * PCI Compliant: Payment method tokens are created client-side.
 */
export async function attachPaymentMethod(request: AttachPaymentMethodRequest): Promise<PaymentMethod> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.attachPaymentMethod(requestWithKey);
}

/**
 * Create an invoice for a customer.
 */
export async function createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.createInvoice(requestWithKey);
}

/**
 * Process a refund for a payment.
 */
export async function refund(request: RefundRequest): Promise<Refund> {
  const provider = getDefaultProvider();
  const requestWithKey = {
    ...request,
    idempotencyKey: request.idempotencyKey || generateIdempotencyKey(),
  };
  return provider.refund(requestWithKey);
}

/**
 * Handle an incoming webhook from a payment provider.
 * Includes signature verification for security.
 */
export async function handleWebhook(
  providerName: string,
  request: WebhookRequest
): Promise<WebhookEvent> {
  const provider = getProvider(providerName);

  // Verify signature before processing
  if (!provider.verifyWebhookSignature(request)) {
    throw new WebhookVerificationError('Invalid webhook signature');
  }

  return provider.handleWebhook(request);
}

// ============================================================================
// Error Classes
// ============================================================================

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider?: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class WebhookVerificationError extends PaymentError {
  constructor(message: string) {
    super(message, 'webhook_verification_failed');
    this.name = 'WebhookVerificationError';
  }
}

export class IdempotencyError extends PaymentError {
  constructor(message: string, public readonly originalRequestId: string) {
    super(message, 'idempotency_error');
    this.name = 'IdempotencyError';
  }
}

export class SubscriptionError extends PaymentError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'SubscriptionError';
  }
}

// ============================================================================
// PCI Compliance Utilities
// ============================================================================

/**
 * Mask a card number for safe logging/display.
 * Only shows last 4 digits.
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return '****';
  return `****${cleaned.slice(-4)}`;
}

/**
 * Validate that no raw card data is present in an object.
 * Use this before logging payment-related data.
 */
export function validateNoPCI(data: unknown): void {
  const json = JSON.stringify(data);
  const pciPatterns = [
    /\b\d{13,19}\b/, // Card numbers
    /\b\d{3,4}\b.*(?:cvv|cvc|csc)/i, // CVV
    /(?:cvv|cvc|csc).*\b\d{3,4}\b/i,
  ];

  for (const pattern of pciPatterns) {
    if (pattern.test(json)) {
      throw new Error('PCI violation: Raw card data detected in payload');
    }
  }
}

/**
 * Sanitize an object for safe logging by removing sensitive fields.
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(data: T): Partial<T> {
  const sensitiveKeys = ['card', 'cardNumber', 'cvv', 'cvc', 'securityCode', 'password', 'secret'];
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      result[key as keyof T] = '[REDACTED]' as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      result[key as keyof T] = sanitizeForLogging(value as Record<string, unknown>) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

// ============================================================================
// Money Utilities
// ============================================================================

/**
 * Format money for display.
 */
export function formatMoney(money: Money): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency.toUpperCase(),
  });
  return formatter.format(money.amount / 100);
}

/**
 * Convert amount to smallest currency unit (cents).
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert from smallest currency unit to decimal.
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Add two money values (must be same currency).
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add different currencies: ${a.currency} and ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

// ============================================================================
// Re-exports
// ============================================================================

export { StripeProvider, createStripeProvider } from './providers/stripe';
export { PayPalProvider, createPayPalProvider } from './providers/paypal';
export { SquareProvider, createSquareProvider } from './providers/square';
export { PaddleProvider, createPaddleProvider } from './providers/paddle';

export { usePayment, useSubscription, useInvoices } from './hooks';

export {
  PaymentForm,
  SubscriptionManager,
  PricingTable,
  InvoiceList,
} from './components';

export {
  handleStripeWebhook,
  handlePayPalWebhook,
  verifyWebhookSignature,
} from './webhooks';

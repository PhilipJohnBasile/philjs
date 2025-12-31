/**
 * PhilJS Payments - Unified payment processing with PCI compliance
 *
 * Supports: Stripe, PayPal, Square, Paddle
 * Features: Idempotency, webhook verification, subscription management
 */
import { randomUUID } from 'crypto';
// ============================================================================
// Idempotency Key Generation
// ============================================================================
/**
 * Generate a unique idempotency key for payment requests.
 * Use this to ensure operations are not duplicated on retries.
 */
export function generateIdempotencyKey() {
    return `idem_${Date.now()}_${randomUUID()}`;
}
/**
 * Create an idempotency key from a deterministic set of values.
 * Useful for ensuring the same operation uses the same key.
 */
export function createDeterministicKey(...values) {
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
const providers = new Map();
export function registerProvider(provider) {
    providers.set(provider.name, provider);
}
export function getProvider(name) {
    const provider = providers.get(name);
    if (!provider) {
        throw new Error(`Payment provider "${name}" not registered. Available: ${Array.from(providers.keys()).join(', ')}`);
    }
    return provider;
}
export function listProviders() {
    return Array.from(providers.keys());
}
// ============================================================================
// Unified Payment Functions
// ============================================================================
let defaultProviderName = null;
export function setDefaultProvider(name) {
    if (!providers.has(name)) {
        throw new Error(`Cannot set default provider: "${name}" not registered`);
    }
    defaultProviderName = name;
}
function getDefaultProvider() {
    if (!defaultProviderName) {
        const available = listProviders();
        if (available.length === 0) {
            throw new Error('No payment providers registered');
        }
        if (available.length === 1) {
            return providers.get(available[0]);
        }
        throw new Error(`Multiple providers available but no default set. Call setDefaultProvider()`);
    }
    return getProvider(defaultProviderName);
}
/**
 * Create a checkout session for one-time or recurring payments.
 * PCI Compliant: Card details never touch your server.
 */
export async function createCheckout(request) {
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
export async function createSubscription(request) {
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
export async function cancelSubscription(request) {
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
export async function createCustomer(request) {
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
export async function attachPaymentMethod(request) {
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
export async function createInvoice(request) {
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
export async function refund(request) {
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
export async function handleWebhook(providerName, request) {
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
    code;
    provider;
    requestId;
    constructor(message, code, provider, requestId) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.requestId = requestId;
        this.name = 'PaymentError';
    }
}
export class WebhookVerificationError extends PaymentError {
    constructor(message) {
        super(message, 'webhook_verification_failed');
        this.name = 'WebhookVerificationError';
    }
}
export class IdempotencyError extends PaymentError {
    originalRequestId;
    constructor(message, originalRequestId) {
        super(message, 'idempotency_error');
        this.originalRequestId = originalRequestId;
        this.name = 'IdempotencyError';
    }
}
export class SubscriptionError extends PaymentError {
    constructor(message, code) {
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
export function maskCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 4)
        return '****';
    return `****${cleaned.slice(-4)}`;
}
/**
 * Validate that no raw card data is present in an object.
 * Use this before logging payment-related data.
 */
export function validateNoPCI(data) {
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
export function sanitizeForLogging(data) {
    const sensitiveKeys = ['card', 'cardNumber', 'cvv', 'cvc', 'securityCode', 'password', 'secret'];
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
            result[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeForLogging(value);
        }
        else {
            result[key] = value;
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
export function formatMoney(money) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: money.currency.toUpperCase(),
    });
    return formatter.format(money.amount / 100);
}
/**
 * Convert amount to smallest currency unit (cents).
 */
export function toCents(amount) {
    return Math.round(amount * 100);
}
/**
 * Convert from smallest currency unit to decimal.
 */
export function fromCents(cents) {
    return cents / 100;
}
/**
 * Add two money values (must be same currency).
 */
export function addMoney(a, b) {
    if (a.currency !== b.currency) {
        throw new Error(`Cannot add different currencies: ${a.currency} and ${b.currency}`);
    }
    return { amount: a.amount + b.amount, currency: a.currency };
}
// ============================================================================
// Re-exports
// ============================================================================
export { StripeProvider, createStripeProvider } from './providers/stripe.js';
export { PayPalProvider, createPayPalProvider } from './providers/paypal.js';
export { SquareProvider, createSquareProvider } from './providers/square.js';
export { PaddleProvider, createPaddleProvider } from './providers/paddle.js';
export { usePayment, useSubscription, useInvoices } from './hooks.js';
export { PaymentForm, SubscriptionManager, PricingTable, InvoiceList, } from './components/index.js';
export { handleStripeWebhook, handlePayPalWebhook, verifyWebhookSignature, } from './webhooks/index.js';
//# sourceMappingURL=index.js.map
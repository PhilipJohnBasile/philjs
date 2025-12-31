/**
 * @philjs/payments - Test Suite
 * Tests for payment processing utilities, providers, and PCI compliance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Core exports
  generateIdempotencyKey,
  createDeterministicKey,
  registerProvider,
  getProvider,
  listProviders,
  setDefaultProvider,
  // Error classes
  PaymentError,
  WebhookVerificationError,
  IdempotencyError,
  SubscriptionError,
  // PCI utilities
  maskCardNumber,
  validateNoPCI,
  sanitizeForLogging,
  // Money utilities
  formatMoney,
  toCents,
  fromCents,
  addMoney,
  // Types
  type Money,
  type PaymentProvider,
  type Customer,
  type Subscription,
  type Invoice,
  type CheckoutSession,
} from '../index.js';

describe('@philjs/payments', () => {
  describe('Export Verification', () => {
    it('should export idempotency utilities', () => {
      expect(generateIdempotencyKey).toBeDefined();
      expect(typeof generateIdempotencyKey).toBe('function');
      expect(createDeterministicKey).toBeDefined();
      expect(typeof createDeterministicKey).toBe('function');
    });

    it('should export provider registry functions', () => {
      expect(registerProvider).toBeDefined();
      expect(getProvider).toBeDefined();
      expect(listProviders).toBeDefined();
      expect(setDefaultProvider).toBeDefined();
    });

    it('should export error classes', () => {
      expect(PaymentError).toBeDefined();
      expect(WebhookVerificationError).toBeDefined();
      expect(IdempotencyError).toBeDefined();
      expect(SubscriptionError).toBeDefined();
    });

    it('should export PCI utilities', () => {
      expect(maskCardNumber).toBeDefined();
      expect(validateNoPCI).toBeDefined();
      expect(sanitizeForLogging).toBeDefined();
    });

    it('should export money utilities', () => {
      expect(formatMoney).toBeDefined();
      expect(toCents).toBeDefined();
      expect(fromCents).toBeDefined();
      expect(addMoney).toBeDefined();
    });
  });

  describe('Idempotency Key Generation', () => {
    it('should generate unique idempotency keys', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();

      expect(key1).not.toBe(key2);
      expect(key1.startsWith('idem_')).toBe(true);
      expect(key2.startsWith('idem_')).toBe(true);
    });

    it('should generate keys with timestamp', () => {
      const key = generateIdempotencyKey();
      expect(key).toMatch(/^idem_\d+_/);
    });

    it('should generate deterministic keys from same values', () => {
      const key1 = createDeterministicKey('user123', 'order456', 100);
      const key2 = createDeterministicKey('user123', 'order456', 100);

      expect(key1).toBe(key2);
      expect(key1.startsWith('idem_det_')).toBe(true);
    });

    it('should generate different keys for different values', () => {
      const key1 = createDeterministicKey('user123', 'order456');
      const key2 = createDeterministicKey('user123', 'order789');

      expect(key1).not.toBe(key2);
    });
  });

  describe('Payment Errors', () => {
    describe('PaymentError', () => {
      it('should create error with message and code', () => {
        const error = new PaymentError('Payment failed', 'card_declined');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(PaymentError);
        expect(error.message).toBe('Payment failed');
        expect(error.code).toBe('card_declined');
        expect(error.name).toBe('PaymentError');
      });

      it('should include provider information', () => {
        const error = new PaymentError('API error', 'api_error', 'stripe');

        expect(error.provider).toBe('stripe');
      });

      it('should include request ID', () => {
        const error = new PaymentError('Error', 'test', 'stripe', 'req_123');

        expect(error.requestId).toBe('req_123');
      });
    });

    describe('WebhookVerificationError', () => {
      it('should create webhook verification error', () => {
        const error = new WebhookVerificationError('Invalid signature');

        expect(error).toBeInstanceOf(PaymentError);
        expect(error.code).toBe('webhook_verification_failed');
        expect(error.name).toBe('WebhookVerificationError');
      });
    });

    describe('IdempotencyError', () => {
      it('should create idempotency error with original request ID', () => {
        const error = new IdempotencyError('Key already used', 'original_req_123');

        expect(error).toBeInstanceOf(PaymentError);
        expect(error.code).toBe('idempotency_error');
        expect(error.originalRequestId).toBe('original_req_123');
      });
    });

    describe('SubscriptionError', () => {
      it('should create subscription error with code', () => {
        const error = new SubscriptionError('Subscription canceled', 'subscription_canceled');

        expect(error).toBeInstanceOf(PaymentError);
        expect(error.name).toBe('SubscriptionError');
        expect(error.code).toBe('subscription_canceled');
      });
    });
  });

  describe('PCI Compliance Utilities', () => {
    describe('maskCardNumber', () => {
      it('should mask full card number', () => {
        const masked = maskCardNumber('4242424242424242');
        expect(masked).toBe('****4242');
      });

      it('should handle card numbers with spaces', () => {
        const masked = maskCardNumber('4242 4242 4242 4242');
        expect(masked).toBe('****4242');
      });

      it('should handle card numbers with dashes', () => {
        const masked = maskCardNumber('4242-4242-4242-4242');
        expect(masked).toBe('****4242');
      });

      it('should handle short numbers', () => {
        const masked = maskCardNumber('123');
        expect(masked).toBe('****');
      });

      it('should show last 4 digits only', () => {
        const masked = maskCardNumber('5555555555554444');
        expect(masked).toBe('****4444');
      });
    });

    describe('validateNoPCI', () => {
      it('should not throw for safe data', () => {
        expect(() => validateNoPCI({
          customerId: 'cust_123',
          amount: 1000,
          currency: 'usd',
        })).not.toThrow();
      });

      it('should throw for data containing card numbers', () => {
        expect(() => validateNoPCI({
          cardNumber: '4242424242424242',
        })).toThrow('PCI violation');
      });

      it('should detect card numbers in nested objects', () => {
        expect(() => validateNoPCI({
          payment: {
            card: '4111111111111111',
          },
        })).toThrow('PCI violation');
      });
    });

    describe('sanitizeForLogging', () => {
      it('should redact card-related fields', () => {
        const data = {
          customerId: 'cust_123',
          cardNumber: '4242424242424242',
          cvv: '123',
        };

        const sanitized = sanitizeForLogging(data);

        expect(sanitized.customerId).toBe('cust_123');
        expect(sanitized.cardNumber).toBe('[REDACTED]');
        expect(sanitized.cvv).toBe('[REDACTED]');
      });

      it('should redact nested sensitive fields', () => {
        const data = {
          payment: {
            card: '4242',
            amount: 1000,
          },
          user: {
            password: 'secret123',
          },
        };

        const sanitized = sanitizeForLogging(data);

        expect((sanitized.payment as any).card).toBe('[REDACTED]');
        expect((sanitized.payment as any).amount).toBe(1000);
        expect((sanitized.user as any).password).toBe('[REDACTED]');
      });

      it('should preserve non-sensitive data', () => {
        const data = {
          id: 'order_123',
          amount: 5000,
          currency: 'usd',
          status: 'pending',
        };

        const sanitized = sanitizeForLogging(data);

        expect(sanitized).toEqual(data);
      });
    });
  });

  describe('Money Utilities', () => {
    describe('formatMoney', () => {
      it('should format USD correctly', () => {
        const money: Money = { amount: 1000, currency: 'usd' };
        const formatted = formatMoney(money);

        expect(formatted).toContain('10');
        expect(formatted).toContain('$');
      });

      it('should format EUR correctly', () => {
        const money: Money = { amount: 2500, currency: 'eur' };
        const formatted = formatMoney(money);

        expect(formatted).toContain('25');
      });

      it('should handle fractional amounts', () => {
        const money: Money = { amount: 1234, currency: 'usd' };
        const formatted = formatMoney(money);

        expect(formatted).toContain('12');
        expect(formatted).toContain('34');
      });

      it('should handle zero amounts', () => {
        const money: Money = { amount: 0, currency: 'usd' };
        const formatted = formatMoney(money);

        expect(formatted).toContain('0');
      });
    });

    describe('toCents', () => {
      it('should convert dollars to cents', () => {
        expect(toCents(10)).toBe(1000);
        expect(toCents(25.50)).toBe(2550);
        expect(toCents(0.99)).toBe(99);
      });

      it('should handle zero', () => {
        expect(toCents(0)).toBe(0);
      });

      it('should round fractional cents', () => {
        expect(toCents(10.999)).toBe(1100);
        expect(toCents(10.001)).toBe(1000);
      });
    });

    describe('fromCents', () => {
      it('should convert cents to dollars', () => {
        expect(fromCents(1000)).toBe(10);
        expect(fromCents(2550)).toBe(25.50);
        expect(fromCents(99)).toBe(0.99);
      });

      it('should handle zero', () => {
        expect(fromCents(0)).toBe(0);
      });
    });

    describe('addMoney', () => {
      it('should add two money values of same currency', () => {
        const a: Money = { amount: 1000, currency: 'usd' };
        const b: Money = { amount: 500, currency: 'usd' };

        const result = addMoney(a, b);

        expect(result.amount).toBe(1500);
        expect(result.currency).toBe('usd');
      });

      it('should throw when currencies differ', () => {
        const a: Money = { amount: 1000, currency: 'usd' };
        const b: Money = { amount: 500, currency: 'eur' };

        expect(() => addMoney(a, b)).toThrow('Cannot add different currencies');
      });

      it('should handle negative amounts', () => {
        const a: Money = { amount: 1000, currency: 'usd' };
        const b: Money = { amount: -300, currency: 'usd' };

        const result = addMoney(a, b);

        expect(result.amount).toBe(700);
      });
    });
  });

  describe('Provider Registry', () => {
    // Create a mock provider for testing
    const createMockProvider = (name: string): PaymentProvider => ({
      name: name as any,
      createCheckout: vi.fn(),
      retrieveCheckout: vi.fn(),
      createSubscription: vi.fn(),
      retrieveSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      cancelSubscription: vi.fn(),
      listSubscriptions: vi.fn(),
      createCustomer: vi.fn(),
      retrieveCustomer: vi.fn(),
      updateCustomer: vi.fn(),
      deleteCustomer: vi.fn(),
      attachPaymentMethod: vi.fn(),
      detachPaymentMethod: vi.fn(),
      listPaymentMethods: vi.fn(),
      setDefaultPaymentMethod: vi.fn(),
      createInvoice: vi.fn(),
      retrieveInvoice: vi.fn(),
      finalizeInvoice: vi.fn(),
      voidInvoice: vi.fn(),
      listInvoices: vi.fn(),
      refund: vi.fn(),
      retrieveRefund: vi.fn(),
      handleWebhook: vi.fn(),
      verifyWebhookSignature: vi.fn(),
    });

    it('should register and retrieve providers', () => {
      const mockProvider = createMockProvider('stripe');
      registerProvider(mockProvider);

      const retrieved = getProvider('stripe');
      expect(retrieved).toBe(mockProvider);
    });

    it('should list registered providers', () => {
      const mockStripe = createMockProvider('stripe');
      const mockPaypal = createMockProvider('paypal');

      registerProvider(mockStripe);
      registerProvider(mockPaypal);

      const providers = listProviders();
      expect(providers).toContain('stripe');
      expect(providers).toContain('paypal');
    });

    it('should throw when getting unregistered provider', () => {
      expect(() => getProvider('nonexistent')).toThrow('not registered');
    });

    it('should set default provider', () => {
      const mockProvider = createMockProvider('stripe');
      registerProvider(mockProvider);

      expect(() => setDefaultProvider('stripe')).not.toThrow();
    });

    it('should throw when setting unregistered default', () => {
      expect(() => setDefaultProvider('unregistered')).toThrow('not registered');
    });
  });

  describe('Type Definitions', () => {
    it('should have correct Money type structure', () => {
      const money: Money = {
        amount: 1000,
        currency: 'usd',
      };

      expect(money.amount).toBe(1000);
      expect(money.currency).toBe('usd');
    });

    it('should have correct Customer type structure', () => {
      const customer: Customer = {
        id: 'cust_123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };

      expect(customer.id).toBe('cust_123');
      expect(customer.email).toBe('test@example.com');
    });

    it('should have correct Subscription type structure', () => {
      const subscription: Subscription = {
        id: 'sub_123',
        customerId: 'cust_123',
        status: 'active',
        priceId: 'price_123',
        quantity: 1,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      };

      expect(subscription.status).toBe('active');
    });

    it('should have correct CheckoutSession type structure', () => {
      const session: CheckoutSession = {
        id: 'cs_123',
        url: 'https://checkout.example.com',
        status: 'open',
        lineItems: [],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        expiresAt: new Date(),
      };

      expect(session.status).toBe('open');
    });
  });
});

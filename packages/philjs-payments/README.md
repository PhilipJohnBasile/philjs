# @philjs/payments

Payment processing integration for React applications. Unified API for Stripe, PayPal, and other payment providers with secure, PCI-compliant components.

## Installation

```bash
npm install @philjs/payments
# or
yarn add @philjs/payments
# or
pnpm add @philjs/payments
```

## Basic Usage

```tsx
import {
  PaymentProvider,
  PaymentForm,
  CardElement
} from '@philjs/payments';

function Checkout() {
  const handlePayment = async (paymentMethod) => {
    const result = await processPayment(paymentMethod);
    console.log('Payment result:', result);
  };

  return (
    <PaymentProvider
      provider="stripe"
      publicKey={STRIPE_PUBLIC_KEY}
    >
      <PaymentForm onSubmit={handlePayment}>
        <CardElement />
        <button type="submit">Pay $99.00</button>
      </PaymentForm>
    </PaymentProvider>
  );
}
```

## Features

- **Multiple Providers** - Stripe, PayPal, Square, Braintree
- **Card Payments** - Secure credit/debit card processing
- **Digital Wallets** - Apple Pay, Google Pay support
- **Subscriptions** - Recurring billing management
- **Invoicing** - Generate and send invoices
- **Refunds** - Process refunds and cancellations
- **PCI Compliance** - Secure, PCI-DSS compliant components
- **3D Secure** - Strong customer authentication
- **Webhooks** - Handle payment events
- **Multi-Currency** - Support for 135+ currencies
- **Tax Calculation** - Automatic tax computation
- **Fraud Detection** - Built-in fraud prevention

## Components

| Component | Description |
|-----------|-------------|
| `PaymentForm` | Complete payment form |
| `CardElement` | Secure card input |
| `PayPalButton` | PayPal checkout button |
| `ApplePayButton` | Apple Pay button |
| `GooglePayButton` | Google Pay button |
| `PricingTable` | Subscription pricing display |

## Hooks

| Hook | Description |
|------|-------------|
| `usePayment` | Payment processing |
| `useSubscription` | Subscription management |
| `usePaymentMethod` | Saved payment methods |
| `useInvoices` | Invoice history |

## Server-Side

```typescript
import { createPaymentIntent, validateWebhook } from '@philjs/payments/server';

// Create payment intent
const intent = await createPaymentIntent({
  amount: 9900,
  currency: 'usd',
});

// Validate webhook
const event = validateWebhook(payload, signature);
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./providers/stripe, ./providers/paypal, ./providers/square, ./webhooks
- Source files: packages/philjs-payments/src/index.ts, packages/philjs-payments/src/providers/stripe.ts, packages/philjs-payments/src/providers/paypal.ts, packages/philjs-payments/src/providers/square.ts, packages/philjs-payments/src/webhooks/index.ts

### Public API
- Direct exports: Address, AttachPaymentMethodRequest, CancelSubscriptionRequest, CheckoutSession, CreateCheckoutRequest, CreateCustomerRequest, CreateInvoiceRequest, CreateSubscriptionRequest, Currency, Customer, IdempotencyError, IdempotencyOptions, Invoice, InvoiceLineItem, LineItem, Money, PayPalAmount, PayPalCapture, PayPalConfig, PayPalItem, PayPalLink, PayPalOrderResponse, PayPalPayer, PayPalProvider, PayPalPurchaseUnit, PayPalRefundResponse, PaymentError, PaymentMethod, PaymentProvider, PaymentStatus, Refund, RefundReason, RefundRequest, SquareConfig, SquareProvider, StripeConfig, StripeProvider, Subscription, SubscriptionError, SubscriptionStatus, WebhookEvent, WebhookHandler, WebhookRequest, WebhookVerificationError, addMoney, attachPaymentMethod, cancelSubscription, createCheckout, createCustomer, createDeterministicKey, createInvoice, createPayPalProvider, createSquareProvider, createStripeProvider, createSubscription, formatMoney, fromCents, generateIdempotencyKey, getProvider, handlePayPalWebhook, handleStripeWebhook, handleWebhook, listProviders, maskCardNumber, refund, registerProvider, sanitizeForLogging, setDefaultProvider, toCents, validateNoPCI, verifyWebhookSignature
- Re-exported names: InvoiceList, PaddleProvider, PayPalProvider, PaymentForm, PricingTable, SquareProvider, StripeProvider, SubscriptionManager, createPaddleProvider, createPayPalProvider, createSquareProvider, createStripeProvider, handlePayPalWebhook, handleStripeWebhook, useInvoices, usePayment, useSubscription, verifyWebhookSignature
- Re-exported modules: ./components/index.js, ./hooks.js, ./providers/paddle.js, ./providers/paypal.js, ./providers/square.js, ./providers/stripe.js, ./webhooks/index.js
<!-- API_SNAPSHOT_END -->

## License

MIT

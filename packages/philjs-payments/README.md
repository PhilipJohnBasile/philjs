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

## License

MIT

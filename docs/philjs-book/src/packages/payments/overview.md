# @philjs/payments

Unified payment processing with PCI compliance, supporting Stripe, PayPal, Square, and Paddle. Features idempotency keys, webhook verification, subscription management, and invoicing.

## Installation

```bash
npm install @philjs/payments
```

## Features

- **Multi-Provider Support** - Stripe, PayPal, Square, Paddle
- **PCI Compliant** - Card details never touch your server
- **Idempotency Keys** - Prevent duplicate charges on retries
- **Webhook Verification** - Secure signature verification
- **Subscription Management** - Create, update, cancel subscriptions
- **Invoice Management** - Create and manage invoices
- **Money Utilities** - Format, convert, and add money values
- **React Hooks** - Easy integration with components

## Quick Start

```typescript
import {
  createStripeProvider,
  registerProvider,
  setDefaultProvider,
  createCheckout,
} from '@philjs/payments';

// Register Stripe as payment provider
const stripe = createStripeProvider({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
});

registerProvider(stripe);
setDefaultProvider('stripe');

// Create a checkout session
const session = await createCheckout({
  lineItems: [
    {
      name: 'Pro Plan',
      amount: { amount: 2999, currency: 'usd' },
      quantity: 1,
    },
  ],
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
});

// Redirect user to session.url
```

## Provider Setup

### Stripe

```typescript
import { createStripeProvider, registerProvider } from '@philjs/payments';

const stripe = createStripeProvider({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: '2024-12-18',
});

registerProvider(stripe);
```

### PayPal

```typescript
import { createPayPalProvider, registerProvider } from '@philjs/payments';

const paypal = createPayPalProvider({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
  sandbox: process.env.NODE_ENV !== 'production',
});

registerProvider(paypal);
```

### Square

```typescript
import { createSquareProvider, registerProvider } from '@philjs/payments';

const square = createSquareProvider({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  locationId: process.env.SQUARE_LOCATION_ID,
  environment: 'production', // or 'sandbox'
});

registerProvider(square);
```

### Paddle

```typescript
import { createPaddleProvider, registerProvider } from '@philjs/payments';

const paddle = createPaddleProvider({
  vendorId: process.env.PADDLE_VENDOR_ID,
  apiKey: process.env.PADDLE_API_KEY,
  publicKey: process.env.PADDLE_PUBLIC_KEY,
});

registerProvider(paddle);
```

### Multiple Providers

```typescript
import { registerProvider, setDefaultProvider, getProvider } from '@philjs/payments';

// Register multiple providers
registerProvider(stripeProvider);
registerProvider(paypalProvider);

// Set default
setDefaultProvider('stripe');

// Get specific provider
const paypal = getProvider('paypal');

// List all providers
const providers = listProviders(); // ['stripe', 'paypal']
```

## Checkout Sessions

### Creating a Checkout

```typescript
import { createCheckout, generateIdempotencyKey } from '@philjs/payments';

const session = await createCheckout({
  // Customer (optional - creates or links existing)
  customerId: 'cus_123',
  customerEmail: 'user@example.com',

  // Line items
  lineItems: [
    {
      name: 'Premium Plan',
      description: 'Monthly subscription',
      amount: { amount: 4999, currency: 'usd' }, // $49.99
      quantity: 1,
      imageUrl: 'https://example.com/product.png',
    },
  ],

  // Redirect URLs
  successUrl: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://example.com/cancel',

  // Mode
  mode: 'subscription', // 'payment' | 'subscription' | 'setup'

  // Metadata
  metadata: {
    userId: 'user_123',
    planId: 'premium',
  },

  // Expiration
  expiresIn: 30 * 60, // 30 minutes

  // Idempotency (auto-generated if not provided)
  idempotencyKey: generateIdempotencyKey(),
});

// Redirect to checkout
redirect(session.url);
```

### Retrieving Checkout Status

```typescript
import { getProvider } from '@philjs/payments';

const provider = getProvider('stripe');
const session = await provider.retrieveCheckout(sessionId);

if (session.status === 'complete') {
  // Payment successful
  grantAccess(session.customerId);
}
```

## Subscriptions

### Creating a Subscription

```typescript
import { createSubscription } from '@philjs/payments';

const subscription = await createSubscription({
  customerId: 'cus_123',
  priceId: 'price_monthly_pro',
  quantity: 1,

  // Trial period
  trialDays: 14,

  // Payment method (if customer has multiple)
  paymentMethodId: 'pm_123',

  // Auto-cancel at period end
  cancelAtPeriodEnd: false,

  metadata: {
    feature: 'pro',
  },
});

console.log(subscription.status); // 'active' or 'trialing'
console.log(subscription.currentPeriodEnd); // Next billing date
```

### Updating a Subscription

```typescript
const provider = getProvider('stripe');

const updated = await provider.updateSubscription('sub_123', {
  priceId: 'price_yearly_pro', // Change plan
  quantity: 5, // Change seats
});
```

### Canceling a Subscription

```typescript
import { cancelSubscription } from '@philjs/payments';

// Cancel at period end (graceful)
const subscription = await cancelSubscription({
  subscriptionId: 'sub_123',
  immediately: false,
  reason: 'Customer requested downgrade',
});

// Cancel immediately
const cancelled = await cancelSubscription({
  subscriptionId: 'sub_123',
  immediately: true,
});
```

### Listing Subscriptions

```typescript
const provider = getProvider('stripe');
const subscriptions = await provider.listSubscriptions('cus_123');

for (const sub of subscriptions) {
  console.log({
    id: sub.id,
    status: sub.status,
    nextBillingDate: sub.currentPeriodEnd,
    willCancel: sub.cancelAtPeriodEnd,
  });
}
```

## Customers

### Creating a Customer

```typescript
import { createCustomer } from '@philjs/payments';

const customer = await createCustomer({
  email: 'user@example.com',
  name: 'John Doe',
  phone: '+1-555-123-4567',
  address: {
    line1: '123 Main St',
    line2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US',
  },
  metadata: {
    userId: 'user_123',
  },
});
```

### Managing Customers

```typescript
const provider = getProvider('stripe');

// Retrieve
const customer = await provider.retrieveCustomer('cus_123');

// Update
const updated = await provider.updateCustomer('cus_123', {
  email: 'newemail@example.com',
});

// Delete
await provider.deleteCustomer('cus_123');
```

## Payment Methods

### Attaching Payment Methods

```typescript
import { attachPaymentMethod } from '@philjs/payments';

// Payment method token created client-side (PCI compliant)
const paymentMethod = await attachPaymentMethod({
  customerId: 'cus_123',
  paymentMethodId: 'pm_card_token_from_client',
  setAsDefault: true,
});
```

### Managing Payment Methods

```typescript
const provider = getProvider('stripe');

// List payment methods
const methods = await provider.listPaymentMethods('cus_123');

for (const method of methods) {
  console.log({
    id: method.id,
    type: method.type,
    card: method.card ? `${method.card.brand} ****${method.card.last4}` : null,
    isDefault: method.isDefault,
  });
}

// Set default
await provider.setDefaultPaymentMethod('cus_123', 'pm_456');

// Remove
await provider.detachPaymentMethod('pm_456');
```

## Invoices

### Creating an Invoice

```typescript
import { createInvoice } from '@philjs/payments';

const invoice = await createInvoice({
  customerId: 'cus_123',
  lineItems: [
    {
      description: 'Consulting Services - January 2025',
      amount: { amount: 150000, currency: 'usd' }, // $1,500.00
      quantity: 1,
      periodStart: new Date('2025-01-01'),
      periodEnd: new Date('2025-01-31'),
    },
    {
      description: 'Setup Fee',
      amount: { amount: 25000, currency: 'usd' },
      quantity: 1,
    },
  ],
  dueDate: new Date('2025-02-15'),
  autoAdvance: true, // Automatically finalize and send
  metadata: {
    projectId: 'proj_123',
  },
});
```

### Managing Invoices

```typescript
const provider = getProvider('stripe');

// Retrieve
const invoice = await provider.retrieveInvoice('inv_123');

// Finalize (send to customer)
await provider.finalizeInvoice('inv_123');

// Void (cancel before payment)
await provider.voidInvoice('inv_123');

// List customer invoices
const invoices = await provider.listInvoices('cus_123');
```

## Refunds

### Processing Refunds

```typescript
import { refund } from '@philjs/payments';

// Full refund
const fullRefund = await refund({
  paymentId: 'pi_123',
  reason: 'requested_by_customer',
});

// Partial refund
const partialRefund = await refund({
  paymentId: 'pi_123',
  amount: { amount: 1000, currency: 'usd' }, // Refund $10.00
  reason: 'duplicate',
  metadata: {
    supportTicket: 'ticket_456',
  },
});
```

## Webhooks

### Handling Webhooks

```typescript
import { handleWebhook } from '@philjs/payments';

// Express/Node.js endpoint
app.post('/webhooks/stripe', async (req, res) => {
  try {
    const event = await handleWebhook('stripe', {
      body: req.rawBody, // Raw request body
      signature: req.headers['stripe-signature'],
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return res.status(400).send('Invalid signature');
    }
    throw error;
  }
});
```

### Provider-Specific Webhooks

```typescript
import { handleStripeWebhook, handlePayPalWebhook } from '@philjs/payments';

// Stripe webhook
app.post('/webhooks/stripe', async (req, res) => {
  const event = await handleStripeWebhook(req.rawBody, req.headers['stripe-signature']);
  // Process event...
});

// PayPal webhook
app.post('/webhooks/paypal', async (req, res) => {
  const event = await handlePayPalWebhook(req.body, req.headers);
  // Process event...
});
```

## Idempotency

### Automatic Idempotency

```typescript
import { createCheckout, generateIdempotencyKey } from '@philjs/payments';

// Key is auto-generated if not provided
const session1 = await createCheckout({ ... });

// Or generate explicitly
const key = generateIdempotencyKey();
const session2 = await createCheckout({
  ...request,
  idempotencyKey: key,
});
```

### Deterministic Keys

```typescript
import { createDeterministicKey } from '@philjs/payments';

// Same inputs = same key (good for retry logic)
const key = createDeterministicKey(
  'checkout',
  userId,
  orderId,
  Date.now().toString(),
);

// Safe to retry - won't create duplicate charges
const session = await createCheckout({
  ...request,
  idempotencyKey: key,
});
```

## PCI Compliance Utilities

### Masking Card Numbers

```typescript
import { maskCardNumber } from '@philjs/payments';

const masked = maskCardNumber('4242424242424242');
console.log(masked); // '****4242'
```

### Validating No PCI Data

```typescript
import { validateNoPCI } from '@philjs/payments';

// Throws if card data detected
try {
  validateNoPCI(requestPayload);
  // Safe to log/store
} catch (error) {
  // PCI violation - don't proceed
  console.error('Card data detected in payload!');
}
```

### Sanitizing for Logging

```typescript
import { sanitizeForLogging } from '@philjs/payments';

const safeData = sanitizeForLogging({
  customerId: 'cus_123',
  card: { number: '4242...', cvv: '123' },
  amount: 1000,
});

console.log(safeData);
// { customerId: 'cus_123', card: '[REDACTED]', amount: 1000 }
```

## Money Utilities

### Formatting Money

```typescript
import { formatMoney, toCents, fromCents, addMoney } from '@philjs/payments';

// Format for display
const formatted = formatMoney({ amount: 4999, currency: 'usd' });
console.log(formatted); // '$49.99'

// Convert to cents (smallest unit)
const cents = toCents(49.99);
console.log(cents); // 4999

// Convert from cents
const dollars = fromCents(4999);
console.log(dollars); // 49.99

// Add money values
const total = addMoney(
  { amount: 2500, currency: 'usd' },
  { amount: 1500, currency: 'usd' },
);
console.log(total); // { amount: 4000, currency: 'usd' }
```

## React Components

### PaymentForm

```typescript
import { PaymentForm } from '@philjs/payments';

function Checkout({ customerId }) {
  return (
    <PaymentForm
      customerId={customerId}
      amount={{ amount: 2999, currency: 'usd' }}
      onSuccess={(payment) => {
        console.log('Payment successful:', payment.id);
      }}
      onError={(error) => {
        console.error('Payment failed:', error.message);
      }}
    />
  );
}
```

### SubscriptionManager

```typescript
import { SubscriptionManager } from '@philjs/payments';

function MySubscription({ customerId }) {
  return (
    <SubscriptionManager
      customerId={customerId}
      onPlanChange={(newPlan) => {
        console.log('Changed to:', newPlan);
      }}
      onCancel={() => {
        console.log('Subscription cancelled');
      }}
    />
  );
}
```

### PricingTable

```typescript
import { PricingTable } from '@philjs/payments';

function Pricing() {
  return (
    <PricingTable
      plans={[
        { id: 'basic', name: 'Basic', price: { amount: 999, currency: 'usd' } },
        { id: 'pro', name: 'Pro', price: { amount: 2999, currency: 'usd' } },
      ]}
      onSelectPlan={(planId) => {
        startCheckout(planId);
      }}
    />
  );
}
```

## React Hooks

### usePayment

```typescript
import { usePayment } from '@philjs/payments';

function PaymentButton({ amount }) {
  const { createPayment, isLoading, error } = usePayment();

  const handlePay = async () => {
    const session = await createPayment({
      amount,
      successUrl: '/success',
      cancelUrl: '/cancel',
    });
    window.location.href = session.url;
  };

  return (
    <button onClick={handlePay} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Pay Now'}
    </button>
  );
}
```

### useSubscription

```typescript
import { useSubscription } from '@philjs/payments';

function SubscriptionStatus({ subscriptionId }) {
  const { subscription, cancel, isLoading } = useSubscription(subscriptionId);

  if (!subscription) return <p>Loading...</p>;

  return (
    <div>
      <p>Status: {subscription.status}</p>
      <p>Next billing: {subscription.currentPeriodEnd.toLocaleDateString()}</p>
      <button onClick={() => cancel()} disabled={isLoading}>
        Cancel Subscription
      </button>
    </div>
  );
}
```

### useInvoices

```typescript
import { useInvoices } from '@philjs/payments';

function InvoiceHistory({ customerId }) {
  const { invoices, isLoading } = useInvoices(customerId);

  if (isLoading) return <p>Loading...</p>;

  return (
    <ul>
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          {formatMoney(invoice.amount)} - {invoice.status}
          {invoice.invoicePdf && (
            <a href={invoice.invoicePdf}>Download</a>
          )}
        </li>
      ))}
    </ul>
  );
}
```

## Types Reference

```typescript
// Currency codes
type Currency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud' | 'jpy' | string;

// Payment status
type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';

// Subscription status
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';

// Money representation (amounts in smallest unit)
interface Money {
  amount: number;  // In cents
  currency: Currency;
}

// Customer
interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, string>;
  createdAt: Date;
}

// Payment method
interface PaymentMethod {
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

// Checkout session
interface CheckoutSession {
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

// Subscription
interface Subscription {
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

// Invoice
interface Invoice {
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

// Refund
interface Refund {
  id: string;
  paymentId: string;
  amount: Money;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason?: RefundReason;
  createdAt: Date;
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `createCheckout(request)` | Create checkout session |
| `createSubscription(request)` | Create subscription |
| `cancelSubscription(request)` | Cancel subscription |
| `createCustomer(request)` | Create customer |
| `attachPaymentMethod(request)` | Attach payment method |
| `createInvoice(request)` | Create invoice |
| `refund(request)` | Process refund |
| `handleWebhook(provider, request)` | Handle webhook |

### Utilities

| Function | Description |
|----------|-------------|
| `generateIdempotencyKey()` | Generate unique idempotency key |
| `createDeterministicKey(...values)` | Create deterministic key |
| `maskCardNumber(number)` | Mask card number |
| `validateNoPCI(data)` | Validate no PCI data present |
| `sanitizeForLogging(data)` | Remove sensitive data |
| `formatMoney(money)` | Format money for display |
| `toCents(amount)` | Convert to cents |
| `fromCents(cents)` | Convert from cents |
| `addMoney(a, b)` | Add money values |

### Provider Functions

| Function | Description |
|----------|-------------|
| `registerProvider(provider)` | Register payment provider |
| `setDefaultProvider(name)` | Set default provider |
| `getProvider(name)` | Get specific provider |
| `listProviders()` | List registered providers |

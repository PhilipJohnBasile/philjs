# Tutorial: Building a SaaS Starter

In this tutorial, we'll build a complete SaaS application with Authentication, Stripe Payments, and Organization management.

## Prerequisites
- Node.js 22+
- Stripe Account
- Supabase Account

## 1. Project Setup
```bash
npx create-philjs-app saas-starter --template enterprise
cd saas-starter
npm install
```

## 2. Authentication
We'll use `@philjs/auth` with Supabase.

```typescript
// src/auth.ts
import { createSupabaseAuth } from '@philjs/nexus/adapters/supabase-auth';

export const auth = createSupabaseAuth({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY
});
```

## 3. Stripe Integration
Install `@philjs/stripe` and setup the subscriptions webhook.

```typescript
// src/api/webhook.ts
import { stripeWebhook } from '@philjs/stripe';

export const POST = stripeWebhook({
  secret: process.env.STRIPE_WEBHOOK_SECRET,
  onSubscriptionUpdated: async (sub) => {
    // Update user plan in DB
  }
});
```

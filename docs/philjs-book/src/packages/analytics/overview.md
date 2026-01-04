# @philjs/analytics

**The first truly privacy-preserving, zero-cookie analytics engine.**

Unlike traditional analytics (Google Analytics, Mixpanel) that rely on intrusive tracking and third-party cookies, `@philjs/analytics` uses **Differential Privacy** and **HyperLogLog** probabilistic data structures to give you accurate aggregate insights without ever identifying individual users.

## Why Native Analytics?

1.  **Zero Cookies**: No GDPR cookie banners required.
2.  **100% Ownership**: Data never leaves your infrastructure (or specific Edge location).
3.  **Client-Side Processing**: Complex metrics are aggregated on the *client* and only anonymous counters are sent to the server.
4.  **Differential Privacy**: Noise is mathematically injected into the data so that no individual user can be re-identified, while the aggregate remains accurate.

## Installation

```bash
npm install @philjs/analytics
```

## Usage

### Basic Tracking

```typescript
import { useAnalytics } from '@philjs/analytics';

export function ProductPage() {
  const { track } = useAnalytics();

  return (
    <button onClick={() => track('add_to_cart', { id: '123' })}>
      Add to Cart
    </button>
  );
}
```

### Privacy Features

The engine uses **HyperLogLog (HLL)** to count unique users without storing IDs.

```typescript
import { createAnalytics } from '@philjs/analytics';

const analytics = createAnalytics({
  // Privacy Level: 'strict' (default) | 'balanced' | 'none'
  privacy: 'strict', 
  
  // Differential Privacy Epsilon (lower = more privacy, less accuracy)
  epsilon: 0.1, 
});

// Sends a HLL sketch update, not a User ID
analytics.countUnique('daily_visitors'); 
```

## Architecture

1.  **Client**: Generates a local sketch of the data (e.g., "User visited X").
2.  **Edge**: Receives sketches from thousands of clients and merges them.
3.  **Storage**: Stores *only* the merged probabilistic structures. It is mathematically impossible to extract a single user's data from the merged HLL.

## Visualizing Data

PhilJS includes a built-in dashboard component for these metrics:

```tsx
import { PrivacyDashboard } from '@philjs/analytics/ui';

export function Admin() {
  return <PrivacyDashboard source="/api/analytics" />;
}
```

## VS Google Analytics

| Feature | PhilJS Analytics | Google Analytics 4 |
|BC|---|---|
| **Cookies** | None | persistent _ga cookies |
| **GDPR Consent** | Not Required | Required |
| **Data Ownership** | You | Google |
| **Accuracy** | Probabilistic (>99%) | Exact (sampled) |
| **User ID** | Impossible to reverse | Stored |

## Comparison

If you need standard marketing analytics (attribution, retargeting), use `@philjs/plugin-analytics` to integrate GA4. Use `@philjs/analytics` for product health, error rates, and usage stats where privacy is paramount.

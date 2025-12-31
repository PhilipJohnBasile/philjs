# Analytics Plugin Examples

This directory contains examples of how to use the PhilJS Analytics Plugin.

## Examples

### Basic Setup

- **[basic-ga4.ts](./basic-ga4.ts)** - Google Analytics 4 setup
- **[basic-plausible.ts](./basic-plausible.ts)** - Plausible Analytics setup
- **[basic-mixpanel.ts](./basic-mixpanel.ts)** - Mixpanel setup

### Advanced Usage

- **[custom-events.ts](./custom-events.ts)** - Track custom events, user identification
- **[ecommerce-tracking.ts](./ecommerce-tracking.ts)** - E-commerce tracking (products, purchases)
- **[auto-tracking.ts](./auto-tracking.ts)** - Automatic click and form tracking

## Quick Start

### 1. Install the plugin

```bash
npm install @philjs/plugin-analytics
```

### 2. Configure in your PhilJS app

```typescript
// philjs.config.ts
import { createAnalyticsPlugin } from "@philjs/plugin-analytics";

export default {
  plugins: [
    createAnalyticsPlugin({
      provider: "ga4",
      trackingId: "G-XXXXXXXXXX",
    }),
  ],
};
```

### 3. Track events in your app

```typescript
import { trackEvent } from "@philjs/plugin-analytics/client";

function handleClick() {
  trackEvent("button_click", {
    button_name: "signup",
  });
}
```

## Providers

### Google Analytics 4 (GA4)

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
  },
});
```

### Plausible

```typescript
createAnalyticsPlugin({
  provider: "plausible",
  trackingId: "yourdomain.com",
  options: {
    domain: "yourdomain.com",
  },
});
```

### Mixpanel

```typescript
createAnalyticsPlugin({
  provider: "mixpanel",
  trackingId: "YOUR_PROJECT_TOKEN",
  options: {
    persistence: "localStorage",
  },
});
```

## Features

### Privacy Controls

```typescript
privacy: {
  anonymizeIp: true,        // Anonymize IP addresses
  respectDnt: true,         // Respect Do Not Track
  cookieConsent: true,      // Require cookie consent
  cookieDomain: ".example.com",
  cookieExpires: 365,       // Days
}
```

### Auto-Tracking

```typescript
customEvents: {
  pageViews: true,     // Auto-track page views
  clicks: true,        // Auto-track clicks
  forms: true,         // Auto-track forms
  errors: true,        // Auto-track errors
  performance: true,   // Auto-track performance
}
```

### Custom Events

```typescript
import { trackEvent } from "@philjs/plugin-analytics/client";

trackEvent("custom_event", {
  category: "engagement",
  action: "click",
  label: "hero_button",
});
```

### User Identification

```typescript
import { identifyUser } from "@philjs/plugin-analytics/client";

identifyUser("user123", {
  email: "user@example.com",
  plan: "premium",
});
```

### E-commerce

```typescript
import { trackTransaction } from "@philjs/plugin-analytics/client";

trackTransaction({
  transaction_id: "T12345",
  value: 99.99,
  currency: "USD",
  items: [{
    item_id: "SKU123",
    item_name: "Product Name",
    price: 99.99,
  }],
});
```

## Development

Disable analytics in development:

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  disableInDev: true,  // Default: true
  debug: true,         // Enable console logs
});
```

## Learn More

- [Main README](../README.md)
- [PhilJS Documentation](https://philjs.dev)

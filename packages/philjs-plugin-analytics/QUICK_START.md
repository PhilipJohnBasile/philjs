# Quick Start Guide - PhilJS Analytics Plugin

Get up and running with analytics in under 5 minutes.

## Installation

```bash
npm install philjs-plugin-analytics
```

## Basic Setup

### 1. Configure the Plugin

Create or update your `philjs.config.ts`:

```typescript
import { createAnalyticsPlugin } from "philjs-plugin-analytics";

export default {
  plugins: [
    createAnalyticsPlugin({
      provider: "ga4", // or "plausible", "mixpanel"
      trackingId: "G-XXXXXXXXXX", // Your tracking ID
    }),
  ],
};
```

### 2. Start Tracking

The plugin automatically creates `src/lib/analytics.ts`. Use it in your app:

```typescript
import { trackEvent } from "./lib/analytics";

function handleButtonClick() {
  trackEvent("button_click", {
    button_name: "signup",
    location: "homepage",
  });
}
```

## That's It!

Page views and errors are tracked automatically. You're ready to go!

## Common Use Cases

### Track User Signup

```typescript
import { identifyUser, trackEvent } from "./lib/analytics";

async function onSignup(userId: string, email: string) {
  // Identify the user
  identifyUser(userId, { email });

  // Track the signup event
  trackEvent("signup", {
    method: "email",
    timestamp: Date.now(),
  });
}
```

### Track Product Purchase

```typescript
import { trackTransaction } from "./lib/analytics";

function onPurchaseComplete(order: Order) {
  trackTransaction({
    transaction_id: order.id,
    value: order.total,
    currency: "USD",
    items: order.items.map((item) => ({
      item_id: item.sku,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}
```

### Auto-Track Clicks

Add `data-track-click` to any element:

```html
<button
  data-track-click="cta_button"
  data-track-location="hero"
>
  Get Started
</button>
```

Enable click tracking in config:

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  customEvents: {
    clicks: true, // Enable auto-tracking
  },
});
```

## Provider-Specific Setup

### Google Analytics 4

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  privacy: {
    anonymizeIp: true,
  },
});
```

### Plausible Analytics

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

## Privacy Controls

Enable privacy features:

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  privacy: {
    anonymizeIp: true,      // Anonymize IP addresses
    respectDnt: true,       // Respect Do Not Track
    cookieConsent: false,   // Require cookie consent
  },
});
```

## Development Mode

Analytics is automatically disabled in development:

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  disableInDev: true, // Default: true
  debug: true,        // See logs in console
});
```

## Auto-Tracking Features

Enable automatic tracking:

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  customEvents: {
    pageViews: true,    // Track page navigation
    errors: true,       // Track JavaScript errors
    clicks: true,       // Track clicks on marked elements
    forms: true,        // Track form submissions
    performance: true,  // Track performance metrics
  },
});
```

## Troubleshooting

### Analytics not working?

1. **Check your tracking ID** - Make sure it's correct for your provider
2. **Enable debug mode** - Set `debug: true` in config
3. **Check browser console** - Look for error messages
4. **Verify DNT is disabled** - Do Not Track can block analytics

### Events not showing up?

1. **Wait a few minutes** - Some providers have a delay
2. **Check network tab** - See if requests are being sent
3. **Verify initialization** - Make sure analytics.init() was called
4. **Test in production mode** - Analytics may be disabled in dev

## Next Steps

- Read the [full README](./README.md) for detailed documentation
- Check out [examples](./examples/) for more use cases
- Review [implementation guide](./IMPLEMENTATION.md) for architecture details

## Need Help?

- Check the [examples directory](./examples/)
- Read the [API documentation](./README.md#api-reference)
- Open an issue on GitHub

Happy tracking!

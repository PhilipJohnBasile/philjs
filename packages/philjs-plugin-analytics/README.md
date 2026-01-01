# philjs-plugin-analytics

Universal analytics integration for PhilJS - support for Google Analytics, Plausible, Mixpanel, and more.

## Features

- **Multiple Providers** - Support for 8+ analytics platforms
- **Privacy First** - Built-in privacy controls (DNT, IP anonymization)
- **Auto Tracking** - Page views, errors, and custom events
- **Type Safe** - Full TypeScript support
- **Zero Config** - Works out of the box

## Supported Providers

- Google Analytics 4 (GA4)
- Plausible
- Mixpanel
- Amplitude
- Segment
- PostHog
- Umami
- Fathom

## Installation

```bash
# Using PhilJS CLI
philjs plugin add philjs-plugin-analytics

# Or with npm
npm install philjs-plugin-analytics
```

## Usage

### Google Analytics 4

```typescript
import analytics from 'philjs-plugin-analytics';

export default defineConfig({
  plugins: [
    analytics({
      provider: 'ga4',
      trackingId: 'G-XXXXXXXXXX',
    }),
  ],
});
```

### Plausible

```typescript
analytics({
  provider: 'plausible',
  trackingId: 'yourdomain.com',
})
```

### Mixpanel

```typescript
analytics({
  provider: 'mixpanel',
  trackingId: 'YOUR_PROJECT_TOKEN',
})
```

## Configuration

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `provider` | `AnalyticsProvider` | Analytics provider | Yes |
| `trackingId` | `string` | Tracking ID or API key | Yes |
| `debug` | `boolean` | Enable debug mode | No |
| `disableInDev` | `boolean` | Disable in development | No (default: `true`) |
| `privacy` | `PrivacyOptions` | Privacy settings | No |
| `customEvents` | `CustomEventOptions` | Event tracking options | No |

### Privacy Options

```typescript
privacy: {
  anonymizeIp: true,      // Anonymize IP addresses
  respectDnt: true,       // Respect Do Not Track
  cookieConsent: false    // Require cookie consent
}
```

### Custom Event Tracking

```typescript
customEvents: {
  pageViews: true,   // Track page views automatically
  clicks: false,     // Track clicks
  forms: false,      // Track form submissions
  errors: true       // Track errors
}
```

## API Usage

The plugin generates a tracking API at `src/lib/analytics.ts`:

```typescript
import { trackEvent, identifyUser, setUserProperties } from './lib/analytics';

// Track custom events
trackEvent('button_click', {
  button_name: 'signup',
  location: 'homepage',
});

// Identify users (Mixpanel, Amplitude)
identifyUser('user-123', {
  email: 'user@example.com',
  plan: 'premium',
});

// Set user properties (GA4)
setUserProperties({
  user_type: 'premium',
  signup_date: '2024-01-01',
});
```

## Auto-Tracking

### Page Views

Automatically tracked for:
- Initial page load
- SPA navigation (pushState/replaceState)
- Hash changes
- Back/forward navigation

### Error Tracking

Automatically tracks:
- JavaScript errors
- Unhandled promise rejections
- Network errors

## Privacy & GDPR

### Respect Do Not Track

```typescript
import { analyticsUtils } from 'philjs-plugin-analytics';

if (analyticsUtils.hasDNT()) {
  // User has DNT enabled
  // Analytics won't load
}
```

### Cookie Consent

```typescript
analytics({
  privacy: {
    cookieConsent: true,
  },
})

// Later, after user consent
window.grantAnalyticsConsent();
```

## Utilities

```typescript
import { analyticsUtils } from 'philjs-plugin-analytics';

// Check DNT status
const hasDNT = analyticsUtils.hasDNT();

// Generate session ID
const sessionId = analyticsUtils.generateSessionId();

// Get user agent info
const userAgent = analyticsUtils.getUserAgent();

// Get page metadata
const metadata = analyticsUtils.getPageMetadata();
```

## Provider-Specific Features

### Google Analytics 4

- Enhanced measurement
- Custom dimensions
- User properties
- E-commerce tracking
- Automatic page view tracking
- Event parameters
- User ID tracking

### Plausible

- Privacy-focused analytics
- No cookies by default
- GDPR compliant
- Lightweight script (< 1KB)
- Hash-based routing support
- Custom events
- Goals tracking

### Mixpanel

- User identification
- User profiles
- People properties
- Cohort analysis
- A/B testing
- Funnel analysis
- Revenue tracking

## Examples

### E-commerce Tracking (GA4)

```typescript
import { trackEvent } from './lib/analytics';

// Track purchase
trackEvent('purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  items: [{
    item_id: 'SKU123',
    item_name: 'Product Name',
    price: 99.99,
  }],
});
```

### User Funnel (Mixpanel)

```typescript
import { trackEvent } from './lib/analytics';

// Track funnel steps
trackEvent('viewed_product');
trackEvent('added_to_cart');
trackEvent('started_checkout');
trackEvent('completed_purchase');
```

## TypeScript

Full type safety:

```typescript
import type { AnalyticsPluginConfig, AnalyticsProvider } from 'philjs-plugin-analytics';

const config: AnalyticsPluginConfig = {
  provider: 'ga4',
  trackingId: 'G-XXXXXXXXXX',
  privacy: {
    anonymizeIp: true,
  },
};
```

## Advanced Features

### Session Management

The plugin automatically manages user sessions:

```typescript
import { analytics } from 'philjs-plugin-analytics/client';

// Get current session context
const context = analytics.getContext();
console.log(context.sessionId); // Unique session ID
console.log(context.pageLoadTime); // Page load timestamp
```

### Performance Tracking

Track Web Vitals and custom performance metrics:

```typescript
customEvents: {
  performance: true, // Auto-track performance metrics
}
```

### Cookie Management

Control cookie behavior:

```typescript
privacy: {
  cookieDomain: '.example.com',
  cookieExpires: 365, // Days
}
```

### Development vs Production

```typescript
// Automatically disabled in development
disableInDev: true,

// Enable debug logging
debug: true,
```

## API Reference

### Plugin Configuration

```typescript
interface AnalyticsPluginConfig {
  provider: AnalyticsProvider;
  trackingId: string;
  options?: ProviderOptions;
  debug?: boolean;
  disableInDev?: boolean;
  privacy?: PrivacyOptions;
  customEvents?: CustomEventOptions;
}
```

### Client Methods

```typescript
// Track custom event
trackEvent(name: string, properties?: Record<string, any>): void

// Track page view
trackPageView(url?: string, title?: string): void

// Identify user
identifyUser(userId: string, traits?: Record<string, any>): void

// Set user properties
setUserProperties(properties: Record<string, any>): void

// Track transaction
trackTransaction(transaction: EcommerceTransaction): void
```

## Troubleshooting

### Analytics not loading

1. Check that your tracking ID is correct
2. Verify DNT is not enabled
3. Check browser console for errors
4. Enable debug mode: `debug: true`

### Events not tracked

1. Ensure analytics is initialized
2. Check that provider script loaded
3. Verify event properties are valid
4. Check network tab for analytics requests

### Privacy issues

1. Enable IP anonymization: `anonymizeIp: true`
2. Respect DNT: `respectDnt: true`
3. Use privacy-focused provider like Plausible

## Contributing

Contributions are welcome! Please see the main PhilJS repository for guidelines.

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./client
- Source files: packages/philjs-plugin-analytics/src/index.ts, packages/philjs-plugin-analytics/src/client.ts

### Public API
- Direct exports: AnalyticsEvent, AnalyticsPluginConfig, AnalyticsProvider, EcommerceTransaction, analytics, analyticsUtils, createAnalyticsPlugin, identifyUser, setUserProperties, trackEvent, trackPageView, trackTransaction
- Re-exported names: AnalyticsContext, CustomEventOptions, EcommerceItem, EcommerceTransaction, IAnalyticsProvider, PrivacyOptions, ProviderOptions, UserIdentification, identifyUser, setUserProperties, trackEvent, trackPageView, trackTransaction
- Re-exported modules: ./types.js, philjs-plugin-analytics/client
<!-- API_SNAPSHOT_END -->

## License

MIT

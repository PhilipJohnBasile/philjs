# @philjs/plugin-analytics

Universal analytics integration plugin for PhilJS applications. Seamlessly integrate with multiple analytics providers while maintaining a privacy-first approach.

## Introduction

The `@philjs/plugin-analytics` package provides a unified interface for integrating analytics tracking across your PhilJS application. It abstracts away provider-specific implementations, allowing you to switch between analytics providers without changing your application code.

Key benefits:

- **Unified API** - Single API for all providers
- **Privacy-First** - Built-in Do Not Track support, IP anonymization, and cookie consent management
- **SPA-Ready** - Automatic tracking for single-page application navigation
- **Type-Safe** - Full TypeScript support with comprehensive type definitions
- **Vite Plugin** - Seamless integration with Vite build system

## Installation

```bash
npm install @philjs/plugin-analytics
# or
pnpm add @philjs/plugin-analytics
# or
yarn add @philjs/plugin-analytics
```

---

## Supported Providers

The plugin supports eight major analytics providers, each with their own strengths:

| Provider | ID | Type | Best For |
|----------|-----|------|----------|
| Google Analytics 4 | `ga4` | Full-featured | Enterprise, e-commerce |
| Plausible | `plausible` | Privacy-focused | GDPR compliance, simple analytics |
| Mixpanel | `mixpanel` | Product analytics | User behavior, funnels |
| Amplitude | `amplitude` | Behavioral | Product analytics, cohorts |
| Segment | `segment` | Data pipeline | Multi-destination routing |
| PostHog | `posthog` | Open source | Self-hosted, feature flags |
| Umami | `umami` | Self-hosted | Privacy, self-hosting |
| Fathom | `fathom` | Privacy-focused | Simple, privacy-first |

### Google Analytics 4 (ga4)

Google's latest analytics platform with enhanced measurement capabilities.

```typescript
import { createAnalyticsPlugin } from '@philjs/plugin-analytics';

createAnalyticsPlugin({
  provider: 'ga4',
  trackingId: 'G-XXXXXXXXXX',
  options: {
    send_page_view: true,
    anonymize_ip: true,
    cookie_domain: 'auto',
    cookie_expires: 63072000, // 2 years in seconds
    cookie_prefix: '_ga',
    cookie_update: true,
    cookie_flags: 'SameSite=None;Secure',
  },
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
  },
  customEvents: {
    pageViews: true,
    errors: true,
  },
});
```

**Features:**
- Full e-commerce tracking support
- Enhanced measurement
- User identification and properties
- Custom dimensions and metrics

### Plausible

Privacy-focused, lightweight analytics that doesn't use cookies.

```typescript
createAnalyticsPlugin({
  provider: 'plausible',
  trackingId: 'example.com', // Your domain
  options: {
    domain: 'example.com',
    apiHost: 'https://plausible.io', // Or your self-hosted instance
    hashMode: false, // Enable for hash-based routing
    trackLocalhost: false,
  },
});
```

**Features:**
- No cookies required
- GDPR, CCPA, PECR compliant by default
- Lightweight script (~1KB)
- Open source and self-hostable

**Note:** Plausible does not support user identification or user properties as part of its privacy-focused design.

### Mixpanel

Advanced product analytics for tracking user behavior and building funnels.

```typescript
createAnalyticsPlugin({
  provider: 'mixpanel',
  trackingId: 'your-project-token',
  options: {
    mixpanel_api_host: 'https://api.mixpanel.com',
    app_host: 'https://mixpanel.com',
    cdn: 'https://cdn.mxpnl.com',
    cross_subdomain_cookie: true,
    persistence: 'cookie', // or 'localStorage'
    persistence_name: 'mixpanel',
  },
  privacy: {
    anonymizeIp: true, // Sets ip: false in config
    cookieDomain: '.example.com',
    cookieExpires: 365, // days
  },
  customEvents: {
    pageViews: false, // Mixpanel handles this differently
  },
});
```

**Features:**
- User identification and profiles
- Revenue tracking with `people.track_charge`
- Funnel analysis
- A/B testing integration
- Group analytics

### Amplitude

Behavioral analytics platform for understanding user journeys.

```typescript
createAnalyticsPlugin({
  provider: 'amplitude',
  trackingId: 'your-api-key',
  options: {
    defaultTracking: {
      sessions: true,
      pageViews: true,
      formInteractions: false,
      fileDownloads: true,
    },
  },
  customEvents: {
    pageViews: true,
    forms: false,
  },
});
```

**Features:**
- Automatic session tracking
- Revenue tracking with Revenue API
- User properties with Identify API
- Behavioral cohorts
- Pathfinder analysis

### Segment

Customer data platform for routing data to multiple destinations.

```typescript
createAnalyticsPlugin({
  provider: 'segment',
  trackingId: 'your-write-key',
  options: {
    // Segment-specific options
  },
  customEvents: {
    pageViews: true,
  },
});
```

**Features:**
- Route to 300+ destinations
- Group tracking for B2B
- Alias for user identity merging
- Server-side tracking support
- E-commerce spec compliance

### PostHog

Open-source product analytics with feature flags and session recording.

```typescript
createAnalyticsPlugin({
  provider: 'posthog',
  trackingId: 'phc_xxxxxxxxxxxxx',
  options: {
    posthog_api_host: 'https://us.i.posthog.com', // or eu.i.posthog.com
    ui_host: 'https://us.posthog.com',
    autocapture: true,
    capture_pageview: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextContent: false,
    },
  },
  privacy: {
    anonymizeIp: true, // Adds $ip to property_blacklist
  },
});
```

**Features:**
- Feature flags with `isFeatureEnabled()` and `getFeatureFlag()`
- Session recording
- Heatmaps and clickmaps
- Group analytics
- Self-hostable
- Opt-in/opt-out controls

### Umami

Simple, fast, privacy-focused, self-hosted analytics.

```typescript
createAnalyticsPlugin({
  provider: 'umami',
  trackingId: 'your-website-id',
  options: {
    scriptUrl: 'https://analytics.example.com/script.js',
    websiteId: 'your-website-id',
    hostUrl: 'https://analytics.example.com',
    autoTrack: true,
  },
});
```

**Features:**
- Self-hosted
- No cookies required
- GDPR compliant
- Lightweight
- Real-time dashboard

### Fathom

Simple, privacy-focused analytics.

```typescript
createAnalyticsPlugin({
  provider: 'fathom',
  trackingId: 'ABCDEFGH',
  options: {
    site: 'ABCDEFGH',
    spa: 'auto', // 'auto', 'history', or 'hash'
    honorDNT: true,
    canonical: true,
  },
});
```

**Features:**
- EU isolation available
- No cookies
- GDPR, CCPA, PECR compliant
- Simple dashboard
- Unlimited websites

---

## Configuration

### AnalyticsPluginConfig

The main configuration interface for the analytics plugin:

```typescript
interface AnalyticsPluginConfig {
  /** Analytics provider (required) */
  provider: AnalyticsProvider;

  /** Tracking ID or API key (required) */
  trackingId: string;

  /** Provider-specific options */
  options?: ProviderOptions;

  /** Enable debug mode for console logging */
  debug?: boolean;

  /** Disable tracking in development (default: true) */
  disableInDev?: boolean;

  /** Privacy settings */
  privacy?: PrivacyOptions;

  /** Automatic event tracking configuration */
  customEvents?: CustomEventOptions;
}
```

### Privacy Settings

Configure privacy-related options:

```typescript
interface PrivacyOptions {
  /** Anonymize IP addresses (default: true) */
  anonymizeIp?: boolean;

  /** Respect browser Do Not Track setting (default: true) */
  respectDnt?: boolean;

  /** Require cookie consent before tracking (default: false) */
  cookieConsent?: boolean;

  /** Enable GDPR mode for applicable providers */
  gdprMode?: boolean;

  /** Cookie domain for cross-subdomain tracking */
  cookieDomain?: string;

  /** Cookie expiration in days */
  cookieExpires?: number;
}
```

**Default Privacy Configuration:**

```typescript
const defaultPrivacy = {
  anonymizeIp: true,
  respectDnt: true,
  cookieConsent: false,
};
```

### Custom Events Configuration

Configure automatic event tracking:

```typescript
interface CustomEventOptions {
  /** Track page views automatically (default: true) */
  pageViews?: boolean;

  /** Track click events on elements with data-track-click (default: false) */
  clicks?: boolean;

  /** Track form submissions (default: false) */
  forms?: boolean;

  /** Track JavaScript errors (default: true) */
  errors?: boolean;

  /** Track performance metrics */
  performance?: boolean;

  /** Track scroll depth */
  scrollDepth?: boolean;

  /** Track time on page */
  timeOnPage?: boolean;
}
```

**Default Custom Events Configuration:**

```typescript
const defaultCustomEvents = {
  pageViews: true,
  clicks: false,
  forms: false,
  errors: true,
};
```

---

## Client API

The client API provides functions for tracking events, page views, and user data.

### Importing the Client

```typescript
// Import from the generated analytics file
import {
  trackEvent,
  trackPageView,
  identifyUser,
  setUserProperties,
  trackTransaction,
} from './lib/analytics';

// Or import directly from the package
import { analytics } from '@philjs/plugin-analytics/client';
```

### trackEvent()

Track custom events with optional properties.

```typescript
function trackEvent(name: string, properties?: Record<string, any>): void;
```

**Examples:**

```typescript
// Simple event
trackEvent('button_clicked');

// Event with properties
trackEvent('signup_completed', {
  method: 'email',
  referrer: 'homepage',
});

// Feature usage
trackEvent('feature_used', {
  feature: 'dark_mode',
  enabled: true,
  timestamp: Date.now(),
});

// Search event
trackEvent('search_performed', {
  query: 'typescript tutorial',
  results_count: 42,
  filters: ['recent', 'video'],
});
```

### trackPageView()

Track page views manually (automatic tracking is enabled by default).

```typescript
function trackPageView(url?: string, title?: string): void;
```

**Examples:**

```typescript
// Track current page
trackPageView();

// Track with custom URL
trackPageView('/products/123');

// Track with URL and title
trackPageView('/checkout', 'Checkout - MyStore');
```

**Note:** When `customEvents.pageViews` is enabled (default), page views are tracked automatically on initial load and SPA navigation.

### identifyUser()

Associate tracked events with a specific user.

```typescript
function identifyUser(userId: string, traits?: Record<string, any>): void;
```

**Examples:**

```typescript
// Basic identification
identifyUser('user-12345');

// With user traits
identifyUser('user-12345', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'pro',
  company: 'Acme Inc',
  created_at: '2024-01-15T10:30:00Z',
});
```

**Important:** Not all providers support user identification. Plausible and Fathom do not track individual users as part of their privacy-focused design.

### setUserProperties()

Update user properties without re-identifying.

```typescript
function setUserProperties(properties: Record<string, any>): void;
```

**Examples:**

```typescript
// Update single property
setUserProperties({
  last_login: new Date().toISOString(),
});

// Update multiple properties
setUserProperties({
  subscription_status: 'active',
  features_enabled: ['analytics', 'reports', 'exports'],
  usage_count: 150,
});
```

### trackTransaction()

Track e-commerce transactions and purchases.

```typescript
function trackTransaction(transaction: EcommerceTransaction): void;

interface EcommerceTransaction {
  transaction_id: string;
  value: number;
  currency?: string; // defaults to 'USD'
  tax?: number;
  shipping?: number;
  items?: EcommerceItem[];
  coupon?: string;
}

interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  item_brand?: string;
}
```

**Examples:**

```typescript
// Simple transaction
trackTransaction({
  transaction_id: 'TXN-2024-001',
  value: 99.99,
  currency: 'USD',
});

// Full e-commerce transaction
trackTransaction({
  transaction_id: 'TXN-2024-002',
  value: 249.98,
  currency: 'USD',
  tax: 20.00,
  shipping: 9.99,
  coupon: 'SAVE20',
  items: [
    {
      item_id: 'SKU-001',
      item_name: 'PhilJS Pro License',
      price: 149.99,
      quantity: 1,
      item_category: 'Software',
      item_brand: 'PhilJS',
    },
    {
      item_id: 'SKU-002',
      item_name: 'Priority Support',
      price: 99.99,
      quantity: 1,
      item_category: 'Services',
      item_brand: 'PhilJS',
    },
  ],
});
```

---

## Utility Functions

The plugin exports utility functions for common analytics tasks.

### hasDNT()

Check if the user has Do Not Track enabled.

```typescript
import { analyticsUtils } from '@philjs/plugin-analytics';

const hasDNT = analyticsUtils.hasDNT();

if (hasDNT) {
  console.log('User has Do Not Track enabled');
  // Respect user preference
} else {
  // Proceed with tracking
  analytics.init(config);
}
```

**Implementation:**

```typescript
function hasDNT(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    navigator.doNotTrack === '1' ||
    (window as any).doNotTrack === '1' ||
    (navigator as any).msDoNotTrack === '1'
  );
}
```

### generateSessionId()

Generate a unique session identifier.

```typescript
import { analyticsUtils } from '@philjs/plugin-analytics';

const sessionId = analyticsUtils.generateSessionId();
// Example: '1704067200000-k8f7d3m9p'
```

**Format:** `{timestamp}-{random alphanumeric string}`

### getUserAgent()

Get browser and device information.

```typescript
import { analyticsUtils } from '@philjs/plugin-analytics';

const userAgent = analyticsUtils.getUserAgent();
// {
//   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
//   language: 'en-US',
//   platform: 'Win32',
//   vendor: 'Google Inc.',
// }
```

### getPageMetadata()

Get current page metadata.

```typescript
import { analyticsUtils } from '@philjs/plugin-analytics';

const metadata = analyticsUtils.getPageMetadata();
// {
//   url: 'https://example.com/products?category=software',
//   path: '/products',
//   search: '?category=software',
//   hash: '',
//   title: 'Products - Example',
//   referrer: 'https://google.com',
// }
```

### Additional Utilities

The utils module provides additional helper functions:

```typescript
import {
  isBrowser,
  isDevelopment,
  getViewportSize,
  getScreenResolution,
  getUTMParams,
  areCookiesEnabled,
  getCookie,
  setCookie,
  deleteCookie,
  debounce,
  throttle,
} from '@philjs/plugin-analytics/utils';

// Check if running in browser
if (isBrowser()) {
  // Browser-only code
}

// Check if development mode
if (!isDevelopment()) {
  analytics.init(config);
}

// Get viewport dimensions
const { width, height } = getViewportSize();

// Get UTM parameters from URL
const utmParams = getUTMParams();
// { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'spring2024' }

// Cookie helpers
if (areCookiesEnabled()) {
  setCookie('consent', 'true', 365, '.example.com');
  const consent = getCookie('consent');
  deleteCookie('old_cookie');
}
```

---

## Vite Plugin Integration

The analytics plugin integrates with PhilJS's plugin system and Vite.

### Basic Setup

```typescript
// philjs.config.ts
import { createAnalyticsPlugin } from '@philjs/plugin-analytics';

export default {
  plugins: [
    createAnalyticsPlugin({
      provider: 'ga4',
      trackingId: 'G-XXXXXXXXXX',
    }),
  ],
};
```

### Plugin Behavior

When the plugin runs, it:

1. **Creates analytics initialization file** at `src/lib/analytics.ts`:

```typescript
/**
 * Analytics initialization
 * Auto-generated by philjs-plugin-analytics
 */

import { analytics } from "philjs-plugin-analytics/client";

// Initialize analytics
analytics.init({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  // ... merged configuration
});

// Re-export convenience functions
export {
  trackEvent,
  trackPageView,
  identifyUser,
  setUserProperties,
  trackTransaction
} from "philjs-plugin-analytics/client";
```

2. **Injects analytics script** into `index.html` (if present):

```html
<!-- Before -->
<head>
  <title>My App</title>
</head>

<!-- After -->
<head>
  <title>My App</title>
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {});
  </script>
</head>
```

### Using in Components

```typescript
// src/components/SignupForm.tsx
import { trackEvent } from '../lib/analytics';

export function SignupForm() {
  const handleSubmit = async (data: FormData) => {
    await submitSignup(data);

    trackEvent('signup_completed', {
      method: 'form',
      plan: data.get('plan'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

---

## Privacy-First Implementation

The plugin is designed with privacy as a core principle.

### Default Privacy Settings

By default, the plugin:

- **Anonymizes IP addresses** - Prevents storage of full IP addresses
- **Respects Do Not Track** - Checks browser DNT setting before initializing
- **Disables in development** - Prevents polluting analytics with dev data

### Do Not Track Compliance

```typescript
// The plugin automatically checks DNT during initialization
analytics.init({
  provider: 'ga4',
  trackingId: 'G-XXXXXXXXXX',
  privacy: {
    respectDnt: true, // Default: true
  },
});

// Manual DNT check
import { analyticsUtils } from '@philjs/plugin-analytics';

if (analyticsUtils.hasDNT()) {
  showPrivacyNotice('Tracking is disabled per your browser settings');
}
```

### Cookie Consent Integration

```typescript
// Initialize with consent required
analytics.init({
  provider: 'ga4',
  trackingId: 'G-XXXXXXXXXX',
  privacy: {
    cookieConsent: true,
  },
});

// Cookie consent banner component
function CookieConsent() {
  const [shown, setShown] = useState(true);

  const handleAccept = () => {
    setCookie('analytics_consent', 'granted', 365);
    analytics.enableTracking();
    trackPageView();
    setShown(false);
  };

  const handleDecline = () => {
    setCookie('analytics_consent', 'denied', 365);
    analytics.disableTracking();
    setShown(false);
  };

  if (!shown) return null;

  return (
    <div class="cookie-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
}
```

### GDPR-Compliant Configuration

```typescript
createAnalyticsPlugin({
  provider: 'ga4',
  trackingId: 'G-XXXXXXXXXX',
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
    cookieConsent: true,
    gdprMode: true,
    cookieDomain: '.example.com',
    cookieExpires: 365,
  },
  customEvents: {
    pageViews: true,
    clicks: false,
    forms: false,
    errors: true,
  },
});
```

### Privacy-Focused Provider Alternatives

For maximum privacy compliance, consider using privacy-focused providers:

```typescript
// Plausible - No cookies, GDPR compliant by default
createAnalyticsPlugin({
  provider: 'plausible',
  trackingId: 'example.com',
});

// Umami - Self-hosted, no cookies
createAnalyticsPlugin({
  provider: 'umami',
  trackingId: 'website-id',
  options: {
    scriptUrl: 'https://your-umami-instance.com/script.js',
  },
});

// Fathom - Privacy-first, EU data isolation available
createAnalyticsPlugin({
  provider: 'fathom',
  trackingId: 'ABCDEFGH',
  options: {
    honorDNT: true,
  },
});
```

---

## Types Reference

### AnalyticsProvider

```typescript
type AnalyticsProvider =
  | 'google-analytics'
  | 'ga4'
  | 'plausible'
  | 'mixpanel'
  | 'amplitude'
  | 'segment'
  | 'posthog'
  | 'umami'
  | 'fathom';
```

### AnalyticsEvent

```typescript
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}
```

### UserIdentification

```typescript
interface UserIdentification {
  userId: string;
  traits?: Record<string, any>;
}
```

### EcommerceItem

```typescript
interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  item_brand?: string;
}
```

### EcommerceTransaction

```typescript
interface EcommerceTransaction {
  transaction_id: string;
  value: number;
  currency?: string;
  tax?: number;
  shipping?: number;
  items?: EcommerceItem[];
  coupon?: string;
}
```

### AnalyticsContext

```typescript
interface AnalyticsContext {
  sessionId: string;
  pageLoadTime: number;
  referrer: string;
  userAgent: string;
  language: string;
  screenResolution: string;
  viewport: string;
}
```

### IAnalyticsProvider

```typescript
interface IAnalyticsProvider {
  name: AnalyticsProvider;
  init(config: AnalyticsPluginConfig): void;
  trackEvent(event: AnalyticsEvent): void;
  trackPageView(url?: string, title?: string): void;
  identifyUser(identification: UserIdentification): void;
  setUserProperties(properties: Record<string, any>): void;
  trackTransaction?(transaction: EcommerceTransaction): void;
  isLoaded(): boolean;
}
```

---

## API Reference Summary

### Plugin Exports

| Export | Description |
|--------|-------------|
| `createAnalyticsPlugin` | Create analytics plugin instance |
| `analyticsUtils.hasDNT` | Check Do Not Track setting |
| `analyticsUtils.generateSessionId` | Generate unique session ID |
| `analyticsUtils.getUserAgent` | Get browser/device info |
| `analyticsUtils.getPageMetadata` | Get current page metadata |

### Client Exports (`@philjs/plugin-analytics/client`)

| Export | Description |
|--------|-------------|
| `analytics` | Analytics client singleton |
| `trackEvent` | Track custom events |
| `trackPageView` | Track page views |
| `identifyUser` | Identify users |
| `setUserProperties` | Set user properties |
| `trackTransaction` | Track e-commerce transactions |

### Provider Classes

| Class | Provider |
|-------|----------|
| `GA4Provider` | Google Analytics 4 |
| `PlausibleProvider` | Plausible |
| `MixpanelProvider` | Mixpanel |
| `AmplitudeProvider` | Amplitude |
| `SegmentProvider` | Segment |
| `PostHogProvider` | PostHog |

---

## Best Practices

### 1. Initialize Early

Initialize analytics as early as possible in your application lifecycle:

```typescript
// src/main.ts
import './lib/analytics'; // Initialize first
import { render } from '@philjs/core';
import { App } from './App';

render(<App />, document.getElementById('root'));
```

### 2. Use Meaningful Event Names

```typescript
// Good - descriptive and actionable
trackEvent('checkout_started');
trackEvent('product_added_to_cart', { product_id: '123' });
trackEvent('subscription_upgraded', { from: 'free', to: 'pro' });

// Avoid - vague or generic
trackEvent('click');
trackEvent('action');
trackEvent('event');
```

### 3. Don't Track Sensitive Data

```typescript
// Good - non-PII data only
trackEvent('profile_updated', {
  profile_type: 'business',
  has_avatar: true,
});

// Avoid - never track PII
trackEvent('profile_updated', {
  email: user.email,        // Don't do this
  phone: user.phone,        // Don't do this
  address: user.address,    // Don't do this
});
```

### 4. Batch Related Events

```typescript
// Good - track meaningful milestones
trackEvent('onboarding_completed', {
  steps_completed: ['profile', 'preferences', 'integrations'],
  time_to_complete: 180, // seconds
});

// Avoid - excessive granular tracking
trackEvent('step_1_completed');
trackEvent('step_2_completed');
trackEvent('step_3_completed');
```

### 5. Test with Debug Mode

```typescript
createAnalyticsPlugin({
  provider: 'ga4',
  trackingId: 'G-XXXXXXXXXX',
  debug: process.env.NODE_ENV !== 'production',
});
```

---

## Troubleshooting

### Events Not Tracking

1. Check if analytics is initialized: `analytics.isInitialized()`
2. Verify DNT is not enabled: `analyticsUtils.hasDNT()`
3. Ensure not in development mode with `disableInDev: true`
4. Check browser console for initialization logs when `debug: true`

### Provider Script Not Loading

1. Check network tab for blocked requests (ad blockers)
2. Verify tracking ID format is correct
3. Check Content Security Policy headers

### SPA Navigation Not Tracked

Ensure `customEvents.pageViews` is enabled:

```typescript
createAnalyticsPlugin({
  customEvents: {
    pageViews: true,
  },
});
```

---

## Next Steps

- [Analytics Patterns](../../patterns/analytics.md)
- [Privacy & GDPR Guide](../../security/privacy.md)
- [Observability Overview](../../observability/overview.md)
- [A/B Testing Integration](../ab-testing/overview.md)

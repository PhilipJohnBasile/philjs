# PhilJS Analytics Plugin - Implementation Guide

## Overview

The PhilJS Analytics Plugin provides a unified interface for integrating analytics providers into your PhilJS application. It supports multiple providers (GA4, Plausible, Mixpanel) with a consistent API and privacy-first features.

## Architecture

### Core Components

1. **Plugin System Integration** (`src/index.ts`)
   - Implements PhilJS plugin interface
   - Handles configuration and setup
   - Manages plugin lifecycle hooks

2. **Provider Implementations** (`src/providers/`)
   - GA4: Google Analytics 4 integration
   - Plausible: Privacy-focused analytics
   - Mixpanel: Product analytics and user tracking

3. **Client Runtime** (`src/client.ts`)
   - Browser-side analytics client
   - Event queue management
   - Auto-tracking features
   - Session management

4. **Type Definitions** (`src/types.ts`)
   - TypeScript interfaces for all analytics types
   - Provider-specific options
   - Event and transaction types

5. **Utilities** (`src/utils.ts`)
   - Helper functions for browser detection
   - Cookie and localStorage management
   - URL parsing and UTM tracking

## Provider Architecture

Each provider implements the `IAnalyticsProvider` interface:

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

### Provider Loading

Providers use dynamic script loading to inject analytics scripts:

1. **GA4**: Loads gtag.js from Google CDN
2. **Plausible**: Loads script.js from Plausible CDN
3. **Mixpanel**: Loads Mixpanel SDK inline

### Script Injection

The plugin can inject analytics scripts in two ways:

1. **HTML Injection**: Automatically adds scripts to `index.html` during build
2. **Runtime Loading**: Dynamically loads scripts at runtime via client

## Client Runtime

### Initialization Flow

1. User configures plugin in `philjs.config.ts`
2. Plugin setup hook creates analytics initialization file
3. Client imports and initializes analytics runtime
4. Provider is loaded and configured
5. Auto-tracking is enabled based on configuration

### Event Queue

Events tracked before initialization are queued and processed after provider loads:

```typescript
private eventQueue: AnalyticsEvent[] = [];

// Queue event
trackEvent("event_name", { key: "value" });

// After init, process queue
this.processEventQueue();
```

### Auto-Tracking

The client supports automatic tracking of:

- **Page Views**: Intercepts history API for SPA navigation
- **Errors**: Global error and unhandled rejection handlers
- **Clicks**: Event delegation for elements with `data-track-click`
- **Forms**: Form submission tracking
- **Performance**: Web Vitals and navigation timing

## Privacy Features

### Do Not Track (DNT)

```typescript
if (config.privacy?.respectDnt && this.isDNTEnabled()) {
  console.log("Do Not Track is enabled, analytics disabled");
  return;
}
```

### IP Anonymization

```typescript
// GA4
gtagConfig.anonymize_ip = true;

// Mixpanel
initConfig.ip = false;
```

### Cookie Management

- Configurable cookie domain
- Customizable expiration
- Cookie consent support

### Development Mode

Analytics automatically disabled in development:

```typescript
if (config.disableInDev && this.isDevelopment()) {
  console.log("Analytics disabled in development mode");
  return;
}
```

## Usage Patterns

### Plugin Configuration

```typescript
// philjs.config.ts
import { createAnalyticsPlugin } from "philjs-plugin-analytics";

export default {
  plugins: [
    createAnalyticsPlugin({
      provider: "ga4",
      trackingId: "G-XXXXXXXXXX",
      privacy: {
        anonymizeIp: true,
        respectDnt: true,
      },
      customEvents: {
        pageViews: true,
        errors: true,
      },
    }),
  ],
};
```

### Client-Side Tracking

```typescript
// In your app
import { trackEvent, identifyUser } from "./lib/analytics";

// Track custom event
trackEvent("button_click", {
  button_name: "signup",
  location: "homepage",
});

// Identify user
identifyUser("user123", {
  email: "user@example.com",
  plan: "premium",
});
```

### Auto-Tracking

```typescript
// HTML with data attributes
<button
  data-track-click="signup_button"
  data-track-location="homepage"
>
  Sign Up
</button>
```

## Testing

### Unit Tests

- Provider initialization
- Event tracking
- Privacy controls
- Auto-tracking setup

### Test Environment

Tests run in jsdom with mocked browser APIs:

```typescript
// test-setup.ts
global.window = { /* ... */ };
global.document = { /* ... */ };
global.navigator = { /* ... */ };
```

### Coverage

Run tests with coverage:

```bash
npm test
npm run test:coverage
```

## Build Process

### TypeScript Compilation

```bash
npm run build
```

Outputs:
- `dist/index.js` - Main plugin entry
- `dist/client.js` - Client runtime
- `dist/*.d.ts` - Type definitions

### Package Exports

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./client": "./dist/client.js"
  }
}
```

## Extension Points

### Adding New Providers

1. Create provider class in `src/providers/`
2. Implement `IAnalyticsProvider` interface
3. Add to provider factory in `src/providers/index.ts`
4. Update type definitions in `src/types.ts`
5. Add tests

Example:

```typescript
// src/providers/amplitude.ts
export class AmplitudeProvider implements IAnalyticsProvider {
  name = "amplitude" as const;

  init(config: AnalyticsPluginConfig): void {
    // Initialize Amplitude
  }

  trackEvent(event: AnalyticsEvent): void {
    // Track event
  }

  // ... implement other methods
}
```

### Custom Auto-Tracking

Add custom auto-tracking in client:

```typescript
private setupCustomTracking(): void {
  // Add custom event listeners
  document.addEventListener("custom-event", (event) => {
    this.trackEvent("custom_event", event.detail);
  });
}
```

## Performance Considerations

### Script Loading

- Scripts loaded asynchronously
- No blocking of page render
- Lazy initialization

### Event Queue

- Prevents lost events during initialization
- Processed after provider loads
- Minimal memory overhead

### Bundle Size

- Core plugin: ~5KB gzipped
- Client runtime: ~8KB gzipped
- Providers loaded from CDN

## Security

### XSS Prevention

- All user data sanitized
- No eval() or innerHTML usage
- CSP-compatible script loading

### Data Privacy

- No PII collection by default
- IP anonymization support
- Cookie consent integration
- GDPR compliance options

## Debugging

### Debug Mode

```typescript
createAnalyticsPlugin({
  provider: "ga4",
  trackingId: "G-XXXXXXXXXX",
  debug: true, // Enable console logging
});
```

### Console Logs

- `[GA4] Initialized` - Provider loaded
- `[GA4] Event tracked: {...}` - Event details
- `[GA4] User identified: user123` - User identification

### Browser DevTools

- Network tab: Check analytics requests
- Console: View debug logs
- Application tab: Check cookies/localStorage

## Best Practices

1. **Always enable privacy features in production**
2. **Use auto-tracking for common events**
3. **Track meaningful user actions, not everything**
4. **Test analytics in staging before production**
5. **Respect user privacy preferences**
6. **Use debug mode during development**
7. **Monitor analytics data quality**
8. **Document custom events and properties**

## Migration Guide

### From Universal Analytics to GA4

```typescript
// Old UA
provider: "google-analytics",
trackingId: "UA-XXXXXXXXX",

// New GA4
provider: "ga4",
trackingId: "G-XXXXXXXXXX",
```

### From Custom Implementation

1. Remove custom analytics code
2. Install plugin
3. Configure provider
4. Use client API for tracking
5. Enable auto-tracking
6. Test thoroughly

## Roadmap

Future enhancements:

- [ ] Segment integration
- [ ] PostHog integration
- [ ] Amplitude integration
- [ ] Custom dimension mapping
- [ ] A/B testing integration
- [ ] Real-time analytics dashboard
- [ ] Analytics data export
- [ ] GDPR consent management UI

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/philjs/issues
- Documentation: https://philjs.dev/plugins/analytics
- Examples: See `examples/` directory

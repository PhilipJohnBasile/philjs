# philjs-errors

Error tracking and monitoring for PhilJS - Sentry, LogRocket, and Rollbar integrations.

## Features

- **Multiple Providers** - Sentry, LogRocket, Rollbar support
- **Automatic Error Capture** - Catch runtime and async errors
- **Source Maps** - Upload source maps for better stack traces
- **User Context** - Track user sessions and actions
- **Custom Events** - Log custom errors and events
- **Performance Monitoring** - Track performance metrics
- **Release Tracking** - Associate errors with releases

## Installation

```bash
# Sentry
pnpm add philjs-errors @sentry/browser

# LogRocket
pnpm add philjs-errors logrocket

# Rollbar
pnpm add philjs-errors rollbar
```

## Quick Start

### Sentry

```typescript
import { initSentry } from 'philjs-errors/sentry';

initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE_VERSION
});
```

### LogRocket

```typescript
import { initLogRocket } from 'philjs-errors/logrocket';

initLogRocket({
  appId: process.env.LOGROCKET_APP_ID
});
```

### Rollbar

```typescript
import { initRollbar } from 'philjs-errors/rollbar';

initRollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  environment: process.env.NODE_ENV
});
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./sentry, ./logrocket, ./rollbar
- Source files: packages/philjs-errors/src/index.ts, packages/philjs-errors/src/sentry.ts, packages/philjs-errors/src/logrocket.ts, packages/philjs-errors/src/rollbar.ts

### Public API
- Direct exports: Breadcrumb, ErrorContext, ErrorEvent, ErrorTracker, LogRocketOptions, RollbarOptions, SentryOptions, Span, TrackerOptions, UserContext, addBreadcrumb, captureError, captureMessage, createErrorBoundary, createLogRocketTracker, createRollbarTracker, createSentryTracker, getErrorTracker, getSessionURL, initErrorTracking, redact, setUser, showSentryFeedback, startSpan, trackComponentWithSentry, trackEvent, trackRouteWithSentry, trackSignalErrors, trackSignalWithSentry, withErrorTracking
- Re-exported names: createLogRocketTracker, createRollbarTracker, createSentryTracker
- Re-exported modules: ./logrocket.js, ./rollbar.js, ./sentry.js
<!-- API_SNAPSHOT_END -->

## License

MIT

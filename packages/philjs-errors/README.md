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

## License

MIT

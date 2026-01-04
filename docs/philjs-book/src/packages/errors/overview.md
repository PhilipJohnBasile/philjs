# @philjs/errors

Unified error tracking and monitoring for PhilJS applications with support for Sentry, LogRocket, Rollbar, and custom integrations.

## Installation

```bash
npm install @philjs/errors
```

## Overview

`@philjs/errors` provides comprehensive error handling:

- **Error Tracking**: Capture and report errors automatically
- **Multiple Integrations**: Sentry, LogRocket, Rollbar support
- **Performance Monitoring**: Span-based tracing
- **Breadcrumbs**: Track user actions leading to errors
- **Signal Error Tracking**: Special handling for reactive signal errors
- **Error Boundaries**: Component-level error isolation

## Quick Start

```typescript
import {
  initErrorTracking,
  createSentryTracker,
  captureError
} from '@philjs/errors';

// Initialize with Sentry
const tracker = createSentryTracker();
initErrorTracking(tracker, {
  dsn: 'https://your-sentry-dsn',
  environment: 'production',
  release: '1.0.0',
});

// Capture errors anywhere
try {
  await riskyOperation();
} catch (error) {
  captureError(error, { component: 'PaymentForm' });
}
```

## Error Tracker Interface

```typescript
interface ErrorTracker {
  // Initialize the tracker
  init(options: TrackerOptions): void;

  // Capture an error
  captureError(error: Error, context?: ErrorContext): void;

  // Capture a message
  captureMessage(
    message: string,
    level?: 'info' | 'warning' | 'error',
    context?: ErrorContext
  ): void;

  // Set user context
  setUser(user: UserContext | null): void;

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Breadcrumb): void;

  // Start a transaction/span
  startSpan(name: string, op: string): Span;

  // Flush pending events
  flush(timeout?: number): Promise<boolean>;
}
```

## Configuration Options

```typescript
interface TrackerOptions {
  // DSN or API key
  dsn: string;

  // Environment name
  environment?: string;

  // Release version
  release?: string;

  // Sample rate (0-1)
  sampleRate?: number;

  // Enable debug mode
  debug?: boolean;

  // Ignored errors
  ignoreErrors?: (string | RegExp)[];

  // Before send hook
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
}
```

## Error Context

Add context to errors for better debugging:

```typescript
interface ErrorContext {
  // Component name where error occurred
  component?: string;

  // Signal name if error is signal-related
  signal?: string;

  // Route path
  route?: string;

  // User ID
  userId?: string;

  // Additional tags
  tags?: Record<string, string>;

  // Extra data
  extra?: Record<string, unknown>;
}

// Usage
captureError(error, {
  component: 'CheckoutForm',
  route: '/checkout',
  userId: '12345',
  tags: { feature: 'payments' },
  extra: { cartItems: 5 },
});
```

## Breadcrumbs

Track user actions leading to an error:

```typescript
import { addBreadcrumb } from '@philjs/errors';

// Navigation breadcrumb
addBreadcrumb({
  type: 'navigation',
  category: 'route',
  message: 'Navigated to /checkout',
  level: 'info',
});

// User action breadcrumb
addBreadcrumb({
  type: 'user',
  category: 'click',
  message: 'Clicked submit button',
  data: { buttonId: 'submit-order' },
});

// HTTP breadcrumb
addBreadcrumb({
  type: 'http',
  category: 'xhr',
  message: 'POST /api/orders',
  data: { status: 200 },
});
```

## Performance Monitoring

Use spans to track performance:

```typescript
import { startSpan } from '@philjs/errors';

async function processPayment() {
  const span = startSpan('processPayment', 'payment');
  span.setTag('provider', 'stripe');

  try {
    const result = await stripe.charge(amount);
    span.setData('chargeId', result.id);
    return result;
  } finally {
    span.finish();
  }
}
```

## Error Boundaries

Create component-level error boundaries:

```typescript
import { createErrorBoundary } from '@philjs/errors';

const PaymentErrorBoundary = createErrorBoundary({
  componentName: 'PaymentForm',

  fallback: (error) => (
    <div class="error-fallback">
      <h2>Payment Error</h2>
      <p>{error.message}</p>
      <button onClick={() => location.reload()}>Retry</button>
    </div>
  ),

  onError: (error, context) => {
    // Custom error handling
    analytics.track('payment_error', { error: error.message });
  },
});

// Usage
<PaymentErrorBoundary>
  <PaymentForm />
</PaymentErrorBoundary>
```

## Signal Error Tracking

Special handling for reactive signal errors:

```typescript
import { trackSignalErrors } from '@philjs/errors';

const getValue = trackSignalErrors('userProfile', () => {
  return computeUserProfile();
});

// Errors in the signal computation are automatically captured
// with the signal name in context
```

## Async Function Wrapper

Wrap async functions with automatic error tracking:

```typescript
import { withErrorTracking } from '@philjs/errors';

const fetchUserData = withErrorTracking(
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  { component: 'UserProfile' }
);

// Errors are automatically captured with context
const user = await fetchUserData('123');
```

## Provider Integrations

### Sentry

```typescript
import { createSentryTracker, initErrorTracking } from '@philjs/errors';

const tracker = createSentryTracker();
initErrorTracking(tracker, {
  dsn: 'https://your-dsn@sentry.io/project',
  environment: process.env.NODE_ENV,
  release: process.env.VERSION,
  sampleRate: 0.1,
});
```

### LogRocket

```typescript
import { createLogRocketTracker, initErrorTracking } from '@philjs/errors';

const tracker = createLogRocketTracker();
initErrorTracking(tracker, {
  dsn: 'your-logrocket-app-id',
});
```

### Rollbar

```typescript
import { createRollbarTracker, initErrorTracking } from '@philjs/errors';

const tracker = createRollbarTracker();
initErrorTracking(tracker, {
  dsn: 'your-rollbar-token',
  environment: 'production',
});
```

## User Context

Set user information for error reports:

```typescript
import { setUser } from '@philjs/errors';

// After login
setUser({
  id: '12345',
  email: 'user@example.com',
  username: 'johndoe',
  plan: 'premium',
});

// After logout
setUser(null);
```

## API Reference

```typescript
// Initialization
export function initErrorTracking(tracker: ErrorTracker, options: TrackerOptions): void;
export function getErrorTracker(): ErrorTracker | null;

// Error capture
export function captureError(error: Error, context?: ErrorContext): void;
export function captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext): void;

// Context
export function setUser(user: UserContext | null): void;
export function addBreadcrumb(breadcrumb: Breadcrumb): void;

// Performance
export function startSpan(name: string, op: string): Span;

// Utilities
export function createErrorBoundary(options: ErrorBoundaryOptions): Component;
export function withErrorTracking<T>(fn: T, context?: ErrorContext): T;
export function trackSignalErrors<T>(signalName: string, getValue: () => T): () => T;

// Integrations
export function createSentryTracker(): ErrorTracker;
export function createLogRocketTracker(): ErrorTracker;
export function createRollbarTracker(): ErrorTracker;
```

## See Also

- [@philjs/observability](../observability/overview.md) - Full observability stack
- [@philjs/analytics](../analytics/overview.md) - Analytics tracking
- [@philjs/core](../core/error-handling.md) - Core error handling patterns

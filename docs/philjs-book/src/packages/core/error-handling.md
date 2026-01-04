# Error Handling

PhilJS provides a comprehensive error handling system with error boundaries, intelligent recovery, Rust-inspired Result types, and optional error tracking integration.

## Overview

The error handling system includes:

- **Error Boundaries**: Catch and recover from component errors
- **Result Type**: Type-safe error handling without exceptions
- **Error Analysis**: Automatic error categorization and suggestions
- **Recovery Strategies**: Configurable recovery with retry logic
- **Error Tracking**: Integration with monitoring services

## Error Boundaries

### Basic Usage

```tsx
import { ErrorBoundary } from '@philjs/core/error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div class="error-fallback">
          <h2>Something went wrong</h2>
          <p>{error.error.message}</p>
          <button onClick={retry}>Try again</button>
        </div>
      )}
    >
      <Main />
    </ErrorBoundary>
  );
}
```

### ErrorBoundary Props

```typescript
interface ErrorBoundaryProps {
  // Custom fallback UI
  fallback?: (error: ErrorInfo, retry: () => void) => VNode;

  // Callback when error is caught
  onError?: (error: ErrorInfo) => void;

  // Callback when recovery succeeds
  onRecover?: () => void;

  // Children to render
  children: VNode;

  // Name for debugging
  name?: string;

  // Built-in fallback pattern
  fallbackPattern?: 'default' | 'skeleton' | 'empty-state' | 'partial' | 'minimal';

  // Maximum retry attempts
  maxRetries?: number;

  // Auto-recover for certain error types
  autoRecover?: boolean;

  // Delay between retries (ms)
  retryDelay?: number;

  // Reset error state on successful render
  resetOnSuccess?: boolean;
}
```

### Fallback Patterns

PhilJS provides built-in fallback UI patterns:

```tsx
// Default - detailed error with suggestions
<ErrorBoundary fallbackPattern="default">
  <Component />
</ErrorBoundary>

// Skeleton - loading placeholder
<ErrorBoundary fallbackPattern="skeleton">
  <Component />
</ErrorBoundary>

// Empty state - friendly message
<ErrorBoundary fallbackPattern="empty-state">
  <Component />
</ErrorBoundary>

// Minimal - compact error indicator
<ErrorBoundary fallbackPattern="minimal">
  <Component />
</ErrorBoundary>
```

### Nested Error Boundaries

Use nested boundaries to isolate errors to specific parts of the UI:

```tsx
function App() {
  return (
    <ErrorBoundary name="App" fallbackPattern="default">
      <Header />

      <ErrorBoundary name="Sidebar" fallbackPattern="skeleton">
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary name="MainContent" fallbackPattern="empty-state">
        <MainContent />
      </ErrorBoundary>

      <Footer />
    </ErrorBoundary>
  );
}
```

### Auto Recovery

Automatically retry recoverable errors:

```tsx
<ErrorBoundary
  autoRecover
  maxRetries={3}
  retryDelay={1000}
  onRecover={() => console.log('Recovered!')}
>
  <DataComponent />
</ErrorBoundary>
```

### Error Info

The `ErrorInfo` object provides detailed error context:

```typescript
interface ErrorInfo {
  // The actual error
  error: Error;

  // Component stack trace
  componentStack?: string;

  // Source location
  source?: {
    file: string;
    line: number;
    column: number;
  };

  // Error category
  category: 'render' | 'data-fetch' | 'type' | 'network' | 'permission' | 'unknown';

  // Suggested fixes
  suggestions: ErrorSuggestion[];

  // Similar errors from community
  similarErrors?: SimilarError[];

  // When error occurred
  timestamp: number;

  // Number of times this error occurred
  occurrences: number;

  // Whether error is recoverable
  recoverable: boolean;
}
```

### Custom Fallback

Create rich error UIs with suggestions:

```tsx
function CustomErrorFallback({ error, retry }: { error: ErrorInfo; retry: () => void }) {
  return (
    <div class="error-container">
      <h2>Error: {error.category}</h2>
      <p>{error.error.message}</p>

      {error.source && (
        <p class="source">
          at {error.source.file}:{error.source.line}:{error.source.column}
        </p>
      )}

      {error.suggestions.length > 0 && (
        <div class="suggestions">
          <h3>Suggested Fixes:</h3>
          <ul>
            {error.suggestions.map((suggestion, i) => (
              <li key={i}>
                <p>{suggestion.description}</p>
                {suggestion.codeChange && (
                  <div class="code-diff">
                    <pre class="before">{suggestion.codeChange.before}</pre>
                    <pre class="after">{suggestion.codeChange.after}</pre>
                  </div>
                )}
                <span class="confidence">
                  Confidence: {Math.round(suggestion.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error.recoverable && (
        <button onClick={retry}>
          Retry ({error.occurrences} attempts)
        </button>
      )}
    </div>
  );
}

<ErrorBoundary fallback={(error, retry) => (
  <CustomErrorFallback error={error} retry={retry} />
)}>
  <App />
</ErrorBoundary>
```

## Result Type

### Overview

The Result type provides Rust-inspired error handling without exceptions:

```typescript
import { Ok, Err, Result, matchResult } from '@philjs/core/result';

// Success result
const success: Result<number, Error> = Ok(42);

// Error result
const failure: Result<number, Error> = Err(new Error('Something failed'));
```

### Creating Results

```typescript
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('Cannot divide by zero');
  }
  return Ok(a / b);
}

function parseJSON<T>(json: string): Result<T, Error> {
  try {
    return Ok(JSON.parse(json));
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}

async function fetchUser(id: string): Promise<Result<User, Error>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      return Err(new Error(`HTTP ${res.status}`));
    }
    const user = await res.json();
    return Ok(user);
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
}
```

### Type Guards

```typescript
import { isOk, isErr } from '@philjs/core/result';

const result = divide(10, 2);

if (isOk(result)) {
  console.log('Result:', result.value); // TypeScript knows result.value exists
} else {
  console.log('Error:', result.error);  // TypeScript knows result.error exists
}
```

### Pattern Matching

```typescript
import { matchResult } from '@philjs/core/result';

const message = matchResult(result, {
  ok: (value) => `Success: ${value}`,
  err: (error) => `Failed: ${error}`
});

// Use in components
function DisplayResult({ result }: { result: Result<User, Error> }) {
  return matchResult(result, {
    ok: (user) => <UserProfile user={user} />,
    err: (error) => <ErrorMessage message={error.message} />
  });
}
```

### Transforming Results

```typescript
import { map, mapErr, andThen } from '@philjs/core/result';

const result = Ok(5);

// Map success value
const doubled = map(result, x => x * 2); // Ok(10)

// Map error
const withContext = mapErr(
  Err('not found'),
  e => new Error(`User ${e}`)
);

// Chain operations (flatMap)
const chained = andThen(Ok(5), x => {
  if (x > 10) return Err('Too large');
  return Ok(x * 2);
});
```

### Extracting Values

```typescript
import { unwrap, unwrapOr } from '@philjs/core/result';

// Unwrap - throws on Err
try {
  const value = unwrap(Ok(42)); // 42
  const error = unwrap(Err('oops')); // throws Error('oops')
} catch (e) {
  console.error(e);
}

// Unwrap with fallback - never throws
const value = unwrapOr(Ok(42), 0); // 42
const fallback = unwrapOr(Err('oops'), 0); // 0
```

### Chaining Multiple Results

```typescript
async function processOrder(orderId: string): Promise<Result<Receipt, Error>> {
  // Fetch order
  const orderResult = await fetchOrder(orderId);
  if (isErr(orderResult)) return orderResult;

  // Validate order
  const validationResult = validateOrder(orderResult.value);
  if (isErr(validationResult)) return validationResult;

  // Process payment
  const paymentResult = await processPayment(orderResult.value);
  if (isErr(paymentResult)) return paymentResult;

  // Generate receipt
  return Ok({
    orderId,
    paymentId: paymentResult.value.id,
    timestamp: Date.now()
  });
}

// Or using andThen for cleaner chaining
async function processOrderChained(orderId: string): Promise<Result<Receipt, Error>> {
  return andThen(await fetchOrder(orderId), order =>
    andThen(validateOrder(order), () =>
      andThen(await processPayment(order), payment =>
        Ok({
          orderId,
          paymentId: payment.id,
          timestamp: Date.now()
        })
      )
    )
  );
}
```

## Error Recovery

### Recovery Strategies

Configure automatic recovery strategies:

```typescript
import { errorRecovery, ErrorRecovery } from '@philjs/core/error-boundary';

// Add custom recovery strategy
errorRecovery.addStrategy('network', {
  name: 'Network Retry',
  shouldApply: (error) => {
    return error.message.includes('fetch') ||
           error.message.includes('network');
  },
  execute: async (error, context) => {
    // Exponential backoff retry
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      try {
        return await context.retry();
      } catch (e) {
        if (i === 2) throw e;
      }
    }
  }
});

// Add fallback value strategy
errorRecovery.addStrategy('type', {
  name: 'Fallback Value',
  shouldApply: (error) => {
    return error.message.includes('undefined') ||
           error.message.includes('null');
  },
  execute: async (error, context) => {
    return context.fallbackValue ?? null;
  }
});
```

### Using Recovery

```typescript
async function fetchWithRecovery() {
  try {
    return await fetchData();
  } catch (error) {
    return errorRecovery.recover(
      error as Error,
      'network',
      {
        retry: fetchData,
        fallbackValue: cachedData
      }
    );
  }
}
```

## Global Error Handling

### Setup Global Handler

```typescript
import { setupGlobalErrorHandler } from '@philjs/core/error-boundary';

const cleanup = setupGlobalErrorHandler((error) => {
  // Log to console
  console.error('Global error:', error);

  // Send to monitoring service
  trackError(error);

  // Show user notification
  showErrorNotification(error.error.message);
});

// Later: remove handler
cleanup();
```

### Handling Unhandled Rejections

The global handler catches both window errors and unhandled promise rejections:

```typescript
setupGlobalErrorHandler((error) => {
  if (error.category === 'network') {
    showOfflineNotification();
  } else if (error.category === 'permission') {
    showPermissionRequest();
  } else {
    showGenericError(error);
  }
});
```

## Error Tracking Integration

### Sentry Integration

```typescript
import * as Sentry from '@sentry/browser';
import { setupGlobalErrorHandler } from '@philjs/core/error-boundary';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

setupGlobalErrorHandler((error) => {
  Sentry.captureException(error.error, {
    extra: {
      category: error.category,
      componentStack: error.componentStack,
      source: error.source,
      suggestions: error.suggestions
    }
  });
});
```

### Custom Tracking

```typescript
setupGlobalErrorHandler((error) => {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.error.message,
      stack: error.error.stack,
      category: error.category,
      source: error.source,
      timestamp: error.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  });
});
```

## Best Practices

### 1. Use Error Boundaries at Multiple Levels

```tsx
// App level - catch catastrophic errors
<ErrorBoundary name="App" fallbackPattern="default">
  {/* Route level - isolate page errors */}
  <ErrorBoundary name="Page" fallbackPattern="empty-state">
    {/* Component level - isolate widget errors */}
    <ErrorBoundary name="Widget" fallbackPattern="minimal">
      <Widget />
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>
```

### 2. Use Result for Expected Errors

```typescript
// Good: Result for expected failure cases
function parseConfig(json: string): Result<Config, ParseError> {
  // ...
}

// Good: throw for programmer errors
function processItem(item: Item | null): ProcessedItem {
  if (!item) {
    throw new Error('Item is required'); // Bug in calling code
  }
  // ...
}
```

### 3. Provide Helpful Fallbacks

```tsx
<ErrorBoundary
  fallback={(error, retry) => (
    <div>
      <p>We couldn't load your data.</p>
      <p>This might be due to: {error.category}</p>
      <button onClick={retry}>Try again</button>
      <button onClick={() => navigate('/')}>Go home</button>
    </div>
  )}
>
  <DataComponent />
</ErrorBoundary>
```

### 4. Log Errors with Context

```typescript
setupGlobalErrorHandler((error) => {
  console.error({
    message: error.error.message,
    category: error.category,
    source: error.source,
    // Include app context
    user: currentUser?.id,
    route: router.currentPath,
    feature: featureFlags,
    sessionId: getSessionId()
  });
});
```

## Next Steps

- [Signals and Reactivity](./signals.md) - Core reactivity
- [Effects and Lifecycle](./effects-lifecycle.md) - Effect cleanup
- [Async Primitives](./async.md) - Error handling in async
- [API Reference](./api-reference.md) - Complete API documentation

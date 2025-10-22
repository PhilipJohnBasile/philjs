# Error Boundaries

Catch and handle errors gracefully in PhilJS applications.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). If this guide references `useRouter()` or other high-level helpers, treat them as conceptual examples of the planned ergonomic API.

## What You'll Learn

- Error boundary basics
- Error recovery strategies
- Error reporting
- Fallback UI
- Error logging
- Best practices

## Basic Error Boundary

### Creating an Error Boundary

```typescript
import { signal, effect } from 'philjs-core';

interface ErrorBoundaryProps {
  fallback: (error: Error, reset: () => void) => JSX.Element;
  children: JSX.Element;
  onError?: (error: Error, errorInfo: any) => void;
}

export function ErrorBoundary({
  fallback,
  children,
  onError
}: ErrorBoundaryProps) {
  const error = signal<Error | null>(null);

  const reset = () => {
    error.set(null);
  };

  // Catch synchronous errors
  try {
    if (error()) {
      return fallback(error()!, reset);
    }

    return children;
  } catch (err) {
    const caughtError = err as Error;
    error.set(caughtError);

    if (onError) {
      onError(caughtError, {});
    }

    return fallback(caughtError, reset);
  }
}

// Usage
function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <Dashboard />
    </ErrorBoundary>
  );
}
```

## Async Error Handling

### Catching Async Errors

```typescript
export function AsyncErrorBoundary({
  fallback,
  children,
  onError
}: ErrorBoundaryProps) {
  const error = signal<Error | null>(null);

  effect(() => {
    // Global error handler for unhandled promises
    const handleError = (event: ErrorEvent) => {
      error.set(event.error);

      if (onError) {
        onError(event.error, { componentStack: event.error.stack });
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      error.set(event.reason);

      if (onError) {
        onError(event.reason, {});
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  });

  const reset = () => {
    error.set(null);
  };

  if (error()) {
    return fallback(error()!, reset);
  }

  return children;
}
```

## Fallback UI

### Custom Fallback Components

```typescript
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h1>Oops! Something went wrong</h1>
      <p className="error-message">{error.message}</p>

      <details className="error-details">
        <summary>Error details</summary>
        <pre>{error.stack}</pre>
      </details>

      <div className="error-actions">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <a href="/" className="btn-secondary">
          Go home
        </a>
      </div>
    </div>
  );
}

// Usage
<ErrorBoundary fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}>
  <App />
</ErrorBoundary>
```

### Different Fallbacks for Different Errors

```typescript
function SmartErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  // Network error
  if (error.message.includes('fetch')) {
    return (
      <div>
        <h2>Connection Error</h2>
        <p>Unable to connect to the server. Please check your internet connection.</p>
        <button onClick={reset}>Retry</button>
      </div>
    );
  }

  // Not found error
  if (error.message.includes('404')) {
    return (
      <div>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go home</a>
      </div>
    );
  }

  // Unauthorized error
  if (error.message.includes('401') || error.message.includes('403')) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this resource.</p>
        <a href="/login">Log in</a>
      </div>
    );
  }

  // Generic error
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Error Recovery

### Retry Logic

```typescript
export function RetryErrorBoundary({
  maxRetries = 3,
  retryDelay = 1000,
  fallback,
  children
}: {
  maxRetries?: number;
  retryDelay?: number;
  fallback: (error: Error, reset: () => void, retries: number) => JSX.Element;
  children: JSX.Element;
}) {
  const error = signal<Error | null>(null);
  const retries = signal(0);

  const reset = async () => {
    if (retries() < maxRetries) {
      retries.set(retries() + 1);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));

      error.set(null);
    }
  };

  if (error()) {
    return fallback(error()!, reset, retries());
  }

  return children;
}

// Usage
<RetryErrorBoundary
  maxRetries={3}
  fallback={(error, reset, retries) => (
    <div>
      <p>Error: {error.message}</p>
      <p>Retries: {retries} / 3</p>
      <button onClick={reset} disabled={retries >= 3}>
        {retries < 3 ? 'Retry' : 'Max retries reached'}
      </button>
    </div>
  )}
>
  <DataLoader />
</RetryErrorBoundary>
```

### Graceful Degradation

```typescript
function GracefulDataLoader() {
  const data = signal(null);
  const error = signal<Error | null>(null);
  const fallbackData = signal(getCachedData());

  effect(async () => {
    try {
      const result = await fetchData();
      data.set(result);
      error.set(null);
    } catch (err) {
      error.set(err as Error);

      // Use cached/fallback data
      if (!fallbackData()) {
        throw err; // Propagate to error boundary
      }
    }
  });

  if (error() && fallbackData()) {
    return (
      <div>
        <div className="warning">
          Unable to load latest data. Showing cached version.
        </div>
        <DataDisplay data={fallbackData()} />
      </div>
    );
  }

  return <DataDisplay data={data()} />;
}
```

## Error Reporting

### Log Errors to Service

```typescript
async function reportError(error: Error, errorInfo: any) {
  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    });
  } catch (reportError) {
    console.error('Failed to report error:', reportError);
  }
}

// Usage
<ErrorBoundary
  fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}
  onError={reportError}
>
  <App />
</ErrorBoundary>
```

### Third-Party Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  }
});

function ErrorBoundaryWithSentry({ children, fallback }: ErrorBoundaryProps) {
  const error = signal<Error | null>(null);

  const handleError = (err: Error, errorInfo: any) => {
    // Log to Sentry
    Sentry.captureException(err, {
      contexts: {
        errorInfo
      }
    });

    error.set(err);
  };

  // Error boundary implementation...

  return children;
}
```

## Nested Error Boundaries

### Component-Level Error Handling

```typescript
function App() {
  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <Header />

      <main>
        <ErrorBoundary fallback={SidebarErrorFallback}>
          <Sidebar />
        </ErrorBoundary>

        <ErrorBoundary fallback={ContentErrorFallback}>
          <Content />
        </ErrorBoundary>
      </main>

      <Footer />
    </ErrorBoundary>
  );
}

// If Sidebar crashes, only Sidebar shows error
// Rest of app continues working
```

### Route-Level Error Handling

```typescript
import { Router, Route, ErrorBoundary } from 'philjs-router';

function App() {
  return (
    <Router>
      <Route
        path="/dashboard"
        component={() => (
          <ErrorBoundary fallback={DashboardError}>
            <Dashboard />
          </ErrorBoundary>
        )}
      />

      <Route
        path="/settings"
        component={() => (
          <ErrorBoundary fallback={SettingsError}>
            <Settings />
          </ErrorBoundary>
        )}
      />
    </Router>
  );
}
```

## Error State Management

### Global Error Store

```typescript
import { signal } from 'philjs-core';

interface AppError {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: number;
}

const errors = signal<AppError[]>([]);

export function useErrors() {
  const addError = (error: Omit<AppError, 'id' | 'timestamp'>) => {
    errors.set([
      ...errors(),
      {
        ...error,
        id: Math.random().toString(36),
        timestamp: Date.now()
      }
    ]);
  };

  const removeError = (id: string) => {
    errors.set(errors().filter(e => e.id !== id));
  };

  const clearErrors = () => {
    errors.set([]);
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors
  };
}

// Usage - Global error toast
function ErrorToasts() {
  const { errors, removeError } = useErrors();

  return (
    <div className="error-toasts">
      {errors().map(error => (
        <div key={error.id} className={`toast toast-${error.severity}`}>
          <p>{error.message}</p>
          <button onClick={() => removeError(error.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

### Provide Meaningful Error Messages

```typescript
// ❌ Generic errors
throw new Error('Error');
throw new Error('Something went wrong');

// ✅ Specific errors
throw new Error('Failed to load user profile: User ID not found');
throw new Error('Network request failed: Unable to connect to API server');
```

### Don't Catch Everything

```typescript
// ❌ Catching too broadly
<ErrorBoundary fallback={GenericError}>
  <Button onClick={handleClick}>Click me</Button>
</ErrorBoundary>

// ✅ Catch at appropriate level
<ErrorBoundary fallback={AppError}>
  <Header />

  <ErrorBoundary fallback={ContentError}>
    <DataLoader />
  </ErrorBoundary>
</ErrorBoundary>
```

### Log Errors in Development

```typescript
function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: any) => {
    // Always log in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Report in production
    if (import.meta.env.PROD) {
      reportError(error, errorInfo);
    }
  };

  // ...
}
```

### Test Error Scenarios

```typescript
describe('ErrorBoundary', () => {
  it('catches and displays error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const container = document.createElement('div');

    render(
      <ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
        <ThrowError />
      </ErrorBoundary>,
      container
    );

    expect(container.textContent).toContain('Error: Test error');
  });

  it('calls onError callback', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary
        fallback={() => <div>Error</div>}
        onError={onError}
      >
        <ThrowError />
      </ErrorBoundary>,
      document.createElement('div')
    );

    expect(onError).toHaveBeenCalled();
  });

  it('resets error on retry', () => {
    let shouldThrow = true;

    const Component = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    const container = document.createElement('div');

    render(
      <ErrorBoundary fallback={(error, reset) => (
        <div>
          <p>Error</p>
          <button onClick={reset}>Retry</button>
        </div>
      )}>
        <Component />
      </ErrorBoundary>,
      container
    );

    expect(container.textContent).toContain('Error');

    // Fix the error and retry
    shouldThrow = false;
    const button = container.querySelector('button')!;
    button.click();

    expect(container.textContent).toContain('Success');
  });
});
```

## Summary

You've learned:

✅ Creating error boundaries
✅ Async error handling
✅ Custom fallback UI
✅ Error recovery strategies
✅ Error reporting and logging
✅ Nested error boundaries
✅ Global error state management
✅ Best practices for error handling

Error boundaries ensure robust, user-friendly applications!

---

**Next:** [Portals →](./portals.md) Render outside component hierarchy

# Error Boundaries

Error boundaries catch errors in components and display fallback UI instead of crashing the entire application.

## What You'll Learn

- What error boundaries are
- Creating error boundaries
- Error handling strategies
- Recovery patterns
- Best practices

## What is an Error Boundary?

An error boundary is a component that catches JavaScript errors in its child components, logs them, and displays fallback UI.

```typescript
function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <UserDashboard />
    </ErrorBoundary>
  );
}

// If UserDashboard throws an error, ErrorMessage is shown instead
```

## Creating an Error Boundary

```typescript
import { signal } from 'philjs-core';

interface ErrorBoundaryProps {
  children: any;
  fallback: any;
  onError?: (error: Error) => void;
}

function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  const error = signal<Error | null>(null);

  try {
    // Render children
    if (error()) {
      return fallback;
    }

    return children;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    error.set(err);
    onError?.(err);
    return fallback;
  }
}

// Usage:
<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={(error) => console.error('Error caught:', error)}
>
  <MyComponent />
</ErrorBoundary>
```

## Fallback UI

### Basic Fallback

```typescript
function ErrorMessage() {
  return (
    <div style={{
      padding: '2rem',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '4px'
    }}>
      <h2>Oops! Something went wrong</h2>
      <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
    </div>
  );
}

<ErrorBoundary fallback={<ErrorMessage />}>
  <App />
</ErrorBoundary>
```

### Fallback with Error Details

```typescript
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-container">
      <h2>Application Error</h2>
      <details>
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </details>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
}
```

## Error Recovery

### Reset Error Boundary

```typescript
interface ErrorBoundaryProps {
  children: any;
  fallback: (error: Error, reset: () => void) => any;
}

function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const error = signal<Error | null>(null);

  const reset = () => {
    error.set(null);
  };

  if (error()) {
    return fallback(error()!, reset);
  }

  try {
    return children;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    error.set(err);
    return fallback(err, reset);
  }
}

// Usage:
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>Error: {error.message}</h2>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

### Automatic Retry

```typescript
function ErrorBoundary({ children, maxRetries = 3 }: {
  children: any;
  maxRetries?: number;
}) {
  const error = signal<Error | null>(null);
  const retries = signal(0);

  const reset = () => {
    error.set(null);
    retries.set(retries() + 1);
  };

  // Automatic retry after delay
  effect(() => {
    const err = error();
    if (err && retries() < maxRetries) {
      const timer = setTimeout(reset, 2000);
      return () => clearTimeout(timer);
    }
  });

  if (error()) {
    if (retries() >= maxRetries) {
      return (
        <div>
          <h2>Failed after {maxRetries} attempts</h2>
          <p>{error()!.message}</p>
        </div>
      );
    }

    return (
      <div>
        <p>Error occurred. Retrying... ({retries()}/{maxRetries})</p>
      </div>
    );
  }

  try {
    return children;
  } catch (e) {
    error.set(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
}
```

## Granular Error Boundaries

Use multiple error boundaries for different parts of the UI:

```typescript
function App() {
  return (
    <div>
      <ErrorBoundary fallback={<div>Header error</div>}>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Sidebar error</div>}>
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Content error</div>}>
        <MainContent />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Footer error</div>}>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}

// If one section fails, others continue working
```

## Error Logging

### Log to Console

```typescript
<ErrorBoundary
  fallback={<ErrorMessage />}
  onError={(error) => {
    console.error('Error caught by boundary:', error);
    console.error('Stack trace:', error.stack);
  }}
>
  <App />
</ErrorBoundary>
```

### Log to Service

```typescript
function ErrorBoundary({ children }: { children: any }) {
  const error = signal<Error | null>(null);

  const handleError = (err: Error) => {
    error.set(err);

    // Log to error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
  };

  if (error()) {
    return <ErrorFallback error={error()!} />;
  }

  try {
    return children;
  } catch (e) {
    handleError(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
}
```

## Common Patterns

### Loading Error Boundary

```typescript
function DataComponent() {
  const data = signal<Data | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  effect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        data.set(d);
        loading.set(false);
      })
      .catch(e => {
        error.set(e);
        loading.set(false);
      });
  });

  if (loading()) return <Spinner />;
  if (error()) throw error();
  if (!data()) throw new Error('No data');

  return <DataView data={data()!} />;
}

<ErrorBoundary fallback={<div>Failed to load data</div>}>
  <DataComponent />
</ErrorBoundary>
```

### Form Validation Errors

```typescript
function FormBoundary({ children }: { children: any }) {
  const error = signal<Error | null>(null);

  if (error()) {
    return (
      <div className="form-error">
        <p>Form submission failed: {error()!.message}</p>
        <button onClick={() => error.set(null)}>Dismiss</button>
      </div>
    );
  }

  try {
    return children;
  } catch (e) {
    error.set(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
}
```

## Best Practices

### Place Boundaries Strategically

```typescript
// ✅ Good - boundaries at logical sections
function App() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <Router>
        <ErrorBoundary fallback={<RouteError />}>
          <Routes />
        </ErrorBoundary>
      </Router>
    </ErrorBoundary>
  );
}

// ❌ Too granular
function App() {
  return (
    <ErrorBoundary>
      <ErrorBoundary>
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

### Provide Helpful Error Messages

```typescript
// ❌ Generic message
<ErrorBoundary fallback={<div>Error</div>}>

// ✅ Helpful message
<ErrorBoundary
  fallback={
    <div>
      <h2>Unable to load dashboard</h2>
      <p>Please check your connection and try again</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  }
>
```

### Log Errors for Debugging

```typescript
<ErrorBoundary
  fallback={<ErrorMessage />}
  onError={(error) => {
    // Development: log to console
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }

    // Production: send to error tracking
    if (process.env.NODE_ENV === 'production') {
      logErrorToService(error);
    }
  }}
>
```

## Testing Error Boundaries

```typescript
// Component that throws error on demand
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }

  return <div>Working fine</div>;
}

// Test
function TestErrorBoundary() {
  const shouldThrow = signal(false);

  return (
    <div>
      <button onClick={() => shouldThrow.set(true)}>
        Trigger Error
      </button>

      <ErrorBoundary fallback={<div>Error caught!</div>}>
        <BuggyComponent shouldThrow={shouldThrow()} />
      </ErrorBoundary>
    </div>
  );
}
```

## Limitations

Error boundaries **catch errors in:**
- Render methods
- Lifecycle methods
- Constructors of child components

Error boundaries **do NOT catch:**
- Event handlers (use try/catch)
- Async code (use try/catch or .catch())
- Server-side rendering errors
- Errors in the error boundary itself

### Handling Event Errors

```typescript
function Component() {
  const handleClick = () => {
    try {
      // Code that might throw
      riskyOperation();
    } catch (error) {
      console.error('Error in event handler:', error);
      // Handle error
    }
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### Handling Async Errors

```typescript
function Component() {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Async error:', error);
      // Handle error
    }
  };

  return <button onClick={fetchData}>Fetch</button>;
}
```

## Summary

You've learned:

✅ What error boundaries are and why they're important
✅ Creating error boundaries with fallback UI
✅ Error recovery and reset patterns
✅ Granular boundaries for different sections
✅ Error logging strategies
✅ Best practices and limitations

Error boundaries prevent errors from crashing your entire application!

---

**Next:** [Portals →](./portals.md) Render components outside their parent hierarchy

# Error Handling for Data Fetching

Handle data fetching errors gracefully with retry logic, fallbacks, and user-friendly messages.

## What You'll Learn

- Error detection
- Retry strategies
- Error boundaries
- Fallback UI
- Error recovery
- Best practices

## Basic Error Handling

### Simple Try-Catch

```typescript
import { signal, effect } from '@philjs/core';

function useData<T>(url: string) {
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const loading = signal(true);

  effect(() => {
    const fetchData = async () => {
      try {
        loading.set(true);
        error.set(null);

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        data.set(json);
      } catch (err) {
        error.set(err as Error);
      } finally {
        loading.set(false);
      }
    };

    fetchData();
  });

  return { data, error, loading };
}
```

### Using Error State

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data, error, loading } = useData<User>(`/api/users/${userId}`);

  if (loading()) {
    return <Spinner />;
  }

  if (error()) {
    return (
      <div className="error">
        <h2>Failed to load user</h2>
        <p>{error()!.message}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data()) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>{data()!.name}</h1>
      <p>{data()!.email}</p>
    </div>
  );
}
```

## Retry Logic

### Automatic Retry

```typescript
async function fetchWithRetry<T>(
  url: string,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      const isLastAttempt = i === maxRetries;

      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Retry with State

```typescript
function useDataWithRetry<T>(url: string, maxRetries = 3) {
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const loading = signal(true);
  const retryCount = signal(0);

  const fetchData = async () => {
    try {
      loading.set(true);
      error.set(null);

      const result = await fetchWithRetry<T>(url, maxRetries);

      data.set(result);
      retryCount.set(0);
    } catch (err) {
      error.set(err as Error);
    } finally {
      loading.set(false);
    }
  };

  const retry = () => {
    retryCount.set(c => c + 1);
    fetchData();
  };

  effect(() => {
    fetchData();
  });

  return { data, error, loading, retryCount, retry };
}
```

### Display Retry Count

```typescript
function DataComponent() {
  const { data, error, loading, retryCount, retry } = useDataWithRetry('/api/data');

  if (error()) {
    return (
      <div className="error">
        <p>Failed to load data</p>
        {retryCount() > 0 && (
          <p className="retry-info">Retry attempt: {retryCount()}</p>
        )}
        <button onClick={retry}>Try Again</button>
      </div>
    );
  }

  return <Data data={data()} />;
}
```

## Query Error Handling

### With createQuery

```typescript
import { createQuery } from '@philjs/core';

const userQuery = createQuery({
  key: (userId: string) => ['user', userId],
  fetcher: async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`);

    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }

    return res.json();
  },
  retry: 3, // Auto-retry 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (error) => {
    console.error('Query error:', error);
    // Track error in analytics
    analytics.track('query_error', { error: error.message });
  }
});

function UserProfile({ userId }: { userId: string }) {
  const { data, error, loading, refetch } = userQuery(userId);

  if (error()) {
    return (
      <ErrorDisplay
        error={error()!}
        onRetry={refetch}
      />
    );
  }

  return <Profile user={data()!} />;
}
```

## Error Types

### Custom Error Classes

```typescript
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Handle Different Error Types

```typescript
async function fetchUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`);

    if (res.status === 401) {
      throw new UnauthorizedError();
    }

    if (res.status === 404) {
      throw new NotFoundError('User');
    }

    if (!res.ok) {
      throw new NetworkError(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new NetworkError('Network request failed');
    }
    throw error;
  }
}

// Usage
function UserProfile({ id }: { id: string }) {
  const { error } = useData(id);

  if (error()) {
    const err = error()!;

    if (err instanceof UnauthorizedError) {
      return <Login />;
    }

    if (err instanceof NotFoundError) {
      return <NotFound />;
    }

    if (err instanceof NetworkError) {
      return <NetworkErrorMessage error={err} />;
    }

    return <GenericError error={err} />;
  }

  // ... render data
}
```

## Error Boundaries

### Data Error Boundary

```typescript
import { ErrorBoundary } from '@philjs/core';

function DataErrorBoundary({ children }: { children: any }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{error.message}</p>

          <div className="actions">
            <button onClick={reset}>Try Again</button>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Usage
function App() {
  return (
    <DataErrorBoundary>
      <Dashboard />
    </DataErrorBoundary>
  );
}
```

## Fallback Data

### Cached Fallback

```typescript
function useDataWithFallback<T>(url: string, fallback: T) {
  const data = signal<T>(fallback);
  const error = signal<Error | null>(null);

  effect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => data.set(json))
      .catch(err => {
        error.set(err);
        // Keep fallback data on error
        console.warn('Using fallback data due to error:', err);
      });
  });

  return { data, error, usingFallback: () => !!error() };
}
```

### LocalStorage Fallback

```typescript
function useDataWithCache<T>(url: string, cacheKey: string) {
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const fromCache = signal(false);

  effect(() => {
    // Try to load from cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        data.set(JSON.parse(cached));
        fromCache.set(true);
      } catch {}
    }

    // Fetch fresh data
    fetch(url)
      .then(res => res.json())
      .then(json => {
        data.set(json);
        fromCache.set(false);
        localStorage.setItem(cacheKey, JSON.stringify(json));
        error.set(null);
      })
      .catch(err => {
        error.set(err);
        // If fetch fails and no cache, data remains null
      });
  });

  return { data, error, fromCache };
}

// Usage
function Products() {
  const { data, error, fromCache } = useDataWithCache(
    '/api/products',
    'products-cache'
  );

  return (
    <div>
      {fromCache() && (
        <div className="cache-notice">
          Showing cached data{error() && ' (failed to refresh)'}
        </div>
      )}

      {data() && <ProductList products={data()!} />}
    </div>
  );
}
```

## User-Friendly Error Messages

### Error Message Mapping

```typescript
function getUserFriendlyMessage(error: Error): string {
  const errorMessages: Record<string, string> = {
    'NetworkError': 'Unable to connect. Please check your internet connection.',
    'NotFoundError': 'The requested item could not be found.',
    'UnauthorizedError': 'You need to log in to view this content.',
    'ValidationError': 'Please check your input and try again.',
    'TimeoutError': 'The request took too long. Please try again.',
  };

  return errorMessages[error.name] || 'An unexpected error occurred.';
}

function ErrorDisplay({ error, onRetry }: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="error-display">
      <div className="error-icon">⚠️</div>
      <h3>Oops!</h3>
      <p>{getUserFriendlyMessage(error)}</p>

      <div className="error-actions">
        <button onClick={onRetry} className="primary">
          Try Again
        </button>
        <button onClick={() => window.history.back()}>
          Go Back
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="error-details">
          <summary>Technical Details</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
    </div>
  );
}
```

## Partial Failures

### Some Requests Succeed

```typescript
async function fetchAllData() {
  const results = await Promise.allSettled([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);

  return {
    users: results[0].status === 'fulfilled' ? results[0].value : null,
    posts: results[1].status === 'fulfilled' ? results[1].value : null,
    comments: results[2].status === 'fulfilled' ? results[2].value : null,
    errors: results
      .map((r, i) => r.status === 'rejected' ? { index: i, reason: r.reason } : null)
      .filter(Boolean)
  };
}

function Dashboard() {
  const { data, errors } = usePartialData(fetchAllData);

  return (
    <div>
      {errors().length > 0 && (
        <div className="partial-error-banner">
          Some data couldn't be loaded. Showing available content.
        </div>
      )}

      {data()?.users && <UsersList users={data()!.users} />}
      {data()?.posts && <PostsList posts={data()!.posts} />}
      {data()?.comments && <CommentsList comments={data()!.comments} />}
    </div>
  );
}
```

## Error Logging

### Log to Service

```typescript
function logError(error: Error, context?: Record<string, any>) {
  // Log to service (Sentry, LogRocket, etc.)
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now()
    })
  }).catch(console.error);
}

// Use in queries
const userQuery = createQuery({
  key: (id) => ['user', id],
  fetcher: fetchUser,
  onError: (error, variables) => {
    logError(error, {
      queryKey: ['user', variables],
      component: 'UserProfile'
    });
  }
});
```

## Best Practices

### Always Handle Errors

```typescript
// ✅ Handle all error cases
const { data, error, loading } = useData(url);

if (loading()) return <Spinner />;
if (error()) return <Error error={error()!} />;
return <Data data={data()!} />;

// ❌ Ignore errors
const { data } = useData(url);
return <Data data={data()} />;
```

### Provide Retry Mechanism

```typescript
// ✅ Let users retry
<button onClick={refetch}>Try Again</button>

// ❌ Dead end
<div>Error loading data</div>
```

### Show Loading States

```typescript
// ✅ Show loading indicator
{loading() && <Spinner />}
{error() && <Error />}

// ❌ Blank screen while loading
```

### Use Appropriate Retry Strategies

```typescript
// ✅ Retry for transient errors
retry: 3,
retryDelay: exponentialBackoff

// ❌ Retry for client errors (400-499)
// Don't retry validation errors
```

### Log Errors for Debugging

```typescript
// ✅ Log to error tracking service
onError: (error) => {
  logError(error);
}

// ❌ Silent failure
onError: () => {}
```

## Summary

You've learned:

✅ Basic error handling with try-catch
✅ Automatic retry with exponential backoff
✅ Query-level error handling
✅ Custom error types
✅ Error boundaries
✅ Fallback data strategies
✅ User-friendly error messages
✅ Handling partial failures
✅ Error logging
✅ Best practices

Proper error handling creates resilient applications!

---

**Next:** [Static Generation →](./static-generation.md) Generate pages at build time for blazing speed



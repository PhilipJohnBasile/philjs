# Error Handling

Handle routing errors, 404 pages, and error boundaries for robust navigation.


## What You'll Learn

- Custom 404 pages
- Error boundaries for routes
- Handling navigation errors
- API route errors
- Error recovery
- Best practices

## 404 Not Found

### Basic 404 Page

```typescript
// src/pages/404.tsx
import { Link } from '@philjs/router';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/">Go Home</Link>
    </div>
  );
}
```

### Custom 404 with Search

```typescript
// src/pages/404.tsx
import { Link, usePathname } from '@philjs/router';
import { signal } from '@philjs/core';

export default function NotFound() {
  const pathname = usePathname();
  const searchQuery = signal('');

  return (
    <div className="not-found">
      <h1>Page Not Found</h1>
      <p>We couldn't find: <code>{pathname}</code></p>

      <div className="suggestions">
        <h2>Maybe you were looking for:</h2>
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li><Link href="/docs">Documentation</Link></li>
        </ul>
      </div>

      <div className="search">
        <h2>Search our site:</h2>
        <input
          type="search"
          value={searchQuery()}
          onInput={(e) => searchQuery.set(e.target.value)}
          placeholder="What are you looking for?"
        />
      </div>
    </div>
  );
}
```

### 404 with Analytics

```typescript
// src/pages/404.tsx
import { usePathname } from '@philjs/router';
import { effect } from '@philjs/core';

export default function NotFound() {
  const pathname = usePathname();

  effect(() => {
    // Track 404 errors
    analytics.track('404_error', {
      path: pathname,
      referrer: document.referrer
    });
  });

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Path: {pathname}</p>
    </div>
  );
}
```

## Error Boundaries

### Route Error Boundary

```typescript
// src/pages/error.tsx
import { useRouter } from '@philjs/router';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>

      <div className="error-actions">
        <button onClick={reset}>Try Again</button>
        <button onClick={() => router.push('/')}>Go Home</button>
      </div>
    </div>
  );
}
```

### Global Error Boundary

```typescript
// src/App.tsx
import { ErrorBoundary } from '@philjs/core';
import { Router } from '@philjs/router';

export default function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="global-error">
          <h1>Application Error</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Reload App</button>
        </div>
      )}
    >
      <Router />
    </ErrorBoundary>
  );
}
```

### Layout Error Boundary

```typescript
// src/pages/(app)/layout.tsx
import { ErrorBoundary } from '@philjs/core';

export default function AppLayout({ children }: { children: any }) {
  return (
    <div className="app-layout">
      <AppHeader />

      <ErrorBoundary
        fallback={(error, reset) => (
          <div className="route-error">
            <h2>Error loading page</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Retry</button>
          </div>
        )}
      >
        {children}
      </ErrorBoundary>
    </div>
  );
}
```

## Navigation Error Handling

### Handle Navigation Errors

```typescript
import { useRouter } from '@philjs/router';
import { signal, effect } from '@philjs/core';

export default function App() {
  const router = useRouter();
  const navigationError = signal<Error | null>(null);

  effect(() => {
    const handleError = (error: Error) => {
      console.error('Navigation error:', error);
      navigationError.set(error);
    };

    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeError', handleError);
    };
  });

  return (
    <div>
      {navigationError() && (
        <div className="navigation-error">
          <p>Navigation failed: {navigationError()!.message}</p>
          <button onClick={() => navigationError.set(null)}>Dismiss</button>
        </div>
      )}

      <Router />
    </div>
  );
}
```

### Retry Failed Navigation

```typescript
import { useRouter } from '@philjs/router';
import { signal } from '@philjs/core';

function useRetryableNavigation() {
  const router = useRouter();
  const lastAttemptedRoute = signal<string | null>(null);
  const error = signal<Error | null>(null);

  const navigate = async (path: string) => {
    lastAttemptedRoute.set(path);
    error.set(null);

    try {
      await router.push(path);
    } catch (e) {
      error.set(e as Error);
    }
  };

  const retry = () => {
    if (lastAttemptedRoute()) {
      navigate(lastAttemptedRoute()!);
    }
  };

  return { navigate, retry, error };
}
```

## Data Fetching Errors

### Handle Route Data Errors

```typescript
// src/pages/blog/[slug].tsx
import { useParams } from '@philjs/router';
import { signal, effect } from '@philjs/core';

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = signal(null);
  const error = signal<Error | null>(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);
    error.set(null);

    fetch(`/api/posts/${params.slug}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Post not found: ${params.slug}`);
        }
        return res.json();
      })
      .then(data => {
        post.set(data);
        loading.set(false);
      })
      .catch(err => {
        error.set(err);
        loading.set(false);
      });
  });

  if (loading()) return <LoadingSkeleton />;

  if (error()) {
    return (
      <div className="post-error">
        <h1>Error Loading Post</h1>
        <p>{error()!.message}</p>
        <Link href="/blog">← Back to Blog</Link>
      </div>
    );
  }

  if (!post()) {
    return <NotFound />;
  }

  return <PostView post={post()!} />;
}
```

### Automatic Retry

```typescript
import { signal, effect } from '@philjs/core';

function useRetryableFetch<T>(url: string, maxRetries = 3) {
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);
  const loading = signal(true);
  const retryCount = signal(0);

  effect(() => {
    const fetchData = async () => {
      try {
        loading.set(true);
        const res = await fetch(url);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        data.set(json);
        error.set(null);
        retryCount.set(0);
      } catch (err) {
        if (retryCount() < maxRetries) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount()) * 1000;
          setTimeout(() => {
            retryCount.set(c => c + 1);
            fetchData();
          }, delay);
        } else {
          error.set(err as Error);
        }
      } finally {
        loading.set(false);
      }
    };

    fetchData();
  });

  return { data, error, loading, retryCount };
}
```

## API Route Errors

### API Error Handler

```typescript
// src/pages/api/users/[id].ts
export async function GET(request: Request, { params }: any) {
  try {
    const user = await db.users.findById(params.id);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error('API error:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
```

### Validation Errors

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(18).max(120)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate
    const result = UserSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: result.error.issues
        }),
        { status: 400 }
      );
    }

    // Create user
    const user = await db.users.create(result.data);

    return new Response(JSON.stringify(user), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}
```

## Error Recovery

### Refresh on Error

```typescript
import { signal, effect } from '@philjs/core';

export default function Dashboard() {
  const data = signal(null);
  const error = signal<Error | null>(null);

  const fetchData = () => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        data.set(d);
        error.set(null);
      })
      .catch(e => error.set(e));
  };

  effect(() => {
    fetchData();
  });

  if (error()) {
    return (
      <div className="error-state">
        <h2>Failed to load dashboard</h2>
        <p>{error()!.message}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return <DashboardView data={data()} />;
}
```

### Fallback Content

```typescript
import { signal, effect } from '@philjs/core';

export default function ProductList() {
  const products = signal([]);
  const error = signal<Error | null>(null);

  effect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => products.set(d))
      .catch(e => {
        error.set(e);
        // Use cached data as fallback
        const cached = localStorage.getItem('products');
        if (cached) {
          products.set(JSON.parse(cached));
        }
      });
  });

  return (
    <div>
      {error() && (
        <div className="error-banner">
          Error loading latest data. Showing cached content.
        </div>
      )}

      <ProductGrid products={products()} />
    </div>
  );
}
```

## Offline Handling

### Detect Offline State

```typescript
import { signal, effect } from '@philjs/core';

const isOnline = signal(navigator.onLine);

export default function App() {
  effect(() => {
    const handleOnline = () => isOnline.set(true);
    const handleOffline = () => isOnline.set(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  return (
    <div>
      {!isOnline() && (
        <div className="offline-banner">
          You are offline. Some features may not be available.
        </div>
      )}

      <Router />
    </div>
  );
}
```

### Queue Failed Requests

```typescript
import { signal } from '@philjs/core';

const failedRequests = signal<Array<{ url: string; options: RequestInit }>>([]);

async function resilientFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return response;
  } catch (error) {
    // Queue for retry
    failedRequests.set([...failedRequests(), { url, options: options || {} }]);
    throw error;
  }
}

// Retry when back online
window.addEventListener('online', async () => {
  const queued = failedRequests();
  failedRequests.set([]);

  for (const request of queued) {
    try {
      await fetch(request.url, request.options);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }
});
```

## Error Monitoring

### Log Errors to Service

```typescript
function logError(error: Error, context?: any) {
  // Log to service like Sentry, LogRocket, etc.
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    })
  }).catch(console.error);
}
```

### Route Error Monitoring

```typescript
import { useRouter, usePathname } from '@philjs/router';
import { effect } from '@philjs/core';

export default function ErrorMonitoring({ children }: { children: any }) {
  const router = useRouter();
  const pathname = usePathname();

  effect(() => {
    const handleError = (error: Error) => {
      logError(error, {
        route: pathname,
        type: 'navigation'
      });
    };

    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeError', handleError);
    };
  });

  return children;
}
```

## User-Friendly Error Messages

### Error Message Mapping

```typescript
function getUserFriendlyMessage(error: Error): string {
  const errorMessages: Record<string, string> = {
    'NetworkError': 'Unable to connect. Please check your internet connection.',
    'NotFoundError': 'The requested item was not found.',
    'UnauthorizedError': 'You need to log in to access this page.',
    'ForbiddenError': 'You don\'t have permission to access this resource.',
    'ValidationError': 'Please check your input and try again.',
    'ServerError': 'Something went wrong on our end. Please try again later.'
  };

  return errorMessages[error.name] || 'An unexpected error occurred.';
}
```

### Contextual Error Pages

```typescript
interface ErrorPageProps {
  error: Error;
  context: 'route' | 'data' | 'auth';
}

export default function ErrorPage({ error, context }: ErrorPageProps) {
  const suggestions = {
    route: [
      'Check the URL for typos',
      'Go back to the home page',
      'Search our site'
    ],
    data: [
      'Refresh the page',
      'Try again in a moment',
      'Contact support if the problem persists'
    ],
    auth: [
      'Log in to your account',
      'Reset your password',
      'Contact support'
    ]
  };

  return (
    <div className="error-page">
      <h1>Oops!</h1>
      <p>{getUserFriendlyMessage(error)}</p>

      <div className="suggestions">
        <h2>Try this:</h2>
        <ul>
          {suggestions[context].map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Best Practices

### Always Show User Feedback

```typescript
// ✅ Show error message
if (error()) {
  return <ErrorMessage error={error()!} />;
}

// ❌ Silent failure
if (error()) {
  console.error(error());
  return null;
}
```

### Provide Recovery Options

```typescript
// ✅ Offer retry and alternatives
<div>
  <p>Error: {error()!.message}</p>
  <button onClick={retry}>Retry</button>
  <Link href="/">Go Home</Link>
</div>

// ❌ Dead end
<div>Error occurred</div>
```

### Log Errors for Debugging

```typescript
// ✅ Log with context
effect(() => {
  if (error()) {
    console.error('Route error:', {
      error: error(),
      route: pathname,
      timestamp: Date.now()
    });
  }
});

// ❌ Generic logging
console.error(error());
```

### Use Error Boundaries

```typescript
// ✅ Catch errors at appropriate levels
<ErrorBoundary fallback={ErrorPage}>
  <Router />
</ErrorBoundary>

// ❌ No error handling
<Router />
```

### Differentiate Error Types

```typescript
// ✅ Handle different errors differently
if (error()?.name === 'NotFoundError') {
  return <NotFound />;
} else if (error()?.name === 'UnauthorizedError') {
  return <Login />;
} else {
  return <GenericError />;
}

// ❌ Same treatment for all errors
return <Error />;
```

## Summary

You've learned:

✅ Creating custom 404 pages
✅ Error boundaries for routes
✅ Navigation error handling
✅ Data fetching errors
✅ API route error responses
✅ Error recovery strategies
✅ Offline handling
✅ Error monitoring
✅ User-friendly error messages
✅ Best practices

Proper error handling creates resilient applications!

---

**Next:** [Loading States →](./loading-states.md) Show loading UI during navigation

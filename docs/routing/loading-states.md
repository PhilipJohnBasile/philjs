# Loading States

Show beautiful loading UI during route transitions and data fetching.

## What You'll Learn

- Route loading indicators
- Suspense boundaries
- Skeleton screens
- Progress bars
- Streaming content
- Best practices

## Basic Loading States

### Page-Level Loading

```typescript
// src/pages/blog/[slug].tsx
import { useParams } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const post = signal(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);

    fetch(`/api/posts/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        post.set(data);
        loading.set(false);
      });
  });

  if (loading()) {
    return (
      <div className="loading">
        <Spinner />
        <p>Loading post...</p>
      </div>
    );
  }

  return <PostView post={post()!} />;
}
```

### Component Loading

```typescript
import { signal, effect } from 'philjs-core';

function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);
  const loading = signal(true);

  effect(() => {
    loading.set(true);

    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => {
        user.set(data);
        loading.set(false);
      });
  });

  if (loading()) return <Spinner />;

  return (
    <div className="user-profile">
      <h2>{user()!.name}</h2>
      <p>{user()!.email}</p>
    </div>
  );
}
```

## Navigation Loading

### Global Loading Indicator

```typescript
// src/App.tsx
import { useRouter } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export default function App() {
  const router = useRouter();
  const loading = signal(false);

  effect(() => {
    const handleStart = () => loading.set(true);
    const handleComplete = () => loading.set(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  });

  return (
    <div>
      {loading() && <LoadingBar />}
      <Router />
    </div>
  );
}
```

### Progress Bar

```typescript
import { signal, effect } from 'philjs-core';

function LoadingBar() {
  const progress = signal(0);
  const visible = signal(false);

  const start = () => {
    visible.set(true);
    progress.set(0);

    const interval = setInterval(() => {
      progress.set(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 100);
  };

  const complete = () => {
    progress.set(100);
    setTimeout(() => {
      visible.set(false);
      progress.set(0);
    }, 200);
  };

  if (!visible()) return null;

  return (
    <div
      className="loading-bar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: '#667eea',
        width: `${progress()}%`,
        transition: 'width 0.2s ease'
      }}
    />
  );
}
```

### Top Loading Bar

```typescript
import { useRouter } from 'philjs-router';
import { signal, effect } from 'philjs-core';

export function TopLoadingBar() {
  const router = useRouter();
  const progress = signal(0);
  const visible = signal(false);

  effect(() => {
    let interval: any;

    const start = () => {
      visible.set(true);
      progress.set(0);

      interval = setInterval(() => {
        progress.set(p => Math.min(p + Math.random() * 10, 90));
      }, 200);
    };

    const complete = () => {
      clearInterval(interval);
      progress.set(100);

      setTimeout(() => {
        visible.set(false);
        progress.set(0);
      }, 300);
    };

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', complete);
    router.events.on('routeChangeError', complete);

    return () => {
      clearInterval(interval);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', complete);
      router.events.off('routeChangeError', complete);
    };
  });

  if (!visible()) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress()}%`,
        height: '2px',
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        transition: 'width 0.3s ease',
        zIndex: 9999
      }}
    />
  );
}
```

## Skeleton Screens

### Basic Skeleton

```typescript
function PostSkeleton() {
  return (
    <div className="post-skeleton">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-meta" />
      <div className="skeleton skeleton-paragraph" />
      <div className="skeleton skeleton-paragraph" />
      <div className="skeleton skeleton-paragraph" />
    </div>
  );
}
```

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 32px;
  width: 70%;
  margin-bottom: 16px;
}

.skeleton-meta {
  height: 16px;
  width: 40%;
  margin-bottom: 24px;
}

.skeleton-paragraph {
  height: 16px;
  width: 100%;
  margin-bottom: 8px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### Card Skeleton

```typescript
function ProductCardSkeleton() {
  return (
    <div className="card-skeleton">
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-price" />
      <div className="skeleton skeleton-button" />
    </div>
  );
}
```

### List Skeleton

```typescript
function ProductListSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

## Suspense Boundaries

### Basic Suspense

```typescript
import { Suspense, lazy } from 'philjs-core';

const Dashboard = lazy(() => import('./pages/Dashboard'));

export default function App() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Nested Suspense

```typescript
import { Suspense } from 'philjs-core';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      <div className="dashboard-grid">
        <Suspense fallback={<WidgetSkeleton />}>
          <RevenueWidget />
        </Suspense>

        <Suspense fallback={<WidgetSkeleton />}>
          <UsersWidget />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <AnalyticsChart />
        </Suspense>
      </div>
    </div>
  );
}
```

### Suspense with Error Boundary

```typescript
import { Suspense, ErrorBoundary } from 'philjs-core';

export default function Page() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={reset}>Retry</button>
        </div>
      )}
    >
      <Suspense fallback={<PageSkeleton />}>
        <PageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Loading UI Patterns

### Spinner

```typescript
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: '16px',
    md: '32px',
    lg: '64px'
  };

  return (
    <div
      className="spinner"
      style={{
        width: sizes[size],
        height: sizes[size],
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );
}
```

### Dots Loader

```typescript
function DotsLoader() {
  return (
    <div className="dots-loader">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );
}
```

```css
.dots-loader {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
```

### Pulse Loader

```typescript
function PulseLoader() {
  return (
    <div className="pulse-loader">
      <div className="pulse-circle pulse-1" />
      <div className="pulse-circle pulse-2" />
      <div className="pulse-circle pulse-3" />
    </div>
  );
}
```

## Layout Loading

### Layout with Loading Slot

```typescript
// src/pages/(app)/layout.tsx
export default function AppLayout({ children }: { children: any }) {
  return (
    <div className="app-layout">
      <AppHeader />

      <div className="app-body">
        <AppSidebar />

        <main className="app-content">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

### Loading Files

```typescript
// src/pages/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="dashboard-loading">
      <div className="skeleton-header" />
      <div className="skeleton-stats">
        <div className="skeleton-stat" />
        <div className="skeleton-stat" />
        <div className="skeleton-stat" />
      </div>
      <div className="skeleton-chart" />
    </div>
  );
}
```

## Streaming Content

### Incremental Loading

```typescript
import { signal, effect } from 'philjs-core';

function InfiniteList() {
  const items = signal<any[]>([]);
  const loading = signal(false);
  const page = signal(1);

  const loadMore = () => {
    if (loading()) return;

    loading.set(true);

    fetch(`/api/items?page=${page()}`)
      .then(r => r.json())
      .then(data => {
        items.set([...items(), ...data]);
        page.set(p => p + 1);
        loading.set(false);
      });
  };

  effect(() => {
    loadMore();
  });

  return (
    <div>
      {items().map(item => (
        <ItemCard key={item.id} item={item} />
      ))}

      {loading() && <Spinner />}

      <button onClick={loadMore} disabled={loading()}>
        Load More
      </button>
    </div>
  );
}
```

### Infinite Scroll

```typescript
import { signal, effect } from 'philjs-core';

function InfiniteScroll() {
  const items = signal<any[]>([]);
  const loading = signal(false);
  const hasMore = signal(true);

  effect(() => {
    const handleScroll = () => {
      if (loading() || !hasMore()) return;

      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const loadMore = async () => {
    loading.set(true);

    const response = await fetch(`/api/items?offset=${items().length}`);
    const data = await response.json();

    if (data.length === 0) {
      hasMore.set(false);
    } else {
      items.set([...items(), ...data]);
    }

    loading.set(false);
  };

  return (
    <div>
      {items().map(item => (
        <ItemCard key={item.id} item={item} />
      ))}

      {loading() && <Spinner />}
      {!hasMore() && <p>No more items</p>}
    </div>
  );
}
```

## Optimistic Loading

### Instant Navigation Feedback

```typescript
import { useRouter } from 'philjs-router';
import { signal } from 'philjs-core';

function ProductCard({ product }: { product: any }) {
  const router = useRouter();
  const navigating = signal(false);

  const handleClick = () => {
    navigating.set(true);
    router.push(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={navigating() ? 'navigating' : ''}
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      {navigating() && <Spinner size="sm" />}
    </div>
  );
}
```

### Prefetch on Hover

```typescript
import { Link, useRouter } from 'philjs-router';

function NavLink({ href, children }: { href: string; children: any }) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(href);
  };

  return (
    <Link href={href} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

## Best Practices

### Show Loading Immediately

```typescript
// ✅ Immediate feedback
if (loading()) return <Spinner />;

// ❌ Delayed or no feedback
setTimeout(() => {
  if (loading()) return <Spinner />;
}, 500);
```

### Match Content Layout

```typescript
// ✅ Skeleton matches actual content
function PostSkeleton() {
  return (
    <div className="post">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-meta" />
      <div className="skeleton skeleton-content" />
    </div>
  );
}

// ❌ Generic spinner
return <Spinner />;
```

### Use Suspense for Code Splitting

```typescript
// ✅ Suspense with lazy loading
<Suspense fallback={<PageSkeleton />}>
  <LazyPage />
</Suspense>

// ❌ Manual loading state
{loaded() ? <Page /> : <Spinner />}
```

### Avoid Layout Shift

```typescript
// ✅ Reserve space
<div className="content" style={{ minHeight: '400px' }}>
  {loading() ? <Skeleton /> : <Content />}
</div>

// ❌ Layout jumps
{loading() ? <Spinner /> : <Content />}
```

### Progressive Enhancement

```typescript
// ✅ Show partial content while loading more
<div>
  <Content data={loadedData()} />
  {loading() && <Spinner />}
</div>

// ❌ Hide all content while loading
{loading() ? <Spinner /> : <Content />}
```

## Summary

You've learned:

✅ Route loading indicators
✅ Navigation loading states
✅ Skeleton screens
✅ Progress bars
✅ Suspense boundaries
✅ Loading UI patterns
✅ Streaming content
✅ Infinite scroll
✅ Optimistic loading
✅ Best practices

Great loading states improve perceived performance!

---

**Next:** [View Transitions →](./view-transitions.md) Add smooth animations between routes

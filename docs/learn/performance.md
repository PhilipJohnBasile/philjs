# Performance Optimization

PhilJS is designed for performance from the ground up. This guide covers how to build blazing-fast applications and optimize them for production.

> ⚠️ PhilJS currently ships low-level routing utilities (see [`/docs/api-reference/router.md`](../api-reference/router.md)). Any mentions of high-level router helpers in this guide are part of the planned ergonomic API and are included for conceptual guidance.

## Why PhilJS is Fast

PhilJS achieves exceptional performance through:

1. **Fine-grained reactivity**: Only updates what changed
2. **No virtual DOM**: Direct DOM manipulation without diffing
3. **Resumability**: Zero hydration cost
4. **Automatic code splitting**: Lazy load what you need
5. **Minimal runtime**: Small bundle sizes

```tsx
import { signal, memo } from 'philjs-core';

function OptimizedList({ items }: { items: number[] }) {
  const filter = signal('');

  // Only recalculates when dependencies change
  const filtered = memo(() => {
    const f = filter();
    return items.filter(item => item.toString().includes(f));
  });

  return (
    <div>
      <input
        value={filter()}
        onInput={(e) => filter.set((e.target as HTMLInputElement).value)}
      />
      <ul>
        {/* Only updates when filtered changes */}
        {filtered().map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Measuring Performance

### Built-in Performance Tracking

PhilJS includes performance tracking out of the box:

```tsx
import { enablePerformanceTracking } from 'philjs-core';

if (process.env.NODE_ENV === 'development') {
  enablePerformanceTracking({
    logSlowRenders: true,
    slowThreshold: 16 // ms
  });
}

function App() {
  return <div>My App</div>;
}
```

### Web Vitals

Monitor Core Web Vitals:

```tsx
import { signal, effect } from 'philjs-core';

function WebVitalsTracker() {
  const vitals = signal({
    FCP: 0,
    LCP: 0,
    FID: 0,
    CLS: 0
  });

  effect(() => {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const perfObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          vitals.set({ ...vitals(), FCP: entry.startTime });
        }
      }
    });

    perfObserver.observe({ entryTypes: ['paint'] });

    onCleanup(() => perfObserver.disconnect());
  });

  return (
    <div>
      <h3>Web Vitals</h3>
      <p>FCP: {vitals().FCP.toFixed(2)}ms</p>
      <p>LCP: {vitals().LCP.toFixed(2)}ms</p>
    </div>
  );
}
```

## Optimizing Renders

### Use Memos for Expensive Calculations

```tsx
import { signal, memo } from 'philjs-core';

function ExpensiveCalculation() {
  const numbers = signal([1, 2, 3, 4, 5]);

  // Memoized - only recalculates when numbers changes
  const sum = memo(() => {
    console.log('Calculating sum...');
    return numbers().reduce((a, b) => a + b, 0);
  });

  const factorial = memo(() => {
    console.log('Calculating factorial...');
    const n = sum();
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  });

  return (
    <div>
      <p>Sum: {sum()}</p>
      <p>Factorial: {factorial()}</p>
    </div>
  );
}
```

### Avoid Inline Object Creation

```tsx
// ❌ Bad - creates new object on every render
function BadExample() {
  const user = signal({ name: 'Alice' });

  return (
    <UserProfile user={{ ...user(), theme: 'dark' }} />
  );
}

// ✅ Good - memoize derived values
function GoodExample() {
  const user = signal({ name: 'Alice' });
  const userWithTheme = memo(() => ({
    ...user(),
    theme: 'dark'
  }));

  return <UserProfile user={userWithTheme()} />;
}
```

### Batch Updates

```tsx
import { signal, batch } from 'philjs-core';

function BatchedUpdates() {
  const firstName = signal('');
  const lastName = signal('');
  const email = signal('');

  const updateUser = (data: any) => {
    // Batch all updates into a single render
    batch(() => {
      firstName.set(data.firstName);
      lastName.set(data.lastName);
      email.set(data.email);
    });
  };

  return (
    <div>
      <button onClick={() => updateUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      })}>
        Update User
      </button>
      <p>{firstName()} {lastName()}</p>
      <p>{email()}</p>
    </div>
  );
}
```

## Code Splitting

### Dynamic Imports

```tsx
import { lazy } from 'philjs-core';

// Component is loaded only when needed
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  const showHeavy = signal(false);

  return (
    <div>
      <button onClick={() => showHeavy.set(true)}>
        Load Heavy Component
      </button>

      {showHeavy() && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
}
```

### Route-based Splitting

```tsx
// routes/dashboard.tsx - automatically code-split
export default function Dashboard() {
  return <div>Dashboard</div>;
}

// routes/settings.tsx - separate bundle
export default function Settings() {
  return <div>Settings</div>;
}
```

## List Optimization

### Virtual Scrolling

For long lists, use virtual scrolling:

```tsx
import { signal, memo } from 'philjs-core';

function VirtualList({ items }: { items: any[] }) {
  const scrollTop = signal(0);
  const itemHeight = 50;
  const containerHeight = 500;

  const visibleItems = memo(() => {
    const start = Math.floor(scrollTop() / itemHeight);
    const end = start + Math.ceil(containerHeight / itemHeight);
    return items.slice(start, end);
  });

  return (
    <div
      style={{ height: `${containerHeight}px`, overflow: 'auto' }}
      onScroll={(e) => scrollTop.set((e.target as HTMLElement).scrollTop)}
    >
      <div style={{ height: `${items.length * itemHeight}px` }}>
        <div style={{ transform: `translateY(${Math.floor(scrollTop() / itemHeight) * itemHeight}px)` }}>
          {visibleItems().map((item, i) => (
            <div key={item.id} style={{ height: `${itemHeight}px` }}>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Windowing Library

```tsx
import { createVirtualizer } from '@tanstack/virtual-core';
import { signal } from 'philjs-core';

function OptimizedList({ items }: { items: any[] }) {
  let parentRef: HTMLDivElement;

  const virtualizer = createVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {items[virtualItem.index].text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Image Optimization

### Lazy Load Images

```tsx
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const isVisible = signal(false);
  let imgRef: HTMLImageElement;

  effect(() => {
    if (!imgRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isVisible.set(true);
        observer.disconnect();
      }
    });

    observer.observe(imgRef);

    onCleanup(() => observer.disconnect());
  });

  return (
    <img
      ref={imgRef}
      src={isVisible() ? src : 'data:image/svg+xml,...'} // placeholder
      alt={alt}
      loading="lazy"
    />
  );
}
```

### Responsive Images

```tsx
function ResponsiveImage({ src, alt }: { src: string; alt: string }) {
  return (
    <picture>
      <source
        srcSet={`${src}?w=320 320w, ${src}?w=640 640w, ${src}?w=1280 1280w`}
        sizes="(max-width: 640px) 320px, (max-width: 1280px) 640px, 1280px"
      />
      <img src={src} alt={alt} loading="lazy" />
    </picture>
  );
}
```

## Bundle Size Optimization

### Tree Shaking

```tsx
// ✅ Good - imports only what you need
import { signal, memo } from 'philjs-core';

// ❌ Bad - imports everything
import * as PhilJS from 'philjs-core';
```

### Analyze Bundle

```bash
# Build and analyze bundle
npm run build -- --analyze

# View bundle visualization
open dist/stats.html
```

### Dynamic Imports for Heavy Libraries

```tsx
function ChartComponent() {
  const showChart = signal(false);

  const loadChart = async () => {
    // Load chart library only when needed
    const { Chart } = await import('chart.js');
    // Use Chart...
    showChart.set(true);
  };

  return (
    <div>
      <button onClick={loadChart}>Show Chart</button>
      {showChart() && <canvas id="myChart" />}
    </div>
  );
}
```

## Network Performance

### Prefetch Critical Resources

```tsx
import { prefetch } from 'philjs-router';

function ProductCard({ productId }: { productId: number }) {
  return (
    <div
      onMouseEnter={() => {
        // Prefetch product page when hovering
        prefetch(`/products/${productId}`);
      }}
    >
      <Link href={`/products/${productId}`}>
        View Product
      </Link>
    </div>
  );
}
```

### Optimize Data Fetching

```tsx
import { createQuery } from 'philjs-data';

function UserProfile({ userId }: { userId: number }) {
  // Cached and deduplicated
  const user = createQuery(
    () => `/api/users/${userId}`,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  if (user.loading) return <div>Loading...</div>;
  if (user.error) return <div>Error!</div>;

  return <div>{user.data.name}</div>;
}
```

## Memory Management

### Clean Up Resources

```tsx
import { effect, onCleanup } from 'philjs-core';

function MemoryAwareComponent() {
  effect(() => {
    const ws = new WebSocket('wss://example.com');
    const interval = setInterval(() => {}, 1000);
    const listener = () => {};
    window.addEventListener('resize', listener);

    // Always clean up!
    onCleanup(() => {
      ws.close();
      clearInterval(interval);
      window.removeEventListener('resize', listener);
    });
  });

  return <div>Component</div>;
}
```

### Avoid Memory Leaks

```tsx
// ❌ Bad - creates memory leak
function LeakyComponent() {
  const data = signal([]);

  effect(() => {
    setInterval(() => {
      data.set([...data(), new Date()]);
    }, 1000);
    // No cleanup!
  });

  return <div>{data().length} items</div>;
}

// ✅ Good - properly cleaned up
function CleanComponent() {
  const data = signal([]);

  effect(() => {
    const interval = setInterval(() => {
      data.set([...data(), new Date()]);
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <div>{data().length} items</div>;
}
```

## Runtime Performance

### Avoid Expensive Operations in Render

```tsx
// ❌ Bad - expensive operation on every access
function Slow() {
  const items = signal([1, 2, 3, 4, 5]);

  return (
    <div>
      {items().filter(i => i > 2).map(i => <div key={i}>{i}</div>)}
    </div>
  );
}

// ✅ Good - memoized
function Fast() {
  const items = signal([1, 2, 3, 4, 5]);
  const filtered = memo(() => items().filter(i => i > 2));

  return (
    <div>
      {filtered().map(i => <div key={i}>{i}</div>)}
    </div>
  );
}
```

### Debounce Expensive Operations

```tsx
import { signal, effect } from 'philjs-core';

function SearchWithDebounce() {
  const query = signal('');
  const results = signal([]);

  effect(() => {
    const q = query();

    if (q.length < 3) {
      results.set([]);
      return;
    }

    const timer = setTimeout(async () => {
      const data = await searchAPI(q);
      results.set(data);
    }, 300);

    onCleanup(() => clearTimeout(timer));
  });

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => query.set((e.target as HTMLInputElement).value)}
      />
      <ul>
        {results().map(r => <li key={r.id}>{r.title}</li>)}
      </ul>
    </div>
  );
}
```

## Server-Side Performance

### Stream HTML

```tsx
// routes/dashboard.tsx
export async function loader() {
  return {
    user: await fetchUser(),
    // Stream the rest
    posts: fetchPosts(), // Returns Promise
  };
}

export default function Dashboard({ data }) {
  return (
    <div>
      <h1>Welcome {data.user.name}</h1>

      <Suspense fallback={<div>Loading posts...</div>}>
        <Await resolve={data.posts}>
          {(posts) => (
            <ul>
              {posts.map(p => <li key={p.id}>{p.title}</li>)}
            </ul>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Edge Caching

```tsx
export const config = {
  cache: {
    edge: {
      maxAge: 3600, // 1 hour
      staleWhileRevalidate: 86400, // 1 day
    }
  }
};

export default function CachedPage() {
  return <div>This page is cached at the edge!</div>;
}
```

## Performance Checklist

- [ ] Enable production mode for deployment
- [ ] Minimize bundle size with tree shaking
- [ ] Use code splitting for routes and heavy components
- [ ] Implement virtual scrolling for long lists
- [ ] Lazy load images with intersection observer
- [ ] Prefetch critical resources
- [ ] Cache API responses appropriately
- [ ] Clean up effects and subscriptions
- [ ] Avoid unnecessary re-renders with memos
- [ ] Batch signal updates when possible
- [ ] Use server-side rendering for initial load
- [ ] Implement streaming for slower data
- [ ] Monitor Web Vitals in production

## Next Steps

- [Code Splitting](/docs/learn/code-splitting.md) - Advanced splitting techniques
- [Lazy Loading](/docs/learn/lazy-loading.md) - Load resources on demand
- [Memoization](/docs/performance/memoization.md) - Deep dive into memos
- [Web Vitals](/docs/performance/web-vitals.md) - Monitor performance metrics

---

💡 **Tip**: Use the PhilJS DevTools performance profiler to identify bottlenecks in development.

⚠️ **Warning**: Premature optimization is the root of all evil. Measure first, then optimize.

ℹ️ **Note**: PhilJS is fast by default. Most optimizations are only needed for extreme cases with massive datasets or complex UIs.

# Lazy Loading Components

Load components on-demand to reduce initial bundle size and improve performance.

## What You'll Learn

- What lazy loading is
- Dynamic imports
- Route-based code splitting
- Component-level lazy loading
- Best practices

## What is Lazy Loading?

Lazy loading delays loading code until it's needed:

```typescript
// ❌ Eager loading - increases initial bundle
import Dashboard from './Dashboard';

// ✅ Lazy loading - loads only when needed
const Dashboard = lazy(() => import('./Dashboard'));
```

**Benefits:**
- Smaller initial bundle
- Faster page load
- Better performance
- Load code only when used

## Dynamic Imports

### Basic Dynamic Import

```typescript
// Load component dynamically
const loadDashboard = () => import('./Dashboard');

// Use it
loadDashboard().then(module => {
  const Dashboard = module.default;
  // Render Dashboard
});
```

### With Async/Await

```typescript
async function loadAndRender() {
  const { default: Dashboard } = await import('./Dashboard');
  // Render Dashboard
}
```

## Lazy Component Wrapper

Create a helper for lazy components:

```typescript
import { signal } from '@philjs/core';

function lazy<T>(loader: () => Promise<{ default: T }>) {
  const Component = signal<T | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  return function LazyComponent(props: any) {
    // Load component on first render
    if (!Component() && !loading()) {
      loading.set(true);

      loader()
        .then(module => {
          Component.set(module.default);
          loading.set(false);
        })
        .catch(err => {
          error.set(err);
          loading.set(false);
        });
    }

    if (loading()) {
      return <div>Loading...</div>;
    }

    if (error()) {
      return <div>Error loading component: {error()!.message}</div>;
    }

    const Comp = Component();
    return Comp ? <Comp {...props} /> : null;
  };
}

// Usage:
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return <Dashboard />;
}
```

## Route-Based Code Splitting

Split code by routes - the most common pattern:

```typescript
const routes = [
  {
    path: '/',
    component: lazy(() => import('./pages/Home'))
  },
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/settings',
    component: lazy(() => import('./pages/Settings'))
  },
  {
    path: '/profile',
    component: lazy(() => import('./pages/Profile'))
  }
];

function Router() {
  const currentPath = signal(window.location.pathname);

  const currentRoute = memo(() =>
    routes.find(route => route.path === currentPath())
  );

  if (!currentRoute()) {
    return <NotFound />;
  }

  const Component = currentRoute()!.component;
  return <Component />;
}
```

**Result**: Each route is a separate bundle loaded only when visiting that route.

## Component-Level Lazy Loading

### Modal Lazy Loading

```typescript
function App() {
  const showModal = signal(false);

  // Only load modal code when needed
  const Modal = lazy(() => import('./Modal'));

  return (
    <div>
      <button onClick={() => showModal.set(true)}>
        Open Modal
      </button>

      {showModal() && (
        <Modal onClose={() => showModal.set(false)}>
          Modal content
        </Modal>
      )}
    </div>
  );
}
```

### Heavy Component

```typescript
// Chart library is large - lazy load it
const Chart = lazy(() => import('./Chart'));

function Dashboard() {
  const showChart = signal(false);

  return (
    <div>
      <button onClick={() => showChart.set(true)}>
        Show Analytics
      </button>

      {showChart() && <Chart data={analyticsData()} />}
    </div>
  );
}
```

### Tab Content

```typescript
const tabs = {
  profile: lazy(() => import('./ProfileTab')),
  settings: lazy(() => import('./SettingsTab')),
  billing: lazy(() => import('./BillingTab'))
};

function TabbedView() {
  const activeTab = signal<keyof typeof tabs>('profile');

  const ActiveComponent = tabs[activeTab()];

  return (
    <div>
      <button onClick={() => activeTab.set('profile')}>Profile</button>
      <button onClick={() => activeTab.set('settings')}>Settings</button>
      <button onClick={() => activeTab.set('billing')}>Billing</button>

      <ActiveComponent />
    </div>
  );
}
```

## Loading States

### Suspense-like Wrapper

```typescript
function Suspense({
  children,
  fallback
}: {
  children: any;
  fallback: any;
}) {
  const isLoading = signal(true);

  // Simplified - in real implementation would track component loading
  return isLoading() ? fallback : children;
}

// Usage:
<Suspense fallback={<Spinner />}>
  <LazyDashboard />
</Suspense>
```

### Loading Component

```typescript
function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px'
    }}>
      <div className="spinner">Loading...</div>
    </div>
  );
}

const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Skeleton Loading

```typescript
function DashboardSkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-stats">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
      <div className="skeleton-chart" />
    </div>
  );
}

const Dashboard = lazy(() => import('./Dashboard'));

<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

## Preloading

Load components before they're needed:

```typescript
const Dashboard = lazy(() => import('./Dashboard'));

// Preload on hover
function Link() {
  return (
    <a
      href="/dashboard"
      onMouseEnter={() => {
        // Start loading Dashboard before click
        import('./Dashboard');
      }}
    >
      Dashboard
    </a>
  );
}
```

### Prefetch on Idle

```typescript
function App() {
  // Prefetch heavy components when browser is idle
  effect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('./Dashboard');
        import('./Settings');
        import('./Profile');
      });
    }
  });

  return <Router />;
}
```

### Prefetch on Interaction

```typescript
function Navigation() {
  const prefetched = signal(new Set<string>());

  const prefetch = (path: string) => {
    if (prefetched().has(path)) return;

    // Prefetch route component
    switch (path) {
      case '/dashboard':
        import('./pages/Dashboard');
        break;
      case '/settings':
        import('./pages/Settings');
        break;
    }

    prefetched().add(path);
  };

  return (
    <nav>
      <a
        href="/dashboard"
        onMouseEnter={() => prefetch('/dashboard')}
      >
        Dashboard
      </a>
      <a
        href="/settings"
        onMouseEnter={() => prefetch('/settings')}
      >
        Settings
      </a>
    </nav>
  );
}
```

## Error Handling

```typescript
function lazy<T>(loader: () => Promise<{ default: T }>) {
  const Component = signal<T | null>(null);
  const error = signal<Error | null>(null);

  return function LazyComponent(props: any) {
    if (error()) {
      return (
        <div className="error">
          <h2>Failed to load component</h2>
          <p>{error()!.message}</p>
          <button onClick={() => {
            error.set(null);
            // Retry
            loader()
              .then(m => Component.set(m.default))
              .catch(e => error.set(e));
          }}>
            Retry
          </button>
        </div>
      );
    }

    if (!Component()) {
      loader()
        .then(m => Component.set(m.default))
        .catch(e => error.set(e));

      return <div>Loading...</div>;
    }

    const Comp = Component();
    return <Comp {...props} />;
  };
}
```

## Retry Logic

```typescript
async function loadWithRetry<T>(
  loader: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (retries === 0) throw error;

    await new Promise(resolve => setTimeout(resolve, delay));
    return loadWithRetry(loader, retries - 1, delay * 2);
  }
}

// Usage:
const Dashboard = lazy(() =>
  loadWithRetry(() => import('./Dashboard'))
);
```

## Best Practices

### Lazy Load Large Dependencies

```typescript
// ❌ Large library loaded eagerly
import { Chart } from 'heavy-chart-library';

// ✅ Lazy load large libraries
const Chart = lazy(() => import('heavy-chart-library').then(m => ({ default: m.Chart })));
```

### Split by Route

```typescript
// ✅ Each route is a separate bundle
const routes = {
  '/': lazy(() => import('./pages/Home')),
  '/dashboard': lazy(() => import('./pages/Dashboard')),
  '/settings': lazy(() => import('./pages/Settings'))
};
```

### Don't Over-Split

```typescript
// ❌ Too granular - overhead of many small chunks
const Button = lazy(() => import('./Button'));
const Input = lazy(() => import('./Input'));

// ✅ Keep small components together
import { Button, Input } from './components';
```

### Preload Critical Routes

```typescript
// Preload route user will likely visit
<Link to="/dashboard" onMouseEnter={() => import('./Dashboard')}>
  Dashboard
</Link>
```

## Webpack Magic Comments

Control chunk naming and loading:

```typescript
const Dashboard = lazy(() =>
  import(
    /* webpackChunkName: "dashboard" */
    /* webpackPrefetch: true */
    './Dashboard'
  )
);
```

## Summary

You've learned:

✅ What lazy loading is and why it's important
✅ Dynamic imports with import()
✅ Creating lazy component wrappers
✅ Route-based code splitting
✅ Component-level lazy loading
✅ Loading states and skeletons
✅ Preloading and prefetching
✅ Error handling and retry logic
✅ Best practices for code splitting

Lazy loading is essential for fast, scalable applications!

---

**Next:** [Code Splitting →](./code-splitting.md) Advanced bundle optimization strategies

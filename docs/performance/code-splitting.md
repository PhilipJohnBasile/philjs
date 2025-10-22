# Code Splitting

Split your application into smaller chunks for faster initial load times.


## What You'll Learn

- Route-based splitting
- Component-based splitting
- Dynamic imports
- Lazy loading
- Chunk optimization
- Best practices

## Route-Based Splitting

### Lazy Load Routes

```typescript
import { Router, Route, lazy } from 'philjs-router';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

export function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
    </Router>
  );
}
```

### With Loading States

```typescript
import { Router, Route, lazy, Suspense } from 'philjs-router';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function LoadingFallback() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <Route
        path="/dashboard"
        component={() => (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        )}
      />
    </Router>
  );
}
```

## Component-Based Splitting

### Lazy Load Heavy Components

```typescript
import { lazy, Suspense, signal } from 'philjs-core';

// Split heavy components
const ChartComponent = lazy(() => import('./components/Chart'));
const DataTable = lazy(() => import('./components/DataTable'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));

export function Dashboard() {
  const activeTab = signal('overview');

  return (
    <div>
      <nav>
        <button onClick={() => activeTab.set('overview')}>Overview</button>
        <button onClick={() => activeTab.set('charts')}>Charts</button>
        <button onClick={() => activeTab.set('data')}>Data</button>
      </nav>

      {activeTab() === 'overview' && <Overview />}

      {activeTab() === 'charts' && (
        <Suspense fallback={<div>Loading charts...</div>}>
          <ChartComponent />
        </Suspense>
      )}

      {activeTab() === 'data' && (
        <Suspense fallback={<div>Loading table...</div>}>
          <DataTable />
        </Suspense>
      )}
    </div>
  );
}
```

### Modal Code Splitting

```typescript
import { lazy, Suspense, signal } from 'philjs-core';

const UserModal = lazy(() => import('./modals/UserModal'));
const SettingsModal = lazy(() => import('./modals/SettingsModal'));

export function App() {
  const activeModal = signal<'user' | 'settings' | null>(null);

  return (
    <div>
      <button onClick={() => activeModal.set('user')}>
        Open User Modal
      </button>

      <button onClick={() => activeModal.set('settings')}>
        Open Settings
      </button>

      {activeModal() === 'user' && (
        <Suspense fallback={<div>Loading...</div>}>
          <UserModal onClose={() => activeModal.set(null)} />
        </Suspense>
      )}

      {activeModal() === 'settings' && (
        <Suspense fallback={<div>Loading...</div>}>
          <SettingsModal onClose={() => activeModal.set(null)} />
        </Suspense>
      )}
    </div>
  );
}
```

## Dynamic Imports

### Conditional Loading

```typescript
import { signal } from 'philjs-core';

export function FeatureToggle() {
  const adminMode = signal(false);

  const loadAdminPanel = async () => {
    if (!adminMode()) {
      // Only load admin code when needed
      const { AdminPanel } = await import('./components/AdminPanel');

      // Render admin panel
      renderAdminPanel(AdminPanel);
    }
    adminMode.set(true);
  };

  return (
    <div>
      <button onClick={loadAdminPanel}>
        Enable Admin Mode
      </button>

      {adminMode() && <div id="admin-panel-container" />}
    </div>
  );
}
```

### Library Code Splitting

```typescript
// Load heavy libraries only when needed
async function exportToPDF() {
  // jsPDF is only loaded when export is triggered
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF();
  doc.text('Hello world!', 10, 10);
  doc.save('document.pdf');
}

async function exportToExcel() {
  // xlsx is only loaded when export is triggered
  const XLSX = await import('xlsx');

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'data.xlsx');
}

export function DataExport({ data }: { data: any[] }) {
  return (
    <div>
      <button onClick={exportToPDF}>Export PDF</button>
      <button onClick={exportToExcel}>Export Excel</button>
    </div>
  );
}
```

## Chunk Optimization

### Manual Chunks

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk
          vendor: ['philjs-core', 'philjs-router'],

          // UI components chunk
          ui: [
            './src/components/Button',
            './src/components/Input',
            './src/components/Card'
          ],

          // Charts chunk
          charts: ['chart.js', './src/components/Chart'],

          // Forms chunk
          forms: ['zod', './src/components/Form'],

          // Utils chunk
          utils: ['date-fns', 'lodash-es']
        }
      }
    }
  }
});
```

### Smart Chunking

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Split large vendors
            if (id.includes('chart.js')) {
              return 'chart-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            return 'vendor';
          }

          // Component chunks by directory
          if (id.includes('/components/')) {
            const componentPath = id.split('/components/')[1];
            const componentDir = componentPath.split('/')[0];
            return `components-${componentDir}`;
          }
        }
      }
    }
  }
});
```

## Preloading Strategies

### Prefetch Routes

```typescript
import { Router, Route, prefetch } from 'philjs-router';

export function Navigation() {
  return (
    <nav>
      <a
        href="/dashboard"
        onMouseEnter={() => prefetch('/dashboard')}
      >
        Dashboard
      </a>

      <a
        href="/reports"
        onMouseEnter={() => prefetch('/reports')}
      >
        Reports
      </a>
    </nav>
  );
}
```

### Intelligent Preloading

```typescript
import { effect } from 'philjs-core';

function preloadLikelyRoutes() {
  effect(() => {
    // Preload based on user behavior
    const userRole = getUserRole();

    if (userRole === 'admin') {
      // Admins likely visit settings
      prefetch('/settings');
      prefetch('/users');
    } else if (userRole === 'user') {
      // Regular users likely visit dashboard
      prefetch('/dashboard');
    }

    // Preload based on time
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      // Working hours - preload work-related pages
      prefetch('/reports');
    }
  });
}
```

### Link Prefetching

```typescript
function PrefetchLink({ href, children }: {
  href: string;
  children: any;
}) {
  const prefetched = signal(false);

  const handleMouseEnter = () => {
    if (!prefetched()) {
      // Prefetch on hover
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);

      prefetched.set(true);
    }
  };

  return (
    <a href={href} onMouseEnter={handleMouseEnter}>
      {children}
    </a>
  );
}
```

## Error Handling

### Lazy Load Error Boundaries

```typescript
import { ErrorBoundary } from 'philjs-core';

function LazyLoadErrorFallback({ error, retry }: {
  error: Error;
  retry: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Failed to load component</h2>
      <p>{error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary fallback={LazyLoadErrorFallback}>
      <Suspense fallback={<Loading />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Retry Failed Chunks

```typescript
function lazyWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): () => Promise<T> {
  return async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    throw new Error('Failed to load chunk after retries');
  };
}

// Usage
const Dashboard = lazy(
  lazyWithRetry(() => import('./pages/Dashboard'))
);
```

## Best Practices

### Split by Route

```typescript
// ✅ Each route is a separate chunk
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// ❌ All routes in main bundle
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
```

### Lazy Load Below the Fold

```typescript
// ✅ Lazy load content not immediately visible
function HomePage() {
  return (
    <div>
      <Hero /> {/* Eager loaded */}

      <Suspense fallback={<Loading />}>
        <LazyFeatures /> {/* Lazy loaded */}
      </Suspense>

      <Suspense fallback={<Loading />}>
        <LazyTestimonials /> {/* Lazy loaded */}
      </Suspense>
    </div>
  );
}
```

### Avoid Over-Splitting

```typescript
// ✅ Reasonable chunk sizes
const Dashboard = lazy(() => import('./pages/Dashboard')); // 50KB

// ❌ Too many tiny chunks (overhead)
const Button = lazy(() => import('./Button')); // 2KB
const Input = lazy(() => import('./Input')); // 1KB
```

### Use Suspense Wisely

```typescript
// ✅ Group related lazy components
<Suspense fallback={<Loading />}>
  <LazyChart />
  <LazyTable />
  <LazyStats />
</Suspense>

// ❌ Too many loading states
<Suspense fallback={<Loading />}>
  <LazyChart />
</Suspense>
<Suspense fallback={<Loading />}>
  <LazyTable />
</Suspense>
```

## Measuring Impact

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Look for:
# 1. Largest chunks
# 2. Duplicate code
# 3. Unused dependencies
```

### Performance Monitoring

```typescript
import { effect } from 'philjs-core';

function trackChunkLoad(chunkName: string) {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;

    // Send to analytics
    analytics.track('chunk-loaded', {
      chunk: chunkName,
      duration,
      timestamp: Date.now()
    });
  };
}

// Usage
const Dashboard = lazy(async () => {
  const trackEnd = trackChunkLoad('dashboard');
  const module = await import('./pages/Dashboard');
  trackEnd();
  return module;
});
```

## Summary

You've learned:

✅ Route-based code splitting
✅ Component-based splitting
✅ Dynamic imports for conditional loading
✅ Chunk optimization strategies
✅ Preloading and prefetching
✅ Error handling for lazy loads
✅ Best practices for splitting
✅ Performance measurement

Code splitting dramatically improves initial load time!

---

**Next:** [Lazy Loading →](./lazy-loading.md) Advanced lazy loading patterns

# Code Splitting

Advanced strategies for splitting your application into optimal bundles for maximum performance.

## What You'll Learn

- Bundle analysis
- Splitting strategies
- Vendor chunk optimization
- Dynamic chunk loading
- Performance monitoring

## Why Code Splitting?

Without code splitting:
```
main.bundle.js (2.5 MB) ❌
```

With code splitting:
```
main.js (100 KB) ✅
vendor.js (500 KB)
dashboard.js (300 KB)
settings.js (200 KB)
... (loads on demand)
```

**Benefits:**
- Faster initial load
- Better caching
- Parallel downloads
- Load only what's needed

## Analyzing Your Bundle

### Bundle Analyzer

```bash
# Install
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
};
```

```bash
# Build and analyze
npm run build

# Opens interactive treemap showing bundle composition
```

### Identify Large Dependencies

Look for:
- Large libraries (moment.js, lodash, etc.)
- Duplicate code
- Unused code

### Example Analysis

```
Bundle size: 2.5 MB
├─ node_modules (2.0 MB) ← Too large!
│  ├─ moment.js (500 KB) ← Could use date-fns instead
│  ├─ lodash (300 KB) ← Import only what you need
│  └─ chart.js (400 KB) ← Lazy load this
└─ src (500 KB)
```

## Automatic Code Splitting

Vite automatically splits code:

```typescript
// Dynamic imports create separate chunks
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

// Results in:
// - Dashboard.chunk.js
// - Settings.chunk.js
```

## Vendor Chunk Splitting

Separate node_modules from app code:

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
};
```

### Split by Package

```typescript
manualChunks(id) {
  if (id.includes('node_modules')) {
    // Separate chunk for React
    if (id.includes('react')) {
      return 'react-vendor';
    }

    // Separate chunk for large libraries
    if (id.includes('chart.js')) {
      return 'chart-vendor';
    }

    // Everything else in vendor
    return 'vendor';
  }
}
```

## Route-Based Splitting

Most effective splitting strategy:

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
  }
];

// Results in separate chunks per route:
// - Home.chunk.js
// - Dashboard.chunk.js
// - Settings.chunk.js
```

## Feature-Based Splitting

Split by feature modules:

```typescript
// Auth feature
const Auth = lazy(() => import('./features/auth'));

// Analytics feature
const Analytics = lazy(() => import('./features/analytics'));

// Admin feature (only for admins)
const Admin = lazy(() => import('./features/admin'));

function App() {
  const user = useUser();

  return (
    <div>
      <Auth />

      {user()?.isPremium && <Analytics />}

      {user()?.isAdmin && <Admin />}
    </div>
  );
}
```

## Library Splitting

### Tree Shaking

Import only what you use:

```typescript
// ❌ Imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ Import only needed function
import debounce from 'lodash/debounce';
debounce(fn, 300);

// ✅ Even better - use native or smaller lib
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

### Alternative Libraries

Replace large libraries with smaller alternatives:

```typescript
// ❌ moment.js (500 KB)
import moment from 'moment';
moment().format('YYYY-MM-DD');

// ✅ date-fns (much smaller, tree-shakeable)
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');

// ❌ lodash (full library)
import _ from 'lodash';

// ✅ lodash-es (tree-shakeable)
import { debounce, throttle } from 'lodash-es';
```

## Chunk Naming

Control chunk names for better debugging:

```typescript
// Magic comments
const Dashboard = lazy(() =>
  import(
    /* webpackChunkName: "dashboard" */
    './pages/Dashboard'
  )
);

// Results in: dashboard.chunk.js
```

### Grouped Chunks

```typescript
const AdminUsers = lazy(() =>
  import(/* webpackChunkName: "admin" */ './admin/Users')
);

const AdminSettings = lazy(() =>
  import(/* webpackChunkName: "admin" */ './admin/Settings')
);

// Both go into: admin.chunk.js
```

## Prefetching & Preloading

### Prefetch

Load when browser is idle:

```typescript
const Dashboard = lazy(() =>
  import(
    /* webpackPrefetch: true */
    './Dashboard'
  )
);

// Adds: <link rel="prefetch" href="dashboard.chunk.js">
```

### Preload

Load in parallel with parent:

```typescript
const CriticalComponent = lazy(() =>
  import(
    /* webpackPreload: true */
    './Critical'
  )
);

// Adds: <link rel="preload" href="critical.chunk.js">
```

## Optimization Strategies

### Split Large Components

```typescript
// dashboard/index.ts
export { default as Dashboard } from './Dashboard';
export { default as Stats } from './Stats';
export { default as Charts } from './Charts';

// Lazy load the whole dashboard module
const Dashboard = lazy(() => import('./dashboard'));
```

### Shared Chunks

Extract common dependencies:

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Common utilities
          'common': ['./src/utils', './src/hooks'],

          // UI components
          'ui': ['./src/components/Button', './src/components/Input'],

          // Large libraries
          'chart': ['chart.js'],
          'icons': ['react-icons']
        }
      }
    }
  }
};
```

### Critical CSS

Extract above-the-fold CSS:

```typescript
// vite.config.ts
import { splitVendorChunkPlugin } from 'vite';

export default {
  plugins: [splitVendorChunkPlugin()],
  build: {
    cssCodeSplit: true // Split CSS per chunk
  }
};
```

## Performance Monitoring

### Measure Bundle Impact

```typescript
// Log chunk load times
window.addEventListener('load', () => {
  const resources = performance.getEntriesByType('resource');

  resources.forEach(resource => {
    if (resource.name.includes('.chunk.js')) {
      console.log(
        `${resource.name}: ${resource.duration}ms`
      );
    }
  });
});
```

### Track User Experience

```typescript
// Measure time to interactive
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('Time to Interactive:', entry.startTime);
  }
});

observer.observe({ entryTypes: ['navigation'] });
```

## Best Practices

### Balance Chunk Size

```
❌ Too few chunks:
- main.js (2 MB)

❌ Too many chunks:
- chunk1.js (5 KB)
- chunk2.js (3 KB)
- chunk3.js (7 KB)
- ... (100+ tiny chunks)

✅ Optimal:
- vendor.js (500 KB)
- main.js (100 KB)
- dashboard.js (200 KB)
- settings.js (150 KB)
```

### Ideal chunk sizes:
- **Main bundle**: 100-300 KB
- **Vendor bundle**: 300-500 KB
- **Route chunks**: 50-200 KB each

### Split by Route

```typescript
// ✅ Most effective strategy
const routes = {
  '/': lazy(() => import('./Home')),
  '/dashboard': lazy(() => import('./Dashboard')),
  '/profile': lazy(() => import('./Profile'))
};
```

### Keep Common Code Together

```typescript
// ❌ Don't split tiny shared utilities
const utils = lazy(() => import('./utils')); // Overhead > benefit

// ✅ Keep utilities with main bundle or group them
import * as utils from './utils';
```

### Use HTTP/2

With HTTP/2, multiple smaller chunks are efficient:
- Parallel loading
- Better caching
- Incremental updates

## Common Pitfalls

### Over-splitting

```typescript
// ❌ Too granular
const Button = lazy(() => import('./Button'));
const Input = lazy(() => import('./Input'));

// ✅ Group related components
import { Button, Input } from './components';
```

### Forgetting Vendor Split

```typescript
// ❌ Vendor code mixed with app code
// Results in cache invalidation on every deploy

// ✅ Separate vendor chunk
// Vendor stays cached between deploys
```

### Not Analyzing

```bash
# ❌ Deploy without analysis
npm run build && deploy

# ✅ Analyze first
npm run build
npm run analyze
# Review bundle, optimize, then deploy
```

## Summary

You've learned:

✅ Why code splitting matters
✅ Analyzing bundles with visualizer
✅ Automatic and manual splitting strategies
✅ Vendor chunk optimization
✅ Route and feature-based splitting
✅ Prefetching and preloading
✅ Performance monitoring
✅ Best practices and pitfalls

Code splitting is essential for fast, scalable applications!

---

**Next:** [Suspense and Async →](./suspense-async.md) Handle async operations gracefully

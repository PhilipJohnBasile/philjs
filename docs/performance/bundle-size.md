# Bundle Size Optimization

Keeping your JavaScript bundle small improves load times and user experience. PhilJS provides tools and techniques to minimize bundle size.

## Analyzing Bundle Size

### Build Analysis

```bash
# Analyze your bundle
npm run build -- --analyze

# View the report
open dist/stats.html
```

### Bundle Buddy

```bash
npm install -D @bundle-buddy/cli

bundle-buddy dist/stats.json
```

## Tree Shaking

### Import Only What You Need

```tsx
// ✅ Good - imports only signal
import { signal } from '@philjs/core';

// ❌ Bad - imports everything
import * as PhilJS from '@philjs/core';
```

## Code Splitting

### Route-Based Splitting

```tsx
// Automatic code splitting per route
// routes/dashboard.tsx
export default function Dashboard() {
  return <div>Dashboard</div>;
}
```

### Component-Level Splitting

```tsx
import { lazy } from '@philjs/core';

const HeavyChart = lazy(() => import('./HeavyChart'));

export default function Analytics() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <HeavyChart />
    </Suspense>
  );
}
```

## Reduce Dependencies

### Analyze Dependencies

```bash
npx depcheck

# Remove unused dependencies
npm uninstall unused-package
```

## Minification

### Production Build

```bash
# Build for production (minified)
npm run build

# Gzip compression
gzip -9 dist/**/*.js
```

## Best Practices

### ✅ Do: Use Dynamic Imports

```tsx
// ✅ Good - loads when needed
const Chart = lazy(() => import('heavy-chart-lib'));
```

### ✅ Do: Remove Dead Code

```tsx
// ✅ Good - removed unused code
if (false) {
  // This code is removed by tree shaking
  import('./never-used');
}
```

## Next Steps

- [Code Splitting](/docs/performance/code-splitting.md) - Split strategies
- [Lazy Loading](/docs/performance/lazy-loading.md) - Lazy load components
- [Performance](/docs/performance/overview.md) - Performance guide

---

💡 **Tip**: Use the bundle analyzer to identify large dependencies.

⚠️ **Warning**: Some libraries don't tree-shake well—check before installing.

ℹ️ **Note**: PhilJS core is under 5KB gzipped, keeping your base bundle tiny.

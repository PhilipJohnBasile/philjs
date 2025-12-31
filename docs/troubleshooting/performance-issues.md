# Performance Issues

Diagnose and fix performance problems in PhilJS applications.


## Identifying Performance Issues

### Symptoms

**Slow Rendering:**
- UI feels sluggish
- Delayed response to user input
- Janky animations
- Slow page loads

**High CPU Usage:**
- Fan spinning up
- Browser tab slowing down
- Battery draining quickly

**High Memory Usage:**
- Tab crashes
- Browser warnings
- Increasing memory over time

### Measurement Tools

**Web Vitals:**

```tsx
import { onCLS, onFID, onLCP } from 'web-vitals';

function reportWebVitals() {
  onCLS(console.log);  // Cumulative Layout Shift
  onFID(console.log);  // First Input Delay
  onLCP(console.log);  // Largest Contentful Paint
}

reportWebVitals();
```

**Performance API:**

```tsx
// Measure component render time
performance.mark('render-start');

// ... component code ...

performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');

const measure = performance.getEntriesByName('render')[0];
console.log(`Render time: ${measure.duration}ms`);
```

## Common Performance Problems

### Problem: Not Using Memos

**Issue:** Expensive computations run on every access.

```tsx
// ❌ Problem: Recomputes every time
function ProductList({ products }: { products: Product[] }) {
  // This filters on EVERY render!
  const activeProducts = products().filter(p => p.active);

  return (
    <ul>
      {activeProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

**Solution:** Use memo() for derived values.

```tsx
// ✅ Solution: Memoize filtered list
function ProductList({ products }: { products: Product[] }) {
  const activeProducts = memo(() =>
    products().filter(p => p.active)
  );

  return (
    <ul>
      {activeProducts().map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

### Problem: Unnecessary Re-Renders

**Issue:** Creating new objects/functions inline.

```tsx
// ❌ Problem: New object every render
function UserProfile() {
  return (
    <Card
      style={{ padding: 20, margin: 10 }}  // New object each time!
      user={user()}
    />
  );
}
```

**Solution:** Move static values outside.

```tsx
// ✅ Solution: Reuse object
const cardStyle = { padding: 20, margin: 10 };

function UserProfile() {
  return (
    <Card style={cardStyle} user={user()} />
  );
}
```

### Problem: Large Lists

**Issue:** Rendering thousands of items.

```tsx
// ❌ Problem: Rendering 10,000 items
function HugeList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items().map(item => (  // All 10,000 rendered!
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**Solution:** Use virtualization.

```tsx
// ✅ Solution: Only render visible items
import { VirtualList } from './VirtualList';

function HugeList({ items }: { items: Item[] }) {
  return (
    <VirtualList
      items={items()}
      itemHeight={40}
      containerHeight={600}
      renderItem={(item) => <li>{item.name}</li>}
    />
  );
}
```

### Problem: Expensive Computations in Render

**Issue:** Heavy calculations during render.

```tsx
// ❌ Problem: Heavy computation
function Dashboard() {
  // This runs on every render!
  const stats = calculateComplexStats(data());

  return <StatsView stats={stats} />;
}
```

**Solution:** Use memo() or Web Workers.

```tsx
// ✅ Solution 1: Memoize
function Dashboard() {
  const stats = memo(() => calculateComplexStats(data()));

  return <StatsView stats={stats()} />;
}

// ✅ Solution 2: Web Worker
function Dashboard() {
  const stats = signal(null);

  effect(async () => {
    const worker = new Worker(new URL('./statsWorker.ts', import.meta.url));

    worker.postMessage(data());

    worker.onmessage = (e) => {
      stats.set(e.data);
      worker.terminate();
    };
  });

  return stats() && <StatsView stats={stats()} />;
}
```

### Problem: Memory Leaks

**Issue:** Effects not cleaning up.

```tsx
// ❌ Problem: Event listener leak
function Component() {
  effect(() => {
    const handler = () => console.log('Scroll');

    window.addEventListener('scroll', handler);
    // No cleanup! Leaks on every re-run
  });

  return <div>Content</div>;
}
```

**Solution:** Always clean up effects.

```tsx
// ✅ Solution: Cleanup
function Component() {
  effect(() => {
    const handler = () => console.log('Scroll');

    window.addEventListener('scroll', handler);

    return () => {
      window.removeEventListener('scroll', handler);
    };
  });

  return <div>Content</div>;
}
```

### Problem: Too Many Effects

**Issue:** Creating effects unnecessarily.

```tsx
// ❌ Problem: Separate effects for related updates
const firstName = signal('');
const lastName = signal('');
const fullName = signal('');

effect(() => {
  fullName.set(`${firstName()} ${lastName()}`);
});

// Another effect updating based on fullName
effect(() => {
  console.log('Name:', fullName());
});
```

**Solution:** Use memo() for derived state.

```tsx
// ✅ Solution: Use memo
const firstName = signal('');
const lastName = signal('');
const fullName = memo(() => `${firstName()} ${lastName()}`);

// Single effect
effect(() => {
  console.log('Name:', fullName());
});
```

## Optimization Strategies

### Batching Updates

**Problem:** Multiple signal updates trigger multiple effects.

```tsx
// ❌ Each update triggers effects
firstName.set('Alice');  // Effect runs
lastName.set('Smith');   // Effect runs again
email.set('alice@example.com');  // Effect runs again
```

**Solution:** Batch updates.

```tsx
// ✅ Single effect run
import { batch } from '@philjs/core';

batch(() => {
  firstName.set('Alice');
  lastName.set('Smith');
  email.set('alice@example.com');
});
// Effects run once after batch
```

### Code Splitting

**Problem:** Large initial bundle.

```tsx
// ❌ Everything loaded upfront
import { Dashboard } from './Dashboard';
import { Settings } from './Settings';
import { Analytics } from './Analytics';

<Router>
  <Route path="/dashboard" component={Dashboard} />
  <Route path="/settings" component={Settings} />
  <Route path="/analytics" component={Analytics} />
</Router>
```

**Solution:** Lazy load routes.

```tsx
// ✅ Load on demand
import { lazy, Suspense } from '@philjs/core';

const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Analytics = lazy(() => import('./Analytics'));

<Suspense fallback={<PageLoader />}>
  <Router>
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/settings" component={Settings} />
    <Route path="/analytics" component={Analytics} />
  </Router>
</Suspense>
```

### Debouncing

**Problem:** Too many API calls.

```tsx
// ❌ API call on every keystroke
const search = signal('');

effect(async () => {
  const results = await searchAPI(search());  // Too many calls!
  setResults(results);
});
```

**Solution:** Debounce input.

```tsx
// ✅ Debounced search
const search = signal('');
const debouncedSearch = signal('');

let timeoutId: number;

effect(() => {
  const term = search();

  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    debouncedSearch.set(term);
  }, 300);

  return () => clearTimeout(timeoutId);
});

effect(async () => {
  const term = debouncedSearch();
  if (!term) return;

  const results = await searchAPI(term);
  setResults(results);
});
```

### Image Optimization

**Problem:** Large unoptimized images.

```tsx
// ❌ Full-size images
<img src="/photo.jpg" alt="Photo" />  // 5MB image!
```

**Solution:** Optimize and lazy load.

```tsx
// ✅ Optimized images
<img
  src="/photo-optimized.webp"  // WebP format, optimized
  srcset="
    /photo-small.webp 400w,
    /photo-medium.webp 800w,
    /photo-large.webp 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  loading="lazy"  // Lazy load
  alt="Photo"
/>
```

## Profiling Performance

### Chrome Performance Profiler

1. Open DevTools → Performance
2. Click Record
3. Perform actions
4. Stop recording
5. Analyze:
   - Long tasks (>50ms)
   - Function calls
   - Memory usage
   - Layout shifts

### Measuring Component Performance

```tsx
function ProfiledComponent() {
  const renderCount = signal(0);
  const totalDuration = signal(0);

  effect(() => {
    const start = performance.now();

    // Component logic
    renderCount.set(renderCount() + 1);

    const duration = performance.now() - start;
    totalDuration.set(totalDuration() + duration);

    console.log({
      renders: renderCount(),
      avgDuration: (totalDuration() / renderCount()).toFixed(2) + 'ms'
    });
  });

  return <div>Content</div>;
}
```

### Bundle Size Analysis

```bash
# Build with analysis
npm run build

# Analyze bundle
npx vite-bundle-visualizer
```

## Performance Checklist

### Before Optimization

- [ ] Measure current performance
- [ ] Identify bottlenecks
- [ ] Profile with DevTools
- [ ] Check bundle size
- [ ] Test on slow devices

### Optimization Targets

- [ ] Use memo() for expensive computations
- [ ] Batch related signal updates
- [ ] Virtualize long lists
- [ ] Lazy load routes and components
- [ ] Debounce user input
- [ ] Optimize images
- [ ] Remove unused dependencies
- [ ] Enable code splitting
- [ ] Minimize bundle size

### After Optimization

- [ ] Measure improvement
- [ ] Test functionality still works
- [ ] Check Web Vitals
- [ ] Verify on slow devices
- [ ] Monitor in production

## Performance Budgets

### Set Budgets

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@philjs/core', '@philjs/router']
        }
      }
    },
    chunkSizeWarningLimit: 500  // Warn if chunk >500kb
  }
});
```

### Target Metrics

**Load Performance:**
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.8s

**Runtime Performance:**
- First Input Delay: <100ms
- Interaction to Next Paint: <200ms

**Bundle Size:**
- Initial JS: <200kb
- Initial CSS: <50kb
- Total page: <500kb

## When to Optimize

### Optimize When:

✅ Users report slow performance
✅ Metrics exceed targets
✅ Profiling shows bottlenecks
✅ Preparing for production

### Don't Optimize When:

❌ No performance problems
❌ No measurements taken
❌ Premature optimization
❌ Micro-optimizations

**"Premature optimization is the root of all evil" - Donald Knuth**

## Summary

**Common Performance Issues:**

- Not using memo() for computations
- Unnecessary re-renders
- Large unvirtualized lists
- Expensive operations in render
- Memory leaks from effects
- Too many effects
- Large bundle size

**Solutions:**

✅ Use memo() for derived values
✅ Batch signal updates
✅ Virtualize long lists
✅ Lazy load routes/components
✅ Debounce frequent operations
✅ Optimize images
✅ Clean up effects
✅ Split code by route
✅ Profile before optimizing
✅ Set performance budgets

**Next:** [FAQ →](./faq.md)

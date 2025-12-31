# Performance Overview

Optimize PhilJS applications for maximum speed and efficiency.

## What You'll Learn

- Performance fundamentals
- Optimization strategies
- Measurement techniques
- Common bottlenecks
- Best practices
- Performance checklist

## Performance Fundamentals

### Key Metrics

```typescript
// Core Web Vitals
interface WebVitals {
  LCP: number;  // Largest Contentful Paint (< 2.5s)
  FID: number;  // First Input Delay (< 100ms)
  CLS: number;  // Cumulative Layout Shift (< 0.1)
  FCP: number;  // First Contentful Paint (< 1.8s)
  TTFB: number; // Time to First Byte (< 600ms)
}
```

### Performance Budget

```typescript
const performanceBudget = {
  // Bundle sizes
  mainBundle: 170, // KB (gzipped)
  vendorBundle: 100, // KB (gzipped)
  cssBundle: 30, // KB (gzipped)

  // Timing budgets
  timeToInteractive: 3000, // ms
  firstContentfulPaint: 1800, // ms
  largestContentfulPaint: 2500, // ms

  // Resource counts
  totalRequests: 50,
  imageRequests: 20,
  scriptRequests: 10
};
```

## Optimization Strategies

### 1. Code Splitting

Split code into smaller chunks for faster initial load:

```typescript
import { lazy } from '@philjs/core';

// Lazy load heavy components
const Dashboard = lazy(() => import('./Dashboard'));
const Reports = lazy(() => import('./Reports'));

function App() {
  return (
    <Router>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/reports" component={Reports} />
    </Router>
  );
}
```

### 2. Memoization

Cache expensive computations:

```typescript
import { signal, memo } from '@philjs/core';

function ExpensiveComponent() {
  const data = signal([/* large dataset */]);

  // Memoize expensive calculation
  const processedData = memo(() => {
    return data().map(item => {
      // Heavy processing
      return expensiveTransform(item);
    });
  });

  return <div>{processedData().length} items</div>;
}
```

### 3. Virtual Scrolling

Render only visible items in large lists:

```typescript
import { VirtualScroller } from '@philjs/core';

function LargeList({ items }: { items: any[] }) {
  return (
    <VirtualScroller
      items={items}
      itemHeight={50}
      height={600}
      renderItem={(item) => <ListItem data={item} />}
    />
  );
}
```

### 4. Bundle Optimization

Reduce bundle size:

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@philjs/core'],
          utils: ['date-fns', 'lodash-es']
        }
      }
    }
  }
};
```

## Common Bottlenecks

### 1. Unnecessary Re-renders

```typescript
// ❌ Re-renders on every parent update
function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click</button>;
}

// ✅ Memoized to prevent re-renders
const Child = memo(({ onClick }: { onClick: () => void }) => {
  return <button onClick={onClick}>Click</button>;
});
```

### 2. Large Bundle Size

```bash
# Analyze bundle
npm run build -- --analyze

# Look for:
# - Duplicate dependencies
# - Unused code
# - Large libraries that can be replaced
```

### 3. Inefficient Updates

```typescript
// ❌ Updates entire array
const updateItem = (id: string) => {
  items.set(items().map(item =>
    item.id === id ? { ...item, updated: true } : item
  ));
};

// ✅ Update only specific item
const updateItem = (id: string) => {
  const index = items().findIndex(i => i.id === id);
  const updated = [...items()];
  updated[index] = { ...updated[index], updated: true };
  items.set(updated);
};
```

## Measurement Tools

### Performance Observer

```typescript
import { effect } from '@philjs/core';

function measurePerformance() {
  effect(() => {
    // Measure First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('FCP:', entry.startTime);
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });

    return () => observer.disconnect();
  });
}
```

### Custom Timing

```typescript
function measureComponentRender(componentName: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    console.log(`${componentName} rendered in ${duration}ms`);

    // Send to analytics
    sendMetric('component-render', {
      component: componentName,
      duration
    });
  };
}

// Usage
function HeavyComponent() {
  const measureEnd = measureComponentRender('HeavyComponent');

  effect(() => {
    measureEnd();
  });

  return <div>{/* ... */}</div>;
}
```

## Best Practices

### Load JavaScript Efficiently

```html
<!-- ✅ Defer non-critical scripts -->
<script defer src="/app.js"></script>

<!-- ✅ Async for independent scripts -->
<script async src="/analytics.js"></script>

<!-- ❌ Blocking script -->
<script src="/app.js"></script>
```

### Optimize Images

```typescript
// ✅ Lazy load images
<img
  src="/image.jpg"
  loading="lazy"
  width="800"
  height="600"
  alt="Description"
/>

// ✅ Use modern formats
<picture>
  <source srcset="/image.webp" type="image/webp" />
  <source srcset="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Description" />
</picture>

// ✅ Responsive images
<img
  srcset="
    /image-400.jpg 400w,
    /image-800.jpg 800w,
    /image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  src="/image-800.jpg"
  alt="Description"
/>
```

### Minimize Main Thread Work

```typescript
// ✅ Use Web Workers for heavy computation
const worker = new Worker('/worker.ts');

worker.postMessage({ data: largeDataset });

worker.onmessage = (e) => {
  const result = e.data;
  updateUI(result);
};

// worker.ts
self.onmessage = (e) => {
  const processed = heavyComputation(e.data);
  self.postMessage(processed);
};
```

### Reduce Layout Shifts

```typescript
// ✅ Reserve space for dynamic content
<div style={{
  minHeight: '200px', // Reserve space
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  {loading() ? <Spinner /> : <Content />}
</div>

// ✅ Set image dimensions
<img
  src="/image.jpg"
  width="800"
  height="600"
  alt="Description"
/>
```

## Performance Checklist

### Initial Load
- [ ] Bundle size < 170KB (gzipped)
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.5s
- [ ] Minimize render-blocking resources
- [ ] Enable compression (gzip/brotli)
- [ ] Use CDN for static assets

### Runtime Performance
- [ ] Avoid unnecessary re-renders
- [ ] Memoize expensive computations
- [ ] Use virtual scrolling for long lists
- [ ] Debounce/throttle event handlers
- [ ] Clean up effects and listeners
- [ ] Optimize images (lazy load, modern formats)

### Network
- [ ] Minimize HTTP requests
- [ ] Use HTTP/2 or HTTP/3
- [ ] Implement caching strategy
- [ ] Preload critical resources
- [ ] Prefetch likely navigation targets

### Code Quality
- [ ] Remove unused code
- [ ] Tree-shake dependencies
- [ ] Use production builds
- [ ] Minimize polyfills
- [ ] Avoid large dependencies

## Monitoring

### Real User Monitoring

```typescript
import { signal, effect } from '@philjs/core';

const metrics = signal<WebVitals>({
  LCP: 0,
  FID: 0,
  CLS: 0,
  FCP: 0,
  TTFB: 0
});

// Report to analytics
function reportMetric(metric: keyof WebVitals, value: number) {
  metrics.set({ ...metrics(), [metric]: value });

  // Send to analytics service
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({ metric, value, timestamp: Date.now() })
  });
}

// Measure Web Vitals
effect(() => {
  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    reportMetric('LCP', lastEntry.startTime);
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    const entry = list.getEntries()[0] as PerformanceEventTiming;
    reportMetric('FID', entry.processingStart - entry.startTime);
  }).observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        reportMetric('CLS', clsValue);
      }
    }
  }).observe({ entryTypes: ['layout-shift'] });
});
```

## Summary

You've learned:

✅ Performance fundamentals and metrics
✅ Core optimization strategies
✅ Common performance bottlenecks
✅ Measurement and profiling tools
✅ Best practices for optimization
✅ Performance monitoring

Master performance optimization for fast PhilJS apps!

---

**Next:** [Code Splitting →](./code-splitting.md) Split code for faster loads

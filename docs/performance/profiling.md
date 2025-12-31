# Profiling

Identify and fix performance bottlenecks using profiling tools.

## What You'll Learn

- Chrome DevTools profiling
- Performance API
- Custom profiling
- Flame graphs
- Network profiling
- Best practices

## Chrome DevTools

### Performance Panel

```typescript
// Wrap code to profile
performance.mark('component-start');

// Component render logic
function MyComponent() {
  const data = signal(processData());
  return <div>{data()}</div>;
}

performance.mark('component-end');
performance.measure('component-render', 'component-start', 'component-end');

// View in DevTools Performance tab
```

### CPU Profiling

```typescript
// Start profiling
console.profile('Heavy Operation');

// Code to profile
for (let i = 0; i < 1000000; i++) {
  heavyCalculation(i);
}

// Stop profiling
console.profileEnd('Heavy Operation');

// View in DevTools Profiler tab
```

### Memory Profiling

```typescript
// Take heap snapshot before
const before = (performance as any).memory?.usedJSHeapSize;

// Operation to profile
createManyComponents();

// Take heap snapshot after
const after = (performance as any).memory?.usedJSHeapSize;

console.log(`Memory used: ${((after - before) / 1048576).toFixed(2)} MB`);
```

## Performance API

### User Timing API

```typescript
function measureOperation(name: string, operation: () => void) {
  performance.mark(`${name}-start`);

  operation();

  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);

  const measure = performance.getEntriesByName(name)[0];
  console.log(`${name}: ${measure.duration.toFixed(2)}ms`);

  // Cleanup
  performance.clearMarks(`${name}-start`);
  performance.clearMarks(`${name}-end`);
  performance.clearMeasures(name);
}

// Usage
measureOperation('data-processing', () => {
  processLargeDataset();
});
```

### Performance Observer

```typescript
import { effect } from '@philjs/core';

function usePerformanceObserver() {
  effect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);

          // Send to analytics
          analytics.track('performance', {
            metric: entry.name,
            duration: entry.duration
          });
        }
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    return () => observer.disconnect();
  });
}
```

## Custom Profiling

### Component Render Profiling

```typescript
function withPerformanceTracking<P>(
  Component: (props: P) => JSX.Element,
  componentName: string
) {
  return (props: P) => {
    const renderStart = performance.now();

    const result = Component(props);

    const renderEnd = performance.now();
    const duration = renderEnd - renderStart;

    if (duration > 16) { // Slower than 60fps
      console.warn(
        `${componentName} slow render: ${duration.toFixed(2)}ms`
      );
    }

    return result;
  };
}

// Usage
const ProfiledDashboard = withPerformanceTracking(
  Dashboard,
  'Dashboard'
);
```

### Effect Profiling

```typescript
function profiledEffect(fn: () => void | (() => void), name: string) {
  return effect(() => {
    performance.mark(`effect-${name}-start`);

    const cleanup = fn();

    performance.mark(`effect-${name}-end`);
    performance.measure(
      `effect-${name}`,
      `effect-${name}-start`,
      `effect-${name}-end`
    );

    return cleanup;
  });
}

// Usage
profiledEffect(() => {
  const subscription = subscribeToData();
  return () => subscription.unsubscribe();
}, 'data-subscription');
```

### Function Timing

```typescript
function timed<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  return ((...args: any[]) => {
    const fnName = name || fn.name || 'anonymous';
    const start = performance.now();

    const result = fn(...args);

    const end = performance.now();
    console.log(`${fnName}: ${(end - start).toFixed(2)}ms`);

    return result;
  }) as T;
}

// Usage
const processData = timed((data: any[]) => {
  return data.map(transform);
}, 'processData');
```

## Flame Graphs

### Generate Flame Graph Data

```typescript
interface FlameNode {
  name: string;
  value: number;
  children: FlameNode[];
}

class Profiler {
  private stack: Array<{ name: string; start: number }> = [];
  private root: FlameNode = { name: 'root', value: 0, children: [] };

  start(name: string) {
    this.stack.push({ name, start: performance.now() });
  }

  end() {
    const entry = this.stack.pop();
    if (!entry) return;

    const duration = performance.now() - entry.start;

    // Add to flame graph data
    this.addNode(entry.name, duration);
  }

  private addNode(name: string, duration: number) {
    let current = this.root;

    for (const { name: stackName } of this.stack) {
      const child = current.children.find(c => c.name === stackName);
      if (child) {
        current = child;
      }
    }

    current.children.push({ name, value: duration, children: [] });
  }

  getFlameGraph(): FlameNode {
    return this.root;
  }
}

// Usage
const profiler = new Profiler();

profiler.start('fetchData');
await fetchData();
profiler.end();

profiler.start('processData');
processData();
profiler.end();

const flameData = profiler.getFlameGraph();
```

## Network Profiling

### Track API Calls

```typescript
function profiledFetch(url: string, options?: RequestInit) {
  const start = performance.now();

  return fetch(url, options)
    .then(response => {
      const end = performance.now();
      const duration = end - start;

      performance.measure(`fetch-${url}`, {
        start,
        duration
      });

      console.log(`API ${url}: ${duration.toFixed(2)}ms`);

      return response;
    });
}

// Usage
const data = await profiledFetch('/api/users');
```

### Resource Timing

```typescript
function analyzeResourceTiming() {
  const resources = performance.getEntriesByType('resource');

  const slowResources = resources
    .filter((resource: PerformanceResourceTiming) => resource.duration > 1000)
    .map((resource: PerformanceResourceTiming) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType
    }));

  if (slowResources.length > 0) {
    console.warn('Slow resources:', slowResources);
  }

  return slowResources;
}
```

## Real User Monitoring

### Web Vitals Tracking

```typescript
import { effect } from '@philjs/core';

function trackWebVitals() {
  effect(() => {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];

      analytics.track('web-vital', {
        metric: 'LCP',
        value: lcp.startTime,
        rating: lcp.startTime < 2500 ? 'good' : lcp.startTime < 4000 ? 'needs-improvement' : 'poor'
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as PerformanceEventTiming;
      const fid = entry.processingStart - entry.startTime;

      analytics.track('web-vital', {
        metric: 'FID',
        value: fid,
        rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }

      analytics.track('web-vital', {
        metric: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
      });
    }).observe({ entryTypes: ['layout-shift'] });
  });
}
```

### Custom Metrics

```typescript
class PerformanceTracker {
  private metrics = new Map<string, number[]>();

  track(metric: string, value: number) {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    this.metrics.get(metric)!.push(value);
  }

  getStats(metric: string) {
    const values = this.metrics.get(metric) || [];

    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  report() {
    const report: Record<string, any> = {};

    this.metrics.forEach((_, metric) => {
      report[metric] = this.getStats(metric);
    });

    return report;
  }
}

// Usage
const tracker = new PerformanceTracker();

// Track component renders
tracker.track('component-render', 12.5);
tracker.track('component-render', 15.2);
tracker.track('component-render', 18.9);

// Get statistics
console.log(tracker.getStats('component-render'));
// { count: 3, min: 12.5, max: 18.9, avg: 15.5, p50: 15.2, ... }
```

## Best Practices

### Profile in Production Mode

```bash
# ✅ Build and profile production build
npm run build
npm run preview

# ❌ Don't profile development build (skewed results)
npm run dev
```

### Use Appropriate Sample Size

```typescript
// ✅ Measure multiple times for accuracy
function accurateMeasure(fn: () => void, iterations = 100) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b) / times.length
  };
}

// ❌ Single measurement (unreliable)
const start = performance.now();
operation();
console.log(performance.now() - start);
```

### Clean Up Performance Marks

```typescript
// ✅ Clean up marks and measures
function measureWithCleanup(name: string, fn: () => void) {
  try {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } finally {
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }
}

// ❌ Leave marks (memory leak)
performance.mark('operation-start');
// ...
```

### Focus on User-Centric Metrics

```typescript
// ✅ Measure what users experience
- Time to Interactive (TTI)
- First Input Delay (FID)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

// ❌ Only technical metrics
- Bundle size
- Number of requests
- Server response time
```

## Summary

You've learned:

✅ Chrome DevTools profiling
✅ Performance API usage
✅ Custom profiling techniques
✅ Flame graph generation
✅ Network profiling
✅ Real user monitoring
✅ Best practices for profiling

Profiling identifies bottlenecks for targeted optimization!

---

**Next:** [Performance Budgets →](./performance-budgets.md) Set and enforce performance goals

# Web Vitals

Monitor Core Web Vitals to ensure great user experience.

## Core Web Vitals

### LCP (Largest Contentful Paint)

```tsx
import { signal, effect } from '@philjs/core';

export default function LCPMonitor() {
  const lcp = signal(0);

  effect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcp.set(lastEntry.renderTime || lastEntry.loadTime);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    onCleanup(() => observer.disconnect());
  });

  return <div>LCP: {lcp().toFixed(2)}ms</div>;
}
```

### FID (First Input Delay)

```tsx
const fid = signal(0);

effect(() => {
  const observer = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0];
    fid.set(entry.processingStart - entry.startTime);
  });

  observer.observe({ type: 'first-input', buffered: true });
});
```

### CLS (Cumulative Layout Shift)

```tsx
const cls = signal(0);

effect(() => {
  let clsValue = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        cls.set(clsValue);
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });
});
```

## Monitoring

### Web Vitals Library

```tsx
import { getCLS, getFID, getLCP } from 'web-vitals';

export default function VitalsTracker() {
  effect(() => {
    getCLS(console.log);
    getFID(console.log);
    getLCP(console.log);
  });

  return null;
}
```

## Best Practices

### ✅ Do: Monitor in Production

```tsx
// ✅ Good - track real user metrics
if (typeof window !== 'undefined') {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
}
```

## Next Steps

- [Performance](./overview.md) - Performance guide
- [Budgets](./budgets.md) - Set budgets

---

💡 **Tip**: Good Core Web Vitals improve SEO rankings.

⚠️ **Warning**: Monitor vitals in production, not just development.

ℹ️ **Note**: Target: LCP < 2.5s, FID < 100ms, CLS < 0.1


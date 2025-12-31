# Runtime Performance

Optimize runtime performance for smooth, responsive applications.

## Measuring Performance

### Performance API

```tsx
const start = performance.now();

// Do work
heavyComputation();

const end = performance.now();
console.log(`Took ${end - start}ms`);
```

### React DevTools Profiler

```tsx
import { enableDevTools } from '@philjs/devtools';

if (process.env.NODE_ENV === 'development') {
  enableDevTools();
}
```

## Optimize Renders

### Use Memos

```tsx
import { signal, memo } from '@philjs/core';

const items = signal([1, 2, 3, 4, 5]);

// Only recalculates when items changes
const total = memo(() => items().reduce((a, b) => a + b, 0));
```

### Batch Updates

```tsx
import { batch } from '@philjs/core';

const updateMultiple = () => {
  batch(() => {
    firstName.set('John');
    lastName.set('Doe');
    age.set(30);
  }); // Single render
};
```

## Avoid Expensive Operations

### Debounce

```tsx
import { signal, effect } from '@philjs/core';

const query = signal('');

effect(() => {
  const q = query();

  const timer = setTimeout(() => {
    search(q); // Debounced search
  }, 300);

  onCleanup(() => clearTimeout(timer));
});
```

## Best Practices

### ✅ Do: Profile First

```tsx
// ✅ Good - measure before optimizing
console.time('render');
render();
console.timeEnd('render');
```

### ❌ Don't: Premature Optimize

```tsx
// ❌ Bad - optimizing without profiling
// May not be the bottleneck
```

## Next Steps

- [Memoization](/docs/performance/memoization.md) - Memoization patterns
- [Bundle Size](/docs/performance/bundle-size.md) - Reduce bundle
- [Web Vitals](/docs/performance/web-vitals.md) - Monitor vitals

---

💡 **Tip**: Use the browser's Performance tab to identify bottlenecks.

⚠️ **Warning**: Measure before optimizing—premature optimization wastes time.

ℹ️ **Note**: PhilJS's fine-grained reactivity is fast by default.

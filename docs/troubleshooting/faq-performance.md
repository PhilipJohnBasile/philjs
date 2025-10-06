# FAQ - Performance

Performance-related frequently asked questions.

## Bundle Size

**Q: How do I reduce bundle size?**

A: Use code splitting and tree shaking:

```tsx
import { lazy } from 'philjs-core';

const Heavy = lazy(() => import('./Heavy'));
```

**Q: Why is my bundle large?**

A: Analyze with:

```bash
npm run build -- --analyze
```

## Runtime Performance

**Q: How do I optimize renders?**

A: Use memos for derived values:

```tsx
const filtered = memo(() => items().filter(i => i.active));
```

**Q: How do I batch updates?**

A: Use batch():

```tsx
batch(() => {
  count.set(5);
  name.set('Alice');
}); // Single render
```

## Loading Performance

**Q: How do I improve initial load?**

A: Use SSR and code splitting:

```tsx
export const loader = createDataLoader(async () => {
  return { data: await fetchData() };
});
```

## Next Steps

- [Performance Guide](/docs/performance/overview.md) - Performance optimization

---

💡 **Tip**: Profile before optimizing—measure to find real bottlenecks.

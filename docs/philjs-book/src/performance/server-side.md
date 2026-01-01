# Server-Side Performance

Optimize server-side rendering for faster page loads.

## SSR Optimization

### Streaming SSR

```tsx
export const loader = createDataLoader(async () => {
  return {
    critical: await fetchCritical(),
    deferred: fetchDeferred() // Streams later
  };
});
```

### Edge Rendering

```tsx
export const config = {
  runtime: 'edge'
};

export default function EdgePage() {
  return <div>Rendered at the edge!</div>;
}
```

## Caching

### Cache Headers

```tsx
export const config = {
  cache: {
    maxAge: 3600,
    staleWhileRevalidate: 86400
  }
};
```

## Best Practices

### ✅ Do: Cache Static Content

```tsx
// ✅ Good - cached at edge
export const config = { cache: { maxAge: 3600 } };
```

## Next Steps

- [SSR](../ssr/overview.md) - Server-side rendering
- [Caching](../data/caching.md) - Caching strategies

---

💡 **Tip**: Use edge rendering for global low-latency responses.

ℹ️ **Note**: Streaming SSR sends HTML progressively for faster TTFB.



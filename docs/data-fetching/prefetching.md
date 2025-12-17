# Prefetching

Prefetching loads data before it's needed, making navigation feel instant. PhilJS provides automatic and manual prefetching strategies.


## Link Prefetching

### Automatic Prefetch on Hover

```tsx
import { Link } from 'philjs-router';

export default function Navigation() {
  return (
    <nav>
      <Link href="/products" prefetch="hover">
        Products
      </Link>
      <Link href="/about" prefetch="visible">
        About
      </Link>
    </nav>
  );
}
```

### Prefetch Strategies

```tsx
// Prefetch on hover (default)
<Link href="/page" prefetch="hover">Link</Link>

// Prefetch when visible
<Link href="/page" prefetch="visible">Link</Link>

// Prefetch on mount
<Link href="/page" prefetch="mount">Link</Link>

// Don't prefetch
<Link href="/page" prefetch={false}>Link</Link>
```

## Manual Prefetching

### Programmatic Prefetch

```tsx
import { prefetch } from 'philjs-router';

export default function ProductCard({ product }) {
  return (
    <div
      onMouseEnter={() => {
        prefetch(`/products/${product.id}`);
      }}
    >
      <h3>{product.name}</h3>
      <Link href={`/products/${product.id}`}>View</Link>
    </div>
  );
}
```

### Prefetch with Data

```tsx
import { prefetchQuery } from 'philjs-core';

const prefetchProduct = (id: number) => {
  prefetchQuery(`/api/products/${id}`);
};

<button onMouseEnter={() => prefetchProduct(123)}>
  View Product
</button>
```

## Query Prefetching

### Prefetch in Component

```tsx
import { useQueryClient } from 'philjs-core';

export default function ProductList() {
  const queryClient = useQueryClient();

  const prefetchProduct = (id: number) => {
    queryClient.prefetchQuery(
      ['product', id],
      () => fetch(`/api/products/${id}`).then(r => r.json())
    );
  };

  return (
    <ul>
      {products.map(product => (
        <li
          key={product.id}
          onMouseEnter={() => prefetchProduct(product.id)}
        >
          <Link href={`/products/${product.id}`}>
            {product.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

## Route Prefetching

### Prefetch Related Routes

```tsx
export const loader = createDataLoader(async ({ params }) => {
  const post = await db.posts.findById(params.id);

  // Prefetch related posts
  const relatedIds = post.related;
  relatedIds.forEach(id => {
    prefetch(`/posts/${id}`);
  });

  return { post };
});
```

## Best Practices

### ✅ Do: Prefetch Likely Next Steps

```tsx
// ✅ Good - prefetch common flows
<Link href="/cart" prefetch="hover">
  View Cart (likely next step)
</Link>
```

### ❌ Don't: Over-Prefetch

```tsx
// ❌ Bad - prefetches everything
{items.map(item => (
  <Link href={item.url} prefetch="mount">...</Link>
))}

// ✅ Good - selective prefetch
{items.slice(0, 5).map(item => (
  <Link href={item.url} prefetch="hover">...</Link>
))}
```

## Next Steps

- [Caching](/docs/data-fetching/caching.md) - Cache prefetched data
- [Performance](/docs/performance/overview.md) - Optimize prefetching
- [Navigation](/docs/routing/navigation.md) - Navigation patterns

---

💡 **Tip**: Prefetch on hover for the best balance of performance and bandwidth usage.

⚠️ **Warning**: Don't prefetch authenticated routes for anonymous users—it wastes bandwidth.

ℹ️ **Note**: Prefetched data is cached and reused when the user navigates to that route.

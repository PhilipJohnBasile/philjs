# Route Parameters

PhilJS passes route params directly to your components. This guide expands on handling single parameters, multiple segments, and catch-alls.

## Basic Param

```tsx
export function ProductRoute({ params }: { params: { id: string } }) {
  return <h1>Product {params.id}</h1>;
}
```

Router configuration:

```ts
{
  path: '/products/:id',
  component: ProductRoute,
}
```

## Multiple Segments

```tsx
export function CategoryProductRoute({ params }: { params: { category: string; productId: string } }) {
  return (
    <section>
      <p>Category: {params.category}</p>
      <p>ID: {params.productId}</p>
    </section>
  );
}
```

```ts
{
  path: '/:category/:productId',
  component: CategoryProductRoute,
}
```

## Optional Branches

Declare separate routes for each variant so priorities remain predictable:

```ts
{
  path: '/blog',
  component: BlogIndex,
},
{
  path: '/blog/:slug',
  component: BlogPost,
},
```

## Catch-All (`*`)

Capture everything after a prefix:

```tsx
export function DocsRoute({ params }: { params: { '*': string } }) {
  const segments = params['*']?.split('/') ?? [];
  return <pre>{segments.join(' / ')}</pre>;
}
```

```ts
{
  path: '/docs/*',
  component: DocsRoute,
}
```

## TypeScript Tips

Annotate `params` in component props for type safety. Future versions of PhilJS will generate route typings automatically based on your router configuration.

## Accessing Params Globally

`useRoute()` returns the current match. Use it inside layouts, analytics components, or DevTools overlays:

```tsx
import { useRoute } from '@philjs/router';

export function Breadcrumbs() {
  const route = useRoute();
  if (!route) return null;

  return <span>Viewing {route.params.slug ?? 'home'}</span>;
}
```

Ready for more? Check out [Dynamic Routes](./dynamic-routes.md) for complex examples and [Route Guards](./route-guards.md) to protect sections based on params.

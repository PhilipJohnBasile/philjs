# Server Islands

"Islands Architecture" typically refers to client-side hydration. PhilJS extends this concept to the server with **Server Islands**—components that are rendered independently, cached individually, and stitched together.

## The Problem

In a typical SSR page, the entire page is dynamic if *one* part is dynamic. If your "User Menu" requires a database call, the public "Product Description" (which is static) must also wait for that call every time.

## The Solution

Server Islands allow you to cache the "Product Description" for 1 hour, while rendering the "User Menu" fresh on every request.

```tsx
import { ServerIsland } from '@philjs/ssr';

export default function ProductPage({ id }) {
  return (
    <div>
      {/* Cached for 1 hour, shared across all users */}
      <ServerIsland 
        id="product-details"
        cache={{ ttl: 3600, tags: [`product:${id}`] }}
      >
        <ProductDetails id={id} />
      </ServerIsland>

      {/* Cached for 5 mins, private to this user */}
      <ServerIsland 
        id="user-history"
        cache={{ ttl: 300, private: true }}
      >
        <BrowsingHistory />
      </ServerIsland>
    </div>
  );
}
```

## Caching Strategy

PhilJS supports multiple caching layers:
1.  **In-Memory (L1)**: Fastest, local to the server process.
2.  **Redis (L2)**: Distributed cache, shared across server instances.
3.  **Edge (KV)**: Cached globally at the CDN edge.

### Stale-While-Revalidate (SWR)

You can serve stale content instantly while updating the cache in the background.

```tsx
<ServerIsland 
  cache={{ 
    ttl: 60,       // Fresh for 60s
    swr: 3600      // Serve stale for up to 1hr while revalidating
  }} 
>
  <StockTicker />
</ServerIsland>
```

## Cache Invalidation

When data changes, you can invalidate specific islands by tag.

```typescript
import { invalidateIslandsByTag } from '@philjs/ssr';

// Inside your CMS webhook handler
await invalidateIslandsByTag(`product:${updatedProductId}`);
```

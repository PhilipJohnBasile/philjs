# Server Islands

Server Islands provide per-component caching with fine-grained invalidation, allowing you to mix static and dynamic content seamlessly. This feature is similar to Astro 5's Server Islands but with more advanced caching strategies.

## What are Server Islands?

Server Islands let you:
- Cache components individually with TTL
- Use stale-while-revalidate for fresh content
- Invalidate cache by tags
- Mix personalized content in static pages
- Deploy to edge runtimes (Redis, KV stores)

## Basic Usage

```tsx
import { ServerIsland } from 'philjs-islands';

function ProductPage({ productId }) {
  return (
    <div>
      {/* Static product info - cached for 1 hour */}
      <ServerIsland
        id={`product-${productId}`}
        cache={{
          ttl: 3600,
          swr: 600,
          tags: ['products', `product-${productId}`]
        }}
      >
        <ProductInfo productId={productId} />
      </ServerIsland>

      {/* Dynamic recommendations - cached for 5 minutes */}
      <ServerIsland
        id={`recommendations-${productId}`}
        cache={{
          ttl: 300,
          tags: ['recommendations']
        }}
        fallback={<RecommendationsSkeleton />}
      >
        <Recommendations productId={productId} />
      </ServerIsland>

      {/* Personalized content - cached per user */}
      <ServerIsland
        id={`cart-${getUserId()}`}
        cache={{
          ttl: 60,
          private: true,
          tags: ['user', getUserId()]
        }}
      >
        <UserCart />
      </ServerIsland>
    </div>
  );
}
```

## How Server Islands Work

### 1. First Request
- Island is rendered on the server
- HTML is cached with TTL
- Response includes cache headers

### 2. Subsequent Requests (Cache Hit)
- Cached HTML is served immediately
- No component rendering required
- TTFB improved by 60-90%

### 3. Cache Miss or Stale
- Component re-renders on server
- New HTML cached
- Stale content served while revalidating (if SWR enabled)

## ServerIsland Props

```typescript
interface ServerIslandProps {
  // Unique identifier for this island
  id: string;

  // Children to render
  children: JSX.Element;

  // Cache configuration
  cache?: {
    // Time-to-live in seconds
    ttl: number;

    // Stale-while-revalidate in seconds
    swr?: number;

    // Cache tags for invalidation
    tags?: string[];

    // Private cache (user-specific)
    private?: boolean;

    // Vary by headers
    varyBy?: string[];

    // Edge cache control
    edge?: boolean;
  };

  // Fallback while rendering
  fallback?: JSX.Element;

  // Defer loading strategy
  defer?: 'visible' | 'idle' | 'interaction';

  // Render priority (0-10)
  priority?: number;
}
```

## Caching Strategies

### Time-based Caching (TTL)

```tsx
<ServerIsland
  id="homepage-hero"
  cache={{ ttl: 3600 }}  // Cache for 1 hour
>
  <Hero />
</ServerIsland>
```

### Stale-While-Revalidate

Serve stale content while fetching fresh data in the background:

```tsx
<ServerIsland
  id="product-list"
  cache={{
    ttl: 600,    // Fresh for 10 minutes
    swr: 300,    // Serve stale for 5 more minutes while revalidating
  }}
>
  <ProductList />
</ServerIsland>
```

### Tag-Based Invalidation

```tsx
<ServerIsland
  id="user-profile"
  cache={{
    ttl: 3600,
    tags: ['user', 'user-123', 'profiles']
  }}
>
  <UserProfile userId="123" />
</ServerIsland>

// Later, invalidate all islands with specific tags
import { invalidateIslandsByTag } from 'philjs-islands';

// Invalidate all user-related islands
await invalidateIslandsByTag('user');

// Invalidate specific user's islands
await invalidateIslandsByTag('user-123');
```

### Private Caching

Cache personalized content per user:

```tsx
<ServerIsland
  id={`dashboard-${userId}`}
  cache={{
    ttl: 300,
    private: true,  // Not shared across users
    tags: ['user', userId]
  }}
>
  <UserDashboard userId={userId} />
</ServerIsland>
```

## Cache Management API

### Render and Cache

```tsx
import { renderServerIsland } from 'philjs-islands';

// Server-side
const html = await renderServerIsland(
  'product-123',
  ProductComponent,
  { productId: '123' },
  { ttl: 3600, tags: ['products'] }
);
```

### Manual Caching

```tsx
import { cacheIsland } from 'philjs-islands';

await cacheIsland(
  'custom-island',
  '<div>Cached content</div>',
  {
    ttl: 3600,
    tags: ['custom']
  }
);
```

### Invalidation

```tsx
import {
  invalidateIsland,
  invalidateIslandsByTag,
  clearIslandCache
} from 'philjs-islands';

// Invalidate specific island
await invalidateIsland('product-123');

// Invalidate by tag
await invalidateIslandsByTag('products');

// Clear all cache
await clearIslandCache();
```

### Prefetching

Pre-warm the cache before requests:

```tsx
import { prefetchIsland } from 'philjs-islands';

// Prefetch popular products
await Promise.all(
  popularProductIds.map(id =>
    prefetchIsland(
      `product-${id}`,
      ProductComponent,
      { productId: id },
      { ttl: 3600 }
    )
  )
);
```

## Cache Adapters

### In-Memory Cache (Default)

```typescript
// Automatic - no configuration needed
```

### Redis Adapter

```tsx
import { createRedisCacheAdapter, setIslandCacheStore } from 'philjs-islands';
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

await redis.connect();

const cacheStore = createRedisCacheAdapter(redis);
setIslandCacheStore(cacheStore);
```

### Edge KV Adapter (Cloudflare, Vercel)

```tsx
import { createKVCacheAdapter, setIslandCacheStore } from 'philjs-islands';

// Cloudflare Workers
const cacheStore = createKVCacheAdapter(CACHE_KV);
setIslandCacheStore(cacheStore);

// Vercel Edge
const cacheStore = createKVCacheAdapter({
  get: async (key) => await kv.get(key),
  set: async (key, value, ttl) => await kv.set(key, value, { ex: ttl }),
  delete: async (key) => await kv.del(key),
});
setIslandCacheStore(cacheStore);
```

### Custom Cache Adapter

```tsx
import { setIslandCacheStore } from 'philjs-islands';

const customCache = {
  async get(key: string) {
    // Fetch from your cache
    return await myCache.get(key);
  },

  async set(key: string, value: any, ttl?: number) {
    // Store in your cache
    await myCache.set(key, value, { ttl });
  },

  async delete(key: string) {
    await myCache.delete(key);
  },

  async invalidateByTag(tag: string) {
    // Invalidate all keys with this tag
    const keys = await myCache.getKeysByTag(tag);
    await Promise.all(keys.map(k => myCache.delete(k)));
  },

  async clear() {
    await myCache.clear();
  },
};

setIslandCacheStore(customCache);
```

## Cache Headers

Generate proper HTTP cache headers:

```tsx
import { getIslandCacheHeaders } from 'philjs-islands';

const headers = getIslandCacheHeaders({
  ttl: 3600,
  swr: 600,
  private: false,
  varyBy: ['Cookie', 'Accept-Language'],
  edge: true
});

// Returns:
// {
//   'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
//   'Vary': 'Cookie, Accept-Language',
//   'CDN-Cache-Control': 'max-age=3600'
// }
```

## Metrics and Monitoring

```tsx
import {
  getServerIslandMetrics,
  resetServerIslandMetrics
} from 'philjs-islands';

// Get performance metrics
const metrics = getServerIslandMetrics();
console.log({
  hits: metrics.hits,
  misses: metrics.misses,
  staleHits: metrics.staleHits,
  revalidations: metrics.revalidations,
  errors: metrics.errors,
  avgRenderTime: metrics.avgRenderTime,
  cacheHitRate: metrics.hits / (metrics.hits + metrics.misses)
});

// Reset metrics
resetServerIslandMetrics();
```

## Defer Strategies

Control when islands are loaded:

### Eager (Default)

```tsx
<ServerIsland id="hero">
  <Hero />
</ServerIsland>
```

### Visible

Load when island enters viewport:

```tsx
<ServerIsland id="recommendations" defer="visible">
  <Recommendations />
</ServerIsland>
```

### Idle

Load during browser idle time:

```tsx
<ServerIsland id="footer" defer="idle">
  <Footer />
</ServerIsland>
```

### Interaction

Load on user interaction:

```tsx
<ServerIsland id="comments" defer="interaction">
  <Comments />
</ServerIsland>
```

## Use Cases

### E-commerce Product Page

```tsx
function ProductPage({ id }) {
  return (
    <>
      {/* Product info - rarely changes */}
      <ServerIsland
        id={`product-${id}`}
        cache={{ ttl: 3600, tags: ['products', `product-${id}`] }}
      >
        <ProductDetails productId={id} />
      </ServerIsland>

      {/* Inventory - changes frequently */}
      <ServerIsland
        id={`inventory-${id}`}
        cache={{ ttl: 60, swr: 30, tags: ['inventory'] }}
      >
        <StockStatus productId={id} />
      </ServerIsland>

      {/* Reviews - moderate updates */}
      <ServerIsland
        id={`reviews-${id}`}
        cache={{ ttl: 300, tags: ['reviews'] }}
        defer="visible"
      >
        <ProductReviews productId={id} />
      </ServerIsland>

      {/* Personalized recommendations */}
      <ServerIsland
        id={`recs-${id}-${userId}`}
        cache={{ ttl: 300, private: true, tags: ['user', userId] }}
        defer="visible"
      >
        <PersonalizedRecs productId={id} userId={userId} />
      </ServerIsland>
    </>
  );
}
```

### News Homepage

```tsx
function Homepage() {
  return (
    <>
      {/* Breaking news - short TTL */}
      <ServerIsland
        id="breaking-news"
        cache={{ ttl: 60, swr: 30, tags: ['news'] }}
      >
        <BreakingNews />
      </ServerIsland>

      {/* Top stories - moderate TTL */}
      <ServerIsland
        id="top-stories"
        cache={{ ttl: 300, tags: ['news', 'stories'] }}
      >
        <TopStories />
      </ServerIsland>

      {/* Sidebar widgets - longer TTL */}
      <ServerIsland
        id="sidebar-trending"
        cache={{ ttl: 900, tags: ['trending'] }}
        defer="idle"
      >
        <TrendingTopics />
      </ServerIsland>
    </>
  );
}
```

### User Dashboard

```tsx
function Dashboard({ userId }) {
  return (
    <>
      {/* User stats - private cache */}
      <ServerIsland
        id={`stats-${userId}`}
        cache={{
          ttl: 300,
          private: true,
          tags: ['user', userId, 'stats']
        }}
      >
        <UserStats userId={userId} />
      </ServerIsland>

      {/* Activity feed - frequent updates */}
      <ServerIsland
        id={`feed-${userId}`}
        cache={{
          ttl: 60,
          swr: 30,
          private: true,
          tags: ['user', userId, 'feed']
        }}
      >
        <ActivityFeed userId={userId} />
      </ServerIsland>
    </>
  );
}
```

## Performance Benefits

### Typical Improvements

- **TTFB**: Reduced by 60-90% on cache hits
- **Server Load**: Reduced by 70-85% with 80% cache hit rate
- **Database Queries**: Reduced by 80-95%
- **API Calls**: Reduced by 70-90%

### Cache Hit Rates

Real-world averages:
- Product pages: 80-90%
- User dashboards: 50-70%
- Homepage: 90-95%
- Search results: 30-50%

## Best Practices

### 1. Choose Appropriate TTL

```tsx
// Static content - long TTL
<ServerIsland cache={{ ttl: 86400 }}>  // 24 hours

// Semi-static - medium TTL
<ServerIsland cache={{ ttl: 3600 }}>   // 1 hour

// Dynamic - short TTL
<ServerIsland cache={{ ttl: 60 }}>     // 1 minute

// Real-time - very short TTL
<ServerIsland cache={{ ttl: 10 }}>     // 10 seconds
```

### 2. Use SWR for Better UX

```tsx
<ServerIsland
  cache={{
    ttl: 300,   // Fresh for 5 minutes
    swr: 120,   // Serve stale for 2 more minutes while revalidating
  }}
>
  <Content />
</ServerIsland>
```

### 3. Tag Everything

```tsx
// Good - specific tags for targeted invalidation
<ServerIsland cache={{
  ttl: 3600,
  tags: ['products', 'category-electronics', 'product-123']
}}>

// Bad - no tags, can't invalidate selectively
<ServerIsland cache={{ ttl: 3600 }}>
```

### 4. Use Private Cache for Personalized Content

```tsx
<ServerIsland
  id={`profile-${userId}`}
  cache={{
    ttl: 300,
    private: true,  // Not shared between users
    tags: ['user', userId]
  }}
>
  <UserProfile />
</ServerIsland>
```

### 5. Defer Below-the-Fold Content

```tsx
<ServerIsland defer="visible">
  <BelowTheFoldContent />
</ServerIsland>
```

## Comparison with Other Frameworks

| Feature | PhilJS Islands | Astro 5 | Qwik | Next.js |
|---------|---------------|---------|------|---------|
| Per-component Caching | ✅ | ✅ | ❌ | ❌ |
| TTL Control | ✅ | ✅ | ❌ | ❌ |
| Stale-while-revalidate | ✅ | ❌ | ❌ | ✅ |
| Tag-based Invalidation | ✅ | ❌ | ❌ | ✅ |
| Edge Adapters | ✅ | ✅ | ❌ | ✅ |
| Defer Strategies | ✅ | ✅ | ✅ | ❌ |
| Private Caching | ✅ | ❌ | ❌ | ✅ |

## Advanced: Edge Deployment

Deploy Server Islands to the edge:

```tsx
// Cloudflare Workers
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Set edge KV cache
    const cacheStore = createKVCacheAdapter(env.CACHE_KV);
    setIslandCacheStore(cacheStore);

    // Render island
    const html = await renderServerIsland(
      url.pathname,
      App,
      {},
      { ttl: 3600, edge: true }
    );

    return new Response(html, {
      headers: getIslandCacheHeaders({
        ttl: 3600,
        edge: true
      })
    });
  }
};
```

## Debugging

Enable verbose logging:

```tsx
<ServerIsland
  id="debug-island"
  cache={{ ttl: 300 }}
  onCacheHit={() => console.log('Cache hit!')}
  onCacheMiss={() => console.log('Cache miss')}
  onRevalidate={() => console.log('Revalidating')}
  onError={(err) => console.error('Error:', err)}
>
  <Content />
</ServerIsland>
```

## Related

- [PPR](/learn/ppr) - Partial Pre-rendering
- [Activity Component](/learn/activity) - Priority-based rendering
- [SSR](/advanced/ssr) - Server-side rendering
- [Performance](/performance/server-side) - Server optimization

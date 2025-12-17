# philjs-islands

Islands architecture with selective hydration and server-side component caching for PhilJS.

## Installation

```bash
pnpm add philjs-islands
```

## Usage

### Basic Island Hydration

Islands allow you to selectively hydrate interactive components on an otherwise static page:

```typescript
import { mountIslands, hydrateIsland } from 'philjs-islands';

// Automatically mount all islands on page load
mountIslands(document.body);

// Or manually hydrate a specific island
const islandElement = document.querySelector('[island="Counter"]');
hydrateIsland(islandElement);
```

### Defining Islands

Mark components as islands in your HTML:

```typescript
function Counter({ initial = 0 }) {
  const count = signal(initial);

  return (
    <div island="Counter" data-prop-initial={initial}>
      <p>Count: {count}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Island Component Loader

Register and lazy-load island components:

```typescript
import { registerIsland, loadIsland, initIslands } from 'philjs-islands';

// Register island loaders
registerIsland('Counter', () => import('./islands/Counter'));
registerIsland('SearchBox', () => import('./islands/SearchBox'));
registerIsland('VideoPlayer', () => import('./islands/VideoPlayer'));

// Define island manifest
const manifest = {
  Counter: {
    import: './islands/Counter.tsx',
    trigger: 'visible', // 'visible' | 'idle' | 'immediate'
  },
  SearchBox: {
    import: './islands/SearchBox.tsx',
    trigger: 'immediate',
  },
  VideoPlayer: {
    import: './islands/VideoPlayer.tsx',
    trigger: 'visible',
    props: { autoplay: false },
  },
};

// Initialize all islands with hydration strategies
initIslands(manifest);
```

### SSR Island Wrapper

Use the `Island` component during SSR to mark hydration boundaries:

```typescript
import { Island } from 'philjs-islands';

function BlogPost({ content }) {
  return (
    <article>
      <h1>{content.title}</h1>
      <div>{content.body}</div>

      {/* Only this component will hydrate on the client */}
      <Island name="CommentSection" trigger="visible" props={{ postId: content.id }}>
        <CommentSection postId={content.id} />
      </Island>
    </article>
  );
}
```

### Server Islands (2026 Feature)

Server Islands allow you to cache server-rendered components independently:

```typescript
import {
  ServerIsland,
  renderServerIsland,
  cacheIsland,
  invalidateIsland,
} from 'philjs-islands';

// Define a server island with caching
async function ProductRecommendations({ userId }) {
  const recommendations = await getRecommendations(userId);

  return (
    <ServerIsland
      id={`recommendations-${userId}`}
      ttl={3600} // Cache for 1 hour
      tags={['recommendations', `user:${userId}`]}
    >
      <div>
        {recommendations.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </ServerIsland>
  );
}

// Render server island on the server
const html = await renderServerIsland('recommendations-123', async () => {
  return <ProductRecommendations userId="123" />;
}, {
  ttl: 3600,
  tags: ['recommendations', 'user:123'],
});

// Invalidate cache when data changes
await invalidateIsland('recommendations-123');

// Or invalidate by tag
await invalidateIslandsByTag('recommendations');
```

### Custom Cache Store

Use Redis or other storage backends for server islands:

```typescript
import { setIslandCacheStore, createRedisCacheAdapter } from 'philjs-islands';

// Redis adapter
const redisCache = createRedisCacheAdapter({
  host: 'localhost',
  port: 6379,
});

setIslandCacheStore(redisCache);

// Or Cloudflare KV
const kvCache = createKVCacheAdapter({
  namespace: env.ISLAND_CACHE,
});

setIslandCacheStore(kvCache);
```

### Island Prefetching

Prefetch islands before they become visible:

```typescript
import { prefetchIsland } from 'philjs-islands';

// Prefetch island data
await prefetchIsland('recommendations-123', {
  priority: 'high',
});

// Use in component
function ProductPage({ productId }) {
  useEffect(() => {
    // Prefetch related islands
    prefetchIsland(`reviews-${productId}`);
    prefetchIsland(`similar-products-${productId}`);
  }, [productId]);

  return <div>...</div>;
}
```

### Monitoring & Metrics

Track island cache performance:

```typescript
import { getServerIslandMetrics, resetServerIslandMetrics } from 'philjs-islands';

// Get cache metrics
const metrics = getServerIslandMetrics();
console.log('Hit rate:', metrics.hitRate);
console.log('Total hits:', metrics.hits);
console.log('Total misses:', metrics.misses);
console.log('Average render time:', metrics.avgRenderTime);

// Reset metrics
resetServerIslandMetrics();
```

## API

### Client-Side Hydration

- `mountIslands(root?)` - Automatically mount all islands in the DOM
- `hydrateIsland(element)` - Manually hydrate a specific island element

### Island Registration

- `registerIsland(name, loader)` - Register a lazy-loadable island component
- `loadIsland(element, manifest)` - Load and hydrate an island from manifest
- `initIslands(manifest)` - Initialize all islands with hydration strategies

### SSR Components

- `<Island name="..." trigger="..." props={...}>` - Mark hydration boundary during SSR

### Server Islands

- `<ServerIsland id="..." ttl={...} tags={[...]}>` - Server-rendered cacheable component
- `renderServerIsland(id, render, options)` - Render server island with caching
- `cacheIsland(id, html, options)` - Manually cache island HTML
- `invalidateIsland(id)` - Invalidate specific island cache
- `invalidateIslandsByTag(tag)` - Invalidate all islands with a tag
- `clearIslandCache()` - Clear entire island cache
- `prefetchIsland(id, options)` - Prefetch island data

### Cache Stores

- `setIslandCacheStore(store)` - Set custom cache backend
- `getIslandCacheStore()` - Get current cache store
- `createRedisCacheAdapter(config)` - Create Redis cache adapter
- `createKVCacheAdapter(config)` - Create KV store adapter (Cloudflare)

### Monitoring

- `getServerIslandMetrics()` - Get cache performance metrics
- `resetServerIslandMetrics()` - Reset metrics counters
- `getIslandCacheHeaders(id)` - Get HTTP cache headers for island

## Examples

See islands in action in these example apps:

- [Demo App](../../examples/demo-app) - Full-featured demo with islands, SSR, and routing

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Features

- **Selective hydration** - Only hydrate interactive components
- **Lazy loading** - Load island code on-demand
- **Hydration strategies** - Control when islands hydrate (visible, idle, immediate)
- **Server islands** - Cache server-rendered components independently
- **Cache invalidation** - Tag-based and ID-based cache clearing
- **Custom backends** - Redis, KV, or any cache store
- **Prefetching** - Warm up caches before islands are needed
- **Metrics** - Track cache hit rates and performance
- **Zero overhead** - Static content ships zero JavaScript
- **Framework agnostic** - Works with any component model

## Island Manifest

When using `initIslands()`, provide a manifest defining each island:

```typescript
type IslandManifest = {
  [name: string]: {
    import: string;              // Path to island component
    props?: Record<string, any>; // Default props
    trigger?: 'visible' | 'idle' | 'immediate';
  };
};
```

## Hydration Triggers

- **visible** - Hydrate when island scrolls into viewport (uses IntersectionObserver)
- **idle** - Hydrate when browser is idle (uses requestIdleCallback)
- **immediate** - Hydrate immediately on page load

## Server Island Options

```typescript
type ServerIslandCache = {
  id: string;           // Unique cache key
  ttl?: number;         // Time to live in seconds
  tags?: string[];      // Tags for batch invalidation
  staleWhileRevalidate?: number;  // Serve stale while refreshing
};
```

## Events

Islands dispatch custom events you can listen to:

```typescript
// Island hydrated
element.addEventListener('phil:island-hydrated', (e) => {
  console.log('Island hydrated:', e.detail.name);
});

// Island loaded (component code fetched)
element.addEventListener('phil:island-loaded', (e) => {
  console.log('Island loaded:', e.detail.name);
});
```

## Best Practices

1. **Use islands for interactivity** - Keep static content static, only hydrate what needs JavaScript
2. **Lazy load by default** - Use `visible` or `idle` triggers unless immediate interaction is needed
3. **Cache server islands** - Expensive server-rendered components benefit from caching
4. **Tag your caches** - Use tags for easy invalidation (e.g., `['user:123', 'posts']`)
5. **Monitor metrics** - Track cache hit rates to optimize TTLs
6. **Prefetch strategically** - Warm caches for critical paths

## License

MIT

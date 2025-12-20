# philjs-islands

Islands architecture with **multi-framework support**, selective hydration, and server-side component caching for PhilJS.

## Features

- **Multi-Framework Islands**: Use React, Vue, Svelte, Preact, and Solid components on the same page (Astro-style)
- **Selective Hydration**: Only hydrate interactive components when needed
- **Multiple Strategies**: Immediate, visible, idle, interaction, and media-based hydration
- **Framework Auto-Detection**: Automatically detect component frameworks
- **Shared State**: Cross-framework state management with event bus
- **Code Splitting**: Automatic framework-specific code splitting via Vite plugin
- **Server Islands**: Cache server-rendered components independently
- **TypeScript**: Full type safety across all frameworks

## Installation

```bash
pnpm add philjs-islands
```

### Framework Dependencies (Optional)

Install only the frameworks you plan to use:

```bash
# React
pnpm add react react-dom

# Vue
pnpm add vue

# Svelte
pnpm add svelte

# Preact
pnpm add preact

# Solid
pnpm add solid-js
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

## Multi-Framework Islands

For complete multi-framework documentation, see [MULTI-FRAMEWORK.md](./MULTI-FRAMEWORK.md).

### Quick Example

```tsx
import { MultiFrameworkIsland, registerIslandComponent } from 'philjs-islands';

// Register components from different frameworks
registerIslandComponent('react', 'Counter', () => import('./islands/Counter.tsx'));
registerIslandComponent('vue', 'TodoList', () => import('./islands/TodoList.vue'));
registerIslandComponent('svelte', 'Timer', () => import('./islands/Timer.svelte'));

function App() {
  return (
    <div>
      {/* React Island */}
      <MultiFrameworkIsland
        framework="react"
        component="Counter"
        props={{ initial: 0 }}
        hydration={{ strategy: 'visible' }}
      />

      {/* Vue Island */}
      <MultiFrameworkIsland
        framework="vue"
        component="TodoList"
        props={{ items: [] }}
        hydration={{ strategy: 'idle' }}
      />

      {/* Svelte Island */}
      <MultiFrameworkIsland
        framework="svelte"
        component="Timer"
        props={{ autoStart: true }}
        hydration={{ strategy: 'immediate' }}
      />
    </div>
  );
}
```

### Shared State Across Frameworks

```typescript
import { createSharedState, eventBus } from 'philjs-islands';

// Create shared state accessible to all frameworks
const globalState = createSharedState('app', {
  user: { name: 'Guest' },
  theme: 'light'
});

// Any island can update it
globalState.updateState({ theme: 'dark' });

// Cross-framework events
eventBus.emit('user-logged-in', { userId: 123 });
eventBus.on('user-logged-in', (data) => {
  console.log('User:', data.userId);
});
```

## Examples

See islands in action in these example apps:

- [Multi-Framework Demo](./examples/multi-framework/) - React, Vue, and Svelte on one page
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

## Core Features

### Multi-Framework Support
- **React** - Full React 18+ support with concurrent features
- **Vue** - Vue 3 Composition API and Vue 2 compatibility
- **Svelte** - Svelte 4 and 5 support
- **Preact** - Lightweight React alternative
- **Solid** - Fine-grained reactivity
- **Auto-detection** - Automatically detect component frameworks
- **Custom adapters** - Add support for any framework

### Selective Hydration
- **Immediate** - Hydrate right away for critical components
- **Visible** - Hydrate when scrolled into viewport (IntersectionObserver)
- **Idle** - Hydrate when browser is idle (requestIdleCallback)
- **Interaction** - Hydrate on user interaction (click, focus, etc.)
- **Media** - Hydrate based on media queries
- **Manual** - Full control over hydration timing

### Cross-Framework Features
- **Shared State** - State management across different frameworks
- **Event Bus** - Publish/subscribe events between islands
- **Props Normalization** - Automatic props conversion between frameworks
- **Island Bridges** - Typed communication channels

### Build Optimization
- **Vite Plugin** - Automatic framework detection and code splitting
- **Code Splitting** - Separate bundles per framework
- **Tree Shaking** - Only bundle frameworks you use
- **Manifest Generation** - Build-time optimization metadata

### Server Islands
- **Cache server-rendered components** - Independent caching per island
- **Tag-based invalidation** - Invalidate related islands together
- **Custom backends** - Redis, KV, or any cache store
- **Metrics** - Track cache hit rates and performance

### Developer Experience
- **TypeScript** - Full type safety across all frameworks
- **Zero overhead** - Static content ships zero JavaScript
- **Hot Module Replacement** - Fast development with HMR
- **Debug Tools** - Monitor islands and state in development

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

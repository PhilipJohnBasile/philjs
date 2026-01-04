# Smart Preloading

The `@philjs/router` package provides Qwik-style smart preloading for predictive prefetching and instant navigations.

## Overview

Smart preloading features:
- Predictive prefetching based on user behavior
- Network-aware preloading (respects Save-Data, connection speed)
- Priority queue management
- Service Worker integration
- Viewport-based preloading (Intersection Observer)
- Hover and focus intent detection

## Basic Usage

### initSmartPreloader

Initialize the preloader with configuration:

```tsx
import { initSmartPreloader } from '@philjs/router';

initSmartPreloader({
  // Preloading strategy
  strategy: 'adaptive', // 'aggressive' | 'conservative' | 'adaptive'

  // Maximum concurrent preloads
  maxConcurrent: 3,

  // Delay before preloading on hover (ms)
  hoverDelay: 100,

  // Intersection Observer threshold
  intersectionThreshold: 0.1,

  // Network-aware settings
  respectSaveData: true,
  minConnectionSpeed: '3g' // 'slow-2g' | '2g' | '3g' | '4g'
});
```

### Preloading Strategies

#### Aggressive

Preloads as much as possible:

```tsx
initSmartPreloader({
  strategy: 'aggressive',
  maxConcurrent: 5,
  hoverDelay: 0,
  prefetchOnViewport: true,
  prefetchOnIdle: true
});
```

#### Conservative

Only preloads on explicit intent:

```tsx
initSmartPreloader({
  strategy: 'conservative',
  maxConcurrent: 2,
  hoverDelay: 200,
  prefetchOnViewport: false,
  prefetchOnIdle: false
});
```

#### Adaptive

Adjusts based on network and device:

```tsx
initSmartPreloader({
  strategy: 'adaptive',
  maxConcurrent: 3,
  // Automatically adjusts based on:
  // - Network speed (Navigator.connection)
  // - Save-Data header
  // - Device memory (Navigator.deviceMemory)
  // - Battery status
});
```

## PrefetchManager

The `PrefetchManager` class handles all preloading operations.

### Configuration

```tsx
type PrefetchConfig = {
  /** Max concurrent prefetch requests */
  maxConcurrent: number;

  /** Delay before prefetching on hover (ms) */
  hoverDelay: number;

  /** Intersection threshold for viewport prefetching */
  intersectionThreshold: number;

  /** Respect Save-Data header */
  respectSaveData: boolean;

  /** Minimum connection speed */
  minConnectionSpeed: '4g' | '3g' | '2g' | 'slow-2g';

  /** Prefetch data loaders */
  prefetchData: boolean;

  /** Prefetch component code */
  prefetchComponent: boolean;

  /** Use Service Worker for prefetching */
  useServiceWorker: boolean;

  /** Cache prefetched resources */
  cacheResults: boolean;

  /** Cache TTL in ms */
  cacheTTL: number;
};
```

### Creating a Manager

```tsx
import { PrefetchManager } from '@philjs/router';

const prefetchManager = new PrefetchManager({
  maxConcurrent: 3,
  hoverDelay: 100,
  cacheResults: true,
  cacheTTL: 5 * 60 * 1000 // 5 minutes
});

// Start the manager
prefetchManager.start();

// Stop when done
prefetchManager.stop();
```

## Prefetch Modes

### Intent-Based (Hover/Focus)

Preload when user shows intent:

```tsx
import { Link } from '@philjs/router';

// Preload on hover intent
<Link href="/products" prefetch="intent">
  Products
</Link>

// Preload immediately on hover
<Link href="/products" prefetch="hover">
  Products
</Link>

// Preload on focus
<Link href="/products" prefetch="focus">
  Products
</Link>
```

### Viewport-Based

Preload when link enters viewport:

```tsx
<Link href="/products" prefetch="viewport">
  Products
</Link>

// With custom threshold
<Link
  href="/products"
  prefetch="viewport"
  prefetchThreshold={0.5} // 50% visible
>
  Products
</Link>
```

### Idle-Based

Preload during browser idle time:

```tsx
import { prefetchOnIdle } from '@philjs/router';

// Queue routes for idle prefetching
prefetchOnIdle(['/products', '/about', '/contact']);

// With priority
prefetchOnIdle([
  { href: '/products', priority: 'high' },
  { href: '/about', priority: 'low' }
]);
```

### Manual Preloading

Trigger prefetch programmatically:

```tsx
import { preloadRoute, preloadLink, usePreload } from '@philjs/router';

// Preload a single route
await preloadRoute('/products');

// Preload with options
await preloadRoute('/products', {
  priority: 'high',
  includeData: true,
  includeComponent: true
});

// Preload a link element
preloadLink(linkElement);

// Using the hook
function NavLink({ href, children }) {
  const preload = usePreload();

  return (
    <a
      href={href}
      onMouseEnter={() => preload(href)}
      onFocus={() => preload(href)}
    >
      {children}
    </a>
  );
}
```

## Priority Queue

Manage prefetch priorities:

```tsx
type PrefetchPriority = 'critical' | 'high' | 'medium' | 'low';

type PrefetchQueueItem = {
  href: string;
  priority: PrefetchPriority;
  addedAt: number;
  retries: number;
};

// Queue with priority
prefetchManager.queue('/checkout', 'critical');
prefetchManager.queue('/products', 'high');
prefetchManager.queue('/about', 'low');

// Check queue status
const stats = prefetchManager.getStats();
// {
//   queued: 3,
//   inProgress: 1,
//   completed: 5,
//   failed: 0,
//   cacheHits: 2
// }
```

## Network Awareness

Adapt preloading to network conditions:

```tsx
import { getNetworkInfo, isSlowConnection, shouldPrefetch } from '@philjs/router';

// Get current network info
const network = getNetworkInfo();
// {
//   effectiveType: '4g',
//   downlink: 10,
//   rtt: 50,
//   saveData: false
// }

// Check if connection is slow
if (isSlowConnection()) {
  // Reduce prefetching
  prefetchManager.setMaxConcurrent(1);
}

// Check if prefetching should happen
if (shouldPrefetch()) {
  preloadRoute('/products');
}
```

### Save-Data Handling

```tsx
import { getSaveDataPreference, respectSaveData } from '@philjs/router';

if (getSaveDataPreference()) {
  // User has Save-Data enabled
  // Disable or reduce prefetching
  initSmartPreloader({
    strategy: 'conservative',
    prefetchData: false,
    prefetchComponent: false
  });
}

// Decorator to respect Save-Data
const prefetch = respectSaveData(preloadRoute);
prefetch('/products'); // Only prefetches if Save-Data is off
```

## Service Worker Integration

Use Service Worker for prefetching:

```tsx
import {
  registerPrefetchServiceWorker,
  prefetchWithServiceWorker
} from '@philjs/router';

// Register the prefetch service worker
await registerPrefetchServiceWorker('/sw-prefetch.js');

// Prefetch via service worker
prefetchWithServiceWorker([
  '/products',
  '/api/products',
  '/images/hero.webp'
]);
```

### Service Worker Script

```js
// sw-prefetch.js
import { createPrefetchHandler } from '@philjs/router/sw';

const handler = createPrefetchHandler({
  cacheName: 'prefetch-cache-v1',
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxEntries: 50
});

self.addEventListener('fetch', handler);
self.addEventListener('message', (event) => {
  if (event.data.type === 'PREFETCH') {
    handler.prefetch(event.data.urls);
  }
});
```

## Predictive Prefetching

Learn from user behavior to predict next routes:

```tsx
import {
  enablePredictivePrefetch,
  recordNavigation,
  getPredictedRoutes
} from '@philjs/router';

// Enable predictive prefetching
enablePredictivePrefetch({
  minConfidence: 0.7, // 70% confidence threshold
  maxPredictions: 3,
  learningRate: 0.1
});

// Record navigation for learning
afterEach((to, from) => {
  recordNavigation(from?.path, to.path);
});

// Get predicted routes
const predictions = getPredictedRoutes('/products');
// [
//   { href: '/products/1', confidence: 0.85 },
//   { href: '/cart', confidence: 0.72 }
// ]

// Prefetch predicted routes
predictions.forEach(({ href, confidence }) => {
  if (confidence > 0.7) {
    preloadRoute(href, { priority: 'low' });
  }
});
```

## Cache Management

Manage prefetch cache:

```tsx
import {
  getPrefetchCache,
  clearPrefetchCache,
  isPrefetched,
  getPrefetchStats
} from '@philjs/router';

// Check if route is prefetched
if (isPrefetched('/products')) {
  // Navigate instantly
}

// Get cache contents
const cache = getPrefetchCache();
// Map of { href -> { data, component, timestamp } }

// Clear entire cache
clearPrefetchCache();

// Clear specific entries
clearPrefetchCache(['/products', '/about']);

// Get cache statistics
const stats = getPrefetchStats();
// {
//   size: 10,
//   hits: 45,
//   misses: 12,
//   hitRate: 0.789
// }
```

## EnhancedLink Component

Link with built-in prefetching:

```tsx
import { EnhancedLink } from '@philjs/router';

<EnhancedLink
  href="/products"
  prefetch="hover"
  prefetchTimeout={200}
  preloadData={true}
  preloadComponent={true}
  priority="high"
>
  Products
</EnhancedLink>
```

### EnhancedLink Props

```tsx
type EnhancedLinkProps = {
  href: string;
  prefetch?: 'hover' | 'viewport' | 'intent' | 'idle' | 'none';
  prefetchTimeout?: number;
  prefetchThreshold?: number;
  preloadData?: boolean;
  preloadComponent?: boolean;
  priority?: PrefetchPriority;
  children: ReactNode;
} & AnchorHTMLAttributes;
```

## Complete Example

```tsx
import {
  initSmartPreloader,
  PrefetchManager,
  EnhancedLink,
  usePreload,
  prefetchOnIdle,
  enablePredictivePrefetch,
  afterEach,
  recordNavigation
} from '@philjs/router';

// Initialize smart preloader
initSmartPreloader({
  strategy: 'adaptive',
  maxConcurrent: 3,
  hoverDelay: 100,
  respectSaveData: true,
  cacheResults: true,
  cacheTTL: 5 * 60 * 1000
});

// Enable predictive prefetching
enablePredictivePrefetch({
  minConfidence: 0.7,
  maxPredictions: 3
});

// Track navigations for predictions
afterEach((to, from) => {
  recordNavigation(from?.path, to.path);
});

// Prefetch common routes on idle
prefetchOnIdle([
  { href: '/', priority: 'high' },
  { href: '/products', priority: 'high' },
  { href: '/about', priority: 'low' }
]);

// Navigation component
function Navigation() {
  return (
    <nav>
      {/* Prefetch on viewport */}
      <EnhancedLink href="/" prefetch="viewport">
        Home
      </EnhancedLink>

      {/* Prefetch on hover intent */}
      <EnhancedLink
        href="/products"
        prefetch="intent"
        preloadData={true}
      >
        Products
      </EnhancedLink>

      {/* Prefetch immediately on hover */}
      <EnhancedLink
        href="/cart"
        prefetch="hover"
        prefetchTimeout={50}
        priority="high"
      >
        Cart
      </EnhancedLink>

      {/* No prefetch */}
      <EnhancedLink href="/settings" prefetch="none">
        Settings
      </EnhancedLink>
    </nav>
  );
}

// Custom prefetch button
function ProductCard({ product }) {
  const preload = usePreload();

  return (
    <article
      onMouseEnter={() => preload(`/products/${product.id}`)}
    >
      <h3>{product.name}</h3>
      <EnhancedLink
        href={`/products/${product.id}`}
        prefetch="none" // Already preloaded on card hover
      >
        View Details
      </EnhancedLink>
    </article>
  );
}
```

## API Reference

### Initialization

| Function | Description |
|----------|-------------|
| `initSmartPreloader(config)` | Initialize preloader |
| `PrefetchManager` | Prefetch manager class |

### Preloading Functions

| Function | Description |
|----------|-------------|
| `preloadRoute(href, options?)` | Preload a route |
| `preloadLink(element)` | Preload from link element |
| `prefetchOnIdle(routes)` | Prefetch during idle time |

### Hooks

| Hook | Description |
|------|-------------|
| `usePreload()` | Get preload function |

### Components

| Component | Description |
|-----------|-------------|
| `EnhancedLink` | Link with prefetching |

### Network

| Function | Description |
|----------|-------------|
| `getNetworkInfo()` | Get network information |
| `isSlowConnection()` | Check if connection is slow |
| `shouldPrefetch()` | Check if prefetching is appropriate |
| `getSaveDataPreference()` | Check Save-Data header |

### Predictions

| Function | Description |
|----------|-------------|
| `enablePredictivePrefetch(config)` | Enable predictions |
| `recordNavigation(from, to)` | Record navigation |
| `getPredictedRoutes(current)` | Get predicted routes |

### Cache

| Function | Description |
|----------|-------------|
| `isPrefetched(href)` | Check if prefetched |
| `getPrefetchCache()` | Get cache contents |
| `clearPrefetchCache(hrefs?)` | Clear cache |
| `getPrefetchStats()` | Get cache statistics |

### Service Worker

| Function | Description |
|----------|-------------|
| `registerPrefetchServiceWorker(path)` | Register SW |
| `prefetchWithServiceWorker(urls)` | Prefetch via SW |

## Next Steps

- [View Transitions](./view-transitions.md) - Smooth page transitions
- [Data Loading](./data-loading.md) - Preload route data
- [Route Masking](./route-masking.md) - URL masking for preloaded modals

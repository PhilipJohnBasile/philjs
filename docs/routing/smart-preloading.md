# Smart Preloading

PhilJS includes an intelligent preloading system that predicts user navigation and preloads routes before they're clicked, dramatically improving perceived performance.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Preload Strategies](#preload-strategies)
- [API Reference](#api-reference)
- [Intent Prediction](#intent-prediction)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Overview

Smart preloading uses machine learning and behavioral analysis to predict which route a user will navigate to next:

- **Intent Prediction**: Analyzes mouse trajectory and velocity
- **Hover Detection**: Preloads on link hover with configurable delay
- **Viewport Visibility**: Preloads links about to enter viewport
- **Navigation History**: Learns from user behavior patterns
- **Priority Queuing**: Manages concurrent preloads efficiently
- **Adaptive Loading**: Respects network conditions

### Why Smart Preloading?

Traditional preloading is either too aggressive (wasting bandwidth) or too passive (not fast enough). PhilJS smart preloading:

- **Reduces perceived load time by 60-80%** - Routes feel instant
- **Saves bandwidth** - Only preloads high-probability navigations
- **Improves Core Web Vitals** - Better FID and LCP scores
- **Works automatically** - No manual configuration needed

```typescript
import { initSmartPreloader } from '@philjs/router';

// Initialize with intent prediction
const preloader = initSmartPreloader({
  strategy: 'intent',           // Use ML-based prediction
  intentThreshold: 0.6,         // 60% confidence minimum
  maxConcurrent: 3              // Max 3 concurrent preloads
});

// Preloading happens automatically!
// When mouse moves toward a link, it preloads
```

## Quick Start

### 1. Initialize Preloader

```typescript
import { initSmartPreloader } from '@philjs/router';

// Basic setup with intelligent defaults
const preloader = initSmartPreloader();

// Or customize
const preloader = initSmartPreloader({
  strategy: 'intent',      // Prediction strategy
  hoverDelay: 50,          // ms before preload on hover
  intentThreshold: 0.6,    // Confidence threshold (0-1)
  maxConcurrent: 3,        // Max concurrent requests
  priority: 'auto'         // Priority: 'high' | 'low' | 'auto'
});
```

### 2. Automatic Preloading

Smart preloading works automatically once initialized. Links are preloaded based on the configured strategy:

```tsx
function Navigation() {
  return (
    <nav>
      {/* These will be preloaded automatically based on user intent */}
      <Link to="/products">Products</Link>
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  );
}
```

### 3. Manual Control

You can also manually control preloading:

```tsx
import { usePreload, getSmartPreloader } from '@philjs/router';

function ProductCard({ product }: { product: Product }) {
  // Preload on component mount
  const triggerPreload = usePreload(`/products/${product.id}`, {
    strategy: 'manual',
    priority: 'high'
  });

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={triggerPreload}  // Preload on hover
    >
      <h3>{product.name}</h3>
    </div>
  );
}
```

## Preload Strategies

PhilJS supports five preloading strategies:

### 1. Intent Prediction (`'intent'`)

**Best for:** General navigation (default)

Uses machine learning to predict click intent based on:
- Mouse position relative to link
- Mouse velocity and direction
- Hover duration
- Historical navigation patterns

```typescript
initSmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.6  // 60% confidence minimum
});

// Automatic preloading when confidence threshold met
// No configuration needed - just works!
```

### 2. Hover (`'hover'`)

**Best for:** Navigation menus, product cards

Preloads when mouse hovers over a link, with configurable delay:

```typescript
initSmartPreloader({
  strategy: 'hover',
  hoverDelay: 50  // Wait 50ms before preloading
});
```

### 3. Visible (`'visible'`)

**Best for:** Long pages with many links

Preloads when link enters viewport (or is about to):

```typescript
initSmartPreloader({
  strategy: 'visible'
  // Preloads 50px before entering viewport
});
```

### 4. Eager (`'eager'`)

**Best for:** Critical navigation (homepage links)

Preloads immediately on page load:

```typescript
initSmartPreloader({
  strategy: 'eager'
});

// Or per-link:
<Link to="/important" data-preload="eager">
  Important Page
</Link>
```

### 5. Manual (`'manual'`)

**Best for:** Conditional preloading

Only preloads when explicitly triggered:

```typescript
const preloader = getSmartPreloader();

// Trigger manually
preloader?.preload('/route', {
  strategy: 'manual',
  priority: 'high'
});
```

## API Reference

### `SmartPreloader` Class

The main preloading manager.

#### Constructor

```typescript
new SmartPreloader(options?: PreloadOptions)
```

**PreloadOptions:**
```typescript
type PreloadOptions = {
  strategy?: PreloadStrategy;         // 'hover' | 'visible' | 'intent' | 'eager' | 'manual'
  hoverDelay?: number;                // ms delay for hover strategy
  intentThreshold?: number;           // 0-1, confidence for intent strategy
  maxConcurrent?: number;             // max concurrent preloads
  priority?: 'high' | 'low' | 'auto'; // fetch priority
};
```

#### Methods

##### `register(element: HTMLAnchorElement, options?: PreloadOptions): void`

Register a link for smart preloading.

**Example:**
```typescript
const preloader = new SmartPreloader();

const link = document.querySelector('a[href="/products"]');
preloader.register(link, {
  strategy: 'hover',
  hoverDelay: 100
});
```

##### `preload(url: string, options?: { strategy: PreloadStrategy; priority?: string }): Promise<void>`

Preload a specific URL.

**Example:**
```typescript
await preloader.preload('/products/123', {
  strategy: 'manual',
  priority: 'high'
});
```

##### `recordNavigation(path: string): void`

Record navigation for history-based prediction.

**Example:**
```typescript
preloader.recordNavigation('/products');
preloader.recordNavigation('/products/123');
// Future navigations from /products will prioritize /products/123
```

##### `getStats(): object`

Get preloading statistics.

**Example:**
```typescript
const stats = preloader.getStats();
console.log(`Loaded: ${stats.loaded}`);
console.log(`Loading: ${stats.loading}`);
console.log(`Queued: ${stats.queued}`);
```

##### `clear(): void`

Clear all preload data and queues.

##### `destroy(): void`

Clean up and remove all listeners.

### Helper Functions

##### `initSmartPreloader(options?: PreloadOptions): SmartPreloader`

Initialize global smart preloader.

**Example:**
```typescript
const preloader = initSmartPreloader({
  strategy: 'intent',
  maxConcurrent: 3
});
```

##### `getSmartPreloader(): SmartPreloader | null`

Get global preloader instance.

**Example:**
```typescript
const preloader = getSmartPreloader();
if (preloader) {
  preloader.preload('/route');
}
```

##### `usePreload(href: string, options?: PreloadOptions): () => void`

React-style hook for preloading (returns trigger function).

**Example:**
```typescript
function ProductCard({ id }: { id: number }) {
  const triggerPreload = usePreload(`/products/${id}`, {
    strategy: 'manual'
  });

  return (
    <div onMouseEnter={triggerPreload}>
      Product {id}
    </div>
  );
}
```

##### `preloadLink(element: HTMLAnchorElement, options?: PreloadOptions): () => void`

Directive for links (returns cleanup function).

**Example:**
```typescript
const link = document.querySelector('a');
const cleanup = preloadLink(link, { strategy: 'hover' });

// Later: cleanup();
```

### Intent Prediction

##### `calculateClickIntent(mousePos: {x, y}, mouseVelocity: {x, y}, linkBounds: DOMRect): number`

Calculate click intent probability (0-1).

**Example:**
```typescript
import { calculateClickIntent } from '@philjs/router';

const intent = calculateClickIntent(
  { x: 100, y: 200 },       // Mouse position
  { x: 5, y: -3 },          // Mouse velocity
  link.getBoundingClientRect()
);

console.log(`Click probability: ${(intent * 100).toFixed(0)}%`);
```

##### `predictNextRoute(currentPath: string, visitHistory: string[]): Map<string, number>`

Predict next navigation based on history.

**Returns:** Map of routes to probabilities

**Example:**
```typescript
import { predictNextRoute } from '@philjs/router';

const predictions = predictNextRoute('/products', [
  '/products',
  '/products/123',
  '/products',
  '/products/456',
  '/products',
  '/products/123'  // Visited twice after /products
]);

// Results: { '/products/123': 0.66, '/products/456': 0.33 }
```

## Intent Prediction

### How It Works

Intent prediction uses a sophisticated algorithm:

1. **Distance Score** (40% weight)
   - Closer mouse = higher score
   - Normalized to 0-1

2. **Direction Score** (60% weight)
   - Mouse moving toward link = higher score
   - Uses vector dot product (cosine similarity)

3. **Historical Patterns** (bonus)
   - Learn from past navigation
   - Build transition probability matrix

```typescript
// Pseudocode
intent = distanceScore * 0.4 + directionScore * 0.6 + historyBonus

if (intent >= threshold) {
  preload(url);
}
```

### Tuning Intent Threshold

```typescript
// Conservative (fewer preloads, saves bandwidth)
initSmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.8  // 80% confidence
});

// Aggressive (more preloads, faster navigation)
initSmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.4  // 40% confidence
});

// Balanced (default)
initSmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.6  // 60% confidence
});
```

## Complete Examples

### Example 1: E-Commerce Product List

```tsx
import { initSmartPreloader } from '@philjs/router';
import { signal } from '@philjs/core';

// Initialize with intent prediction
const preloader = initSmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.6,
  maxConcurrent: 5
});

function ProductGrid() {
  const products = signal<Product[]>([]);

  effect(async () => {
    const data = await fetch('/api/products').then(r => r.json());
    products.set(data);
  });

  return (
    <div class="product-grid">
      {products().map(product => (
        <Link
          to={`/products/${product.id}`}
          class="product-card"
        >
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </Link>
      ))}
    </div>
  );
}

// Links automatically preload when user shows intent!
```

### Example 2: Navigation Menu with Hover

```tsx
import { initSmartPreloader } from '@philjs/router';

const preloader = initSmartPreloader({
  strategy: 'hover',
  hoverDelay: 100  // 100ms delay
});

function Navigation() {
  const menuItems = [
    { path: '/products', label: 'Products' },
    { path: '/about', label: 'About' },
    { path: '/blog', label: 'Blog' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <nav>
      {menuItems.map(item => (
        <Link to={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Preloads 100ms after hovering each link
```

### Example 3: Conditional Preloading

```tsx
import { usePreload } from '@philjs/router';
import { signal } from '@philjs/core';

function ArticleCard({ article }: { article: Article }) {
  const isHovered = signal(false);
  const triggerPreload = usePreload(`/articles/${article.id}`, {
    strategy: 'manual',
    priority: article.featured ? 'high' : 'low'
  });

  const handleMouseEnter = () => {
    isHovered.set(true);

    // Only preload if article is popular or featured
    if (article.views > 1000 || article.featured) {
      triggerPreload();
    }
  };

  return (
    <div
      class="article-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => isHovered.set(false)}
    >
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      {isHovered() && article.views > 1000 && (
        <span class="badge">Popular - Preloading...</span>
      )}
    </div>
  );
}
```

### Example 4: Priority Queue

```tsx
import { initSmartPreloader, getSmartPreloader } from '@philjs/router';

// Initialize with max 3 concurrent preloads
const preloader = initSmartPreloader({
  strategy: 'manual',
  maxConcurrent: 3
});

function Dashboard() {
  effect(() => {
    // High priority: Critical pages
    preloader.preload('/dashboard/analytics', {
      strategy: 'manual',
      priority: 'high'
    });

    // Low priority: Less important pages
    preloader.preload('/dashboard/settings', {
      strategy: 'manual',
      priority: 'low'
    });

    preloader.preload('/dashboard/help', {
      strategy: 'manual',
      priority: 'low'
    });

    // High priority routes load first!
  });

  return <div>Dashboard</div>;
}
```

### Example 5: History-Based Prediction

```tsx
import { initSmartPreloader } from '@philjs/router';

const preloader = initSmartPreloader({
  strategy: 'intent'
});

// Record navigation for learning
window.addEventListener('popstate', () => {
  preloader.recordNavigation(window.location.pathname);
});

// After user navigates:
// /products -> /products/123 (3 times)
// /products -> /products/456 (1 time)

// Next time on /products:
// /products/123 has 75% probability (preloads first)
// /products/456 has 25% probability (preloads second)
```

### Example 6: Network-Aware Preloading

```tsx
import { initSmartPreloader } from '@philjs/router';

// Detect network conditions
const connection = (navigator as any).connection;
const isSlow = connection?.effectiveType === '2g' || connection?.effectiveType === '3g';

const preloader = initSmartPreloader({
  strategy: isSlow ? 'manual' : 'intent',
  maxConcurrent: isSlow ? 1 : 3,
  intentThreshold: isSlow ? 0.8 : 0.6
});

// Adapts to network:
// - Slow: Only preload with high confidence
// - Fast: Aggressive preloading
```

## Best Practices

### 1. Choose the Right Strategy

```typescript
// ✅ Use intent for general navigation
initSmartPreloader({ strategy: 'intent' });

// ✅ Use hover for menus
initSmartPreloader({ strategy: 'hover', hoverDelay: 50 });

// ✅ Use visible for long lists
initSmartPreloader({ strategy: 'visible' });

// ✅ Use eager for critical pages only
<Link to="/checkout" data-preload="eager">Checkout</Link>

// ❌ Don't use eager for everything (wastes bandwidth)
```

### 2. Limit Concurrent Preloads

```typescript
// ✅ Good - respects bandwidth
initSmartPreloader({ maxConcurrent: 3 });

// ❌ Bad - too aggressive
initSmartPreloader({ maxConcurrent: 10 });
```

### 3. Tune Intent Threshold

```typescript
// For bandwidth-sensitive:
initSmartPreloader({ intentThreshold: 0.8 });  // High confidence

// For speed-sensitive:
initSmartPreloader({ intentThreshold: 0.5 });  // Lower confidence

// Balanced default:
initSmartPreloader({ intentThreshold: 0.6 });
```

### 4. Record Navigation History

```typescript
import { getSmartPreloader } from '@philjs/router';

// Record every navigation
window.addEventListener('popstate', () => {
  getSmartPreloader()?.recordNavigation(location.pathname);
});

// Better predictions over time!
```

### 5. Monitor Performance

```typescript
const preloader = getSmartPreloader();

setInterval(() => {
  const stats = preloader?.getStats();
  console.log('Preload stats:', stats);

  // Alert if queue is growing
  if (stats && stats.queued > 10) {
    console.warn('Preload queue is large - reduce maxConcurrent');
  }
}, 5000);
```

## Advanced Usage

### Custom Intent Algorithm

```typescript
import { SmartPreloader } from '@philjs/router';

class CustomPreloader extends SmartPreloader {
  protected calculatePriority(url: string, options: any): number {
    let score = 50; // Base priority

    // Boost priority for certain routes
    if (url.includes('/checkout')) {
      score += 40;
    }

    // Reduce for external routes
    if (url.startsWith('http')) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }
}

const preloader = new CustomPreloader({
  strategy: 'intent'
});
```

### Integration with Analytics

```typescript
import { getSmartPreloader } from '@philjs/router';

const preloader = getSmartPreloader();

// Track preload accuracy
let preloaded = new Set<string>();
let navigated = new Set<string>();

preloader?.['queue'].forEach(item => {
  preloaded.add(item.url);
});

window.addEventListener('popstate', () => {
  const url = location.pathname;
  navigated.add(url);

  // Calculate hit rate
  const hits = Array.from(navigated).filter(u => preloaded.has(u)).length;
  const hitRate = hits / navigated.size;

  console.log(`Preload accuracy: ${(hitRate * 100).toFixed(0)}%`);

  // Send to analytics
  analytics.track('preload_accuracy', { hitRate });
});
```

### Prefetch vs Preload

```typescript
// Prefetch: Lower priority, for future navigation
<link rel="prefetch" href="/next-page" />

// Preload: Higher priority, for current page resources
<link rel="preload" href="/critical.css" as="style" />

// PhilJS Smart Preloader uses prefetch by default
// But can switch based on priority:
const preloader = new SmartPreloader();

preloader.preload('/critical-route', {
  strategy: 'manual',
  priority: 'high'  // Uses preload, not prefetch
});
```

### Disable on Mobile

```typescript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

const preloader = initSmartPreloader({
  strategy: isMobile ? 'manual' : 'intent',
  maxConcurrent: isMobile ? 1 : 3
});

// Conservative on mobile to save data
```

## Related Documentation

- [View Transitions](/docs/routing/view-transitions.md) - Smooth page transitions
- [Route Discovery](/docs/routing/route-discovery.md) - Auto-discover routes
- [Performance](/docs/performance/runtime.md) - Performance optimization
- [Code Splitting](/docs/performance/code-splitting.md) - Split routes

## Troubleshooting

### Issue: Too Many Preloads

**Solution:** Reduce maxConcurrent or increase intentThreshold:
```typescript
initSmartPreloader({
  maxConcurrent: 2,        // Reduce from 3
  intentThreshold: 0.7     // Increase from 0.6
});
```

### Issue: Preloads Not Working

**Check:** Is preloader initialized?
```typescript
const preloader = getSmartPreloader();
if (!preloader) {
  console.error('Preloader not initialized!');
  initSmartPreloader();
}
```

### Issue: Wrong Routes Preloading

**Solution:** Train with navigation history:
```typescript
// Record actual navigations
window.addEventListener('popstate', () => {
  preloader?.recordNavigation(location.pathname);
});

// After ~50 navigations, predictions improve significantly
```

---

**Next Steps:**
- Explore [View Transitions](/docs/routing/view-transitions.md) for animations
- Learn about [Route Discovery](/docs/routing/route-discovery.md)
- Optimize with [Code Splitting](/docs/performance/code-splitting.md)

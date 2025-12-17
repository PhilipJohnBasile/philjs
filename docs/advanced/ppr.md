# Partial Pre-rendering (PPR)

Partial Pre-rendering (PPR) is a hybrid rendering strategy that combines the best of static site generation and server-side rendering. PPR allows you to pre-render the static shell of your page at build time while streaming dynamic content on request.

## Overview

PPR enables you to:

- **Pre-render static shells** at build time for instant page loads
- **Stream dynamic content** on demand for personalized experiences
- **Cache shells efficiently** with configurable TTL
- **Progressive loading** with automatic suspense boundaries
- **Zero configuration** for most use cases

## Quick Start

```typescript
import { PPRBoundary } from 'philjs-core';

function ProductPage({ productId }) {
  return (
    <PPRBoundary
      static={<ProductShell productId={productId} />}
      dynamic={<ProductDetails productId={productId} />}
      fallback={<ProductSkeleton />}
    />
  );
}
```

## Core Concepts

### Static Shell

The static shell is pre-rendered at build time and served immediately to users. It contains the structural layout and non-personalized content.

```typescript
import { staticShell } from 'philjs-core';

const shell = staticShell(
  <div className="container">
    <Header />
    <Navigation />
    <MainLayout />
  </div>
);
```

### Dynamic Content

Dynamic content is rendered on-demand and streamed to the client. This is perfect for personalized data, user-specific information, or frequently changing content.

```typescript
import { dynamicContent } from 'philjs-core';

const dynamic = dynamicContent(
  <div>
    <UserProfile userId={userId} />
    <RecentActivity />
  </div>
);
```

## Configuration

### Global Configuration

Configure PPR globally for your entire application:

```typescript
import { configurePPR } from 'philjs-core';

configurePPR({
  enabled: true,
  shellCacheTTL: 3600, // 1 hour
  dynamicTimeout: 10000, // 10 seconds
  streaming: true,
  preloadHints: true,
  defaultFallback: () => <LoadingSpinner />,
});
```

### Per-Boundary Configuration

Override global settings for specific boundaries:

```typescript
<PPRBoundary
  static={<StaticContent />}
  dynamic={<DynamicContent />}
  fallback={<Skeleton />}
  cacheKey="product-123"
  ttl={7200} // 2 hours
  priority={10} // Higher priority
  errorFallback={(error) => <ErrorDisplay error={error} />}
/>
```

## Advanced Usage

### Manual Shell Caching

```typescript
import { cacheShell, getShellFromCache, invalidateShell } from 'philjs-core';

// Cache a shell manually
cacheShell('product-123', '<div>...</div>', 3600);

// Retrieve from cache
const cached = getShellFromCache('product-123');

// Invalidate cache
invalidateShell('product-123');
```

### Streaming with PPR

Create custom streaming responses:

```typescript
import { createPPRStream } from 'philjs-core';

async function* generateDynamicContent() {
  yield '<div class="user-data">';
  const user = await fetchUser();
  yield `<span>${user.name}</span>`;
  yield '</div>';
}

const stream = createPPRStream({
  staticShell: '<html><body><div id="app">',
  dynamicChunks: generateDynamicContent(),
  onChunk: (chunk) => console.log('Streamed:', chunk),
});
```

### Preloading Dynamic Content

Improve performance by preloading dynamic content:

```typescript
import { preloadDynamic, generatePreloadHints } from 'philjs-core';

// Preload on user interaction
<Link
  href="/product/123"
  onMouseEnter={() =>
    preloadDynamic('product-123', () => fetchProductData(123))
  }
>
  View Product
</Link>

// Generate preload hints for the HTML head
const hints = generatePreloadHints([
  '/api/products/123',
  '/api/user/profile',
]);
```

### Wrapper Component Pattern

Create PPR-enabled components automatically:

```typescript
import { withPPR } from 'philjs-core';

const ProductPage = withPPR(
  ({ productId, user }) => (
    <div>
      <h1>Product {productId}</h1>
      {user && <p>Welcome, {user.name}</p>}
    </div>
  ),
  {
    staticProps: ['productId'],
    dynamicProps: ['user'],
    fallback: () => <LoadingSkeleton />,
  }
);

// Usage
<ProductPage productId="123" user={currentUser} />
```

## Server-Side Integration

### Rendering with PPR

Use PPR in your server-side rendering:

```typescript
import { renderWithPPR } from 'philjs-core';

export async function handler(req, res) {
  const { shell, dynamic } = await renderWithPPR(
    <App />,
    {
      staticProps: { layout: 'default' },
      dynamicProps: { user: await getUser(req) },
      streaming: true,
    }
  );

  // Send shell immediately
  res.write(shell);

  // Stream dynamic content
  for await (const chunk of dynamic) {
    res.write(chunk);
  }

  res.end();
}
```

### Boundary Markers

PPR uses HTML comments to mark boundaries:

```typescript
import { flushBoundary, hydrateBoundary } from 'philjs-core';

// Flush marker (server)
const marker = flushBoundary('user-profile');
// Output: <!--ppr-boundary:user-profile-->

// Hydration script (client)
const script = hydrateBoundary('user-profile', '<div>User content</div>');
// Output: <script>window.__PPR_HYDRATE__('user-profile', ...)</script>
```

## Performance Metrics

Track PPR performance:

```typescript
import { getPPRMetrics, updatePPRMetrics } from 'philjs-core';

const metrics = getPPRMetrics();
console.log('TTFB:', metrics.ttfb);
console.log('TTFCP:', metrics.ttfcp);
console.log('TTI:', metrics.tti);
console.log('Dynamic Load Time:', metrics.dynamicLoadTime);
console.log('Cache Hit Rate:', metrics.cacheHitRate);

// Update metrics manually
updatePPRMetrics({
  ttfb: performance.now(),
  ttfcp: 1200,
});
```

## Utility Functions

### Content Type Checking

```typescript
import { isStaticContent, isDynamicContent } from 'philjs-core';

const content = staticShell(<Header />);

if (isStaticContent(content)) {
  console.log('This is static content');
}

if (isDynamicContent(content)) {
  console.log('This is dynamic content');
}
```

### Cache Management

```typescript
import { clearShellCache } from 'philjs-core';

// Clear all cached shells
clearShellCache();
```

## Best Practices

### 1. Identify Static vs Dynamic Content

**Static** (pre-render):
- Page layout and structure
- Navigation menus
- Footer content
- Product information (if infrequently updated)
- Marketing content

**Dynamic** (stream):
- User authentication state
- Personalized recommendations
- Real-time data
- User-specific content
- Frequently changing data

### 2. Cache Key Strategy

Use deterministic cache keys:

```typescript
// Good
<PPRBoundary cacheKey={`product-${productId}-${locale}`} />

// Bad - includes user-specific data
<PPRBoundary cacheKey={`product-${productId}-${userId}`} />
```

### 3. Fallback Design

Design meaningful loading states:

```typescript
function ProductSkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-description" />
      <div className="skeleton-price" />
    </div>
  );
}

<PPRBoundary
  static={<ProductShell />}
  dynamic={<ProductDetails />}
  fallback={<ProductSkeleton />}
/>
```

### 4. Priority Levels

Set priorities based on importance:

```typescript
// High priority - above the fold
<PPRBoundary priority={10} dynamic={<Hero />} />

// Medium priority - secondary content
<PPRBoundary priority={5} dynamic={<Recommendations />} />

// Low priority - below the fold
<PPRBoundary priority={1} dynamic={<Footer />} />
```

### 5. Error Handling

Always provide error fallbacks:

```typescript
<PPRBoundary
  dynamic={<UserData />}
  errorFallback={(error) => (
    <div className="error">
      <h3>Failed to load user data</h3>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  )}
/>
```

## Comparison with Other Strategies

### PPR vs SSR

| Feature | PPR | SSR |
|---------|-----|-----|
| **Initial Load** | Instant (cached shell) | Slower (full render) |
| **Dynamic Content** | Streamed | Included in initial response |
| **Caching** | Shell cached separately | Full page cached |
| **Personalization** | Excellent | Requires edge caching |
| **Build Time** | Pre-renders shells only | No pre-rendering |

### PPR vs SSG

| Feature | PPR | SSG |
|---------|-----|-----|
| **Static Content** | Pre-rendered | Pre-rendered |
| **Dynamic Content** | Streamed | Requires client-side JS |
| **Data Freshness** | Real-time for dynamic | Build-time only |
| **Personalization** | Built-in | Requires client-side |
| **Build Time** | Faster (partial) | Slower (full) |

### PPR vs ISR

| Feature | PPR | ISR |
|---------|-----|-----|
| **Revalidation** | Per-component TTL | Page-level TTL |
| **Granularity** | Component-level | Page-level |
| **Performance** | Better TTFB | Good TTFB |
| **Flexibility** | High | Medium |

## Examples

### E-commerce Product Page

```typescript
function ProductPage({ productId }) {
  return (
    <PPRBoundary
      static={
        <div>
          <Header />
          <Breadcrumbs />
          <ProductImages productId={productId} />
          <ProductInfo productId={productId} />
        </div>
      }
      dynamic={
        <div>
          <PersonalizedRecommendations />
          <UserReviews />
          <RelatedProducts />
        </div>
      }
      fallback={<ContentSkeleton />}
      cacheKey={`product-${productId}`}
      ttl={3600}
    />
  );
}
```

### User Dashboard

```typescript
function Dashboard() {
  return (
    <div>
      <PPRBoundary
        static={<DashboardLayout />}
        dynamic={<UserStats />}
        fallback={<StatsSkeleton />}
        priority={10}
      />

      <PPRBoundary
        static={<WidgetGrid />}
        dynamic={<PersonalizedWidgets />}
        fallback={<WidgetsSkeleton />}
        priority={5}
      />

      <PPRBoundary
        static={<SidebarLayout />}
        dynamic={<ActivityFeed />}
        fallback={<FeedSkeleton />}
        priority={1}
      />
    </div>
  );
}
```

### Blog Post

```typescript
function BlogPost({ slug }) {
  return (
    <article>
      <PPRBoundary
        static={
          <div>
            <PostHeader />
            <PostContent slug={slug} />
            <PostMeta slug={slug} />
          </div>
        }
        dynamic={
          <div>
            <CommentSection slug={slug} />
            <RelatedPosts slug={slug} />
          </div>
        }
        fallback={<CommentsSkeleton />}
        cacheKey={`post-${slug}`}
        ttl={7200}
      />
    </article>
  );
}
```

## Troubleshooting

### Shell Not Caching

**Problem**: Shells are not being cached

**Solutions**:
1. Ensure `cacheKey` is set
2. Check `shellCacheTTL` configuration
3. Verify cache isn't being cleared prematurely

```typescript
import { getPPRConfig } from 'philjs-core';

const config = getPPRConfig();
console.log('Shell Cache TTL:', config.shellCacheTTL);
```

### Dynamic Content Not Streaming

**Problem**: Dynamic content loads all at once

**Solutions**:
1. Enable streaming in configuration
2. Check browser support for streaming
3. Verify server supports streaming responses

```typescript
configurePPR({
  streaming: true,
});
```

### High Cache Miss Rate

**Problem**: Low cache hit rate

**Solutions**:
1. Use consistent cache keys
2. Increase TTL values
3. Reduce cache key uniqueness

```typescript
const metrics = getPPRMetrics();
if (metrics.cacheHitRate < 0.5) {
  console.warn('Low cache hit rate:', metrics.cacheHitRate);
}
```

## API Reference

For complete API documentation, see [Core API Reference: PPR](/docs/api-reference/core.md#partial-pre-rendering-ppr)

### Key Functions

- `PPRBoundary` - Component for PPR boundaries
- `staticShell()` - Mark content as static
- `dynamicContent()` - Mark content as dynamic
- `configurePPR()` - Configure PPR settings
- `getPPRConfig()` - Get current configuration
- `cacheShell()` - Cache a static shell
- `getShellFromCache()` - Retrieve cached shell
- `invalidateShell()` - Invalidate shell cache
- `clearShellCache()` - Clear all cached shells
- `createPPRStream()` - Create streaming response
- `renderWithPPR()` - Render with PPR support
- `withPPR()` - Wrap component with PPR
- `getPPRMetrics()` - Get performance metrics

## Related Topics

- [Server-Side Rendering](/docs/advanced/ssr.md)
- [Static Site Generation](/docs/advanced/ssg.md)
- [Incremental Static Regeneration](/docs/advanced/isr.md)
- [Performance Optimization](/docs/best-practices/performance.md)
- [Caching Strategies](/docs/data-fetching/caching.md)

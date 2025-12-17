# Partial Pre-Rendering (PPR)

Partial Pre-Rendering (PPR) is a hybrid rendering strategy that combines the best of static and dynamic rendering. Static shells are pre-rendered and cached, while dynamic content streams in on-demand.

## What is PPR?

PPR allows you to:
- Pre-render static parts of your page at build time
- Cache static shells with configurable TTL
- Stream dynamic content on request
- Achieve instant page loads with personalized content

This is similar to React 19.2's PPR and Qwik's resumability, but with more control over caching strategies.

## Basic Usage

```tsx
import { PPRBoundary } from 'philjs-core/ppr';

function ProductPage({ productId }) {
  return (
    <PPRBoundary
      static={<ProductShell />}
      dynamic={<ProductDetails productId={productId} />}
      fallback={<ProductSkeleton />}
      cacheKey={`product-${productId}`}
      ttl={3600}
    />
  );
}

function ProductShell() {
  return (
    <div className="product-shell">
      <header>My Store</header>
      <nav>...</nav>
    </div>
  );
}

function ProductDetails({ productId }) {
  const product = useProduct(productId);
  return (
    <div className="product-details">
      <h1>{product().name}</h1>
      <p>${product().price}</p>
      <button>Add to Cart</button>
    </div>
  );
}
```

## How PPR Works

### 1. Build Time
During the build, PhilJS:
- Identifies `PPRBoundary` components
- Pre-renders the static shell
- Generates cache entries with TTL

### 2. Request Time
On each request, PhilJS:
- Serves cached static shell immediately
- Streams dynamic content as it's ready
- Uses fallback while dynamic content loads

### 3. Runtime
In the browser:
- Static shell displays instantly
- Dynamic content hydrates progressively
- Interactions work immediately

## PPRBoundary Props

```typescript
interface PPRBoundaryProps {
  // Static content (pre-rendered and cached)
  static?: JSX.Element;

  // Dynamic content (rendered on request)
  dynamic?: JSX.Element;

  // Fallback while dynamic content loads
  fallback?: JSX.Element;

  // Cache key for the static shell
  cacheKey?: string;

  // Time-to-live in seconds (default: 3600)
  ttl?: number;

  // Stale-while-revalidate in seconds
  swr?: number;

  // Stream dynamic content
  streaming?: boolean;
}
```

## Marking Content

Use `staticShell()` and `dynamicContent()` to mark content explicitly:

```tsx
import { staticShell, dynamicContent } from 'philjs-core/ppr';

function Page() {
  return (
    <div>
      {staticShell(
        <header>
          <Logo />
          <Navigation />
        </header>
      )}

      {dynamicContent(
        <main>
          <UserProfile />
          <PersonalizedFeed />
        </main>
      )}
    </div>
  );
}
```

## Caching Strategies

### Basic TTL Caching

```tsx
<PPRBoundary
  static={<Shell />}
  dynamic={<Content />}
  cacheKey="homepage"
  ttl={3600}  // Cache for 1 hour
/>
```

### Stale-While-Revalidate

```tsx
<PPRBoundary
  static={<Shell />}
  dynamic={<Content />}
  cacheKey="homepage"
  ttl={3600}
  swr={600}  // Serve stale for 10 minutes while revalidating
/>
```

### Manual Cache Management

```tsx
import { cacheShell, invalidateShell, getShellCache } from 'philjs-core/ppr';

// Manually cache a shell
await cacheShell('product-123', '<div>...</div>', {
  ttl: 3600,
  tags: ['products', 'user-123']
});

// Invalidate by key
await invalidateShell('product-123');

// Get cached shell
const cached = await getShellCache('product-123');
if (cached) {
  console.log('Cache hit!', cached.content);
}
```

## Streaming SSR

PPR supports streaming for progressive page loads:

```tsx
import { createPPRStream } from 'philjs-core/ppr';

// Server-side
async function renderPage(req, res) {
  const stream = createPPRStream({
    staticShell: '<html><body><div id="shell">...</div>',
    dynamicChunks: async function* () {
      yield '<div id="user">';
      const user = await fetchUser();
      yield renderUser(user);
      yield '</div>';
    }
  });

  res.setHeader('Content-Type', 'text/html');
  stream.pipeTo(res);
}
```

## HOC Pattern

Wrap components with PPR capabilities:

```tsx
import { withPPR } from 'philjs-core/ppr';

const ProductPage = withPPR(
  ({ productId }) => <ProductDetails productId={productId} />,
  {
    shell: () => <ProductShell />,
    cacheKey: (props) => `product-${props.productId}`,
    ttl: 3600
  }
);
```

## Server-Side Rendering

Full control over SSR with PPR:

```tsx
import { renderWithPPR } from 'philjs-core/ppr';

// Server-side
async function handler(req, res) {
  const html = await renderWithPPR(
    <App />,
    {
      cacheKey: req.url,
      ttl: 3600,
      streaming: true
    }
  );

  res.send(html);
}
```

## Use Cases

### E-commerce Product Pages

```tsx
function ProductPage({ id }) {
  return (
    <PPRBoundary
      static={
        <div>
          <Header />
          <Navigation />
          <Footer />
        </div>
      }
      dynamic={
        <div>
          <ProductInfo id={id} />
          <Recommendations userId={getCurrentUser()} />
          <ReviewsList productId={id} />
        </div>
      }
      cacheKey={`product-${id}`}
      ttl={3600}
    />
  );
}
```

### Dashboard with Real-Time Data

```tsx
function Dashboard() {
  return (
    <PPRBoundary
      static={<DashboardShell />}
      dynamic={<LiveMetrics />}
      fallback={<MetricsSkeleton />}
      cacheKey="dashboard"
      ttl={300}  // Short TTL for fresh data
      swr={60}
    />
  );
}
```

### Blog with Personalized Sidebar

```tsx
function BlogPost({ slug }) {
  return (
    <div>
      {staticShell(
        <article>
          <BlogContent slug={slug} />
        </article>
      )}
      {dynamicContent(
        <aside>
          <PersonalizedRecommendations />
          <UserBookmarks />
        </aside>
      )}
    </div>
  );
}
```

## Performance Benefits

### Metrics

PPR can significantly improve Core Web Vitals:

- **TTFB**: Reduced by 60-80% (cached shells)
- **FCP**: Improved by 40-60% (instant shell display)
- **LCP**: Improved by 30-50% (progressive content loading)
- **TTI**: Improved by 20-40% (optimized hydration)

### Cache Hit Rates

Typical cache hit rates:
- Product pages: 80-90%
- Category pages: 70-85%
- Homepage: 90-95%
- User dashboards: 50-70% (more personalized)

## Best Practices

### 1. Identify Static vs Dynamic

Static content (cache it):
- Headers, footers, navigation
- Product images and descriptions
- Blog post content
- Static layouts

Dynamic content (render on request):
- User-specific data
- Real-time information
- Personalized recommendations
- Shopping cart contents

### 2. Choose Appropriate TTL

```tsx
// Long TTL for stable content
<PPRBoundary cacheKey="about-page" ttl={86400}>  // 24 hours

// Medium TTL for product pages
<PPRBoundary cacheKey="product-123" ttl={3600}>  // 1 hour

// Short TTL for dashboards
<PPRBoundary cacheKey="dashboard" ttl={300}>  // 5 minutes

// SWR for better UX
<PPRBoundary cacheKey="feed" ttl={600} swr={300}>  // Fresh but not stale
```

### 3. Use Meaningful Cache Keys

```tsx
// Good - specific and unique
cacheKey={`product-${id}-${locale}`}
cacheKey={`user-${userId}-dashboard-${date}`}

// Bad - too generic
cacheKey="page"
cacheKey="content"
```

### 4. Combine with Code Splitting

```tsx
import { lazy } from 'philjs-core';
import { PPRBoundary } from 'philjs-core/ppr';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<PPRBoundary
  static={<Shell />}
  dynamic={<HeavyComponent />}
  fallback={<Spinner />}
  cacheKey="page"
  ttl={3600}
/>
```

## Comparison with Other Frameworks

| Feature | PhilJS PPR | React 19.2 PPR | Qwik | Astro |
|---------|------------|----------------|------|-------|
| Static Shell Caching | ✅ | ❌ | ✅ | ✅ |
| TTL Control | ✅ | ❌ | ❌ | ✅ |
| SWR Pattern | ✅ | ❌ | ❌ | ❌ |
| Streaming | ✅ | ✅ | ✅ | ❌ |
| Manual Cache Control | ✅ | ❌ | ❌ | ✅ |
| Fine-grained Boundaries | ✅ | ✅ | ✅ | ❌ |

## Advanced: Edge Deployment

PPR works great with edge runtimes:

```tsx
// Cloudflare Workers / Vercel Edge
export default async function handler(request: Request) {
  const url = new URL(request.url);
  const cacheKey = `page-${url.pathname}`;

  // Try cache first
  const cache = await caches.open('philjs-ppr');
  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  // Render with PPR
  const html = await renderWithPPR(<App />, {
    cacheKey,
    ttl: 3600
  });

  const response = new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    }
  });

  await cache.put(cacheKey, response.clone());

  return response;
}
```

## Debugging

Enable verbose logging:

```tsx
import { PPRBoundary } from 'philjs-core/ppr';

<PPRBoundary
  static={<Shell />}
  dynamic={<Content />}
  cacheKey="debug"
  ttl={3600}
  onCacheHit={() => console.log('Cache hit!')}
  onCacheMiss={() => console.log('Cache miss, rendering...')}
  onError={(err) => console.error('PPR error:', err)}
/>
```

## Related

- [Server Islands](/advanced/islands) - Per-component caching
- [Activity Component](/learn/activity) - Priority-based rendering
- [Performance](/performance/overview) - Optimization strategies
- [SSR](/advanced/ssr) - Server-side rendering guide

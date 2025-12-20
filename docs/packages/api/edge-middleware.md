# PhilJS Edge Middleware

Next.js-style edge middleware for PhilJS applications. Run at the edge for optimal performance with Cloudflare Workers, Vercel Edge, Deno Deploy, and other edge runtimes.

## Features

- **Edge Middleware System**: Request/response rewriting at edge with middleware chaining
- **Geolocation Routing**: Country/region/city detection with geo-based redirects
- **A/B Testing at Edge**: Cookie-based variant assignment with zero layout shift
- **Edge Caching**: Cache API integration with stale-while-revalidate

## Installation

```bash
npm install philjs-api
```

## Basic Usage

### Edge Middleware

```typescript
import { executeEdgeMiddleware, type EdgeMiddleware } from 'philjs-api/edge-middleware';

// Simple middleware
const loggingMiddleware: EdgeMiddleware = async (context) => {
  console.log(`${context.request.method} ${context.request.url.pathname}`);
  return context.next();
};

// Execute middleware
export default {
  async fetch(request: Request) {
    return executeEdgeMiddleware(request, loggingMiddleware);
  },
};
```

### URL Rewrites

```typescript
import { rewriteMiddleware } from 'philjs-api/edge-middleware';

const rewrites = rewriteMiddleware({
  // Rewrite old paths to new paths
  '/old-api/*': '/api/v2/$1',
  '/blog/:slug': '/posts/$1',
});
```

### Redirects

```typescript
import { redirectMiddleware } from 'philjs-api/edge-middleware';

const redirects = redirectMiddleware({
  '/old-page': '/new-page',
  '/legacy/*': { destination: '/modern/$1', permanent: true },
});
```

### Header Manipulation

```typescript
import { addHeadersMiddleware, securityHeadersMiddleware } from 'philjs-api/edge-middleware';

// Add custom headers
const customHeaders = addHeadersMiddleware({
  'X-Custom-Header': 'value',
  'X-API-Version': '2.0',
});

// Security headers
const security = securityHeadersMiddleware({
  csp: "default-src 'self'",
  hsts: true,
  nosniff: true,
  frameOptions: 'DENY',
});
```

## Geolocation

### Auto-detect Location

```typescript
import { detectGeolocation } from 'philjs-api/geolocation';

// Works with Cloudflare Workers, Vercel Edge, etc.
const geo = await detectGeolocation(request);
console.log(geo.country, geo.city); // "US", "San Francisco"
```

### Geo-based Redirects

```typescript
import { redirectByCountry } from 'philjs-api/geolocation';

const geoRedirect = redirectByCountry({
  'GB,IE': '/uk',
  'FR,BE,LU': '/fr',
  'DE,AT,CH': '/de',
});
```

### Language Detection

```typescript
import { languageDetectionMiddleware } from 'philjs-api/geolocation';

const langDetection = languageDetectionMiddleware({
  cookieName: 'preferred-language',
  headerName: 'X-Detected-Language',
});
```

### Localized Redirects

```typescript
import { localizedRedirectMiddleware } from 'philjs-api/geolocation';

const localized = localizedRedirectMiddleware({
  supportedLocales: ['en', 'fr', 'de', 'es'],
  defaultLocale: 'en',
});

// Automatically redirects /products to /fr/products for French users
```

### Client-side Hook

```typescript
import { useGeolocation } from 'philjs-api/geolocation';

function MyComponent() {
  const { geo, language } = useGeolocation();

  return (
    <div>
      <p>Country: {geo?.country}</p>
      <p>Language: {language}</p>
    </div>
  );
}
```

## A/B Testing

### Define Experiments

```typescript
import { abTestingMiddleware } from 'philjs-api/edge-ab-testing';

const abTesting = abTestingMiddleware({
  experiments: [
    {
      id: 'checkout-flow',
      name: 'Checkout Flow Test',
      variants: [
        { id: 'control', name: 'Control', weight: 50 },
        { id: 'new-design', name: 'New Design', weight: 50 },
      ],
      targeting: {
        countries: ['US', 'CA'],
        urlPatterns: ['/checkout/*'],
      },
    },
  ],
  onAssignment: async (assignment, context) => {
    // Track to analytics
    console.log('Assigned variant:', assignment.variantName);
  },
});
```

### Variant-based Rendering

```typescript
import { variantMiddleware } from 'philjs-api/edge-ab-testing';

const variantRouting = variantMiddleware('checkout-flow', {
  control: async (context) => {
    context.rewrite('/checkout/control');
    return context.next();
  },
  'new-design': async (context) => {
    context.rewrite('/checkout/new-design');
    return context.next();
  },
});
```

### Multivariate Testing

```typescript
import { multivariateTestingMiddleware } from 'philjs-api/edge-ab-testing';

const mvt = multivariateTestingMiddleware({
  id: 'homepage',
  name: 'Homepage MVT',
  factors: [
    {
      id: 'headline',
      name: 'Headline',
      variants: [
        { id: 'h1', name: 'Headline 1', weight: 50 },
        { id: 'h2', name: 'Headline 2', weight: 50 },
      ],
    },
    {
      id: 'cta',
      name: 'Call to Action',
      variants: [
        { id: 'c1', name: 'Learn More', weight: 50 },
        { id: 'c2', name: 'Get Started', weight: 50 },
      ],
    },
  ],
});
```

### Client-side Hook

```typescript
import { useVariant } from 'philjs-api/edge-ab-testing';

function CheckoutPage() {
  const { variant } = useVariant('checkout-flow');

  return (
    <div>
      {variant === 'Control' ? <ControlCheckout /> : <NewCheckout />}
    </div>
  );
}
```

### Statistical Significance

```typescript
import { calculateSignificance } from 'philjs-api/edge-ab-testing';

const result = calculateSignificance(
  {
    variantId: 'control',
    impressions: 1000,
    conversions: 100,
    conversionRate: 0.1,
  },
  {
    variantId: 'variant',
    impressions: 1000,
    conversions: 150,
    conversionRate: 0.15,
  }
);

console.log(`Significant: ${result.isSignificant}`);
console.log(`Confidence: ${result.confidence}%`);
console.log(`P-value: ${result.pValue}`);
```

## Edge Caching

### Basic Caching

```typescript
import { edgeCacheMiddleware } from 'philjs-api/edge-cache';

const cache = edgeCacheMiddleware({
  ttl: 300, // 5 minutes
  swr: 3600, // 1 hour stale-while-revalidate
  tags: ['api-v2'],
});
```

### Cache Control Headers

```typescript
import { cacheControlMiddleware } from 'philjs-api/edge-cache';

const cacheControl = cacheControlMiddleware({
  maxAge: 3600,
  staleWhileRevalidate: 86400,
  visibility: 'public',
  immutable: true,
});
```

### ETags for Conditional Requests

```typescript
import { etagMiddleware } from 'philjs-api/edge-cache';

const etag = etagMiddleware();
// Automatically returns 304 for matching If-None-Match
```

### Cache Presets

```typescript
import { staticAssetCache, apiCache, pageCache } from 'philjs-api/edge-cache';

// Static assets (1 year)
const staticCache = staticAssetCache();

// API responses (60s with 5min SWR)
const apiCaching = apiCache(60, 300);

// Pages (5min with 1hr SWR)
const pageCaching = pageCache(300, 3600);
```

### Cache Purging

```typescript
import { purgeCacheTags, purgeCacheKey } from 'philjs-api/edge-cache';

// Purge by tags
await purgeCacheTags(['api-v2', 'users']);

// Purge specific key
await purgeCacheKey('/api/users/123');
```

### Vary Headers

```typescript
import { varyMiddleware } from 'philjs-api/edge-cache';

const vary = varyMiddleware(['Accept-Language', 'Cookie']);
// Cache varies by language and authentication
```

## Complete Example

### Cloudflare Worker

```typescript
import {
  executeEdgeMiddleware,
  composeEdgeMiddleware,
  securityHeadersMiddleware,
} from 'philjs-api/edge-middleware';
import { redirectByCountry, languageDetectionMiddleware } from 'philjs-api/geolocation';
import { abTestingMiddleware } from 'philjs-api/edge-ab-testing';
import { edgeCacheMiddleware, cacheControlMiddleware } from 'philjs-api/edge-cache';

const middleware = composeEdgeMiddleware(
  // Security
  securityHeadersMiddleware({
    csp: "default-src 'self'",
    hsts: true,
  }),

  // Geolocation
  redirectByCountry({
    'GB,IE': '/uk',
    'FR': '/fr',
  }),
  languageDetectionMiddleware(),

  // A/B Testing
  abTestingMiddleware({
    experiments: [
      {
        id: 'pricing',
        name: 'Pricing Page Test',
        variants: [
          { id: 'control', name: 'Control', weight: 50 },
          { id: 'new', name: 'New Pricing', weight: 50 },
        ],
      },
    ],
  }),

  // Caching
  edgeCacheMiddleware({
    ttl: 300,
    swr: 3600,
  }),
  cacheControlMiddleware({
    maxAge: 300,
    staleWhileRevalidate: 3600,
  })
);

export default {
  async fetch(request: Request, env: any, ctx: any) {
    return executeEdgeMiddleware(request, middleware, {
      platform: { env, ctx },
    });
  },
};
```

### Vercel Edge Function

```typescript
import { executeEdgeMiddleware } from 'philjs-api/edge-middleware';
import { geoRedirectMiddleware } from 'philjs-api/geolocation';
import { abTestingMiddleware } from 'philjs-api/edge-ab-testing';

export const config = {
  runtime: 'edge',
};

const middleware = [
  geoRedirectMiddleware([
    {
      countries: ['CN'],
      destination: '/cn',
    },
  ]),
  abTestingMiddleware({
    experiments: [
      {
        id: 'hero',
        name: 'Hero Section',
        variants: [
          { id: 'a', name: 'Variant A', weight: 50 },
          { id: 'b', name: 'Variant B', weight: 50 },
        ],
      },
    ],
  }),
];

export default async function handler(request: Request) {
  return executeEdgeMiddleware(request, middleware);
}
```

## Advanced Features

### Custom Cache Store

```typescript
import { edgeCacheMiddleware, type CacheStore } from 'philjs-api/edge-cache';

class RedisCacheStore implements CacheStore {
  async get(key: string) {
    // Fetch from Redis
  }

  async put(key: string, response: Response, options?) {
    // Store in Redis
  }

  async delete(key: string) {
    // Delete from Redis
  }

  async purge(tags: string[]) {
    // Purge by tags
  }
}

const cache = edgeCacheMiddleware({
  store: new RedisCacheStore(),
  ttl: 300,
});
```

### Custom Analytics Provider

```typescript
import { createAnalyticsProvider, abTestingMiddleware } from 'philjs-api/edge-ab-testing';

const analytics = createAnalyticsProvider({
  endpoint: 'https://analytics.example.com/track',
  headers: {
    'Authorization': 'Bearer token',
  },
});

const abTesting = abTestingMiddleware({
  experiments: [/* ... */],
  onAssignment: async (assignment, context) => {
    await analytics.trackExperiment(assignment, context);
  },
});
```

### Deterministic Variant Selection

```typescript
import { selectVariantDeterministic } from 'philjs-api/edge-ab-testing';

// Same user always gets same variant
const userId = getUserId(request);
const variant = selectVariantDeterministic(
  [
    { id: 'a', name: 'A', weight: 50 },
    { id: 'b', name: 'B', weight: 50 },
  ],
  userId
);
```

## Runtime Compatibility

All edge middleware is compatible with:

- **Cloudflare Workers**: Full support including `cf` object
- **Vercel Edge**: Full support including geo headers
- **Deno Deploy**: Full support
- **Fastly Compute@Edge**: Full support
- **Node.js**: Works as standard middleware

## Performance

- **Zero overhead**: Edge middleware runs before your application
- **No layout shift**: A/B testing variants assigned before rendering
- **Optimal caching**: Stale-while-revalidate ensures fresh content
- **Geo-optimized**: Route users to closest region automatically

## Best Practices

1. **Chain middleware efficiently**: Order matters! Put security first, then geo/routing, then caching
2. **Use SWR liberally**: Stale-while-revalidate ensures users always get fast responses
3. **Tag your cache**: Use cache tags for efficient purging
4. **Monitor experiments**: Track significance before making decisions
5. **Test edge locally**: Use Miniflare or Wrangler for local development

## License

MIT

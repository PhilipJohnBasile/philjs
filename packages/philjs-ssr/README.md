# philjs-ssr

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Server-side rendering with streaming, loaders, actions, and resumability for PhilJS.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add philjs-ssr
```

## Usage

### Basic SSR Request Handler

The simplest way to render PhilJS apps on the server:

```typescript
import { handleRequest } from 'philjs-ssr';
import { createRouteMatcher } from 'philjs-router';

// Define your routes
const routes = [
  {
    path: '/',
    component: HomePage,
    loader: async () => {
      return { message: 'Hello from SSR!' };
    },
  },
  {
    path: '/products/:id',
    component: ProductPage,
    loader: async ({ params }) => {
      const res = await fetch(`/api/products/${params.id}`);
      return res.json();
    },
  },
];

// Create route matcher
const match = createRouteMatcher(routes);

// Handle incoming requests
export default async function handler(request: Request) {
  return handleRequest(request, { match });
}
```

### Streaming SSR with Suspense

Stream HTML to the client as it's rendered, with progressive enhancement:

```typescript
import { renderToStreamingResponse, Suspense } from 'philjs-ssr';

function App() {
  return (
    <div>
      <h1>My App</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncContent />
      </Suspense>
    </div>
  );
}

// In your server handler
export default async function handler(request: Request) {
  const stream = await renderToStreamingResponse(<App />, {
    onShellReady: () => console.log('Shell sent to client'),
    onComplete: () => console.log('Stream complete'),
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

### Data Loaders

Fetch data before rendering components:

```typescript
import type { Loader } from 'philjs-ssr';

// Type-safe loader
export const loader: Loader<{ user: User }> = async ({ request, params }) => {
  const userId = params.id;
  const user = await db.users.findById(userId);

  if (!user) {
    return { ok: false, error: 'User not found' };
  }

  return { ok: true, value: { user } };
};

// Use in component
function UserProfile({ data, error }: RouteComponentProps) {
  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Welcome, {data.user.name}!</div>;
}
```

### Form Actions

Handle form submissions server-side:

```typescript
import type { Action } from 'philjs-ssr';

export const action: Action = async ({ formData, request }) => {
  const title = formData.get('title');
  const content = formData.get('content');

  // Validate
  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  // Save to database
  const post = await db.posts.create({ title, content });

  // Redirect to new post
  return { redirect: `/posts/${post.id}` };
};

// Use in component
function CreatePost() {
  return (
    <form method="POST">
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

### Partial Prerendering (PPR)

PPR combines the best of static site generation (fast) and server-side rendering (fresh data). Inspired by Next.js 14's Partial Prerendering feature.

```typescript
import { dynamic, Suspense, renderToStaticShell, streamPPRResponse } from 'philjs-ssr';

// Mark dynamic boundaries - these are streamed at request time
function Page() {
  return (
    <div>
      {/* Static - prerendered at build time */}
      <Header />
      <Sidebar />

      {/* Dynamic - streamed at request time */}
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile /> {/* Fetches fresh user data */}
      </Suspense>

      {/* Explicitly dynamic content */}
      <dynamic fallback={<CommentsSkeleton />} priority={8}>
        <RealtimeComments />
      </dynamic>
    </div>
  );
}

// Route configuration for PPR
export const config = {
  ppr: true, // Enable PPR for this route
};
```

#### Building Static Shells

At build time, static content is prerendered and dynamic boundaries leave placeholder holes:

```typescript
import { buildPPR, pprVitePlugin } from 'philjs-ssr';

// Build-time: Generate static shells
await buildPPR({
  outDir: './dist/ppr',
  routes: [
    {
      path: '/',
      component: HomePage,
      config: { ppr: true },
    },
    {
      path: '/blog/[slug]',
      component: BlogPost,
      config: { ppr: true },
      getStaticPaths: async () => ['/blog/hello', '/blog/world'],
    },
  ],
  renderFn: async (path) => renderComponent(path),
});

// Or use the Vite plugin
export default defineConfig({
  plugins: [pprVitePlugin({ routes })],
});
```

#### Streaming Dynamic Content

At request time, the static shell is served instantly while dynamic content streams in:

```typescript
import { streamPPRResponse, loadStaticShell } from 'philjs-ssr';

export async function handleRequest(request: Request) {
  const url = new URL(request.url);

  // Load pre-built static shell
  const shell = await loadStaticShell('./dist/ppr', url.pathname);

  if (!shell) {
    return new Response('Not Found', { status: 404 });
  }

  // Stream response with PPR
  return streamPPRResponse(shell, <Page />, request, {
    onShellSent: () => console.log('Static shell sent'),
    onBoundaryResolved: (id) => console.log(`Dynamic boundary ${id} resolved`),
    onComplete: () => console.log('All content streamed'),
    timeout: 10000, // 10s timeout for dynamic content
  });
}
```

#### Dynamic Boundary Helpers

Various helpers for common dynamic content patterns:

```typescript
import {
  dynamic,
  dynamicPriority,
  dynamicDeferred,
  dynamicWithDependencies,
  dynamicForUser,
  serverOnly,
  makeDynamic,
} from 'philjs-ssr';

// High-priority dynamic content (rendered first)
<dynamicPriority fallback={<Skeleton />}>
  <CriticalUserData />
</dynamicPriority>

// Low-priority/deferred content (rendered last)
<dynamicDeferred fallback={<Skeleton />}>
  <Analytics />
</dynamicDeferred>

// Dynamic with cache dependencies
const UserCart = dynamicWithDependencies(['user:session', 'cart:items'], {
  children: <CartContents />,
  fallback: <CartSkeleton />,
});

// User-specific dynamic content
<dynamicForUser fallback={<Skeleton />}>
  <PersonalizedRecommendations />
</dynamicForUser>

// Server-only content (never hydrated)
<serverOnly fallback={<Skeleton />}>
  <SensitiveData />
</serverOnly>

// Wrap existing component as dynamic
const DynamicProfile = makeDynamic(UserProfile, { priority: 8 });
```

#### Edge Caching

PPR integrates with edge caching for optimal performance:

```typescript
import {
  LRUPPRCache,
  RedisPPRCache,
  EdgeCacheController,
  CacheTagManager,
  generateCacheHeaders,
} from 'philjs-ssr';

// LRU cache for development/single server
const cache = new LRUPPRCache({
  maxSize: 100,
  maxAge: 3600000, // 1 hour
});

// Redis cache for production/distributed
const redisCache = new RedisPPRCache(redisClient, {
  keyPrefix: 'ppr:',
  ttl: 3600,
});

// Edge cache controller with stale-while-revalidate
const edgeCache = new EdgeCacheController({
  strategy: 'stale-while-revalidate',
  cache,
  staleTTL: 60,
});

// Get with automatic revalidation
const { shell, stale } = await edgeCache.get('/blog/post-1', async () => {
  return await renderToStaticShell(<BlogPost slug="post-1" />, '/blog/post-1');
});

// Cache tags for invalidation
const tagManager = new CacheTagManager();
tagManager.tag('/blog/post-1', ['blog', 'author:john']);
await tagManager.invalidateTag('author:john', cache); // Invalidates all John's posts

// Generate CDN cache headers
const headers = generateCacheHeaders(shell, {
  strategy: 'stale-while-revalidate',
  maxAge: 3600,
  staleWhileRevalidate: 60,
});
```

### Static Site Generation (SSG)

Pre-render pages at build time:

```typescript
import { buildStaticSite, ssg, isr, ssr } from 'philjs-ssr';

// Configure routes
const config = {
  routes: [
    { path: '/', mode: ssg() }, // Static generation
    { path: '/blog/:slug', mode: isr(3600) }, // Incremental static regeneration (1 hour)
    { path: '/dashboard', mode: ssr() }, // Server-side rendering
  ],
};

// Build static site
await buildStaticSite({
  routes: config.routes,
  outDir: './dist',
  baseUrl: 'https://example.com',
});
```

### Rate Limiting

Protect your API endpoints:

```typescript
import { rateLimit, apiRateLimit, authRateLimit } from 'philjs-ssr';

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
});

// Apply to handler
export default async function handler(request: Request) {
  const rateLimitResult = await limiter.check(request);

  if (!rateLimitResult.allowed) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(rateLimitResult.retryAfter),
      },
    });
  }

  return handleRequest(request, { match });
}

// Pre-configured limiters
const apiLimiter = apiRateLimit(); // 1000 req/hour
const authLimiter = authRateLimit(); // 5 req/15min
```

### CSRF Protection

Protect forms from cross-site request forgery:

```typescript
import { csrfProtection, generateCSRFToken, csrfField } from 'philjs-ssr';

// Server-side: Validate CSRF token
export const action: Action = async ({ request, formData }) => {
  const isValid = await csrfProtection(request, formData);

  if (!isValid) {
    return new Response('Invalid CSRF token', { status: 403 });
  }

  // Process form...
};

// Client-side: Include CSRF token in forms
function MyForm() {
  const token = generateCSRFToken();

  return (
    <form method="POST">
      {csrfField(token)}
      <input name="email" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Platform Adapters

Deploy to any platform:

```typescript
import {
  createFetchHandler,
  createNodeHttpHandler,
  createExpressMiddleware,
  createViteMiddleware,
  createWorkerHandler,
} from 'philjs-ssr';

// Cloudflare Workers / Vercel Edge
export default createFetchHandler({ match });

// Node.js HTTP
const server = http.createServer(createNodeHttpHandler({ match }));

// Express.js
app.use(createExpressMiddleware({ match }));

// Vite dev server
export default defineConfig({
  plugins: [createViteMiddleware({ match })],
});
```

## API

### Request Handling

- `handleRequest(request, options)` - Handle SSR request with route matching and data loading
- `renderToStreamingResponse(vnode, options)` - Render to streaming HTML response

### Components

- `<Suspense fallback={...}>` - Lazy loading boundary with fallback UI

### Data Loading

- `Loader<T>` - Type for route data loaders
- `Action<T>` - Type for form action handlers

### Static Generation

- `buildStaticSite(config)` - Pre-render entire site to static HTML
- `ssg()` - Static site generation mode
- `isr(revalidate)` - Incremental static regeneration with revalidation interval
- `ssr()` - Server-side rendering mode
- `csr()` - Client-side rendering mode
- `configureRoute(path, mode)` - Configure rendering mode for a route
- `handleRevalidation(request, cache)` - Handle ISR revalidation requests
- `createRenderingMiddleware(config)` - Create middleware for mixed rendering modes

### Partial Prerendering (PPR)

- `dynamic(props)` - Mark content for dynamic rendering
- `dynamicPriority(props)` - High-priority dynamic content
- `dynamicDeferred(props)` - Low-priority dynamic content
- `dynamicWithDependencies(deps, props)` - Dynamic with cache dependencies
- `dynamicForUser(props)` - User-specific dynamic content
- `serverOnly(props)` - Server-only content (never hydrated)
- `makeDynamic(component, options)` - Wrap component as dynamic
- `isDynamic(value)` - Check if value is a dynamic component
- `renderToStaticShell(vnode, path, config)` - Render static shell at build time
- `generatePPRResponse(shell, vnode, request, options)` - Generate streaming PPR response
- `streamPPRResponse(shell, vnode, request, options)` - Stream PPR response
- `buildPPR(config)` - Build PPR static shells for all routes
- `loadStaticShell(outDir, path)` - Load pre-built static shell
- `pprVitePlugin(config)` - Vite plugin for PPR builds

### PPR Caching

- `LRUPPRCache` - LRU cache for static shells
- `RedisPPRCache` - Redis-based distributed cache
- `MemoryPPRCache` - Simple in-memory cache
- `FileSystemPPRCache` - File-system based cache
- `EdgeCacheController` - Controller for edge caching strategies
- `CacheTagManager` - Manage cache invalidation with tags
- `generateCacheHeaders(shell, options)` - Generate CDN cache headers
- `parseConditionalRequest(request)` - Parse conditional request headers
- `shouldReturn304(shell, conditional)` - Check if 304 should be returned
- `create304Response(shell)` - Create 304 Not Modified response

### Security

- `csrfProtection(request, formData)` - Validate CSRF tokens
- `generateCSRFToken()` - Generate a new CSRF token
- `csrfField(token)` - Render CSRF input field
- `extractCSRFToken(request)` - Extract token from request

### Rate Limiting

- `RateLimiter` - Configurable rate limiter class
- `rateLimit(config)` - Create custom rate limiter
- `apiRateLimit()` - Pre-configured API rate limiter (1000/hour)
- `authRateLimit()` - Pre-configured auth rate limiter (5/15min)
- `apiKeyRateLimit()` - Rate limit by API key
- `userRateLimit()` - Rate limit by user ID
- `MemoryRateLimitStore` - In-memory rate limit storage
- `RedisRateLimitStore` - Redis-backed rate limit storage
- `SlidingWindowRateLimiter` - Sliding window algorithm
- `AdaptiveRateLimiter` - Adaptive rate limiting based on load

### Adapters

- `createFetchHandler(options)` - Standard Fetch API handler
- `createNodeHttpHandler(options)` - Node.js HTTP handler
- `createExpressMiddleware(options)` - Express.js middleware
- `createViteMiddleware(options)` - Vite dev server middleware
- `createWorkerHandler(options)` - Cloudflare Workers handler

### Hints & Optimization

- `sendEarlyHints(response, resources)` - Send 103 Early Hints for faster loading
- `generatePreloadLinks(resources)` - Generate Link headers for preloading

## Examples

See SSR in action in these example apps:

- [Demo App](../../examples/demo-app) - Full-featured demo with SSR, routing, and islands

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

- **Partial Prerendering (PPR)** - Static shells with dynamic streaming (Next.js 14-inspired)
- **Streaming SSR** - Progressive HTML streaming with Suspense boundaries
- **Data loaders** - Type-safe data fetching before rendering
- **Form actions** - Server-side form handling with redirects
- **Static generation** - SSG, ISR, and mixed rendering modes
- **Edge caching** - LRU, Redis, and CDN integration for PPR shells
- **Resumability** - Hydrate without re-executing server logic
- **Rate limiting** - Built-in protection against abuse
- **CSRF protection** - Secure form submissions
- **Platform adapters** - Deploy to any JavaScript runtime
- **Security headers** - Automatic security best practices
- **Early hints** - 103 Early Hints for faster page loads
- **Result types** - Rust-style error handling with Ok/Err

## Request Context

All loaders and actions receive a context object:

```typescript
type RequestContext = {
  request: Request;        // Original request
  url: URL;                // Parsed URL
  method: string;          // HTTP method
  headers: Headers;        // Request headers
  params: Record<string, string>;  // Route parameters
  formData?: FormData;     // Form data (POST only)
};
```

## Rendering Modes

PhilJS SSR supports multiple rendering strategies:

- **PPR** - Partial Prerendering (static shell + dynamic streaming) - **NEW!**
- **SSG** - Static Site Generation (pre-render at build time)
- **ISR** - Incremental Static Regeneration (refresh static pages periodically)
- **SSR** - Server-Side Rendering (render on each request)
- **CSR** - Client-Side Rendering (hydrate on the client)

Mix and match modes per route for optimal performance.

### PPR vs Other Modes

| Mode | Initial Load | Data Freshness | Use Case |
|------|-------------|----------------|----------|
| PPR | Instant (static shell) | Fresh (streamed) | Best of both worlds |
| SSG | Instant | Stale | Marketing pages, blogs |
| ISR | Instant | Periodically fresh | E-commerce products |
| SSR | Slower | Always fresh | Dashboards, admin |
| CSR | Slower | Fresh | SPAs, highly interactive |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-ssr/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: $$, $closure, // App Types
  ResumableAppOptions, // Closure Serialization
  serializeClosure, // Component Boundaries
  boundary, // Development Tools
  getResumabilityStats, // Event Listener Serialization
  on, // Full Resumability Context
  createResumableContext, // QRL (Qwik Resource Locator) - Lazy-loadable References
  qrl, // QRL Types
  QRL, // Resumable App Wrapper
  createResumableApp, // SSR Integration
  injectResumableState, // State Serialization
  resumable, // State Types
  ResumableState, // Utilities
  isResuming, AdaptiveConfig, AdaptiveRateLimiter, AdvancedStreamContext, BoundaryResolution, BuildConfig, CacheStats, CacheTagManager, ComponentBoundary, DYNAMIC_SYMBOL, DynamicBoundary, DynamicBoundaryMetadata, DynamicProps, EdgeCacheController, EdgeCachingStrategy, FileSystemPPRCache, HydrationStrategy, ISRCache, Island, LRUPPRCache, Lazy-loadable
  $, MemoryPPRCache, MemoryRateLimitStore, PPRBuildConfig, PPRBuildError, PPRBuildResult, PPRBuilder, PPRCache, PPRConfig, PPRContext, PPRManifest, PPRRouteEntry, PPRStreamController, PPRStreamOptions, PPRSuspenseProps, PPR_FALLBACK_END, PPR_FALLBACK_START, PPR_PLACEHOLDER_END, PPR_PLACEHOLDER_START, PPR_VERSION, PhilJSServerOptions, RateLimitConfig, RateLimitInfo, RateLimitStore, RateLimiter, RedisISRCache, RedisPPRCache, RedisRateLimitStore, RenderMode, RenderOptions, RenderToStreamOptions, RequestContext, RequestTimeData, ResumabilityOptions, ResumableApp, ResumableContext, ResumableListener, RevalidationOptions, RouteConfig, RouteModule, SSRSuperJSONOptions, SUPERJSON_LOADER, ShellAssets, SlidingWindowRateLimiter, StaticGenerator, StaticPage, StaticShell, StreamContext, Suspense, SuspenseBoundary, TimedChunk, apiKeyRateLimit, apiRateLimit, authRateLimit, autoHydrateIslands, buildPPR, buildPPRRoute, buildStaticSite, clearIslands, clearSerializedState, configureRoute, create304Response, createBufferedStream, createCompressionStream, createDynamic, createExpressMiddleware, createFetchHandler, createFilterStream, createLoaderDataAccessor, createLoaderDataSerializer, createMultiplexStream, createNodeHttpHandler, createPPRContext, createPPRDevServer, createPPRStream, createRateLimitedStream, createRenderingMiddleware, createStreamingLoaderSerializer, createThroughputMeasurer, createTimingStream, createViteMiddleware, createWorkerHandler, csr, csrfField, csrfProtection, deserializeClosureVars, deserializeLoaderData, deserializeState, dynamic, dynamicDeferred, dynamicForUser, dynamicIf, dynamicPriority, dynamicWithDependencies, dynamicWithRevalidation, enableResumability, extractBoundaryId, extractCSRFToken, extractHydrationData, extractResumableState, generateCSRFToken, generateCacheHeaders, generateHydrationRestoreScript, generateHydrationScript, generatePPRResponse, getBoundary, getDynamicBoundaryId, getIslandStatus, getSuperJSONLoaderOptions, handleRequest, handleRevalidation, hasResumableState, hasResumed, hasSuperJSONLoader, hashContent, hydrateAllIslands, hydrateIsland, hydrateIslandOnIdle, hydrateIslandOnInteraction, hydrateIslandOnVisible, injectDynamicContent, injectLoaderData, isDynamic, isQRL, isr, loadPPRManifest, loadStaticShell, logResumabilityInfo, makeDynamic, mergeStreams, nodeStreamToWebStream, onResume, parseConditionalRequest, pipeWebStreamToNode, pprVitePlugin, preloadIsland, qrlChunk, qrlRegistry, rateLimit, registerDynamicBoundary, registerIsland, renderAllDynamicContent, renderDynamicContent, renderToStaticShell, renderToStream, renderToStreamingResponse, resolveQRL, resumableComputed, resumeContext, resumeFromState, resumeListeners, serializeBoundaries, serializeContext, serializeListeners, serializeLoaderData, serializeState, serverOnly, shouldReturn304, ssg, ssr, streamPPRResponse, superJSONAction, superJSONLoader, teeStream, useResumable, userRateLimit, webStreamToNodeStream, wrapActionWithSuperJSON, wrapLoaderWithSuperJSON
- Re-exported modules: ./adapters.js, ./csrf.js, ./dynamic.js, ./hints.js, ./hydrate-island.js, ./loader.js, ./ppr-build.js, ./ppr-cache.js, ./ppr-streaming.js, ./ppr-types.js, ./ppr.js, ./rate-limit.js, ./render-to-stream.js, ./request-handler.js, ./resumability.js, ./resume.js, ./security.js, ./static-generation.js, ./stream-adapters.js, ./stream.js, ./streaming.js, ./superjson.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

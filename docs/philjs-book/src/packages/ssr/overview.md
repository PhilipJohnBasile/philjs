# @philjs/ssr

The `@philjs/ssr` package provides a complete server-side rendering solution with streaming, selective hydration, partial pre-rendering (PPR), static generation (SSG/ISR), and Qwik-style resumability.

## Installation

```bash
npm install @philjs/ssr
```

## Features

- **Streaming SSR** - Progressive HTML streaming with Suspense
- **Selective Hydration** - Island architecture with lazy hydration
- **Partial Pre-rendering (PPR)** - Static shell + dynamic streaming
- **Static Generation** - SSG and ISR with caching
- **Resumability** - Qwik-style state serialization
- **Rate Limiting** - Protect endpoints from abuse
- **CSRF Protection** - Built-in security utilities

## Quick Start

```typescript
import { renderToStream, Suspense, Island } from '@philjs/ssr';

// Basic streaming SSR
const stream = renderToStream(
  <App />,
  {
    onShellReady: () => console.log('Shell sent'),
    onAllReady: () => console.log('All content ready'),
    bootstrapModules: ['/client.js']
  }
);

// Convert to Response
return new Response(stream, {
  headers: { 'Content-Type': 'text/html' }
});
```

---

## Streaming SSR

### renderToStream

Renders JSX to a progressive HTML stream, providing 50%+ faster Time-to-First-Byte compared to `renderToString`.

```typescript
import { renderToStream } from '@philjs/ssr';
import type { RenderToStreamOptions, StreamContext } from '@philjs/ssr';

const options: RenderToStreamOptions = {
  // Called when initial shell HTML is ready
  onShellReady: () => {
    console.log('Shell ready - start streaming');
  },

  // Called when all async content completes
  onAllReady: () => {
    console.log('All content rendered');
  },

  // Called on any rendering error
  onError: (error) => {
    console.error('Render error:', error);
  },

  // Enable selective hydration (default: true)
  selectiveHydration: true,

  // Mark components as interactive
  interactiveComponents: new Set([Counter, SearchBox]),

  // Scripts to inject after streaming
  bootstrapScripts: ['/runtime.js'],
  bootstrapModules: ['/client.js']
};

const stream = renderToStream(<App />, options);
```

### Suspense Boundaries

Use Suspense for async data loading with streaming fallbacks:

```tsx
import { Suspense } from '@philjs/ssr';

function App() {
  return (
    <div>
      <header>
        <h1>My App</h1>
      </header>

      {/* Async content streams in when ready */}
      <Suspense fallback={<LoadingSpinner />}>
        <AsyncUserProfile />
      </Suspense>

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
  );
}

// Async component - throws promise during SSR
async function AsyncUserProfile() {
  const user = await fetchUser();
  return <ProfileCard user={user} />;
}
```

### StreamContext

The streaming context tracks rendering state:

```typescript
interface StreamContext {
  /** Counter for suspense boundary IDs */
  suspenseCounter: number;

  /** Pending async boundaries */
  pendingBoundaries: Map<string, Promise<VNode>>;

  /** Components that need hydration */
  interactiveComponents: Set<string | Function>;

  /** Counter for island IDs */
  islandCounter: number;

  /** Whether selective hydration is enabled */
  selectiveHydration: boolean;
}
```

---

## Selective Hydration (Islands)

### Island Architecture

Only hydrate interactive components, keeping static content as plain HTML:

```tsx
import { Island, registerIsland, hydrateAllIslands } from '@philjs/ssr';

// Server: Wrap interactive components
function App() {
  return (
    <div>
      {/* Static content - no JS needed */}
      <article>
        <h1>Article Title</h1>
        <p>This is static content that doesn't need hydration.</p>
      </article>

      {/* Interactive island - will be hydrated */}
      <Island name="comments">
        <CommentSection postId={123} />
      </Island>

      <Island name="newsletter">
        <NewsletterSignup />
      </Island>
    </div>
  );
}

// Client: Register and hydrate islands
registerIsland('comments', CommentSection);
registerIsland('newsletter', NewsletterSignup);
hydrateAllIslands();
```

### Hydration Strategies

Control when islands are hydrated for optimal performance:

```typescript
import {
  hydrateIsland,
  hydrateIslandOnVisible,
  hydrateIslandOnInteraction,
  hydrateIslandOnIdle,
  autoHydrateIslands,
  HydrationStrategy
} from '@philjs/ssr';

// Immediate hydration
hydrateIsland('critical-form');

// Hydrate when scrolled into view
hydrateIslandOnVisible('comments', {
  rootMargin: '50px' // Start 50px before visible
});

// Hydrate on first interaction
hydrateIslandOnInteraction('search-box', [
  'mouseenter',
  'touchstart',
  'focus'
]);

// Hydrate when browser is idle
hydrateIslandOnIdle('recommendations', 2000); // 2s timeout

// Auto-hydrate all islands with a strategy
autoHydrateIslands(HydrationStrategy.VISIBLE);
```

### HydrationStrategy Enum

```typescript
enum HydrationStrategy {
  EAGER = 'eager',       // Hydrate immediately
  VISIBLE = 'visible',   // Hydrate when visible
  INTERACTION = 'interaction', // Hydrate on interaction
  IDLE = 'idle'          // Hydrate when idle
}
```

### Island Status

Check hydration status for debugging:

```typescript
import { getIslandStatus, clearIslands } from '@philjs/ssr';

const status = getIslandStatus('comments');
// { exists: true, hydrated: false }

// Clear all islands (for testing)
clearIslands();
```

---

## Partial Pre-rendering (PPR)

PPR combines static shell pre-rendering with dynamic content streaming, inspired by Next.js 14.

### Creating a PPR Context

```typescript
import { createPPRContext, renderToStaticShell } from '@philjs/ssr';
import type { PPRContext, PPRConfig } from '@philjs/ssr';

// Build-time: Create static shell
const shell = await renderToStaticShell(
  <App />,
  '/products',
  {
    ppr: true,
    placeholderPrefix: 'ppr-'
  }
);

console.log(shell.html);           // Static HTML with placeholders
console.log(shell.boundaries);     // Map of dynamic boundaries
console.log(shell.contentHash);    // Cache validation hash
```

### Dynamic Boundaries

Mark components as dynamic to render at request time:

```tsx
import { dynamic, dynamicForUser, dynamicWithRevalidation } from '@philjs/ssr';

function ProductPage() {
  return (
    <div>
      {/* Static content - pre-rendered */}
      <ProductInfo product={product} />

      {/* Dynamic - rendered per request */}
      {dynamic({
        children: <UserRecommendations />,
        fallback: <RecommendationsSkeleton />,
        priority: 8
      })}

      {/* Dynamic based on user session */}
      {dynamicForUser({
        children: <CartSummary />,
        fallback: <CartPlaceholder />
      })}

      {/* Dynamic with revalidation */}
      {dynamicWithRevalidation({
        children: <LiveInventory />,
        revalidate: 60 // seconds
      })}
    </div>
  );
}
```

### PPR Response Generation

Generate streaming responses with PPR:

```typescript
import { generatePPRResponse, loadStaticShell } from '@philjs/ssr';

async function handleRequest(request: Request) {
  // Load pre-built shell
  const shell = await loadStaticShell('/products');

  // Generate streaming response
  const stream = await generatePPRResponse(
    shell,
    <ProductPage />,
    request,
    {
      onShellSent: () => console.log('Shell sent'),
      onBoundaryResolved: (id) => console.log(`Resolved: ${id}`),
      onComplete: () => console.log('Complete'),
      timeout: 10000 // 10s timeout per boundary
    }
  );

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### PPR Caching

Cache static shells and dynamic content:

```typescript
import {
  LRUPPRCache,
  RedisPPRCache,
  EdgeCacheController,
  CacheTagManager,
  generateCacheHeaders
} from '@philjs/ssr';

// In-memory LRU cache
const memoryCache = new LRUPPRCache({
  maxSize: 100,
  ttl: 3600 // 1 hour
});

// Redis cache for distributed systems
const redisCache = new RedisPPRCache(redisClient, {
  keyPrefix: 'ppr:',
  ttl: 3600
});

// Edge cache control
const edgeCache = new EdgeCacheController({
  strategy: 'stale-while-revalidate',
  maxAge: 60,
  staleWhileRevalidate: 3600
});

// Cache tag management
const tagManager = new CacheTagManager();
tagManager.addTag('product-123', '/products/123');
tagManager.addTag('category-shoes', '/products/123');

// Invalidate by tag
await tagManager.invalidateTag('product-123');
```

### PPR Build Integration

Build PPR shells at compile time:

```typescript
import { PPRBuilder, buildPPR, pprVitePlugin } from '@philjs/ssr';

// Vite plugin
export default defineConfig({
  plugins: [
    pprVitePlugin({
      routes: ['/', '/products', '/about'],
      outputDir: 'dist/ppr'
    })
  ]
});

// Programmatic build
const builder = new PPRBuilder({
  outputDir: 'dist/ppr',
  routes: routeManifest
});

await builder.buildAll();
```

---

## Static Generation (SSG/ISR)

### Route Configuration

Configure rendering mode per route:

```typescript
import { ssg, isr, ssr, csr, configureRoute } from '@philjs/ssr';
import type { RenderMode, RouteConfig } from '@philjs/ssr';

// Static generation at build time
export const config = ssg({
  getStaticPaths: async () => [
    '/about',
    '/contact',
    '/terms'
  ]
});

// ISR with 60-second revalidation
export const productsConfig = isr(60, {
  fallback: 'blocking',
  getStaticPaths: async () => {
    const products = await getTopProducts();
    return products.map(p => `/products/${p.id}`);
  }
});

// Server-side rendering
export const dashboardConfig = ssr();

// Client-side rendering only
export const appConfig = csr();
```

### StaticGenerator

Generate and cache static pages:

```typescript
import { StaticGenerator, RedisISRCache } from '@philjs/ssr';

// Create generator with Redis cache
const cache = new RedisISRCache(redisClient, 'philjs:isr:');
const generator = new StaticGenerator(renderPage, cache);

// Generate all static pages
const pages = await generator.generateAll(routes);

// Handle ISR request
const { html, stale } = await generator.handleISR('/products/123', {
  mode: 'isr',
  revalidate: 60,
  fallback: 'blocking'
});

// Invalidate on content update
await generator.invalidate('/products/123');
await generator.invalidateAll();
```

### Build Static Site

Generate a complete static site:

```typescript
import { buildStaticSite } from '@philjs/ssr';

await buildStaticSite({
  outDir: 'dist',
  routes: routeManifest,
  renderFn: async (path) => {
    return renderToString(<App path={path} />);
  }
});
// ✓ Generated 42 static pages
```

### On-Demand Revalidation

Trigger revalidation via API:

```typescript
import { handleRevalidation } from '@philjs/ssr';

// POST /api/revalidate
async function revalidateHandler(request: Request) {
  return handleRevalidation(request, generator, {
    secret: process.env.REVALIDATION_SECRET,
    paths: ['/products/123', '/products/456']
  });
}

// Webhook from CMS
await fetch('/api/revalidate', {
  method: 'POST',
  headers: {
    'x-revalidation-token': process.env.REVALIDATION_SECRET
  }
});
```

---

## Resumability

Qwik-style state serialization for zero-hydration-cost applications.

### QRL (Quick Resource Locator)

Create lazy-loadable references:

```typescript
import { qrl, $, $$, resolveQRL, isQRL } from '@philjs/ssr';
import type { QRL } from '@philjs/ssr';

// Create a QRL to a function
const handleClick = qrl('./handlers.js', 'onClick');

// $ syntax for inline functions
const increment = $(() => count.value++);

// $$ for functions with captured variables
const addItem = $$((item) => items.push(item));

// Resolve QRL at runtime
const fn = await resolveQRL(handleClick);
fn();
```

### Resumable State

Serialize and resume reactive state:

```typescript
import {
  resumable,
  useResumable,
  serializeState,
  deserializeState,
  resumeFromState
} from '@philjs/ssr';

// Create resumable signal
const count = resumable('count', 0);

// In components
function Counter() {
  const [count, setCount] = useResumable('counter', 0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

// Server: Serialize state to HTML
const state = serializeState();
const html = `
  <script>window.__RESUMABLE_STATE__ = ${JSON.stringify(state)}</script>
`;

// Client: Resume from serialized state
const initialState = window.__RESUMABLE_STATE__;
resumeFromState(initialState);
```

### Event Listener Serialization

Serialize event handlers for resumability:

```typescript
import { on, serializeListeners, resumeListeners } from '@philjs/ssr';

// Mark event handler as serializable
const clickHandler = on('click', $(() => {
  console.log('Clicked!');
}));

// Server: Serialize listeners
const listeners = serializeListeners();

// Client: Resume listeners
resumeListeners(listeners);
```

### Resumable App

Create a fully resumable application:

```typescript
import {
  createResumableApp,
  createResumableContext,
  injectResumableState,
  extractResumableState
} from '@philjs/ssr';
import type { ResumableApp, ResumableAppOptions } from '@philjs/ssr';

// Server-side
const app = createResumableApp({
  root: <App />,
  container: '#app'
});

const html = app.renderToString();
const stateScript = injectResumableState(app.getState());

// Client-side
const state = extractResumableState();
const app = createResumableApp({
  root: <App />,
  container: '#app',
  resume: state
});

app.hydrate(); // Near-instant!
```

---

## Rate Limiting

Protect your endpoints from abuse:

```typescript
import {
  RateLimiter,
  MemoryRateLimitStore,
  RedisRateLimitStore,
  SlidingWindowRateLimiter,
  AdaptiveRateLimiter,
  rateLimit,
  apiRateLimit,
  authRateLimit
} from '@philjs/ssr';
import type { RateLimitConfig, RateLimitInfo } from '@philjs/ssr';

// Basic rate limiter
const limiter = new RateLimiter({
  windowMs: 60000,    // 1 minute
  maxRequests: 100,   // 100 requests per window
  store: new MemoryRateLimitStore()
});

// Check rate limit
const info: RateLimitInfo = await limiter.check('user-123');
if (info.remaining <= 0) {
  throw new Error('Rate limit exceeded');
}

// Sliding window for smoother limiting
const slidingLimiter = new SlidingWindowRateLimiter({
  windowMs: 60000,
  maxRequests: 100
});

// Adaptive rate limiting
const adaptiveLimiter = new AdaptiveRateLimiter({
  baseLimit: 100,
  minLimit: 10,
  maxLimit: 500,
  adjustmentFactor: 0.1
});

// Pre-configured limiters
const api = apiRateLimit();        // 1000/hour
const auth = authRateLimit();      // 5/minute (strict)
```

### Rate Limit Middleware

```typescript
import { rateLimit } from '@philjs/ssr';

// Express-style middleware
app.use('/api', rateLimit({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => req.ip,
  onRateLimited: (req, res) => {
    res.status(429).json({ error: 'Too many requests' });
  }
}));
```

---

## CSRF Protection

Built-in Cross-Site Request Forgery protection:

```typescript
import {
  csrfProtection,
  generateCSRFToken,
  csrfField,
  extractCSRFToken
} from '@philjs/ssr';

// Generate token for form
const token = generateCSRFToken();

// Include in form
function ContactForm() {
  return (
    <form method="POST" action="/contact">
      {csrfField(token)}
      <input name="email" type="email" />
      <button type="submit">Send</button>
    </form>
  );
}

// Validate on server
async function handlePost(request: Request) {
  const formData = await request.formData();
  const token = extractCSRFToken(formData);

  if (!csrfProtection.validate(token, request)) {
    return new Response('Invalid CSRF token', { status: 403 });
  }

  // Process form...
}
```

---

## Stream Adapters

Convert between Web Streams and Node streams:

```typescript
import {
  webStreamToNodeStream,
  nodeStreamToWebStream,
  pipeWebStreamToNode,
  createCompressionStream,
  createBufferedStream,
  createTimingStream,
  createRateLimitedStream,
  teeStream,
  mergeStreams
} from '@philjs/ssr';

// Convert Web ReadableStream to Node Readable
const nodeStream = webStreamToNodeStream(webStream);

// Convert Node Readable to Web ReadableStream
const webStream = nodeStreamToWebStream(nodeStream);

// Add compression
const compressed = createCompressionStream(stream, 'gzip');

// Buffer chunks for efficiency
const buffered = createBufferedStream(stream, {
  highWaterMark: 16384
});

// Add timing information
const timed = createTimingStream(stream);
timed.pipeTo(new WritableStream({
  write(chunk: TimedChunk) {
    console.log(`Chunk at ${chunk.timestamp}ms`);
  }
}));

// Rate limit stream output
const limited = createRateLimitedStream(stream, {
  bytesPerSecond: 1024 * 1024 // 1MB/s
});

// Duplicate stream
const [stream1, stream2] = teeStream(stream);

// Merge multiple streams
const merged = mergeStreams([stream1, stream2, stream3]);
```

---

## Server Adapters

Use PhilJS SSR with various server frameworks:

```typescript
import {
  createFetchHandler,
  createNodeHttpHandler,
  createExpressMiddleware,
  createViteMiddleware,
  createWorkerHandler
} from '@philjs/ssr';
import type { PhilJSServerOptions } from '@philjs/ssr';

const options: PhilJSServerOptions = {
  app: <App />,
  routes: routeManifest,
  streaming: true
};

// Fetch API (Cloudflare Workers, Deno, Bun)
const fetchHandler = createFetchHandler(options);
export default { fetch: fetchHandler };

// Node.js HTTP
import { createServer } from 'http';
const nodeHandler = createNodeHttpHandler(options);
createServer(nodeHandler).listen(3000);

// Express
import express from 'express';
const app = express();
app.use(createExpressMiddleware(options));

// Vite dev server
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [createViteMiddleware(options)]
});

// Cloudflare Workers
const workerHandler = createWorkerHandler(options);
addEventListener('fetch', (event) => {
  event.respondWith(workerHandler(event.request));
});
```

---

## SuperJSON Integration

Serialize complex data types for hydration:

```typescript
import {
  serializeLoaderData,
  deserializeLoaderData,
  wrapLoaderWithSuperJSON,
  generateHydrationScript,
  superJSONLoader
} from '@philjs/ssr';

// Loader with complex types
const loader = superJSONLoader(async ({ params }) => {
  return {
    user: await getUser(params.id),
    createdAt: new Date(),           // Date preserved
    permissions: new Set(['read']),   // Set preserved
    metadata: new Map([['key', 'value']]) // Map preserved
  };
});

// Server: Serialize for transport
const data = await loader({ params: { id: '123' } });
const serialized = serializeLoaderData(data);

// Generate hydration script
const script = generateHydrationScript(serialized);
// <script>window.__LOADER_DATA__ = {...}</script>

// Client: Deserialize with types restored
const restored = deserializeLoaderData(window.__LOADER_DATA__);
console.log(restored.createdAt instanceof Date); // true
console.log(restored.permissions instanceof Set); // true
```

---

## Request Handler

Handle incoming requests with full SSR:

```typescript
import { handleRequest } from '@philjs/ssr';
import type { RouteModule, RequestContext, RenderOptions } from '@philjs/ssr';

const context: RequestContext = {
  request,
  params: { id: '123' },
  searchParams: new URLSearchParams('?page=1')
};

const options: RenderOptions = {
  streaming: true,
  timeout: 10000
};

const response = await handleRequest(
  <App />,
  routes,
  context,
  options
);
```

---

## Types Reference

### Core Types

```typescript
// Streaming
interface StreamContext {
  suspenseCounter: number;
  pendingBoundaries: Map<string, Promise<VNode>>;
  interactiveComponents: Set<string | Function>;
  islandCounter: number;
  selectiveHydration: boolean;
}

interface RenderToStreamOptions {
  onShellReady?: () => void;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
  selectiveHydration?: boolean;
  interactiveComponents?: Set<string | Function>;
  bootstrapScripts?: string[];
  bootstrapModules?: string[];
}

// Static Generation
type RenderMode = 'ssr' | 'ssg' | 'isr' | 'csr';

interface RouteConfig {
  mode?: RenderMode;
  revalidate?: number;
  fallback?: 'blocking' | 'static' | false;
  getStaticPaths?: () => Promise<string[]> | string[];
}

interface StaticPage {
  path: string;
  html: string;
  data?: any;
  timestamp: number;
  revalidate?: number;
}

// PPR
interface PPRConfig {
  ppr: boolean;
  placeholderPrefix?: string;
}

interface StaticShell {
  path: string;
  html: string;
  boundaries: Map<string, DynamicBoundaryMetadata>;
  buildTime: number;
  contentHash: string;
  assets: ShellAssets;
}

interface DynamicBoundary {
  id: string;
  type: 'user' | 'time' | 'data';
  content: VNode;
  fallback?: VNode;
  priority?: number;
  dataDependencies?: string[];
}

// Rate Limiting
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
  store?: RateLimitStore;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Resumability
interface QRL<T = any> {
  chunk: string;
  symbol: string;
  captured?: any[];
}

interface ResumableState {
  signals: Map<string, any>;
  listeners: Map<string, any[]>;
  boundaries: Map<string, any>;
}
```

---

## Best Practices

### 1. Use Streaming for Large Pages

```typescript
// Good - streams content progressively
const stream = renderToStream(<App />);

// Avoid for large pages - blocks until complete
const html = renderToString(<App />);
```

### 2. Strategic Island Placement

```typescript
// Good - only interactive parts are islands
<article>
  <h1>{title}</h1>        {/* Static */}
  <p>{content}</p>         {/* Static */}
  <Island name="comments"> {/* Interactive */}
    <Comments />
  </Island>
</article>

// Avoid - entire page as island
<Island name="page">
  <EntirePage />
</Island>
```

### 3. Choose Appropriate Hydration Strategy

```typescript
// Critical interactivity - hydrate immediately
hydrateIsland('checkout-form');

// Below fold - hydrate on visible
hydrateIslandOnVisible('recommendations');

// Non-critical - hydrate on idle
hydrateIslandOnIdle('analytics-widget');
```

### 4. ISR for Dynamic Content

```typescript
// Good - stale-while-revalidate
export const config = isr(60, {
  fallback: 'blocking'
});

// Good - static for truly static content
export const config = ssg();
```

### 5. PPR for Best of Both Worlds

```typescript
// Pre-render static shell, stream dynamic
function ProductPage() {
  return (
    <div>
      <ProductInfo />  {/* Static - pre-rendered */}
      {dynamic({
        children: <UserReviews />,  {/* Dynamic - streamed */}
        fallback: <ReviewsSkeleton />
      })}
    </div>
  );
}
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `renderToStream` | Stream JSX to HTML |
| `Suspense` | Async boundary component |
| `Island` | Hydration boundary component |
| `registerIsland` | Register component for hydration |
| `hydrateIsland` | Hydrate specific island |
| `hydrateAllIslands` | Hydrate all islands |
| `hydrateIslandOnVisible` | Lazy hydrate on visibility |
| `hydrateIslandOnInteraction` | Hydrate on user interaction |
| `hydrateIslandOnIdle` | Hydrate when browser idle |
| `autoHydrateIslands` | Auto-hydrate with strategy |
| `HydrationStrategy` | Hydration strategy enum |
| `createPPRContext` | Create PPR rendering context |
| `renderToStaticShell` | Build-time shell rendering |
| `generatePPRResponse` | Generate streaming PPR response |
| `dynamic` | Mark content as dynamic |
| `StaticGenerator` | SSG/ISR generator class |
| `buildStaticSite` | Build static site |
| `ssg`, `isr`, `ssr`, `csr` | Route config helpers |
| `handleRevalidation` | On-demand revalidation |
| `qrl`, `$`, `$$` | QRL creation functions |
| `resumable`, `useResumable` | Resumable state |
| `serializeState`, `deserializeState` | State serialization |
| `createResumableApp` | Resumable app factory |
| `RateLimiter` | Rate limiting class |
| `csrfProtection` | CSRF utilities |
| `webStreamToNodeStream` | Stream conversion |
| `createFetchHandler` | Fetch API handler |
| `createExpressMiddleware` | Express middleware |

---

## Next Steps

- [Streaming Deep Dive](./streaming.md)
- [Island Architecture](./islands.md)
- [PPR Guide](./ppr.md)
- [Static Generation](./static-generation.md)
- [@philjs/router Integration](../router/overview.md)

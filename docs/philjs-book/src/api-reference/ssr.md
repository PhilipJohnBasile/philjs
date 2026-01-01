# SSR & Hydration API

Complete reference for server-side rendering, hydration, streaming, islands architecture, and Partial Pre-Rendering (PPR) in PhilJS.

---

## Table of Contents

- [Core Rendering APIs](#core-rendering-apis)
  - [renderToString](#rendertostring)
  - [renderToStream](#rendertostream)
  - [renderToStreamingResponse](#rendertostreamingresponse)
- [Hydration APIs](#hydration-apis)
  - [hydrate](#hydrate)
  - [render](#render)
- [Request Handler & Adapters](#request-handler--adapters)
  - [handleRequest](#handlerequest)
  - [Server Adapters](#server-adapters)
- [Islands Architecture](#islands-architecture)
  - [ServerIsland](#serverisland)
  - [Cache Management](#cache-management)
- [Partial Pre-Rendering (PPR)](#partial-pre-rendering-ppr)
  - [PPRBoundary](#pprboundary)
  - [Configuration](#ppr-configuration)
- [Streaming & Suspense](#streaming--suspense)
- [Data Serialization](#data-serialization)
- [Best Practices](#best-practices)

---

## Core Rendering APIs

### renderToString()

Synchronously render a JSX element to an HTML string.

```ts
import { renderToString } from '@philjs/core';

function renderToString(vnode: VNode): string
```

**Parameters**

- `vnode: VNode` - JSX element, function component, or primitive value to render

**Returns**

- `string` - Complete HTML string

**Example**

```tsx
import { renderToString } from '@philjs/core';

function App() {
  return (
    <div>
      <h1>Hello World</h1>
      <p>Server-rendered content</p>
    </div>
  );
}

const html = renderToString(<App />);
// Output: <div><h1>Hello World</h1><p>Server-rendered content</p></div>
```

**Features**

- Renders JSX to HTML string
- Supports function components
- Handles fragments, arrays, and nested children
- Escapes HTML special characters
- Converts React-style props (className → class, htmlFor → for)
- Handles style objects → CSS strings
- Processes boolean attributes correctly
- Skips event handlers (attached during hydration)

**Edge Cases**

```tsx
// Null/undefined/boolean - renders empty string
renderToString(null);        // ""
renderToString(false);       // ""
renderToString(true);        // ""

// Primitives
renderToString("Hello");     // "Hello" (escaped)
renderToString(42);          // "42"

// Arrays
renderToString([
  <div>One</div>,
  <div>Two</div>
]); // <div>One</div><div>Two</div>

// Fragments
renderToString(
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);
```

### renderToStream()

Asynchronously render a JSX element to a stream of HTML chunks.

```ts
import { renderToStream } from '@philjs/core';

async function* renderToStream(vnode: VNode): AsyncGenerator<string>
```

**Parameters**

- `vnode: VNode` - JSX element to render

**Returns**

- `AsyncGenerator<string>` - Async generator yielding HTML chunks

**Example**

```tsx
import { renderToStream } from '@philjs/core';

function App() {
  return <div><h1>Streaming Content</h1></div>;
}

for await (const chunk of renderToStream(<App />)) {
  response.write(chunk);
}
response.end();
```

**Notes**

- Currently yields complete HTML in a single chunk
- Future: Will support progressive streaming with Suspense boundaries
- Use `renderToStreamingResponse` for full streaming support today

### renderToStreamingResponse()

Create a streaming HTTP response with progressive HTML delivery and Suspense support.

```ts
import { renderToStreamingResponse, Suspense } from '@philjs/ssr';

function renderToStreamingResponse(
  vnode: VNode,
  options?: {
    onShellReady?: () => void;
    onComplete?: () => void;
  }
): Promise<ReadableStream<Uint8Array>>
```

**Parameters**

- `vnode: VNode` - Root JSX element to render
- `options.onShellReady?: () => void` - Called when initial shell is ready
- `options.onComplete?: () => void` - Called when all content is sent

**Returns**

- `Promise<ReadableStream<Uint8Array>>` - Streaming response body

**Example**

```tsx
import { renderToStreamingResponse, Suspense } from '@philjs/ssr';

async function SlowComponent() {
  const data = await fetchData();
  return <div>{data.title}</div>;
}

const stream = await renderToStreamingResponse(
  <html>
    <body>
      <h1>My App</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <SlowComponent />
      </Suspense>
    </body>
  </html>,
  {
    onShellReady: () => console.log('Shell sent to browser'),
    onComplete: () => console.log('Streaming complete'),
  }
);

return new Response(stream, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
```

**How It Works**

1. Sends HTML shell immediately (faster TTFB)
2. Renders Suspense fallbacks in the initial stream
3. Resolves async components in the background
4. Injects resolved content via inline `<script>` tags
5. Client-side runtime replaces fallbacks with real content

**Client Runtime**

The streaming response includes a client runtime that handles progressive injection:

```html
<script>
  window.__PHIL_SUSPENSE__ = {};
  function __phil_inject(id, html) {
    const el = document.getElementById('phil-suspense-' + id);
    if (el) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      el.replaceWith(...temp.childNodes);
    }
  }
</script>
```

**Benefits**

- Faster Time to First Byte (TTFB)
- Progressive content loading
- Better perceived performance
- SEO-friendly (complete HTML when crawled)

---

## Hydration APIs

### hydrate()

Attach event handlers and reactivity to server-rendered HTML.

```ts
import { hydrate } from '@philjs/core';

function hydrate(vnode: VNode, container: Element): void
```

**Parameters**

- `vnode: VNode` - JSX element matching server-rendered HTML
- `container: Element` - DOM container with server-rendered content

**Returns**

- `void`

**Example**

```tsx
// Server (entry-server.ts)
import { renderToString } from '@philjs/core';

function Counter() {
  const count = signal(0);
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}

const html = renderToString(<Counter />);
// Send HTML to client...

// Client (entry-client.ts)
import { hydrate } from '@philjs/core';

hydrate(<Counter />, document.getElementById('app')!);
// Now button clicks work!
```

**Hydration Process**

1. **Walk the DOM tree**: Traverse server-rendered nodes
2. **Match VNodes to DOM**: Align virtual nodes with existing elements
3. **Attach event handlers**: Add onClick, onChange, etc.
4. **Setup reactivity**: Subscribe signals to DOM updates
5. **Preserve DOM**: Reuse server HTML, don't recreate

**Hydration Context**

```ts
type HydrationContext = {
  currentNode: Node | null;      // Current DOM node being hydrated
  parentElement: Element | null; // Parent element for text nodes
};
```

**Hydration Mismatches**

If server and client HTML don't match, you'll see warnings:

```
Hydration mismatch: expected div, got span
```

**Common Causes**

- Different data on server vs client
- Browser-only APIs used during SSR
- Conditional rendering based on `typeof window`
- Random values (use stable seeds)

**Example: Avoid Mismatches**

```tsx
// ❌ Bad - causes hydration mismatch
function BadComponent() {
  const id = Math.random(); // Different on server and client!
  return <div id={id}>Content</div>;
}

// ✅ Good - stable ID
let counter = 0;
function GoodComponent() {
  const id = useRef(counter++); // Stable across renders
  return <div id={id}>Content</div>;
}
```

### render()

Create and mount a client-side component (no server HTML).

```ts
import { render } from '@philjs/core';

function render(vnode: VNode, container: Element): void
```

**Parameters**

- `vnode: VNode` - JSX element to render
- `container: Element` - DOM container to render into

**Returns**

- `void`

**Example**

```tsx
import { render } from '@philjs/core';

function ClientOnlyWidget() {
  return <div>Client-only component</div>;
}

// Clears container and renders fresh
render(<ClientOnlyWidget />, document.getElementById('widget')!);
```

**Differences from hydrate()**

| Feature | hydrate() | render() |
|---------|-----------|----------|
| **Purpose** | Attach to server HTML | Create fresh DOM |
| **DOM** | Preserves existing | Clears and recreates |
| **Use Case** | SSR apps | Client-only widgets |
| **Performance** | Faster (reuses HTML) | Slower (creates DOM) |

**When to Use**

- Client-only components (no SSR)
- Interactive widgets on static pages
- Dynamic content loading after initial render
- Admin dashboards, tools, apps without SSR

---

## Request Handler & Adapters

### handleRequest()

Low-level request handler that powers all server adapters.

```ts
import { handleRequest } from '@philjs/ssr';

function handleRequest(
  request: Request,
  options: {
    match: RouteMatcher;
    baseUrl?: string;
    render?: (component: VNode) => string | Promise<string>;
  }
): Promise<Response>
```

**Parameters**

- `request: Request` - Incoming Fetch API request
- `options.match: RouteMatcher` - Route matcher from `createRouteMatcher(routes)`
- `options.baseUrl?: string` - Base URL for route resolution (optional)
- `options.render?: (component: VNode) => string | Promise<string>` - Custom renderer (optional)

**Returns**

- `Promise<Response>` - HTTP response with rendered HTML

**Example**

```ts
import { handleRequest } from '@philjs/ssr';
import { createRouteMatcher } from '@philjs/router';
import { routes } from './routes';

const match = createRouteMatcher(routes);

export default {
  async fetch(request: Request) {
    return await handleRequest(request, { match });
  }
};
```

**Loader Execution**

The handler automatically:

1. Matches the URL to a route
2. Executes the route's loader with context:
   ```ts
   {
     request: Request,
     url: URL,
     params: Record<string, string>,
     headers: Headers,
     method: string,
     formData?: FormData
   }
   ```
3. Unwraps `Result` types (Ok/Err)
4. Passes data/error to component
5. Serializes state to `window.__PHILJS_ROUTE_*__`
6. Renders component to HTML

**Component Props**

Route components receive:

```ts
type RouteComponentProps = {
  params: Record<string, string>;  // URL parameters
  data?: any;                      // Loader data (if Ok)
  error?: any;                     // Loader error (if Err)
  url: string;                     // Current URL
  navigate: (to: string) => void;  // Navigation (throws on server)
};
```

### Server Adapters

All adapters share a common options interface:

```ts
type PhilJSServerOptions = {
  routes: RouteDefinition[];
  baseUrl?: string;
  render?: (component: VNode) => string | Promise<string>;
  routeOptions?: RouteManifestOptions;
};
```

#### createFetchHandler()

Create a Fetch API handler for any JavaScript runtime.

```ts
import { createFetchHandler } from '@philjs/ssr';

function createFetchHandler(
  options: PhilJSServerOptions
): (request: Request) => Promise<Response>
```

**Example: Cloudflare Workers**

```ts
import { createFetchHandler } from '@philjs/ssr';
import { routes } from './routes';

const handler = createFetchHandler({ routes });

export default {
  fetch(request: Request) {
    return handler(request);
  }
};
```

**Example: Deno**

```ts
import { createFetchHandler } from '@philjs/ssr';
import { routes } from './routes';

const handler = createFetchHandler({ routes });

Deno.serve(handler);
```

**Example: Bun**

```ts
import { createFetchHandler } from '@philjs/ssr';
import { routes } from './routes';

const handler = createFetchHandler({ routes });

export default {
  port: 3000,
  fetch: handler,
};
```

#### createNodeHttpHandler()

Create a handler for Node.js http/https servers.

```ts
import { createNodeHttpHandler } from '@philjs/ssr';

function createNodeHttpHandler(
  options: PhilJSServerOptions
): (req: IncomingMessage, res: ServerResponse) => void
```

**Example**

```ts
import { createServer } from 'node:http';
import { createNodeHttpHandler } from '@philjs/ssr';
import { routes } from './routes';

const handler = createNodeHttpHandler({ routes });
const server = createServer(handler);

server.listen(3000, () => {
  console.log('PhilJS SSR at http://localhost:3000');
});
```

#### createExpressMiddleware()

Create Connect-style middleware for Express.js.

```ts
import { createExpressMiddleware } from '@philjs/ssr';

function createExpressMiddleware(
  options: PhilJSServerOptions
): (req: Request, res: Response, next: NextFunction) => void
```

**Example**

```ts
import express from 'express';
import { createExpressMiddleware } from '@philjs/ssr';
import { routes } from './routes';

const app = express();

// Serve static assets
app.use('/assets', express.static('dist/client/assets'));

// Body parsing (before PhilJS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PhilJS SSR
app.use(createExpressMiddleware({ routes }));

app.listen(3000);
```

**Important**: Register body parsers before the PhilJS middleware so POST bodies are available.

#### createViteMiddleware()

Create Vite middleware for development.

```ts
import { createViteMiddleware } from '@philjs/ssr';

function createViteMiddleware(
  options: PhilJSServerOptions
): (req: Request, res: Response, next: NextFunction) => void
```

**Example**

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { createViteMiddleware } from '@philjs/ssr';
import { routes } from './routes';

export default defineConfig({
  server: {
    middlewareMode: true,
  },
  plugins: [
    {
      name: '@philjs/ssr',
      configureServer(server) {
        server.middlewares.use(createViteMiddleware({ routes }));
      },
    },
  ],
});
```

**Benefits**

- Hot module reloading (HMR)
- Fast development builds
- TypeScript support
- CSS preprocessing

#### createWorkerHandler()

Create a handler for Web Workers, Service Workers, and edge runtimes.

```ts
import { createWorkerHandler } from '@philjs/ssr';

function createWorkerHandler(
  options: PhilJSServerOptions
): (request: Request) => Promise<Response>
```

**Example: Cloudflare Workers**

```ts
import { createWorkerHandler } from '@philjs/ssr';
import { routes } from './routes';

const handler = createWorkerHandler({ routes });

export default {
  fetch: handler
};
```

**Example: Service Worker**

```ts
import { createWorkerHandler } from '@philjs/ssr';
import { routes } from './routes';

const handler = createWorkerHandler({ routes });

self.addEventListener('fetch', (event) => {
  event.respondWith(handler(event.request));
});
```

---

## Islands Architecture

Server Islands enable per-component server-side rendering with intelligent caching, matching Astro 5's capabilities.

### ServerIsland()

Create a server-rendered component with caching.

```ts
import { ServerIsland } from '@philjs/islands/server';

function ServerIsland(props: ServerIslandProps): VNode

interface ServerIslandProps {
  id?: string;
  cache?: ServerIslandCache;
  fallback?: RenderableContent;
  children: RenderableContent;
  props?: Record<string, any>;
  defer?: 'visible' | 'idle' | 'interaction' | 'media' | false;
  media?: string;
  priority?: number; // 0-10
}
```

**Parameters**

- `id?: string` - Unique island identifier (auto-generated if omitted)
- `cache?: ServerIslandCache` - Caching configuration
- `fallback?: RenderableContent` - Loading placeholder
- `children: RenderableContent` - Component to render
- `props?: Record<string, any>` - Props for the component
- `defer?: 'visible' | 'idle' | 'interaction' | 'media' | false` - Loading strategy
- `media?: string` - Media query for `defer="media"`
- `priority?: number` - Render priority (0=low, 10=high)

**Cache Configuration**

```ts
interface ServerIslandCache {
  ttl: number;                    // Time-to-live in seconds
  tags?: string[];                // Cache tags for invalidation
  swr?: number;                   // Stale-while-revalidate duration
  keyGenerator?: (props) => string; // Custom cache key
  varyBy?: string[];              // Vary by headers
  private?: boolean;              // Per-user caching
  edge?: boolean;                 // Edge caching hint
}
```

**Example: Basic Island**

```tsx
import { ServerIsland } from '@philjs/islands/server';

function ProductRecommendations({ userId }) {
  return (
    <ServerIsland
      id="recommendations"
      cache={{ ttl: 3600, tags: ['products'] }}
      fallback={<RecommendationsSkeleton />}
    >
      <Recommendations userId={userId} />
    </ServerIsland>
  );
}
```

**Example: Stale-While-Revalidate**

```tsx
<ServerIsland
  cache={{
    ttl: 300,           // Fresh for 5 minutes
    swr: 3600,          // Serve stale for 1 hour while revalidating
    tags: ['user-data']
  }}
  fallback={<LoadingSpinner />}
>
  <UserDashboard />
</ServerIsland>
```

**Example: Deferred Loading**

```tsx
// Load when visible
<ServerIsland defer="visible" priority={5}>
  <BelowFoldContent />
</ServerIsland>

// Load when browser idle
<ServerIsland defer="idle" priority={1}>
  <AnalyticsWidget />
</ServerIsland>

// Load on interaction
<ServerIsland defer="interaction" priority={3}>
  <CommentsSection />
</ServerIsland>

// Load based on media query
<ServerIsland defer="media" media="(min-width: 768px)" priority={2}>
  <DesktopSidebar />
</ServerIsland>
```

### Cache Management

#### cacheIsland()

Manually cache an island's HTML.

```ts
import { cacheIsland } from '@philjs/islands/server';

function cacheIsland(
  id: string,
  html: string,
  config: ServerIslandCache
): Promise<void>
```

**Example**

```ts
await cacheIsland('product-123', '<div>...</div>', {
  ttl: 3600,
  tags: ['products', 'product-123']
});
```

#### invalidateIslandsByTag()

Invalidate all islands with a specific tag.

```ts
import { invalidateIslandsByTag } from '@philjs/islands/server';

function invalidateIslandsByTag(tag: string): Promise<void>
```

**Example**

```ts
// Invalidate all product-related islands
await invalidateIslandsByTag('products');
```

#### invalidateIsland()

Invalidate a specific island.

```ts
import { invalidateIsland } from '@philjs/islands/server';

function invalidateIsland(
  id: string,
  props?: Record<string, any>,
  cacheConfig?: ServerIslandCache
): Promise<void>
```

**Example**

```ts
await invalidateIsland('user-profile', { userId: '123' });
```

#### clearIslandCache()

Clear all cached islands.

```ts
import { clearIslandCache } from '@philjs/islands/server';

function clearIslandCache(): Promise<void>
```

**Example**

```ts
// Clear everything (e.g., on deployment)
await clearIslandCache();
```

### Cache Adapters

#### Redis Adapter

```ts
import { createRedisCacheAdapter, setIslandCacheStore } from '@philjs/islands/server';
import Redis from 'ioredis';

const redis = new Redis();
const adapter = createRedisCacheAdapter(redis);
setIslandCacheStore(adapter);
```

#### Cloudflare KV Adapter

```ts
import { createKVCacheAdapter, setIslandCacheStore } from '@philjs/islands/server';

const adapter = createKVCacheAdapter(env.MY_KV_NAMESPACE);
setIslandCacheStore(adapter);
```

#### Custom Adapter

```ts
import { setIslandCacheStore } from '@philjs/islands/server';

const customStore = {
  async get(key: string) { /* ... */ },
  async set(key: string, value: CachedIsland) { /* ... */ },
  async delete(key: string) { /* ... */ },
  async invalidateByTag(tag: string) { /* ... */ },
  async clear() { /* ... */ },
};

setIslandCacheStore(customStore);
```

### Metrics

```ts
import { getServerIslandMetrics } from '@philjs/islands/server';

const metrics = getServerIslandMetrics();

console.log({
  hits: metrics.hits,
  misses: metrics.misses,
  staleHits: metrics.staleHits,
  revalidations: metrics.revalidations,
  errors: metrics.errors,
  avgRenderTime: metrics.avgRenderTime
});
```

---

## Partial Pre-Rendering (PPR)

PPR combines static pre-rendering with dynamic streaming for optimal performance.

### PPRBoundary()

Define static and dynamic content boundaries.

```ts
import { PPRBoundary } from '@philjs/core';

function PPRBoundary(props: PPRBoundaryProps): VNode

interface PPRBoundaryProps {
  static: RenderableContent;
  dynamic: RenderableContent;
  fallback?: RenderableContent;
  cacheKey?: string;
  ttl?: number;
  priority?: number;
  errorFallback?: (error: Error) => RenderableContent;
}
```

**Example**

```tsx
function ProductPage({ productId }) {
  return (
    <PPRBoundary
      static={
        <div>
          <Header />
          <ProductInfo productId={productId} />
        </div>
      }
      dynamic={
        <div>
          <UserRecommendations />
          <RecentViews />
        </div>
      }
      fallback={<ContentSkeleton />}
      cacheKey={`product-${productId}`}
      ttl={3600}
    />
  );
}
```

### PPR Configuration

#### configurePPR()

Configure global PPR settings.

```ts
import { configurePPR } from '@philjs/core';

function configurePPR(config: PPRConfig): void

interface PPRConfig {
  enabled: boolean;
  shellCacheTTL: number;
  dynamicTimeout: number;
  streaming: boolean;
  preloadHints: boolean;
  defaultFallback: () => RenderableContent;
}
```

**Example**

```ts
configurePPR({
  enabled: true,
  shellCacheTTL: 3600,
  dynamicTimeout: 10000,
  streaming: true,
  preloadHints: true,
  defaultFallback: () => <LoadingSpinner />,
});
```

#### getPPRConfig()

Get current PPR configuration.

```ts
import { getPPRConfig } from '@philjs/core';

const config = getPPRConfig();
console.log('Shell Cache TTL:', config.shellCacheTTL);
```

### Shell Management

#### cacheShell()

Manually cache a static shell.

```ts
import { cacheShell } from '@philjs/core';

function cacheShell(key: string, html: string, ttl: number): void
```

**Example**

```ts
cacheShell('product-123', '<div>Static shell</div>', 3600);
```

#### getShellFromCache()

Retrieve a cached shell.

```ts
import { getShellFromCache } from '@philjs/core';

const cached = getShellFromCache('product-123');
if (cached) {
  console.log('Cache hit!');
}
```

#### invalidateShell()

Invalidate a specific shell.

```ts
import { invalidateShell } from '@philjs/core';

invalidateShell('product-123');
```

#### clearShellCache()

Clear all cached shells.

```ts
import { clearShellCache } from '@philjs/core';

clearShellCache();
```

### Server Integration

#### renderWithPPR()

Render with PPR support on the server.

```ts
import { renderWithPPR } from '@philjs/core';

async function renderWithPPR(
  vnode: VNode,
  options: {
    staticProps: Record<string, any>;
    dynamicProps: Record<string, any>;
    streaming?: boolean;
  }
): Promise<{ shell: string; dynamic: AsyncIterable<string> }>
```

**Example**

```ts
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

### Metrics

```ts
import { getPPRMetrics } from '@philjs/core';

const metrics = getPPRMetrics();

console.log({
  ttfb: metrics.ttfb,
  ttfcp: metrics.ttfcp,
  tti: metrics.tti,
  dynamicLoadTime: metrics.dynamicLoadTime,
  cacheHitRate: metrics.cacheHitRate
});
```

---

## Streaming & Suspense

### Suspense Component

Wrap async components with a loading fallback.

```ts
import { Suspense } from '@philjs/ssr';

function Suspense(props: {
  children: VNode;
  fallback?: VNode;
}): VNode
```

**Example**

```tsx
import { Suspense } from '@philjs/ssr';

function App() {
  return (
    <div>
      <h1>My App</h1>
      <Suspense fallback={<div>Loading user data...</div>}>
        <AsyncUserProfile />
      </Suspense>
    </div>
  );
}
```

**How It Works**

1. Renders fallback immediately
2. Starts loading async component
3. Injects resolved content via script tag
4. Client replaces fallback with real content

**Client Runtime**

```html
<div id="phil-suspense-0">Loading user data...</div>
<script>
  __phil_inject('0', '<div class="user-profile">...</div>');
</script>
```

### streamHTML()

Create a readable stream from async HTML chunks.

```ts
import { streamHTML } from '@philjs/ssr';

function streamHTML(
  parts: AsyncIterable<string>
): ReadableStream<Uint8Array>
```

**Example**

```ts
async function* generateHTML() {
  yield '<html><body>';
  yield '<h1>Welcome</h1>';
  const data = await fetchData();
  yield `<p>${data.content}</p>`;
  yield '</body></html>';
}

const stream = streamHTML(generateHTML());

return new Response(stream, {
  headers: { 'Content-Type': 'text/html' }
});
```

---

## Data Serialization

### Automatic Serialization

The SSR handler automatically serializes route data:

```ts
// Server
window.__PHILJS_ROUTE_DATA__[pathname] = loaderData;
window.__PHILJS_ROUTE_ERROR__[pathname] = loaderError;
window.__PHILJS_ROUTE_INFO__.current = { params, url };
```

**Example HTML Output**

```html
<script>
  window.__PHILJS_ROUTE_DATA__ = {
    "/products/123": {
      product: { id: "123", name: "Widget", price: 29.99 }
    }
  };
  window.__PHILJS_ROUTE_INFO__ = {
    current: { params: { id: "123" }, url: "/products/123" }
  };
</script>
```

### Manual Serialization

#### serializeState()

Serialize state to base64 for embedding in HTML.

```ts
import { serializeState } from '@philjs/ssr';

function serializeState(obj: unknown): string
```

**Example**

```ts
const state = { user: { id: 1, name: 'Alice' } };
const serialized = serializeState(state);

const html = `
  <div data-state="${serialized}">
    <!-- Component HTML -->
  </div>
`;
```

#### deserializeState()

Deserialize state from base64.

```ts
import { deserializeState } from '@philjs/ssr';

function deserializeState(b64: string): unknown
```

**Example**

```ts
const element = document.querySelector('[data-state]');
const b64 = element.getAttribute('data-state');
const state = deserializeState(b64);

console.log(state); // { user: { id: 1, name: 'Alice' } }
```

### Safe Serialization

Always escape user data to prevent XSS:

```ts
function serializeData(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const html = `
  <script>
    window.__INITIAL_DATA__ = ${serializeData(userData)};
  </script>
`;
```

---

## Best Practices

### 1. Hydration Best Practices

**Match Server and Client**

```tsx
// ✅ Good - consistent rendering
function GoodComponent({ data }) {
  return <div>{data.title}</div>;
}

// ❌ Bad - different on server vs client
function BadComponent() {
  const isClient = typeof window !== 'undefined';
  return isClient ? <ClientView /> : <ServerView />;
}
```

**Avoid Browser APIs During SSR**

```tsx
// ❌ Bad - crashes on server
function BadComponent() {
  const width = window.innerWidth;
  return <div>Width: {width}</div>;
}

// ✅ Good - checks environment
function GoodComponent() {
  const [width, setWidth] = signal(0);

  effect(() => {
    if (typeof window === 'undefined') return;

    setWidth(window.innerWidth);
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  });

  return <div>Width: {width()}</div>;
}
```

**Use Stable IDs**

```tsx
// ❌ Bad - unstable ID
function BadComponent() {
  const id = Math.random();
  return <div id={id}>Content</div>;
}

// ✅ Good - stable ID
let counter = 0;
function GoodComponent() {
  const [id] = signal(`item-${counter++}`);
  return <div id={id()}>Content</div>;
}
```

### 2. Performance Best Practices

**Minimize Initial Bundle**

```tsx
// ✅ Use islands for interactivity
<StaticContent />
<ServerIsland defer="visible">
  <InteractiveWidget />
</ServerIsland>
```

**Stream for Faster TTFB**

```tsx
// ✅ Stream slow content
const stream = await renderToStreamingResponse(
  <App>
    <Suspense fallback={<Loading />}>
      <SlowData />
    </Suspense>
  </App>
);
```

**Cache Strategically**

```tsx
// ✅ Cache with appropriate TTL
<ServerIsland
  cache={{
    ttl: 3600,              // 1 hour for product data
    swr: 7200,              // Serve stale for 2 hours
    tags: ['products']
  }}
>
  <ProductList />
</ServerIsland>
```

### 3. SEO Best Practices

**Include Meta Tags**

```tsx
function BlogPost({ post }) {
  return (
    <>
      <head>
        <title>{post.title}</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:image" content={post.image} />
      </head>
      <article>{/* content */}</article>
    </>
  );
}
```

**Add Structured Data**

```tsx
function Product({ product }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    price: product.price,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div>{/* product UI */}</div>
    </>
  );
}
```

### 4. Error Handling Best Practices

**Use Error Boundaries**

```tsx
import { ErrorBoundary } from '@philjs/core';

function App() {
  return (
    <ErrorBoundary fallback={(error) => <ErrorPage error={error} />}>
      <Router />
    </ErrorBoundary>
  );
}
```

**Handle Loader Errors**

```tsx
// routes.ts
export const routes = [
  {
    path: '/products/:id',
    loader: async ({ params }) => {
      try {
        const product = await fetchProduct(params.id);
        return Ok(product);
      } catch (error) {
        return Err({ message: 'Product not found', status: 404 });
      }
    },
    component: ({ data, error }) => {
      if (error) return <ErrorDisplay error={error} />;
      return <ProductPage product={data} />;
    }
  }
];
```

### 5. Security Best Practices

**Escape User Data**

```tsx
// ✅ Automatic escaping
function SafeComponent({ userInput }) {
  return <div>{userInput}</div>; // Automatically escaped
}

// ⚠️ Use with caution
function UnsafeComponent({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

**Sanitize Serialized Data**

```tsx
function serializeData(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}
```

---

## Related Documentation

- [Router API](./router.md) - Route definitions and navigation
- [Data Fetching](./data.md) - Loaders and mutations
- [SSR Guide](../advanced/ssr.md) - SSR setup and patterns
- [Islands Guide](../advanced/islands.md) - Islands architecture
- [PPR Guide](../advanced/ppr.md) - Partial pre-rendering patterns
- [Performance](../best-practices/performance.md) - Optimization strategies



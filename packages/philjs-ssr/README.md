# philjs-ssr

Server-side rendering with streaming, loaders, actions, and resumability for PhilJS.

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

- **Streaming SSR** - Progressive HTML streaming with Suspense boundaries
- **Data loaders** - Type-safe data fetching before rendering
- **Form actions** - Server-side form handling with redirects
- **Static generation** - SSG, ISR, and mixed rendering modes
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

- **SSG** - Static Site Generation (pre-render at build time)
- **ISR** - Incremental Static Regeneration (refresh static pages periodically)
- **SSR** - Server-Side Rendering (render on each request)
- **CSR** - Client-Side Rendering (hydrate on the client)

Mix and match modes per route for optimal performance.

## License

MIT

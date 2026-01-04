# @philjs/meta

The `@philjs/meta` package provides a full-featured meta-framework for PhilJS with file-based routing, data loading, SSR/SSG support, and SEO utilities.

## Installation

```bash
npm install @philjs/meta
```

## Features

- **File-Based Routing** - Automatic routes from file system
- **Nested Layouts** - Layout composition with parallel slots
- **Data Loading** - Loaders and actions for data fetching
- **SSR/SSG/ISR** - Multiple rendering strategies
- **API Routes** - Built-in API handler
- **Middleware** - Request processing pipeline
- **Caching** - SWR and cache revalidation
- **SEO** - Meta tags, Open Graph, sitemaps

## Quick Start

```typescript
// philjs.config.ts
import { defineConfig } from '@philjs/meta';

export default defineConfig({
  srcDir: 'src',
  routesDir: 'routes',
  ssr: true,
  output: 'hybrid',
});
```

```
src/routes/
├── +layout.tsx          # Root layout
├── +page.tsx            # Home page (/)
├── about/
│   └── +page.tsx        # About page (/about)
├── blog/
│   ├── +layout.tsx      # Blog layout
│   ├── +page.tsx        # Blog index (/blog)
│   └── [slug]/
│       └── +page.tsx    # Blog post (/blog/:slug)
└── api/
    └── users/
        └── +server.ts   # API route (/api/users)
```

---

## File-Based Routing

### Route Files

```typescript
import { createFileRouter, generateRouteManifest } from '@philjs/meta';
import type { FileRouterOptions, RouteManifest } from '@philjs/meta';

const router = createFileRouter({
  routesDir: 'src/routes',
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  paramPrefix: '[',
  paramSuffix: ']',
  catchAllPrefix: '[...',
  groupPrefix: '(',
  groupSuffix: ')',
});

// Generate manifest
const manifest: RouteManifest = generateRouteManifest(router);
```

### Route Patterns

| Pattern | Example | Matches |
|---------|---------|---------|
| Static | `about/+page.tsx` | `/about` |
| Dynamic | `[id]/+page.tsx` | `/123`, `/abc` |
| Catch-all | `[...slug]/+page.tsx` | `/a/b/c` |
| Optional | `[[lang]]/+page.tsx` | `/`, `/en` |
| Groups | `(auth)/login/+page.tsx` | `/login` |

### Route Matching

```typescript
import { matchRoute, matchApiRoute } from '@philjs/meta';

// Match page routes
const match = matchRoute('/blog/hello-world', manifest);
console.log(match);
// { route: RouteDefinition, params: { slug: 'hello-world' } }

// Match API routes
const apiMatch = matchApiRoute('/api/users/123', manifest);
```

---

## Layouts

### Creating Layouts

```typescript
// routes/+layout.tsx
import { createLayoutTree } from '@philjs/meta';
import type { LayoutProps } from '@philjs/meta';

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// routes/dashboard/+layout.tsx
export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div class="dashboard">
      <Sidebar />
      <div class="content">{children}</div>
    </div>
  );
}
```

### Error Boundaries

```typescript
// routes/+error.tsx
import { createErrorBoundary } from '@philjs/meta';
import type { ErrorBoundaryProps } from '@philjs/meta';

export default function ErrorPage({ error, reset }: ErrorBoundaryProps) {
  return (
    <div class="error-page">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Loading States

```typescript
// routes/dashboard/+loading.tsx
import { createLoadingWrapper } from '@philjs/meta';
import type { LoadingProps } from '@philjs/meta';

export default function DashboardLoading() {
  return (
    <div class="loading">
      <Spinner />
      <p>Loading dashboard...</p>
    </div>
  );
}
```

### Parallel Routes

```typescript
// routes/dashboard/+layout.tsx
import { getParallelSlots } from '@philjs/meta';
import type { ParallelRouteSlot } from '@philjs/meta';

export default function DashboardLayout({ children, slots }) {
  return (
    <div class="dashboard">
      <div class="main">{children}</div>
      <div class="sidebar">{slots.sidebar}</div>
      <div class="notifications">{slots.notifications}</div>
    </div>
  );
}

// routes/dashboard/@sidebar/+page.tsx
export default function Sidebar() {
  return <nav>...</nav>;
}

// routes/dashboard/@notifications/+page.tsx
export default function Notifications() {
  return <NotificationList />;
}
```

---

## Data Loading

### Loaders

```typescript
// routes/blog/[slug]/+page.tsx
import { defineLoader, useLoaderData } from '@philjs/meta';
import type { LoaderContext, LoaderFunction } from '@philjs/meta';

export const loader: LoaderFunction = defineLoader(async ({ params }) => {
  const post = await db.posts.findBySlug(params.slug);
  if (!post) {
    throw new Response('Not found', { status: 404 });
  }
  return { post };
});

export default function BlogPost() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### Actions

```typescript
// routes/contact/+page.tsx
import { defineAction, useActionData, useIsSubmitting } from '@philjs/meta';
import type { ActionContext, ActionFunction } from '@philjs/meta';

export const action: ActionFunction = defineAction(async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get('email');
  const message = formData.get('message');

  const errors: ActionErrors = {};
  if (!email) errors.email = 'Email is required';
  if (!message) errors.message = 'Message is required';

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  await sendEmail({ email, message });
  return { success: true };
});

export default function Contact() {
  const actionData = useActionData<typeof action>();
  const isSubmitting = useIsSubmitting();

  return (
    <form method="post">
      <input name="email" type="email" />
      {actionData()?.errors?.email && <span>{actionData().errors.email}</span>}

      <textarea name="message" />
      {actionData()?.errors?.message && <span>{actionData().errors.message}</span>}

      <button type="submit" disabled={isSubmitting()}>
        {isSubmitting() ? 'Sending...' : 'Send'}
      </button>

      {actionData()?.success && <p>Message sent!</p>}
    </form>
  );
}
```

### Server Context

```typescript
import { createServerContext, json, redirect, defer } from '@philjs/meta';
import type { ServerContext, CookieStore } from '@philjs/meta';

export const loader = defineLoader(async (context: LoaderContext) => {
  // Access cookies
  const session = context.cookies.get('session');

  // Set cookies
  context.cookies.set('visited', 'true', { maxAge: 86400 });

  // Access headers
  const userAgent = context.request.headers.get('user-agent');

  // JSON response
  return json({ data: 'value' });

  // Redirect
  return redirect('/login');

  // Deferred data
  return defer({
    fastData: await getFastData(),
    slowData: getSlowData(), // Promise - streams later
  });
});
```

### Hooks

```typescript
import { useParams, useSearchParams, setRouteContext, getRouteKey } from '@philjs/meta';

function Page() {
  // Route parameters
  const params = useParams();
  console.log(params().slug);

  // Search parameters
  const [searchParams, setSearchParams] = useSearchParams();
  console.log(searchParams().get('page'));

  // Update search params
  setSearchParams({ page: '2' });
}
```

---

## Caching

### Cache Functions

```typescript
import { cached, cache, unstable_cache } from '@philjs/meta';
import type { CacheOptions } from '@philjs/meta';

// Cache a function
const getCachedPosts = cached(
  async () => {
    return db.posts.findMany();
  },
  { revalidate: 60 } // 60 seconds
);

// React-style cache
const getPosts = cache(async () => {
  return db.posts.findMany();
});

// Next.js-style unstable_cache
const getPostsWithTags = unstable_cache(
  async () => db.posts.findMany(),
  ['posts'],
  { revalidate: 3600, tags: ['posts'] }
);
```

### SWR (Stale-While-Revalidate)

```typescript
import { useSWR } from '@philjs/meta';
import type { SWRConfig, SWRState } from '@philjs/meta';

function PostList() {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    '/api/posts',
    async (url) => {
      const response = await fetch(url);
      return response.json();
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
      dedupingInterval: 2000,
    }
  );

  if (isLoading()) return <Loading />;
  if (error()) return <Error error={error()} />;

  return (
    <ul>
      {data().map(post => <li key={post.id}>{post.title}</li>)}
    </ul>
  );
}
```

### Revalidation

```typescript
import { revalidatePath, revalidateTag, cacheControl } from '@philjs/meta';

// In an action
export const action = defineAction(async ({ request }) => {
  await db.posts.create(formData);

  // Revalidate specific path
  revalidatePath('/blog');

  // Revalidate by tag
  revalidateTag('posts');

  return { success: true };
});

// Cache control headers
export const loader = defineLoader(async () => {
  cacheControl({
    public: true,
    maxAge: 60,
    staleWhileRevalidate: 3600,
  });

  return { data };
});
```

### ISR (Incremental Static Regeneration)

```typescript
import { ISRManager } from '@philjs/meta';
import type { ISRConfig } from '@philjs/meta';

const isr = new ISRManager({
  revalidate: 60,
  fallback: 'blocking',
  onRevalidate: (path) => {
    console.log(`Revalidated: ${path}`);
  },
});

// Register paths for ISR
isr.registerPath('/blog/:slug', {
  getStaticPaths: async () => {
    const posts = await db.posts.findMany();
    return posts.map(p => ({ params: { slug: p.slug } }));
  },
  revalidate: 300,
});
```

---

## Middleware

### Creating Middleware

```typescript
import { createMiddlewareContext, MiddlewareChain, NextResponse } from '@philjs/meta';
import type { MiddlewareFunction, MiddlewareContext } from '@philjs/meta';

const middleware: MiddlewareFunction = async (context, next) => {
  // Before request
  console.log('Request:', context.request.url);

  // Modify headers
  context.request.headers.set('X-Custom', 'value');

  // Continue to next middleware
  const response = await next();

  // After request
  response.headers.set('X-Response-Time', Date.now().toString());

  return response;
};

// Create chain
const chain = new MiddlewareChain();
chain.use(middleware);
chain.use(anotherMiddleware);
```

### Built-in Middleware

```typescript
import { cors, auth, rateLimit, securityHeaders, logger, compression } from '@philjs/meta';

// CORS
chain.use(cors({
  origin: ['https://example.com'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Authentication
chain.use(auth({
  secret: process.env.JWT_SECRET,
  exclude: ['/api/public/*'],
}));

// Rate limiting
chain.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests',
}));

// Security headers
chain.use(securityHeaders({
  contentSecurityPolicy: true,
  xssFilter: true,
  noSniff: true,
}));

// Logging
chain.use(logger({
  format: 'combined',
  skip: (req) => req.url.includes('/health'),
}));

// Compression
chain.use(compression({
  level: 6,
  threshold: 1024,
}));
```

---

## API Routes

### Creating API Routes

```typescript
// routes/api/users/+server.ts
import { createAPIRoute, defineAPIHandler, APIResponse } from '@philjs/meta';
import type { APIHandler, APIContext } from '@philjs/meta';

export const GET: APIHandler = defineAPIHandler(async ({ params, request }) => {
  const users = await db.users.findMany();
  return APIResponse.json(users);
});

export const POST: APIHandler = defineAPIHandler(async ({ request }) => {
  const body = await request.json();
  const user = await db.users.create(body);
  return APIResponse.json(user, { status: 201 });
});
```

### With Validation

```typescript
import { defineAPIHandler, z, parseBody } from '@philjs/meta';
import type { Schema } from '@philjs/meta';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
});

export const POST = defineAPIHandler(async ({ request }) => {
  const body = await parseBody(request, CreateUserSchema);

  if (body.errors) {
    return APIResponse.json({ errors: body.errors }, { status: 400 });
  }

  const user = await db.users.create(body.data);
  return APIResponse.json(user, { status: 201 });
});
```

### Server-Sent Events

```typescript
import { SSE } from '@philjs/meta';
import type { SSEStream, SSEEvent } from '@philjs/meta';

export const GET: APIHandler = async ({ request }) => {
  const stream = new SSE();

  // Send events
  stream.send({ event: 'connected', data: { userId: '123' } });

  // Subscribe to updates
  const unsubscribe = events.subscribe((event) => {
    stream.send({ event: 'update', data: event });
  });

  // Cleanup on close
  request.signal.addEventListener('abort', () => {
    unsubscribe();
    stream.close();
  });

  return stream.response();
};
```

---

## SEO

### Meta Tags

```typescript
import { HeadProvider, Head, Meta, Title, Link } from '@philjs/meta';

function App({ children }) {
  return (
    <HeadProvider>
      <Head>
        <Title>My App</Title>
        <Meta name="description" content="My awesome app" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Link rel="canonical" href="https://example.com" />
      </Head>
      {children}
    </HeadProvider>
  );
}
```

### SEO Component

```typescript
import { SEO, OpenGraph, TwitterCard, JSONLD } from '@philjs/meta';

function BlogPost({ post }) {
  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`https://example.com/blog/${post.slug}`}
      />

      <OpenGraph
        type="article"
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
        url={`https://example.com/blog/${post.slug}`}
      />

      <TwitterCard
        card="summary_large_image"
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
      />

      <JSONLD
        type="BlogPosting"
        data={{
          headline: post.title,
          datePublished: post.publishedAt,
          author: { name: post.author.name },
        }}
      />

      <article>{post.content}</article>
    </>
  );
}
```

### Sitemap Generation

```typescript
import { generateSitemap, generateSitemapIndex, generateRobotsTxt } from '@philjs/meta';

// Generate sitemap
const sitemap = await generateSitemap({
  baseUrl: 'https://example.com',
  routes: [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/about', changefreq: 'monthly', priority: 0.8 },
    ...blogPosts.map(post => ({
      path: `/blog/${post.slug}`,
      lastmod: post.updatedAt,
      changefreq: 'weekly',
      priority: 0.6,
    })),
  ],
});

// Generate sitemap index
const sitemapIndex = generateSitemapIndex({
  baseUrl: 'https://example.com',
  sitemaps: [
    { loc: '/sitemap-pages.xml', lastmod: new Date() },
    { loc: '/sitemap-blog.xml', lastmod: new Date() },
  ],
});

// Generate robots.txt
const robots = generateRobotsTxt({
  sitemaps: ['https://example.com/sitemap.xml'],
  allow: ['/'],
  disallow: ['/admin', '/api'],
});
```

---

## Configuration

### Full Config

```typescript
import { defineConfig, loadConfig, validateConfig } from '@philjs/meta';
import type { PhilJSConfig } from '@philjs/meta';

export default defineConfig({
  // Build
  srcDir: 'src',
  outDir: 'dist',
  routesDir: 'routes',
  publicDir: 'public',

  // Server
  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  // SSR/SSG
  ssr: true,
  output: 'hybrid', // 'static' | 'server' | 'hybrid'

  // Images
  images: {
    domains: ['example.com'],
    formats: ['webp', 'avif'],
  },

  // I18n
  i18n: {
    locales: ['en', 'es', 'de'],
    defaultLocale: 'en',
    routing: 'prefix',
  },

  // Headers & Redirects
  headers: [
    { source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] },
  ],
  redirects: [
    { source: '/old', destination: '/new', permanent: true },
  ],

  // Experimental
  experimental: {
    ppr: true,
    serverActions: true,
  },
});
```

---

## API Reference

### Router

| Export | Description |
|--------|-------------|
| `createFileRouter` | Create file-based router |
| `generateRouteManifest` | Generate route manifest |
| `matchRoute` | Match URL to route |
| `matchApiRoute` | Match API route |

### Layouts

| Export | Description |
|--------|-------------|
| `createLayoutTree` | Build layout tree |
| `getLayoutsForRoute` | Get layouts for path |
| `getParallelSlots` | Get parallel route slots |
| `createErrorBoundary` | Create error boundary |
| `createLoadingWrapper` | Create loading wrapper |

### Data Loading

| Export | Description |
|--------|-------------|
| `defineLoader` | Define loader function |
| `defineAction` | Define action function |
| `useLoaderData` | Get loader data |
| `useActionData` | Get action data |
| `useIsSubmitting` | Get submission state |
| `useParams` | Get route params |
| `useSearchParams` | Get search params |
| `json` | JSON response |
| `redirect` | Redirect response |
| `defer` | Deferred response |

### Caching

| Export | Description |
|--------|-------------|
| `cached` | Cache function result |
| `useSWR` | SWR hook |
| `revalidatePath` | Revalidate path |
| `revalidateTag` | Revalidate by tag |
| `cacheControl` | Set cache headers |
| `ISRManager` | ISR management |

### Middleware

| Export | Description |
|--------|-------------|
| `MiddlewareChain` | Middleware chain |
| `NextResponse` | Response helper |
| `cors` | CORS middleware |
| `auth` | Auth middleware |
| `rateLimit` | Rate limit middleware |
| `securityHeaders` | Security headers |
| `logger` | Logging middleware |
| `compression` | Compression middleware |

### SEO

| Export | Description |
|--------|-------------|
| `HeadProvider` | Head context provider |
| `Head` | Head container |
| `Meta` | Meta tag |
| `Title` | Title tag |
| `SEO` | SEO component |
| `OpenGraph` | Open Graph tags |
| `TwitterCard` | Twitter Card tags |
| `JSONLD` | JSON-LD structured data |
| `generateSitemap` | Generate sitemap |
| `generateRobotsTxt` | Generate robots.txt |

---

## Next Steps

- [File-Based Routing Guide](../../routing/overview.md)
- [SSR and SSG](../../ssr/overview.md)
- [Data Loading Patterns](../../data/overview.md)

# Server-Side Rendering (SSR)

Render PhilJS applications on the server for better SEO and initial load performance.

## What You'll Learn

- SSR fundamentals
- Setting up SSR
- Hydration
- Streaming SSR
- Data fetching on server
- SEO optimization
- Best practices

## Why SSR?

Server-side rendering offers several benefits:

- **Better SEO**: Search engines can crawl fully rendered HTML
- **Faster First Paint**: Users see content immediately
- **Social Media Sharing**: Open Graph tags work correctly
- **Accessibility**: Content available without JavaScript
- **Performance**: Reduced Time to Interactive (TTI)

## Basic SSR Setup

### Server Entry Point

```typescript
// src/entry-server.ts
import { renderToString } from '@philjs/ssr';
import { App } from './App';

export async function render(url: string) {
  const html = await renderToString(<App url={url} />);

  return {
    html,
    head: {
      title: 'My PhilJS App',
      meta: [
        { name: 'description', content: 'A PhilJS SSR application' }
      ]
    }
  };
}
```

### Express Server

```typescript
// server.ts
import express from 'express';
import { render } from './dist/server/entry-server.js';

const app = express();

// Serve static assets
app.use('/assets', express.static('dist/client/assets'));

// SSR handler
app.get('*', async (req, res) => {
  try {
    const { html, head } = await render(req.url);

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${head.title}</title>
          ${head.meta.map(m =>
            `<meta name="${m.name}" content="${m.content}" />`
          ).join('\n')}
          <link rel="stylesheet" href="/assets/style.css" />
        </head>
        <body>
          <div id="app">${html}</div>
          <script type="module" src="/assets/entry-client.js"></script>
        </body>
      </html>
    `;

    res.status(200).set({ 'Content-Type': 'text/html' }).end(fullHtml);
  } catch (error) {
    console.error(error);
    res.status(500).end('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Client Entry Point

```typescript
// src/entry-client.ts
import { hydrate } from '@philjs/core';
import { App } from './App';

// Hydrate the server-rendered HTML
hydrate(<App url={window.location.pathname} />, document.getElementById('app')!);
```

## Hydration

Hydration makes server-rendered HTML interactive by attaching event listeners and reactive state.

### Basic Hydration

```typescript
import { hydrate, signal } from '@philjs/core';

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

// Server: renders static HTML
const html = renderToString(<Counter />);
// Output: <div><p>Count: 0</p><button>Increment</button></div>

// Client: hydrates and makes interactive
hydrate(<Counter />, document.getElementById('app')!);
// Now button clicks work!
```

### Hydration with Props

```typescript
import { hydrate } from '@philjs/core';

interface AppProps {
  url: string;
  initialData?: any;
}

function App({ url, initialData }: AppProps) {
  const data = signal(initialData || null);

  return (
    <div>
      <h1>Current URL: {url}</h1>
      {data() && <pre>{JSON.stringify(data(), null, 2)}</pre>}
    </div>
  );
}

// Server: pass props
const html = await renderToString(
  <App url={req.url} initialData={await fetchData()} />
);

// Client: hydrate with same props
const initialData = (window as any).__INITIAL_DATA__;
hydrate(
  <App url={window.location.pathname} initialData={initialData} />,
  document.getElementById('app')!
);
```

## Data Fetching on Server

### Fetch During Render

```typescript
import { renderToString } from '@philjs/ssr';
import { signal } from '@philjs/core';

async function UserProfile({ userId }: { userId: string }) {
  // Fetch on server
  const user = signal(await fetchUser(userId));

  return (
    <div>
      <h1>{user().name}</h1>
      <p>{user().email}</p>
    </div>
  );
}

// Server rendering waits for async operations
export async function render(url: string) {
  const html = await renderToString(<UserProfile userId="123" />);
  return { html };
}
```

### Pass Data to Client

```typescript
// server.ts
app.get('/users/:id', async (req, res) => {
  const user = await fetchUser(req.params.id);

  const { html } = await render(req.url);

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>...</head>
      <body>
        <div id="app">${html}</div>
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify({ user })};
        </script>
        <script type="module" src="/assets/entry-client.js"></script>
      </body>
    </html>
  `;

  res.send(fullHtml);
});
```

```typescript
// entry-client.ts
import { hydrate, signal } from '@philjs/core';

function UserProfile({ userId }: { userId: string }) {
  // Use server data if available
  const initialData = (window as any).__INITIAL_DATA__;
  const user = signal(initialData?.user || null);

  // Fetch client-side if no server data
  effect(() => {
    if (!user()) {
      fetchUser(userId).then(data => user.set(data));
    }
  });

  if (!user()) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user().name}</h1>
      <p>{user().email}</p>
    </div>
  );
}

hydrate(<UserProfile userId="123" />, document.getElementById('app')!);
```

## Streaming SSR

Stream HTML to the client as it's generated for faster Time to First Byte (TTFB).

### Basic Streaming

```typescript
import { renderToStream } from '@philjs/ssr';

app.get('*', async (req, res) => {
  res.set({ 'Content-Type': 'text/html' });

  // Send HTML header
  res.write(`
    <!DOCTYPE html>
    <html>
      <head>...</head>
      <body>
        <div id="app">
  `);

  // Stream app content
  const stream = renderToStream(<App url={req.url} />);

  stream.on('data', (chunk) => {
    res.write(chunk);
  });

  stream.on('end', () => {
    res.write(`
        </div>
        <script type="module" src="/assets/entry-client.js"></script>
      </body>
    </html>
    `);
    res.end();
  });

  stream.on('error', (error) => {
    console.error(error);
    res.status(500).end();
  });
});
```

### Streaming with Suspense

```typescript
import { Suspense, lazy } from '@philjs/core';
import { renderToStream } from '@philjs/ssr';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <div>
      <h1>My App</h1>

      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}

// Streaming sends HTML as components load
const stream = renderToStream(<App />);
```

## SEO Optimization

### Dynamic Meta Tags

```typescript
import { signal } from '@philjs/core';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

function SEO({ title, description, image, url }: SEOProps) {
  return (
    <head>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </head>
  );
}

// Usage
function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
        url={`https://example.com/blog/${post.slug}`}
      />

      <article>
        <h1>{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
```

### Structured Data

```typescript
interface StructuredDataProps {
  type: 'Article' | 'Product' | 'Organization';
  data: any;
}

function StructuredData({ type, data }: StructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Usage
function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <StructuredData
        type="Article"
        data={{
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage,
          datePublished: post.publishedAt,
          author: {
            '@type': 'Person',
            name: post.author.name
          }
        }}
      />

      <article>{/* ... */}</article>
    </>
  );
}
```

## Request Context

Access request information during SSR.

### Request Context Provider

```typescript
import { createContext, useContext, signal } from '@philjs/core';

interface RequestContext {
  url: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
}

const RequestContext = createContext<RequestContext | null>(null);

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequest must be used within RequestProvider');
  }
  return context;
}

function App({ request }: { request: RequestContext }) {
  return (
    <RequestContext.Provider value={request}>
      <Router />
    </RequestContext.Provider>
  );
}

// Usage in components
function UserGreeting() {
  const request = useRequest();
  const userName = request.cookies.userName || 'Guest';

  return <p>Welcome, {userName}!</p>;
}
```

## Error Handling

### Error Boundaries in SSR

```typescript
import { ErrorBoundary } from '@philjs/core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div>
          <h1>Something went wrong</h1>
          <pre>{error.message}</pre>
        </div>
      )}
    >
      <Router />
    </ErrorBoundary>
  );
}

// Server handles errors gracefully
try {
  const html = await renderToString(<App />);
  res.send(html);
} catch (error) {
  console.error('SSR Error:', error);
  res.status(500).send('Internal Server Error');
}
```

## Best Practices

### Avoid Browser APIs

```typescript
// ❌ Browser API on server (crashes)
function BadComponent() {
  const width = window.innerWidth; // Error: window is not defined
  return <div>Width: {width}</div>;
}

// ✅ Check environment
function GoodComponent() {
  const width = signal(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  effect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => width.set(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  });

  return <div>Width: {width()}</div>;
}
```

### Serialize Data Safely

```typescript
// ✅ Escape data to prevent XSS
function serializeData(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const fullHtml = `
  <script>
    window.__INITIAL_DATA__ = ${serializeData(data)};
  </script>
`;
```

### Minimize Server Bundle

```typescript
// ✅ Import only what's needed on server
// entry-server.ts
import { renderToString } from '@philjs/ssr';
import { App } from './App';

// Don't import client-only code
// import analytics from './analytics'; // ❌

export async function render(url: string) {
  return await renderToString(<App url={url} />);
}
```

### Cache Rendered Pages

```typescript
import LRU from 'lru-cache';

const cache = new LRU<string, string>({
  max: 500,
  ttl: 1000 * 60 * 5 // 5 minutes
});

app.get('*', async (req, res) => {
  const cacheKey = req.url;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.send(cached);
  }

  // Render
  const html = await render(req.url);

  // Cache
  cache.set(cacheKey, html);

  res.send(html);
});
```

## Summary

You've learned:

✅ SSR fundamentals and benefits
✅ Setting up SSR with Express
✅ Hydration on the client
✅ Streaming SSR for faster TTFB
✅ Data fetching on the server
✅ SEO optimization with meta tags
✅ Request context access
✅ Error handling in SSR
✅ Best practices for production SSR

SSR improves SEO and initial load performance!

---

**Next:** [Static Site Generation →](./ssg.md) Pre-render pages at build time

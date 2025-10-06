# SSR API

Server-side rendering APIs for PhilJS.

## renderToString()

Renders a component to an HTML string on the server.

### Signature

```typescript
function renderToString(component: JSX.Element): Promise<string>
```

### Parameters

- **component**: `JSX.Element` - The component to render

### Returns

`Promise<string>` - HTML string

### Examples

#### Basic SSR

```typescript
import { renderToString } from 'philjs-ssr';

async function handler(req, res) {
  const html = await renderToString(<App />);

  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
}
```

#### With Props

```typescript
const html = await renderToString(
  <App user={currentUser} theme="dark" />
);
```

#### With Data

```typescript
async function handler(req, res) {
  const data = await fetchData();

  const html = await renderToString(<App initialData={data} />);

  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app">${html}</div>
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(data)};
        </script>
        <script src="/client.js"></script>
      </body>
    </html>
  `;

  res.send(fullHTML);
}
```

### Notes

- Async - waits for all data loading
- Returns static HTML string
- No interactivity until hydration
- Use with `hydrate()` on client

---

## renderToStream()

Streams HTML to the client as it's generated.

### Signature

```typescript
import { Readable } from 'stream';

function renderToStream(
  component: JSX.Element,
  options?: StreamOptions
): Readable
```

### Parameters

- **component**: `JSX.Element` - Component to render
- **options**: `StreamOptions` - Stream configuration (optional)

### Returns

Node.js `Readable` stream

### StreamOptions

```typescript
interface StreamOptions {
  onShellReady?: () => void;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
}
```

### Examples

#### Basic Streaming

```typescript
import { renderToStream } from 'philjs-ssr';

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');

  res.write('<!DOCTYPE html><html><body><div id="app">');

  const stream = renderToStream(<App />);

  stream.pipe(res, { end: false });

  stream.on('end', () => {
    res.write('</div><script src="/client.js"></script></body></html>');
    res.end();
  });
});
```

#### With Suspense

```typescript
const stream = renderToStream(<App />, {
  onShellReady: () => {
    // Shell (non-suspended parts) ready
    console.log('Shell ready to stream');
  },
  onAllReady: () => {
    // Everything ready (including Suspense content)
    console.log('All content ready');
  },
  onError: (error) => {
    console.error('SSR error:', error);
  }
});
```

### Notes

- Faster Time to First Byte (TTFB)
- Streams shell immediately
- Suspense boundaries stream when ready
- Better for large pages

---

## renderToStaticMarkup()

Renders to static HTML without hydration markers.

### Signature

```typescript
function renderToStaticMarkup(component: JSX.Element): Promise<string>
```

### Parameters

- **component**: `JSX.Element` - Component to render

### Returns

`Promise<string>` - Static HTML string

### Examples

```typescript
import { renderToStaticMarkup } from 'philjs-ssr';

// For emails, PDFs, or static content
const emailHTML = await renderToStaticMarkup(<EmailTemplate />);

sendEmail({
  to: user.email,
  html: emailHTML
});
```

### Notes

- No hydration markers
- Smaller HTML output
- Cannot be hydrated on client
- Use for truly static content

---

## hydrate()

Hydrates server-rendered HTML on the client.

### Signature

```typescript
function hydrate(
  component: JSX.Element,
  container: HTMLElement
): void
```

### Parameters

- **component**: `JSX.Element` - Component matching server render
- **container**: `HTMLElement` - Container with server HTML

### Examples

#### Basic Hydration

```typescript
// Client entry point
import { hydrate } from 'philjs-core';

hydrate(<App />, document.getElementById('app')!);
```

#### With Initial Data

```typescript
const initialData = (window as any).__INITIAL_DATA__;

hydrate(
  <App initialData={initialData} />,
  document.getElementById('app')!
);
```

### Notes

- Must match server component exactly
- Attaches event listeners
- Makes app interactive
- Warns on mismatches in development

---

## Server Functions

Execute functions on the server from the client.

### createServerFunction()

```typescript
function createServerFunction<T extends (...args: any[]) => any>(
  fn: T
): T
```

### Examples

#### Define Server Function

```typescript
// server/functions.ts
import { createServerFunction } from 'philjs-ssr';

export const getUser = createServerFunction(async (id: string) => {
  const user = await db.users.findById(id);
  return user;
});

export const updateProfile = createServerFunction(
  async (userId: string, data: ProfileData) => {
    await db.users.update(userId, data);
    return { success: true };
  }
);
```

#### Use in Component

```typescript
import { getUser } from './server/functions';

function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);

  effect(async () => {
    const data = await getUser(userId);
    user.set(data);
  });

  return <div>{user()?.name}</div>;
}
```

### Notes

- Functions run on server only
- Automatically serialized
- Type-safe RPC calls
- Secure by default

---

## Headers and Cookies

### useRequest()

Access request data in components.

```typescript
interface RequestContext {
  headers: Headers;
  cookies: Map<string, string>;
  url: URL;
}

function useRequest(): RequestContext
```

### Examples

```typescript
function Component() {
  const request = useRequest();

  const userAgent = request.headers.get('user-agent');
  const sessionId = request.cookies.get('sessionId');

  return (
    <div>
      <p>User Agent: {userAgent}</p>
      <p>Session: {sessionId}</p>
    </div>
  );
}
```

---

## Static Generation

### generateStaticParams()

Generate paths for static generation.

```typescript
interface StaticParams {
  params: Record<string, string>;
}

function generateStaticParams(): Promise<StaticParams[]>
```

### Examples

```typescript
// Generate static pages for all blog posts
export async function generateStaticParams() {
  const posts = await fetchAllPosts();

  return posts.map(post => ({
    params: { slug: post.slug }
  }));
}

// Used during build
export async function getStaticProps({ params }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post }
  };
}
```

---

## Suspense and Streaming

### Using Suspense in SSR

```typescript
import { Suspense } from 'philjs-core';

function App() {
  return (
    <div>
      <Header />

      <Suspense fallback={<Loading />}>
        <AsyncContent />
      </Suspense>

      <Footer />
    </div>
  );
}

// Server streams:
// 1. Header and Footer immediately
// 2. Loading fallback
// 3. AsyncContent when ready
```

### Nested Suspense

```typescript
<Suspense fallback={<AppLoading />}>
  <Layout>
    <Suspense fallback={<SidebarLoading />}>
      <Sidebar />
    </Suspense>

    <Suspense fallback={<ContentLoading />}>
      <Content />
    </Suspense>
  </Layout>
</Suspense>
```

---

## Error Handling

### Server-Side Error Boundaries

```typescript
import { ErrorBoundary } from 'philjs-core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error) => <ServerError error={error} />}
      onError={(error) => {
        logError(error);
      }}
    >
      <Routes />
    </ErrorBoundary>
  );
}
```

### Handle SSR Errors

```typescript
app.get('*', async (req, res) => {
  try {
    const html = await renderToString(<App />);
    res.send(wrapHTML(html));
  } catch (error) {
    console.error('SSR Error:', error);

    // Send fallback HTML
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Something went wrong</h1>
          <script src="/client.js"></script>
        </body>
      </html>
    `);
  }
});
```

---

## Meta Tags

### Set Meta Tags During SSR

```typescript
interface HeadProps {
  title: string;
  description: string;
  image?: string;
}

function Head({ title, description, image }: HeadProps) {
  return (
    <head>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </head>
  );
}

// Usage
function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <Head
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
      />

      <article>{post.content}</article>
    </>
  );
}
```

---

## Best Practices

### Serialize Data Safely

```typescript
// ✅ Escape data to prevent XSS
function serializeData(data: any): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const html = `
  <script>
    window.__DATA__ = ${serializeData(data)};
  </script>
`;
```

### Avoid Browser APIs

```typescript
// ❌ Crashes on server
function Component() {
  const width = window.innerWidth;
}

// ✅ Check environment
function Component() {
  const width = signal(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
}
```

### Use Streaming for Large Pages

```typescript
// ✅ Stream for better TTFB
const stream = renderToStream(<App />);

// ❌ String waits for everything
const html = await renderToString(<App />);
```

### Handle Errors Gracefully

```typescript
// ✅ Always have fallback
try {
  const html = await renderToString(<App />);
  res.send(wrapHTML(html));
} catch (error) {
  res.status(500).send(fallbackHTML);
}
```

---

**Complete!** You now have comprehensive API documentation for PhilJS.

Return to [API Reference Overview](./overview.md) for navigation.

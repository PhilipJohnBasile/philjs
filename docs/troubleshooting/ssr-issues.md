# SSR Issues

Complete guide to troubleshooting Server-Side Rendering issues in PhilJS applications.

## Understanding SSR in PhilJS

Server-Side Rendering (SSR) means rendering your application on the server to send fully-formed HTML to the client. PhilJS supports SSR with features like:

- `renderToString()` - Synchronous rendering
- `renderToStream()` - Streaming rendering
- `hydrate()` - Client-side hydration
- Resumability - Serialize and resume state

## Common SSR Issues

### 1. Window/Document Not Defined

**Error:**
```
ReferenceError: window is not defined
ReferenceError: document is not defined
ReferenceError: navigator is not defined
```

**Problem:** Using browser APIs on the server.

```tsx
// Problem: Browser APIs don't exist on server
function Component() {
  const width = window.innerWidth; // Error on server!

  return <div>Width: {width}</div>;
}
```

**Solution:** Check environment before using browser APIs.

```tsx
// Solution 1: Environment check
function Component() {
  const [width, setWidth] = signal(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  effect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  });

  return <div>Width: {width()}</div>;
}

// Solution 2: Client-only component
import { ClientOnly } from './ClientOnly';

function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <ClientOnly>
        <BrowserSpecificComponent />
      </ClientOnly>
    </div>
  );
}

// ClientOnly.tsx
function ClientOnly({ children }: { children: any }) {
  const [mounted, setMounted] = signal(false);

  effect(() => {
    setMounted(true);
  });

  return mounted() ? children : null;
}

// Solution 3: Lazy load client components
import { lazy, Suspense } from '@philjs/core';

const ClientComponent = lazy(() => import('./ClientComponent'));

function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientComponent />
    </Suspense>
  );
}
```

### 2. Data Fetching in SSR

**Problem:** Data not loaded on server or not passed to client.

```tsx
// Problem: Data fetched in effect (client-only)
function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);

  effect(async () => {
    const data = await fetchUser(userId);
    user.set(data);
  });

  // On server, user is null!
  return <div>{user()?.name}</div>;
}
```

**Solution:** Use data loaders or pass initial data.

```tsx
// Solution 1: Data loader
import { createQuery } from '@philjs/core';

export const userLoader = createQuery(async (userId: string) => {
  return await fetchUser(userId);
});

function UserProfile({ userId }: { userId: string }) {
  const user = userLoader(userId);

  if (user.loading()) return <div>Loading...</div>;
  if (user.error()) return <div>Error!</div>;

  return <div>{user()?.name}</div>;
}

// Solution 2: Pass initial data from server
// On server
const initialData = await fetchUser(userId);

const html = await renderToString(
  <UserProfile user={initialData} />
);

const page = `
  <!DOCTYPE html>
  <html>
    <body>
      <div id="app">${html}</div>
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify({ user: initialData })};
      </script>
      <script src="/client.js"></script>
    </body>
  </html>
`;

// On client
const initialData = window.__INITIAL_DATA__;

hydrate(
  <UserProfile user={initialData.user} />,
  document.getElementById('app')!
);

// Solution 3: Use resource
import { resource } from '@philjs/core';

function UserProfile({ userId, initialData }: { userId: string; initialData?: User }) {
  const user = resource(
    () => fetchUser(userId),
    { initialValue: initialData }
  );

  if (user.loading()) return <div>Loading...</div>;
  return <div>{user()?.name}</div>;
}
```

### 3. Streaming SSR Issues

**Problem:** Streaming not working or hanging.

```tsx
// Problem: Not handling errors in stream
async function handleRequest(req: Request) {
  const stream = renderToStream(<App />);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
```

**Solution:** Handle errors and configure properly.

```tsx
// Solution: Proper streaming setup
import { renderToStream } from '@philjs/core';

async function handleRequest(req: Request) {
  try {
    const stream = renderToStream(<App />, {
      onError: (error) => {
        console.error('SSR Error:', error);
      },
      onShellReady: () => {
        console.log('Shell ready, starting stream');
      },
      onAllReady: () => {
        console.log('All content ready');
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error) {
    console.error('Fatal SSR error:', error);

    return new Response('Internal Server Error', {
      status: 500
    });
  }
}
```

### 4. State Serialization Issues

**Problem:** State not preserved between server and client.

```tsx
// Problem: State lost during hydration
function Counter() {
  const count = signal(10); // Resets to 10 on client!

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>+</button>
    </div>
  );
}
```

**Solution:** Serialize state from server.

```tsx
// Solution: Use resumability
import { initResumability, registerState } from '@philjs/core';

// On server
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const count = signal(initialCount);
  registerState('counter', { count: count() });

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>+</button>
    </div>
  );
}

// Serialize state
const state = getResumableState();
const serialized = serializeResumableState(state);

const html = `
  <!DOCTYPE html>
  <html>
    <body>
      <div id="app">${appHtml}</div>
      <script>
        window.__RESUMABLE_STATE__ = ${serialized};
      </script>
      <script src="/client.js"></script>
    </body>
  </html>
`;

// On client
import { resume } from '@philjs/core';

const state = window.__RESUMABLE_STATE__;
resume(state);

hydrate(<Counter />, document.getElementById('app')!);
```

### 5. CSS-in-JS Issues

**Problem:** Styles not appearing or mismatched.

```tsx
// Problem: Styles calculated on client only
function StyledComponent() {
  const styles = {
    color: window.innerWidth > 768 ? 'blue' : 'red' // Error on server!
  };

  return <div style={styles}>Content</div>;
}
```

**Solution:** Extract CSS or use SSR-compatible styling.

```tsx
// Solution 1: Static styles
const styles = {
  color: 'blue',
  fontSize: '16px'
};

function StyledComponent() {
  return <div style={styles}>Content</div>;
}

// Solution 2: CSS modules
import styles from './Component.module.css';

function StyledComponent() {
  return <div className={styles.container}>Content</div>;
}

// Solution 3: SSR-compatible CSS-in-JS
import { createStyleSheet } from './ssr-styles';

const useStyles = createStyleSheet(() => ({
  container: {
    color: 'blue',
    fontSize: '16px'
  }
}));

function StyledComponent() {
  const styles = useStyles();

  return <div className={styles.container}>Content</div>;
}

// Extract styles on server
const { html, styles } = extractStyles(<App />);

const page = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>${styles}</style>
    </head>
    <body>
      <div id="app">${html}</div>
    </body>
  </html>
`;
```

### 6. Async Components

**Problem:** Async components breaking SSR.

```tsx
// Problem: Async component function
async function AsyncComponent() { // Can't be async!
  const data = await fetchData();
  return <div>{data}</div>;
}
```

**Solution:** Use Suspense and resources.

```tsx
// Solution: Use resource for async data
import { resource, Suspense } from '@philjs/core';

function AsyncComponent() {
  const data = resource(() => fetchData());

  return (
    <div>
      {data.loading() && <div>Loading...</div>}
      {data() && <div>{data()}</div>}
    </div>
  );
}

// Wrap in Suspense
function Page() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### 7. Third-Party Libraries

**Problem:** Third-party library breaks SSR.

```tsx
// Problem: Library uses window/document
import ThirdPartyWidget from 'third-party-widget';

function Page() {
  return (
    <div>
      <ThirdPartyWidget /> {/* Breaks on server! */}
    </div>
  );
}
```

**Solution:** Lazy load or wrap in ClientOnly.

```tsx
// Solution 1: Lazy load
import { lazy, Suspense } from '@philjs/core';

const ThirdPartyWidget = lazy(() => import('third-party-widget'));

function Page() {
  return (
    <Suspense fallback={<div>Loading widget...</div>}>
      <ThirdPartyWidget />
    </Suspense>
  );
}

// Solution 2: Dynamic import in effect
function Page() {
  const [Widget, setWidget] = signal<any>(null);

  effect(() => {
    if (typeof window === 'undefined') return;

    import('third-party-widget').then(mod => {
      setWidget(() => mod.default);
    });
  });

  return (
    <div>
      {Widget() ? <Widget() /> : <div>Loading...</div>}
    </div>
  );
}

// Solution 3: Client-only wrapper
function Page() {
  return (
    <ClientOnly>
      <ThirdPartyWidget />
    </ClientOnly>
  );
}
```

### 8. Memory Leaks in SSR

**Problem:** Server memory growing over time.

```tsx
// Problem: Global state not cleaned up
const globalCache = new Map(); // Never cleared!

export async function renderPage(req: Request) {
  const data = await fetchData();
  globalCache.set(req.url, data); // Memory leak!

  return renderToString(<App data={data} />);
}
```

**Solution:** Use request-scoped state.

```tsx
// Solution: Request-scoped storage
import { AsyncLocalStorage } from 'async_hooks';

const requestStorage = new AsyncLocalStorage<Map<string, any>>();

export async function renderPage(req: Request) {
  const cache = new Map();

  return requestStorage.run(cache, async () => {
    const data = await fetchData();
    cache.set('data', data);

    const html = await renderToString(<App />);

    // Cache is garbage collected after this function
    return html;
  });
}

// Access in components
function Component() {
  const cache = requestStorage.getStore();
  const data = cache?.get('data');

  return <div>{data}</div>;
}

// Solution 2: Clear caches periodically
const globalCache = new Map();
const MAX_CACHE_SIZE = 1000;

function addToCache(key: string, value: any) {
  if (globalCache.size >= MAX_CACHE_SIZE) {
    const firstKey = globalCache.keys().next().value;
    globalCache.delete(firstKey);
  }

  globalCache.set(key, value);
}
```

### 9. Request Context

**Problem:** Can't access request data in components.

```tsx
// Problem: How to pass request to nested components?
function DeepComponent() {
  // Need access to request URL, cookies, headers
  return <div>User-Agent: ???</div>;
}
```

**Solution:** Use context for request data.

```tsx
// Solution: Request context
import { createContext, useContext } from '@philjs/core';

interface RequestContext {
  url: string;
  headers: Headers;
  cookies: Map<string, string>;
}

const RequestContext = createContext<RequestContext | null>(null);

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error('useRequest must be used within RequestContext.Provider');
  }
  return context;
}

// On server
export async function renderPage(req: Request) {
  const requestContext: RequestContext = {
    url: req.url,
    headers: req.headers,
    cookies: parseCookies(req.headers.get('cookie') || '')
  };

  const html = await renderToString(
    <RequestContext.Provider value={requestContext}>
      <App />
    </RequestContext.Provider>
  );

  return html;
}

// In components
function DeepComponent() {
  const request = useRequest();

  return (
    <div>
      <p>URL: {request.url}</p>
      <p>User-Agent: {request.headers.get('user-agent')}</p>
    </div>
  );
}
```

### 10. Server Component Patterns

**Example:** Server-only data fetching

```tsx
// server-component.tsx (runs only on server)
export async function ServerComponent({ userId }: { userId: string }) {
  'use server'; // Mark as server component

  const user = await fetchUser(userId);
  const posts = await fetchUserPosts(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <PostList posts={posts} />
    </div>
  );
}

// client-component.tsx (hydrates on client)
export function PostList({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = signal('all');

  const filtered = memo(() => {
    if (filter() === 'all') return posts;
    return posts.filter(p => p.category === filter());
  });

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="tech">Tech</option>
      </select>

      <ul>
        {filtered().map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## SSR Best Practices

### 1. Environment Detection

```tsx
// Utility for environment checks
export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';
export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

// Usage
if (isClient) {
  // Client-only code
}

if (isServer) {
  // Server-only code
}
```

### 2. Error Boundaries in SSR

```tsx
// SSR-safe error boundary
import { ErrorBoundary } from '@philjs/core';

function App() {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <div>
          <h1>Error occurred</h1>
          <p>{error.message}</p>
        </div>
      )}
      onError={(error, errorInfo) => {
        if (isServer) {
          console.error('SSR Error:', error, errorInfo);
        }
      }}
    >
      <Page />
    </ErrorBoundary>
  );
}
```

### 3. Performance Monitoring

```tsx
// Track SSR performance
export async function renderPage(req: Request) {
  const start = Date.now();

  try {
    const html = await renderToString(<App />);

    const duration = Date.now() - start;

    console.log(`SSR rendered in ${duration}ms`);

    // Send metrics to monitoring service
    if (duration > 1000) {
      console.warn('Slow SSR render:', duration, 'ms');
    }

    return html;
  } catch (error) {
    console.error('SSR error:', error);
    throw error;
  }
}
```

### 4. Caching Strategies

```tsx
// Simple in-memory cache
const pageCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function renderPage(req: Request) {
  const url = req.url;
  const cached = pageCache.get(url);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Cache hit:', url);
    return cached.html;
  }

  const html = await renderToString(<App />);

  pageCache.set(url, {
    html,
    timestamp: Date.now()
  });

  return html;
}
```

## Testing SSR

### Unit Test SSR Rendering

```tsx
import { describe, it, expect } from 'vitest';
import { renderToString } from '@philjs/core';

describe('SSR Tests', () => {
  it('renders component on server', async () => {
    const html = await renderToString(<MyComponent />);

    expect(html).toContain('expected content');
    expect(html).not.toContain('window');
  });

  it('handles errors gracefully', async () => {
    const Component = () => {
      throw new Error('Test error');
    };

    await expect(async () => {
      await renderToString(
        <ErrorBoundary fallback={() => <div>Error</div>}>
          <Component />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });

  it('serializes data correctly', async () => {
    const data = { name: 'Alice', age: 30 };

    const html = await renderToString(<UserProfile user={data} />);

    expect(html).toContain('Alice');
    expect(html).toContain('30');
  });
});
```

### Integration Test Hydration

```tsx
import { describe, it, expect } from 'vitest';
import { renderToString, hydrate } from '@philjs/core';

describe('Hydration Tests', () => {
  it('hydrates without errors', async () => {
    // Render on server
    const serverHtml = await renderToString(<Counter initialCount={5} />);

    // Create container
    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // Hydrate
    hydrate(<Counter initialCount={5} />, container);

    // Verify hydration worked
    expect(container.textContent).toContain('5');

    // Clean up
    document.body.removeChild(container);
  });
});
```

## SSR Checklist

When implementing SSR:

- [ ] Check for browser APIs (window, document, navigator)
- [ ] Handle data fetching properly (loaders or initial data)
- [ ] Configure streaming if needed
- [ ] Serialize and deserialize state
- [ ] Handle CSS-in-JS correctly
- [ ] Use Suspense for async components
- [ ] Lazy load client-only libraries
- [ ] Prevent memory leaks
- [ ] Use context for request data
- [ ] Add error boundaries
- [ ] Test SSR rendering
- [ ] Test hydration
- [ ] Monitor performance
- [ ] Consider caching

## Summary

**Common SSR Issues:**
- Browser APIs not available
- Data not loaded on server
- Streaming not configured
- State not serialized
- CSS mismatches
- Async component problems
- Third-party library issues
- Memory leaks
- Missing request context

**Solutions:**
- Check environment before using browser APIs
- Use data loaders or pass initial data
- Configure streaming with error handling
- Serialize state between server and client
- Use SSR-compatible styling
- Use resources and Suspense
- Lazy load client-only code
- Use request-scoped storage
- Pass request via context

**Best Practices:**
- Use environment detection utilities
- Add error boundaries
- Monitor SSR performance
- Implement caching strategies
- Test SSR and hydration
- Document server-only code

**Next:**
- [Hydration Mismatches](./hydration-mismatches.md) - Hydration-specific issues
- [Common Issues](./common-issues.md) - General problems
- [Build Errors](./build-errors.md) - Build-time issues

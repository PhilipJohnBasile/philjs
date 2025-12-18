# Streaming SSR Quick Start

Get streaming SSR with selective hydration running in 5 minutes.

## Installation

```bash
npm install philjs-core philjs-ssr
```

## Basic Streaming SSR

### Server

```typescript
import { renderToStream, webStreamToNodeStream } from 'philjs-ssr';
import { jsx } from 'philjs-core';
import http from 'http';

const App = () => jsx('div', {
  children: jsx('h1', { children: 'Hello Streaming!' })
});

http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Transfer-Encoding': 'chunked'
  });

  const stream = renderToStream(jsx(App, {}));
  const nodeStream = webStreamToNodeStream(stream);
  nodeStream.pipe(res);
}).listen(3000);
```

## With Suspense

```typescript
import { Suspense } from 'philjs-ssr';

async function UserProfile({ userId }) {
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  return jsx('div', { children: user.name });
}

const App = () => jsx('div', {
  children: [
    jsx('header', { children: 'My App' }),
    jsx(Suspense, {
      fallback: jsx('div', { children: 'Loading user...' }),
      children: jsx(UserProfile, { userId: '123' })
    })
  ]
});

// Shell sent immediately with loading state
// User data streamed when ready
```

## With Selective Hydration

### Server

```typescript
import { renderToStream } from 'philjs-ssr';
import { signal, jsx } from 'philjs-core';

function Counter({ initialCount = 0 }) {
  const count = signal(initialCount);
  return jsx('button', {
    onClick: () => count.value++,
    children: () => `Count: ${count.value}`
  });
}

const App = () => jsx('div', {
  children: [
    jsx('p', { children: 'Static text' }),
    jsx(Counter, { initialCount: 0 })
  ]
});

const stream = renderToStream(jsx(App, {}), {
  selectiveHydration: true,
  interactiveComponents: new Set([Counter]),
  bootstrapModules: ['/client.js']
});
```

### Client (`client.js`)

```typescript
import { registerIsland, autoHydrateIslands, HydrationStrategy } from 'philjs-ssr';
import { Counter } from './components';

registerIsland('Counter', Counter);
autoHydrateIslands(HydrationStrategy.VISIBLE);
```

## Hydration Strategies

```typescript
import { HydrationStrategy } from 'philjs-ssr';

// Immediate hydration
autoHydrateIslands(HydrationStrategy.EAGER);

// Hydrate when visible (recommended)
autoHydrateIslands(HydrationStrategy.VISIBLE);

// Hydrate on interaction (hover, click, focus)
autoHydrateIslands(HydrationStrategy.INTERACTION);

// Hydrate when browser is idle
autoHydrateIslands(HydrationStrategy.IDLE);
```

## Express Integration

```typescript
import express from 'express';
import { renderToStream, webStreamToNodeStream } from 'philjs-ssr';

const app = express();

app.get('/', (req, res) => {
  const stream = renderToStream(jsx(App, {}), {
    onShellReady: () => {
      res.status(200).set({
        'Content-Type': 'text/html',
        'Transfer-Encoding': 'chunked'
      });
    }
  });

  webStreamToNodeStream(stream).pipe(res);
});

app.listen(3000);
```

## Performance Tips

### 1. Use Suspense for Async Data

```typescript
// Good: Non-blocking
jsx(Suspense, {
  fallback: jsx('div', { children: 'Loading...' }),
  children: jsx(AsyncComponent, {})
})

// Bad: Blocks entire page
const data = await fetchData();
```

### 2. Mark Only Interactive Components

```typescript
// Only hydrate what needs JavaScript
const interactiveComponents = new Set([
  Counter,      // Has click handler
  SearchBox,    // Has input handler
  // NOT: Header, Footer, BlogPost
]);
```

### 3. Choose Right Strategy

```typescript
// Above the fold → EAGER or VISIBLE
hydrateIslandOnVisible('hero');

// Below the fold → IDLE
hydrateIslandOnIdle('newsletter');

// Heavy components → INTERACTION
hydrateIslandOnInteraction('video-player');
```

## Common Patterns

### Blog Post

```typescript
const BlogPost = () => jsx('article', {
  children: [
    jsx('header', { /* static */ }),
    jsx('main', { /* static content */ }),
    jsx(Island, {
      name: 'comments',
      children: jsx(CommentSection, {})
    })
  ]
});
```

### Dashboard

```typescript
const Dashboard = () => jsx('div', {
  children: [
    jsx('header', { /* static */ }),
    jsx(Suspense, {
      fallback: jsx('div', { children: 'Loading...' }),
      children: jsx(AnalyticsWidget, {})
    }),
    jsx(Suspense, {
      fallback: jsx('div', { children: 'Loading...' }),
      children: jsx(RecentActivity, {})
    })
  ]
});
```

### E-commerce Product Page

```typescript
const ProductPage = ({ productId }) => jsx('div', {
  children: [
    jsx(ProductImages, { productId }), // Static
    jsx(ProductInfo, { productId }),   // Static
    jsx(AddToCartButton, { productId }), // Interactive
    jsx(Suspense, {
      fallback: jsx('div', { children: 'Loading reviews...' }),
      children: jsx(ProductReviews, { productId })
    })
  ]
});

const interactiveComponents = new Set([AddToCartButton]);
```

## Debugging

### Check Island Status

```typescript
import { getIslandStatus } from 'philjs-ssr';

const status = getIslandStatus('i0');
console.log(status.exists);   // true
console.log(status.hydrated); // false
```

### Monitor Performance

```typescript
const stream = renderToStream(jsx(App, {}), {
  onShellReady: () => {
    console.log('TTFB:', performance.now());
  },
  onAllReady: () => {
    console.log('Complete:', performance.now());
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

## Next Steps

- Read [STREAMING_SSR.md](./STREAMING_SSR.md) for complete API reference
- Check [streaming-ssr-example.ts](./src/streaming-ssr-example.ts) for examples
- Run benchmarks: `npm test streaming-benchmark.test.ts`

## Help

- Issues: https://github.com/philjs/philjs/issues
- Docs: https://philjs.dev/docs/ssr
- Discord: https://discord.gg/philjs

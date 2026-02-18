# Streaming SSR

Modern web applications need to perform fast, even on slow networks. PhilJS Streaming SSR (V2) enables you to send HTML to the client as soon as it's ready, rather than waiting for the entire page to render.

## Key Features

- **Out-of-Order Streaming**: Send the shell immediately. Slow components (like database queries) stream in later and "pop" into place.
- **Selective Hydration**: The framework prioritizes hydrating components that the user interacts with first.
- **Backpressure**: Automatically handles network congestion.

![Streaming Timeline](../../assets/streaming_timeline_schematic_1767820588550.png)
*Figure 6-1: Out-of-Order Streaming Timeline*

## Usage

### Enabling Streaming

In your entry server file, use `renderToStream` instead of `renderToString`.

```typescript
import { createStreamingRenderer } from '@philjs/ssr';
import App from './App';

const renderer = createStreamingRenderer({
  outOfOrder: true,    // Enable out-of-order streaming
  shellTimeout: 5000,  // Max time to wait for shell
  priority: 'completion' // Send whatever finishes first
});

export function handleRequest(req) {
  const stream = renderer.renderToStream(<App />, {
    shell: {
      head: '<title>My App</title>',
      scripts: ['/client.js']
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Using Suspense

Wrap async components in `<Suspense>` boundaries. PhilJS handles the rest.

```tsx
import { Suspense } from '@philjs/core';
import { UserProfile, UserFeed } from './components';

export default function ProfilePage() {
  return (
    <div className="layout">
      {/* Streams immediately */}
      <Header />
      
      {/* Shows fallback until UserProfile resolves */}
      <Suspense fallback={<SkeletonProfile />}>
        <UserProfile />
      </Suspense>

      {/* Shows fallback until UserFeed resolves */}
      <Suspense fallback={<SkeletonFeed />}>
        <UserFeed />
      </Suspense>
    </div>
  );
}
```

## How It Works

1.  **Shell Phase**: The renderer walks the tree. When it hits a `<Suspense>`, it renders the `fallback` immediately and pushes the `children` promise to a queue.
2.  **Streaming Phase**: The browser receives the initial HTML (shell + fallbacks).
3.  **Resolution Phase**: As promises resolve, PhilJS sends `<script>` tags that inject the real content into the DOM, replacing the fallback.

```html
<!-- Initial chunks -->
<div id="root">
  <header>...</header>
  <div id="__phil_b_1">Loading Profile...</div>
</div>

<!-- Later chunks -->
<script>
  __PHIL_V2__.inject('1', '<div class="profile">Alice</div>');
</script>
```

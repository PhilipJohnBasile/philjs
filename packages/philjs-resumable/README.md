# philjs-resumable

> Zero-JavaScript Resumability and Partial Hydration for PhilJS - Qwik-style performance without the complexity

[![npm version](https://img.shields.io/npm/v/philjs-resumable.svg)](https://www.npmjs.com/package/philjs-resumable)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`philjs-resumable` brings **resumability** to PhilJS applications, enabling zero JavaScript execution until user interaction. Inspired by Qwik's revolutionary approach, this package allows you to build instant-loading web applications that deliver HTML to users and only load JavaScript when needed.

### What is Resumability?

Traditional frameworks (React, Vue, Svelte) use **hydration**: they render HTML on the server, then download and execute all component JavaScript on the client to "revive" the static HTML. This creates a significant performance bottleneck.

**Resumability** is different: the application serializes its state to HTML and only loads the necessary code when the user interacts with the page. No JavaScript execution on initial page load = instant interactivity.

### Key Features

- **Zero JS Until Interaction**: No JavaScript executes until users interact with the page
- **QRL (Quick Resource Locator)**: Lazy references for functions, handlers, and components
- **Partial Hydration**: Only hydrate interactive components, skip static content
- **Hydration Strategies**: `idle`, `visible`, `interaction`, `media`, `never`, `custom`
- **Streaming SSR**: Progressive rendering with out-of-order hydration support
- **Signal Serialization**: Reactive state survives the server-client boundary

## Installation

```bash
npm install philjs-resumable
# or
pnpm add philjs-resumable
```

## Quick Start

### 1. Define Resumable Components

```typescript
import { resumable$, useSignal, $ } from 'philjs-resumable';

// Resumable component - code is lazy-loaded on interaction
export const Counter = resumable$(() => {
  const count = useSignal(0);

  return (
    <button onClick$={() => count.value++}>
      Count: {count.value}
    </button>
  );
});
```

### 2. Use Partial Hydration

```typescript
import { Hydrate } from 'philjs-resumable';

function App() {
  return (
    <main>
      {/* Static content - never hydrated */}
      <Header />

      {/* Hydrate when visible in viewport */}
      <Hydrate when="visible">
        <HeroSection />
      </Hydrate>

      {/* Hydrate when browser is idle */}
      <Hydrate when="idle">
        <Analytics />
      </Hydrate>

      {/* Hydrate on first interaction */}
      <Hydrate when="interaction" event="click">
        <Modal />
      </Hydrate>

      {/* Hydrate based on media query */}
      <Hydrate when="media" query="(min-width: 768px)">
        <DesktopNav />
      </Hydrate>
    </main>
  );
}
```

### 3. Server-Side Rendering

```typescript
import { renderToResumableString, ResumableContainer } from 'philjs-resumable';

// Server handler
async function handler(req) {
  const html = await renderToResumableString(
    <ResumableContainer>
      <App />
    </ResumableContainer>,
    { basePath: '/chunks' }
  );

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

### 4. Client-Side Resume

```typescript
import { resume } from 'philjs-resumable';

// Resume the application - sets up event delegation
// No components hydrate until interaction
resume();
```

## Core Concepts

### QRL (Quick Resource Locator)

QRLs are lazy references that enable code to be serialized and loaded on demand:

```typescript
import { $, onClick$, qrl } from 'philjs-resumable';

// Create a lazy handler
const handleClick = $(() => {
  console.log('Button clicked!');
});

// Use in JSX with $ suffix
<button onClick$={handleClick}>Click me</button>

// Handler with captured state
const count = useSignal(0);
const increment = $((captures) => {
  captures.count.value++;
}, [count], ['count']);

// Reference external module
const handler = qrl('components/handlers', 'handleSubmit');
```

### Resumable Signals

Signals that serialize to HTML and restore on hydration:

```typescript
import { useSignal, useComputed } from 'philjs-resumable';

const Counter = resumable$(() => {
  const count = useSignal(0);
  const doubled = useComputed(() => count() * 2);

  // State is serialized to HTML:
  // <span data-qsignal="s0">0</span>
  // When hydrated, the value is restored without re-executing

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick$={() => count.set(c => c + 1)}>
        Increment
      </button>
    </div>
  );
});
```

### Hydration Strategies

Control exactly when components hydrate:

```typescript
// Hydrate immediately on page load
<Hydrate when="load">
  <CriticalComponent />
</Hydrate>

// Hydrate when browser is idle (requestIdleCallback)
<Hydrate when="idle" timeout={2000}>
  <Analytics />
</Hydrate>

// Hydrate when visible (IntersectionObserver)
<Hydrate when="visible" threshold={0.1} rootMargin="200px">
  <LazyImage />
</Hydrate>

// Hydrate on specific events
<Hydrate when="interaction" events={['click', 'focus', 'touchstart']}>
  <InteractiveForm />
</Hydrate>

// Hydrate based on media query
<Hydrate when="media" query="(min-width: 1024px)">
  <DesktopOnlyFeature />
</Hydrate>

// Custom hydration trigger
<Hydrate
  when="custom"
  trigger={(element, hydrate) => {
    // Custom logic
    const observer = new MutationObserver(() => hydrate());
    observer.observe(element, { childList: true });
    return () => observer.disconnect();
  }}
>
  <CustomComponent />
</Hydrate>

// Never hydrate (static only)
<Hydrate when="never">
  <StaticContent />
</Hydrate>
```

### Component Modifiers

```typescript
import { static$, client$, server$component } from 'philjs-resumable';

// Static component - never hydrates
const StaticHeader = static$(() => (
  <header>Static content</header>
));

// Client-only component - only runs on client
const BrowserOnlyWidget = client$(
  () => <div>Uses browser APIs</div>,
  <div>Loading...</div> // SSR fallback
);

// Server-only component - only runs during SSR
const ServerData = server$component(() => (
  <script dangerouslySetInnerHTML={{ __html: '...' }} />
));
```

## API Reference

### QRL Functions

| Function | Description |
|----------|-------------|
| `$(fn)` | Create a lazy QRL from a function |
| `component$(fn)` | Create a lazy component QRL |
| `event$(fn)` | Create a typed event handler QRL |
| `onClick$`, `onInput$`, etc. | Typed event handler shortcuts |
| `qrl(chunk, symbol)` | Reference an external module export |
| `parseQRL(str)` | Parse a serialized QRL string |
| `prefetchQRL(qrl)` | Prefetch a QRL's chunk |

### Resumable Functions

| Function | Description |
|----------|-------------|
| `resumable$(fn)` | Create a resumable component |
| `useSignal(initial)` | Create a resumable signal |
| `useComputed(fn)` | Create a computed resumable value |
| `handler$(fn, captures)` | Create an event handler with captures |
| `renderToResumableString(app)` | SSR with resumability |
| `resume()` | Resume application on client |

### Hydration Functions

| Function | Description |
|----------|-------------|
| `Hydrate` | Component for hydration boundaries |
| `useHydration(options)` | Hook for programmatic hydration |
| `setupHydration(el, options)` | Manually set up hydration |
| `forceHydration(id)` | Force immediate hydration |
| `isHydrated(id)` | Check hydration status |

### Container Functions

| Function | Description |
|----------|-------------|
| `ResumableContainer` | Root container component |
| `resumeContainer(el)` | Resume a specific container |
| `resumeAllContainers()` | Resume all containers on page |
| `ErrorBoundary` | Error boundary for hydration |
| `Suspense` | Suspense boundary for lazy loading |

### Serialization Functions

| Function | Description |
|----------|-------------|
| `serializeValue(value)` | Serialize any JS value |
| `deserializeValue(serialized)` | Deserialize back to JS |
| `generateStateScript(ctx)` | Generate state script tag |
| `generateBootstrapScript()` | Generate bootstrap script |

## Serialization Format

State is serialized to JSON and embedded in HTML:

```html
<!-- Resumable element with handlers -->
<button
  data-qid="q0"
  data-qevents="click"
>
  Click me
</button>

<!-- Signal binding -->
<span data-qsignal="s0">0</span>

<!-- State script -->
<script id="__PHIL_STATE__" type="application/json">
{
  "signals": {
    "s0": { "id": "s0", "value": { "type": "primitive", "data": 0 } }
  },
  "elements": {
    "q0": {
      "id": "q0",
      "handlers": [{ "event": "click", "qrl": "counter#increment" }]
    }
  }
}
</script>

<!-- Bootstrap script -->
<script>
(function() {
  // Event delegation setup
  // Lazy loading on interaction
})();
</script>
```

## Streaming SSR

For large applications, use streaming SSR:

```typescript
import { createStreamingRenderer } from 'philjs-resumable';

async function streamHandler(req) {
  const renderer = createStreamingRenderer({ basePath: '/chunks' });

  const stream = new ReadableStream({
    async start(controller) {
      // Stream header
      controller.enqueue(encoder.encode('<!DOCTYPE html><html><body>'));

      // Stream content progressively
      controller.enqueue(encoder.encode(renderer.write(<Header />)));
      controller.enqueue(encoder.encode(renderer.flush()));

      controller.enqueue(encoder.encode(renderer.write(<MainContent />)));
      controller.enqueue(encoder.encode(renderer.flush()));

      // End with state scripts
      controller.enqueue(encoder.encode(renderer.end()));
      controller.enqueue(encoder.encode('</body></html>'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

## Build Integration

### Vite Plugin (Coming Soon)

```typescript
// vite.config.ts
import { philResumable } from 'philjs-resumable/vite';

export default {
  plugins: [
    philResumable({
      // Extract handlers to separate chunks
      extractHandlers: true,
      // Generate manifest for chunk mapping
      manifest: true,
    }),
  ],
};
```

### Manual Chunk Registration

```typescript
import { registerChunks } from 'philjs-resumable';

// Register chunks for lazy loading
registerChunks({
  'counter': () => import('./components/Counter'),
  'modal': () => import('./components/Modal'),
  'analytics': () => import('./components/Analytics'),
});
```

## Performance Benefits

| Metric | Traditional Hydration | Resumable |
|--------|----------------------|-----------|
| TTI | Blocks on full hydration | Instant |
| JS Execution | All at once | On demand |
| Memory | Full app in memory | Only active components |
| Interaction Delay | Wait for hydration | Immediate |

## Comparison with Qwik

PhilJS Resumable is inspired by Qwik but integrates with PhilJS's signal system:

| Feature | Qwik | PhilJS Resumable |
|---------|------|------------------|
| QRL | Yes | Yes |
| Resumability | Yes | Yes |
| Signals | Qwik Signals | PhilJS Signals |
| Partial Hydration | Yes | Yes (with strategies) |
| Islands | Via Qwik City | Via philjs-islands |
| Streaming | Yes | Yes |

## Best Practices

1. **Use `$` suffix for event handlers**: `onClick$` instead of `onClick`
2. **Keep handlers small**: Large handlers should be in separate chunks
3. **Capture minimal state**: Only capture what handlers need
4. **Use appropriate hydration strategies**: `visible` for below-fold, `idle` for analytics
5. **Prefetch on hover**: Enable prefetching for faster perceived interaction
6. **Test without JS**: Ensure static content works without JavaScript

## Debugging

Enable verbose logging:

```typescript
import { configureLoader } from 'philjs-resumable';

configureLoader({
  isDev: true,
});
```

Check hydration stats:

```typescript
import { getHydrationStats, getLoaderStats } from 'philjs-resumable';

console.log('Hydration:', getHydrationStats());
console.log('Loader:', getLoaderStats());
```

## TypeScript Support

Full TypeScript support with proper types:

```typescript
import type {
  QRL,
  ResumableSignal,
  HydrationStrategy,
  ResumableComponent
} from 'philjs-resumable';

const handler: QRL<(e: MouseEvent) => void> = $(() => {});
const count: ResumableSignal<number> = useSignal(0);
const strategy: HydrationStrategy = 'visible';
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./serializer, ./loader, ./hydration
- Source files: packages/philjs-resumable/src/index.ts, packages/philjs-resumable/src/serializer.ts, packages/philjs-resumable/src/loader.ts, packages/philjs-resumable/src/hydration.ts

### Public API
- Direct exports: AnyHydrationOptions, ComponentLoader, CustomOptions, FEATURES, Hydrate, HydrateProps, HydrationOptions, HydrationStrategy, IdleOptions, InteractionOptions, LazyComponent, LoaderConfig, MediaOptions, SerializationContext, SerializedElement, SerializedHandler, SerializedSignal, SerializedValue, VERSION, VisibleOptions, addSignalSubscriber, addStreamingChunk, cancelHydration, clearHydrationState, clearLoaderCache, configureLoader, createHydrateComponent, createSerializationContext, createStreamingContext, deserializeFromAttribute, deserializeValue, discoverHydrationBoundaries, forceHydration, generateBootstrapScript, generateElementAttributes, generateId, generateInlineState, generateStateScript, getHydrationStats, getLazyComponent, getLoaderConfig, getLoaderStats, getSerializationContext, hasLazyComponent, initHydration, initLoader, isHydrated, loadAndHydrate, loadAndInvokeHandler, loadComponent, loadFromQRL, prefetchChunk, prefetchComponent, prefetchVisibleComponents, queueHydration, queueLoad, registerComponent, registerElement, registerLazyComponent, registerLazyComponents, registerSignal, serializeToAttribute, serializeValue, setupHydration, useHydration, waitForHydration, waitForLoads, withSerializationContext
- Re-exported names: // Client Resume
  resume, // Common Event Handlers
  onClick$, // Compact Serialization
  serializeToAttribute, // Component Factory
  resumable$, // Component Modifiers
  static$, // Component Registration
  registerLazyComponent, // Components
  Hydrate, // Components
  ResumableContainer, // Configuration
  configureLoader, // Configuration
  configureQRL, // Container Management
  getContainer, // Context
  getResumableContext, // Context
  useContainerContext, // Context Management
  createSerializationContext, // Core Functions
  setupHydration, // Core QRL
  type QRL, // Discovery
  discoverHydrationBoundaries, // Element/Signal Registration
  registerElement, // Event Handlers
  handler$, // HTML Generation
  generateStateScript, // Initialization
  initLoader, // Loading
  loadComponent, // Prefetching
  prefetchContainer, // QRL Factory Functions
  $, // SSR
  renderToResumableString, // Signal/State QRLs
  signal$, // Signals
  useSignal, // Statistics
  getContainerStats, // Streaming
  createStreamingContext, // Task QRLs
  server$, // Types
  type ComponentLoader, // Types
  type ContainerState, // Types
  type HydrationStrategy, // Types
  type ResumableComponent, // Types
  type SerializedSignal, // Utilities
  getHydrationStats, // Utilities
  getLoaderStats, // Value Serialization
  serializeValue, AnyHydrationOptions, ContainerConfig, ContainerContextValue, ContainerProps, ContainerProvider, CustomOptions, ErrorBoundary, ErrorBoundaryProps, HydrateProps, HydrationOptions, IdleOptions, InteractionOptions, LazyComponent, LoaderConfig, MediaOptions, QRLComponent, QRLEventHandler, QRLOptions, ResumableConfig, ResumableContext, ResumableSignal, SerializationContext, SerializedElement, SerializedHandler, SerializedValue, Suspense, SuspenseProps, VisibleOptions, addSignalSubscriber, addStreamingChunk, browser$, cancelHydration, clearHydrationState, clearLoaderCache, clearQRLRegistry, client$, component$, computed$, createQRL, createStreamingRenderer, deserializeFromAttribute, deserializeValue, disposeAllContainers, disposeContainer, event$, forceHydration, generateBootstrapScript, generateElementAttributes, generateId, generateInlineState, getAllContainers, getCurrentComponentId, getLazyComponent, getLoaderConfig, getQRLAttribute, getSerializationContext, hasLazyComponent, initHydration, inlineQRL, isContainerHydrated, isHydrated, isQRL, isResumable, isServer, loadAndHydrate, loadAndInvokeHandler, loadFromQRL, onBlur$, onChange$, onFocus$, onInput$, onKeyDown$, onKeyUp$, onSubmit$, parseQRL, prefetchChunk, prefetchComponent, prefetchQRL, prefetchQRLs, prefetchVisibleComponents, qrl, queueHydration, queueLoad, registerChunk, registerChunks, registerComponent, registerLazyComponents, registerSignal, resumeAllContainers, resumeContainer, server$component, setupContainerPrefetching, useComputed, useHydration, useTask$, useVisibleTask$, waitForContainer, waitForHydration, waitForLoads, withResumableContext, withSerializationContext
- Re-exported modules: ./container.js, ./hydration.js, ./loader.js, ./qrl.js, ./resumable.js, ./serializer.js
<!-- API_SNAPSHOT_END -->

## License

MIT

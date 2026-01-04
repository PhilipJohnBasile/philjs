# @philjs/resumable

Zero-JavaScript Resumability and Partial Hydration for PhilJS - Qwik-style performance without the complexity.

## Introduction

Traditional web frameworks like React, Vue, and Svelte use **hydration** to make server-rendered HTML interactive. This process requires downloading and executing all component JavaScript on the client to "revive" the static HTML, creating a significant performance bottleneck.

**Resumability** takes a fundamentally different approach: the application serializes its complete state directly into the HTML. When users interact with the page, only the necessary code is loaded on-demand. This means:

- **ZERO JavaScript execution on initial page load**
- Instant Time-to-Interactive (TTI)
- Only interactive components load code, and only when needed
- Perfect Lighthouse scores for JavaScript execution

```typescript
import { resumable$, useSignal, Hydrate, resume } from '@philjs/resumable';

// Define a resumable component - code is NOT loaded until interaction
const Counter = resumable$(() => {
  const count = useSignal(0);

  return (
    <button onClick$={() => count.value++}>
      Count: {count.value}
    </button>
  );
});

// Use partial hydration to control when components hydrate
function App() {
  return (
    <main>
      <Header />  {/* Static - never hydrates */}

      <Hydrate when="visible">
        <Counter />
      </Hydrate>
    </main>
  );
}

// On client: set up event delegation, NO code executes until interaction
resume();
```

## Key Concepts

### Resumability vs Hydration

| Aspect | Hydration | Resumability |
|--------|-----------|--------------|
| Initial JS | All component code | Zero (only bootstrap) |
| TTI | Blocked by hydration | Instant |
| Code loading | Eager (upfront) | Lazy (on interaction) |
| State transfer | Re-execute components | Serialize to HTML |
| Memory usage | Full app in memory | Only active components |

With hydration, the browser must:
1. Download all JavaScript
2. Parse and execute component code
3. Rebuild component state
4. Attach event handlers

With resumability:
1. State is already in HTML
2. Tiny bootstrap script sets up event delegation
3. Component code loads only when user interacts
4. Handler executes immediately after load

### QRL (Quick Resource Locator)

QRLs are the foundation of resumability. A QRL is a serializable reference to a function, component, or resource that can be lazily loaded when needed.

```typescript
import { $, qrl, parseQRL } from '@philjs/resumable';

// Create a lazy reference with $()
const handleClick = $(() => {
  console.log('Button clicked!');
});

// QRLs can reference external modules
const externalHandler = qrl('handlers.js', 'handleSubmit');

// QRLs serialize to strings like: "handlers.js#handleSubmit"
const serialized = externalHandler.serialize();
const parsed = parseQRL(serialized);
```

QRLs enable:
- Serializing function references to HTML attributes
- Lazy loading code only when invoked
- Capturing closure variables across the server-client boundary

### Lazy Loading at Interaction Time

When a user clicks a button with an `onClick$` handler:

1. **Event Captured**: Bootstrap script's event delegation catches the event
2. **QRL Retrieved**: Handler QRL is read from `data-*` attribute
3. **Chunk Loaded**: JavaScript chunk is dynamically imported
4. **Handler Executed**: Function runs with original captured state

```html
<!-- Server-rendered HTML -->
<button
  data-qid="q0"
  data-qevents="click"
>
  Click me
</button>

<script id="__PHIL_STATE__" type="application/json">
{
  "elements": {
    "q0": {
      "handlers": [{ "event": "click", "qrl": "counter.js#increment" }]
    }
  }
}
</script>
```

## QRL System

### $() - Create Lazy Reference

The `$()` function creates a QRL from any function:

```typescript
import { $ } from '@philjs/resumable';

// Basic lazy handler
const logClick = $(() => {
  console.log('Clicked!');
});

// Handler with captured state
const count = 0;
const increment = $(
  (captures) => {
    captures.count++;
  },
  [count],        // Captured values
  ['count']       // Capture names (for debugging)
);
```

### component$() - Resumable Component

Wrap component functions to make them resumable:

```typescript
import { component$ } from '@philjs/resumable';

const MyComponent = component$((props: { name: string }) => {
  return <div>Hello, {props.name}!</div>;
});
```

### event$() - Event Handlers

Type-safe event handler creation:

```typescript
import { event$, onClick$, onInput$, onChange$, onSubmit$ } from '@philjs/resumable';

// Generic event handler
const handleEvent = event$((e: Event) => {
  e.preventDefault();
});

// Specific event type helpers
const handleClick = onClick$((e: MouseEvent) => {
  console.log('Clicked at:', e.clientX, e.clientY);
});

const handleInput = onInput$((e: InputEvent) => {
  console.log('Input value:', (e.target as HTMLInputElement).value);
});

const handleChange = onChange$((e: Event) => {
  console.log('Changed');
});

const handleSubmit = onSubmit$((e: SubmitEvent) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
});
```

Additional event helpers: `onKeyDown$`, `onKeyUp$`, `onFocus$`, `onBlur$`

### server$() and browser$()

Execute code exclusively on server or client:

```typescript
import { server$, browser$ } from '@philjs/resumable';

// Server-only function (RPC-style)
const fetchUserData = server$(async (userId: string) => {
  const db = await connectDatabase();
  return db.users.find(userId);
});

// Client-only function (uses browser APIs)
const trackPageView = browser$(() => {
  navigator.sendBeacon('/analytics', JSON.stringify({
    page: window.location.pathname,
    timestamp: Date.now()
  }));
});
```

### signal$() and computed$()

Create lazy reactive state references:

```typescript
import { signal$, computed$ } from '@philjs/resumable';

// Lazy signal - loaded on first access
const count = signal$(0);

// Lazy computed - loaded on first access
const doubled = computed$(() => count() * 2);
```

### Task QRLs

```typescript
import { useTask$, useVisibleTask$ } from '@philjs/resumable';

// Task runs on server during SSR
const serverTask = useTask$(async () => {
  const data = await fetchData();
  return data;
});

// Task runs on client after component is visible
const clientTask = useVisibleTask$(() => {
  // Set up subscriptions, timers, etc.
  const subscription = eventSource.subscribe();
  return () => subscription.unsubscribe();
});
```

## Serialization

### State Serialization to HTML

The serializer converts JavaScript values to a portable format that survives the server-client transition:

```typescript
import {
  serializeValue,
  deserializeValue,
  generateStateScript
} from '@philjs/resumable';

// Serialize any JavaScript value
const serialized = serializeValue({
  count: 42,
  items: ['a', 'b', 'c'],
  date: new Date(),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3])
});

// Result:
// {
//   type: 'object',
//   data: {
//     count: { type: 'primitive', data: 42 },
//     items: { type: 'array', data: [...] },
//     date: { type: 'date', data: '2024-01-01T00:00:00.000Z' },
//     map: { type: 'map', data: [...] },
//     set: { type: 'set', data: [...] }
//   }
// }

// Deserialize back to JavaScript
const value = deserializeValue(serialized);
```

### Supported Types

| Type | Serialization |
|------|---------------|
| Primitives | `string`, `number`, `boolean`, `null` |
| `undefined` | Preserved as type `'undefined'` |
| `Date` | ISO string |
| `RegExp` | Source and flags |
| `Error` | Name, message, stack |
| `Map` | Array of [key, value] pairs |
| `Set` | Array of values |
| `Array` | Recursively serialized |
| `Object` | Recursively serialized |
| `BigInt` | String representation |
| QRLs | Serialized QRL string |
| Signals | ID and serialized value |

### serializeValue() and deserializeValue()

```typescript
import { serializeValue, deserializeValue } from '@philjs/resumable';

// Serialize complex structures
const state = {
  user: { name: 'Alice', age: 30 },
  preferences: new Map([['theme', 'dark']]),
  tags: new Set(['admin', 'active']),
  createdAt: new Date()
};

const serialized = serializeValue(state);
const restored = deserializeValue(serialized);
```

### generateStateScript()

Generate the state script tag for SSR:

```typescript
import {
  createSerializationContext,
  generateStateScript,
  generateBootstrapScript
} from '@philjs/resumable';

const ctx = createSerializationContext({ isDev: false });

// ... register signals, elements, components ...

// Generate state JSON
const stateScript = generateStateScript(ctx);
// <script id="__PHIL_STATE__" type="application/json">{"signals":{},...}</script>

// Generate bootstrap script
const bootstrapScript = generateBootstrapScript({ basePath: '/chunks' });
// <script>/* Event delegation and lazy loading setup */</script>
```

## Hydration Strategies

Control exactly when components hydrate with different strategies:

### idle - Hydrate When Browser is Idle

```typescript
<Hydrate when="idle" timeout={2000}>
  <Analytics />
</Hydrate>
```

Uses `requestIdleCallback` to hydrate during idle periods. Falls back to timeout if browser never becomes idle.

### visible - Hydrate When Visible

```typescript
<Hydrate
  when="visible"
  threshold={0.5}        // 50% visible
  rootMargin="200px"     // Prefetch 200px before visible
  prefetch={true}
>
  <LazyImage />
</Hydrate>
```

Uses `IntersectionObserver` to detect when the component enters the viewport.

### interaction - Hydrate on User Interaction

```typescript
<Hydrate
  when="interaction"
  event="click"                    // Single event
  events={['click', 'focus']}      // Multiple events
>
  <Modal />
</Hydrate>
```

Hydrates when the user first interacts with the component.

### media - Hydrate Based on Media Query

```typescript
<Hydrate when="media" query="(min-width: 768px)">
  <DesktopSidebar />
</Hydrate>

<Hydrate when="media" query="(prefers-reduced-motion: no-preference)">
  <AnimatedHero />
</Hydrate>
```

Hydrates when the media query matches.

### custom - Custom Hydration Trigger

```typescript
<Hydrate
  when="custom"
  trigger={(element, hydrate) => {
    // Custom logic - hydrate after 5 seconds
    const timer = setTimeout(hydrate, 5000);

    // Return cleanup function
    return () => clearTimeout(timer);
  }}
>
  <DelayedWidget />
</Hydrate>
```

### never - Static Content (Never Hydrate)

```typescript
<Hydrate when="never">
  <StaticFooter />
</Hydrate>
```

Content is rendered but never hydrated - perfect for static content.

### load - Hydrate Immediately

```typescript
<Hydrate when="load">
  <CriticalInteractiveElement />
</Hydrate>
```

Hydrates immediately when the page loads.

### Hydrate Component Props

```typescript
interface HydrateProps {
  when: 'idle' | 'visible' | 'interaction' | 'media' | 'custom' | 'never' | 'load';
  children: unknown;

  // Visible strategy
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];

  // Interaction strategy
  event?: string;
  events?: string[];

  // Media strategy
  query?: string;

  // Idle strategy
  timeout?: number;

  // Custom strategy
  trigger?: (element: Element, hydrate: () => Promise<void>) => void | (() => void);

  // Common options
  priority?: number;
  prefetch?: boolean;
  componentId?: string;
  fallback?: unknown;
  onHydrate?: () => void;
  onError?: (error: Error) => void;
}
```

## Core API

### resumable$() - Create Resumable Component

The primary way to define resumable components:

```typescript
import { resumable$ } from '@philjs/resumable';

// Basic resumable component
const Counter = resumable$(() => {
  const count = useSignal(0);
  return (
    <button onClick$={() => count.value++}>
      {count.value}
    </button>
  );
});

// With explicit module reference
const Counter = resumable$(
  () => { /* component body */ },
  {
    module: 'components/Counter.js',
    symbol: 'Counter'
  }
);

// With TypeScript props
interface CounterProps {
  initial?: number;
  step?: number;
}

const Counter = resumable$<CounterProps>((props) => {
  const count = useSignal(props.initial ?? 0);
  const step = props.step ?? 1;

  return (
    <button onClick$={() => count.set(c => c + step)}>
      {count()}
    </button>
  );
});
```

### useSignal() - Resumable Reactive State

Create reactive state that serializes across the server-client boundary:

```typescript
import { useSignal } from '@philjs/resumable';

const MyComponent = resumable$(() => {
  // Create resumable signal with initial value
  const count = useSignal(0);
  const name = useSignal('');
  const items = useSignal<string[]>([]);

  // Read value - tracks as dependency
  console.log(count());

  // Read without tracking
  console.log(count.peek());

  // Set with new value
  count.set(10);

  // Set with update function
  count.set(prev => prev + 1);

  // Subscribe to changes
  const unsubscribe = count.subscribe((value) => {
    console.log('Count changed to:', value);
  });

  // Signal renders with serialization marker
  return <span>{count}</span>;
  // Output: <span data-qsignal="s0">0</span>
});
```

### useComputed() - Derived Resumable Values

```typescript
import { useSignal, useComputed } from '@philjs/resumable';

const MyComponent = resumable$(() => {
  const count = useSignal(0);
  const multiplier = useSignal(2);

  // Computed value
  const doubled = useComputed(() => count() * multiplier());

  // Computed values are also resumable signals
  return (
    <div>
      <span>Count: {count}</span>
      <span>Doubled: {doubled}</span>
    </div>
  );
});
```

### resume() - Resume Application on Client

Call this on the client to set up the resumability system:

```typescript
import { resume } from '@philjs/resumable';

// Basic resume
resume();

// With configuration
resume({
  basePath: '/chunks',
  isDev: import.meta.env.DEV,
  streaming: true
});
```

This:
1. Initializes the lazy loader
2. Sets up hydration system
3. Establishes signal bindings
4. Dispatches `phil:resumed` event

### Component Modifiers

```typescript
import { static$, client$, server$component } from '@philjs/resumable';

// Static component - rendered but never hydrated
const StaticHeader = static$(() => (
  <header>
    <h1>My Site</h1>
    <nav>...</nav>
  </header>
));

// Client-only component - only runs in browser
const BrowserWidget = client$(
  () => {
    // Safe to use window, document, etc.
    const width = window.innerWidth;
    return <div>Window width: {width}px</div>;
  },
  // SSR fallback
  <div>Loading...</div>
);

// Server-only component - only runs during SSR
const ServerData = server$component(() => (
  <script dangerouslySetInnerHTML={{
    __html: `window.__DATA__ = ${JSON.stringify(data)}`
  }} />
));
```

## Container System

### ResumableContainer

The root wrapper for resumable applications:

```typescript
import { ResumableContainer } from '@philjs/resumable';

// Server-side
const App = () => (
  <ResumableContainer
    id="main-app"
    basePath="/chunks"
    defaultHydration="idle"
    autoDiscover={true}
    errorBoundary={true}
    errorFallback={(error) => <div>Error: {error.message}</div>}
    loadingFallback={<div>Loading...</div>}
    onHydrate={() => console.log('App hydrated')}
    onError={(error) => console.error('Hydration error:', error)}
  >
    <Header />
    <Main />
    <Footer />
  </ResumableContainer>
);
```

### ErrorBoundary

Handle errors during hydration:

```typescript
import { ErrorBoundary } from '@philjs/resumable';

<ErrorBoundary
  fallback={(error, retry) => (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )}
  onError={(error) => logError(error)}
>
  <MyComponent />
</ErrorBoundary>
```

### Suspense

Suspense boundaries for lazy-loaded content:

```typescript
import { Suspense } from '@philjs/resumable';

<Suspense fallback={<LoadingSpinner />}>
  <LazyLoadedComponent />
</Suspense>
```

### resumeContainer()

Resume a specific container on the client:

```typescript
import { resumeContainer, resumeAllContainers } from '@philjs/resumable';

// Resume specific container
const containerEl = document.querySelector('[data-phil-container="main-app"]');
await resumeContainer(containerEl, {
  basePath: '/chunks',
  autoDiscover: true
});

// Resume all containers on page
await resumeAllContainers({ basePath: '/chunks' });
```

### Container Utilities

```typescript
import {
  getContainer,
  getAllContainers,
  isContainerHydrated,
  waitForContainer,
  disposeContainer,
  disposeAllContainers,
  getContainerStats
} from '@philjs/resumable';

// Get container state
const state = getContainer('main-app');
console.log(state.hydrated, state.loading, state.error);

// Get all containers
const containers = getAllContainers();

// Check if hydrated
if (isContainerHydrated('main-app')) {
  // Container is ready
}

// Wait for container
await waitForContainer('main-app');

// Dispose (cleanup)
disposeContainer('main-app');
disposeAllContainers();

// Statistics
const stats = getContainerStats();
// { total: 3, hydrated: 2, loading: 1, errored: 0 }
```

## SSR

### renderToResumableString()

Render your application to HTML with full resumability support:

```typescript
import { renderToResumableString, ResumableContainer } from '@philjs/resumable';

async function handleRequest(req: Request): Promise<Response> {
  const html = await renderToResumableString(
    <ResumableContainer>
      <App url={req.url} />
    </ResumableContainer>,
    {
      basePath: '/dist/chunks',
      isDev: false,
      streaming: false
    }
  );

  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

The output includes:
1. Rendered HTML with `data-qid`, `data-qsignal` attributes
2. State script (`<script id="__PHIL_STATE__">`)
3. Bootstrap script (event delegation setup)

### Streaming SSR

For large applications, stream HTML progressively:

```typescript
import { createStreamingRenderer } from '@philjs/resumable';

async function streamHandler(req: Request): Promise<Response> {
  const renderer = createStreamingRenderer({
    basePath: '/chunks',
    isDev: false
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Stream opening HTML
      controller.enqueue(encoder.encode(`
        <!DOCTYPE html>
        <html>
        <head><title>App</title></head>
        <body>
      `));

      // Stream header immediately
      controller.enqueue(encoder.encode(renderer.write(<Header />)));
      controller.enqueue(encoder.encode(renderer.flush()));

      // Stream main content
      controller.enqueue(encoder.encode(renderer.write(<MainContent />)));
      controller.enqueue(encoder.encode(renderer.flush()));

      // Stream footer and finalize
      controller.enqueue(encoder.encode(renderer.write(<Footer />)));

      // End with state and bootstrap scripts
      controller.enqueue(encoder.encode(renderer.end()));

      // Close HTML
      controller.enqueue(encoder.encode('</body></html>'));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/html',
      'Transfer-Encoding': 'chunked'
    }
  });
}
```

### Streaming Renderer API

```typescript
interface StreamingRenderer {
  // Write a chunk and return HTML
  write(chunk: unknown): string;

  // Flush any buffered content
  flush(): string;

  // End rendering and return final scripts
  end(): string;
}
```

## Loader System

The loader handles lazy loading of component code:

```typescript
import {
  configureLoader,
  registerLazyComponent,
  registerLazyComponents,
  loadComponent,
  prefetchComponent,
  initLoader,
  getLoaderStats,
  waitForLoads
} from '@philjs/resumable';

// Configure the loader
configureLoader({
  basePath: '/dist/chunks',
  prefetchOnHover: true,
  prefetchTimeout: 100,
  maxConcurrent: 4,
  retryOnError: true,
  maxRetries: 3,
  retryDelay: 1000,
  isDev: false
});

// Register components for lazy loading
registerLazyComponent('Counter', () => import('./Counter'));
registerLazyComponent('Modal', () => import('./Modal'));

// Or register multiple at once
registerLazyComponents({
  'Counter': () => import('./Counter'),
  'Modal': () => import('./Modal'),
  'Analytics': () => import('./Analytics')
});

// Initialize on client
initLoader();

// Manually load a component
const Component = await loadComponent('Counter');

// Prefetch without rendering
prefetchComponent('Modal');

// Get loading statistics
const stats = getLoaderStats();
// { registered: 3, loaded: 1, loading: 0, queued: 0, cached: 2 }

// Wait for all pending loads
await waitForLoads();
```

## Programmatic Hydration Control

```typescript
import {
  setupHydration,
  cancelHydration,
  forceHydration,
  isHydrated,
  getHydrationStats,
  waitForHydration
} from '@philjs/resumable';

// Manually set up hydration
const element = document.querySelector('[data-component]');
const hydrationId = setupHydration(element, {
  when: 'visible',
  threshold: 0.5,
  onHydrate: () => console.log('Hydrated!'),
  onError: (err) => console.error('Error:', err)
});

// Cancel pending hydration
cancelHydration(hydrationId);

// Force immediate hydration
await forceHydration(hydrationId);

// Check if hydrated
if (isHydrated(hydrationId)) {
  // Already hydrated
}

// Get statistics
const stats = getHydrationStats();
// { total: 10, hydrated: 5, pending: 4, queued: 1, byStrategy: {...} }

// Wait for all hydration to complete
await waitForHydration();
```

## Complete Example

Here's a full example showing the complete resumability flow:

```typescript
// === components/Counter.tsx ===
import { resumable$, useSignal, onClick$ } from '@philjs/resumable';

export const Counter = resumable$<{ initial?: number }>((props) => {
  const count = useSignal(props.initial ?? 0);

  const increment = onClick$(() => {
    count.set(c => c + 1);
  });

  const decrement = onClick$(() => {
    count.set(c => c - 1);
  });

  return (
    <div class="counter">
      <button onClick$={decrement}>-</button>
      <span>{count}</span>
      <button onClick$={increment}>+</button>
    </div>
  );
});

// === components/App.tsx ===
import { Hydrate, static$ } from '@philjs/resumable';
import { Counter } from './Counter';

const Header = static$(() => (
  <header>
    <h1>Resumable Counter App</h1>
  </header>
));

export function App() {
  return (
    <div>
      <Header />

      <main>
        <Hydrate when="visible" threshold={0.1}>
          <Counter initial={10} />
        </Hydrate>

        <Hydrate when="interaction" event="click">
          <Counter initial={0} />
        </Hydrate>
      </main>
    </div>
  );
}

// === server.ts ===
import { renderToResumableString, ResumableContainer } from '@philjs/resumable';
import { App } from './components/App';

export async function render(url: string): Promise<string> {
  const html = await renderToResumableString(
    <ResumableContainer basePath="/dist">
      <App />
    </ResumableContainer>
  );

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Counter App</title>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}

// === client.ts ===
import { resume } from '@philjs/resumable';

// Resume the application
// NO component code runs until user interacts!
resume({ basePath: '/dist' });
```

## TypeScript Types

```typescript
import type {
  // QRL types
  QRL,
  QRLOptions,
  QRLEventHandler,
  QRLComponent,

  // Resumable types
  ResumableComponent,
  ResumableSignal,
  ResumableContext,
  ResumableConfig,

  // Serialization types
  SerializedSignal,
  SerializedValue,
  SerializedHandler,
  SerializedElement,
  SerializationContext,

  // Hydration types
  HydrationStrategy,
  HydrationOptions,
  VisibleOptions,
  InteractionOptions,
  MediaOptions,
  IdleOptions,
  CustomOptions,
  AnyHydrationOptions,
  HydrateProps,

  // Container types
  ContainerState,
  ContainerConfig,
  ContainerProps,
  ContainerContextValue,

  // Loader types
  ComponentLoader,
  LazyComponent,
  LoaderConfig
} from '@philjs/resumable';
```

## Best Practices

### 1. Use $ Suffix for Event Handlers

Always use the `$` suffix for resumable event handlers:

```typescript
// Good - will be lazy loaded
<button onClick$={handleClick}>

// Bad - regular function, not resumable
<button onClick={handleClick}>
```

### 2. Keep Handlers Small

Large handlers should be in separate chunks. The compiler extracts handlers, but smaller handlers load faster:

```typescript
// Good - small, focused handler
const handleSubmit = onClick$(async () => {
  await submitForm();
});

// Consider: Break complex logic into imported functions
import { processData } from './utils';
const handleSubmit = onClick$(async () => {
  await processData();
});
```

### 3. Capture Minimal State

Only capture what handlers actually need:

```typescript
// Good - only captures what's needed
const increment = onClick$(() => {
  count.set(c => c + 1);
}, [count]);

// Bad - capturing unnecessary state
const increment = onClick$(() => {
  count.set(c => c + 1);
}, [count, name, items, user, preferences]);
```

### 4. Choose Appropriate Hydration Strategies

| Use Case | Strategy |
|----------|----------|
| Above-the-fold interactive | `load` |
| Below-the-fold content | `visible` |
| Modals, drawers | `interaction` |
| Analytics, tracking | `idle` |
| Desktop-only features | `media` |
| Static content | `never` |

### 5. Prefetch on Hover

Enable prefetching for perceived performance:

```typescript
<Hydrate when="interaction" prefetch={true} componentId="modal">
  <Modal />
</Hydrate>
```

### 6. Test Without JavaScript

Ensure static content works with JavaScript disabled:

```typescript
// Static content should be readable
const Article = static$(() => (
  <article>
    <h1>Article Title</h1>
    <p>Content that should be accessible without JS...</p>
  </article>
));
```

## Debugging

Enable verbose logging:

```typescript
import { configureLoader } from '@philjs/resumable';

configureLoader({ isDev: true });
```

Check statistics:

```typescript
import { getHydrationStats, getLoaderStats, getContainerStats } from '@philjs/resumable';

console.log('Hydration:', getHydrationStats());
console.log('Loader:', getLoaderStats());
console.log('Containers:', getContainerStats());
```

## Performance Comparison

| Metric | React (Hydration) | Resumable |
|--------|------------------|-----------|
| Initial JS | ~100KB+ | ~2KB (bootstrap) |
| TTI | 2-5 seconds | Instant |
| First Interaction Delay | 0 (after hydration) | 50-100ms (load + execute) |
| Subsequent Interactions | Instant | Instant |
| Memory (idle) | Full app | Minimal |
| LCP Impact | Blocked by JS | None |
| CLS Risk | High (hydration mismatch) | None |

## API Reference

### QRL Functions

| Function | Description |
|----------|-------------|
| `$(fn, captures?, names?)` | Create lazy QRL from function |
| `component$(fn)` | Create lazy component QRL |
| `event$(fn, captures?)` | Create typed event handler QRL |
| `onClick$`, `onInput$`, etc. | Typed event handler shortcuts |
| `qrl(chunk, symbol, captures?)` | Reference external module |
| `parseQRL(str)` | Parse serialized QRL string |
| `isQRL(value)` | Check if value is a QRL |
| `prefetchQRL(qrl)` | Prefetch QRL's chunk |
| `inlineQRL(value)` | Create pre-resolved QRL |

### Resumable Functions

| Function | Description |
|----------|-------------|
| `resumable$(fn, options?)` | Create resumable component |
| `useSignal(initial)` | Create resumable signal |
| `useComputed(fn, deps?)` | Create computed signal |
| `handler$(fn, captures?)` | Create event handler with captures |
| `static$(fn)` | Create static (never hydrate) component |
| `client$(fn, fallback?)` | Create client-only component |
| `server$component(fn)` | Create server-only component |
| `server$(fn)` | Create server-side function |
| `browser$(fn)` | Create browser-only function |

### SSR Functions

| Function | Description |
|----------|-------------|
| `renderToResumableString(app, config?)` | Render to HTML string |
| `createStreamingRenderer(config?)` | Create streaming renderer |
| `resume(config?)` | Resume on client |

### Container Functions

| Function | Description |
|----------|-------------|
| `ResumableContainer` | Root container component |
| `ErrorBoundary` | Error boundary component |
| `Suspense` | Suspense boundary component |
| `resumeContainer(el, config?)` | Resume specific container |
| `resumeAllContainers(config?)` | Resume all containers |
| `getContainer(id)` | Get container state |
| `isContainerHydrated(id)` | Check if hydrated |
| `waitForContainer(id)` | Wait for hydration |
| `disposeContainer(id)` | Dispose container |

### Hydration Functions

| Function | Description |
|----------|-------------|
| `Hydrate` | Hydration boundary component |
| `setupHydration(el, options)` | Manual hydration setup |
| `cancelHydration(id)` | Cancel pending hydration |
| `forceHydration(id)` | Force immediate hydration |
| `isHydrated(id)` | Check hydration status |
| `useHydration(options)` | Hydration control hook |
| `getHydrationStats()` | Get hydration statistics |
| `waitForHydration()` | Wait for all hydration |

### Serialization Functions

| Function | Description |
|----------|-------------|
| `serializeValue(value)` | Serialize any JS value |
| `deserializeValue(serialized)` | Deserialize to JS |
| `createSerializationContext(options?)` | Create context |
| `generateStateScript(ctx)` | Generate state `<script>` |
| `generateBootstrapScript(options?)` | Generate bootstrap script |

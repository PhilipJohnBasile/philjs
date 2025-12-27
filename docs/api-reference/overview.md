# API Reference

Complete API documentation for PhilJS framework.

## Overview

This API reference documents all public APIs available in PhilJS. Each API is documented with:

- **Signature**: Function/method signature with TypeScript types
- **Parameters**: Description of each parameter
- **Returns**: Return value and type
- **Examples**: Usage examples
- **Notes**: Important behavior and caveats

## Packages

PhilJS is organized into several packages:

### @philjs/core

Core reactive primitives and rendering.

- **[Reactivity API](./reactivity.md)**: `signal()`, `memo()`, `effect()`, `batch()`
- **[Components API](./components.md)**: `render()`, `hydrate()`, JSX
- **[Context API](./context.md)**: `createContext()`, `useContext()`
- **[Lifecycle API](./lifecycle.md)**: Component lifecycle hooks

### @philjs/router

Low-level routing utilities.

- **[Router API](./router.md)**: `createRouter()`, `discoverRoutes()`, `matchRoute()`, `findLayouts()`, `SmartPreloader`, `ViewTransitionManager`
- **[Routing Guides](../routing/overview.md)**: Conceptual walkthroughs (some examples show planned high-level helpers such as `<Router>` and `Link`)

### @philjs/ssr

Server-side rendering.

- **[SSR API](./ssr.md)**: `renderToString()`, `renderToStream()`
- **[Hydration API](./hydration.md)**: Client-side hydration utilities

### @philjs/islands

Island architecture for partial hydration.

- **[Islands API](./islands.md)**: `Island`, `createIsland()`

### @philjs/devtools

Development tools and debugging.

- **[DevTools API](./devtools.md)**: Debug utilities and inspectors

## Type Definitions

PhilJS is written in TypeScript and provides full type definitions.

### Core Types

```typescript
// Signal type
type Signal<T> = {
  (): T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (callback: (value: T) => void) => () => void;
};

// Memo type
type Memo<T> = {
  (): T;
};

// Effect type
type Effect = () => void | (() => void);

// JSX element
type JSX.Element = any;

// Component type
type Component<P = {}> = (props: P) => JSX.Element;
```

### Router Types

```typescript
// Route module discovered from the filesystem
type RouteModule = {
  loader?: () => Promise<unknown>;
  action?: (request: Request) => Promise<Response>;
  default?: (props: any) => any;
  config?: Record<string, unknown>;
};

// Pattern metadata produced by discoverRoutes()
type RoutePattern = {
  pattern: string;
  regex: RegExp;
  params: string[];
  filePath: string;
  priority: number;
};

// Smart preloading options
type PreloadOptions = {
  strategy?: 'hover' | 'visible' | 'intent' | 'eager' | 'manual';
  hoverDelay?: number;
  intentThreshold?: number;
  maxConcurrent?: number;
  priority?: 'high' | 'low' | 'auto';
};

// View transition options
type ViewTransitionOptions = {
  type?: 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'fade' | 'scale' | 'custom';
  duration?: number;
  easing?: string;
  customCSS?: string;
};
```

### SSR Types

```typescript
// Render result
interface RenderResult {
  html: string;
  head?: {
    title?: string;
    meta?: Array<{ name: string; content: string }>;
  };
}

// Stream options
interface StreamOptions {
  onShellReady?: () => void;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
}
```

## Import Paths

### ES Modules

```typescript
// Core APIs
import { signal, memo, effect, batch } from 'philjs-core';
import { render, hydrate } from 'philjs-core';
import { createContext, useContext } from 'philjs-core';

// Router APIs
import {
  createRouter,
  discoverRoutes,
  matchRoute,
  findLayouts,
  applyLayouts,
  initSmartPreloader,
  initViewTransitions,
} from 'philjs-router';

// SSR APIs
import { renderToString, renderToStream } from 'philjs-ssr';

// Islands
import { Island } from 'philjs-islands';

// DevTools
import { DevTools } from 'philjs-devtools';
```

### Note on CommonJS

PhilJS 2.0+ is **ESM-only**. CommonJS is not supported. If you need to use PhilJS in a CommonJS environment, use dynamic imports:

```javascript
// Dynamic import in CommonJS
const { signal, memo, effect } = await import('philjs-core');
```

We recommend migrating to ESM for better tree-shaking, faster builds, and access to modern JavaScript features.

## Version Compatibility

This documentation covers PhilJS version **2.0.0** and above.

### Runtime Requirements

- **Node.js 24.0+** - Required for native ESM and ES2024 features
- **TypeScript 6.0+** - Required for isolated declarations

### Breaking Changes

Major version updates may include breaking changes. See the [Migration Guide](../migration/overview.md) for upgrade instructions.

### Deprecations

APIs marked as deprecated will be removed in the next major version. Warnings are logged in development mode.

## Browser Support

PhilJS supports all modern browsers with ES2024 support:

- **Chrome/Edge**: 120+
- **Firefox**: 121+
- **Safari**: 17.4+
- **iOS Safari**: 17.4+
- **Chrome Android**: 120+

### ES2024 Features Used

PhilJS leverages modern JavaScript features:

- `Promise.withResolvers()` for cleaner async patterns
- `Object.groupBy()` and `Map.groupBy()` for data organization
- `Array.prototype.toSorted()`, `toReversed()`, `toSpliced()` for immutable operations
- `Set` methods: `union()`, `intersection()`, `difference()`
- Well-formed Unicode strings

No polyfills are required for supported browser versions.

## Quick Reference

### Reactivity

```typescript
import { signal, memo, effect, batch } from 'philjs-core';

// Create signal
const count = signal(0);

// Read signal
console.log(count()); // 0

// Update signal
count.set(1);
count.set(c => c + 1);

// Create memo
const doubled = memo(() => count() * 2);

// Create effect
effect(() => {
  console.log('Count:', count());
});

// Batch updates
batch(() => {
  count.set(1);
  count.set(2);
  count.set(3);
}); // Only triggers effect once
```

### Components

```typescript
import { render } from 'philjs-core';

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

render(<Counter />, document.getElementById('app')!);
```

### Router

```typescript
import { Router, Route, Link, useNavigate } from 'philjs-router';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </Router>
  );
}

function NavigateButton() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/about')}>
      Go to About
    </button>
  );
}
```

### Context

```typescript
import { createContext, useContext } from 'philjs-core';

const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const theme = signal<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={theme()}>
      <ThemedButton />
    </ThemeContext.Provider>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);

  return (
    <button className={`btn-${theme}`}>
      Themed Button
    </button>
  );
}
```

### SSR

```typescript
import { renderToString } from 'philjs-ssr';

// Server-side
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

// Client-side
import { hydrate } from 'philjs-core';

hydrate(<App />, document.getElementById('app')!);
```

## Next Steps

- **[Reactivity API](./reactivity.md)**: Learn about signals, memos, and effects
- **[Components API](./components.md)**: Component rendering and JSX
- **[Router API](./router.md)**: Client-side routing
- **[SSR API](./ssr.md)**: Server-side rendering

## Contributing

Found an error in the documentation? Please [open an issue](https://github.com/philjs/philjs/issues) or submit a pull request.

---

**Need help?** Check the [Troubleshooting Guide](../troubleshooting/overview.md) or ask in [GitHub Discussions](https://github.com/philjs/philjs/discussions).

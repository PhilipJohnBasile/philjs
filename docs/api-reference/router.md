# Router API

Low-level routing utilities for PhilJS applications. The `philjs-router` package focuses on file-based route discovery, selective hydration helpers, smart preloading, and view transitions. It does **not** ship a JSX `<Router>` component – you control how route manifests are wired into your app.

---

## Route Manifests

### `RouteModule`

```ts
type RouteModule = {
  loader?: () => Promise<unknown>;
  action?: (request: Request) => Promise<Response>;
  default?: (props: any) => any;
  config?: Record<string, unknown>;
};
```

Use this type to describe route files discovered from your filesystem. It is re-exported as `Route` for convenience.

### `createRouter(manifest)`

```ts
import { createRouter } from 'philjs-router';

const router = createRouter({
  '/': await import('./routes/index'),
  '/products/:id': await import('./routes/products/[id]'),
});
```

- `manifest`: `Record<string, RouteModule>` – map of pathname pattern to module.
- Returns `{ manifest }` – a light container you can extend with your own runtime.

The router package intentionally stays unopinionated about rendering. Pair the manifest with `philjs-core` rendering or your own navigation layer.

---

## File-Based Discovery

### `discoverRoutes(routesDir)`

```ts
import { discoverRoutes } from 'philjs-router';

const patterns = discoverRoutes(new URL('./routes', import.meta.url).pathname);
```

- Scans a directory (recursively) for `.ts`, `.tsx`, `.js`, `.jsx` route files.
- Ignores files prefixed with `_` (reserved for layouts/utilities).
- Translates file names into route patterns (`products/[id].tsx` → `/products/:id`).
- Returns an array of `RoutePattern` objects sorted by matching priority.

`RoutePattern` shape:

```ts
type RoutePattern = {
  pattern: string;              // e.g. "/blog/:slug"
  regex: RegExp;                // compiled matcher
  params: string[];             // parameter names in order
  filePath: string;             // relative path to route module
  priority: number;             // specific routes sort higher
};
```

### `matchRoute(url, patterns)`

```ts
import { discoverRoutes, matchRoute } from 'philjs-router';

const patterns = discoverRoutes(routesDir);
const match = matchRoute('/products/42', patterns);

if (match) {
  // match.route -> RoutePattern
  // match.params -> { id: '42' }
}
```

- Returns `{ route, params }` when a pattern matches.
- Returns `null` if no pattern matches.
- Gives you full control over how to load/render matched modules.

---

## Nested Layouts

### `findLayouts(routeFilePath, routesDir, loadModule)`

Walks up the filesystem to locate `_layout.(ts|tsx|js|jsx)` files that wrap the given route.

```ts
import { findLayouts } from 'philjs-router';

const layouts = await findLayouts(
  'products/[id].tsx',
  routesDir,
  (file) => import(file)
);
```

### `applyLayouts(component, layouts, params)`

Applies the discovered layout chain (root → leaf) around a rendered route component.

```ts
import { applyLayouts } from 'philjs-router';

const tree = applyLayouts(routeVNode, layouts, params);
```

Both helpers use simple VNode typing (`any`) so you can provide PhilJS components, plain functions, or other virtual DOM outputs.

---

## Smart Preloading

PhilJS includes an intent-aware preloader that predicts navigation from pointer behaviour, hover, or visibility. All hooks/classes live in `smart-preload.ts`.

### `SmartPreloader`

```ts
import { SmartPreloader } from 'philjs-router';

const preloader = new SmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.65,
  maxConcurrent: 4,
});
```

- Manages a preload queue with prioritisation.
- Tracks mouse movement to compute click intent.
- Supports hover-, visibility-, manual-, eager-, and intent-based strategies.

### `initSmartPreloader(options?)`

Creates (or replaces) the global singleton instance and starts tracking pointer movement.

```ts
import { initSmartPreloader } from 'philjs-router';

initSmartPreloader({ strategy: 'intent', hoverDelay: 80 });
```

### `getSmartPreloader()`

Access the global instance if initialised.

### `usePreload(href, options?)`

Imperative hook that preloads a URL immediately and returns a manual trigger:

```ts
const trigger = usePreload('/pricing', { priority: 'high' });
trigger(); // force preload now
```

### `preloadLink(element, options?)`

DOM directive-style helper for `<a>` elements. Registers hover/visibility listeners.

### `calculateClickIntent(mousePos, mouseVelocity, linkBounds)`

Pure helper returning a 0–1 score. Useful for analytics or custom strategies.

### `predictNextRoute(currentPath, visitHistory)`

Produces a probability map of likely next routes based on navigation history.

---

## View Transitions

Progressively enhance navigation with the View Transitions API, with fallbacks when unavailable.

### `ViewTransitionManager`

```ts
import { ViewTransitionManager } from 'philjs-router';

const manager = new ViewTransitionManager();
await manager.transition(() => {
  // mutate DOM / swap route output
}, { type: 'slide-left' });
```

- Injects default transition CSS once.
- Runs transitions via `document.startViewTransition`.
- Emits lifecycle callbacks (`start`, `finish`, `error`, `ready`) you can subscribe to.

### Helper Exports

- `initViewTransitions()` / `getViewTransitionManager()` – manage the global singleton.
- `navigateWithTransition(url, options?)` – wrap `location.assign`/history updates with animations.
- `markSharedElement(element, key)` – mark elements for shared element transitions.
- `transitionLink(anchor, options?)` – enhance `<a>` tags to animate on click.
- `supportsViewTransitions()` – feature detection guard.
- `animateFallback(element, config)` – CSS animation fallback when the API is missing.

### Types

```ts
type TransitionType =
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'fade'
  | 'scale'
  | 'custom';

type ViewTransitionOptions = {
  type?: TransitionType;
  duration?: number;
  easing?: string;
  customCSS?: string;
};
```

---

## Putting It Together

```ts
import {
  createRouter,
  discoverRoutes,
  matchRoute,
  findLayouts,
  applyLayouts,
  initSmartPreloader,
  initViewTransitions,
} from 'philjs-router';
import { render } from 'philjs-core';

const routesDir = new URL('../routes', import.meta.url).pathname;
const patterns = discoverRoutes(routesDir);
const router = createRouter(
  Object.fromEntries(patterns.map((p) => [p.pattern, () => import(p.filePath)]))
);

initSmartPreloader({ strategy: 'intent' });
initViewTransitions();

async function navigate(pathname: string) {
  const matched = matchRoute(pathname, patterns);
  if (!matched) {
    return render(() => '404', document.getElementById('app')!);
  }

  const { route, params } = matched;
  const module = await router.manifest[route.pattern]();
  const layouts = await findLayouts(route.filePath, routesDir, (file) => import(file));
  const tree = applyLayouts(module.default(params), layouts, params);
  render(() => tree, document.getElementById('app')!);
}
```

This example demonstrates how the provided primitives compose: discover route files, lazily load them, wrap with `_layout` components, and enhance navigation with preloading and transitions.

---

## See Also

- [Routing Guide](/docs/routing/overview.md) – higher-level concepts and best practices.
- [Smart Preloading Guide](/docs/routing/smart-preloading.md) – deep dive into intent prediction.
- [View Transitions Guide](/docs/routing/view-transitions.md) – animation recipes and CSS tips.

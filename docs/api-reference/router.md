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

## High-Level Router API

PhilJS also ships a declarative router built on top of the manifest utilities. It handles DOM rendering, signal-aware navigation, view transitions, and intent-based prefetching out of the box.

### `createAppRouter(options)`

```ts
import { createAppRouter } from 'philjs-router';

const router = createAppRouter({
  target: '#app',
  routes: [
    { path: '/', component: () => <Home /> },
    {
      path: '/blog',
      layout: ({ children }) => <BlogLayout>{children}</BlogLayout>,
      component: () => <BlogIndex />,
      children: [
        {
          path: '/:slug',
          component: ({ params }) => <BlogPost slug={params.slug} />,
        },
      ],
    },
  ],
  prefetch: true,         // Smart preloading enabled globally
  transitions: { type: 'fade', duration: 250 },
});
```

- `target`: CSS selector or element where the router should render (defaults to `#app`).
- `routes`: Array of route definitions with optional nested routes, loaders, actions, layouts, prefetch, and transition metadata.
- Returns a `HighLevelRouter` with `navigate(to, options)` and `dispose()` methods.

### Route Definition Options

```ts
type RouteDefinition = {
  path: string;                       // e.g. '/', '/docs/:slug'
  component: (props) => VNode;        // page component
  loader?: (ctx) => Promise<any>;     // optional data loader (params + Request)
  action?: (ctx) => Promise<Response>; // optional action handler
  layout?: (props) => VNode;          // wraps child routes / page
  children?: RouteDefinition[];       // nested routes
  transition?: RouteTransitionOptions;// per-route view transition overrides
  prefetch?: PrefetchOptions;         // per-route smart prefetch overrides
  config?: Record<string, unknown>;   // forwarded to SSR/static generation
};
```

Layouts from parents automatically wrap child routes, giving you nested layouts similar to Remix/Next while still using resumable PhilJS components.

### Hooks & Components

- `useRouter()` → `{ route, navigate }` reactive state for the current route.
- `useRoute()` → `MatchedRoute | null` convenience hook returning the active match (params, data, component).
- `RouterView()` → renders the current route’s component; useful if you want the router to live inside a larger PhilJS tree instead of the default `target`.
- `Link` – declarative navigation with optional `replace`, `class`, etc.

```tsx
import { Link, RouterView, useRoute } from 'philjs-router';

function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/docs">Docs</Link>
      <Link to="/blog" replace>Blog</Link>
    </nav>
  );
}

function CurrentRouteDebugger() {
  const route = useRoute();
  return <pre>{JSON.stringify(route?.params ?? {}, null, 2)}</pre>;
}

function AppShell() {
  return (
    <main>
      <Nav />
      <RouterView />
      <CurrentRouteDebugger />
    </main>
  );
}
```

`Link` is implemented with PhilJS signals so navigation is instant—no full page reloads—and integrates with the smart preloader when enabled.

---

### `createRouteManifest(routes, options?)`

Returns the plain manifest object that `createAppRouter` uses internally. Useful for SSR/SSG pipelines where you need to feed route modules to `philjs-ssr`:

```ts
import { createRouteManifest } from 'philjs-router';
import { routes } from './routes';

export const routeManifest = createRouteManifest(routes);
```

- `options.base` – optional base path when deploying under a subdirectory.

### `generateRouteTypes(routes, options?)`

Generates a string containing TypeScript definitions for route params/pathnames. You can write this to `routes.d.ts` to get typed `params` in every component.

```ts
import { generateRouteTypes } from 'philjs-router';

const dts = generateRouteTypes(routes, { moduleName: './routes' });
fs.writeFileSync('src/routes.d.ts', dts);
```

- `options.moduleName` – emit `declare module "moduleName" { ... }` so the types augment that module.
- `options.base` – prepend a base path to every route.

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

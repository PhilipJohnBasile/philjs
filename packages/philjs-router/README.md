# philjs-router

File-based routing with nested layouts, smart preloading, and view transitions for PhilJS.

## Installation

```bash
pnpm add philjs-router
```

## Usage

### High-Level Declarative Router

The simplest way to use PhilJS Router is with the declarative API:

```typescript
import { createAppRouter, Link, RouterView } from 'philjs-router';

// Define your routes
const router = createAppRouter({
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/products/:id',
      component: ProductPage,
      loader: async ({ params }) => {
        const res = await fetch(`/api/products/${params.id}`);
        return res.json();
      },
    },
    {
      path: '/blog',
      layout: BlogLayout,
      children: [
        { path: '/blog', component: BlogIndex },
        { path: '/blog/:slug', component: BlogPost },
      ],
    },
  ],
  base: '',
  transitions: true,
  prefetch: { strategy: 'intent' },
  target: '#app',
});

// Use in your app
function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/products/123">Product 123</Link>
        <Link to="/blog">Blog</Link>
      </nav>
      <RouterView />
    </div>
  );
}
```

### Using Router Hooks

```typescript
import { useRouter, useRoute } from 'philjs-router';

function MyComponent() {
  const { route, navigate } = useRouter();
  const currentRoute = useRoute();

  const handleClick = () => {
    navigate('/products/456', { replace: false });
  };

  return (
    <div>
      <p>Current path: {currentRoute?.path}</p>
      <p>Params: {JSON.stringify(currentRoute?.params)}</p>
      <button onClick={handleClick}>Go to Product 456</button>
    </div>
  );
}
```

### File-Based Route Discovery

For build-time route generation:

```typescript
import { discoverRoutes, matchRoute } from 'philjs-router';

// Discover routes from a directory structure
const routes = discoverRoutes('/path/to/routes');

// Match a URL to a route
const match = matchRoute('/products/123', routes);
if (match) {
  console.log('Matched route:', match.route.pattern);
  console.log('Params:', match.params);
}
```

### Smart Preloading

PhilJS Router includes intelligent route preloading based on user intent:

```typescript
import { initSmartPreloader, usePreload } from 'philjs-router';

// Initialize smart preloader
const preloader = initSmartPreloader({
  strategy: 'intent', // 'hover' | 'visible' | 'intent' | 'eager'
  intentThreshold: 0.6,
  priority: 'auto',
});

// Manually preload a route
function NavLink({ to, children }) {
  const handleMouseEnter = usePreload(to, { strategy: 'hover' });

  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

### View Transitions

Add smooth page transitions with the View Transitions API:

```typescript
import { initViewTransitions, navigateWithTransition } from 'philjs-router';

// Initialize view transitions
const transitionManager = initViewTransitions();

// Navigate with custom transition
await navigateWithTransition('/about', {
  type: 'slide-left',
  duration: 300,
  easing: 'ease-in-out',
});

// Mark shared elements for cross-fade effects
function ProductImage({ src, id }) {
  return (
    <img
      src={src}
      style={{ viewTransitionName: `product-${id}` }}
    />
  );
}
```

## API

### Router Creation

- `createAppRouter(options)` - Create a high-level router with declarative routes
- `createRouteManifest(routes, options)` - Generate route manifest for manual use
- `createRouteMatcher(routes, options)` - Create a route matcher function
- `generateRouteTypes(routes, options)` - Generate TypeScript types for routes

### Hooks

- `useRouter()` - Access router state (route + navigate function)
- `useRoute()` - Access current matched route details

### Components

- `<Link to="/path">` - Declarative navigation link
- `<RouterView />` - Renders the current route component

### File Discovery

- `discoverRoutes(routesDir)` - Scan directory for file-based routes
- `matchRoute(url, routes)` - Match URL against route patterns

### Smart Preloading

- `initSmartPreloader(options)` - Initialize smart preloading system
- `getSmartPreloader()` - Get the current preloader instance
- `usePreload(path, options)` - Hook for manual preloading
- `preloadLink(path, options)` - Preload a specific route
- `calculateClickIntent(element)` - Calculate user's intent to click
- `predictNextRoute()` - Predict the user's next navigation

### View Transitions

- `initViewTransitions()` - Initialize view transitions manager
- `getViewTransitionManager()` - Get current transition manager
- `navigateWithTransition(to, options)` - Navigate with transition effect
- `markSharedElement(element, name)` - Mark element for shared transitions
- `supportsViewTransitions()` - Check browser support
- `animateFallback(element, type)` - Fallback animation for unsupported browsers

## Examples

See the router in action in these example apps:

- [Demo App](../../examples/demo-app) - Full-featured demo with router, SSR, and islands
- [Todo App](../../examples/todo-app) - Simple todo app with client-side routing

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Features

- **File-based routing** - Automatic route generation from directory structure
- **Nested layouts** - Compose layouts hierarchically
- **Data loaders** - Fetch data before rendering routes
- **Smart preloading** - Intent-based route prefetching
- **View transitions** - Smooth page transitions with shared elements
- **Type-safe routing** - Generate TypeScript types from route definitions
- **SSR compatible** - Works with server-side rendering
- **Tiny & fast** - Minimal bundle size with maximum performance

## Route File Conventions

When using file-based routing:

- `index.tsx` → `/`
- `about.tsx` → `/about`
- `products/[id].tsx` → `/products/:id` (dynamic segment)
- `blog/[...slug].tsx` → `/blog/*` (catch-all)
- `_layout.tsx` → Layout component (not a route)
- `_component.tsx` → Shared component (not a route)

## License

MIT

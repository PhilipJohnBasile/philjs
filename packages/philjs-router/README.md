# philjs-router

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

File-based routing with Remix-style nested routes, data loading, error boundaries, Qwik-style speculative prefetching, and view transitions for PhilJS.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

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

### Remix-Style Nested Routes with Data Loading

PhilJS Router supports Remix-style nested routes with parallel data loading:

```typescript
// routes/users.tsx - Parent layout
export async function loader() {
  return { users: await fetchUsers() };
}

export default function UsersLayout({ children }) {
  const { users } = useLoaderData();
  return (
    <div>
      <Sidebar users={users} />
      <main>{children}</main>
    </div>
  );
}

// routes/users/[id].tsx - Child route
export async function loader({ params }) {
  return { user: await fetchUser(params.id) };
}

export default function UserDetail() {
  const { user } = useLoaderData();
  return <UserProfile user={user} />;
}
```

**Key Features:**
- Parent and child loaders run in **parallel** (no waterfall)
- Each route segment can have its own loader, action, and error boundary
- Data is available via `useLoaderData()` hook

### Deferred Data Loading (Streaming)

For slow data that shouldn't block initial render:

```typescript
import { defer, Await, useLoaderData } from 'philjs-router';

export async function loader() {
  return {
    user: await fetchUser(), // Blocks - critical data
    posts: defer(fetchPosts()), // Streams in later
    comments: defer(fetchComments()), // Also streams
  };
}

function UserPage() {
  const { user, posts, comments } = useLoaderData();

  return (
    <div>
      {/* Renders immediately */}
      <UserHeader user={user} />

      {/* Streams in when ready */}
      <Suspense fallback={<Spinner />}>
        <Await resolve={posts}>
          {(posts) => <PostList posts={posts} />}
        </Await>
      </Suspense>

      <Suspense fallback={<CommentSkeleton />}>
        <Await resolve={comments}>
          {(comments) => <CommentList comments={comments} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

### Route Actions (Form Handling)

Handle form submissions with route actions:

```typescript
import { Form, useActionData, useNavigation, redirect } from 'philjs-router';

// In your route file
export async function action({ request }) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const user = await createUser({ email, password });

  if (!user) {
    return { error: 'Failed to create user' };
  }

  return redirect('/dashboard');
}

export default function SignUp() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Sign Up'}
      </button>
      {actionData?.error && <p className="error">{actionData.error}</p>}
    </Form>
  );
}
```

### Route Error Boundaries

Handle errors at any level of the route hierarchy:

```typescript
import { useRouteError, isRouteErrorResponse, throwNotFound } from 'philjs-router';

// In your route file
export async function loader({ params }) {
  const user = await fetchUser(params.id);

  if (!user) {
    throwNotFound('User not found');
  }

  return { user };
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-page">
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  );
}

export default function UserDetail() {
  const { user } = useLoaderData();
  return <UserProfile user={user} />;
}
```

### Accessing Parent Route Data

Access loader data from any route in the hierarchy:

```typescript
import { useRouteLoaderData, useMatches } from 'philjs-router';

function ChildComponent() {
  // Access specific parent's data by route ID
  const parentData = useRouteLoaderData('routes/users');

  // Or access all matched routes
  const matches = useMatches();

  return (
    <div>
      <p>Parent user count: {parentData?.users.length}</p>
      <ul>
        {matches.map((match) => (
          <li key={match.id}>{match.pathname}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Fetchers for Non-Navigation Mutations

Use fetchers for mutations that don't navigate:

```typescript
import { useFetcher } from 'philjs-router';

function LikeButton({ postId }) {
  const fetcher = useFetcher();
  const isLiking = fetcher.state === 'submitting';

  return (
    <fetcher.Form method="post" action="/api/like">
      <input type="hidden" name="postId" value={postId} />
      <button type="submit" disabled={isLiking}>
        {fetcher.data?.liked ? 'Unlike' : 'Like'}
      </button>
    </fetcher.Form>
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

### Qwik-Style Speculative Prefetching

PhilJS Router includes Qwik-style speculative prefetching for lightning-fast navigation:

```typescript
import { EnhancedLink, initPrefetchManager, prefetchRoute, prefetchRouteWithData } from 'philjs-router';

// Initialize the prefetch manager (optional, auto-initializes on first use)
initPrefetchManager({
  maxConcurrent: 3,
  respectSaveData: true,
  minConnectionType: '3g',
});
```

#### Link Component Prefetch Modes

```tsx
// Prefetch on hover (after 100ms delay) - default for internal links
<EnhancedLink href="/dashboard" prefetch="hover">Dashboard</EnhancedLink>

// Prefetch when visible (Intersection Observer)
<EnhancedLink href="/about" prefetch="visible">About</EnhancedLink>

// Prefetch on intent (hover + focus)
<EnhancedLink href="/users" prefetch="intent">Users</EnhancedLink>

// Prefetch immediately on render (critical paths)
<EnhancedLink href="/critical" prefetch="render">Critical</EnhancedLink>

// No prefetch (default for external links, or for heavy pages)
<EnhancedLink href="/heavy" prefetch="none">Heavy Page</EnhancedLink>
```

#### Advanced Prefetch Options

```tsx
// Prefetch with custom delay
<EnhancedLink
  href="/dashboard"
  prefetch={{ mode: 'hover', delay: 200 }}
>
  Dashboard
</EnhancedLink>

// Prefetch route code AND run data loader
<EnhancedLink
  href="/users/123"
  prefetch={{ mode: 'hover', withData: true }}
>
  User Profile
</EnhancedLink>

// Critical path with immediate data prefetch
<EnhancedLink
  href="/checkout"
  prefetch={{ mode: 'render', withData: true, preload: true }}
>
  Checkout
</EnhancedLink>
```

#### Programmatic Prefetching

```typescript
import { prefetchRoute, prefetchRouteWithData, getPrefetchManager } from 'philjs-router';

// Prefetch route code only
await prefetchRoute('/dashboard');

// Prefetch route + run data loader
await prefetchRouteWithData('/users', { preload: true });

// Access the prefetch manager directly
const manager = getPrefetchManager();
manager.registerRouteModule('/products/:id', {
  loader: async ({ params }) => fetch(`/api/products/${params.id}`).then(r => r.json()),
  default: ProductPage,
});

// Check prefetch status
console.log(manager.isPrefetched('/dashboard')); // true/false
console.log(manager.getStats()); // { queued, loading, loaded, failed, cacheHits, cacheMisses }
```

#### usePrefetchLink Hook

```tsx
import { usePrefetchLink } from 'philjs-router';

function CustomNavLink({ href, children }) {
  const { prefetch, isPrefetched, isLoading, handlers } = usePrefetchLink(href, {
    mode: 'hover',
    withData: true,
  });

  return (
    <a
      href={href}
      {...handlers}
      className={isPrefetched ? 'prefetched' : ''}
      data-loading={isLoading}
    >
      {children}
    </a>
  );
}
```

### Service Worker Integration

Enable background caching for prefetched routes:

```typescript
import {
  registerPrefetchServiceWorker,
  generatePrefetchServiceWorker,
  createInlineServiceWorker,
  swrFetch,
} from 'philjs-router';

// Option 1: Register a service worker file
await registerPrefetchServiceWorker({
  swPath: '/sw.js',
  onReady: (registration) => console.log('SW ready:', registration.scope),
  onUpdate: (registration) => console.log('SW updated'),
});

// Option 2: Generate SW code for your build system
const swCode = generatePrefetchServiceWorker({
  routeCacheName: 'my-app-routes-v1',
  dataCacheName: 'my-app-data-v1',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 50,
  staleWhileRevalidate: true,
});
// Write swCode to public/sw.js during build

// Option 3: Inline SW for development
const swUrl = createInlineServiceWorker();
await registerPrefetchServiceWorker({ swPath: swUrl });

// Stale-while-revalidate fetch for data
const response = await swrFetch('/api/data', {
  maxAge: 5 * 60 * 1000, // 5 minutes
  onRevalidate: (freshResponse) => {
    console.log('Data revalidated in background');
  },
});
```

### Smart Preloading (Legacy)

PhilJS Router also includes the original smart preloading based on user intent:

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

### Parallel Routes (Next.js 14 Style)

Render multiple pages in the same layout simultaneously with independent loading states:

```typescript
import {
  createParallelRouteConfig,
  matchParallelRoutes,
  loadParallelSlots,
  renderParallelSlots,
  useSlot,
} from 'philjs-router';

// Configure parallel routes
const config = createParallelRouteConfig({
  basePath: '/dashboard',
  slots: [
    // Sidebar slot - always present
    {
      name: '@sidebar',
      path: '/',
      loader: async () => ({ nav: await fetchNav() }),
      component: Sidebar,
    },
    // Main content slot
    {
      name: '@main',
      path: '/users',
      loader: async () => ({ users: await fetchUsers() }),
      component: UsersList,
    },
    // Optional modal slot with route interception
    {
      name: '@modal',
      path: '(.)photos/:id', // Intercepts /dashboard/photos/:id
      loader: async ({ params }) => ({ photo: await fetchPhoto(params.id) }),
      component: PhotoModal,
      optional: true,
    },
  ],
});

// Layout combines all slots
function DashboardLayout({ sidebar, main, modal }) {
  return (
    <div>
      {sidebar}
      <main>{main}</main>
      {modal} {/* Modal overlays when route is intercepted */}
    </div>
  );
}

// Use in slot components
function PhotoModal() {
  const { data, slotName } = useSlot();
  const { close } = useInterceptedNavigation();

  return (
    <div className="modal">
      <img src={data.photo.url} />
      <button onClick={close}>Close</button>
    </div>
  );
}
```

**Key Features:**
- **@slot syntax** - Named slots like @modal, @sidebar, @main
- **Route interception** - Soft navigation for modals, hard navigation for deep links
- **Parallel data loading** - All slots load simultaneously (no waterfalls!)
- **Independent states** - Each slot has its own loading/error state
- **Conditional rendering** - Slots only render when their route matches

**Route Interception Patterns:**
```typescript
// (.) - Same level
path: '(.)photos/:id'  // Intercepts /dashboard/photos/123

// (..) - One level up
path: '(..)photos/:id'  // Intercepts /photos/123 when in /dashboard

// (..)(..) - Two levels up
path: '(..)(..)photos/:id'  // Intercepts /photos/123 when in /dashboard/nested

// (...) - From root
path: '(...)photos/:id'  // Intercepts /photos/123 from anywhere
```

See [Parallel Routes Examples](./examples/parallel-routes/) for:
- Photo gallery with modal
- Dashboard with multiple slots
- Email client with multi-pane layout

## API

### Router Creation

- `createAppRouter(options)` - Create a high-level router with declarative routes
- `createRouteManifest(routes, options)` - Generate route manifest for manual use
- `createRouteMatcher(routes, options)` - Create a route matcher function
- `generateRouteTypes(routes, options)` - Generate TypeScript types for routes

### Data Loading Hooks

- `useLoaderData()` - Access loader data for the current route
- `useRouteLoaderData(routeId)` - Access loader data for a specific route
- `useMatchesData()` - Get all loader data from the route hierarchy
- `useMatches()` - Get all matched routes with data and handles
- `useLoaderLoading()` - Check if any loaders are loading

### Action Hooks

- `useActionData()` - Access the result of the most recent action
- `useNavigation()` - Access current navigation/submission state
- `useSubmit()` - Programmatically submit forms
- `useFetcher()` - Create a fetcher for non-navigation mutations
- `useFetchers()` - Access all active fetchers

### Error Boundary Hooks

- `useRouteError()` - Access the current route's error
- `useRouteErrorById(routeId)` - Access error for a specific route
- `useHasRouteError()` - Check if current route has an error
- `useRouteErrors()` - Get all route errors in the hierarchy

### Router Hooks

- `useRouter()` - Access router state (route + navigate function)
- `useRoute()` - Access current matched route details

### Parallel Routes Hooks

- `useSlot()` - Access current slot data and metadata
- `useSlotByName(name)` - Access specific slot by name
- `useSlots()` - Get all current slots
- `useInterception()` - Access route interception state
- `useInterceptedNavigation()` - Navigate with interception support

### Components

- `<Link to="/path">` - Declarative navigation link
- `<RouterView />` - Renders the current route component
- `<Form method="post">` - Enhanced form with router integration
- `<Await resolve={promise}>` - Render deferred data with Suspense
- `<Outlet />` - Render child routes in layouts
- `<RouteErrorBoundary>` - Catch and handle route errors

### File Discovery

- `discoverRoutes(routesDir)` - Scan directory for file-based routes
- `matchRoute(url, routes)` - Match URL against route patterns

### Qwik-Style Prefetching

- `initPrefetchManager(config)` - Initialize the prefetch manager
- `getPrefetchManager()` - Get the current prefetch manager instance
- `prefetchRoute(url, mode)` - Prefetch a route (code only)
- `prefetchRouteWithData(url, options)` - Prefetch route + run data loader
- `EnhancedLink` / `PrefetchLink` - Link component with prefetch modes
- `usePrefetchLink(href, options)` - Hook for custom prefetch control

### Intersection Observer Utilities

- `createIntersectionObserver(options)` - Create visibility observer
- `observeElement(element, options)` - Start observing an element
- `unobserveElement(element)` - Stop observing an element
- `createPrefetchZone(element, zone)` - Create prefetch trigger zone
- `getScrollDirection()` - Get current scroll direction
- `getLinksInScrollPath(links)` - Get links in scroll trajectory

### Service Worker Integration

- `generatePrefetchServiceWorker(config)` - Generate SW code for caching
- `registerPrefetchServiceWorker(options)` - Register the prefetch SW
- `initServiceWorkerPrefetch()` - Initialize SW communication
- `requestSwPrefetch(url)` - Request prefetch via service worker
- `isSwCached(url)` - Check if URL is cached in SW
- `swrFetch(url, options)` - Fetch with stale-while-revalidate

### Smart Preloading (Legacy)

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

### Parallel Routes

- `createParallelRouteConfig(config)` - Create parallel route configuration
- `matchParallelRoutes(pathname, config)` - Match pathname against slots
- `loadParallelSlots(slots, request)` - Load data for all slots in parallel
- `renderParallelSlots(slots, searchParams)` - Render all matched slots
- `navigateWithInterception(to, config, mode)` - Navigate with route interception
- `closeInterception()` - Close intercepted route and restore original
- `isIntercepted()` - Check if current navigation is intercepted
- `parseInterception(path)` - Parse interception config from path

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
- **Data loaders** - Fetch data before rendering routes with parallel execution
- **Parallel routes** - Next.js 14 style slots with independent loading states
- **Route interception** - Soft/hard navigation for modals and overlays
- **Qwik-style prefetching** - Speculative prefetching with multiple modes (hover, visible, intent, render)
- **Smart preloading** - Intent-based route prefetching with mouse trajectory prediction
- **Service worker integration** - Cache prefetched routes with stale-while-revalidate
- **Network-aware** - Respects Save-Data header and connection speed
- **Priority queue** - visible > hover > idle prefetch ordering
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

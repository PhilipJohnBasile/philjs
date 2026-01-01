# philjs-router-typesafe

A fully type-safe router for PhilJS inspired by [TanStack Router](https://tanstack.com/router). Get complete type inference for route params, search params, and loader data without manual type annotations.

## Features

- **Fully Typed Route Params**: Define `'/users/$userId/posts/$postId'` and get `{ userId: string; postId: string }` automatically
- **Zod Search Param Validation**: Validate and type search params with Zod schemas
- **Type-Safe Link Component**: Links are type-checked at compile time
- **Route-Attached Hooks**: Each route has `useParams()`, `useSearch()`, and `useLoaderData()` methods
- **Data Loaders**: Load data before rendering with full type inference
- **SSR Support**: Server-side rendering with data preloading
- **Zero Runtime Type Overhead**: Types are erased at compile time

## Installation

```bash
npm install philjs-router-typesafe zod
# or
pnpm add philjs-router-typesafe zod
# or
yarn add philjs-router-typesafe zod
```

## Quick Start

```typescript
import { z } from 'zod';
import { createRoute, Router, RouterOutlet, Link } from 'philjs-router-typesafe';

// Define routes with full type safety
const userRoute = createRoute({
  path: '/users/$userId',
  validateSearch: z.object({
    tab: z.enum(['posts', 'comments']).default('posts'),
    page: z.number().optional(),
  }),
  loader: async ({ params, search }) => {
    // params.userId is typed as string
    // search.tab is typed as 'posts' | 'comments'
    // search.page is typed as number | undefined
    const user = await fetchUser(params.userId);
    const posts = await fetchPosts(params.userId, {
      type: search.tab,
      page: search.page
    });
    return { user, posts };
  },
  component: ({ params, search, loaderData }) => (
    <div>
      <h1>User: {loaderData.user.name}</h1>
      <UserTabs active={search.tab} userId={params.userId} />
      <PostList posts={loaderData.posts} />
    </div>
  ),
});

// App setup
function App() {
  return (
    <Router routes={[userRoute]}>
      <nav>
        {/* Type-safe links - params and search are validated */}
        <Link
          to={userRoute}
          params={{ userId: '123' }}
          search={{ tab: 'posts' }}
        >
          View User
        </Link>
      </nav>
      <RouterOutlet />
    </Router>
  );
}
```

## API Reference

### Route Creation

#### `createRoute(options)`

Create a type-safe route definition.

```typescript
const route = createRoute({
  // Path with dynamic segments prefixed with $
  path: '/users/$userId/posts/$postId',

  // Optional: Zod schema for search params validation
  validateSearch: z.object({
    sort: z.enum(['asc', 'desc']).default('desc'),
    filter: z.string().optional(),
  }),

  // Optional: Data loader
  loader: async ({ params, search, request, abortController }) => {
    const response = await fetch(`/api/users/${params.userId}/posts/${params.postId}`);
    return response.json();
  },

  // Optional: Route component
  component: ({ params, search, loaderData, navigate }) => {
    return <div>...</div>;
  },

  // Optional: Error boundary component
  errorComponent: ({ error, reset }) => {
    return <div>Error: {error.message} <button onClick={reset}>Retry</button></div>;
  },

  // Optional: Loading component
  pendingComponent: () => <div>Loading...</div>,

  // Optional: Guard/redirect logic
  beforeLoad: async ({ params, search, location, cause }) => {
    if (!isAuthenticated()) {
      throw redirect('/login');
    }
  },

  // Optional: Metadata
  meta: {
    title: 'User Post',
    description: 'View a user post',
  },
});
```

#### `createRootRoute(options)`

Create a root layout route.

```typescript
const rootRoute = createRootRoute({
  component: ({ children }) => (
    <div class="app-layout">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  ),
});
```

#### `addChildren(parent, children)`

Add child routes to a parent.

```typescript
const routeTree = addChildren(rootRoute, [
  indexRoute,
  aboutRoute,
  addChildren(usersRoute, [
    userListRoute,
    userDetailRoute,
  ]),
]);
```

### Hooks

#### `useParams(route?)`

Get typed route params.

```typescript
function UserProfile() {
  // Typed: { userId: string }
  const { userId } = userRoute.useParams();

  // Or without specifying route (less type-safe)
  const params = useParams();

  return <div>User ID: {userId}</div>;
}
```

#### `useSearch(route?)`

Get typed and validated search params.

```typescript
function UserPosts() {
  // Typed: { tab: 'posts' | 'comments'; page?: number }
  const { tab, page } = userRoute.useSearch();

  return <PostList type={tab} page={page ?? 1} />;
}
```

#### `useLoaderData(route?)`

Get typed loader data.

```typescript
function UserDetails() {
  // Typed based on loader return type
  const { user, posts } = userRoute.useLoaderData();

  return (
    <div>
      <h1>{user.name}</h1>
      <span>{posts.length} posts</span>
    </div>
  );
}
```

#### `useNavigate()`

Get the navigate function.

```typescript
function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

#### `useNavigateTyped(route)`

Get a type-safe navigate function for a specific route.

```typescript
function UserCard({ userId }: { userId: string }) {
  const navigateToUser = useNavigateTyped(userRoute);

  return (
    <button onClick={() => navigateToUser({
      params: { userId },
      search: { tab: 'posts' }
    })}>
      View User
    </button>
  );
}
```

#### `useLocation()`

Get the current location.

```typescript
function Breadcrumbs() {
  const location = useLocation();
  return <span>Current: {location.pathname}</span>;
}
```

#### `useMatchRoute(route, options?)`

Check if a route is active.

```typescript
function NavLink({ route, children }) {
  const isActive = useMatchRoute(route);
  return <a class={isActive ? 'active' : ''}>{children}</a>;
}
```

#### `useMatches()`

Get all matched routes in the hierarchy.

```typescript
function Breadcrumbs() {
  const matches = useMatches();

  return (
    <nav aria-label="Breadcrumb">
      {matches.map((match) => (
        <span key={match.route.id}>
          {match.route.meta?.title}
        </span>
      ))}
    </nav>
  );
}
```

#### `usePreloadRoute(route)`

Preload a route's data on hover/focus.

```typescript
function UserLink({ userId }) {
  const preload = usePreloadRoute(userRoute);

  return (
    <a
      href={`/users/${userId}`}
      onMouseEnter={() => preload({ params: { userId } })}
    >
      User {userId}
    </a>
  );
}
```

### Components

#### `Router`

The router provider component.

```typescript
<Router
  routes={[route1, route2, route3]}
  basePath="/app"
  defaultPendingComponent={() => <Spinner />}
  defaultErrorComponent={({ error, reset }) => (
    <ErrorMessage error={error} onRetry={reset} />
  )}
  notFoundComponent={() => <NotFound />}
  onNavigate={(event) => {
    analytics.track('navigation', {
      from: event.from?.route.path,
      to: event.to.route.path
    });
  }}
>
  {children}
</Router>
```

#### `RouterOutlet`

Renders the matched route component.

```typescript
function App() {
  return (
    <Router routes={routes}>
      <Header />
      <RouterOutlet />
      <Footer />
    </Router>
  );
}
```

#### `Link`

Type-safe navigation component.

```typescript
// With route object (fully type-safe)
<Link
  to={userRoute}
  params={{ userId: '123' }}
  search={{ tab: 'posts' }}
  hash="section-1"
  replace={false}
  prefetch="intent"
  className="link"
  activeClassName="link--active"
>
  View User
</Link>

// With string path (less type-safe)
<Link to="/about">About</Link>
```

#### `Redirect`

Performs a redirect on mount.

```typescript
function ProtectedRoute() {
  if (!isLoggedIn) {
    return <Redirect to={loginRoute} replace />;
  }
  return <Dashboard />;
}
```

### Utilities

#### `redirect(to, options?)`

Throw a redirect from `beforeLoad`.

```typescript
const protectedRoute = createRoute({
  path: '/dashboard',
  beforeLoad: async () => {
    if (!isAuthenticated()) {
      throw redirect('/login');
    }
  },
});
```

#### `buildPath(pattern, params)`

Build a URL from a pattern and params.

```typescript
const url = buildPath('/users/$userId/posts/$postId', {
  userId: '123',
  postId: '456',
});
// => '/users/123/posts/456'
```

#### `parsePathParams(pattern, pathname)`

Extract params from a pathname.

```typescript
const params = parsePathParams(
  '/users/$userId/posts/$postId',
  '/users/123/posts/456'
);
// => { userId: '123', postId: '456' }
```

### SSR Support

#### `createSSRRouter(options)`

Create a router for server-side rendering.

```typescript
import { createSSRRouter, loadRouteData } from 'philjs-router-typesafe';

async function renderApp(url: string) {
  const { router, context } = createSSRRouter({
    routes: [homeRoute, userRoute],
    url,
  });

  // Load data
  const { match, data, error } = await loadRouteData(routes, url);

  // Render to string
  const html = renderToString(<App />);

  return html;
}
```

## Type Inference Examples

### Path Params

```typescript
// Path: '/users/$userId/posts/$postId'
// Inferred params type: { userId: string; postId: string }

const route = createRoute({
  path: '/users/$userId/posts/$postId',
  component: ({ params }) => {
    // TypeScript knows:
    // params.userId: string
    // params.postId: string
    // params.other: ERROR - Property does not exist
  },
});
```

### Search Params

```typescript
const route = createRoute({
  path: '/search',
  validateSearch: z.object({
    query: z.string(),
    page: z.number().default(1),
    filters: z.array(z.string()).optional(),
  }),
  component: ({ search }) => {
    // TypeScript knows:
    // search.query: string
    // search.page: number
    // search.filters: string[] | undefined
  },
});
```

### Loader Data

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const route = createRoute({
  path: '/users/$userId',
  loader: async ({ params }): Promise<User> => {
    const response = await fetch(`/api/users/${params.userId}`);
    return response.json();
  },
  component: ({ loaderData }) => {
    // TypeScript knows loaderData: User
    return <h1>{loaderData.name}</h1>;
  },
});
```

### Type-Safe Links

```typescript
// This compiles:
<Link to={userRoute} params={{ userId: '123' }} search={{ tab: 'posts' }}>
  Valid
</Link>

// These cause type errors:
<Link to={userRoute} params={{ wrongParam: '123' }}>  // Error: missing userId
<Link to={userRoute} params={{ userId: '123' }} search={{ tab: 'invalid' }}>  // Error: invalid tab value
```

## Best Practices

### 1. Define Routes in a Separate File

```typescript
// routes.ts
export const homeRoute = createRoute({ path: '/', ... });
export const userRoute = createRoute({ path: '/users/$userId', ... });
export const settingsRoute = createRoute({ path: '/settings', ... });

export const routes = [homeRoute, userRoute, settingsRoute];
```

### 2. Use Route-Attached Hooks

```typescript
// Prefer this:
const { userId } = userRoute.useParams();

// Over this (less type-safe):
const { userId } = useParams();
```

### 3. Validate All Search Params

```typescript
// Always provide validation for search params
const route = createRoute({
  path: '/search',
  validateSearch: z.object({
    q: z.string().min(1),
    page: z.coerce.number().positive().default(1),
  }),
});
```

### 4. Handle Loading and Error States

```typescript
const route = createRoute({
  path: '/data',
  loader: async () => fetchData(),
  pendingComponent: () => <Skeleton />,
  errorComponent: ({ error, reset }) => (
    <ErrorBoundary error={error} onRetry={reset} />
  ),
});
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-router-typesafe/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: // Component Types
  RouteComponentProps, // Link Types
  LinkPropsWithRoute, // Loader Types
  LoaderContext, // Navigation Types
  NavigateOptions, // Path Parameter Types
  ExtractPathParams, // Route Tree Types
  RootRouteOptions, // Route Types
  RouteOptions, // Router Types
  RouterOptions, // Search Parameter Types
  InferSearchParams, // Utility Types
  RequireKeys, ActiveLink, AllRoutePaths, BeforeLoadContext, DeepPartial, ErrorComponent, ErrorComponentProps, ExtractRoute, HasParams, InferLoaderData, Link, LinkProps, LinkPropsWithPath, LoaderFn, MatchedRoute, NavLink, NavigateFn, NavigationEvent, NavigationRedirect, PathParams, PendingComponent, Prettify, Redirect, RegisteredRoutes, RouteComponent, RouteDefinition, RouteMeta, RouteTree, Router, RouterContextType, RouterLocation, RouterOutlet, SearchParamsOrEmpty, TypeSafeRouter, TypedNavigateOptions, UnionToIntersection, addChildren, buildPath, createNavigateLink, createRootRoute, createRoute, createRouteWithChildren, createRouter, createSSRRouter, flattenRouteTree, getActiveRoute, getRouterContext, loadRouteData, matchRoutes, matchesRoute, parsePathParams, parseSearchParams, redirect, serializeSearchParams, useBlocker, useIsPending, useLoaderData, useLocation, useMatchRoute, useMatches, useNavigate, useNavigateTyped, useParams, usePreloadRoute, useRouteError, useRouter, useSearch
- Re-exported modules: ./context.js, ./hooks.js, ./link.js, ./route.js, ./router.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

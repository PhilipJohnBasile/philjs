# @philjs/router-typesafe

A fully type-safe router for PhilJS inspired by TanStack Router. Get complete TypeScript type inference for route params, search params, and loader data without any manual type annotations.

## Installation

```bash
npm install @philjs/router-typesafe @philjs/core zod
# or
pnpm add @philjs/router-typesafe @philjs/core zod
```

## Features

- **Fully Typed Route Params**: Path parameters are automatically extracted and typed from path patterns like `/users/$userId`
- **Zod-Validated Search Params**: Define search param schemas with Zod and get full type inference
- **Type-Safe Link Component**: Links validate params and search at compile time
- **Route-Attached Hooks**: Each route has its own `useParams()`, `useSearch()`, and `useLoaderData()` methods
- **Data Loaders**: Async data loading with typed loader context and results
- **SSR Support**: Server-side rendering with `createSSRRouter()` and `loadRouteData()`
- **Navigation Blocking**: Prevent accidental navigation with `useBlocker()`
- **Route Preloading**: Preload route data on hover with `usePreloadRoute()`

## Quick Start

```typescript
import { z } from 'zod';
import {
  createRoute,
  createRootRoute,
  addChildren,
  Router,
  RouterOutlet,
  Link,
} from '@philjs/router-typesafe';

// Define a route with typed params and search
const userRoute = createRoute({
  path: '/users/$userId',
  validateSearch: z.object({
    tab: z.enum(['posts', 'comments']).default('posts'),
  }),
  loader: async ({ params, search }) => {
    // params.userId is string, search.tab is 'posts' | 'comments'
    return fetchUser(params.userId);
  },
  component: ({ params, search, loaderData }) => (
    <div>
      <h1>User: {params.userId}</h1>
      <Tabs active={search.tab} />
      <UserProfile user={loaderData} />
    </div>
  ),
});

// Use route-attached hooks in child components
function UserDetails() {
  const { userId } = userRoute.useParams();
  const { tab } = userRoute.useSearch();
  const user = userRoute.useLoaderData();
  return <div>{user.name}</div>;
}

// Type-safe links
<Link to={userRoute} params={{ userId: '123' }} search={{ tab: 'posts' }}>
  View User
</Link>
```

---

## Route Creation

### createRoute()

Create a type-safe route definition with automatic param extraction and search validation.

```typescript
import { z } from 'zod';
import { createRoute } from '@philjs/router-typesafe';

// Basic route without params
const aboutRoute = createRoute({
  path: '/about',
  component: () => <h1>About Us</h1>,
});

// Route with path params
const userRoute = createRoute({
  path: '/users/$userId',
  component: ({ params }) => <h1>User: {params.userId}</h1>,
});

// Route with multiple params
const postRoute = createRoute({
  path: '/users/$userId/posts/$postId',
  loader: async ({ params }) => {
    // TypeScript knows: params.userId: string, params.postId: string
    return fetchPost(params.userId, params.postId);
  },
  component: ({ params, loaderData }) => (
    <article>
      <h1>{loaderData.title}</h1>
      <p>By user {params.userId}</p>
    </article>
  ),
});
```

#### Route Options

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | Route path pattern with `$param` placeholders |
| `validateSearch` | `z.ZodType` | Zod schema for search param validation |
| `loader` | `(ctx) => Promise<T>` | Async data loader function |
| `component` | `(props) => VNode` | Route component |
| `errorComponent` | `(props) => VNode` | Error boundary component |
| `pendingComponent` | `() => VNode` | Loading component |
| `beforeLoad` | `(ctx) => void` | Guard/redirect hook |
| `meta` | `RouteMeta` | Route metadata (title, description, etc.) |

### createRootRoute()

Create a root layout route that wraps all other routes.

```typescript
import { createRootRoute } from '@philjs/router-typesafe';

const rootRoute = createRootRoute({
  component: ({ children }) => (
    <div class="app-layout">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div class="error-page">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  ),
});
```

### addChildren()

Add child routes to a parent route with automatic path joining.

```typescript
import { createRoute, addChildren } from '@philjs/router-typesafe';

const usersRoute = createRoute({ path: '/users' });
const userListRoute = createRoute({ path: '/', component: UserList });
const userDetailRoute = createRoute({ path: '/$userId', component: UserDetail });
const userNewRoute = createRoute({ path: '/new', component: NewUserForm });

// Build the route tree
const routeTree = addChildren(usersRoute, [
  userListRoute,      // fullPath: /users/
  userDetailRoute,    // fullPath: /users/$userId
  userNewRoute,       // fullPath: /users/new
]);
```

### createRouteWithChildren()

Convenience function to create a route with children in one call.

```typescript
import { createRoute, createRouteWithChildren } from '@philjs/router-typesafe';

const usersRoute = createRouteWithChildren({
  path: '/users',
  component: UsersLayout,
}, [
  createRoute({ path: '/', component: UsersList }),
  createRoute({ path: '/$userId', component: UserProfile }),
  createRoute({ path: '/new', component: NewUserForm }),
]);
```

---

## Search Param Validation with Zod

Define type-safe search parameters using Zod schemas.

```typescript
import { z } from 'zod';
import { createRoute } from '@philjs/router-typesafe';

const searchRoute = createRoute({
  path: '/search',
  validateSearch: z.object({
    query: z.string(),
    page: z.coerce.number().default(1),
    sort: z.enum(['newest', 'oldest', 'popular']).default('newest'),
    filters: z.array(z.string()).optional(),
  }),
  loader: async ({ search }) => {
    // All search params are fully typed!
    // search.query: string
    // search.page: number
    // search.sort: 'newest' | 'oldest' | 'popular'
    // search.filters: string[] | undefined
    return performSearch(search);
  },
  component: ({ search }) => (
    <div>
      <h1>Results for: {search.query}</h1>
      <p>Page {search.page}, sorted by {search.sort}</p>
    </div>
  ),
});
```

### Search Param Utilities

```typescript
import { parseSearchParams, serializeSearchParams } from '@philjs/router-typesafe';

const schema = z.object({
  tab: z.enum(['posts', 'comments']),
  page: z.coerce.number().optional(),
});

// Parse and validate search string
const parsed = parseSearchParams('?tab=posts&page=2', schema);
// => { tab: 'posts', page: 2 }

// Serialize back to query string
const queryString = serializeSearchParams({ tab: 'comments', page: 5 });
// => '?tab=comments&page=5'
```

---

## Type Inference

The router uses TypeScript's type system to infer types from path patterns and Zod schemas.

### Path Parameter Extraction

```typescript
import type { ExtractPathParams, PathParams, HasParams } from '@philjs/router-typesafe';

// Extract param names from path
type Params1 = ExtractPathParams<'/users/$userId'>;
// => 'userId'

type Params2 = ExtractPathParams<'/users/$userId/posts/$postId'>;
// => 'userId' | 'postId'

// Convert to object type
type ParamsObj = PathParams<'/users/$userId/posts/$postId'>;
// => { userId: string; postId: string }

// Check if path has params
type Has1 = HasParams<'/users/$userId'>;  // => true
type Has2 = HasParams<'/about'>;           // => false
```

### Loader Data Inference

```typescript
import type { InferLoaderData } from '@philjs/router-typesafe';

const userRoute = createRoute({
  path: '/users/$userId',
  loader: async ({ params }): Promise<User> => {
    return fetchUser(params.userId);
  },
});

// Infer loader return type
type UserData = InferLoaderData<typeof userRoute>;
// => User
```

---

## Hooks

### useRouter()

Access the router context with navigation and location info.

```typescript
import { useRouter } from '@philjs/router-typesafe';

function NavigationBar() {
  const { navigate, location, isNavigating } = useRouter();

  return (
    <nav>
      <p>Current path: {location.pathname}</p>
      {isNavigating && <Spinner />}
      <button onClick={() => navigate('/about')}>About</button>
    </nav>
  );
}
```

### useParams()

Get typed route parameters.

```typescript
import { useParams } from '@philjs/router-typesafe';

// Untyped (from current route)
function UserPage() {
  const params = useParams();
  // params: Record<string, string>
}

// Typed (from specific route)
function UserPage() {
  const { userId } = useParams(userRoute);
  // userId: string
}
```

### useSearch()

Get typed and validated search parameters.

```typescript
import { useSearch } from '@philjs/router-typesafe';

// Untyped
function SearchPage() {
  const search = useSearch();
  // search: Record<string, string>
}

// Typed with Zod validation
function SearchPage() {
  const { query, page, sort } = useSearch(searchRoute);
  // query: string, page: number, sort: 'newest' | 'oldest' | 'popular'
}
```

### useLoaderData()

Get the data returned by a route's loader function.

```typescript
import { useLoaderData } from '@philjs/router-typesafe';

function UserProfile() {
  // Typed from route definition
  const user = useLoaderData(userRoute);
  // user: User (inferred from loader return type)

  return <h1>{user.name}</h1>;
}
```

### useLocation()

Get the current location.

```typescript
import { useLocation } from '@philjs/router-typesafe';

function Breadcrumbs() {
  const location = useLocation();

  return (
    <nav>
      <span>Path: {location.pathname}</span>
      <span>Search: {location.search}</span>
      <span>Hash: {location.hash}</span>
    </nav>
  );
}
```

### useNavigate()

Get the navigation function.

```typescript
import { useNavigate } from '@philjs/router-typesafe';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    await navigate('/login', { replace: true });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### useNavigateTyped()

Get a type-safe navigation function for a specific route.

```typescript
import { useNavigateTyped } from '@philjs/router-typesafe';

function UserCard({ userId }: { userId: string }) {
  const navigateToUser = useNavigateTyped(userRoute);

  return (
    <button onClick={() => navigateToUser({
      params: { userId },
      search: { tab: 'posts' },
    })}>
      View Profile
    </button>
  );
}
```

### useMatchRoute()

Check if a route matches the current location.

```typescript
import { useMatchRoute } from '@philjs/router-typesafe';

function NavLink({ route, children }) {
  const isActive = useMatchRoute(route);

  return (
    <a class={isActive ? 'active' : ''}>
      {children}
    </a>
  );
}

// With non-exact matching
const isInUsersSection = useMatchRoute(usersRoute, { exact: false });
```

### useMatches()

Get all matched routes in the current hierarchy.

```typescript
import { useMatches } from '@philjs/router-typesafe';

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

### useBlocker()

Block navigation when there are unsaved changes.

```typescript
import { useBlocker } from '@philjs/router-typesafe';

function EditForm() {
  const [isDirty, setIsDirty] = useState(false);

  const { isBlocked, proceed, reset } = useBlocker(
    isDirty,
    'You have unsaved changes. Are you sure you want to leave?'
  );

  return (
    <form onChange={() => setIsDirty(true)}>
      {/* form fields */}
      {isBlocked && (
        <dialog open>
          <p>Unsaved changes will be lost</p>
          <button onClick={proceed}>Leave anyway</button>
          <button onClick={reset}>Stay</button>
        </dialog>
      )}
    </form>
  );
}
```

### usePreloadRoute()

Preload route data before navigation.

```typescript
import { usePreloadRoute } from '@philjs/router-typesafe';

function UserCard({ userId }) {
  const preload = usePreloadRoute(userRoute);

  return (
    <div
      onMouseEnter={() => preload({ params: { userId } })}
    >
      <Link to={userRoute} params={{ userId }}>
        View User
      </Link>
    </div>
  );
}
```

### useIsPending()

Check if the router is currently navigating.

```typescript
import { useIsPending } from '@philjs/router-typesafe';

function GlobalLoadingIndicator() {
  const isPending = useIsPending();

  return isPending ? <ProgressBar /> : null;
}
```

### useRouteError()

Get the error from the current route if one occurred.

```typescript
import { useRouteError } from '@philjs/router-typesafe';

function ErrorDisplay() {
  const error = useRouteError();

  if (!error) return null;

  return (
    <div class="error-banner">
      Error: {error.message}
    </div>
  );
}
```

### Route-Attached Hooks

Each route has its own typed hooks attached directly to the route object.

```typescript
const userRoute = createRoute({
  path: '/users/$userId',
  validateSearch: z.object({ tab: z.enum(['posts', 'comments']) }),
  loader: async ({ params }) => fetchUser(params.userId),
});

function UserSidebar() {
  // These are fully typed based on the route definition
  const { userId } = userRoute.useParams();
  const { tab } = userRoute.useSearch();
  const user = userRoute.useLoaderData();

  return (
    <aside>
      <h2>{user.name}</h2>
      <nav>
        <a class={tab === 'posts' ? 'active' : ''}>Posts</a>
        <a class={tab === 'comments' ? 'active' : ''}>Comments</a>
      </nav>
    </aside>
  );
}
```

---

## Link Component

### Type-Safe Link

The `Link` component provides type-checked navigation.

```typescript
import { Link } from '@philjs/router-typesafe';

// Link with route object (fully type-safe)
<Link
  to={userRoute}
  params={{ userId: '123' }}
  search={{ tab: 'posts' }}
>
  View User
</Link>

// Link with string path
<Link to="/about">About</Link>

// Link with options
<Link
  to={userRoute}
  params={{ userId: '123' }}
  replace={true}              // Replace history entry
  prefetch="intent"           // Prefetch on hover
  hash="section-1"            // Add hash fragment
  className="nav-link"
  activeClassName="active"    // Applied when route matches
  inactiveClassName="inactive"
  style={{ color: 'blue' }}
  activeStyle={{ fontWeight: 'bold' }}
>
  User Profile
</Link>
```

### Link Props

| Prop | Type | Description |
|------|------|-------------|
| `to` | `RouteDefinition \| string` | Target route or path |
| `params` | `PathParams<TPath>` | Route parameters (required if route has params) |
| `search` | `Partial<SearchParams>` | Search parameters |
| `hash` | `string` | URL hash fragment |
| `replace` | `boolean` | Replace instead of push history |
| `prefetch` | `boolean \| 'intent' \| 'viewport' \| 'render'` | Prefetch strategy |
| `className` | `string` | CSS class name |
| `activeClassName` | `string` | Class when route is active |
| `inactiveClassName` | `string` | Class when route is not active |
| `style` | `CSSProperties` | Inline styles |
| `activeStyle` | `CSSProperties` | Styles when active |
| `inactiveStyle` | `CSSProperties` | Styles when inactive |
| `disabled` | `boolean` | Disable navigation |
| `target` | `string` | Link target (`_blank`, etc.) |

### ActiveLink / NavLink

Alias for `Link` with sensible defaults for active state handling.

```typescript
import { ActiveLink, NavLink } from '@philjs/router-typesafe';

<NavLink
  to={aboutRoute}
  className="nav-link"
  activeClassName="nav-link--active"
>
  About
</NavLink>
```

### Redirect

Perform navigation on mount (useful in conditional rendering).

```typescript
import { Redirect } from '@philjs/router-typesafe';

function ProtectedRoute({ isLoggedIn }) {
  if (!isLoggedIn) {
    return <Redirect to={loginRoute} replace />;
  }

  return <Dashboard />;
}

// With params
<Redirect
  to={userRoute}
  params={{ userId: currentUser.id }}
  search={{ tab: 'settings' }}
/>
```

### createNavigateLink()

Create a navigation helper for programmatic use.

```typescript
import { createNavigateLink } from '@philjs/router-typesafe';

const link = createNavigateLink(
  userRoute,
  { userId: '123' },
  { tab: 'posts' }
);

// Get the href
console.log(link.href); // '/users/123?tab=posts'

// Navigate programmatically
await link.navigate({ replace: true });
```

---

## Router Setup

### Router Component

The main router component that provides context to the app.

```typescript
import { Router, RouterOutlet } from '@philjs/router-typesafe';

function App() {
  return (
    <Router
      routes={[homeRoute, aboutRoute, usersRoute]}
      basePath="/app"
      defaultPendingComponent={() => <LoadingSpinner />}
      defaultErrorComponent={({ error, reset }) => (
        <ErrorPage error={error} onRetry={reset} />
      )}
      notFoundComponent={() => <NotFoundPage />}
      onNavigate={(event) => {
        analytics.track('navigation', {
          from: event.from?.route.path,
          to: event.to.route.path,
        });
      }}
      scrollRestoration="auto"
    >
      <Header />
      <RouterOutlet />
      <Footer />
    </Router>
  );
}
```

#### Router Props

| Prop | Type | Description |
|------|------|-------------|
| `routes` | `RouteDefinition[]` | Array of route definitions |
| `basePath` | `string` | Base path for all routes |
| `defaultPendingComponent` | `() => VNode` | Default loading component |
| `defaultErrorComponent` | `(props) => VNode` | Default error component |
| `notFoundComponent` | `() => VNode` | 404 component |
| `onNavigate` | `(event) => void` | Navigation callback |
| `scrollRestoration` | `'auto' \| 'manual' \| false` | Scroll restoration behavior |

### RouterOutlet

Renders the matched route component.

```typescript
import { RouterOutlet } from '@philjs/router-typesafe';

function Layout() {
  return (
    <div class="layout">
      <Sidebar />
      <main>
        <RouterOutlet />
      </main>
    </div>
  );
}
```

### createRouter()

Create a router instance for programmatic control.

```typescript
import { createRouter } from '@philjs/router-typesafe';

const router = createRouter({
  routes: [homeRoute, aboutRoute, usersRoute],
});

// Initialize the router
router.initialize();

// Navigate programmatically
await router.navigate('/about');

// Get current state
const match = router.getCurrentMatch();
const location = router.getLocation();
const isNavigating = router.getIsNavigating();

// Clean up
router.dispose();
```

---

## SSR Support

### createSSRRouter()

Create a router for server-side rendering.

```typescript
import { createSSRRouter, RouterOutlet } from '@philjs/router-typesafe';
import { renderToString } from '@philjs/ssr';

async function handleRequest(request: Request) {
  const { router, context } = createSSRRouter({
    routes: [homeRoute, aboutRoute, usersRoute],
    url: request.url,
  });

  const html = await renderToString(
    <Router routes={[homeRoute, aboutRoute, usersRoute]}>
      <RouterOutlet />
    </Router>
  );

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

### loadRouteData()

Load route data on the server before rendering.

```typescript
import { loadRouteData } from '@philjs/router-typesafe';

async function handleRequest(request: Request) {
  const { match, data, error } = await loadRouteData(
    [homeRoute, aboutRoute, usersRoute],
    request.url
  );

  if (error) {
    return new Response('Error loading data', { status: 500 });
  }

  if (!match) {
    return new Response('Not found', { status: 404 });
  }

  // Serialize data for hydration
  const serializedData = JSON.stringify(data);

  // Render with pre-loaded data
  const html = renderToString(/* ... */);

  return new Response(html);
}
```

---

## Route Guards and Redirects

### beforeLoad Hook

Run code before a route loads (for authentication, redirects, etc.).

```typescript
import { createRoute, redirect } from '@philjs/router-typesafe';

const dashboardRoute = createRoute({
  path: '/dashboard',
  beforeLoad: async ({ params, search, location, cause }) => {
    const user = await getCurrentUser();

    if (!user) {
      // Redirect to login
      throw redirect('/login', { replace: true });
    }

    if (!user.hasAccess) {
      throw redirect('/unauthorized');
    }
  },
  component: Dashboard,
});

// Using redirect helper
import { redirect } from '@philjs/router-typesafe';

throw redirect('/login');                    // Push navigation
throw redirect('/login', { replace: true }); // Replace navigation
```

### NavigationRedirect Error

For more control, throw `NavigationRedirect` directly.

```typescript
import { NavigationRedirect } from '@philjs/router-typesafe';

throw new NavigationRedirect('/login', true); // (path, replace)
```

---

## Complete Example

Here is a complete example showing a multi-page application with nested routes, authentication, and data loading.

```typescript
import { z } from 'zod';
import {
  createRoute,
  createRootRoute,
  addChildren,
  Router,
  RouterOutlet,
  Link,
  redirect,
  useRouter,
  useLoaderData,
} from '@philjs/router-typesafe';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
}

// Root layout
const rootRoute = createRootRoute({
  component: ({ children }) => (
    <div class="app">
      <nav>
        <Link to={homeRoute}>Home</Link>
        <Link to={usersRoute}>Users</Link>
        <Link to={postsRoute}>Posts</Link>
      </nav>
      <main>{children}</main>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div class="error">
      <h1>Error</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  ),
});

// Home route
const homeRoute = createRoute({
  path: '/',
  component: () => <h1>Welcome to the App</h1>,
});

// Users routes
const usersRoute = createRoute({
  path: '/users',
  loader: async () => {
    const users: User[] = await fetch('/api/users').then(r => r.json());
    return users;
  },
  component: ({ loaderData }) => (
    <div>
      <h1>Users</h1>
      <ul>
        {loaderData.map(user => (
          <li key={user.id}>
            <Link to={userRoute} params={{ userId: user.id }}>
              {user.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ),
});

const userRoute = createRoute({
  path: '/users/$userId',
  validateSearch: z.object({
    tab: z.enum(['profile', 'posts', 'settings']).default('profile'),
  }),
  loader: async ({ params, search }) => {
    const user: User = await fetch(`/api/users/${params.userId}`).then(r => r.json());

    if (search.tab === 'posts') {
      const posts: Post[] = await fetch(`/api/users/${params.userId}/posts`).then(r => r.json());
      return { user, posts };
    }

    return { user, posts: [] };
  },
  component: ({ params, search, loaderData }) => (
    <div>
      <h1>{loaderData.user.name}</h1>

      <nav class="tabs">
        <Link to={userRoute} params={params} search={{ tab: 'profile' }}>
          Profile
        </Link>
        <Link to={userRoute} params={params} search={{ tab: 'posts' }}>
          Posts
        </Link>
        <Link to={userRoute} params={params} search={{ tab: 'settings' }}>
          Settings
        </Link>
      </nav>

      {search.tab === 'profile' && (
        <div>
          <p>Email: {loaderData.user.email}</p>
        </div>
      )}

      {search.tab === 'posts' && (
        <ul>
          {loaderData.posts.map(post => (
            <li key={post.id}>
              <Link to={postRoute} params={{ postId: post.id }}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {search.tab === 'settings' && (
        <UserSettings userId={params.userId} />
      )}
    </div>
  ),
  meta: {
    title: 'User Profile',
  },
});

// Posts routes
const postsRoute = createRoute({
  path: '/posts',
  validateSearch: z.object({
    page: z.coerce.number().default(1),
    sort: z.enum(['newest', 'popular']).default('newest'),
  }),
  loader: async ({ search }) => {
    const posts: Post[] = await fetch(
      `/api/posts?page=${search.page}&sort=${search.sort}`
    ).then(r => r.json());
    return posts;
  },
  component: ({ search, loaderData }) => (
    <div>
      <h1>Posts</h1>
      <select
        value={search.sort}
        onChange={(e) => {
          // Navigate with new sort
        }}
      >
        <option value="newest">Newest</option>
        <option value="popular">Popular</option>
      </select>
      <ul>
        {loaderData.map(post => (
          <li key={post.id}>
            <Link to={postRoute} params={{ postId: post.id }}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
      <Pagination current={search.page} />
    </div>
  ),
});

const postRoute = createRoute({
  path: '/posts/$postId',
  loader: async ({ params }) => {
    const post: Post = await fetch(`/api/posts/${params.postId}`).then(r => r.json());
    return post;
  },
  component: ({ loaderData }) => (
    <article>
      <h1>{loaderData.title}</h1>
      <div>{loaderData.content}</div>
    </article>
  ),
  meta: {
    title: 'Post',
  },
});

// Protected route example
const dashboardRoute = createRoute({
  path: '/dashboard',
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect('/login');
    }
  },
  loader: async () => {
    return fetchDashboardData();
  },
  component: Dashboard,
});

// Build route tree
const routeTree = addChildren(rootRoute, [
  homeRoute,
  usersRoute,
  userRoute,
  postsRoute,
  postRoute,
  dashboardRoute,
]);

// App component
function App() {
  return (
    <Router
      routes={[routeTree]}
      defaultPendingComponent={() => <LoadingSpinner />}
      notFoundComponent={() => (
        <div>
          <h1>404 - Not Found</h1>
          <Link to={homeRoute}>Go Home</Link>
        </div>
      )}
      onNavigate={({ from, to, type }) => {
        console.log(`Navigated from ${from?.route.path} to ${to.route.path}`);
      }}
    >
      <RouterOutlet />
    </Router>
  );
}
```

---

## API Reference

### Route Creation

| Function | Description |
|----------|-------------|
| `createRoute(options)` | Create a type-safe route definition |
| `createRootRoute(options)` | Create a root layout route |
| `addChildren(parent, children)` | Add child routes to a parent |
| `createRouteWithChildren(options, children)` | Create route with children in one call |
| `flattenRouteTree(routes)` | Flatten nested routes into array |

### Hooks

| Hook | Description |
|------|-------------|
| `useRouter()` | Get router context (navigate, location, etc.) |
| `useParams(route?)` | Get typed route params |
| `useSearch(route?)` | Get typed search params |
| `useLoaderData(route?)` | Get loader data |
| `useLocation()` | Get current location |
| `useNavigate()` | Get navigate function |
| `useNavigateTyped(route)` | Get typed navigate function |
| `useMatchRoute(route, options?)` | Check if route matches |
| `useMatches()` | Get all matched routes |
| `useBlocker(shouldBlock, message?)` | Block navigation |
| `usePreloadRoute(route)` | Get preload function |
| `useIsPending()` | Check if navigating |
| `useRouteError()` | Get route error |

### Components

| Component | Description |
|-----------|-------------|
| `Router` | Main router provider |
| `RouterOutlet` | Renders matched route |
| `Link` | Type-safe navigation link |
| `ActiveLink` / `NavLink` | Link with active state |
| `Redirect` | Redirect on mount |

### Utilities

| Function | Description |
|----------|-------------|
| `createRouter(options)` | Create router instance |
| `createSSRRouter(options)` | Create SSR router |
| `loadRouteData(routes, url)` | Load route data for SSR |
| `redirect(to, options?)` | Throw a redirect |
| `parsePathParams(pattern, pathname)` | Parse params from path |
| `buildPath(pattern, params)` | Build path from params |
| `parseSearchParams(search, schema)` | Parse and validate search |
| `serializeSearchParams(params)` | Serialize search to string |
| `matchRoutes(routes, pathname)` | Match routes against path |
| `createNavigateLink(route, params, search)` | Create navigation helper |

---

## TypeScript Configuration

For best type inference, ensure your `tsconfig.json` has these settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "exactOptionalPropertyTypes": true
  }
}
```

## Peer Dependencies

- `@philjs/core`: ^0.1.0
- `typescript`: >=5.0.0
- `zod`: ^3.0.0 (optional, for search validation)

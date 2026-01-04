# Nested Routes

The `@philjs/router` package provides Remix-style nested routes with parallel data loading, eliminating waterfalls and enabling composable layouts.

## Overview

Nested routes allow you to:
- Create composable layouts that persist across navigation
- Load data for all routes in the hierarchy simultaneously
- Access parent route data from child components
- Define error boundaries at any level

## Basic Nested Routes

### File Structure

```
src/routes/
├── _layout.tsx          # Root layout
├── index.tsx            # Home page (/)
├── users/
│   ├── _layout.tsx      # Users section layout
│   ├── index.tsx        # /users
│   └── [id].tsx         # /users/:id
└── dashboard/
    ├── _layout.tsx      # Dashboard layout
    ├── index.tsx        # /dashboard
    ├── settings.tsx     # /dashboard/settings
    └── profile.tsx      # /dashboard/profile
```

### Route Definition Types

```tsx
import type {
  NestedRouteDefinition,
  RouteComponent,
  RouteComponentProps,
  MatchedNestedRoute,
  NestedRouteMatch,
  NestedRouteOptions
} from '@philjs/router';

// NestedRouteDefinition structure
type NestedRouteDefinition = {
  /** Route path pattern (e.g., "/users/:id") */
  path: string;
  /** Route ID for loader data access */
  id?: string;
  /** Route component */
  component?: RouteComponent;
  /** Data loader function */
  loader?: LoaderFunction;
  /** Action function for mutations */
  action?: ActionFunction;
  /** Error boundary component */
  errorElement?: RouteComponent;
  /** Loading element while data loads */
  loadingElement?: RouteComponent;
  /** Child routes */
  children?: NestedRouteDefinition[];
  /** Route handle for useMatches */
  handle?: unknown;
  /** Index route flag */
  index?: boolean;
  /** Whether this route should catch-all */
  catchAll?: boolean;
};

// RouteComponentProps passed to all route components
type RouteComponentProps = {
  /** Route parameters */
  params: Record<string, string>;
  /** URL search params */
  searchParams: URLSearchParams;
  /** Loader data */
  data?: unknown;
  /** Loader error */
  error?: Error;
  /** Child route element */
  children?: VNode | JSXElement | string | null;
  /** Outlet component for nested routes */
  outlet?: VNode | JSXElement | string | null;
};
```

## Route Matching

### matchNestedRoutes

Match a pathname against nested route definitions, returning all matching routes from root to leaf.

```tsx
import { matchNestedRoutes } from '@philjs/router';

const routes: NestedRouteDefinition[] = [
  {
    path: '/',
    component: RootLayout,
    children: [
      { path: '', index: true, component: HomePage },
      {
        path: 'users',
        component: UsersLayout,
        children: [
          { path: '', index: true, component: UsersList },
          { path: ':id', component: UserDetail }
        ]
      }
    ]
  }
];

// Match "/users/123"
const match = matchNestedRoutes('/users/123', routes, {
  basePath: '',
  caseSensitive: false
});

// Result:
// {
//   matches: [
//     { route: RootLayout, params: {}, pathname: '/', id: '/' },
//     { route: UsersLayout, params: {}, pathname: '/users', id: '/users' },
//     { route: UserDetail, params: { id: '123' }, pathname: '/users/123', id: '/users/:id' }
//   ],
//   params: { id: '123' },
//   leaf: { /* UserDetail match */ }
// }
```

### Matching Options

```tsx
type NestedRouteOptions = {
  /** Base path for all routes */
  basePath?: string;
  /** Default error boundary */
  defaultErrorElement?: RouteComponent;
  /** Default loading element */
  defaultLoadingElement?: RouteComponent;
  /** Case sensitive matching */
  caseSensitive?: boolean;
};
```

## Parallel Data Loading

All loaders in the route hierarchy run simultaneously - no waterfalls.

### loadNestedRouteData

```tsx
import { loadNestedRouteData } from '@philjs/router';

// After matching routes
const matchResult = matchNestedRoutes('/users/123', routes);

if (matchResult) {
  const request = new Request('http://localhost/users/123');

  // All loaders run in parallel
  const loadedMatches = await loadNestedRouteData(
    matchResult.matches,
    request,
    {
      signal: abortController.signal,
      revalidate: false
    }
  );

  // Each match now has its data
  loadedMatches.forEach(match => {
    console.log(`${match.id}:`, match.data);
  });
}
```

### Loader Functions

```tsx
// routes/users/_layout.tsx
import { useLoaderData, json } from '@philjs/router';

export async function loader({ params, request, url }) {
  const users = await fetchUsers();
  return json({ users });
}

export default function UsersLayout() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div class="users-layout">
      <UsersSidebar users={users} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// routes/users/[id].tsx
export async function loader({ params }) {
  const user = await fetchUser(params.id);
  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }
  return json({ user });
}

export default function UserDetail() {
  const { user } = useLoaderData<typeof loader>();
  return <UserProfile user={user} />;
}
```

## Rendering Nested Routes

### renderNestedRoutes

Render matched routes with proper nesting, where parent components receive children/outlet props.

```tsx
import { renderNestedRoutes } from '@philjs/router';

const matchResult = matchNestedRoutes('/users/123', routes);
const loadedMatches = await loadNestedRouteData(matchResult.matches, request);

const searchParams = new URLSearchParams(window.location.search);
const rendered = renderNestedRoutes(loadedMatches, searchParams);
```

### Outlet Component

Use the `Outlet` component to render child routes within a layout:

```tsx
import { Outlet, useOutletContext, setOutletContext } from '@philjs/router';

export default function DashboardLayout() {
  // Provide context to child routes
  setOutletContext({ user: currentUser, permissions });

  return (
    <div class="dashboard">
      <Sidebar />
      <div class="content">
        <Outlet />
      </div>
    </div>
  );
}

// In child component
function ChildRoute() {
  const { user, permissions } = useOutletContext<{
    user: User;
    permissions: string[];
  }>();

  return <div>Hello, {user.name}</div>;
}
```

## Route Hierarchy Utilities

### getRouteIds

Get all route IDs in the match hierarchy:

```tsx
import { getRouteIds } from '@philjs/router';

const ids = getRouteIds(matches);
// ['/', '/users', '/users/:id']
```

### findRouteById

Find a route by ID in the match hierarchy:

```tsx
import { findRouteById } from '@philjs/router';

const userRoute = findRouteById(matches, '/users/:id');
if (userRoute) {
  console.log('User params:', userRoute.params);
  console.log('User data:', userRoute.data);
}
```

### getParentRoute

Get the parent route of a matched route:

```tsx
import { getParentRoute } from '@philjs/router';

const parent = getParentRoute(matches, '/users/:id');
// Returns the '/users' match
console.log('Parent data:', parent?.data);
```

### getAncestorRoutes

Get all ancestor routes:

```tsx
import { getAncestorRoutes } from '@philjs/router';

const ancestors = getAncestorRoutes(matches, '/users/:id');
// Returns ['/', '/users'] matches

// Access data from any ancestor
ancestors.forEach(ancestor => {
  console.log(`${ancestor.id}:`, ancestor.data);
});
```

## Route Configuration Builders

### createRoute

Create a nested route definition:

```tsx
import { createRoute } from '@philjs/router';

const userRoute = createRoute({
  path: '/users/:id',
  component: UserDetail,
  loader: async ({ params }) => fetchUser(params.id),
  errorElement: UserErrorBoundary,
  id: 'user-detail'
});
```

### createLayoutRoute

Create a layout route that wraps children:

```tsx
import { createLayoutRoute } from '@philjs/router';

const dashboardRoute = createLayoutRoute(
  '/dashboard',
  [
    createRoute({ path: '', index: true, component: DashboardHome }),
    createRoute({ path: 'settings', component: Settings }),
    createRoute({ path: 'profile', component: Profile })
  ],
  {
    component: DashboardLayout,
    loader: async () => ({ user: await getCurrentUser() }),
    errorElement: DashboardErrorBoundary
  }
);
```

### createIndexRoute

Create an index route (matches when parent path is exact):

```tsx
import { createIndexRoute } from '@philjs/router';

const homeRoute = createIndexRoute({
  component: HomePage,
  loader: async () => ({ featured: await getFeaturedContent() }),
  id: 'home'
});
```

### createCatchAllRoute

Create a catch-all route for 404 pages:

```tsx
import { createCatchAllRoute } from '@philjs/router';

const notFoundRoute = createCatchAllRoute(
  NotFoundPage,
  {
    id: '404',
    loader: async () => ({ suggestions: await getPopularPages() })
  }
);
```

## Path Utilities

### generatePath

Generate a path from a pattern and parameters:

```tsx
import { generatePath } from '@philjs/router';

const path = generatePath('/users/:id/posts/:postId', {
  id: '123',
  postId: '456'
});
// '/users/123/posts/456'

// With catch-all
const docPath = generatePath('/docs/*', {
  '*': 'getting-started/installation'
});
// '/docs/getting-started/installation'
```

### parseParams

Parse params from a pathname using a pattern:

```tsx
import { parseParams } from '@philjs/router';

const params = parseParams('/users/123/posts/456', '/users/:id/posts/:postId');
// { id: '123', postId: '456' }

const catchAllParams = parseParams('/docs/a/b/c', '/docs/*');
// { '*': 'a/b/c' }
```

## Actions in Nested Routes

Execute actions for the deepest matching route with an action function:

```tsx
import { executeNestedAction } from '@philjs/router';

// routes/users/[id].tsx
export async function action({ params, request }) {
  const formData = await request.formData();
  await updateUser(params.id, Object.fromEntries(formData));
  return redirect(`/users/${params.id}`);
}

// Executing the action
const result = await executeNestedAction(matches, request);

if (result) {
  console.log('Action executed on route:', result.routeId);
  console.log('Result:', result.result);
  if (result.error) {
    console.error('Action error:', result.error);
  }
}
```

## Accessing Parent Data with useRouteLoaderData

Child routes can access parent route data:

```tsx
import { useLoaderData, useRouteLoaderData } from '@philjs/router';

// routes/users/[id]/posts.tsx
export async function loader({ params }) {
  return { posts: await fetchUserPosts(params.id) };
}

export default function UserPosts() {
  // This route's data
  const { posts } = useLoaderData<typeof loader>();

  // Parent route's data by route ID
  const userData = useRouteLoaderData<{ user: User }>('/users/:id');

  return (
    <div>
      <h2>Posts by {userData?.user.name}</h2>
      <PostList posts={posts} />
    </div>
  );
}
```

## Complete Example

```tsx
// routes/_layout.tsx
import { Outlet, useLoaderData } from '@philjs/router';

export async function loader() {
  return { theme: await getTheme(), user: await getCurrentUser() };
}

export default function RootLayout() {
  const { theme, user } = useLoaderData();

  return (
    <div class={`app theme-${theme}`}>
      <Header user={user} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// routes/users/_layout.tsx
export async function loader() {
  return { users: await fetchUsers() };
}

export default function UsersLayout() {
  const { users } = useLoaderData();

  return (
    <div class="users-section">
      <aside>
        <UsersList users={users} />
      </aside>
      <div class="content">
        <Outlet />
      </div>
    </div>
  );
}

// routes/users/[id].tsx
import { Form, redirect, json } from '@philjs/router';

export async function loader({ params }) {
  const user = await fetchUser(params.id);
  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }
  return json({ user });
}

export async function action({ params, request }) {
  const formData = await request.formData();
  const result = await updateUser(params.id, {
    name: formData.get('name'),
    email: formData.get('email')
  });

  if (result.error) {
    return json({ error: result.error }, { status: 400 });
  }

  return redirect(`/users/${params.id}`);
}

export default function UserDetail() {
  const { user } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  return (
    <div>
      <h1>{user.name}</h1>

      <Form method="post">
        {actionData?.error && (
          <div class="error">{actionData.error}</div>
        )}

        <input name="name" defaultValue={user.name} />
        <input name="email" defaultValue={user.email} />

        <button
          type="submit"
          disabled={navigation.state === 'submitting'}
        >
          {navigation.state === 'submitting' ? 'Saving...' : 'Save'}
        </button>
      </Form>
    </div>
  );
}

// routes/users/[id]/posts.tsx
export async function loader({ params }) {
  return { posts: await fetchUserPosts(params.id) };
}

export default function UserPosts() {
  const { posts } = useLoaderData();
  const { user } = useRouteLoaderData('/users/:id');

  return (
    <div>
      <h2>Posts by {user.name}</h2>
      <PostList posts={posts} />
    </div>
  );
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `matchNestedRoutes(pathname, routes, options)` | Match pathname against nested routes |
| `loadNestedRouteData(matches, request, options)` | Load data for all matched routes in parallel |
| `executeNestedAction(matches, request)` | Execute action for the deepest matching route |
| `renderNestedRoutes(matches, searchParams)` | Render matched routes with proper nesting |
| `createOutlet(matches, currentIndex, searchParams)` | Create an Outlet for rendering child routes |
| `setOutletContext(matches, currentIndex, searchParams)` | Set outlet context for nested rendering |
| `getRouteIds(matches)` | Get all route IDs in hierarchy |
| `findRouteById(matches, id)` | Find route by ID |
| `getParentRoute(matches, id)` | Get parent route |
| `getAncestorRoutes(matches, id)` | Get all ancestor routes |
| `createRoute(config)` | Create a route definition |
| `createLayoutRoute(path, children, options)` | Create a layout route |
| `createIndexRoute(options)` | Create an index route |
| `createCatchAllRoute(component, options)` | Create a catch-all route |
| `generatePath(pattern, params)` | Generate path from pattern |
| `parseParams(pathname, pattern)` | Parse params from pathname |

### Components

| Component | Description |
|-----------|-------------|
| `Outlet` | Renders nested child routes |

### Hooks

| Hook | Description |
|------|-------------|
| `useLoaderData<T>()` | Access current route's loader data |
| `useRouteLoaderData<T>(routeId)` | Access loader data from any route in hierarchy |
| `useOutletContext<T>()` | Access outlet context set by parent |
| `useMatches()` | Get all matched routes with data |

## Next Steps

- [Data Loading](./data-loading.md) - Learn about loaders, actions, and deferred data
- [Error Handling](./error-handling.md) - Handle errors at any route level
- [Route Groups](./route-groups.md) - Organize routes without affecting URLs

# @philjs/router - Complete Reference

The `@philjs/router` package provides a comprehensive file-based routing solution combining the best features from Next.js, Remix, SolidStart, Vue Router, and Astro.

## Installation

```bash
npm install @philjs/router
# or
pnpm add @philjs/router
# or
bun add @philjs/router
```

## Features Overview

| Feature | Inspired By | Description |
|---------|-------------|-------------|
| File-based Routes | Next.js | Automatic route discovery from filesystem |
| Nested Layouts | Remix | Composable layouts with data loading |
| Loaders/Actions | Remix | Server-side data loading and mutations |
| Deferred Loading | Remix | Streaming data with `defer()` |
| Parallel Routes | Next.js 14 | Multiple route slots (`@modal`, `@sidebar`) |
| Route Groups | SolidStart | `(auth)`, `(marketing)` groupings |
| View Transitions | Astro | Smooth page transitions |
| Navigation Guards | Vue Router | `beforeEach`, `afterEach` hooks |
| Smart Preloading | Qwik | Predictive prefetching |
| Route Masking | Custom | URL masking for modals/overlays |

## Quick Start

```tsx
import {
  createAppRouter,
  useRouter,
  useRoute,
  Link,
  RouterView
} from '@philjs/router';

// Create router from file-based routes
const router = createAppRouter({
  routes: import.meta.glob('./routes/**/*.tsx'),
  basePath: '/app'
});

function App() {
  return (
    <router.Provider>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/users">Users</Link>
      </nav>
      <RouterView />
    </router.Provider>
  );
}
```

## File-Based Routing

### Route Discovery

```
src/routes/
├── index.tsx          → /
├── about.tsx          → /about
├── users/
│   ├── index.tsx      → /users
│   ├── [id].tsx       → /users/:id
│   └── [id]/
│       ├── profile.tsx    → /users/:id/profile
│       └── settings.tsx   → /users/:id/settings
├── blog/
│   ├── [...slug].tsx  → /blog/* (catch-all)
│   └── [[...slug]].tsx → /blog/* (optional catch-all)
├── (marketing)/       → Route group (no URL segment)
│   ├── pricing.tsx    → /pricing
│   └── features.tsx   → /features
└── @modal/            → Parallel route slot
    └── login.tsx      → Rendered in modal slot
```

### Route Patterns

```tsx
// Static route
// routes/about.tsx → /about

// Dynamic parameter
// routes/users/[id].tsx → /users/123
export function loader({ params }) {
  return fetchUser(params.id);
}

// Catch-all route
// routes/docs/[...slug].tsx → /docs/getting-started/installation
export function loader({ params }) {
  return fetchDoc(params.slug); // ['getting-started', 'installation']
}

// Optional catch-all
// routes/[[...path]].tsx → / or /any/path
```

## Data Loading (Remix-style)

### Loaders

```tsx
// routes/users/[id].tsx
import { useLoaderData, json, redirect } from '@philjs/router';

export async function loader({ params, request }) {
  const user = await db.user.findUnique({
    where: { id: params.id }
  });

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Check authentication
  const session = await getSession(request);
  if (!session.userId) {
    return redirect('/login');
  }

  return json({ user });
}

export default function UserProfile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Actions

```tsx
// routes/users/[id]/edit.tsx
import { useActionData, useNavigation, Form } from '@philjs/router';

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

export default function EditUser() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      {actionData?.error && (
        <div class="error">{actionData.error}</div>
      )}

      <input name="name" required />
      <input name="email" type="email" required />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </Form>
  );
}
```

### Deferred Data

```tsx
// routes/dashboard.tsx
import { defer, Await } from '@philjs/router';

export async function loader() {
  return defer({
    // Critical data - awaited before render
    user: await getCurrentUser(),
    // Non-critical - streams in later
    stats: fetchDashboardStats(),
    notifications: fetchNotifications()
  });
}

export default function Dashboard() {
  const { user, stats, notifications } = useLoaderData();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <Await resolve={stats}>
          {(data) => <StatsPanel data={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<NotificationsSkeleton />}>
        <Await resolve={notifications}>
          {(data) => <NotificationsList items={data} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Nested Layouts

### Layout Definition

```tsx
// routes/_layout.tsx (root layout)
import { Outlet, useMatches } from '@philjs/router';

export default function RootLayout() {
  const matches = useMatches();

  return (
    <div class="app">
      <Header />
      <Breadcrumbs matches={matches} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// routes/dashboard/_layout.tsx
export default function DashboardLayout() {
  return (
    <div class="dashboard">
      <Sidebar />
      <div class="content">
        <Outlet />
      </div>
    </div>
  );
}
```

### Layout Data

```tsx
// routes/dashboard/_layout.tsx
export async function loader({ request }) {
  const user = await requireAuth(request);
  const permissions = await getPermissions(user.id);
  return json({ user, permissions });
}

export default function DashboardLayout() {
  const { user, permissions } = useLoaderData();

  return (
    <DashboardContext.Provider value={{ user, permissions }}>
      <Sidebar user={user} />
      <Outlet />
    </DashboardContext.Provider>
  );
}

// Child routes can access parent data
// routes/dashboard/settings.tsx
export default function Settings() {
  const { user } = useRouteLoaderData('dashboard/_layout');
  // or use context
  const { permissions } = useDashboardContext();

  return <SettingsForm user={user} />;
}
```

## Navigation

### Link Component

```tsx
import { Link, EnhancedLink } from '@philjs/router';

function Navigation() {
  return (
    <nav>
      {/* Basic link */}
      <Link href="/about">About</Link>

      {/* With prefetch */}
      <Link href="/users" prefetch="intent">Users</Link>

      {/* Enhanced link with more options */}
      <EnhancedLink
        href="/dashboard"
        prefetch="hover"
        prefetchTimeout={200}
        preloadData={true}
      >
        Dashboard
      </EnhancedLink>

      {/* With view transition */}
      <Link href="/gallery" viewTransition>Gallery</Link>
    </nav>
  );
}
```

### Programmatic Navigation

```tsx
import { useRouter, navigate } from '@philjs/router';

function Component() {
  const router = useRouter();

  const handleClick = () => {
    // Using hook
    router.navigate('/users/123');

    // With options
    router.navigate('/search', {
      replace: true,
      state: { from: 'header' }
    });

    // Or use navigate function directly
    navigate('/login');
  };

  return <button onClick={handleClick}>Go</button>;
}
```

## View Transitions

```tsx
import {
  navigateWithTransition,
  ViewTransitionLink,
  markSharedElement,
  useViewTransition
} from '@philjs/router';

// Enable view transitions
initViewTransitions({
  defaultTransition: 'slide',
  duration: 300
});

// Shared element transitions
function ProductCard({ product }) {
  return (
    <ViewTransitionLink href={`/products/${product.id}`}>
      <img
        src={product.image}
        {...markSharedElement(`product-${product.id}`)}
      />
      <h3>{product.name}</h3>
    </ViewTransitionLink>
  );
}

// Custom transitions
function Gallery() {
  const { isTransitioning, direction } = useViewTransition();

  return (
    <div class={`gallery ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Content animates based on direction */}
    </div>
  );
}
```

## Parallel Routes

```tsx
// File structure for parallel routes
// routes/
// ├── _layout.tsx
// ├── @modal/
// │   └── login.tsx
// ├── @sidebar/
// │   └── cart.tsx
// └── products/
//     └── [id].tsx

// routes/_layout.tsx
import { useSlot } from '@philjs/router';

export default function Layout() {
  const modalSlot = useSlot('modal');
  const sidebarSlot = useSlot('sidebar');

  return (
    <div>
      <main>
        <Outlet />
      </main>

      {modalSlot && (
        <Modal>
          {modalSlot}
        </Modal>
      )}

      {sidebarSlot && (
        <Sidebar>
          {sidebarSlot}
        </Sidebar>
      )}
    </div>
  );
}

// Navigate to show modal
navigateWithInterception('/login', { slot: 'modal' });
```

## Navigation Guards

```tsx
import {
  beforeEach,
  afterEach,
  createAuthGuard,
  createTitleGuard
} from '@philjs/router';

// Global auth guard
beforeEach(createAuthGuard({
  isAuthenticated: () => !!authStore.user(),
  loginPath: '/login',
  excludePaths: ['/login', '/register', '/public/*']
}));

// Update page title
beforeEach(createTitleGuard({
  titleTemplate: (title) => `${title} | MyApp`,
  defaultTitle: 'MyApp'
}));

// Analytics tracking
afterEach((to, from) => {
  analytics.track('pageview', {
    path: to.path,
    referrer: from?.path
  });
});

// Custom guard
beforeEach(async (to, from) => {
  // Check permissions
  if (to.meta.requiredRole) {
    const user = await getCurrentUser();
    if (user.role !== to.meta.requiredRole) {
      return '/unauthorized';
    }
  }

  // Continue navigation
  return true;
});
```

## Smart Preloading

```tsx
import {
  initSmartPreloader,
  usePreload,
  preloadLink
} from '@philjs/router';

// Initialize with configuration
initSmartPreloader({
  strategy: 'adaptive', // 'aggressive' | 'conservative' | 'adaptive'
  maxConcurrent: 3,
  hoverDelay: 100,
  intersectionThreshold: 0.1
});

// Preload on hover
function NavLink({ href, children }) {
  const preload = usePreload();

  return (
    <a
      href={href}
      onMouseEnter={() => preload(href)}
      onFocus={() => preload(href)}
    >
      {children}
    </a>
  );
}

// Predictive preloading
// The router automatically predicts likely next routes based on:
// - Click patterns
// - Scroll direction
// - Viewport visibility
// - User behavior history
```

## Error Handling

```tsx
import {
  RouteErrorBoundary,
  useRouteError,
  throwNotFound,
  throwUnauthorized
} from '@philjs/router';

// In loader
export async function loader({ params }) {
  const post = await getPost(params.id);

  if (!post) {
    throwNotFound('Post not found');
  }

  if (post.private && !isAuthenticated()) {
    throwUnauthorized('Please login to view this post');
  }

  return json({ post });
}

// Error boundary component
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div class="error-page">
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
        {error.status === 404 && (
          <Link href="/">Go home</Link>
        )}
      </div>
    );
  }

  return (
    <div class="error-page">
      <h1>Oops!</h1>
      <p>Something went wrong.</p>
      <button onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
```

## Type-Safe Routes

```tsx
import { defineRoutes, createURLBuilder } from '@philjs/router';

// Define routes with types
const routes = defineRoutes({
  home: '/',
  users: '/users',
  user: '/users/:id',
  userPosts: '/users/:id/posts',
  search: '/search?q&page&sort'
});

const url = createURLBuilder(routes);

// Type-safe URL building
url.home();                         // '/'
url.user({ id: '123' });           // '/users/123'
url.userPosts({ id: '123' });      // '/users/123/posts'
url.search({ q: 'test', page: 2 }); // '/search?q=test&page=2'

// Type errors:
// url.user({});           // Error: missing 'id'
// url.user({ id: 123 });  // Error: id must be string
```

## DevTools

```tsx
import { RouterDevTools, initRouterDevTools } from '@philjs/router';

// Initialize in development
if (import.meta.env.DEV) {
  initRouterDevTools({
    position: 'bottom-right',
    initiallyOpen: false
  });
}

// Or render component
function App() {
  return (
    <>
      <RouterView />
      {import.meta.env.DEV && <RouterDevTools />}
    </>
  );
}
```

## Next Steps

- [Data Loading](./data-loading.md) - Loaders, actions, and deferred data
- [Nested Routes](./nested-routes.md) - Layouts and outlets
- [Navigation Guards](./guards.md) - Route protection
- [View Transitions](./view-transitions.md) - Smooth page transitions
- [Parallel Routes](./parallel-routes.md) - Multi-slot routing

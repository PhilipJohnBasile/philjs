# Router API Reference

Complete API documentation for PhilJS router package. The router provides both low-level route discovery utilities and a high-level declarative router with signal-based navigation, smart preloading, and view transitions.

---

## Table of Contents

- [High-Level Router API](#high-level-router-api)
  - [createAppRouter](#createapprouter)
  - [useRouter](#userouter)
  - [useRoute](#useroute)
  - [Link](#link)
  - [RouterView](#routerview)
  - [createRouteManifest](#createroutemanifest)
  - [createRouteMatcher](#createroutematcher)
  - [generateRouteTypes](#generateroutetypes)
- [Route Definitions](#route-definitions)
- [Component Props](#component-props)
- [Navigation](#navigation)
- [Nested Routing](#nested-routing)
- [Route Guards](#route-guards)
- [File-Based Discovery](#file-based-discovery)
- [Smart Preloading](#smart-preloading)
- [View Transitions](#view-transitions)
- [Low-Level API](#low-level-api)

---

## High-Level Router API

The high-level router provides a declarative, component-based routing system similar to React Router or Remix, but powered by PhilJS signals for instant reactivity and resumability.

### createAppRouter

Creates and initializes a router instance with declarative route definitions.

#### Type Signature

```typescript
function createAppRouter(options: RouterOptions): HighLevelRouter

type RouterOptions = {
  routes: RouteDefinition[];
  base?: string;
  transitions?: boolean | RouteTransitionOptions;
  prefetch?: boolean | PrefetchOptions;
  target?: string | HTMLElement;
}

type HighLevelRouter = {
  manifest: Record<string, RouteModule>;
  navigate: NavigateFunction;
  dispose: () => void;
  getCurrentRoute: () => MatchedRoute | null;
}
```

#### Parameters

- `options.routes` - Array of route definitions (see [Route Definitions](#route-definitions))
- `options.base` - Optional base path for all routes (e.g., `/app`)
- `options.transitions` - Enable view transitions globally
  - `false` - Disable transitions
  - `true` - Enable with default fade transition
  - Object - Configure default transition behavior
- `options.prefetch` - Enable smart preloading globally
  - `false` - Disable preloading
  - `true` - Enable with intent-based strategy
  - Object - Configure preload strategy
- `options.target` - DOM target for rendering
  - String selector (e.g., `"#app"`)
  - HTMLElement reference
  - Defaults to `#app`

#### Returns

A `HighLevelRouter` object with:
- `manifest` - Route module registry
- `navigate(to, options?)` - Navigate programmatically
- `dispose()` - Clean up router and event listeners
- `getCurrentRoute()` - Get current matched route

#### Example

```typescript
import { createAppRouter } from '@philjs/router';
import { HomePage, AboutPage, BlogPost } from './routes';

const router = createAppRouter({
  target: '#app',
  prefetch: { strategy: 'intent', intentThreshold: 0.65 },
  transitions: { type: 'fade', duration: 250 },
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/about',
      component: AboutPage,
    },
    {
      path: '/blog',
      layout: BlogLayout,
      component: BlogIndex,
      children: [
        {
          path: '/:slug',
          component: BlogPost,
          loader: async ({ params }) => {
            const post = await fetchPost(params.slug);
            return { post };
          },
        },
      ],
    },
  ],
});

// Later: navigate programmatically
await router.navigate('/blog/hello-world');

// Cleanup on app unmount
router.dispose();
```

---

### useRouter

Hook that returns reactive router state including the current route and navigation function.

#### Type Signature

```typescript
function useRouter(): RouterState

type RouterState = {
  route: MatchedRoute | null;
  navigate: NavigateFunction;
}

type NavigateFunction = (
  to: string,
  options?: { replace?: boolean; state?: any }
) => Promise<void>
```

#### Returns

- `route` - Current matched route (or `null` if no match)
- `navigate` - Function to navigate programmatically

#### Example

```typescript
import { useRouter } from '@philjs/router';

function LoginForm() {
  const { route, navigate } = useRouter();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    const result = await login(formData);

    if (result.success) {
      // Navigate to dashboard after login
      await navigate('/dashboard');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit">Log in</button>
      {route?.path === '/login' && <p>Current path: {route.path}</p>}
    </form>
  );
}
```

#### Navigation Options

```typescript
// Push new history entry (default)
await navigate('/products');

// Replace current history entry
await navigate('/products', { replace: true });

// Pass state to next route
await navigate('/checkout', {
  state: { cartId: '123', items: 5 }
});

// Access state in the destination route
const { route } = useRouter();
console.log(window.history.state); // { cartId: '123', items: 5 }
```

---

### useRoute

Hook that returns the currently matched route with params, data, and metadata.

#### Type Signature

```typescript
function useRoute(): MatchedRoute | null

type MatchedRoute = {
  path: string;
  params: Record<string, string>;
  data?: any;
  error?: any;
  component: RouteComponent<RouteComponentProps>;
  module: RouteModule;
}
```

#### Returns

The currently matched route object or `null` if no route matches.

#### Example

```typescript
import { useRoute } from '@philjs/router';

function Breadcrumbs() {
  const route = useRoute();

  if (!route) return null;

  const segments = route.path.split('/').filter(Boolean);

  return (
    <nav aria-label="breadcrumb">
      <ol>
        <li><Link to="/">Home</Link></li>
        {segments.map((segment, i) => {
          const path = '/' + segments.slice(0, i + 1).join('/');
          return (
            <li key={path}>
              <Link to={path}>{segment}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Accessing route params
function UserProfile() {
  const route = useRoute();
  const userId = route?.params.id;

  return <div>User ID: {userId}</div>;
}

// Accessing loader data
function BlogPost() {
  const route = useRoute();
  const post = route?.data?.post;
  const error = route?.error;

  if (error) return <ErrorPage error={error} />;
  if (!post) return <LoadingSpinner />;

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}

// Active link detection
function NavLink({ to, children }: { to: string; children: any }) {
  const route = useRoute();
  const isActive = route?.path === to;

  return (
    <Link
      to={to}
      className={isActive ? 'nav-link active' : 'nav-link'}
    >
      {children}
    </Link>
  );
}
```

---

### Link

Declarative navigation component that performs client-side routing with smart prefetching.

#### Type Signature

```typescript
function Link(props: LinkProps): VNode

type LinkProps = {
  to: string;
  replace?: boolean;
  prefetch?: PrefetchOptions;
  children?: VNode | JSXElement | string;
  [key: string]: any; // Accepts all standard anchor attributes
}

type PrefetchOptions =
  | boolean
  | {
      strategy?: "hover" | "visible" | "intent" | "eager" | "manual";
      intentThreshold?: number;
      priority?: "high" | "low" | "auto";
    }
```

#### Props

- `to` - Destination path (required)
- `replace` - Replace current history entry instead of pushing
- `prefetch` - Override global prefetch strategy for this link
- `children` - Link content
- `...rest` - All other props are passed to the underlying `<a>` element

#### Example

```typescript
import { Link } from '@philjs/router';

// Basic navigation
<Link to="/">Home</Link>
<Link to="/about">About</Link>

// Replace history entry
<Link to="/login" replace>Login</Link>

// External links (handled by browser)
<Link to="https://example.com" target="_blank" rel="noopener">
  External Site
</Link>

// Custom prefetch strategy
<Link
  to="/pricing"
  prefetch={{ strategy: 'hover', priority: 'high' }}
>
  Pricing
</Link>

// Disable prefetch for specific link
<Link to="/admin" prefetch={false}>Admin</Link>

// With custom styling and attributes
<Link
  to="/products"
  className="btn btn-primary"
  aria-label="View all products"
>
  Shop Now
</Link>

// With onClick handler (still navigates)
<Link
  to="/cart"
  onClick={(e) => {
    console.log('Navigating to cart');
    // Don't call e.preventDefault() - Link handles it
  }}
>
  Cart
</Link>
```

#### Behavior

- Intercepts click events for client-side navigation
- Respects modifier keys (Cmd/Ctrl+Click opens in new tab)
- Integrates with smart preloader when enabled
- Passes through to browser for external URLs
- Supports all standard `<a>` element attributes

---

### RouterView

Component that renders the current matched route.

#### Type Signature

```typescript
function RouterView(): VNode | JSXElement | string | null
```

#### Example

```typescript
import { RouterView } from '@philjs/router';

// Instead of letting createAppRouter render to a target,
// you can embed the router inside a larger component tree
function App() {
  return (
    <div class="app">
      <Header />
      <main>
        <RouterView />
      </main>
      <Footer />
    </div>
  );
}
```

This is useful when you want the router to be part of a larger PhilJS component tree instead of taking over the entire target element.

---

### createRouteManifest

Generates a route manifest object from route definitions. Useful for SSR/SSG pipelines.

#### Type Signature

```typescript
function createRouteManifest(
  routes: RouteDefinition[],
  options?: RouteManifestOptions
): Record<string, RouteModule>

type RouteManifestOptions = {
  base?: string;
}

type RouteModule = {
  loader?: (context: LoaderContext) => Promise<any>;
  action?: (context: ActionContext) => Promise<Response | void>;
  default: RouteComponent<RouteComponentProps>;
  config?: Record<string, unknown>;
}
```

#### Example

```typescript
import { createRouteManifest } from '@philjs/router';
import { routes } from './routes';

// Generate manifest for SSR
export const manifest = createRouteManifest(routes, {
  base: '/app'
});

// manifest = {
//   '/app/': { default: HomePage, loader: undefined, ... },
//   '/app/about': { default: AboutPage, ... },
//   '/app/blog/:slug': { default: BlogPost, loader: fetchPost, ... },
// }
```

---

### createRouteMatcher

Creates a function that matches URL pathnames to route definitions.

#### Type Signature

```typescript
function createRouteMatcher(
  routes: RouteDefinition[],
  options?: RouteManifestOptions
): RouteMatcher

type RouteMatcher = (pathname: string) => MatchedRoute | null
```

#### Example

```typescript
import { createRouteMatcher } from '@philjs/router';
import { routes } from './routes';

const match = createRouteMatcher(routes);

// Match a pathname
const result = match('/blog/hello-world');
// {
//   path: '/blog/:slug',
//   params: { slug: 'hello-world' },
//   component: BlogPost,
//   module: { loader: ..., default: ... },
//   data: undefined,
//   error: undefined
// }

// No match
const notFound = match('/invalid-path');
// null

// Use in SSR
export async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const matched = match(url.pathname);

  if (!matched) {
    return new Response('Not Found', { status: 404 });
  }

  // Load data via loader
  if (matched.module.loader) {
    const data = await matched.module.loader({
      params: matched.params,
      request,
    });
    matched.data = data;
  }

  // Render matched route
  return renderToString(matched.component(matched));
}
```

---

### generateRouteTypes

Generates TypeScript type definitions for route parameters.

#### Type Signature

```typescript
function generateRouteTypes(
  routes: RouteDefinition[],
  options?: RouteTypeGenerationOptions
): string

type RouteTypeGenerationOptions = {
  base?: string;
  moduleName?: string;
}
```

#### Example

```typescript
import { generateRouteTypes } from '@philjs/router';
import { writeFileSync } from 'node:fs';
import { routes } from './routes';

// Generate types
const types = generateRouteTypes(routes, {
  moduleName: './routes'
});

writeFileSync('src/routes.d.ts', types);

// Generated output:
// declare module "./routes" {
//   export interface RouteParams {
//     "/": {};
//     "/about": {};
//     "/blog/:slug": {
//       "slug": string;
//     };
//     "/products/:category/:id": {
//       "category": string;
//       "id": string;
//     };
//   }
//   export type RoutePath = keyof RouteParams;
// }

// Now you get type safety in your components:
function BlogPost({ params }: { params: RouteParams['/blog/:slug'] }) {
  // params.slug is typed as string
  return <article>{params.slug}</article>;
}
```

---

## Route Definitions

### RouteDefinition Type

```typescript
type RouteDefinition = {
  path: string;
  component: RouteComponent<RouteComponentProps>;
  loader?: (context: LoaderContext) => Promise<any>;
  action?: (context: ActionContext) => Promise<Response | void>;
  children?: RouteDefinition[];
  layout?: RouteComponent<LayoutComponentProps>;
  transition?: RouteTransitionOptions;
  prefetch?: PrefetchOptions;
  config?: Record<string, unknown>;
}
```

### Properties

#### path

Route pattern matching URL pathnames.

```typescript
// Static routes
{ path: '/' }
{ path: '/about' }
{ path: '/products' }

// Dynamic segments (start with :)
{ path: '/blog/:slug' }
{ path: '/users/:id' }
{ path: '/products/:category/:id' }

// Catch-all routes (*)
{ path: '/docs/*' }  // Matches /docs/anything/here
```

#### component

The component to render when the route matches.

```typescript
type RouteComponent<Props> = (props: Props) => VNode | JSXElement | string | null | undefined

// Example
{
  path: '/about',
  component: ({ params, data, url, navigate }) => {
    return <div>About Page</div>;
  }
}
```

#### loader

Optional async function that loads data before rendering the route.

```typescript
type LoaderContext = {
  params: Record<string, string>;
  request: Request;
}

// Example
{
  path: '/blog/:slug',
  component: BlogPost,
  loader: async ({ params, request }) => {
    const post = await fetchPost(params.slug);
    return { post };
  }
}
```

The loader's return value is available as `data` prop in the component:

```typescript
function BlogPost({ data }: { data: { post: Post } }) {
  return <article>{data.post.title}</article>;
}
```

#### action

Optional handler for form submissions and mutations.

```typescript
type ActionContext = {
  params: Record<string, string>;
  request: Request;
  formData: FormData;
}

// Example
{
  path: '/contact',
  component: ContactForm,
  action: async ({ formData }) => {
    const email = formData.get('email');
    const message = formData.get('message');

    await sendEmail({ email, message });

    // Redirect after success
    return new Response('', {
      status: 302,
      headers: { Location: '/thank-you' }
    });
  }
}
```

#### children

Nested child routes that inherit parent layouts and path prefixes.

```typescript
{
  path: '/dashboard',
  layout: DashboardLayout,
  component: DashboardHome,
  children: [
    { path: '/settings', component: Settings },
    { path: '/profile', component: Profile },
  ]
}
// Creates routes:
// - /dashboard (DashboardHome wrapped in DashboardLayout)
// - /dashboard/settings (Settings wrapped in DashboardLayout)
// - /dashboard/profile (Profile wrapped in DashboardLayout)
```

#### layout

Component that wraps the route component and all child routes.

```typescript
type LayoutComponent = (props: LayoutComponentProps) => VNode

type LayoutComponentProps = RouteComponentProps & {
  children: VNode | JSXElement | string | null | undefined;
}

// Example
function DashboardLayout({ children, params, data }: LayoutComponentProps) {
  return (
    <div class="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

{
  path: '/dashboard',
  layout: DashboardLayout,
  component: DashboardHome,
}
```

#### transition

Override global view transition settings for this route.

```typescript
// Disable transitions for this route
{ transition: false }

// Custom transition
{
  transition: {
    type: 'slide-left',
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

#### prefetch

Override global prefetch settings for this route.

```typescript
// Disable prefetch
{ prefetch: false }

// Eager prefetch (preload immediately)
{ prefetch: { strategy: 'eager' } }

// Hover prefetch
{ prefetch: { strategy: 'hover', hoverDelay: 100 } }
```

#### config

Arbitrary metadata passed to SSR/SSG systems.

```typescript
{
  config: {
    title: 'About Us',
    meta: { description: 'Learn about our company' },
    prerender: true,
  }
}
```

---

## Component Props

All route components receive these props:

### RouteComponentProps

```typescript
type RouteComponentProps = {
  params: Record<string, string>;
  data?: any;
  error?: any;
  url: URL;
  navigate: NavigateFunction;
}
```

### Properties

```typescript
function BlogPost({ params, data, error, url, navigate }: RouteComponentProps) {
  // params: Dynamic route parameters
  // { slug: 'hello-world' } for /blog/:slug
  const slug = params.slug;

  // data: Return value from loader function
  const post = data?.post;

  // error: Any error thrown by loader
  if (error) return <ErrorPage error={error} />;

  // url: Full URL object
  const searchParams = url.searchParams;
  const page = searchParams.get('page') || '1';

  // navigate: Programmatic navigation
  const handleNext = () => {
    navigate(`/blog/${post.nextSlug}`);
  };

  return (
    <article>
      <h1>{post.title}</h1>
      <button onClick={handleNext}>Next Post</button>
    </article>
  );
}
```

---

## Navigation

### Declarative Navigation

Use the `Link` component for navigation:

```typescript
import { Link } from '@philjs/router';

<Link to="/products">Products</Link>
```

### Programmatic Navigation

Use `useRouter()` hook:

```typescript
import { useRouter } from '@philjs/router';

function CheckoutButton() {
  const { navigate } = useRouter();

  const handleCheckout = async () => {
    const success = await processPayment();
    if (success) {
      await navigate('/success');
    }
  };

  return <button onClick={handleCheckout}>Complete Purchase</button>;
}
```

### Navigation Options

```typescript
// Replace history entry
navigate('/login', { replace: true });

// Pass state
navigate('/checkout', {
  state: { returnUrl: '/cart' }
});
```

### Accessing Route Information

```typescript
import { useRoute } from '@philjs/router';

function CurrentPath() {
  const route = useRoute();
  return <div>Current path: {route?.path}</div>;
}
```

---

## Nested Routing

Nested routes create parent-child relationships with shared layouts.

### Example: Dashboard with Nested Routes

```typescript
createAppRouter({
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/dashboard',
      layout: DashboardLayout,
      component: DashboardHome,
      loader: async () => {
        const user = await requireAuth();
        return { user };
      },
      children: [
        {
          path: '/analytics',
          component: Analytics,
          loader: async () => {
            const stats = await fetchAnalytics();
            return { stats };
          },
        },
        {
          path: '/settings',
          component: Settings,
          children: [
            {
              path: '/profile',
              component: ProfileSettings,
            },
            {
              path: '/billing',
              component: BillingSettings,
            },
          ],
        },
      ],
    },
  ],
});
```

This creates the following routes:

- `/` → HomePage
- `/dashboard` → DashboardHome (wrapped in DashboardLayout)
- `/dashboard/analytics` → Analytics (wrapped in DashboardLayout)
- `/dashboard/settings` → Settings (wrapped in DashboardLayout)
- `/dashboard/settings/profile` → ProfileSettings (wrapped in DashboardLayout)
- `/dashboard/settings/billing` → BillingSettings (wrapped in DashboardLayout)

### Layout Component

```typescript
function DashboardLayout({ children, data }: LayoutComponentProps) {
  return (
    <div class="dashboard">
      <header>
        <h1>Welcome, {data.user.name}</h1>
        <nav>
          <Link to="/dashboard">Home</Link>
          <Link to="/dashboard/analytics">Analytics</Link>
          <Link to="/dashboard/settings">Settings</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

### Multiple Nested Layouts

Layouts can be nested multiple levels deep:

```typescript
{
  path: '/app',
  layout: AppLayout,        // Outermost layout
  component: AppHome,
  children: [
    {
      path: '/admin',
      layout: AdminLayout,    // Second level layout
      component: AdminHome,
      children: [
        {
          path: '/users',
          layout: UsersLayout, // Third level layout
          component: UsersList,
        },
      ],
    },
  ],
}
```

The final render tree for `/app/admin/users` would be:
```
AppLayout
└─ AdminLayout
   └─ UsersLayout
      └─ UsersList
```

---

## Route Guards

Protect routes using loader functions that check authentication/authorization.

### Authentication Guard

```typescript
import { createAppRouter } from '@philjs/router';

async function requireAuth({ request }: LoaderContext) {
  const session = await getSession(request);

  if (!session) {
    // Redirect to login
    throw new Response('', {
      status: 302,
      headers: { Location: '/login' }
    });
  }

  return { user: session.user };
}

createAppRouter({
  routes: [
    {
      path: '/dashboard',
      component: Dashboard,
      loader: requireAuth, // Guard applied
    },
    {
      path: '/admin',
      layout: AdminLayout,
      loader: async ({ request }) => {
        const { user } = await requireAuth({ request, params: {} });

        // Check admin role
        if (!user.isAdmin) {
          throw new Response('Forbidden', { status: 403 });
        }

        return { user };
      },
      children: [
        { path: '/users', component: ManageUsers },
        { path: '/settings', component: AdminSettings },
      ],
    },
  ],
});
```

### Permission-Based Guards

```typescript
function createPermissionGuard(requiredPermission: string) {
  return async ({ request, params }: LoaderContext) => {
    const { user } = await requireAuth({ request, params });

    if (!user.permissions.includes(requiredPermission)) {
      throw new Response('Forbidden', { status: 403 });
    }

    return { user };
  };
}

{
  path: '/billing',
  component: BillingPage,
  loader: createPermissionGuard('billing:read'),
}
```

### Handling Guard Errors

```typescript
function ProtectedRoute({ data, error }: RouteComponentProps) {
  if (error) {
    // Loader threw an error (e.g., auth failed)
    if (error.status === 403) {
      return <Forbidden />;
    }
    return <ErrorPage error={error} />;
  }

  return <div>Protected content</div>;
}
```

### Redirect Helper

```typescript
function redirect(to: string, status = 302) {
  return new Response('', {
    status,
    headers: { Location: to }
  });
}

// Use in loaders
{
  loader: async ({ params }) => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect('/login');
    }
    return { user };
  }
}
```

---

## File-Based Discovery

Low-level utilities for file-system based routing (typically used in build tools).

### discoverRoutes

Scans a directory for route files and generates route patterns.

```typescript
import { discoverRoutes } from '@philjs/router';

const patterns = discoverRoutes('/path/to/routes');

// patterns = [
//   {
//     pattern: '/blog/:slug',
//     regex: /^\/blog\/([^/]+)$/,
//     params: ['slug'],
//     filePath: 'blog/[slug].tsx',
//     priority: 110
//   },
//   ...
// ]
```

#### File Naming Conventions

- `index.tsx` → `/`
- `about.tsx` → `/about`
- `blog/[slug].tsx` → `/blog/:slug`
- `docs/[...path].tsx` → `/docs/*`
- `_layout.tsx` → Ignored (layouts)
- `_components/Header.tsx` → Ignored (utilities)

### matchRoute

Matches a URL against discovered route patterns.

```typescript
import { matchRoute } from '@philjs/router';

const match = matchRoute('/blog/hello-world', patterns);

// match = {
//   route: { pattern: '/blog/:slug', ... },
//   params: { slug: 'hello-world' }
// }
```

---

## Smart Preloading

Intent-aware prefetching that predicts navigation based on user behavior.

### SmartPreloader Class

```typescript
import { SmartPreloader } from '@philjs/router';

const preloader = new SmartPreloader({
  strategy: 'intent',
  intentThreshold: 0.65,
  hoverDelay: 50,
  maxConcurrent: 3,
  priority: 'auto',
});
```

#### Options

- `strategy` - Preload trigger strategy
  - `"intent"` - Predict based on mouse trajectory (default)
  - `"hover"` - Preload on hover after delay
  - `"visible"` - Preload when link enters viewport
  - `"eager"` - Preload immediately
  - `"manual"` - Only preload when explicitly called
- `intentThreshold` - Confidence threshold for intent prediction (0-1)
- `hoverDelay` - Milliseconds to wait before preloading on hover
- `maxConcurrent` - Maximum concurrent preload requests
- `priority` - Fetch priority hint

### Global Preloader

```typescript
import { initSmartPreloader, getSmartPreloader } from '@philjs/router';

// Initialize global instance
initSmartPreloader({ strategy: 'intent' });

// Access later
const preloader = getSmartPreloader();
preloader?.preload('/pricing', { strategy: 'manual', priority: 'high' });
```

### usePreload Hook

```typescript
import { usePreload } from '@philjs/router';

function PricingButton() {
  // Returns manual trigger function
  const triggerPreload = usePreload('/pricing', {
    priority: 'high'
  });

  return (
    <button onMouseEnter={triggerPreload}>
      View Pricing
    </button>
  );
}
```

### preloadLink Directive

```typescript
import { preloadLink } from '@philjs/router';

const anchor = document.querySelector('a[href="/pricing"]');
const cleanup = preloadLink(anchor, {
  strategy: 'hover',
  hoverDelay: 100
});

// Later: cleanup
cleanup();
```

### Intent Calculation

The intent algorithm considers:
- Distance from mouse to link center
- Mouse velocity and direction
- Whether mouse is moving toward the link
- Historical navigation patterns

```typescript
import { calculateClickIntent } from '@philjs/router';

const intent = calculateClickIntent(
  { x: mouseX, y: mouseY },      // Mouse position
  { x: velocityX, y: velocityY }, // Mouse velocity
  linkBounds                      // Link bounding rectangle
);

// intent = 0.0 to 1.0
// Higher score = more likely to click
```

### Route Prediction

Predicts likely next routes based on navigation history:

```typescript
import { predictNextRoute } from '@philjs/router';

const predictions = predictNextRoute(
  '/products',           // Current path
  ['/home', '/products', '/cart', '/products', '/checkout'] // Visit history
);

// predictions = Map {
//   '/cart' => 0.5,      // 50% probability
//   '/checkout' => 0.5   // 50% probability
// }
```

---

## View Transitions

Progressive enhancement for smooth page transitions using the View Transitions API.

### ViewTransitionManager

```typescript
import { ViewTransitionManager } from '@philjs/router';

const manager = new ViewTransitionManager();

await manager.transition(() => {
  // Update DOM here
  document.body.innerHTML = newContent;
}, {
  type: 'slide-left',
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
});
```

### Transition Types

- `"fade"` - Crossfade between views
- `"slide-left"` - Slide from right to left
- `"slide-right"` - Slide from left to right
- `"slide-up"` - Slide from bottom to top
- `"slide-down"` - Slide from top to bottom
- `"scale"` - Scale in/out animation
- `"custom"` - Use custom CSS

### Global Manager

```typescript
import { initViewTransitions, getViewTransitionManager } from '@philjs/router';

// Initialize
initViewTransitions();

// Access
const manager = getViewTransitionManager();
```

### navigateWithTransition

Navigate with a custom transition:

```typescript
import { navigateWithTransition } from '@philjs/router';

async function openModal() {
  await navigateWithTransition('/modal', {
    type: 'slide-up',
    duration: 250
  });
}
```

### Shared Element Transitions

Mark elements for smooth morphing between pages:

```typescript
import { markSharedElement } from '@philjs/router';

function ProductCard({ product }) {
  let imageRef;

  useEffect(() => {
    const cleanup = markSharedElement(imageRef, {
      name: `product-${product.id}`,
      duration: 400
    });

    return cleanup;
  });

  return (
    <Link to={`/products/${product.id}`}>
      <img ref={(el) => imageRef = el} src={product.image} />
    </Link>
  );
}

function ProductDetail({ product }) {
  let imageRef;

  useEffect(() => {
    const cleanup = markSharedElement(imageRef, {
      name: `product-${product.id}`,
      duration: 400
    });

    return cleanup;
  });

  return <img ref={(el) => imageRef = el} src={product.image} />;
}
```

### transitionLink

Enhance anchor tags with automatic transitions:

```typescript
import { transitionLink } from '@philjs/router';

const link = document.querySelector('a');
const cleanup = transitionLink(link, {
  type: 'fade',
  duration: 200
});
```

### Feature Detection

```typescript
import { supportsViewTransitions } from '@philjs/router';

if (supportsViewTransitions()) {
  // Use View Transitions API
} else {
  // Fallback to instant updates
}
```

### Fallback Animation

For browsers without View Transitions API:

```typescript
import { animateFallback } from '@philjs/router';

if (!supportsViewTransitions()) {
  await animateFallback(element, 'fade');
}
```

---

## Low-Level API

### createRouter

Creates a basic router from a route manifest (without rendering).

```typescript
import { createRouter } from '@philjs/router';

const router = createRouter({
  '/': await import('./routes/index'),
  '/about': await import('./routes/about'),
  '/blog/:slug': await import('./routes/blog/[slug]'),
});

// router.manifest = {
//   '/': { default: ..., loader: ..., action: ... },
//   '/about': { ... },
//   '/blog/:slug': { ... }
// }
```

### findLayouts

Discovers layout files in the file system hierarchy.

```typescript
import { findLayouts } from '@philjs/router';

const layouts = await findLayouts(
  'blog/[slug].tsx',
  '/path/to/routes',
  (path) => import(path)
);

// layouts = [
//   { component: RootLayout, filePath: '_layout.tsx' },
//   { component: BlogLayout, filePath: 'blog/_layout.tsx' }
// ]
```

### applyLayouts

Wraps a component with layout components.

```typescript
import { applyLayouts } from '@philjs/router';

const wrapped = applyLayouts(
  <BlogPost />,
  layouts,
  { slug: 'hello-world' }
);

// Result: <RootLayout><BlogLayout><BlogPost /></BlogLayout></RootLayout>
```

---

## Type Definitions

### Complete Type Reference

```typescript
// Route Module
type RouteModule = {
  loader?: (context: LoaderContext) => Promise<any>;
  action?: (context: ActionContext) => Promise<Response | void>;
  default: RouteComponent<RouteComponentProps>;
  config?: Record<string, unknown>;
}

// Route Definition
type RouteDefinition = {
  path: string;
  component: RouteComponent<RouteComponentProps>;
  loader?: (context: LoaderContext) => Promise<any>;
  action?: (context: ActionContext) => Promise<Response | void>;
  children?: RouteDefinition[];
  layout?: RouteComponent<LayoutComponentProps>;
  transition?: RouteTransitionOptions;
  prefetch?: PrefetchOptions;
  config?: Record<string, unknown>;
}

// Component Types
type RouteComponent<Props = any> = (props: Props) => VNode | JSXElement | string | null | undefined

type RouteComponentProps = {
  params: Record<string, string>;
  data?: any;
  error?: any;
  url: URL;
  navigate: NavigateFunction;
}

type LayoutComponentProps = RouteComponentProps & {
  children: VNode | JSXElement | string | null | undefined;
}

// Context Types
type LoaderContext = {
  params: Record<string, string>;
  request: Request;
}

type ActionContext = LoaderContext & {
  formData: FormData;
}

// Router Types
type RouterOptions = {
  routes: RouteDefinition[];
  base?: string;
  transitions?: boolean | RouteTransitionOptions;
  prefetch?: boolean | PrefetchOptions;
  target?: string | HTMLElement;
}

type NavigateFunction = (
  to: string,
  options?: { replace?: boolean; state?: any }
) => Promise<void>

type MatchedRoute = {
  path: string;
  params: Record<string, string>;
  data?: any;
  error?: any;
  component: RouteComponent<RouteComponentProps>;
  module: RouteModule;
}

// Prefetch Types
type PrefetchOptions =
  | boolean
  | {
      strategy?: "hover" | "visible" | "intent" | "eager" | "manual";
      intentThreshold?: number;
      priority?: "high" | "low" | "auto";
    }

// Transition Types
type RouteTransitionOptions =
  | boolean
  | {
      type?: "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "scale" | "custom";
      duration?: number;
      easing?: string;
      customCSS?: string;
    }

type TransitionType =
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "fade"
  | "scale"
  | "custom"

type ViewTransitionOptions = {
  type?: TransitionType;
  duration?: number;
  easing?: string;
  customCSS?: string;
}

type SharedElementOptions = {
  name: string;
  duration?: number;
  easing?: string;
}

// Discovery Types
type RoutePattern = {
  pattern: string;
  regex: RegExp;
  params: string[];
  filePath: string;
  priority: number;
}

// Layout Types
type LayoutComponent = (props: {
  children: VNode;
  params: Record<string, string>;
}) => VNode

type LayoutChain = {
  component: LayoutComponent;
  filePath: string;
}[]
```

---

## See Also

- [Routing Guide](../routing/basics.md) - Getting started with routing
- [Navigation Guide](../routing/navigation.md) - Links and navigation patterns
- [Dynamic Routes](../routing/dynamic-routes.md) - Route parameters and patterns
- [Nested Layouts](../routing/layouts.md) - Layout composition
- [Route Guards](../routing/route-guards.md) - Authentication and authorization
- [Smart Preloading](../routing/smart-preloading.md) - Intent prediction deep dive
- [View Transitions](../routing/view-transitions.md) - Animation recipes



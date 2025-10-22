# Routing Overview

PhilJS ships a declarative router that pairs zero-hydration resumability with intent-aware navigation. This guide walks through the essentials: defining routes, navigating, working with parameters, and composing layouts.

## Router Quick Start

Route components live wherever you prefer (many apps use `src/routes/`). Create a layout and a few pages:

```tsx
// src/routes/_layout.tsx
import { Link } from 'philjs-router';

export function AppLayout({ children }: { children: any }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1)' }}>
        <strong>PhilJS</strong>
        <nav style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/docs">Docs</Link>
        </nav>
      </header>
      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}
```

```tsx
// src/routes/index.tsx
export function HomeRoute() {
  return (
    <section>
      <h1>Welcome to PhilJS</h1>
      <p>Build resumable apps with smart routing and zero hydration.</p>
    </section>
  );
}
```

Next wire the router in `src/main.tsx`:

```tsx
import { createAppRouter } from 'philjs-router';
import { AppLayout } from './routes/_layout';
import { HomeRoute } from './routes/index';
import { AboutRoute } from './routes/about';
import { DocsRoute } from './routes/docs';

createAppRouter({
  target: '#app',
  prefetch: true, // enable intent-based preloading globally
  transitions: { type: 'fade', duration: 200 },
  routes: [
    {
      path: '/',
      layout: AppLayout,
      component: HomeRoute,
      children: [
        { path: '/about', component: AboutRoute },
        { path: '/docs', component: DocsRoute },
      ],
    },
  ],
});
```

The router renders into `#app`, tracks history, and automatically applies smart prefetching and view transitions.

## Navigation Basics

### Declarative links

Use the bundled `<Link>` component for client-side navigation. It integrates with the smart preloader and respects modifier keys:

```tsx
import { Link } from 'philjs-router';

export function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/docs" replace>Docs</Link>
    </nav>
  );
}
```

`Link` accepts standard anchor props (`className`, `style`, etc.) plus `replace` and `prefetch` overrides.

### Programmatic navigation

`useRouter()` exposes the current match and a `navigate()` helper:

```tsx
import { useRouter } from 'philjs-router';

export function LoginForm() {
  const { navigate } = useRouter();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    // ...auth logic
    await navigate('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* fields */}
      <button type="submit">Log in</button>
    </form>
  );
}
```

### Inspecting the current route

`useRoute()` returns the matched route (path, params, loader data, module). This is handy for breadcrumbs, analytics, or debugging overlays.

## Dynamic Routes & Params

Paths with `:params` capture dynamic segments. The router injects them via the component props:

```tsx
// src/routes/blog/[slug].tsx
export function BlogPostRoute({ params }: { params: { slug: string } }) {
  return (
    <article>
      <h1>Blog post: {params.slug}</h1>
    </article>
  );
}
```

In the route table:

```ts
{
  path: '/blog',
  component: BlogIndexRoute,
  children: [
    { path: '/:slug', component: BlogPostRoute },
  ],
}
```

URLs such as `/blog/getting-started` now render `BlogPostRoute` with `params.slug === 'getting-started'`.

### Multiple parameters

You can nest as many param segments as needed:

```tsx
export function UserPostRoute({ params }: { params: { id: string; postId: string } }) {
  return (
    <section>
      <h1>User {params.id}</h1>
      <h2>Post {params.postId}</h2>
    </section>
  );
}
```

Define the child route with `path: '/:id/posts/:postId'` under `/users`.

## Layouts & Nested Routes

Layouts wrap child routes when you provide a `layout` function. Layouts receive the same props as pages plus a `children` slot:

```tsx
function DashboardLayout({ params, children }: { params: { section?: string }; children: any }) {
  return (
    <div className="dashboard">
      <Sidebar active={params.section} />
      <main>{children}</main>
    </div>
  );
}

createAppRouter({
  routes: [
    {
      path: '/dashboard',
      layout: DashboardLayout,
      component: DashboardHome,
      children: [
        { path: '/analytics', component: AnalyticsRoute },
        { path: '/billing', component: BillingRoute },
      ],
    },
  ],
});
```

Layouts can also run loaders or set transition/prefetch defaults for entire sections by configuring the parent route.

## Loaders & Actions (Preview)

Routes optionally define `loader` and `action` functions:

```ts
{
  path: '/docs/:slug',
  component: DocsRoute,
  loader: async ({ params }) => fetchDoc(params.slug),
  action: async ({ params, formData }) => saveDoc(params.slug, formData),
}
```

Loader results are passed to the component as `data`. Actions receive the same context plus `formData`. Upcoming releases will integrate these with PhilJS SSR/SSG automatically.

## Smart Prefetch & Transitions

- Set `prefetch: true` at the router level to enable intent-based preloading. Override per route with `{ prefetch: { strategy: 'hover' } }`.
- Apply view transitions globally (`transitions: { type: 'fade' }`) or per route (`transition: false` to opt out).

## Next Steps

- Learn more about [smart preloading](./smart-preloading.md) and [view transitions](./view-transitions.md)
- Dive into [dynamic routes](./dynamic-routes.md) and [nested layouts](./layouts.md)
- Explore [static generation and ISR](../getting-started/tutorial-blog-ssg.md) using the same route definitions

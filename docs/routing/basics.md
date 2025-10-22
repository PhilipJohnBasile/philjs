# Routing Basics

PhilJS routes are defined with `createAppRouter`. You describe paths, optional loaders, layouts, and the router handles rendering, history, smart prefetch, and view transitions.

## Project Structure

A common layout is to group route components under `src/routes/`:

```
src/
  main.tsx
  routes/
    _layout.tsx
    index.tsx
    about.tsx
    docs.tsx
```

Each file exports a regular PhilJS component. Layouts receive `children` plus route props.

## Registering the Router

`createAppRouter` mounts the application and registers the routes.

```tsx
// src/main.tsx
import { createAppRouter } from 'philjs-router';
import { AppLayout } from './routes/_layout';
import { HomeRoute } from './routes/index';
import { AboutRoute } from './routes/about';
import { DocsRoute } from './routes/docs';

createAppRouter({
  target: '#app',
  prefetch: true,
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

- `target` can be a selector or element (defaults to `#app`).
- `prefetch` enables intent-aware preloading globally; override per route with `prefetch: { strategy: 'hover' }`.
- `transitions` configures view transitions. Disable for a route with `transition: false`.

## Defining Route Components

Route components receive `{ params, data, url, navigate }`.

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

// src/routes/about.tsx
export function AboutRoute() {
  return (
    <section>
      <h1>About</h1>
      <p>PhilJS combines fine-grained signals with resumability and intelligent tooling.</p>
    </section>
  );
}
```

## Building a Layout

Layouts wrap child routes when you provide the `layout` property.

```tsx
// src/routes/_layout.tsx
import { Link } from 'philjs-router';

export function AppLayout({ children }: { children: any }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ padding: '1.5rem', display: 'flex', gap: '1rem', background: 'white' }}>
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

Every child of `/` automatically renders inside `AppLayout`.

## Navigation

### Declarative Links

Use `<Link>` for client-side navigation. It behaves like an anchor, supports modifier keys, and hooks into the smart preloader.

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

### Programmatic Navigation

`useRouter()` returns `{ route, navigate }`.

```tsx
import { useRouter } from 'philjs-router';

export function LoginForm() {
  const { navigate } = useRouter();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    // Auth logic …
    await navigate('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Log in</button>
    </form>
  );
}
```

### Inspecting the Current Route

`useRoute()` provides the matched route object.

```tsx
import { useRoute } from 'philjs-router';

export function RouteDebugger() {
  const route = useRoute();
  return <pre>{JSON.stringify(route?.params ?? {}, null, 2)}</pre>;
}
```

## Route Parameters

Paths containing `:segment` capture params. Components receive them via props.

```tsx
// src/routes/blog/[slug].tsx
export function BlogPostRoute({ params }: { params: { slug: string } }) {
  return <article>Viewing {params.slug}</article>;
}

// add under the blog section
{
  path: '/blog',
  component: BlogIndexRoute,
  children: [
    { path: '/:slug', component: BlogPostRoute },
  ],
}
```

The current match is also available in `useRoute()`.

## Loaders and Actions

Routes optionally define `loader` and `action` functions. Loaders return data passed to the component as `data`; actions handle form submissions.

```ts
{
  path: '/docs/:slug',
  component: DocsRoute,
  loader: async ({ params }) => fetchDoc(params.slug),
  action: async ({ params, formData }) => saveDoc(params.slug, formData),
}
```

Upcoming releases integrate these hooks with PhilJS SSR/SSG so static builds and resumable hydration share the same data layer.

## Smart Prefetch & Transitions

- Enable intent-based prefetching per route: `{ prefetch: { strategy: 'hover' } }`.
- Opt-out of transitions per route: `{ transition: false }`.
- For shared-element animations, call `markSharedElement()` in route components.

## Next Steps

- Explore [Dynamic Routes](./dynamic-routes.md) for deeper param handling.
- Learn about [Nested Layouts](./layouts.md) and modular route composition.
- Dive into [SSR & SSG](../getting-started/tutorial-blog-ssg.md) to render routes at build time.

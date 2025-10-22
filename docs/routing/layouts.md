# Layouts

Layouts wrap child routes so you can share chrome, data, or behaviors across sections of your app.

## Basic Layout

Provide a `layout` function on a route definition. The layout receives the same props as a page (`params`, `data`, `url`, `navigate`) plus `children`.

```tsx
// routes/_layout.tsx
import { Link } from 'philjs-router';

export function AppLayout({ children }: { children: any }) {
  return (
    <div className="shell">
      <header>
        <Link to="/">Home</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/docs">Docs</Link>
      </header>
      <main>{children}</main>
      <footer>© {new Date().getFullYear()} PhilJS</footer>
    </div>
  );
}
```

```ts
createAppRouter({
  routes: [
    {
      path: '/',
      layout: AppLayout,
      component: HomeRoute,
      children: [
        { path: '/pricing', component: PricingRoute },
        { path: '/docs', component: DocsRoute },
      ],
    },
  ],
});
```

All child routes render inside `<AppLayout>` automatically.

## Nested Layouts

Layouts can nest by adding another `layout` inside a child definition. Each level wraps the rendered output.

```ts
createAppRouter({
  routes: [
    {
      path: '/',
      layout: AppLayout,
      component: HomeRoute,
      children: [
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
    },
  ],
});
```

```tsx
export function DashboardLayout({ children, params }: { children: any; params: Record<string, string> }) {
  return (
    <div className="dashboard">
      <DashboardSidebar activePath={params['*']} />
      <section>{children}</section>
    </div>
  );
}
```

PhilJS wraps from the deepest layout up to the root layout—no special components needed.

## Sharing Loader Data

Layouts can define loaders to fetch shared resources. Child routes receive the same `data` unless they override it.

```ts
{
  path: '/account',
  layout: AccountLayout,
  component: AccountOverview,
  loader: async ({ request }) => {
    const user = await requireUser(request);
    return { user };
  },
  children: [
    { path: '/settings', component: AccountSettings },
    { path: '/billing', component: AccountBilling },
  ],
}
```

```tsx
export function AccountLayout({ data, children }: { data: { user: User }; children: any }) {
  return (
    <div>
      <h1>Welcome, {data.user.name}</h1>
      {children}
    </div>
  );
}
```

Child routes still have access to the parent loader data via `props.data`. You can combine this with route-specific loaders to compose complex datasets.

## Guarding Routes

Throw a `Response` from a layout loader to redirect or block access for an entire section:

```ts
{
  path: '/admin',
  layout: AdminLayout,
  component: AdminHome,
  loader: async ({ request }) => {
    const user = await requireUser(request);
    if (!user.isAdmin) {
      throw new Response('', { status: 302, headers: { Location: '/login' } });
    }
    return { user };
  },
  children: [
    { path: '/users', component: ManageUsers },
    { path: '/settings', component: AdminSettings },
  ],
}
```

## Styling Tips

- Extract layouts into separate files to keep route registration tidy (e.g., `routes/dashboard/_layout.tsx`).
- Pass `params`, `data`, or `url` to navigation components inside layouts for active states.
- Couple layouts with view transitions: set `transition` on the parent route to animate between child pages.

Next, explore how to wire up [navigation](./navigation.md) or to work with [dynamic routes](./dynamic-routes.md).

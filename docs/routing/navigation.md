# Navigation and Links

PhilJS’ high-level router includes everything you need for smooth navigation: declarative links, programmatic navigation, smart prefetching, and view transitions.

## `<Link>` Component

`Link` behaves like an anchor, but intercepts clicks to perform client-side navigation and prefetches destinations when possible.

```tsx
import { Link } from '@philjs/router';

export function Nav() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/docs">Docs</Link>
    </nav>
  );
}
```

- `to`: destination path or absolute URL
- `replace`: replace instead of push history entry
- `prefetch`: override prefetch strategy (`{ strategy: 'hover' }`, `{ strategy: 'intent' }`, etc.)
- Accepts standard anchor props (`className`, `style`, `target`, ...)

### External URLs

Pass a full URL; PhilJS will let the browser handle it.

```tsx
<Link to="https://philjs.dev" target="_blank" rel="noopener">Docs ↗</Link>
```

## Programmatic Navigation

Use `useRouter()` to navigate from code (e.g., after a mutation) and inspect the current route.

```tsx
import { useRouter } from '@philjs/router';

export function LoginForm() {
  const { navigate } = useRouter();

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    // authenticate user…
    await navigate('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Log in</button>
    </form>
  );
}
```

`navigate(to, options)` accepts `replace` and `state` just like `history.pushState`.

## Active Links

`useRoute()` exposes the current match. Compare against `route.path` or `route.params` to highlight navigation.

```tsx
import { Link, useRoute } from '@philjs/router';

export function NavLink({ to, children }: { to: string; children: any }) {
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

For partial matches:

```tsx
const isActive = route?.path?.startsWith(to);
```

## Smart Prefetching

When you enabled `prefetch: true` in `createAppRouter`, `<Link>` automatically prefetches the destination using the global strategy (intent prediction by default). Override per link:

```tsx
<Link to="/pricing" prefetch={{ strategy: 'hover', priority: 'high' }}>
  Pricing
</Link>
```

This taps into the smart preloader (intent from pointer velocity, history analysis, visibility).

## View Transitions

Routes participate in the View Transitions API when you configure `transitions`. Customize per link by calling `navigateWithTransition()` if you need fine-grained control:

```tsx
import { navigateWithTransition } from '@philjs/router';

async function goToModal() {
  await navigateWithTransition('/settings', {
    type: 'slide-up',
    duration: 220,
  });
}
```

## Navigation Guards & Loaders

Route `loader` functions run before the component renders. Throw responses (e.g., `new Response('', { status: 302, headers: { Location: '/login' } })`) to redirect. Returning data becomes `props.data` inside the component.

```ts
{
  path: '/dashboard',
  component: DashboardRoute,
  loader: async ({ request }) => {
    const user = await requireUser(request);
    if (!user) {
      throw new Response('', { status: 302, headers: { Location: '/login' } });
    }
    return { user };
  },
}
```

Inside `DashboardRoute`:

```tsx
export function DashboardRoute({ data }: { data: { user: User } }) {
  return <h1>Welcome back, {data.user.name}</h1>;
}
```

## Best Practices

- Use `<Link>` instead of `<a>` for internal navigation to benefit from intent prefetching and transitions.
- Keep routes colocated with components (`src/routes/`) and import them in `createAppRouter` for clarity.
- Read from `useRoute()` inside layouts or analytics components for contextual information (params, loader data).
- Combine loaders with PhilJS’ `createQuery` for caching and mutation workflows.

Next up: learn more about [dynamic routes](./dynamic-routes.md) and [nested layouts](./layouts.md), or add [SSR/SSG](../getting-started/tutorial-blog-ssg.md) to your project.

# Route Guards

Protect routes by using loaders to check authentication/authorization before rendering. Throw responses to redirect or error out.

## Auth Guard Example

```ts
import { createAppRouter } from '@philjs/router';
import { requireUser } from '../lib/auth';

createAppRouter({
  routes: [
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
    },
  ],
});
```

`AdminLayout` receives `data.user` and can display shared UI:

```tsx
export function AdminLayout({ data, children }: { data: { user: User }; children: any }) {
  return (
    <div>
      <h1>Admin • {data.user.name}</h1>
      {children}
    </div>
  );
}
```

## Redirect Helpers

Use the standard `Response` constructor. For convenience create utility helpers:

```ts
export function redirect(to: string, status = 302) {
  return new Response('', { status, headers: { Location: to } });
}

throw redirect('/login');
```

## Combining with Actions

Actions can enforce guards before mutating data:

```ts
{
  path: '/account/:id',
  component: AccountRoute,
  loader: async ({ params, request }) => ensureOwner(request, params.id),
  action: async ({ params, formData }) => updateAccount(params.id, formData),
}
```

If the guard fails, throw a redirect or error response; the router will stop rendering and surface the error to the nearest boundary.

## Tips

- Keep guards in loaders/layouts so all children inherit the protection.
- Combine with [middleware](./middleware.md) or server adapters for edge cases like rate limiting.
- Use `transition: false` on guard-protected routes when you need immediate state changes without animations.
- Track guard outcomes in your analytics by reading `useRoute()` after navigation.

Next explore [Middleware](./middleware.md) for request-level hooks or review [Error Handling](./error-handling.md) to display nice fallbacks when guards reject.

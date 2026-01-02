# Route guards

Route guards run before or after navigation. They can redirect, block, or record analytics.

## Global guards

```ts
import { beforeEach, afterEach } from '@philjs/router';

const disposeAuth = beforeEach((to, from, ctx) => {
  if (to.meta?.requiresAuth && !isLoggedIn()) {
    return { redirect: '/login' };
  }
});

afterEach((to) => {
  console.log('Navigated to', to.fullPath);
});
```

## Route-level guards

```ts
import { beforeRoute } from '@philjs/router';

beforeRoute('/admin/*', (to) => {
  if (!hasRole('admin')) {
    return { redirect: '/forbidden' };
  }
});
```

## Notes

- Guards can return `false`, a redirect, or an error.
- Use the `meta` field to declare required roles or permissions.

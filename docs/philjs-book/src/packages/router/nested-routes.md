# Nested routes

Nested routes let parent layouts render child routes without remounting shared UI.

## Define routes

```ts
import {
  createLayoutRoute,
  createRoute,
  createIndexRoute,
  createCatchAllRoute
} from '@philjs/router';

const routes = createLayoutRoute('app', '/app', () => <AppLayout />, [
  createIndexRoute(() => <Dashboard />),
  createRoute('settings', '/settings', () => <Settings />),
  createCatchAllRoute(() => <NotFound />)
]);
```

## Render an outlet

```tsx
import { Outlet } from '@philjs/router';

function AppLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

## Passing outlet context

```tsx
import { setOutletContext, useOutletContext } from '@philjs/router';

setOutletContext({ accountId: 'acct_123' });

const { accountId } = useOutletContext<{ accountId: string }>();
```

## Notes

- `matchNestedRoutes` and `renderNestedRoutes` power nested matching.
- Use layout routes for shared navigation, headers, and sidebars.

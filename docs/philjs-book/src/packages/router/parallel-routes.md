# Parallel routes and slots

Parallel routes render multiple route branches side-by-side. This is useful for dashboards and split views.

## Define parallel slots

```tsx
import { renderParallelSlots, useSlots } from '@philjs/router';

function DashboardLayout() {
  const slots = useSlots();

  return (
    <div class="grid">
      <section>{slots.main}</section>
      <aside>{slots.sidebar}</aside>
    </div>
  );
}
```

## Matching slots

```ts
import { matchParallelRoutes } from '@philjs/router';

const matches = matchParallelRoutes(routes, url);
const view = renderParallelSlots(matches);
```

## Interception utilities

`navigateWithInterception`, `useInterception`, and `useInterceptedNavigation` help build modal routes or overlays.

## Notes

- Use slots for persistent UI with isolated data loading.
- Combine with view transitions for smooth slot changes.

# Resources and Async Data Patterns

Resources are the PhilJS primitive for async data with built-in loading and error handling. Use them alongside loaders for finer-grained control.

## Creating resources

```tsx
import { resource, signal } from '@philjs/core';

const userId = signal('u1');
const user = resource(async () => fetchJSON(`/api/users/${userId()}`));
```

Resources cache by dependency; when `userId` changes, the resource reruns.

## Loading and error states

- `resource.loading` for spinners/skeletons.
- `resource.error` for inline errors; render `role="alert"` for accessibility.
- Provide retries with a button calling `resource.refetch()`.

## Suspense-like patterns

- Use `Show`/conditional rendering to display fallback while loading.
- For SSR, prefer loaders for initial data and use resources for secondary panels.

## Refresh and invalidation

- Call `resource.refetch()` to reload.
- Pair with cache tags: when an action invalidates `['user', id]`, call `refetch` for resources that depend on that tag.

## Concurrency

- Set `defer: true` for non-blocking resources that load after initial render.
- For racing requests, keep the latest result: track a token or use AbortController.

## Testing resources

- Mock fetchers; assert `loading`/`error` transitions.
- Use fake timers for delayed promises to control timing.
- In integration tests, ensure components render fallbacks before data arrives.

## Performance tips

- Avoid creating resources inside tight loops; lift them up and pass data down.
- For pagination/infinite scroll, create a resource per page and merge results.
- Debounce invalidations to prevent thrash on rapid input.

## Checklist

- [ ] Loading/error states rendered.
- [ ] Refetch wired to cache invalidation or user actions.
- [ ] Deferred resources for non-critical panels.
- [ ] Tests cover loading/error/happy paths.



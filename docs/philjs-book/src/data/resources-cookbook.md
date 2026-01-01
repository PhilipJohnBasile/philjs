# Resources Cookbook

Patterns for PhilJS `resource` to handle async data cleanly.

## Basic resource

```ts
const userId = signal('u1');
const user = resource(async () => fetchJSON(`/api/users/${userId()}`));
```

Render:
```tsx
{user.loading && <Spinner />}
{user.error && <p role="alert">Failed</p>}
{user() && <Profile data={user()} />}
```

## Refetch on demand

```ts
function refresh() {
  user.refetch();
}
```

## Defer non-critical data

```ts
const slow = resource({ defer: true }, async () => fetchJSON('/api/slow'));
```

## Abort stale requests

Pass `signal` to fetcher:
```ts
const slow = resource(async ({ signal }) => fetchJSON('/api/slow', { signal }));
```

## Cache-aware invalidation

- After an action invalidates tags, call `resource.refetch()` for dependents.
- Use `resource.clear()` when leaving a route to free memory.

## Parallel resources

```ts
const [posts, comments] = [
  resource(fetchPosts),
  resource(fetchComments)
];
```

## Error mapping

```ts
const data = resource(async () => {
  const res = await fetch('/api');
  if (!res.ok) throw new Error('Bad response');
  return res.json();
}, { mapError: (e) => ({ message: String(e) }) });
```

## Testing resources

- Mock fetchers; assert loading→data/error transitions.
- Use fake timers to control slow promises.
- Simulate abort to ensure cleanup works.

## Checklist

- [ ] Loading/error states rendered.
- [ ] Abort signals used for cancelable requests.
- [ ] Defer non-critical data.
- [ ] Refetch/clear hooks used when caches invalidate or routes change.



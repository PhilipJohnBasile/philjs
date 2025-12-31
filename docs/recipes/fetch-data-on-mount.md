# Fetch Data on Component Mount

**Outcome**: Load data from an API when a component first renders.

## Solution

```typescript
import { signal, effect } from '@philjs/core';

function UserProfile({ userId }: { userId: string }) {
  const user = signal(null);
  const loading = signal(true);
  const error = signal(null);

  effect(() => {
    loading.set(true);
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        user.set(data);
        loading.set(false);
      })
      .catch(err => {
        error.set(err.message);
        loading.set(false);
      });
  });

  if (loading()) return <div>Loading...</div>;
  if (error()) return <div>Error: {error()}</div>;

  return <div>Hello, {user().name}!</div>;
}
```

## How it Works

1. Create signals for `user`, `loading`, and `error` states
2. Use `effect()` to run the fetch on mount
3. Update signals based on fetch result
4. Render conditionally based on state

## Pitfalls

- **No cleanup**: This effect runs on every render. For mount-only behavior, use a flag or `createQuery`
- **Race conditions**: If userId changes while fetching, you may get stale data
- **Missing dependencies**: The effect automatically tracks `userId` - changes will re-fetch

## Production Tips

- Use `createQuery` from a data fetching library for caching and deduplication
- Add abort controller for cleanup
- Consider showing stale data while refetching

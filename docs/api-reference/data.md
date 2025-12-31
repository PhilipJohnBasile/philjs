# Data API Reference

Complete API reference for data fetching.

## createQuery()

Create a query for data fetching.

```tsx
import { createQuery } from '@philjs/core';

const users = createQuery(() => '/api/users');
```

**Type**: `<T>(fn: () => string | Promise<T>, options?) => Query<T>`

## createMutation()

Create a mutation.

```tsx
import { createMutation } from '@philjs/core';

const createUser = createMutation(async (data) => {
  return await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});
```

**Type**: `<T>(fn: (data: any) => Promise<T>, options?) => Mutation<T>`

## useQueryClient()

Access query client.

```tsx
import { useQueryClient } from '@philjs/core';

const client = useQueryClient();
client.invalidateQueries(['users']);
```

**Type**: `() => QueryClient`

## Next Steps

- [Core API](/docs/api-reference/core.md) - Core APIs
- [CLI API](/docs/api-reference/cli.md) - CLI reference

---

ℹ️ **Note**: Data APIs integrate seamlessly with PhilJS reactivity.

# OpenAPI and REST Integration

PhilJS leans on loaders/actions plus typed clients to keep REST integrations predictable. This chapter shows how to generate clients, validate data, and keep performance in check. Pull from `docs/api`, `docs/api-reference`, and `docs/data-fetching` for deeper recipes, but keep this chapter as your copy/paste-ready source.

## Generate a typed client

Use `philjs-openapi` (or `openapi-typescript`) to generate clients from your spec:

```bash
pnpm dlx openapi-typescript https://api.example.com/openapi.json -o src/api/types.ts
```

Create a thin client:

```typescript
import { paths } from './api/types';

type GetUser = paths['/users/{id}']['get'];

export async function getUser(id: string, signal?: AbortSignal) {
  const res = await fetch(`/api/users/${id}`, { signal });
  if (!res.ok) throw new Error('Failed to load user');
  return (await res.json()) as GetUser['responses']['200']['content']['application/json'];
}
```

## Use in loaders

```typescript
import { loader } from '@philjs/router';
import { getUser } from '../api/client';

export const userLoader = loader(async ({ params, signal }) => {
  return {
    user: await getUser(params.id, signal)
  };
}, { cache: { staleTime: 30_000 }});
```

- Respect `signal` for cancellation.
- Set `staleTime` and `refetchOnFocus` intentionally to avoid network storms.
- Tag caches by entity; avoid duplicating caches in multiple layers.
- When mixing SSR and client fetches, keep loader outputs serializable and stable across renders.

## Mutations and optimistic UI

```typescript
import { action } from '@philjs/router';
import { updateUser } from '../api/client';

export const updateUserAction = action(async ({ request }) => {
  const body = await request.json();
  return updateUser(body);
}, { optimistic: true });
```

Pair optimistic updates with rollback handlers if the server rejects changes.

## Validation

- Use Zod/Valibot on the boundary; narrow unknown JSON before it hits your components.
- Log schema mismatches in development to catch drift between client and server.
- Keep error objects ergonomic—map HTTP errors to typed domain errors.
- Reject `__proto__`/`constructor` keys during parsing to avoid prototype pollution.

## Caching and invalidation

- Cache critical reads in loaders; avoid duplicating caches in stores.
- Invalidate by key after mutations: `cache.invalidate(['users', id])`.
- Prefer partial updates to refetch-all; stream updates via SSE/WebSockets when possible.
- For paginated lists, invalidate by filter: `['users', { page, query }]`.
- Use `staleTime` + background refetch for dashboards that need to stay fresh.

## Security

- Strip `__proto__`/`constructor` keys from JSON before use.
- Default to `credentials: 'omit'` and pass tokens via headers; avoid mixing auth in query params.
- Rate-limit UI actions that trigger server mutations.
- Use `Content-Security-Policy` to prevent inline script injection when rendering API data.

## Testing

- Contract tests with mock servers (MSW) to lock in shapes.
- Fixture-driven tests for loaders/actions to verify caching and error paths.
- Performance tests for hot endpoints to protect p95 budgets.
- Add regression tests for JSON parsing that include malicious payloads.

## Try it now: end-to-end typed loader + mutation

1) Generate types: `pnpm dlx openapi-typescript http://localhost:3000/openapi.json -o src/api/types.ts`
2) Create client functions with `signal` support (see above).
3) Wire a loader/action pair:

```typescript
export const usersLoader = loader(async ({ signal }) => ({
  users: await listUsers(signal)
}), { cache: { staleTime: 10_000, tags: [['users']] }});

export const createUserAction = action(async ({ request, cache }) => {
  const payload = await request.json();
  const user = await createUser(payload);
  cache.invalidate(['users']);
  return user;
}, { optimistic: true });
```

4) Add MSW handlers mirroring the OpenAPI schema and run Vitest to verify optimistic flow and cache invalidation.

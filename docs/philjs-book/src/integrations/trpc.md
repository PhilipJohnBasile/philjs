# tRPC Integration

Use tRPC for end-to-end type safety without maintaining OpenAPI/GraphQL schemas. PhilJS pairs well with tRPC loaders/actions and SSR.

## Setup

- Expose your tRPC router on the server (Node/edge compatible).
- Create a typed client with `@trpc/client`.
- Provide fetch/links suitable for your runtime (edge-safe where needed).

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/router';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: '/trpc' })],
});
```

## Loaders and actions

```typescript
import { loader, action } from '@philjs/router';
import { trpc } from '../lib/trpc';

export const userLoader = loader(async ({ params, signal }) => ({
  user: await trpc.user.byId.query({ id: params.id }, { signal })
}));

export const updateUser = action(async ({ formData, cache }) => {
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '');
  await trpc.user.update.mutate({ id, name });
  cache.invalidate(['user', id]);
}, { optimistic: true });
```

## SSR considerations

- Use fetch links that work on edge (no Node-only globals).
- Prefetch queries in loaders and dehydrate cache if using a client cache.
- Avoid bundling server-only code into the client; keep routers on the server.

## Error handling

- Map tRPC errors to user-friendly messages; surface validation errors inline.
- Log server errors with route and procedure metadata.

## Testing

- Mock tRPC client in unit/integration tests; assert loader/action behavior.
- In E2E, run against dev server; verify SSR + hydration works without double-fetching.

## Checklist

- [ ] Edge-safe tRPC links configured (if deploying to edge).
- [ ] Loaders/actions typed end-to-end.
- [ ] Cache invalidation after mutations.
- [ ] Validation errors handled gracefully.
- [ ] Tests cover happy/error paths and SSR hydration.

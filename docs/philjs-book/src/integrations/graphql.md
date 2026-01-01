# GraphQL Integration

PhilJS works well with GraphQL clients (urql, Apollo, graphql-request) and server-driven schemas. The key is to keep data fetching aligned with loaders/actions and to cache intentionally. For reference, see `docs/api`, `docs/data-fetching`, and `docs/advanced`—reuse those snippets here as needed.

## Choosing a client

- **graphql-request**: light, no cache; great for SSR/edge where you want explicit control.
- **urql**: flexible exchanges, built-in cache, SSR support.
- **Apollo Client**: feature-rich, heavier; consider only when you need its ecosystem.

## Example with graphql-request

```typescript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('/api/graphql', { fetch });

const UserQuery = gql`
  query User($id: ID!) {
    user(id: $id) { id name email }
  }
`;

export async function fetchUser(id: string, signal?: AbortSignal) {
  return client.request(UserQuery, { id }, { signal });
}
```

Use in a loader:

```typescript
import { loader } from '@philjs/router';
import { fetchUser } from '../api/graphql';

export const userLoader = loader(async ({ params, signal }) => ({
  user: await fetchUser(params.id, signal)
}), { cache: { staleTime: 60_000, tags: [['user', params.id]] }});
```

## Mutations with optimistic updates

```typescript
const UpdateUser = gql`
  mutation UpdateUser($id: ID!, $input: UserInput!) {
    updateUser(id: $id, input: $input) { id name email }
  }
`;

export const updateUserAction = action(async ({ request }) => {
  const { id, input } = await request.json();
  return client.request(UpdateUser, { id, input });
}, { optimistic: true });
```

Ensure the optimistic shape matches the query shape; invalidate `['user', id]` after commit.

## Caching patterns

- Tag results by entity and by list filters; invalidate both after writes.
- For SSR, prefetch queries in loaders and embed dehydrated cache into HTML.
- Use `stale-while-revalidate` for list routes; keep detail routes fresher.
- For pagination, include cursor/page in tags (e.g., `['users', 'page', page]`).
- For multi-tenant apps, include tenant in tags to avoid cache bleed.

## Subscriptions and live data

- Use server-sent events or WebSockets; map events to cache updates.
- Keep reconnect logic exponential and respect `signal` for teardown.
- Avoid flooding the UI; coalesce events with `batch()` in PhilJS.

## Schema drift and safety

- Generate types from schema regularly (`pnpm graphql-codegen`).
- Validate unknown fields before touching the UI; log discrepancies in dev.
- Enforce auth at the loader/action boundary; never assume client trust.
- Strip `__proto__`/`constructor` keys from subscription payloads.
- Limit query depth/complexity server-side if you control the API.

## Testing

- Snapshot GraphQL responses per operation using mocks (MSW).
- Exercise cache invalidation logic with integration tests in Vitest + jsdom.
- Cover subscription reconnect logic with fake timers and controlled server events.
- Add E2E smoke tests in Playwright to assert SSR + hydration for GraphQL-heavy routes.
- Validate persisted queries or operation whitelists in CI to prevent breaking changes.

## Client patterns to borrow

- **Fragments**: co-locate UI with fragments; generate types to keep props tight.
- **Persisted queries**: reduce payload and improve cache keys; great for edge functions.
- **Batching**: enable query batching on servers that support it to cut round trips.
- **Defer/stream**: if your GraphQL server supports it, align with PhilJS streaming for partial responses.

## Try it now: SSR + client hydration with urql

1) Set up urql client in server entry to prefetch queries for SSR.
2) Wrap your App with the urql provider on both server and client.
3) In a loader, pre-execute critical queries and serialize the cache:

```typescript
import { initUrql } from './urql';

export const dashboardLoader = loader(async ({ signal }) => {
  const { client, extract } = initUrql({ fetch, signal });
  await client.query(DashboardQuery, {}).toPromise();
  return { urqlState: extract() };
});
```

4) In the client, hydrate the cache with `urqlState` and render. Verify with Playwright that the first paint contains data without a client refetch.

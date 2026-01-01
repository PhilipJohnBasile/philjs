# Data Caching and Invalidation Deep Dive

Control freshness and avoid stale UIs by pairing loader caches with precise invalidation.

## Cache design

- Identify entities and lists; tag caches accordingly (`['project', id]`, `['projects', filter]`).
- Choose `staleTime` per data class: static docs (hours), dashboards (seconds), user profiles (minutes).
- Use `revalidate` hints to align with edge/ISR caches.

## Invalidation patterns

- **Tag-based**: `cache.invalidate(['project', id])` after mutations.
- **Predicate**: invalidate by function for complex rules.
- **Time-based**: short `staleTime` plus background revalidate.

## Mutations + optimistic updates

- Apply optimistic updates to stores; reconcile on success/failure.
- Roll back on error; surface toast or inline error.
- For list mutations, update list caches and detail caches together to avoid flicker.

## Avoiding stampedes

- Deduplicate in-flight requests; store promises in a map keyed by tags.
- Add jitter to revalidate; avoid all clients refetching simultaneously.
- For edge caches, set `Cache-Control: stale-while-revalidate` where appropriate.

## Offline considerations

- Persist caches to IndexedDB for offline reads.
- Mark entries as “stale/offline” and refresh on reconnect.
- Queue invalidations to replay when back online.

## Testing cache logic

- Unit-test cache tag assignment and invalidation functions.
- Integration tests with MSW for mutations that update multiple caches.
- E2E: simulate rapid navigations and ensure no duplicate network calls; verify stale content refreshes.

## Checklist

- [ ] Tags defined for entities/lists.
- [ ] Stale times set per data class.
- [ ] Mutations invalidate specific tags.
- [ ] Deduplication for in-flight requests.
- [ ] Offline persistence strategy defined.



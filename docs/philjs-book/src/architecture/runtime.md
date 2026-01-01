# Runtime Internals

Peek into how PhilJS schedules updates, tracks dependencies, and hydrates islands.

## Reactivity graph

- Signals are nodes; effects/memos/resources subscribe to dependencies.
- Writes mark dependents dirty; batching coalesces recomputations.
- `untrack` reads without subscription; `batch` defers notifications.

## Scheduling

- Synchronous by default for deterministic UI updates.
- Effects run after writes; avoid long-running work inside effects.
- Resources manage async lifecycles and expose loading/error states.

## Hydration pipeline

- SSR marks islands with IDs and serialized props/data.
- Client locates island roots; hydrates using registered components.
- Hydration strategies (immediate/visible/idle/interaction) control timing.

## Loader/action lifecycle

- Loader executes before render; can return cached data with tags + staleTime.
- Action runs on mutation; can invalidate tags and return updated data.
- Both receive `signal` for cancellation and `cache` for tagging/invalidation.

## Error handling

- Errors propagate to nearest boundary (route/layout/component).
- Actions/loaders can return typed errors (`Err`) or throw to boundaries.
- Hydration errors surface in DevTools and logs; ensure boundaries cover islands.

## DevTools hooks

- Signal graph visualization to spot over-subscription.
- Flamecharts for render/hydration profiling.
- Router panel for loader/action timings and cache hits.

## Checklist

- [ ] Batch related writes to minimize recompute.
- [ ] Avoid async inside effects; use resources or actions.
- [ ] Hydration strategies chosen per island.
- [ ] Loaders/actions tagged and cancellable.
- [ ] Error boundaries wrap layouts and islands.

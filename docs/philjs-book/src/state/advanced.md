# Advanced State Patterns

Go beyond basics with history, collaboration, cross-tab sync, and performance tuning.

## History and time travel

- Enable history with limits; expose undo/redo in UI.
- Clear redo on new mutations; cap history to prevent memory growth.
- Snapshot critical slices for debugging; wire to DevTools for replay.

## Collaboration

- Use `@philjs/collab` or WebSockets to sync patches.
- Prefer intent logs or CRDT-friendly data for multi-user edits.
- Resolve conflicts explicitly; show presence and cursors for transparency.

## Cross-tab and multi-window

- Sync via BroadcastChannel/SharedWorker; debounce to avoid storms.
- Namespaces per tenant/user to avoid data bleed.
- Persist to IndexedDB and rehydrate on tab focus.

## Performance tuning

- Split stores by domain; avoid one mega-store.
- Memoize selectors; avoid subscribing components to the whole store.
- Batch updates; avoid object identity churn in hot paths.

## Security and isolation

- Do not store secrets in stores/persistence.
- Sanitize data before writing to state (strip `__proto__`/`constructor`).
- For multi-tenant, clear stores on account switch.

## Testing

- Long-running mutation tests to ensure history/persistence behave.
- Fuzz selectors/middleware with random patches to catch edge cases.
- Simulate multi-tab updates with fake BroadcastChannel.

## Checklist

- [ ] History enabled where needed; limits set.
- [ ] Collaboration/conflict strategy defined.
- [ ] Cross-tab sync namespaced and debounced.
- [ ] Selectors memoized; stores split by domain.
- [ ] Sensitive data excluded or encrypted at rest.

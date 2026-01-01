# Memory Management and Leaks

Keep PhilJS apps steady under long sessions and heavy navigation.

## Common leak sources

- Uncleaned event listeners in effects.
- Persistent references in stores to large objects/blobs.
- Long-lived caches without eviction.
- Accumulating timers/intervals.

## Prevention

- Always pair event listeners with `onCleanup`.
- Set history/persistence limits on stores.
- Evict caches based on size/time; drop unused tags.
- Avoid storing large blobs directly; use object URLs and revoke them.

## Detection

- Use browser memory profiler; take heap snapshots before/after navigation loops.
- Track heap size over time during automated E2E (Playwright with repeated navs).
- Watch for retained DOM nodes after route transitions.

## Fixes

- Null out references after use; clear intervals/timeouts.
- For stores, slice data and dispose slices when routes unmount.
- Invalidate and clear loaders/resources when no longer needed.

## Edge/serverless considerations

- Keep server handlers stateless; avoid global caches that grow unbounded.
- In edge runtimes, avoid large in-memory caches; rely on KV/edge storage.

## Testing

- Add regression tests that navigate repeatedly and assert stable memory.
- Use mocked timers to ensure cleanup runs.

## Checklist

- [ ] Listeners cleaned with `onCleanup`.
- [ ] Store history/persistence bounded.
- [ ] Caches evicted/expired properly.
- [ ] Heap stable after repeated navigation.


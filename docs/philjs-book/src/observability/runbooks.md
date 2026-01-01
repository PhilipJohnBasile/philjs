# Observability Runbooks

Quick actions for common production issues.

## Slow TTFB

- Check edge cache hit rate; widen `staleTime`/revalidate; ensure ISR enabled.
- Profile loader latency; cache hot queries; move heavy work out of critical path.
- Stream earlier; trim HTML and critical CSS; lazy-load heavy widgets.

## Hydration errors

- Reproduce with Playwright + console; capture server HTML and client render.
- Verify stable keys and deterministic data; fix mismatched markup.
- Add/adjust error boundaries around affected islands.

## Cache misses spike

- Inspect invalidation calls for over-broad keys (`['*']`).
- Deduplicate in-flight requests; add jitter to revalidate.
- Check upstream cache headers; ensure tags are scoped correctly.

## Memory creep (client)

- Run heap snapshots before/after nav loops; look for retained DOM/listeners.
- Ensure `onCleanup` removes listeners; bound store history/persistence.
- Dispose unused slices and clear caches.

## Cold start spikes (edge/serverless)

- Reduce bundle size; trim deps.
- Increase warmup/keep-alive if platform supports it.
- Move heavy routes to regional functions if edge limits are hit.

## Error rate increase

- Break down by route/loader/action; identify offending endpoints.
- Check recent deploys/feature flags; roll back or disable.
- Add detailed logging for failures; trace to downstream dependencies.

## Runbook hygiene

- Keep logs with reqId/traceId; ensure dashboards have TTFB/error/cache panels.
- Add alerts for budgets (TTFB, error rate, cache hit ratio, cold starts).
- Document rollback steps per platform; test periodically.

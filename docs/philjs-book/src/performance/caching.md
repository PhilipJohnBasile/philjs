# Caching Strategies

Caching spans loaders, SSR, assets, and runtime data. Use this chapter to choose the right strategy per surface.

## Loader caching

- Tag caches by entity (`['user', id]`, `['list', filter]`).
- Set `staleTime` for predictable freshness; use `revalidate` to control edge cache TTL.
- Invalidate surgically after mutations; avoid `invalidate(['*'])`.
- Deduplicate in-flight loader fetches to prevent stampedes.

## HTML/SSR caching

- Edge caches: Vercel ISR/Netlify Edge/Cloudflare; pair with loader invalidation.
- Keep HTML small; stream to reduce TTFB.
- For auth pages, avoid caching HTML; cache data instead.

## Asset caching

- Use hashed filenames with long cache headers.
- Preload critical CSS/fonts; defer non-critical assets.
- For images, serve AVIF/WebP with proper cache headers; use CDN.

## API responses

- Cache at the edge when possible; otherwise use loader caches with tags.
- For pagination, cache per-page/per-filter; revalidate lazily.
- Avoid caching sensitive or user-specific data unless scoped correctly.

## Revalidation patterns

- Time-based: `revalidate(30)` to refresh every 30s.
- Event-based: invalidate specific tags on mutations (e.g., after WebSocket event).
- Hybrid: short TTL + background revalidate for dashboards.

## Prefetching

- Prefetch next routes on hover/visibility.
- Preload queries for critical navigations; respect cache budgets.
- Avoid prefetching when on slow/expensive connections (detect via Network Information API).

## Offline + cache coherence

- Use IndexedDB storage for offline copies; tag data and expire stale entries.
- On reconnect, reconcile with server: invalidate stale tags and refetch.
- Queue mutations with retries; mark cached data as “dirty” until confirmed.

## Testing caching

- Unit: assert cache tags and `revalidate` values.
- Integration: simulate mutations and verify invalidations.
- E2E: navigate rapidly and ensure no double-fetches; inspect network panel for cache hits.

## Checklist

- [ ] Cache tags defined per entity/list.
- [ ] Stale times set; revalidate hints used where needed.
- [ ] Prefetch guarded by connection quality.
- [ ] Auth-sensitive pages not cached as HTML.
- [ ] Offline storage expires and reconciles on reconnect.


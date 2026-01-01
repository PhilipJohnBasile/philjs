# Static vs Live Content

Choose the right rendering and caching strategy for each content type.

## Static content (docs, marketing)

- Pre-render (SSG) and cache aggressively (long TTL).
- Use ISR/edge cache for infrequent updates; trigger revalidate on CMS webhook.
- Keep payloads small; stream hero + critical CSS.

## Semi-static content (blogs with comments, listings)

- Pre-render the shell; hydrate live sections (comments, counts) as islands.
- Cache base HTML; fetch live data client-side with caches and revalidate hints.
- Invalidate tags when new content is published or updated.

## Live content (dashboards, chat, analytics)

- SSR for first paint; stream partials for slow data.
- Hydrate live panels; use WebSockets/SSE for updates.
- Aggressive caching for static parts; short `staleTime` or no HTML cache for live panels.

## Mixed routes

- Split route into sections: hero/static, live widgets, user-specific panels.
- Tag caches per section; hydrate only what needs interactivity.
- Use `prefetch` and background revalidate for near-real-time freshness.

## Testing

- For static routes, assert cache headers and no unexpected network calls.
- For live routes, simulate slow data and ensure fallbacks render quickly.
- Verify revalidate/webhook flows update pages correctly.

## Checklist

- [ ] Identify content type per route.
- [ ] Set caching (SSG/ISR/edge) accordingly.
- [ ] Live sections hydrated as islands/resources.
- [ ] Webhooks or invalidation rules for updates.

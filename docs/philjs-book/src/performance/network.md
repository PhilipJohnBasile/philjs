# Network Performance

Reduce latency and bandwidth for faster PhilJS apps.

## Requests

- Coalesce requests; batch where possible (tRPC batch links, GraphQL batching).
- Set proper cache headers; use ETags or `If-None-Match` when supported.
- Cancel stale requests with `AbortController` via loader/action `signal`.
- Use HTTP/2/3 where available; minimize domain sharding.

## Payloads

- Trim JSON; avoid overfetching.
- Compress responses (gzip/brotli); prefer binary formats for large data when appropriate.
- Paginate lists; stream large responses if supported.
- Use image formats AVIF/WebP and serve responsive sizes.

## Prefetching and preloading

- Prefetch routes/assets for likely next navigations.
- Preload critical fonts/CSS; avoid preload bloat.
- Respect connection quality (`navigator.connection`) to skip prefetch on slow/expensive networks.

## Edge delivery

- Use edge caches/CDNs close to users.
- Push SSR to edge where possible to reduce RTT.
- For APIs, place read-heavy data in edge KV/caches when safe.

## Testing network performance

- Throttle network in DevTools/Playwright to simulate slow 3G/mid-tier mobile.
- Measure TTFB, download, and total bytes.
- Validate cache headers with `curl -I` and ensure 304s for unchanged assets/data.

## Checklist

- [ ] Cache headers set correctly for assets and data.
- [ ] Prefetch/preload targeted and connection-aware.
- [ ] Requests cancellable; no overfetching.
- [ ] Images optimized; payloads paginated.


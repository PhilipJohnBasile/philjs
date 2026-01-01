# Routing Performance

Optimize navigation, data fetching, and prefetch for snappy route changes.

## Prefetch and caching

- Prefetch likely routes on hover/visibility of links.
- Cache loader results with `staleTime` and tags; avoid redundant fetches.
- Revalidate in background for frequently visited routes.

## Splitting and islands

- Code-split rare routes; preload for authenticated users if needed.
- Keep shared layouts lean; move heavy widgets into islands with lazy hydration.

## Data shaping

- Fetch only needed fields; paginate lists.
- Use cache tags to invalidate surgically after actions.
- Deduplicate in-flight requests per route to prevent stampedes.

## Navigation UX

- Show pending states (spinners/progress bars) for long navigations.
- Preserve/restore scroll; keep focus management for accessibility.
- Avoid layout shifts by reserving space for dynamic content.

## Edge considerations

- For edge SSR, keep loader logic edge-safe (Web APIs, no Node-only modules).
- Use ISR/edge caches for mostly-static routes; live widgets hydrate client-side.

## Testing

- Playwright traces of hot navigations on mid-tier mobile; measure input responsiveness.
- Verify prefetch requests fire and are cached.
- Confirm no double fetches; network panel should show cache hits where expected.

## Checklist

- [ ] Prefetch on primary nav; cache/tag correctly.
- [ ] Code-split heavy routes; islands for big widgets.
- [ ] Pending UI + scroll/focus management.
- [ ] Edge-safe loaders; cache strategies set.


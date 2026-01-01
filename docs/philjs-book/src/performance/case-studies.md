# Performance Case Studies (Summaries)

Use these scenarios as templates for tuning PhilJS apps.

## Case 1: Dashboard TTFB too high

- Problem: TTFB ~900ms on edge.
- Fixes:
  - Move heavy analytics fetch to background; stream hero + skeleton.
  - Add cache tags and 30s revalidate for hot stats.
  - Prefetch dashboard on login redirect.
  - Result: TTFB ~250ms; LCP down ~40%.

## Case 2: Hydration jank on charts

- Problem: large chart library hydrates on load, blocking input.
- Fixes:
  - Island with `visible` hydration.
  - Lazy-load chart lib; prefetch on scroll.
  - Memoize data transforms; move heavy work to worker.
  - Result: FID improved; main thread free for input during load.

## Case 3: Bundle bloat on marketing

- Problem: Landing page JS 400KB.
- Fixes:
  - Remove unused UI kit; inline critical CSS.
  - Convert to static/ISR; hydrate only CTA/contact form.
  - Compress/optimize hero media.
  - Result: JS ~140KB; Lighthouse score up.

## Case 4: Cache stampede on list route

- Problem: bursts of requests invalidate cache; backend overwhelmed.
- Fixes:
  - Deduplicate in-flight requests.
  - Add jittered revalidate; widen staleTime.
  - Push frequently accessed data to edge cache/KV.
  - Result: backend QPS down; response times stabilized.

## Case 5: Memory leak in long sessions

- Problem: heap grows after repeated navigation.
- Fixes:
  - Clean up event listeners; bound store history.
  - Dispose slices on unmount; clear unused caches.
  - Result: heap steady across 50 nav cycles.

## Checklist for new performance work

- [ ] Measure (TTFB, LCP, bundle size, memory, cache hits).
- [ ] Stream and hydrate minimally.
- [ ] Cache/tag/revalidate intentionally.
- [ ] Lazy-load heavy deps; prefetch only what helps.
- [ ] Bench and trace before/after.


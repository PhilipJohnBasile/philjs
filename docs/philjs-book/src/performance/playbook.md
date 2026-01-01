# Performance Playbook (Step-by-step)

Use this playbook during implementation, pre-ship checks, and regressions. It complements `performance/overview.md` and the existing `docs/performance` guides.

## During development

- Set budgets early (`size-limit`, TTI, memory).
- Use `prefetch()` on primary routes; add `staleTime` for loaders.
- Keep dependency graphs shallow (signals/memos over giant stores).
- Lazy-load heavy widgets and third-party libs.
- Stream SSR output; hydrate islands with the lightest viable strategy.

## Pre-PR checklist

- `pnpm size` passes with headroom.
- `pnpm bench --filter @philjs/core` stable vs baseline.
- Playwright trace for hot route: no long tasks >50ms, no layout thrash.
- Loader calls deduped; cache tags set; invalidations scoped.
- Images compressed; fonts preloaded; critical CSS inlined.

## Pre-release checklist

- Lighthouse/Lab: TTFB, LCP, CLS within targets on mid-tier mobile emulation.
- Edge deploy smoke: verify cache headers, TTFB, and streaming.
- Memory leak check: navigate between top 3 routes 20x; heap stable.
- Error logs clean in staging; no hydration warnings.
- Rollback plan documented (feature flags or previous build).

## Regression playbook

1) **Identify surface**: which route/device? Edge vs regional?
2) **Reproduce with traces**: Playwright or DevTools performance recording.
3) **Isolate**: disable features/flags to bisect; check cache/invalidation behavior.
4) **Measure**: compare bundle sizes, loader timings, heap snapshots against baseline.
5) **Fix**: reduce payloads, adjust cache strategy, split islands, batch updates.
6) **Verify**: rerun benches, traces, and size-limit; add a test to prevent recurrence.

## Route-level optimizations

- **Lists**: virtualize, paginate, memoize item props.
- **Charts**: lazy-load libs, hydrate on visibility, debounce updates.
- **Forms**: optimistic updates with rollback; avoid full refetches on submit.
- **Editors**: split toolbars/canvases, store history with limits, offload heavy ops to workers.

## Edge-specific guidance

- Keep HTML small; stream early; avoid Node APIs.
- Use platform caches (KV/D1/R2, Vercel KV/Blob) for hot data.
- Add jittered revalidate to avoid thundering herds.
- Log cache hit/miss and cold starts; alert on spikes.

## Mobile-specific guidance

- Aggressively trim JS/CSS; avoid large inline scripts.
- Prefer visible/interaction hydration for heavy widgets.
- Preload critical resources; defer non-critical plugin initialization.
- Respect `prefers-reduced-motion`; avoid jank-inducing animations.

## Observability hooks to add

- Log loader/action timings with cache status and request id.
- Export metrics for TTFB, hydration duration, cache hit ratio.
- Trace slow routes with spans around render/hydration/data fetch.

## Tests to add for perf-sensitive areas

- `vitest bench` for critical signal/store logic.
- Playwright trace snapshots for top routes (budget assertions).
- Integration tests that ensure prefetch runs for key links.
- CI guard on `size-limit` to block bloat.

## Quick win checklist

- [ ] Prefetch primary links.
- [ ] Split heavy routes; lazy-load third-party libs.
- [ ] Inline critical CSS; preload fonts.
- [ ] Tag caches and invalidate surgically.
- [ ] Stream SSR; hydrate islands lazily where possible.
- [ ] Benchmark and trace before merging.


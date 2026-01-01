# Hydration Performance

Keep hydration fast and predictable, especially on slower devices.

## Strategies

- Choose hydration mode per island: immediate, visible, idle, on interaction.
- Hydrate only the interactive pieces; keep static sections static.
- Defer heavy assets until after first paint; lazy-load large dependencies inside islands.

## Reducing hydration work

- Keep prop shapes small and stable; avoid huge serialized payloads.
- Avoid generating random values or non-deterministic output during SSR.
- Use stable keys and avoid recreating large arrays/objects in render.

## Measuring

- DevTools performance panel: look for long tasks during hydration.
- DevTools PhilJS tab: check island hydration timing.
- Playwright traces on mid-tier mobile profile.

## Optimizations

- Split heavy widgets into sub-islands; hydrate progressively.
- Memoize expensive computations; move to resources or workers.
- Inline critical CSS to avoid style recalcs blocking hydration.
- Avoid layout thrash: set explicit heights/widths for media.

## Testing

- E2E with throttled CPU/network; assert input remains responsive during hydration.
- Simulate slow JS eval (if possible) to catch oversized bundles.
- Ensure no hydration warnings; align server/client renders (stable data).

## Checklist

- [ ] Islands sized and hydrated with appropriate strategy.
- [ ] Serialized data minimal; deterministic SSR output.
- [ ] Heavy deps lazy-loaded; workers for big computations.
- [ ] Hydration time measured on target devices.


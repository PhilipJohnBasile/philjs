# Motion and Transitions

Use motion intentionally to guide attention without hurting performance or accessibility.

## Principles

- Motion must serve meaning (state change, hierarchy).
- Prefer `transform` and `opacity`; avoid layout-triggering properties.
- Respect `prefers-reduced-motion`.

## Micro-interactions

- Buttons/links: subtle scale/opacity on hover/focus.
- Toggles: smooth state transitions with easing.
- Lists/cards: staggered reveal only when beneficial.

## Page and route transitions

- Use view transitions where supported to reduce jank during navigation.
- Keep transitions short (<250ms) and cancellable.
- Avoid blocking data fetching; run in parallel with loader prefetch.

## Performance

- GPU-friendly properties (`transform`, `opacity`).
- Avoid large box-shadows/blurs on low-end devices.
- Test on mid-tier mobile; throttle CPU to catch jank.

## Accessibility

- Honor `prefers-reduced-motion: reduce`; switch to instant transitions.
- Provide clear focus states; do not hide outlines.
- Avoid auto-playing motion; require user intent.

## Implementation sketch

```tsx
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration = prefersReduced ? 0 : 180;
```

Use CSS variables for timing/easing:

```css
:root {
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 120ms;
  --dur-medium: 200ms;
}
```

## Testing motion

- Disable animations in test env to avoid flakes.
- In Playwright, check that transitions complete quickly and don’t block input.
- Ensure reduced-motion mode removes non-essential animations.

## Checklist

- [ ] Motion uses transform/opacity.
- [ ] Reduced-motion respected.
- [ ] Route transitions short and cancel-friendly.
- [ ] Animations do not block interaction or fetching.

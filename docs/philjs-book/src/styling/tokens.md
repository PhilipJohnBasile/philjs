# Design Tokens Reference

Centralize your system’s primitives to keep UI consistent and themeable.

## Token categories

- Color (bg/fg/surface/brand/semantic)
- Typography (families, sizes, weights, line-heights)
- Spacing (scale for margin/padding/gaps)
- Radius, shadow, border
- Motion (durations, easings)
- Z-index layers

## Example (CSS variables)

```css
:root {
  --color-bg: #0b1021;
  --color-fg: #e2e8f0;
  --color-brand: #2563eb;
  --radius-sm: 6px;
  --radius-md: 12px;
  --shadow-sm: 0 4px 12px rgba(0,0,0,0.08);
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --dur-fast: 120ms;
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## Theming

- Light/dark variants override token sets via `[data-theme="light"]` etc.
- Support high-contrast variants.
- Keep tokens semantically named; avoid raw hex values in components.

## Distribution

- Ship tokens as a package or importable CSS/TS module.
- Provide TypeScript types for token names to reduce typos.
- Keep changes versioned; communicate breaking token updates.

## Testing and QA

- Snap visual baselines for key components per theme.
- Check contrast programmatically for semantic colors.
- Verify motion tokens respect `prefers-reduced-motion`.

## Checklist

- [ ] Tokens defined for all categories (color, type, space, motion, radius/shadow).
- [ ] Semantic names used in components.
- [ ] Theming supported with overrides.
- [ ] Contrast and a11y validated.

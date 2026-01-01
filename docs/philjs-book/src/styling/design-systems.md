# Design Systems with PhilJS

Codify components, tokens, and accessibility into a repeatable system.

## Tokens

- Define color/spacing/typography tokens via CSS variables.
- Support light/dark themes and high-contrast variants.
- Version tokens; avoid breaking changes without migration notes.
- Keep a single source of truth (`tokens.ts` or `tokens.css`) and generate platform outputs if needed.

## Components

- Build headless primitives (Button, Input, Dialog) with PhilJS signals.
- Layer styling via CSS modules, scoped styles, or Tailwind plugin.
- Provide accessibility baked in: roles, labels, keyboard interactions.
- Export prop types and usage patterns; document ARIA expectations per component.

## Theming

- Switch tokens via `data-theme` on root; persist user choice.
- Respect prefers-color-scheme; provide explicit override.
- Ensure animations respect prefers-reduced-motion.

## Documentation

- Document props, a11y notes, and states (hover/focus/disabled).
- Include code samples and a live playground.
- Add usage guidelines and anti-patterns.
- Show theme variants and density/size variants with guidance.

## Distribution

- Package as `@your-org/ui` with `workspace:*` dependencies.
- Export ESM; tree-shakeable entrypoints.
- Ship type definitions and keep peerDeps minimal.
- Provide per-component entrypoints for optimal tree-shaking.

## Testing

- Unit: behavior and aria roles.
- Visual: limited snapshots or visual diffs for core components.
- A11y: role/label checks; optional axe on key pages.

## Performance

- Keep components lean; avoid heavy runtime logic.
- Defer icons/assets; prefer sprite sheets or icon fonts where acceptable.
- Split rare variants into lazy-loaded chunks if heavy.

## Checklist

- [ ] Tokens defined and themed.
- [ ] Headless + styled layers documented.
- [ ] A11y baked in; keyboard + screen reader support.
- [ ] Packages exported as ESM with types.
- [ ] Tests for behavior and critical visuals.

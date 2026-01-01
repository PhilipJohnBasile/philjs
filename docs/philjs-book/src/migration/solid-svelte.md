# Migrating from Solid/Svelte

Solid and Svelte already embrace reactivity; moving to PhilJS is mostly about routing, SSR, and API boundaries.

## Mapping concepts

- Signals/Stores → PhilJS signals/stores (similar semantics).
- Derived values → `memo`.
- Side effects → `effect` (avoid async inside).
- Async data → `resource` (instead of Svelte load functions/Solid resources, align with loaders).

## JSX and templates

- Solid users keep JSX; update `jsxImportSource: "@philjs/core"`.
- Svelte users rewrite templates to JSX; start with leaf components.

## Routing

- Replace existing routers with PhilJS Router; move load/mutation logic to loaders/actions.
- Add `prefetch` and cache tags for data consistency.

## SSR and islands

- Switch to PhilJS SSR adapters; stream by default.
- Hydrate only necessary islands; map Svelte/Solid hydration strategies to PhilJS equivalents.

## Stores and context

- Solid signals map closely; Svelte stores map to PhilJS stores/resources.
- Avoid global writable stores; prefer scoped signals/stores per route.

## Styling

- Reuse CSS/SCSS/Tailwind; adjust build plugins as needed.
- For Svelte scoped styles, translate to CSS modules/scoped styles in PhilJS.

## Testing

- Swap to `@philjs/testing`; MSW remains for network mocks.
- Playwright E2E flows stay similar.

## Checklist

- [ ] `jsxImportSource` updated (Solid).
- [ ] Templates ported to JSX (Svelte).
- [ ] Router + loaders/actions in place.
- [ ] SSR streaming/hydration verified.
- [ ] Tests migrated to PhilJS tooling.

# Migrating from React

Move React apps to PhilJS with minimal friction and safer incremental steps.

## Strategy

- Start with leaf components; migrate routes/features gradually.
- Keep routers side-by-side during transition (PhilJS Router + existing router) if needed.
- Replace `useState/useEffect` with signals/memos; avoid 1:1 rewrites of effect-heavy code.

## JSX runtime

- Update `tsconfig.json` to `jsxImportSource: "@philjs/core"`.
- Swap React imports with PhilJS equivalents (`createContext` -> signals/context helpers).

## State and effects

- Signals instead of `useState`.
- `memo` instead of derived state in `useMemo`.
- Replace `useEffect` data-fetching with loaders/resources; side effects stay in `effect`.
- Remove dependency arrays; PhilJS tracks dependencies automatically.

## Components and props

- Functional components stay largely the same; drop React-specific hooks.
- Event handling is similar; avoid synthetic event assumptions.

## Routing

- Map React Router routes to PhilJS Router.
- Move data fetching to loaders; mutations to actions.
- Use `Link` and `prefetch` for perf; add `errorBoundary` equivalents.

## Context

- Prefer signals/stores over heavy context.
- When needed, use PhilJS context utilities; keep values serializable for SSR.

## Porting hooks

- Many custom hooks become plain functions with signals.
- Derive state with memos; avoid effect-driven synchronization.

## Styling and assets

- Reuse CSS/SCSS/Tailwind; adjust build plugins as needed.
- Replace React-specific styling libraries if they rely on React internals.

## Testing

- Swap React Testing Library for `@philjs/testing`.
- Reuse MSW for network mocks; adapt render helpers.
- Keep Playwright E2E mostly unchanged.

## SSR/Islands

- Move SSR entry to PhilJS SSR adapters.
- Split heavy components into islands for hydration control.

## Checklist

- [ ] tsconfig updated (`jsxImportSource`).
- [ ] State/effects migrated to signals/memos/resources.
- [ ] Routes converted to PhilJS Router with loaders/actions.
- [ ] Tests updated to `@philjs/testing`.
- [ ] SSR/adapter configured; hydration verified.

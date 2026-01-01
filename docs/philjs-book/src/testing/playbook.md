# Testing Playbook (PhilJS)

Use this checklist-driven guide to keep quality high as the codebase grows.

## Layers and tools

- **Unit**: signals, stores, helpers (Vitest).
- **Component**: DOM-level assertions with `@philjs/testing` (built on Testing Library).
- **Integration**: routes with loaders/actions + MSW for network.
- **E2E**: Playwright for real browser flows (SSR + hydration).
- **Perf**: `vitest bench`, Playwright traces.
- **A11y**: role/label assertions and axe where useful.

## Daily habits

- Write tests alongside features; cover happy + failure paths.
- Use realistic fixtures; avoid “lorem ipsum” data that hides issues.
- Keep tests deterministic: fake timers, stable IDs, fixed dates.
- Prefer user-centric assertions (roles, text) over implementation details.

## Component testing recipe

```tsx
import { render, screen, fireEvent } from '@philjs/testing';
import { Dialog } from '../Dialog';

it('opens and closes', () => {
  render(() => <Dialog />);
  fireEvent.click(screen.getByRole('button', { name: /open/i }));
  expect(screen.getByRole('dialog')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

## Loaders/actions integration recipe

- Mock network with MSW; keep handlers aligned with API schemas.
- Assert cache invalidation and optimistic updates.
- Cover redirects and error boundaries.

## E2E smoke suite (minimum)

- Home renders, navigation works, no console errors.
- Auth flow (login/logout) succeeds and persists session.
- Key CRUD journey works with optimistic UI.
- Slow network simulation still shows fallbacks and recovers.

## CI pipeline

```bash
pnpm lint
pnpm typecheck
pnpm test -- --runInBand
pnpm size
pnpm --filter @philjs/core vitest bench
pnpm exec playwright test --reporter=line
```

Cache pnpm store; upload Playwright traces on failure.

## Snapshots policy

- Avoid giant snapshots; use them for small, stable UI fragments only.
- Prefer explicit assertions for text/aria/structure.

## Flake reduction

- Clean up timers and intervals in tests.
- Avoid relying on animation frames; fake them or disable animations in tests.
- Give async expectations clear timeouts.

## A11y

- Query by role/label/placeholder.
- Ensure focus management is tested for dialogs/menus.
- Run axe on critical pages in Playwright or as a unit helper sparingly.

## Performance and budgets

- Gate PRs on `size-limit`.
- Benchmark hot paths periodically; track regressions.
- Record a Playwright trace for each major feature before release.

## When bugs happen

1) Reproduce with a minimal test (unit or component).
2) Add assertions that would have caught it.
3) Fix the code; keep the test.
4) If flakiness was involved, add a guardrail (fake timers, MSW handler, deterministic data).

## Coverage focus

- Loader/action logic and cache invalidation.
- Routing with params, redirects, and errors.
- Stores with middleware, history, and persistence.
- Complex widgets (forms, editors, charts) with real interactions.

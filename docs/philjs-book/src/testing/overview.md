# Testing

PhilJS includes a first-party testing library that mirrors DOM Testing Library with PhilJS-aware utilities.

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@philjs/testing";
import { Counter } from "../src/Counter";

describe("Counter", () => {
  it("increments", () => {
    render(() => <Counter />);
    fireEvent.click(screen.getByRole("button", { name: /increment/i }));
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
```

## Run tests

```bash
pnpm test
pnpm --filter @philjs/core test:coverage
```

## Test layers

- **Unit**: signals, stores, helpers. Use Vitest + PhilJS testing library.
- **Component**: render components, interact via roles/labels, assert DOM.
- **Integration**: render routes with loaders/actions mocked (MSW), assert navigation and cache effects.
- **E2E**: Playwright against dev/preview builds; cover core user journeys.
- **Performance**: use `vitest bench` and Playwright traces for route timings.

## Mocking and data

- Use MSW to stub network calls; mirror API schemas to catch drift.
- For stores, set initial state and assert selectors and middleware behavior.
- Avoid shallow rendering—test real DOM output; prefer role-based queries.

## Coverage and budgets

- Run `pnpm --filter @philjs/core test:coverage` for critical packages.
- Track snapshot size sparingly; prefer explicit assertions over large snapshots.
- Include perf budgets in CI: `pnpm bench` and `pnpm size`.
- Gate merges on tests + lint + typecheck; surface flaky tests early.
- Add property-based/fuzz tests for critical invariants; see [Property-Based Testing](./property-based.md).

## Playwright smoke template

```ts
import { test, expect } from '@playwright/test';

test('home renders and navigates', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('heading', { name: /home/i })).toBeVisible();
  await page.getByRole('link', { name: /about/i }).click();
  await expect(page).toHaveURL(/about/);
});
```

## Testing loaders/actions

- Unit-test loaders with fake `request`, `params`, and `signal`.
- Integration-test forms via `<Form>` in jsdom; assert action results and invalidations.
- In E2E, submit real forms and assert SSR + hydration consistency (no flicker, no double submit).

## CI pipeline template

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test -- --runInBand
pnpm size
pnpm bench --filter @philjs/core
```

Cache pnpm store between runs; record Playwright traces for failing tests.

## Accessibility checks

- Use `getByRole`/`getByLabelText` to encode a11y into tests.
- Add automated a11y checks (axe) in CI for key pages.
- Include keyboard navigation tests in Playwright (tab/enter/escape flows).
- Verify reduced-motion handling in tests where motion is involved.

## Fixtures and data strategy

- Keep fixtures small and realistic; prefer factory helpers to enormous JSON.
- Reset global state between tests; use `beforeEach` to recreate signals/stores.
- For date/time logic, use fake timers to make assertions stable.

## Checklist

- [ ] Unit tests for core logic and signals.
- [ ] Component tests cover interactions (clicks, input, keyboard).
- [ ] Integration tests for loaders/actions with MSW.
- [ ] Playwright smoke tests for critical routes.
- [ ] Perf/bench runs in CI for regressions.
- [ ] A11y assertions via roles/labels.

## Try it now: loader integration test

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@philjs/testing';
import { ProjectsRoute } from '../src/routes/projects';
import { server, rest } from './test-server'; // MSW setup

describe('ProjectsRoute', () => {
  it('renders projects from loader', async () => {
    server.use(rest.get('/api/projects', (_req, res, ctx) =>
      res(ctx.json([{ id: '1', name: 'Alpha' }]))
    ));
    render(() => <ProjectsRoute data={[{ id: '1', name: 'Alpha' }]} />);
    await waitFor(() => screen.getByText('Alpha'));
  });
});
```

Wire MSW once in setup tests; reuse across suites for realistic behavior.

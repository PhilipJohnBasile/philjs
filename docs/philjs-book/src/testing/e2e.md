# End-to-End (E2E) Testing with Playwright

Test real user journeys across SSR, hydration, and client-side interactions.

## Setup

- Install Playwright via `pnpm exec playwright install`.
- Add scripts: `"test:e2e": "playwright test"` and CI reporter config.
- Run against `philjs dev --ssr` or a preview build for realistic behavior.

## Core smoke suite

- Home renders; no console errors.
- Navigation works (links, back/forward); scroll restoration.
- Auth flow (login/logout) and session persistence.
- Key CRUD journey with optimistic UI.
- Slow network fallback: throttled tests to ensure skeletons render.

## Writing tests

```ts
import { test, expect } from '@playwright/test';

test('dashboard loads and prefetches settings', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  await page.getByRole('link', { name: /settings/i }).hover();
  // optional: assert prefetch via network or cache state if exposed
});
```

## Fixtures and data

- Use test accounts/seed data; isolate per test.
- For destructive actions, reset DB or use ephemeral env.
- Mock third-party services (email, payments) with test doubles.

## Traces and debugging

- Enable traces on failure (`--trace on-first-retry`); upload artifacts in CI.
- Capture console logs and network requests for flaky tests.
- Use `page.route` sparingly; prefer full-stack paths to catch integration issues.

## Performance checks

- Record traces for hot routes; assert no long tasks and reasonable TTFB.
- Optional: measure LCP via custom script if needed.

## Accessibility checks

- Keyboard navigation: tab through dialogs/menus; ensure focus trap works.
- Basic aria/role checks on key pages; optionally run axe on a subset.

## CI tips

- Run headless; cache browsers if CI allows.
- Parallelize suites but serialize when tests share stateful backends.
- Set generous timeouts for SSR/edge preview starts; fail fast if server isn’t ready.

## Checklist

- [ ] Smoke covers home/nav/auth/CRUD.
- [ ] Traces on failure enabled and archived.
- [ ] Fixtures isolated; DB reset per suite if needed.
- [ ] Accessibility keyboard flows covered.
- [ ] Perf traces captured for critical routes before release.

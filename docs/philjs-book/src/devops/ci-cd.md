# CI/CD for PhilJS

Automate builds, tests, and deploys to keep quality high and releases fast.

## Pipelines

- **Install**: `pnpm install --frozen-lockfile`
- **Static checks**: `pnpm lint`, `pnpm typecheck`, `pnpm size`
- **Tests**: `pnpm test -- --runInBand`, `pnpm --filter @philjs/core vitest bench`
- **Build**: `pnpm build` (client + server)
- **E2E**: `pnpm exec playwright test --reporter=line`
- **Artifacts**: upload build outputs, Playwright traces on failure

## Caching

- Cache pnpm store and optionally Playwright browsers.
- Avoid caching `node_modules`; prefer pnpm store for determinism.

## Preview environments

- Deploy PR previews (edge/serverless) for review.
- Run smoke tests against previews to catch environment-specific issues.

## Branching and gating

- Protect main with required checks (lint, typecheck, test, size).
- Use feature flags for risky changes; toggle in production without redeploy.

## Secrets and env

- Inject via CI secrets; never commit.
- Validate required env in build/test; fail fast if missing.

## Observability hooks

- Emit build id/commit hash into responses for traceability.
- Post metrics (test duration, failure counts) to dashboards.

## Rollbacks

- Keep previous build artifacts; support quick rollbacks in deploy platform.
- Automate cache invalidation on rollback if HTML/data changed.

## Checklist

- [ ] CI runs lint/typecheck/tests/size/build/E2E.
- [ ] Caches configured (pnpm store, browsers).
- [ ] Previews deployed per PR with smoke tests.
- [ ] Secrets managed via CI; env validated.
- [ ] Rollback plan documented and tested.

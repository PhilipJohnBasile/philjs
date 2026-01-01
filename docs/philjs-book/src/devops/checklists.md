# DevOps Checklists

## Pre-merge

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm size` pass.
- [ ] Key Playwright smoke tests green; traces captured on failure.
- [ ] Bundle sizes within budget; no regression in benches.
- [ ] Security headers/CSP unaffected by changes (if relevant).
- [ ] Docs updated for behavior changes.

## Pre-release

- [ ] Staging deploy green; SSR/edge preview tested.
- [ ] Observability dashboards updated (new routes/metrics).
- [ ] Feature flags set for risky features; defaults safe.
- [ ] Backups/rollbacks tested or ready.
- [ ] Changelog/release notes prepared.

## Post-release

- [ ] Monitor TTFB/error rate/cache hit ratio for 24–48h.
- [ ] Address alerts quickly; roll back if necessary.
- [ ] Clean up feature flags after stabilization.
- [ ] Update docs with any hotfixes.

## Infrastructure hygiene

- [ ] Env/secret validation at startup.
- [ ] Least privilege for edge/serverless roles.
- [ ] Dependency scanning scheduled.
- [ ] Build artifacts reproducible; tagged per release.

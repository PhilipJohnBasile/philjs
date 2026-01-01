# Release Management

Plan and execute PhilJS releases with confidence and traceability.

## Versioning and change control

- Use semantic versioning for your app/packages (even if PhilJS stays at 0.1.0).
- Generate changelogs from commits/changesets; highlight breaking changes and migrations.
- Tag releases in git; attach artifacts (build hashes, docs links).

## Pre-release checklist

- CI green: lint, typecheck, tests, size, build, E2E.
- Benchmarks stable vs baseline; bundle sizes within budget.
- Docs updated (API changes, migration notes).
- Observability dashboards updated for new metrics/routes.
- Feature flags ready for risky features.

## Release process

- Cut a release branch; freeze non-critical changes.
- Build and deploy to staging; run smoke/E2E.
- Promote to production; monitor metrics (errors, TTFB, cache hits, business KPIs).
- Gradual rollout if platform supports it; ramp traffic while watching alerts.

## Post-release

- Announce changes (internal/external) with highlights and upgrade steps.
- Track regressions; open follow-up issues with owners and deadlines.
- Clean up feature flags when stabilized.

## Rollback

- Keep previous build artifacts; enable quick rollback in platform.
- Invalidate caches to clear bad HTML/data.
- Document rollback steps per platform (edge/serverless/static).

## Compliance/audit notes

- Keep release notes and build hashes for audit trails.
- Record who approved and when.

## Checklist

- [ ] Changelog and version tags updated.
- [ ] CI + staging smoke green.
- [ ] Observability/alerts in place for new release.
- [ ] Rollout plan and rollback steps ready.
- [ ] Feature flags toggled appropriately post-release.

# Architecture Decision Records (ADRs)

Track key technical decisions for PhilJS projects.

## Why ADRs

- Capture context, options, and consequences.
- Onboard new team members quickly.
- Avoid re-litigating past decisions.

## Template (suggested)

```
ADR-00X: Title
Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded

Context:
  - Background and constraints.

Decision:
  - Chosen approach.

Consequences:
  - Positive/negative trade-offs.

Alternatives:
  - Considered and why rejected.
```

## What to record

- Routing/data strategy (loaders/actions vs client-only).
- SSR/islands strategy per surface.
- State management choices (signals/stores/resources boundaries).
- Caching strategy (tags, stale times, revalidate).
- Security/auth approach.
- Observability stack (APM/logs/metrics).
- Deployment targets (edge vs regional vs static).

## Practices

- Keep ADRs in repo (`docs/adr/`); link from README.
- Reference ADRs in PRs when touching related code.
- Supersede old ADRs when direction changes; keep history.

## Checklist

- [ ] ADR created for significant decisions.
- [ ] Status updated; superseded ADRs linked.
- [ ] Linked from relevant docs/code (e.g., router setup, caching config).

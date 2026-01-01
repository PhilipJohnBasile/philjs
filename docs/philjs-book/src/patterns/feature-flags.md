# Feature Flags and Experiments

Control rollouts and experiments safely with PhilJS.

## Goals

- Ship incrementally; reduce blast radius.
- Run A/B or multivariate tests with clear assignment and analytics.
- Kill-switch risky features instantly.

## Implementation

- Central flag provider (server-driven or config).
- Evaluate flags in loaders/actions; pass to components as props/signals.
- For experiments, assign variants server-side; persist in cookies/local storage with expiry.

## Data and cache impact

- Tag caches with flag/variant to avoid cross-contamination.
- Avoid caching HTML for user-specific flag combinations unless scoped.

## Observability

- Log flag/variant values with events and errors.
- Analyze impact on performance and business metrics.

## Testing

- Unit: flag evaluation logic with overrides.
- Integration: simulate variants and assert UI changes.
- E2E: ensure consistent variant across navigation/session.

## Checklist

- [ ] Flag evaluation centralized; defaults defined.
- [ ] Variants persisted and consistent per user/session.
- [ ] Caches scoped to flags/variants as needed.
- [ ] Metrics/analytics include flag/variant dimensions.

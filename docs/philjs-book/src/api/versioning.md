# API Versioning and Compatibility

Keep APIs stable and predictable for PhilJS clients across releases.

## Versioning strategies

- **URL/version header**: e.g., `/api/v1` or `Accept: application/vnd.api+json;version=1`.
- **Feature flags** for gradual rollout of breaking changes.
- **Deprecated fields**: mark in responses, remove after a grace period.

## Client impact

- Lock generated types to a specific API version.
- Surface deprecation warnings in dev builds; log and track usage.
- Keep loaders/actions backward compatible when possible; add shims for new fields.

## Change management

- Introduce additions as backwards-compatible fields.
- For breaking changes, dual-serve old/new versions during migration.
- Document migration paths in `docs/api` and update the book sections that reference APIs.

## Testing

- Contract tests per version (MSW or mock server).
- Integration tests for dual-version periods.
- Playwright smoke tests to ensure old clients still function during rollout.

## Observability

- Log API version per request; monitor error rates by version.
- Alert on deprecated version usage spikes to accelerate migration.

## Checklist

- [ ] Clear versioning scheme (URL/header).
- [ ] Types generated per version; shims where needed.
- [ ] Deprecations communicated with timelines.
- [ ] Tests cover dual-version periods.

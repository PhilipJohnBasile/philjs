# API Contract Testing

Ensure your PhilJS clients and backend agree on request/response shapes.

## Approaches

- **Mock servers**: MSW or local mock server that mirrors the contract.
- **Schema-driven**: generate types from OpenAPI/GraphQL, validate responses against schema.
- **Pact-style**: consumer-driven contracts for specific interactions.

## Tooling

- `openapi-typescript` / `graphql-codegen` for types.
- MSW for local contract enforcement; fail tests on schema mismatch.
- Optional: Pact for service-to-service contracts if applicable.

## Patterns

- Keep fixtures aligned with contracts; avoid ad-hoc JSON.
- Validate unknown JSON in loaders/resources before using in UI.
- For GraphQL, validate against schema and ensure fragments stay in sync.

## Testing levels

- Unit: validate parser/mapper functions against fixtures.
- Integration: run loaders/actions with MSW serving contract-correct responses.
- E2E: smoke against staging with schema validation enabled (fail fast on drift).

## Drift detection

- Log schema mismatch warnings in dev.
- Add CI checks that regenerate types and diff to catch breaking changes.
- Alert on production JSON validation failures (rate-limited).

## Checklist

- [ ] Types generated and up to date.
- [ ] Loaders/resources validate responses.
- [ ] MSW/contract tests cover critical endpoints.
- [ ] Alerts/logs for schema drift in production.

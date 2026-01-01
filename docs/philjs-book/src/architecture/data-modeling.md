# Data Modeling and Domain Design

Shape your data so loaders, stores, and UI stay simple and consistent.

## Principles

- Normalize where needed; denormalize for hot paths cautiously.
- Stable identifiers for entities; use them for cache tags and keys.
- Version schemas; keep backward compatibility when possible.
- Keep server truth authoritative; client caches are hints.

## Shapes for loaders

- Return serializable, minimal payloads.
- Include metadata: `etag`, `updatedAt`, `permissions`, `flags`.
- Avoid large blobs; provide URLs for deferred assets.

## Shapes for stores

- Keep domain slices small and cohesive (e.g., `auth`, `preferences`, `cart`).
- Use selectors for derived views; avoid duplicating derived data.
- Limit history/persistence to necessary fields.

## Relationships

- Represent relations with ids; load details lazily.
- For lists, include paging cursors and total counts.
- Use tags per entity + list to make invalidation precise.

## Validation and migrations

- Validate incoming data with schemas; log schema drift.
- Migrate stored/persisted data between versions with migration steps.
- Avoid silent data shape changes; version and test migrations.

## Offline and sync

- Store minimal drafts; mark records with sync status.
- Handle conflicts explicitly (keep both, merge, or latest-wins with user notice).
- Avoid storing secrets; encrypt sensitive fields.

## Testing

- Contract tests for server/client agreement (see API contract testing).
- Fixture factories with realistic shapes; avoid overly generic data.
- Fuzz test selectors and reducers for edge cases.

## Checklist

- [ ] Entities have stable ids and tags.
- [ ] Loader responses minimal, serializable, and validated.
- [ ] Stores split by domain; selectors used for derived data.
- [ ] Migrations defined for persisted data changes.
- [ ] Offline/conflict strategy documented and tested.

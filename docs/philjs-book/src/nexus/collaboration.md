# Collaboration Patterns (Nexus)

Build real-time, multi-user experiences on top of Nexus and PhilJS.

## Presence

- Use `@philjs/collab` or WebSockets to broadcast presence (online, active doc, cursor).
- Keep payloads small: user id, display name, color, position.
- Expire stale presence with heartbeats; drop disconnected users quickly.

## CRDTs and conflict resolution

- Prefer CRDT-backed data structures for shared documents/boards.
- If using patches/logs, record intent and order; replay to reach consistency.
- Show conflicts explicitly (e.g., “other user editing this section”).

## Editing models

- Text/blocks: CRDTs for high concurrency.
- Forms/dashboards: optimistic updates with conflict checks on commit.
- Media: lock or chunked uploads with coordination via server/worker.

## Sync channels

- WebSockets for low latency; fallback to SSE/long-polling if needed.
- Batch updates and coalesce rapid events to reduce churn.
- Authenticate channels with short-lived tokens; scope access per document/tenant.

## Offline + reconnect

- Queue edits locally; replay on reconnect with ordering preserved.
- Detect divergence and request full resync when conflicts are too large.
- Keep UI showing “synced/unsynced” state; allow manual retry.

## Observability

- Log sync lag, drop/reconnect counts, and conflict rates.
- Trace from intent → network event → state merge to debug drift.

## Testing

- Simulate multiple clients (in tests) with different event orders; assert convergence.
- E2E: run two browsers and verify presence/cursors and conflict handling.
- Fuzz merge logic with randomized patches.

## Checklist

- [ ] Presence broadcast with heartbeats and expiry.
- [ ] Authenticated channels per doc/tenant.
- [ ] Conflict strategy defined (CRDT or explicit merge).
- [ ] Offline queue and replay tested.
- [ ] Metrics for lag, conflicts, reconnects.

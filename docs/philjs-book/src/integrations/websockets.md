# WebSockets and Realtime Updates

Deliver live experiences (chat, presence, dashboards) with WebSockets or Server-Sent Events while keeping caches and UI in sync.

## When to use

- Multi-user collaboration (presence, cursors).
- Live dashboards/logs.
- Notifications/alerts that must arrive immediately.

## Client setup

- Use `@philjs/realtime` (if available) or native `WebSocket`.
- Keep connection lifecycle in a dedicated module; expose signals/stores for UI.
- Reconnect with backoff; cap retries and surface connection status to users.

```typescript
const status = signal<'connecting' | 'open' | 'closed'>('connecting');
const socket = new WebSocket('wss://example.com/ws');
socket.onopen = () => status.set('open');
socket.onclose = () => status.set('closed');
```

## Cache coherence

- Map incoming events to cache invalidation or direct store updates.
- Use tags (e.g., `['project', id]`) to invalidate loader caches on relevant events.
- Batch UI updates with `batch()` to avoid churn.

## Security

- Authenticate sockets with short-lived tokens; refresh on expiry.
- Validate incoming messages; never trust client-sent events blindly.
- Avoid leaking PII in payloads; encrypt if needed; rate-limit server-side.

## Performance

- Throttle high-frequency events; coalesce updates before hitting the UI.
- Use presence heartbeats at sane intervals; drop idle connections.
- For large payloads, consider delta updates or patches instead of full objects.

## Testing

- Use MSW/WebSocket mocks or custom test servers to simulate events.
- Integration tests: open socket, emit events, assert UI updates and cache invalidation.
- E2E: Playwright to verify live updates appear without reload.

## Checklist

- [ ] Reconnect with backoff; surface status.
- [ ] Validate messages; auth with short-lived tokens.
- [ ] Cache invalidation or direct store updates wired.
- [ ] Batch updates to avoid render churn.
- [ ] Tests cover connect/reconnect/events.

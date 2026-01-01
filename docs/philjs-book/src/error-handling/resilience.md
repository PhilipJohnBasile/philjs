# Error Handling and Resilience

Design PhilJS apps to fail gracefully and recover quickly.

## Principles

- Fail fast in loaders/actions; redirect or render fallbacks instead of blank screens.
- Isolate failures with granular error boundaries.
- Preserve user work; never lose input on error.

## Error boundaries

- Route-level boundaries catch loader/action/render errors.
- Layout boundaries protect major sections (e.g., sidebar vs main content).
- Provide retry buttons and diagnostics (in dev) and friendly messages (in prod).

## Network and API failures

- Timeouts and retries with backoff for loader/action fetches.
- Distinguish client vs server vs auth errors; tailor messaging.
- For mutations, roll back optimistic updates on failure and show next steps.

## Offline/partial availability

- Use cached data when offline; label it as stale.
- Queue mutations and replay on reconnect; surface sync status.
- Show offline banners; avoid modal blocks.

## Data integrity

- Validate and sanitize all inputs; guard against prototype pollution.
- Reject malformed data early; log schema mismatches in dev.
- Keep idempotency keys for mutations to prevent duplicates.

## UI/UX patterns

- Skeletons/spinners for loading, clear empty/error states.
- Keep forms filled after errors; highlight fields needing attention.
- For AI features, explain failure reasons and offer retry or alternative paths.

## Observability

- Log errors with route/loader/action context and request ids.
- Track error rates per route; alert on spikes.
- Capture user impact (how many users/sessions affected).

## Testing

- Unit: throw in loaders/actions, assert boundaries and redirects.
- Integration: simulate 4xx/5xx/timeouts with MSW; assert fallbacks and retries.
- E2E: throttle/kill network; ensure offline banners and stale data render.

## Checklist

- [ ] Boundaries at layout/route level with retries.
- [ ] Timeouts/retries/backoff for network calls.
- [ ] Optimistic updates roll back cleanly.
- [ ] Offline states and mutation queues tested.
- [ ] Errors logged with context; alerts configured.

# API Error Handling Patterns

Design APIs and clients to report and recover from errors consistently.

## Error shapes

- Standardize on a JSON error shape, e.g.:
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "details": { "field": "email" },
    "requestId": "abc123"
  }
}
```
- Include machine-readable codes; keep messages user-friendly but safe.
- Add `requestId` to correlate with logs/traces.

## Client handling (PhilJS)

- Map codes to user-facing messages and actions.
- For forms, map `details.field` to inline errors.
- For auth errors, redirect or show reauth flows.
- Log errors with route/loader/action context.

## Transport considerations

- Use proper status codes (4xx/5xx).
- Avoid overloading 200 for errors.
- Include Retry-After for throttling/429.

## Retries and backoff

- Only retry idempotent operations.
- Use exponential backoff with jitter.
- Cap retries; surface status to the user.

## Testing

- Contract tests for error shapes.
- Integration tests for loader/action error handling.
- Playwright tests to assert UI renders helpful errors and preserves user input.

## Checklist

- [ ] Standard JSON error shape with codes and requestId.
- [ ] Clients map errors to UI and logs.
- [ ] Proper HTTP status codes used.
- [ ] Retries with backoff for idempotent actions only.

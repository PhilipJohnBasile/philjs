# Edge Security Considerations

Run PhilJS safely on edge/serverless platforms.

## Runtime constraints

- Web APIs only; avoid Node-only modules (fs, net) in edge bundles.
- Keep secrets in env; never inline into client bundles.
- Validate env presence at startup; fail fast.

## Network and origin policy

- Restrict outbound calls to allowed domains.
- Use HTTPS everywhere; validate certificates.
- Apply CORS rules deliberately; avoid `*` on credentials.

## Data and caching

- Don’t cache user-specific HTML; cache data with scoped tags.
- Sanitize and validate all inputs (params/query/body).
- Strip dangerous keys (`__proto__`, `constructor`) from JSON.

## Headers and CSP

- Set CSP to disallow inline/eval; limit script/style origins.
- HSTS, `X-Content-Type-Options: nosniff`, `Frame-Options/Frame-Ancestors`.
- Set secure cookies (`HttpOnly`, `SameSite`, `Secure`) when applicable.

## Webhooks and callbacks

- Verify signatures; use raw body when required by provider.
- Rate-limit and log webhook events; reject unexpected origins.

## Logging and PII

- Redact sensitive fields; include request/trace ids.
- Avoid logging secrets/tokens; store logs securely.

## Testing

- Security tests for loaders/actions (authZ, validation, CSRF/SSR context).
- Pen-test headers and CSP; check for missing security headers.
- Simulate malicious payloads in tests to catch injection/prototype pollution.

## Checklist

- [ ] Edge-safe imports (Web APIs only).
- [ ] Secrets/env validated; not bundled.
- [ ] CSP/headers set; cookies secure.
- [ ] Input validation/sanitization in loaders/actions.
- [ ] Webhooks verified; rate-limited.
- [ ] Logs redacted; request ids present.

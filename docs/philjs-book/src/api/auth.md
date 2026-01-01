# Authentication and Authorization

Keep auth safe and predictable in PhilJS apps.

## Authentication

- Use short-lived tokens; refresh securely.
- Store tokens in HttpOnly cookies when possible; avoid localStorage for secrets.
- For SSR/edge, read auth from headers/cookies and pass user context to loaders/actions.
- Redirect unauthenticated users early in loaders; avoid rendering sensitive pages client-only.

## Authorization

- Enforce roles/permissions in loaders/actions; default deny.
- Tag caches per user/role to avoid data bleed.
- Avoid caching HTML for user-specific pages; cache data with scoped tags only.

## Session handling

- Regenerate session identifiers after login.
- Set cookies: `Secure`, `HttpOnly`, `SameSite=Lax|Strict` as appropriate.
- Clear session on logout; invalidate related caches.

## CSRF

- Prefer SameSite cookies; for state-changing requests, use CSRF tokens or double-submit cookie patterns.
- Validate origin/referer on POST/PUT/PATCH/DELETE where possible.

## OAuth/OIDC

- Use PKCE for public clients.
- Store tokens server-side; send only necessary session info to the client.
- Handle token refresh server-side; avoid long-lived access tokens in the browser.

## API access from loaders/actions

- Forward auth context explicitly; do not trust client-supplied headers.
- Strip/validate headers when proxying to downstream services.

## Testing

- Unit: auth/permission guards with varied roles.
- Integration: loaders/actions with simulated cookies/headers.
- E2E: login/logout flows, session persistence, access control on restricted routes.

## Checklist

- [ ] Auth validated at loader/action boundaries.
- [ ] Roles/permissions enforced; default deny.
- [ ] Tokens/cookies secured; refresh handled safely.
- [ ] CSRF protections in place for mutations.
- [ ] User-scoped caches; no HTML caching for private pages.

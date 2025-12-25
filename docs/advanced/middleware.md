# Middleware

Add security, observability, and traffic control to PhilJS applications with route, API, and edge middleware.

## What You'll Learn

- When to use route guards vs API middleware vs edge middleware
- Composing middleware for reuse and consistency
- Applying security headers, rate limits, and geolocation
- Performance and debugging tips for production

## Middleware Types

| Layer | Runs in | Best for | Notes |
| --- | --- | --- | --- |
| Route guards | Browser | UI gating, redirects | Should not replace server checks |
| API middleware | Server | Auth, rate limits, validation | Enforced for every request |
| Edge middleware | CDN/edge | Redirects, geo, caching | Must be fast and deterministic |

## API Middleware (Server)

Use `defineAPIRoute` with `composeMiddleware` for consistent server enforcement.

```ts
import {
  defineAPIRoute,
  json,
  composeMiddleware,
  rateLimitMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  requestIDMiddleware,
} from 'philjs-api';

const middleware = composeMiddleware(
  requestIDMiddleware(),
  rateLimitMiddleware({ windowMs: 60_000, max: 120 }),
  corsMiddleware({ origin: ['https://app.example.com'] }),
  securityHeadersMiddleware({ hsts: true, nosniff: true })
);

export default defineAPIRoute({
  middleware: [middleware],
  handler: async ({ request }) => {
    return json({ ok: true, method: request.method });
  },
});
```

## Edge Middleware

Edge middleware is ideal for early redirects and geo-based routing.

```ts
import {
  defineEdgeMiddleware,
  composeEdgeMiddleware,
  redirectMiddleware,
  securityHeadersMiddleware,
} from 'philjs-api/edge-middleware';

export default defineEdgeMiddleware({
  matcher: ['/admin/*', '/account/*'],
  middleware: composeEdgeMiddleware(
    securityHeadersMiddleware({ hsts: true, nosniff: true, frameOptions: 'DENY' }),
    redirectMiddleware({ '/account': '/account/profile' })
  ),
});
```

## Route-Level Guards

Use route guards to improve UX, but always enforce access on the server too.

```tsx
import { useRouter } from 'philjs-router';
import { effect } from 'philjs-core';
import { useAuth } from '@/auth/useAuth';

export default function ProtectedLayout({ children }: { children: any }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  effect(() => {
    if (!isLoading() && !isAuthenticated()) {
      router.replace('/login');
    }
  });

  if (isLoading()) return <div>Loading...</div>;
  if (!isAuthenticated()) return null;
  return <div>{children}</div>;
}
```

## Best Practices

- Keep middleware fast and deterministic, especially on the edge.
- Scope middleware with matchers to avoid unnecessary work.
- Use API middleware for authorization, rate limits, and validation.
- Log request IDs and timing to correlate errors across layers.
- Treat route guards as UX helpers, not security boundaries.

## Related Topics

- [Routing Middleware](/docs/routing/middleware.md)
- [Edge Middleware](/docs/packages/api/edge-middleware.md)
- [Security Overview](/docs/security/overview.md)
- [API Security](/docs/security/api-security.md)
- [Authentication Guide](/docs/packages/auth/guide.md)

# Auth and Authorization

Build secure authentication flows and authorization policies for PhilJS applications, with server-enforced access and clean client state.

## What You'll Learn

- The difference between authentication, authorization, and session management
- When to use sessions, JWTs, or OAuth
- Using `@philjs/auth` for client-side auth state
- Protecting routes and API handlers
- Segmenting users for roles and experiments

## Overview

Authentication proves who the user is. Authorization decides what the user can access. In PhilJS, keep enforcement on the server (loaders, actions, API routes, or edge middleware) and use client state only to drive UI.

## Choose an Auth Model

| Model | Best for | Trade-offs |
| --- | --- | --- |
| Session cookies | Traditional web apps | Simple, secure; needs server-side session storage |
| JWT access tokens | APIs and mobile | Stateless; harder to revoke and rotate |
| OAuth/OIDC | Third-party identity | Offload login; depends on provider uptime |
| Hybrid (session + access token) | Large apps | Flexible; more moving parts |

## Quick Start with @philjs/auth

### CLI Generator

```bash
philjs generate auth clerk
```

### Manual Provider Setup

```ts
import { CustomAuthProvider, setAuthProvider, startSessionRefresh } from '@philjs/auth';

const authProvider = new CustomAuthProvider({
  apiUrl: 'https://api.example.com',
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
});

await authProvider.initialize();
setAuthProvider(authProvider);

startSessionRefresh({
  refreshBeforeExpiry: 5 * 60 * 1000,
  checkInterval: 60 * 1000,
});
```

### Wrap Your App

```tsx
import { AuthProvider } from '@philjs/auth';

export function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
```

### Use Auth Hooks

```tsx
import { useAuth, useUser, useHasPermission } from '@philjs/auth/hooks';

function AccountMenu() {
  const { signIn, signOut, isAuthenticated, isLoading } = useAuth();
  const user = useUser();
  const canManageBilling = useHasPermission('billing:write');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <span>{user?.email}</span>
          {canManageBilling && <a href="/billing">Billing</a>}
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <button onClick={() => signIn('user@example.com', 'password')}>
          Sign in
        </button>
      )}
    </div>
  );
}
```

## Protect Routes

Use the `ProtectedRoute` component or role helpers to gate UI.

```tsx
import { ProtectedRoute, withRole } from '@philjs/auth/protected-routes';

function AdminPage() {
  return (
    <ProtectedRoute redirectTo="/login">
      <AdminDashboard />
    </ProtectedRoute>
  );
}

const BillingAdmin = withRole(BillingAdminView, {
  role: 'billing-admin',
  redirectTo: '/forbidden',
});
```

## Server-Side Enforcement

Always enforce permissions on the server.

```ts
import { createAppRouter } from '@philjs/router';
import { getSessionUser } from './auth/server';

createAppRouter({
  routes: [
    {
      path: '/admin',
      loader: async ({ request }) => {
        const user = await getSessionUser(request);

        if (!user || !user.roles.includes('admin')) {
          throw new Response('Forbidden', { status: 403 });
        }

        return user;
      },
      component: AdminRoute,
    },
  ],
});
```

## User Segmentation

Segmentation keeps experiments, analytics, and personalization consistent across sessions.

```ts
type User = { id: string; roles: string[]; plan: 'free' | 'pro' | 'enterprise' };

export function getUserSegment(user: User | null) {
  if (!user) return 'anonymous';
  if (user.roles.includes('admin')) return 'admin';
  if (user.plan === 'enterprise') return 'enterprise';
  return 'standard';
}
```

## Best Practices

- Store refresh tokens in HttpOnly cookies and keep access tokens short-lived.
- Always validate permissions on the server, even if the client hides UI.
- Rotate tokens and invalidate sessions on password or role changes.
- Normalize the session shape so loaders, actions, and middleware share logic.
- Log auth decisions (without PII) to help with audits and debugging.

## Related Topics

- [Authentication Guide](/docs/packages/auth/guide.md)
- [Security: Authentication Patterns](/docs/security/authentication.md)
- [Routing Middleware](/docs/routing/middleware.md)
- [Edge Middleware](/docs/packages/api/edge-middleware.md)
- [A/B Testing](/docs/advanced/ab-testing.md)

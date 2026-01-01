# PhilJS Auth

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Comprehensive authentication and authorization system for PhilJS applications.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- ** Multiple Provider Support**: Clerk, Auth0, Supabase, NextAuth, or custom
- ** CLI Generators**: RedwoodJS-style generators for rapid setup
- ** Automatic Token Refresh**: Smart token refresh with configurable strategies
- ** Protected Routes**: HOCs, components, and hooks for route protection
- ** Role-Based Access**: Built-in permission and role checking
- ** Session Management**: Reactive session state using signals
- ** UI Components**: Pre-built, customizable auth UI components
- ** JWT Support**: Full JWT token management
- ** OAuth Integration**: Support for multiple OAuth providers
- ** Type-Safe**: Full TypeScript support with excellent DX

## Installation

```bash
pnpm add philjs-auth
```

## Quick Start

### 1. Generate Auth Setup (Recommended)

Use the PhilJS CLI to generate a complete authentication setup:

```bash
# Generate Clerk authentication
philjs generate auth clerk

# Generate Auth0 authentication
philjs generate auth auth0

# Generate Supabase authentication
philjs generate auth supabase

# Generate NextAuth authentication
philjs generate auth nextauth

# Generate custom authentication
philjs generate auth custom
```

This creates:
-  Authentication configuration
-  Provider integration
-  Login/Signup/Password Reset forms
-  Profile management
-  Protected route utilities
-  Example pages

### 2. Manual Setup

```typescript
import { CustomAuthProvider, setAuthProvider, startSessionRefresh } from 'philjs-auth';

// Create provider
const authProvider = new CustomAuthProvider({
  apiUrl: 'http://localhost:3000/api',
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
});

// Initialize
await authProvider.initialize();

// Set as global provider
setAuthProvider(authProvider);

// Start automatic token refresh
startSessionRefresh({
  refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes
  checkInterval: 60 * 1000, // 1 minute
});
```

### 3. Wrap Your App

```tsx
import { AuthProvider } from './auth/AuthProvider';

export function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

## Usage

### Authentication Hooks

```typescript
import { useAuth, useUser, useHasPermission } from 'philjs-auth/hooks';

function MyComponent() {
  const { signIn, signOut, isAuthenticated, isLoading } = useAuth();
  const user = useUser();
  const isAdmin = useHasPermission('admin');

  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={signOut}>Logout</button>
          {isAdmin && <a href="/admin">Admin Panel</a>}
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute, withRole } from 'philjs-auth/protected-routes';

// Component-based protection
function Dashboard() {
  return (
    <ProtectedRoute redirectTo="/login">
      <div>Dashboard content</div>
    </ProtectedRoute>
  );
}

// HOC-based protection
const AdminPanel = withRole(AdminPanelComponent, {
  role: 'admin',
  redirectTo: '/unauthorized',
});

// Conditional rendering
import { ShowForAuth, ShowForRole } from 'philjs-auth/protected-routes';

function Navigation() {
  return (
    <nav>
      <ShowForAuth>
        <a href="/dashboard">Dashboard</a>
      </ShowForAuth>
      <ShowForRole role="admin">
        <a href="/admin">Admin</a>
      </ShowForRole>
    </nav>
  );
}
```

### Session Management

```typescript
import {
  startSessionRefresh,
  SessionPersistence,
  logoutEverywhere
} from 'philjs-auth/session-refresh';

// Automatic token refresh
startSessionRefresh({
  refreshBeforeExpiry: 5 * 60 * 1000,
  checkInterval: 60 * 1000,
  refreshOnFocus: true,
  refreshOnReconnect: true,
  onRefreshFailed: (error) => {
    console.error('Token refresh failed:', error);
  },
});

// Session persistence
SessionPersistence.save(session, 'local');
const session = SessionPersistence.load('local');

// Logout everywhere
await logoutEverywhere();
```

## Providers

### Clerk

```bash
npm install @clerk/clerk-react
philjs generate auth clerk
```

### Auth0

```bash
npm install @auth0/auth0-react
philjs generate auth auth0
```

### Supabase

```bash
npm install @supabase/supabase-js
philjs generate auth supabase
```

### NextAuth

```bash
npm install next-auth
philjs generate auth nextauth
```

### Custom

Create your own authentication provider:

```typescript
import { BaseAuthProvider } from 'philjs-auth';
import { signal } from 'philjs-core/signals';

class MyAuthProvider extends BaseAuthProvider {
  readonly name = 'my-auth';
  readonly user = signal<User | null>(null);
  readonly session = signal<AuthSession | null>(null);
  readonly loading = signal(false);

  async initialize(): Promise<void> {
    // Initialize your auth system
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    // Implement sign in logic
  }

  // ... implement other required methods
}
```

## API Reference

### Hooks

- `useAuth()` - Main authentication hook
- `useUser()` - Get current user
- `useSession()` - Get current session
- `useIsAuthenticated()` - Check if authenticated
- `useAuthLoading()` - Check loading state
- `useHasPermission(permission)` - Check permissions/roles
- `useRequireAuth(redirectTo)` - Require authentication
- `useAccessToken()` - Get access token

### Protected Routes

- `<ProtectedRoute>` - Protect route component
- `withAuth(Component)` - Protect with HOC
- `withRole(Component, options)` - Role-based protection
- `withAnyRole(Component, options)` - Multiple role protection
- `<AuthGuard>` - Conditional rendering
- `<ShowForAuth>` - Show for authenticated users
- `<ShowForGuest>` - Show for guests
- `<ShowForRole>` - Show for specific role

### Session Management

- `startSessionRefresh(config)` - Start auto refresh
- `stopSessionRefresh()` - Stop auto refresh
- `SessionPersistence` - Session storage utilities
- `logoutEverywhere()` - Revoke all sessions

### Providers

- `ClerkAuthProvider` - Clerk integration
- `Auth0AuthProvider` - Auth0 integration
- `SupabaseAuthProvider` - Supabase integration
- `NextAuthProvider` - NextAuth integration
- `BaseAuthProvider` - Base class for custom providers

### Legacy APIs

The package also includes legacy session management and JWT utilities:

- `SessionManager` - Original session manager
- `JWTManager` - JWT token management
- `OAuthManager` - OAuth provider management
- Original `useAuth()` from `protected-route.js`

See the full documentation for complete API reference.

## Documentation

- [Authentication Guide](./AUTH_GUIDE.md) - Complete guide
- [Examples](./examples/) - Working examples

## Generator Options

```bash
philjs generate auth <provider> [options]

Options:
  -d, --directory <dir>        Target directory (default: "src")
  --no-ui                     Skip UI components
  --no-middleware             Skip middleware
  --no-protected-routes       Skip protected route utilities
  --js                        Use JavaScript instead of TypeScript
```

## Features

### Complete Authentication Flow
- Sign in / Sign up
- Password reset
- Email verification
- Profile management
- OAuth integration

### Advanced Session Management
- Automatic token refresh
- Refresh on focus
- Refresh on reconnect
- Session persistence
- Multi-device logout

### Security Best Practices
- Secure token storage
- CSRF protection
- XSS prevention
- Rate limiting ready
- Password validation

### Developer Experience
- TypeScript support
- RedwoodJS-style generators
- Pre-built UI components
- Comprehensive hooks
- Excellent documentation

## Examples

### Login Form

```typescript
import { useAuth } from 'philjs-auth/hooks';
import { signal } from 'philjs-core/signals';

const email = signal('');
const password = signal('');

export function LoginForm() {
  const { signIn, isLoading } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      await signIn(email.get(), password.get());
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email.get()}
        onInput={(e) => email.set(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password.get()}
        onInput={(e) => password.set(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Contributing

Contributions are welcome! Please read our [contributing guide](../../CONTRIBUTING.md).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./oauth, ./jwt, ./session, ./session-refresh, ./protected-route, ./protected-routes, ./hooks, ./auth-provider, ./providers/clerk, ./providers/auth0, ./providers/supabase, ./providers/next-auth
- Source files: packages/philjs-auth/src/index.ts, packages/philjs-auth/src/oauth.ts, packages/philjs-auth/src/jwt.ts, packages/philjs-auth/src/session.ts, packages/philjs-auth/src/session-refresh.ts, packages/philjs-auth/src/protected-route.ts, packages/philjs-auth/src/hooks.ts, packages/philjs-auth/src/auth-provider.ts, packages/philjs-auth/src/providers/clerk.ts, packages/philjs-auth/src/providers/auth0.ts, packages/philjs-auth/src/providers/supabase.ts, packages/philjs-auth/src/providers/next-auth.ts

### Public API
- Direct exports: Auth0AuthProvider, Auth0Config, AuthProvider, AuthProviderConfig, AuthProviderContext, AuthProviderFactory, ClerkAuthProvider, ClerkConfig, JWTManager, NextAuthConfig, NextAuthProvider, OAuthManager, OAuthProviders, PKCEPair, ProtectedRoute, RefreshConfig, SessionManager, SessionPersistence, SessionRefreshManager, SupabaseAuthProvider, SupabaseConfig, createJWTManager, createOAuthManager, createSessionManager, createToken, decodeToken, generateCodeChallenge, generateCodeVerifier, generatePKCE, generateState, getAuthProvider, getDefaultSessionManager, getRedirectUrl, getSessionRefreshManager, logoutEverywhere, redirectAfterLogin, redirectToLogin, requireAuth, setAuthProvider, setDefaultSessionManager, startSessionRefresh, stopSessionRefresh, useAccessToken, useAuth, useAuthLoading, useHasPermission, useIsAuthenticated, useRequireAuth, useSession, useUser, validateState, verifyToken, withAuth
- Re-exported names: Auth0AuthProvider, Auth0Config, AuthConfig, AuthProvider, AuthProviderConfig, AuthProviderContext, AuthProviderFactory, AuthSession, BaseAuthProvider, ClerkAuthProvider, ClerkConfig, JWTConfig, JWTManager, JWTPayload, NextAuthConfig, NextAuthProvider, OAuthConfig, OAuthManager, OAuthProvider, OAuthProviders, ProtectedRoute, ProtectedRouteConfig, RefreshConfig, SessionManager, SessionPersistence, SessionRefreshManager, SupabaseAuthProvider, SupabaseConfig, User, createJWTManager, createOAuthManager, createSessionManager, createToken, decodeToken, generateState, getAuthProvider, getDefaultSessionManager, getRedirectUrl, getSessionRefreshManager, logoutEverywhere, redirectAfterLogin, redirectToLogin, requireAuth, setAuthProvider, setDefaultSessionManager, startSessionRefresh, stopSessionRefresh, useAccessToken, useAuth, useAuthLoading, useHasPermission, useIsAuthenticated, useRequireAuth, useSession, useUser, validateState, verifyToken, withAuth
- Re-exported modules: ./auth-provider.js, ./hooks.js, ./jwt.js, ./oauth.js, ./protected-route.js, ./providers/auth0.js, ./providers/clerk.js, ./providers/next-auth.js, ./providers/supabase.js, ./session-refresh.js, ./session.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT  PhilJS Team

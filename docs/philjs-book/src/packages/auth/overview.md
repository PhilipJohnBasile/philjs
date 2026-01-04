# @philjs/auth

The `@philjs/auth` package provides authentication and authorization utilities for PhilJS applications, with adapters for popular auth providers.

## Installation

```bash
npm install @philjs/auth
```

## Features

- **Provider Adapters** - Clerk, Auth0, Supabase, NextAuth
- **Signal-Based** - Reactive auth state with PhilJS signals
- **Protected Routes** - HOCs and components for route protection
- **Session Management** - Automatic refresh and persistence
- **JWT Utilities** - Token creation, verification, and decoding
- **OAuth Support** - Built-in OAuth flow management

## Quick Start

```typescript
import { setAuthProvider, ClerkAuthProvider, useAuth, ProtectedRoute } from '@philjs/auth';

// Configure auth provider
const authProvider = new ClerkAuthProvider({
  publishableKey: 'pk_...',
});

setAuthProvider(authProvider);

// Use in components
function App() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  if (!isAuthenticated()) {
    return <button onClick={() => signIn()}>Sign In</button>;
  }

  return (
    <div>
      <p>Welcome, {user()?.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

// Protect routes
function Dashboard() {
  return (
    <ProtectedRoute fallback={<LoginPage />}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

## Auth Providers

### Clerk

```typescript
import { ClerkAuthProvider, setAuthProvider } from '@philjs/auth';
import type { ClerkConfig } from '@philjs/auth';

const config: ClerkConfig = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY,
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',
};

const provider = new ClerkAuthProvider(config);
setAuthProvider(provider);
```

### Auth0

```typescript
import { Auth0AuthProvider, setAuthProvider } from '@philjs/auth';
import type { Auth0Config } from '@philjs/auth';

const config: Auth0Config = {
  domain: 'your-tenant.auth0.com',
  clientId: 'your-client-id',
  redirectUri: window.location.origin,
  audience: 'https://your-api.com',
  scope: 'openid profile email',
};

const provider = new Auth0AuthProvider(config);
setAuthProvider(provider);
```

### Supabase

```typescript
import { SupabaseAuthProvider, setAuthProvider } from '@philjs/auth';
import type { SupabaseConfig } from '@philjs/auth';

const config: SupabaseConfig = {
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  redirectTo: `${window.location.origin}/auth/callback`,
};

const provider = new SupabaseAuthProvider(config);
setAuthProvider(provider);
```

### NextAuth

```typescript
import { NextAuthProvider, setAuthProvider } from '@philjs/auth';
import type { NextAuthConfig } from '@philjs/auth';

const config: NextAuthConfig = {
  basePath: '/api/auth',
  providers: ['google', 'github', 'credentials'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const provider = new NextAuthProvider(config);
setAuthProvider(provider);
```

### Custom Provider

```typescript
import { BaseAuthProvider, setAuthProvider } from '@philjs/auth';
import type { AuthProvider, AuthProviderContext } from '@philjs/auth';

class CustomAuthProvider extends BaseAuthProvider {
  async signIn(credentials: Record<string, any>): Promise<User | null> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const user = await response.json();
    this.setUser(user);
    return user;
  }

  async signOut(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
    this.setUser(null);
  }

  async getSession(): Promise<AuthSession | null> {
    const response = await fetch('/api/auth/session');
    return response.json();
  }
}

setAuthProvider(new CustomAuthProvider());
```

---

## Auth Hooks

### useAuth

Primary hook for authentication state and actions:

```typescript
import { useAuth } from '@philjs/auth';

function AuthButton() {
  const {
    user,              // Signal<User | null>
    isAuthenticated,   // Signal<boolean>
    isLoading,         // Signal<boolean>
    error,             // Signal<Error | null>
    signIn,            // (credentials?) => Promise<void>
    signOut,           // () => Promise<void>
    signUp,            // (credentials) => Promise<void>
  } = useAuth();

  if (isLoading()) {
    return <Spinner />;
  }

  if (isAuthenticated()) {
    return (
      <div>
        <span>{user()?.email}</span>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn()}>Sign In</button>;
}
```

### useUser

Get the current user:

```typescript
import { useUser } from '@philjs/auth';

function Profile() {
  const user = useUser();

  if (!user()) {
    return <p>Not signed in</p>;
  }

  return (
    <div>
      <img src={user()?.avatar} alt={user()?.name} />
      <h1>{user()?.name}</h1>
      <p>{user()?.email}</p>
    </div>
  );
}
```

### useSession

Access the full session:

```typescript
import { useSession } from '@philjs/auth';

function SessionInfo() {
  const session = useSession();

  return (
    <div>
      <p>Expires: {session()?.expiresAt}</p>
      <p>Created: {session()?.createdAt}</p>
    </div>
  );
}
```

### useIsAuthenticated

Simple authentication check:

```typescript
import { useIsAuthenticated } from '@philjs/auth';

function NavBar() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <nav>
      <a href="/">Home</a>
      {isAuthenticated() ? (
        <a href="/dashboard">Dashboard</a>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
```

### useHasPermission

Check user permissions:

```typescript
import { useHasPermission } from '@philjs/auth';

function AdminPanel() {
  const canAccess = useHasPermission('admin:read');
  const canWrite = useHasPermission('admin:write');

  if (!canAccess()) {
    return <p>Access denied</p>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {canWrite() && <button>Create New</button>}
    </div>
  );
}
```

### useRequireAuth

Redirect if not authenticated:

```typescript
import { useRequireAuth } from '@philjs/auth';

function PrivatePage() {
  useRequireAuth({
    redirectTo: '/login',
    message: 'Please sign in to continue',
  });

  return <div>Private content</div>;
}
```

### useAccessToken

Get the current access token:

```typescript
import { useAccessToken } from '@philjs/auth';

function APIClient() {
  const getToken = useAccessToken();

  async function fetchData() {
    const token = await getToken();
    const response = await fetch('/api/data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  }
}
```

---

## Protected Routes

### ProtectedRoute Component

```typescript
import { ProtectedRoute } from '@philjs/auth';

function App() {
  return (
    <Router>
      <Route path="/public" component={PublicPage} />

      <ProtectedRoute
        fallback={<LoginPage />}
        loadingFallback={<LoadingSpinner />}
      >
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
      </ProtectedRoute>
    </Router>
  );
}
```

### withAuth HOC

```typescript
import { withAuth } from '@philjs/auth';

const ProtectedDashboard = withAuth(Dashboard, {
  redirectTo: '/login',
  requiredPermissions: ['dashboard:view'],
});

// With custom loading
const ProtectedSettings = withAuth(Settings, {
  loadingComponent: CustomLoader,
  unauthorizedComponent: AccessDenied,
});
```

### requireAuth Middleware

```typescript
import { requireAuth } from '@philjs/auth';

// In route configuration
const routes = [
  {
    path: '/admin',
    component: AdminPanel,
    beforeEnter: requireAuth({
      redirectTo: '/login',
      permissions: ['admin'],
    }),
  },
];
```

### Redirect Utilities

```typescript
import {
  redirectToLogin,
  getRedirectUrl,
  redirectAfterLogin,
} from '@philjs/auth';

// Redirect to login with return URL
redirectToLogin('/dashboard');

// Get the stored redirect URL
const returnUrl = getRedirectUrl();

// Redirect after successful login
redirectAfterLogin('/default-page');
```

---

## Session Management

### SessionManager

```typescript
import {
  createSessionManager,
  getDefaultSessionManager,
} from '@philjs/auth';

const sessionManager = createSessionManager({
  storage: 'localStorage', // or 'sessionStorage', 'cookie'
  key: 'auth_session',
  maxAge: 7 * 24 * 60 * 60, // 7 days
});

// Store session
sessionManager.set({
  user: { id: '123', email: 'user@example.com' },
  accessToken: 'jwt...',
  expiresAt: Date.now() + 3600000,
});

// Get session
const session = sessionManager.get();

// Clear session
sessionManager.clear();

// Check if valid
const isValid = sessionManager.isValid();
```

### Session Refresh

```typescript
import {
  SessionRefreshManager,
  startSessionRefresh,
  stopSessionRefresh,
  logoutEverywhere,
} from '@philjs/auth';
import type { RefreshConfig } from '@philjs/auth';

const config: RefreshConfig = {
  refreshInterval: 5 * 60 * 1000,     // 5 minutes
  refreshThreshold: 60 * 1000,        // Refresh if < 1 min left
  onRefresh: async () => {
    const response = await fetch('/api/auth/refresh');
    return response.json();
  },
  onRefreshError: (error) => {
    console.error('Refresh failed:', error);
  },
};

// Start automatic refresh
startSessionRefresh(config);

// Stop refresh (on logout)
stopSessionRefresh();

// Logout from all devices
await logoutEverywhere();
```

### Session Persistence

```typescript
import { SessionPersistence } from '@philjs/auth';

const persistence = new SessionPersistence({
  key: 'auth_session',
  storage: localStorage,
  encrypt: true,
  encryptionKey: process.env.SESSION_SECRET,
});

// Save
persistence.save(session);

// Load
const session = persistence.load();

// Clear
persistence.clear();
```

---

## JWT Utilities

### Creating Tokens

```typescript
import { createToken, JWTManager } from '@philjs/auth';
import type { JWTPayload, JWTConfig } from '@philjs/auth';

// Simple token creation
const token = await createToken(
  { userId: '123', role: 'admin' },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' }
);

// With JWTManager
const jwtManager = new JWTManager({
  secret: process.env.JWT_SECRET!,
  algorithm: 'HS256',
  issuer: 'my-app',
  audience: 'my-api',
});

const token = await jwtManager.sign({
  sub: '123',
  name: 'John Doe',
  role: 'user',
});
```

### Verifying Tokens

```typescript
import { verifyToken, JWTManager } from '@philjs/auth';

// Simple verification
const payload = await verifyToken(token, process.env.JWT_SECRET!);
if (payload) {
  console.log('Valid token for user:', payload.userId);
}

// With JWTManager
const jwtManager = new JWTManager({ secret: '...' });
const result = await jwtManager.verify(token);

if (result.valid) {
  console.log('Payload:', result.payload);
} else {
  console.log('Error:', result.error);
}
```

### Decoding Tokens

```typescript
import { decodeToken } from '@philjs/auth';

// Decode without verification (for client-side)
const payload = decodeToken(token);
console.log('Expires:', new Date(payload.exp * 1000));
```

---

## OAuth Management

### OAuthManager

```typescript
import { createOAuthManager, OAuthProviders } from '@philjs/auth';

const oauth = createOAuthManager({
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: '/auth/callback/google',
      scope: ['openid', 'profile', 'email'],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectUri: '/auth/callback/github',
      scope: ['user:email'],
    },
  },
});

// Generate authorization URL
const authUrl = oauth.getAuthorizationUrl('google');

// Handle callback
const tokens = await oauth.handleCallback('google', code);

// Get user profile
const profile = await oauth.getUserProfile('google', tokens.accessToken);
```

### State Validation

```typescript
import { generateState, validateState } from '@philjs/auth';

// Generate secure state
const state = generateState();
sessionStorage.setItem('oauth_state', state);

// Validate on callback
const isValid = validateState(
  returnedState,
  sessionStorage.getItem('oauth_state')!
);
```

---

## Types Reference

```typescript
// User type
interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
  metadata?: Record<string, any>;
}

// Session type
interface AuthSession {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt?: number;
}

// Auth config
interface AuthConfig {
  loginUrl?: string;
  signUpUrl?: string;
  callbackUrl?: string;
  sessionMaxAge?: number;
}

// OAuth provider
interface OAuthProvider {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string[];
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
}

// JWT payload
interface JWTPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [key: string]: any;
}

// Protected route config
interface ProtectedRouteConfig {
  redirectTo?: string;
  permissions?: string[];
  roles?: string[];
  fallback?: Component;
  loadingFallback?: Component;
}
```

---

## API Reference

### Provider Setup

| Export | Description |
|--------|-------------|
| `setAuthProvider` | Set the global auth provider |
| `getAuthProvider` | Get the current auth provider |
| `ClerkAuthProvider` | Clerk adapter |
| `Auth0AuthProvider` | Auth0 adapter |
| `SupabaseAuthProvider` | Supabase adapter |
| `NextAuthProvider` | NextAuth adapter |
| `BaseAuthProvider` | Base class for custom providers |

### Hooks

| Export | Description |
|--------|-------------|
| `useAuth` | Full auth state and actions |
| `useUser` | Current user |
| `useSession` | Current session |
| `useIsAuthenticated` | Authentication status |
| `useAuthLoading` | Loading state |
| `useHasPermission` | Permission check |
| `useRequireAuth` | Require authentication |
| `useAccessToken` | Get access token |

### Protected Routes

| Export | Description |
|--------|-------------|
| `ProtectedRoute` | Route protection component |
| `withAuth` | HOC for protection |
| `requireAuth` | Route guard middleware |
| `redirectToLogin` | Redirect to login |
| `getRedirectUrl` | Get return URL |
| `redirectAfterLogin` | Redirect after auth |

### Session

| Export | Description |
|--------|-------------|
| `SessionManager` | Session management class |
| `createSessionManager` | Create session manager |
| `SessionRefreshManager` | Auto-refresh manager |
| `startSessionRefresh` | Start auto-refresh |
| `stopSessionRefresh` | Stop auto-refresh |
| `logoutEverywhere` | Logout all sessions |
| `SessionPersistence` | Session storage |

### JWT

| Export | Description |
|--------|-------------|
| `JWTManager` | JWT management class |
| `createJWTManager` | Create JWT manager |
| `createToken` | Create JWT |
| `verifyToken` | Verify JWT |
| `decodeToken` | Decode JWT |

### OAuth

| Export | Description |
|--------|-------------|
| `OAuthManager` | OAuth management class |
| `OAuthProviders` | Built-in provider configs |
| `createOAuthManager` | Create OAuth manager |
| `generateState` | Generate CSRF state |
| `validateState` | Validate CSRF state |

---

## Next Steps

- [@philjs/api for API Routes](../api/overview.md)
- [Security Best Practices](../../security/authentication.md)
- [@philjs/rpc for Type-Safe APIs](../rpc/overview.md)

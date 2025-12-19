# philjs-auth

Authentication and authorization utilities for PhilJS applications, featuring OAuth providers, JWT handling, session management, and protected routes with reactive signals.

## Features

- OAuth 2.0 integration (Google, GitHub, Discord, Microsoft, Twitter)
- JWT token creation, verification, and management
- Reactive session management with signals
- Protected route components
- Type-safe authentication flows
- Tree-shakeable exports
- Zero external dependencies (except PhilJS core)

## Installation

```bash
npm install philjs-auth
```

## Quick Start

### Session Management

```typescript
import { createSessionManager, useAuth } from 'philjs-auth';

// Create a session manager
const sessionManager = createSessionManager({
  sessionExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  cookieSecure: true,
  cookieSameSite: 'lax'
});

// Set a session after login
sessionManager.setSession(
  { id: '123', email: 'user@example.com', name: 'John Doe' },
  'access-token',
  3600000 // 1 hour
);

// Access reactive auth state
const { user, isAuthenticated, token } = useAuth();

console.log(isAuthenticated()); // true
console.log(user().name); // "John Doe"

// Clear session on logout
sessionManager.clearSession();
```

### Protected Routes

```typescript
import { ProtectedRoute, useAuth } from 'philjs-auth';

function Dashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute
      redirectTo="/login"
      fallback={<div>Loading...</div>}
    >
      <h1>Welcome, {user().name}!</h1>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Or use as HOC
import { withAuth } from 'philjs-auth';

const ProtectedDashboard = withAuth(Dashboard, {
  redirectTo: '/login'
});
```

### OAuth Authentication

```typescript
import { createOAuthManager, OAuthProviders, generateState } from 'philjs-auth';

// Setup OAuth manager
const oauthManager = createOAuthManager({
  providers: {
    google: OAuthProviders.google(
      'your-client-id',
      'your-client-secret',
      'http://localhost:3000/auth/callback'
    ),
    github: OAuthProviders.github(
      'your-client-id',
      'your-client-secret',
      'http://localhost:3000/auth/callback'
    )
  }
});

// Redirect to OAuth provider
function handleGoogleLogin() {
  const state = generateState();
  sessionStorage.setItem('oauth_state', state);

  const authUrl = oauthManager.getAuthUrl('google', state);
  window.location.href = authUrl;
}

// Handle OAuth callback
async function handleOAuthCallback(code: string, state: string) {
  // Verify state
  const savedState = sessionStorage.getItem('oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }

  // Complete authentication
  const { user, accessToken, expiresIn } = await oauthManager.completeAuth('google', code);

  // Set session
  const sessionManager = getDefaultSessionManager();
  sessionManager.setSession(user, accessToken, expiresIn ? expiresIn * 1000 : undefined);

  return user;
}
```

### JWT Tokens

```typescript
import { createJWTManager, createToken, verifyToken } from 'philjs-auth';

// Create JWT manager
const jwtManager = createJWTManager({
  secret: 'your-secret-key',
  expiresIn: 3600, // 1 hour
  issuer: 'your-app',
  audience: 'your-api'
});

// Create a token
const token = await jwtManager.create({
  sub: 'user-123',
  role: 'admin',
  permissions: ['read', 'write']
});

// Verify token
try {
  const payload = await jwtManager.verify(token);
  console.log(payload.sub); // "user-123"
  console.log(payload.role); // "admin"
} catch (error) {
  console.error('Invalid token:', error);
}

// Check expiration
if (jwtManager.isExpired(token)) {
  // Refresh token
  const newToken = await jwtManager.refresh(token);
}

// Quick utilities
const quickToken = await createToken({ sub: '123' }, 'secret');
const payload = await verifyToken(quickToken, 'secret');
```

## API Reference

### Session Management

#### `SessionManager`

```typescript
class SessionManager {
  constructor(config?: AuthConfig);

  // Reactive signals
  get session(): Signal<AuthSession>;
  get user(): ComputedSignal<User | null>;
  get isAuthenticated(): ComputedSignal<boolean>;
  get token(): ComputedSignal<string | undefined>;

  // Methods
  setSession(user: User, token?: string, expiresIn?: number): void;
  updateUser(updates: Partial<User>): void;
  clearSession(): void;
  refreshSession(expiresIn?: number): void;
  isExpired(): boolean;
}
```

#### `useAuth()`

Hook-like function for accessing auth state:

```typescript
const {
  user,              // ComputedSignal<User | null>
  isAuthenticated,   // ComputedSignal<boolean>
  token,             // ComputedSignal<string | undefined>
  session,           // Signal<AuthSession>
  login,             // (user, token?, expiresIn?) => void
  logout,            // () => void
  updateUser,        // (updates) => void
  refreshSession     // (expiresIn?) => void
} = useAuth();
```

### OAuth

#### `OAuthManager`

```typescript
class OAuthManager {
  constructor(config: OAuthConfig);

  getAuthUrl(providerName: string, state?: string): string;
  exchangeCode(providerName: string, code: string): Promise<TokenResponse>;
  getUserInfo(providerName: string, accessToken: string): Promise<User>;
  completeAuth(providerName: string, code: string): Promise<AuthResult>;
  refreshAccessToken(providerName: string, refreshToken: string): Promise<TokenResponse>;
}
```

#### Built-in Providers

```typescript
OAuthProviders.google(clientId, clientSecret, redirectUri)
OAuthProviders.github(clientId, clientSecret, redirectUri)
OAuthProviders.discord(clientId, clientSecret, redirectUri)
OAuthProviders.microsoft(clientId, clientSecret, redirectUri)
OAuthProviders.twitter(clientId, clientSecret, redirectUri)
```

### JWT

#### `JWTManager`

```typescript
class JWTManager {
  constructor(config: JWTConfig);

  create(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string>;
  verify(token: string): Promise<JWTPayload>;
  decode(token: string): JWTPayload | null;
  isExpired(token: string): boolean;
  getTimeToExpiry(token: string): number | null;
  refresh(token: string): Promise<string>;
}
```

### Protected Routes

#### `ProtectedRoute`

```typescript
function ProtectedRoute(props: {
  children: any;
  fallback?: any;
  redirectTo?: string;
  checkAuth?: () => boolean | Promise<boolean>;
  onUnauthorized?: () => void;
}): JSX.Element;
```

#### `withAuth`

Higher-order function for protecting components:

```typescript
function withAuth<T>(
  Component: (props: T) => any,
  config?: ProtectedRouteConfig
): (props: T) => any;
```

## Complete Example

```typescript
import {
  createSessionManager,
  createOAuthManager,
  createJWTManager,
  OAuthProviders,
  useAuth,
  ProtectedRoute
} from 'philjs-auth';

// Setup managers
const sessionManager = createSessionManager({
  sessionExpiry: 7 * 24 * 60 * 60 * 1000
});

const oauthManager = createOAuthManager({
  providers: {
    google: OAuthProviders.google(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      'http://localhost:3000/auth/callback'
    )
  }
});

const jwtManager = createJWTManager({
  secret: process.env.JWT_SECRET!,
  expiresIn: 3600
});

// Login page
function LoginPage() {
  const handleGoogleLogin = () => {
    const authUrl = oauthManager.getAuthUrl('google');
    window.location.href = authUrl;
  };

  return (
    <div>
      <h1>Login</h1>
      <button onclick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  );
}

// OAuth callback handler
async function handleCallback(code: string) {
  const { user, accessToken, expiresIn } = await oauthManager.completeAuth('google', code);

  // Create JWT for your app
  const appToken = await jwtManager.create({
    sub: user.id,
    email: user.email,
    role: 'user'
  });

  // Set session
  sessionManager.setSession(user, appToken, expiresIn ? expiresIn * 1000 : undefined);
}

// Protected dashboard
function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute redirectTo="/login">
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {user().name}!</p>
        <button onclick={logout}>Logout</button>
      </div>
    </ProtectedRoute>
  );
}
```

## Advanced Usage

### Custom OAuth Provider

```typescript
const customProvider: OAuthProvider = {
  name: 'Custom',
  authUrl: 'https://oauth.custom.com/authorize',
  tokenUrl: 'https://oauth.custom.com/token',
  userInfoUrl: 'https://api.custom.com/user',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  scope: ['profile', 'email']
};

const oauthManager = createOAuthManager({
  providers: {
    custom: customProvider
  }
});
```

### Server-Side Session Validation

```typescript
// API middleware
async function validateSession(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = await jwtManager.verify(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Automatic Token Refresh

```typescript
import { effect } from 'philjs-core/signals';

const sessionManager = getDefaultSessionManager();

// Auto-refresh 5 minutes before expiry
effect(() => {
  const session = sessionManager.session();
  if (!session.expiresAt) return;

  const timeToExpiry = session.expiresAt - Date.now();
  const refreshTime = timeToExpiry - (5 * 60 * 1000); // 5 minutes before

  if (refreshTime > 0) {
    setTimeout(async () => {
      if (session.refreshToken) {
        const { accessToken, expiresIn } = await oauthManager.refreshAccessToken(
          'google',
          session.refreshToken
        );
        sessionManager.setSession(
          session.user!,
          accessToken,
          expiresIn ? expiresIn * 1000 : undefined
        );
      }
    }, refreshTime);
  }
});
```

## TypeScript

Full TypeScript support with type definitions included:

```typescript
import type {
  User,
  AuthSession,
  AuthConfig,
  OAuthProvider,
  JWTPayload,
  ProtectedRouteConfig
} from 'philjs-auth';
```

## License

MIT

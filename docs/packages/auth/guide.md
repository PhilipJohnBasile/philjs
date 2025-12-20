# PhilJS Authentication Guide

Complete guide to authentication in PhilJS applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Generators](#generators)
- [Providers](#providers)
- [Hooks](#hooks)
- [Protected Routes](#protected-routes)
- [Session Management](#session-management)
- [Advanced Usage](#advanced-usage)

## Quick Start

### 1. Generate Authentication Setup

Use the PhilJS CLI to generate authentication setup for your preferred provider:

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

This will create:
- Authentication configuration
- Provider integration
- Login/Signup forms
- Password reset flow
- Profile management
- Protected route utilities
- Example pages

### 2. Install Dependencies

```bash
# For Clerk
npm install @clerk/clerk-react

# For Auth0
npm install @auth0/auth0-react

# For Supabase
npm install @supabase/supabase-js

# For NextAuth
npm install next-auth

# For Custom
npm install philjs-auth jsonwebtoken
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# NextAuth
NEXTAUTH_SECRET=your-secret-key

# Custom
VITE_API_URL=http://localhost:3000/api
JWT_SECRET=your-jwt-secret
```

### 4. Wrap Your App

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

## Generators

### Auth Generator Options

```bash
philjs generate auth <provider> [options]

Options:
  -d, --directory <dir>        Target directory (default: "src")
  --no-ui                     Skip UI components generation
  --no-middleware             Skip middleware generation
  --no-protected-routes       Skip protected route utilities
  --js                        Use JavaScript instead of TypeScript
```

### Generated Files

```
src/
├── auth/
│   ├── config.ts              # Provider configuration
│   ├── AuthProvider.tsx       # Provider wrapper component
│   ├── hooks.ts               # useAuth, useUser hooks
│   ├── protected.tsx          # Protected route utilities
│   ├── AuthGuard.tsx          # Conditional rendering component
│   └── components/
│       ├── LoginForm.tsx      # Login form component
│       ├── SignupForm.tsx     # Signup form component
│       ├── PasswordReset.tsx  # Password reset component
│       └── ProfileForm.tsx    # Profile management component
├── pages/
│   └── auth/
│       ├── sign-in.tsx        # Sign in page
│       ├── sign-up.tsx        # Sign up page
│       ├── forgot-password.tsx # Password reset page
│       └── profile.tsx        # Profile page
└── middleware.ts              # Auth middleware
```

## Providers

### Provider Abstraction

All auth providers implement a common interface:

```typescript
interface AuthProvider {
  readonly name: string;
  readonly user: Signal<User | null>;
  readonly session: Signal<AuthSession | null>;
  readonly loading: Signal<boolean>;

  initialize(): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signUpWithEmail(email: string, password: string, metadata?: Record<string, unknown>): Promise<User>;
  signInWithOAuth?(provider: string): Promise<void>;
  signOut(): Promise<void>;
  getToken(): Promise<string | null>;
  refreshToken?(): Promise<string>;
  updateUser?(updates: Partial<User>): Promise<User>;
  sendPasswordReset?(email: string): Promise<void>;
  resetPassword?(token: string, newPassword: string): Promise<void>;
}
```

### Custom Provider

Create a custom authentication provider:

```typescript
import { BaseAuthProvider, setAuthProvider } from 'philjs-auth';
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

  async signUpWithEmail(email: string, password: string): Promise<User> {
    // Implement sign up logic
  }

  async signOut(): Promise<void> {
    // Implement sign out logic
  }

  async getToken(): Promise<string | null> {
    // Return access token
  }
}

// Initialize and set as global provider
const authProvider = new MyAuthProvider(config);
await authProvider.initialize();
setAuthProvider(authProvider);
```

## Hooks

### useAuth()

Access authentication state and methods:

```typescript
import { useAuth } from 'philjs-auth/hooks';

function MyComponent() {
  const {
    user,              // Current user
    session,           // Current session
    isAuthenticated,   // Authentication status
    isLoading,         // Loading state
    signIn,            // Sign in method
    signUp,            // Sign up method
    signOut,           // Sign out method
    getToken,          // Get access token
    refreshToken,      // Refresh token
    updateUser,        // Update user profile
  } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}!</p>
      ) : (
        <button onClick={() => signIn(email, password)}>
          Sign In
        </button>
      )}
    </div>
  );
}
```

### useUser()

Get the current authenticated user:

```typescript
import { useUser } from 'philjs-auth/hooks';

function Profile() {
  const user = useUser();

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### useHasPermission()

Check user permissions or roles:

```typescript
import { useHasPermission } from 'philjs-auth/hooks';

function AdminPanel() {
  const isAdmin = useHasPermission('admin');

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return <div>Admin panel content</div>;
}
```

### useRequireAuth()

Redirect if not authenticated:

```typescript
import { useRequireAuth } from 'philjs-auth/hooks';

function ProtectedPage() {
  useRequireAuth('/login'); // Redirects to /login if not authenticated

  return <div>Protected content</div>;
}
```

## Protected Routes

### ProtectedRoute Component

Wrap components that require authentication:

```typescript
import { ProtectedRoute } from 'philjs-auth/protected-routes';

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Dashboard content</div>
    </ProtectedRoute>
  );
}
```

With custom redirect and fallback:

```typescript
<ProtectedRoute
  redirectTo="/login"
  fallback={<div>Loading...</div>}
>
  <div>Protected content</div>
</ProtectedRoute>
```

### withAuth HOC

Higher-order component for protecting components:

```typescript
import { withAuth } from 'philjs-auth/protected-routes';

function DashboardComponent() {
  return <div>Dashboard content</div>;
}

export const Dashboard = withAuth(DashboardComponent);
```

### Role-Based Protection

Protect routes based on user roles:

```typescript
import { withRole } from 'philjs-auth/protected-routes';

function AdminPanelComponent() {
  return <div>Admin panel</div>;
}

export const AdminPanel = withRole(AdminPanelComponent, {
  role: 'admin',
  redirectTo: '/unauthorized',
});
```

Multiple roles (OR logic):

```typescript
import { withAnyRole } from 'philjs-auth/protected-routes';

export const ModeratorPanel = withAnyRole(ModeratorPanelComponent, {
  roles: ['admin', 'moderator'],
  redirectTo: '/unauthorized',
});
```

### AuthGuard Component

Conditionally render content based on auth state:

```typescript
import { AuthGuard, ShowForAuth, ShowForGuest, ShowForRole } from 'philjs-auth/protected-routes';

function Navigation() {
  return (
    <nav>
      <ShowForAuth>
        <button onClick={logout}>Logout</button>
      </ShowForAuth>

      <ShowForGuest>
        <a href="/login">Login</a>
      </ShowForGuest>

      <ShowForRole role="admin">
        <a href="/admin">Admin Panel</a>
      </ShowForRole>
    </nav>
  );
}
```

## Session Management

### Automatic Token Refresh

Start automatic token refresh:

```typescript
import { startSessionRefresh } from 'philjs-auth/session-refresh';

startSessionRefresh({
  refreshBeforeExpiry: 5 * 60 * 1000, // Refresh 5 minutes before expiry
  checkInterval: 60 * 1000,            // Check every minute
  refreshOnFocus: true,                // Refresh when window gains focus
  refreshOnReconnect: true,            // Refresh on network reconnect
  onRefreshFailed: (error) => {
    console.error('Token refresh failed:', error);
    // Optionally redirect to login
  },
  onRefreshSuccess: (token) => {
    console.log('Token refreshed successfully');
  },
});
```

### Session Persistence

Save and load sessions:

```typescript
import { SessionPersistence } from 'philjs-auth/session-refresh';

// Save session
SessionPersistence.save(session, 'local'); // or 'session'

// Load session
const session = SessionPersistence.load('local');

// Clear session
SessionPersistence.clear('local');

// Clear all sessions
SessionPersistence.clearAll();
```

### Logout Everywhere

Revoke all sessions across all devices:

```typescript
import { logoutEverywhere } from 'philjs-auth/session-refresh';

async function handleLogoutEverywhere() {
  try {
    await logoutEverywhere();
    // User is logged out everywhere
  } catch (error) {
    console.error('Failed to logout everywhere:', error);
  }
}
```

## Advanced Usage

### Custom Auth Flow

Implement a custom authentication flow:

```typescript
import { useAuth } from 'philjs-auth/hooks';

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn(email, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit">Sign In</button>
    </form>
  );
}
```

### OAuth Sign In

Sign in with OAuth providers:

```typescript
import { useAuth } from 'philjs-auth/hooks';

function SocialLogin() {
  const { signInWithOAuth } = useAuth();

  return (
    <div>
      <button onClick={() => signInWithOAuth('google')}>
        Sign in with Google
      </button>

      <button onClick={() => signInWithOAuth('github')}>
        Sign in with GitHub
      </button>

      <button onClick={() => signInWithOAuth('facebook')}>
        Sign in with Facebook
      </button>
    </div>
  );
}
```

### Token Management

Get and use access tokens:

```typescript
import { useAuth } from 'philjs-auth/hooks';

async function fetchProtectedData() {
  const { getToken } = useAuth();

  const token = await getToken();

  const response = await fetch('/api/protected', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}
```

### Multi-Factor Authentication

Implement MFA flow:

```typescript
import { useAuth } from 'philjs-auth/hooks';

function MFASetup() {
  const { user } = useAuth();

  const enableMFA = async () => {
    // Call your MFA setup endpoint
    const response = await fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getToken()}`,
      },
    });

    const { qrCode, secret } = await response.json();

    // Display QR code for user to scan
  };

  return (
    <div>
      <h2>Two-Factor Authentication</h2>
      {user?.metadata?.mfaEnabled ? (
        <p>MFA is enabled</p>
      ) : (
        <button onClick={enableMFA}>Enable MFA</button>
      )}
    </div>
  );
}
```

## Best Practices

1. **Always use HTTPS in production** - Never send credentials over HTTP
2. **Validate tokens on the server** - Never trust client-side validation alone
3. **Use secure token storage** - Prefer httpOnly cookies for sensitive tokens
4. **Implement rate limiting** - Prevent brute force attacks
5. **Use strong password policies** - Enforce minimum length and complexity
6. **Enable MFA for sensitive operations** - Add extra security layer
7. **Refresh tokens before expiry** - Use automatic token refresh
8. **Handle errors gracefully** - Show user-friendly error messages
9. **Log security events** - Monitor authentication activity
10. **Keep dependencies updated** - Regularly update auth libraries

## Troubleshooting

### "Auth provider not initialized" error

Make sure you've wrapped your app with `AuthProvider` and called `setAuthProvider()`:

```typescript
import { AuthProvider } from './auth/AuthProvider';

export function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### Tokens not refreshing

Ensure your provider supports token refresh and you've started the refresh manager:

```typescript
import { startSessionRefresh } from 'philjs-auth/session-refresh';

startSessionRefresh({
  refreshBeforeExpiry: 5 * 60 * 1000,
});
```

### Redirect loops

Check your redirect logic and ensure protected routes don't redirect to themselves:

```typescript
// Bad - creates infinite loop
<ProtectedRoute redirectTo="/dashboard">
  <Dashboard />
</ProtectedRoute>

// Good - redirects to login
<ProtectedRoute redirectTo="/login">
  <Dashboard />
</ProtectedRoute>
```

## Examples

See the [examples directory](./examples/) for complete examples:

- [Custom Authentication](./examples/custom-auth.ts)
- Clerk Integration (generated via CLI)
- Auth0 Integration (generated via CLI)
- Supabase Integration (generated via CLI)
- NextAuth Integration (generated via CLI)

## API Reference

See the [API documentation](./API.md) for detailed API reference.

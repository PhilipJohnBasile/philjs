# Authentication

Implement secure authentication patterns in PhilJS applications.


## What You'll Learn

- Authentication strategies
- JWT authentication
- Session-based auth
- OAuth integration
- Protected routes
- Role-based access control
- Best practices

## Authentication Strategies

### JWT (JSON Web Tokens)

Stateless authentication using tokens.

```typescript
import { signal, effect } from '@philjs/core';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const authState = signal<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false
});

export function useAuth() {
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const { user, token } = await response.json();

      // Store token
      localStorage.setItem('token', token);

      // Update state
      authState.set({
        user,
        token,
        isAuthenticated: true
      });

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    authState.set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const { token: newToken, user } = await response.json();
        localStorage.setItem('token', newToken);
        authState.set({ user, token: newToken, isAuthenticated: true });
      } else {
        logout();
      }
    } catch (error) {
      logout();
    }
  };

  return {
    state: authState,
    login,
    logout,
    refreshToken
  };
}
```

### Session-Based Authentication

Server-side sessions with cookies.

```typescript
export function useAuth() {
  const authState = signal<AuthState>({
    user: null,
    isAuthenticated: false
  });

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const { user } = await response.json();

    authState.set({
      user,
      isAuthenticated: true
    });

    return user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    authState.set({
      user: null,
      isAuthenticated: false
    });
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });

      if (response.ok) {
        const { user } = await response.json();
        authState.set({ user, isAuthenticated: true });
      } else {
        authState.set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      authState.set({ user: null, isAuthenticated: false });
    }
  };

  // Check session on mount
  effect(() => {
    checkSession();
  });

  return {
    state: authState,
    login,
    logout,
    checkSession
  };
}
```

## OAuth Integration

### OAuth Flow

```typescript
interface OAuthProvider {
  name: string;
  authUrl: string;
  clientId: string;
}

const providers: Record<string, OAuthProvider> = {
  google: {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.VITE_GOOGLE_CLIENT_ID!
  },
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    clientId: process.env.VITE_GITHUB_CLIENT_ID!
  }
};

export function useOAuth() {
  const loginWithProvider = (providerName: keyof typeof providers) => {
    const provider = providers[providerName];
    const redirectUri = `${window.location.origin}/auth/callback`;

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile'
    });

    const authUrl = `${provider.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  };

  const handleCallback = async (code: string, provider: string) => {
    const response = await fetch('/api/auth/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, provider })
    });

    if (!response.ok) {
      throw new Error('OAuth authentication failed');
    }

    const { user, token } = await response.json();

    localStorage.setItem('token', token);
    authState.set({ user, token, isAuthenticated: true });

    return user;
  };

  return {
    loginWithProvider,
    handleCallback
  };
}

// Usage
function LoginButtons() {
  const { loginWithProvider } = useOAuth();

  return (
    <div>
      <button onClick={() => loginWithProvider('google')}>
        <img src="/icons/google.svg" /> Continue with Google
      </button>

      <button onClick={() => loginWithProvider('github')}>
        <img src="/icons/github.svg" /> Continue with GitHub
      </button>
    </div>
  );
}

// OAuth callback page
function OAuthCallback() {
  const { handleCallback } = useOAuth();
  const router = useRouter();

  effect(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const provider = params.get('state'); // Provider name passed as state

    if (code && provider) {
      try {
        await handleCallback(code, provider);
        router.push('/dashboard');
      } catch (error) {
        console.error('OAuth error:', error);
        router.push('/login?error=oauth_failed');
      }
    }
  });

  return <div>Authenticating...</div>;
}
```

## Protected Routes

### Route Guard Component

```typescript
import { useRouter } from '@philjs/router';
import { useAuth } from './auth';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const router = useRouter();

  effect(() => {
    // Not authenticated - redirect to login
    if (!state().isAuthenticated) {
      router.push(`${redirectTo}?redirect=${window.location.pathname}`);
      return;
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = state().user?.roles || [];
      const hasRequiredRole = requiredRoles.some(role =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
  });

  // Show loading while checking auth
  if (!state().isAuthenticated) {
    return <div>Loading...</div>;
  }

  return children;
}

// Usage
function App() {
  return (
    <Router>
      <Route path="/login" component={LoginPage} />

      <Route
        path="/dashboard"
        component={() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin"
        component={() => (
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        )}
      />
    </Router>
  );
}
```

### Higher-Order Component

```typescript
export function withAuth<P extends object>(
  Component: (props: P) => JSX.Element,
  options?: {
    requiredRoles?: string[];
    redirectTo?: string;
  }
) {
  return (props: P) => {
    const { state } = useAuth();
    const router = useRouter();

    if (!state().isAuthenticated) {
      router.push(options?.redirectTo || '/login');
      return <div>Redirecting...</div>;
    }

    if (options?.requiredRoles) {
      const userRoles = state().user?.roles || [];
      const hasRole = options.requiredRoles.some(role =>
        userRoles.includes(role)
      );

      if (!hasRole) {
        return <div>Unauthorized</div>;
      }
    }

    return <Component {...props} />;
  };
}

// Usage
const Dashboard = withAuth(DashboardComponent);

const AdminPanel = withAuth(AdminPanelComponent, {
  requiredRoles: ['admin']
});
```

## Role-Based Access Control

### Permission System

```typescript
type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'posts:read'
  | 'posts:write'
  | 'posts:delete'
  | 'admin:access';

interface Role {
  name: string;
  permissions: Permission[];
}

const roles: Record<string, Role> = {
  user: {
    name: 'User',
    permissions: ['posts:read']
  },
  editor: {
    name: 'Editor',
    permissions: ['posts:read', 'posts:write', 'users:read']
  },
  admin: {
    name: 'Admin',
    permissions: [
      'users:read',
      'users:write',
      'users:delete',
      'posts:read',
      'posts:write',
      'posts:delete',
      'admin:access'
    ]
  }
};

export function usePermissions() {
  const { state } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    const userRoles = state().user?.roles || [];

    return userRoles.some(roleName => {
      const role = roles[roleName];
      return role?.permissions.includes(permission);
    });
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}

// Usage
function UserManagement() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      <h1>Users</h1>

      {hasPermission('users:read') && (
        <UserList />
      )}

      {hasPermission('users:write') && (
        <button>Add User</button>
      )}

      {hasPermission('users:delete') && (
        <button>Delete User</button>
      )}
    </div>
  );
}
```

### Can Component

```typescript
interface CanProps {
  permission: Permission | Permission[];
  fallback?: JSX.Element;
  children: JSX.Element;
}

export function Can({ permission, fallback, children }: CanProps) {
  const { hasPermission, hasAllPermissions } = usePermissions();

  const allowed = Array.isArray(permission)
    ? hasAllPermissions(permission)
    : hasPermission(permission);

  if (!allowed) {
    return fallback || null;
  }

  return children;
}

// Usage
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Can permission="users:read">
        <UserStats />
      </Can>

      <Can
        permission={['posts:write', 'admin:access']}
        fallback={<div>Insufficient permissions</div>}
      >
        <AdminTools />
      </Can>
    </div>
  );
}
```

## Auto-Refresh Tokens

```typescript
export function useAuth() {
  const authState = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  // Auto-refresh token before expiry
  effect(() => {
    if (!authState().token) return;

    // Decode JWT to get expiry
    const token = authState().token!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const now = Date.now();

    // Refresh 5 minutes before expiry
    const refreshTime = expiryTime - now - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  });

  const refreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const { token: newToken, user } = await response.json();
        localStorage.setItem('token', newToken);
        authState.set({ user, token: newToken, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  return {
    state: authState,
    refreshToken
  };
}
```

## Secure API Requests

### Authenticated Fetch Wrapper

```typescript
export function useAuthenticatedFetch() {
  const { state, logout } = useAuth();

  const authFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = state().token;

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    return response;
  };

  return authFetch;
}

// Usage
function UserProfile() {
  const authFetch = useAuthenticatedFetch();
  const profile = signal(null);

  effect(async () => {
    try {
      const response = await authFetch('/api/user/profile');
      const data = await response.json();
      profile.set(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  });

  return <div>{/* render profile */}</div>;
}
```

## Best Practices

### Store Tokens Securely

```typescript
// ✅ Store in httpOnly cookie (server-side)
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// ⚠️ localStorage (less secure, XSS vulnerable)
localStorage.setItem('token', token);

// ❌ Never store in regular cookies (CSRF vulnerable)
document.cookie = `token=${token}`;
```

### Validate on Both Client and Server

```typescript
// ✅ Client-side check (UX)
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { state } = useAuth();

  if (!state().isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return children;
}

// ✅ Server-side check (security)
app.get('/api/protected', authenticateToken, (req, res) => {
  // Only accessible with valid token
  res.json({ data: 'protected data' });
});

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}
```

### Handle Token Expiry Gracefully

```typescript
export function useAuth() {
  const showLoginModal = signal(false);

  const handleExpiredToken = () => {
    showLoginModal.set(true);
    // Don't immediately redirect - let user save work
  };

  return {
    state: authState,
    showLoginModal,
    handleExpiredToken
  };
}

// Show modal instead of immediate redirect
function App() {
  const { showLoginModal } = useAuth();

  return (
    <>
      <Router />

      {showLoginModal() && (
        <Modal>
          <h2>Session Expired</h2>
          <p>Please log in again to continue.</p>
          <LoginForm />
        </Modal>
      )}
    </>
  );
}
```

### Implement CSRF Protection

```typescript
// Get CSRF token from cookie
function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

// Include in requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': getCsrfToken()
    },
    credentials: 'include'
  });
};
```

## Summary

You've learned:

✅ Authentication strategies (JWT, session-based, OAuth)
✅ Implementing login/logout flows
✅ OAuth integration with providers
✅ Protected routes and route guards
✅ Role-based access control (RBAC)
✅ Permission systems
✅ Auto-refreshing tokens
✅ Secure API requests
✅ Security best practices

Secure authentication protects your users and data!

---

**Next:** [State Management →](./state-management.md) Advanced state patterns



/**
 * Example: Custom Authentication Setup
 *
 * This example shows how to set up custom authentication with PhilJS
 */

import { signal, type Signal } from 'philjs-core/signals';
import { BaseAuthProvider, setAuthProvider } from 'philjs-auth';
import { startSessionRefresh } from 'philjs-auth/session-refresh';
import type { User, AuthSession } from 'philjs-auth';

/**
 * Custom auth configuration
 */
interface CustomAuthConfig {
  apiUrl: string;
  tokenKey: string;
  refreshTokenKey: string;
}

/**
 * Custom authentication provider implementation
 */
class CustomAuthProvider extends BaseAuthProvider {
  readonly name = 'custom';
  readonly user: Signal<User | null>;
  readonly session: Signal<AuthSession | null>;
  readonly loading: Signal<boolean>;

  private config: CustomAuthConfig;

  constructor(config: CustomAuthConfig) {
    super();
    this.config = config;
    this.user = signal<User | null>(null);
    this.session = signal<AuthSession | null>(null);
    this.loading = signal(true);
  }

  async initialize(): Promise<void> {
    try {
      // Try to load existing token
      const token = localStorage.getItem(this.config.tokenKey);

      if (token) {
        // Verify token and get user
        const response = await fetch(`${this.config.apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          this.user.set(user);

          const session: AuthSession = {
            user,
            token,
          };

          this.session.set(session);
        } else {
          // Token invalid, clear it
          localStorage.removeItem(this.config.tokenKey);
        }
      }

      this.loading.set(false);
    } catch (error) {
      this.loading.set(false);
      console.error('Failed to initialize auth:', error);
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    const response = await fetch(`${this.config.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem(this.config.tokenKey, data.token);
    if (data.refreshToken) {
      localStorage.setItem(this.config.refreshTokenKey, data.refreshToken);
    }

    // Update state
    this.user.set(data.user);

    const session: AuthSession = {
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    };

    this.session.set(session);

    return data.user;
  }

  async signUpWithEmail(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<User> {
    const response = await fetch(`${this.config.apiUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        ...metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();

    // Auto sign in after signup
    return await this.signInWithEmail(email, password);
  }

  async signOut(): Promise<void> {
    const token = localStorage.getItem(this.config.tokenKey);

    if (token) {
      // Call logout endpoint
      await fetch(`${this.config.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Clear local state
    localStorage.removeItem(this.config.tokenKey);
    localStorage.removeItem(this.config.refreshTokenKey);

    this.user.set(null);
    this.session.set(null);
  }

  async getToken(): Promise<string | null> {
    return localStorage.getItem(this.config.tokenKey);
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(this.config.refreshTokenKey);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.config.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update tokens
    localStorage.setItem(this.config.tokenKey, data.token);
    if (data.refreshToken) {
      localStorage.setItem(this.config.refreshTokenKey, data.refreshToken);
    }

    return data.token;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    const token = await this.getToken();

    const response = await fetch(`${this.config.apiUrl}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    const user = await response.json();
    this.user.set(user);

    return user;
  }

  async sendPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password: newPassword }),
    });

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }
  }
}

/**
 * Initialize custom authentication
 */
export async function initializeAuth() {
  // Create and configure the auth provider
  const authProvider = new CustomAuthProvider({
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
    onRefreshFailed: async (error) => {
      console.error('Token refresh failed:', error);
      // Optionally redirect to login
      await authProvider.signOut();
      window.location.href = '/login';
    },
  });

  return authProvider;
}

/**
 * Example: Using authentication in a component
 */
import { useAuth, useUser } from 'philjs-auth/hooks';

export function ExampleComponent() {
  const { signIn, signOut, isAuthenticated, isLoading } = useAuth();
  const user = useUser();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Login</h1>
        <button onClick={() => handleLogin('user@example.com', 'password')}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name || user?.email}!</h1>
      <button onClick={handleLogout}>Sign Out</button>
    </div>
  );
}

/**
 * Example: Protected route
 */
import { ProtectedRoute } from 'philjs-auth/protected-routes';

export function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Protected Content</h1>
        <p>Only authenticated users can see this.</p>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Example: Role-based access
 */
import { withRole } from 'philjs-auth/protected-routes';

function AdminPanelComponent() {
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Only admins can see this.</p>
    </div>
  );
}

export const AdminPanel = withRole(AdminPanelComponent, {
  role: 'admin',
  redirectTo: '/unauthorized',
});

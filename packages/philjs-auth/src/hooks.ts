/**
 * PhilJS Auth Hooks
 *
 * React-style hooks for authentication
 */

import { computed } from 'philjs-core/signals';
import type { AuthProvider } from './auth-provider.js';
import type { User, AuthSession } from './types.js';

/**
 * Global auth provider instance
 */
let globalAuthProvider: AuthProvider | null = null;

/**
 * Set the global auth provider
 */
export function setAuthProvider(provider: AuthProvider): void {
  globalAuthProvider = provider;
}

/**
 * Get the global auth provider
 */
export function getAuthProvider(): AuthProvider {
  if (!globalAuthProvider) {
    throw new Error(
      'Auth provider not initialized. Call setAuthProvider() or wrap your app with AuthProvider.'
    );
  }
  return globalAuthProvider;
}

/**
 * Hook to access current user
 *
 * @returns Current authenticated user or null
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const user = useUser();
 *
 *   if (!user) {
 *     return <div>Not logged in</div>;
 *   }
 *
 *   return <div>Hello, {user.name}!</div>;
 * }
 * ```
 */
export function useUser(): User | null {
  const provider = getAuthProvider();
  return provider.user();
}

/**
 * Hook to access current session
 *
 * @returns Current session or null
 */
export function useSession(): AuthSession | null {
  const provider = getAuthProvider();
  return provider.session();
}

/**
 * Hook to check if user is authenticated
 *
 * @returns True if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const user = useUser();
  return !!user;
}

/**
 * Hook to check if auth is loading
 *
 * @returns True if authentication state is loading
 */
export function useAuthLoading(): boolean {
  const provider = getAuthProvider();
  return provider.loading();
}

/**
 * Hook to access authentication functions
 *
 * @returns Auth methods and state
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { signIn, isLoading } = useAuth();
 *
 *   const handleSubmit = async (email: string, password: string) => {
 *     try {
 *       await signIn(email, password);
 *       // Redirect to dashboard
 *     } catch (error) {
 *       // Handle error
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useAuth() {
  const provider = getAuthProvider();
  const user = useUser();
  const session = useSession();
  const isLoading = useAuthLoading();
  const isAuthenticated = computed(() => !!user);

  return {
    // State
    user,
    session,
    isAuthenticated: isAuthenticated(),
    isLoading,
    provider,

    // Methods
    signIn: async (email: string, password: string) => {
      return provider.signInWithEmail(email, password);
    },

    signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
      return provider.signUpWithEmail(email, password, metadata);
    },

    signInWithOAuth: async (oauthProvider: string) => {
      if (!provider.signInWithOAuth) {
        throw new Error('OAuth not supported by this provider');
      }
      return provider.signInWithOAuth(oauthProvider);
    },

    signOut: async () => {
      return provider.signOut();
    },

    getToken: async () => {
      return provider.getToken();
    },

    refreshToken: async () => {
      if (!provider.refreshToken) {
        throw new Error('Token refresh not supported by this provider');
      }
      return provider.refreshToken();
    },

    updateUser: async (updates: Partial<User>) => {
      if (!provider.updateUser) {
        throw new Error('User update not supported by this provider');
      }
      return provider.updateUser(updates);
    },

    sendPasswordReset: async (email: string) => {
      if (!provider.sendPasswordReset) {
        throw new Error('Password reset not supported by this provider');
      }
      return provider.sendPasswordReset(email);
    },

    resetPassword: async (token: string, newPassword: string) => {
      if (!provider.resetPassword) {
        throw new Error('Password reset not supported by this provider');
      }
      return provider.resetPassword(token, newPassword);
    },

    verifyEmail: async (token: string) => {
      if (!provider.verifyEmail) {
        throw new Error('Email verification not supported by this provider');
      }
      return provider.verifyEmail(token);
    },
  };
}

/**
 * Hook to check if user has specific permission/role
 *
 * @param permission - Permission or role to check
 * @returns True if user has the permission
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasPermission('admin');
 *
 *   if (!isAdmin) {
 *     return <div>Access denied</div>;
 *   }
 *
 *   return <div>Admin panel content</div>;
 * }
 * ```
 */
export function useHasPermission(permission: string): boolean {
  const user = useUser();

  if (!user) return false;

  // Check in metadata
  const role = user.metadata?.['role'];
  const permissions = user.metadata?.['permissions'] as string[] | undefined;

  return role === permission || permissions?.includes(permission) || false;
}

/**
 * Hook to require authentication - redirects if not authenticated
 *
 * @param redirectTo - URL to redirect to if not authenticated
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   useRequireAuth('/login');
 *
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo: string = '/login'): void {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    if (typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `${redirectTo}?returnUrl=${returnUrl}`;
    }
  }
}

/**
 * Hook to get access token with automatic refresh
 *
 * @returns Access token or null
 */
export function useAccessToken(): string | null {
  const session = useSession();
  return session?.token || null;
}

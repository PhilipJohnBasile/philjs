/**
 * PhilJS Auth Hooks
 *
 * React-style hooks for authentication
 */
import type { AuthProvider } from './auth-provider.js';
import type { User, AuthSession } from './types.js';
/**
 * Set the global auth provider
 */
export declare function setAuthProvider(provider: AuthProvider): void;
/**
 * Get the global auth provider
 */
export declare function getAuthProvider(): AuthProvider;
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
export declare function useUser(): User | null;
/**
 * Hook to access current session
 *
 * @returns Current session or null
 */
export declare function useSession(): AuthSession | null;
/**
 * Hook to check if user is authenticated
 *
 * @returns True if user is authenticated
 */
export declare function useIsAuthenticated(): boolean;
/**
 * Hook to check if auth is loading
 *
 * @returns True if authentication state is loading
 */
export declare function useAuthLoading(): boolean;
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
export declare function useAuth(): {
    readonly user: User | null;
    readonly session: AuthSession | null;
    readonly isAuthenticated: boolean;
    readonly isLoading: boolean;
    provider: AuthProvider;
    signIn: (email: string, password: string) => Promise<User>;
    signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<User>;
    signInWithOAuth: (oauthProvider: string) => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
    refreshToken: () => Promise<string>;
    updateUser: (updates: Partial<User>) => Promise<User>;
    sendPasswordReset: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    verifyEmail: (token: string) => Promise<void>;
};
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
export declare function useHasPermission(permission: string): boolean;
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
export declare function useRequireAuth(redirectTo?: string): void;
/**
 * Hook to get access token with automatic refresh
 *
 * @returns Access token or null
 */
export declare function useAccessToken(): string | null;
//# sourceMappingURL=hooks.d.ts.map
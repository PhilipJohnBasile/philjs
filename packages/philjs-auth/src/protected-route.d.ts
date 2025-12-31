/**
 * Protected route component for authentication-required pages
 */
import type { ProtectedRouteConfig } from './types.js';
/**
 * Protected route component that requires authentication
 */
export declare function ProtectedRoute(props: {
    children: any;
    fallback?: any;
    redirectTo?: string | undefined;
    checkAuth?: (() => boolean | Promise<boolean>) | undefined;
    onUnauthorized?: (() => void) | undefined;
}): any;
/**
 * Higher-order function to protect a route component
 */
export declare function withAuth<T extends Record<string, any>>(Component: (props: T) => any, config?: ProtectedRouteConfig): (props: T) => any;
/**
 * Check if user is authenticated (for programmatic checks)
 */
export declare function requireAuth(config?: ProtectedRouteConfig): boolean;
/**
 * Hook-like function to get auth status reactively
 */
export declare function useAuth(): {
    user: any;
    isAuthenticated: any;
    token: any;
    session: Signal<import("./types.js").AuthSession>;
    login: (user: any, token?: string, expiresIn?: number) => void;
    logout: () => void;
    updateUser: (updates: any) => void;
    refreshSession: (expiresIn?: number) => void;
};
/**
 * Redirect to login with return URL
 */
export declare function redirectToLogin(loginPath?: string, returnTo?: string): void;
/**
 * Get redirect URL from query params
 */
export declare function getRedirectUrl(fallback?: string): string;
/**
 * Perform redirect after successful login
 */
export declare function redirectAfterLogin(fallback?: string): void;
//# sourceMappingURL=protected-route.d.ts.map
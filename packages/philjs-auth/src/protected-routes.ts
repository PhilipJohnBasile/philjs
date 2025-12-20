/**
 * Protected Routes - Enhanced utilities for protecting routes
 *
 * Builds on the existing protected-route.ts with more features
 */

import { useAuth, useHasPermission } from './hooks.js';

export type { ProtectedRouteConfig } from './types.js';
export { ProtectedRoute, withAuth, requireAuth, redirectToLogin } from './protected-route.js';

/**
 * Higher-order component to protect routes with role-based access
 *
 * @param Component - Component to protect
 * @param options - Protection options
 * @returns Protected component
 *
 * @example
 * ```tsx
 * const AdminPage = withRole(AdminPageComponent, {
 *   role: 'admin',
 *   redirectTo: '/unauthorized',
 * });
 * ```
 */
export function withRole<P extends object>(
  Component: (props: P) => JSX.Element,
  options: {
    role: string;
    redirectTo?: string;
    fallback?: JSX.Element;
  }
) {
  return function RoleProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const hasRole = useHasPermission(options.role);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    if (!hasRole) {
      if (options.fallback) {
        return options.fallback;
      }

      if (options.redirectTo) {
        if (typeof window !== 'undefined') {
          window.location.href = options.redirectTo;
        }
        return null;
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You don't have the required permissions to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Higher-order component to protect routes with multiple roles (OR logic)
 */
export function withAnyRole<P extends object>(
  Component: (props: P) => JSX.Element,
  options: {
    roles: string[];
    redirectTo?: string;
    fallback?: JSX.Element;
  }
) {
  return function AnyRoleProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const hasAnyRole = options.roles.some((role) => useHasPermission(role));

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated || !hasAnyRole) {
      if (options.fallback) {
        return options.fallback;
      }

      if (options.redirectTo) {
        if (typeof window !== 'undefined') {
          window.location.href = options.redirectTo;
        }
        return null;
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You don't have the required permissions to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Component to conditionally render based on authentication
 */
export interface AuthGuardProps {
  children: JSX.Element;
  fallback?: JSX.Element;
  requireAuth?: boolean;
  requireUnauth?: boolean;
  loading?: JSX.Element;
  role?: string;
  roles?: string[];
}

export function AuthGuard({
  children,
  fallback = null,
  requireAuth = true,
  requireUnauth = false,
  loading,
  role,
  roles,
}: AuthGuardProps): JSX.Element | null {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      loading || (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  if (requireUnauth && isAuthenticated) {
    return fallback;
  }

  // Check role requirement
  if (role && !useHasPermission(role)) {
    return fallback;
  }

  // Check any of multiple roles
  if (roles && !roles.some((r) => useHasPermission(r))) {
    return fallback;
  }

  return children;
}

/**
 * Show content only for authenticated users
 */
export interface ShowForAuthProps {
  children: JSX.Element;
  fallback?: JSX.Element;
}

export function ShowForAuth({ children, fallback = null }: ShowForAuthProps): JSX.Element | null {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Show content only for unauthenticated users
 */
export function ShowForGuest({ children, fallback = null }: ShowForAuthProps): JSX.Element | null {
  return (
    <AuthGuard requireAuth={false} requireUnauth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

/**
 * Show content only for users with specific role
 */
export interface ShowForRoleProps {
  children: JSX.Element;
  role: string;
  fallback?: JSX.Element;
}

export function ShowForRole({ children, role, fallback = null }: ShowForRoleProps): JSX.Element | null {
  return (
    <AuthGuard role={role} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

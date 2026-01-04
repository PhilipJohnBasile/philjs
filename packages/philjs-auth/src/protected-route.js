/**
 * Protected route component for authentication-required pages
 */
import { effect } from '@philjs/core/signals';
import { getDefaultSessionManager } from './session.js';
/**
 * Protected route component that requires authentication
 */
export function ProtectedRoute(props) {
    const sessionManager = getDefaultSessionManager();
    const isAuth = sessionManager.isAuthenticated();
    // Handle custom auth check
    if (props.checkAuth) {
        const customCheck = props.checkAuth();
        if (customCheck instanceof Promise) {
            customCheck.then(result => {
                if (!result)
                    handleUnauthorized();
            });
        }
        else if (!customCheck) {
            handleUnauthorized();
            return props.fallback || null;
        }
    }
    function handleUnauthorized() {
        if (props.onUnauthorized) {
            props.onUnauthorized();
        }
        else if (props.redirectTo) {
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                window.location.href = `${props.redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
            }
        }
    }
    if (!isAuth) {
        handleUnauthorized();
        return props.fallback || null;
    }
    return props.children;
}
/**
 * Higher-order function to protect a route component
 */
export function withAuth(Component, config) {
    return (props) => {
        return ProtectedRoute({
            children: Component(props),
            ...config
        });
    };
}
/**
 * Check if user is authenticated (for programmatic checks)
 */
export function requireAuth(config) {
    const sessionManager = getDefaultSessionManager();
    if (config?.checkAuth) {
        const result = config.checkAuth();
        if (result instanceof Promise) {
            result.then(isAuth => {
                if (!isAuth)
                    handleUnauthorized(config);
            });
            return true; // Optimistically return true for async checks
        }
        if (!result) {
            handleUnauthorized(config);
            return false;
        }
    }
    const isAuth = sessionManager.isAuthenticated();
    if (!isAuth) {
        handleUnauthorized(config);
    }
    return isAuth;
}
function handleUnauthorized(config) {
    if (config?.onUnauthorized) {
        config.onUnauthorized();
    }
    else if (config?.redirectTo && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        window.location.href = `${config.redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
    }
}
/**
 * Hook-like function to get auth status reactively
 */
export function useAuth() {
    const sessionManager = getDefaultSessionManager();
    return {
        user: sessionManager.user,
        isAuthenticated: sessionManager.isAuthenticated,
        token: sessionManager.token,
        session: sessionManager.session,
        login: (user, token, expiresIn) => sessionManager.setSession(user, token, expiresIn),
        logout: () => sessionManager.clearSession(),
        updateUser: (updates) => sessionManager.updateUser(updates),
        refreshSession: (expiresIn) => sessionManager.refreshSession(expiresIn)
    };
}
/**
 * Redirect to login with return URL
 */
export function redirectToLogin(loginPath = '/login', returnTo) {
    if (typeof window === 'undefined')
        return;
    const currentPath = returnTo || window.location.pathname + window.location.search;
    const url = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = url;
}
/**
 * Get redirect URL from query params
 */
export function getRedirectUrl(fallback = '/') {
    if (typeof window === 'undefined')
        return fallback;
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    return redirect || fallback;
}
/**
 * Perform redirect after successful login
 */
export function redirectAfterLogin(fallback = '/') {
    if (typeof window === 'undefined')
        return;
    const url = getRedirectUrl(fallback);
    window.location.href = url;
}
//# sourceMappingURL=protected-route.js.map
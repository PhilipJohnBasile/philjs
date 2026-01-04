/**
 * Router Navigation Guards
 *
 * Vue Router-inspired navigation guards:
 * - Before/After navigation hooks
 * - Route-level guards
 * - Global guards
 * - Per-route guards
 * - Async guards with redirects
 */
let beforeGuards = [];
let afterHooks = [];
let routeGuards = new Map();
let isNavigating = false;
let currentNavigation = null;
/**
 * Register a global before navigation guard
 */
export function beforeEach(guard, config = {}) {
    const id = generateId();
    beforeGuards.push({ guard, config, id });
    // Sort by priority
    beforeGuards.sort((a, b) => (b.config.priority ?? 0) - (a.config.priority ?? 0));
    return () => {
        beforeGuards = beforeGuards.filter(g => g.id !== id);
    };
}
/**
 * Register a global after navigation hook
 */
export function afterEach(hook) {
    const id = generateId();
    afterHooks.push({ hook, id });
    return () => {
        afterHooks = afterHooks.filter(h => h.id !== id);
    };
}
/**
 * Register a guard for specific routes
 */
export function beforeRoute(routes, guard) {
    const routeList = Array.isArray(routes) ? routes : [routes];
    for (const route of routeList) {
        const existing = routeGuards.get(route) || [];
        existing.push(guard);
        routeGuards.set(route, existing);
    }
    return () => {
        for (const route of routeList) {
            const guards = routeGuards.get(route);
            if (guards) {
                const index = guards.indexOf(guard);
                if (index !== -1) {
                    guards.splice(index, 1);
                }
                if (guards.length === 0) {
                    routeGuards.delete(route);
                }
            }
        }
    };
}
/**
 * Execute all navigation guards
 */
export async function runNavigationGuards(to, from) {
    if (isNavigating) {
        return { error: new Error('Navigation cancelled: another navigation in progress') };
    }
    isNavigating = true;
    currentNavigation = { to, from };
    try {
        // Run global before guards
        for (const { guard, config } of beforeGuards) {
            // Check route restrictions
            if (config.routes && !config.routes.some(r => matchesRoute(to.path, r))) {
                continue;
            }
            if (config.excludeRoutes && config.excludeRoutes.some(r => matchesRoute(to.path, r))) {
                continue;
            }
            const context = createGuardContext(to);
            const result = await guard(to, from, context);
            if (context.isAborted) {
                return false;
            }
            if (context.redirectTo) {
                return { redirect: context.redirectTo };
            }
            if (result === false) {
                return false;
            }
            if (typeof result === 'string') {
                return { redirect: result };
            }
            if (result && typeof result === 'object') {
                if ('redirect' in result) {
                    return result;
                }
                if ('error' in result) {
                    return result;
                }
                // RouteLocation redirect
                if ('path' in result) {
                    return { redirect: result };
                }
            }
        }
        // Run route-specific guards
        const guards = routeGuards.get(to.path) || [];
        for (const guard of guards) {
            const context = createGuardContext(to);
            const result = await guard(to, from, context);
            if (context.isAborted || result === false) {
                return false;
            }
            if (context.redirectTo) {
                return { redirect: context.redirectTo };
            }
            if (typeof result === 'string' || (result && typeof result === 'object' && 'redirect' in result)) {
                return typeof result === 'string' ? { redirect: result } : result;
            }
        }
        return true;
    }
    finally {
        isNavigating = false;
        currentNavigation = null;
    }
}
/**
 * Run after navigation hooks
 */
export async function runAfterHooks(to, from, failure) {
    for (const { hook } of afterHooks) {
        try {
            await hook(to, from, failure);
        }
        catch (error) {
            console.error('After navigation hook error:', error);
        }
    }
}
// =============================================================================
// Built-in Guards
// =============================================================================
/**
 * Create an authentication guard
 */
export function createAuthGuard(options) {
    const { isAuthenticated, loginPath = '/login', returnTo = true } = options;
    return async (to, from, context) => {
        if (!to.meta.requiresAuth) {
            return;
        }
        const authenticated = await isAuthenticated();
        if (!authenticated) {
            const redirect = returnTo
                ? `${loginPath}?returnTo=${encodeURIComponent(to.fullPath)}`
                : loginPath;
            context.redirect(redirect);
        }
    };
}
/**
 * Create a role-based access guard
 */
export function createRoleGuard(options) {
    const { getUserRoles, forbiddenPath = '/forbidden', matchMode = 'any' } = options;
    return async (to, from, context) => {
        const requiredRoles = to.meta.roles;
        if (!requiredRoles || requiredRoles.length === 0) {
            return;
        }
        const userRoles = await getUserRoles();
        const hasAccess = matchMode === 'any'
            ? requiredRoles.some(role => userRoles.includes(role))
            : requiredRoles.every(role => userRoles.includes(role));
        if (!hasAccess) {
            context.redirect(forbiddenPath);
        }
    };
}
/**
 * Create a permission-based access guard
 */
export function createPermissionGuard(options) {
    const { getUserPermissions, forbiddenPath = '/forbidden' } = options;
    return async (to, from, context) => {
        const requiredPermissions = to.meta.permissions;
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return;
        }
        const userPermissions = await getUserPermissions();
        const hasAllPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));
        if (!hasAllPermissions) {
            context.redirect(forbiddenPath);
        }
    };
}
/**
 * Create a loading indicator guard
 */
export function createLoadingGuard(options) {
    const { onStart, onEnd, delay = 100 } = options;
    let loadingTimeout = null;
    return {
        before: () => {
            if (delay > 0) {
                loadingTimeout = setTimeout(onStart, delay);
            }
            else {
                onStart();
            }
        },
        after: () => {
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
            onEnd();
        },
    };
}
/**
 * Create a scroll position guard
 */
export function createScrollGuard(options) {
    const { behavior = 'smooth', delay = 0, savedPositions = new Map() } = options || {};
    return {
        before: (to, from) => {
            if (from) {
                savedPositions.set(from.fullPath, {
                    x: window.scrollX,
                    y: window.scrollY,
                });
            }
        },
        after: (to) => {
            setTimeout(() => {
                if (to.hash) {
                    const element = document.querySelector(to.hash);
                    if (element) {
                        element.scrollIntoView({ behavior });
                        return;
                    }
                }
                const savedPosition = savedPositions.get(to.fullPath);
                if (savedPosition) {
                    window.scrollTo({
                        left: savedPosition.x,
                        top: savedPosition.y,
                        behavior,
                    });
                    savedPositions.delete(to.fullPath);
                }
                else {
                    window.scrollTo({ top: 0, behavior });
                }
            }, delay);
        },
    };
}
/**
 * Create a page title guard
 */
export function createTitleGuard(options) {
    const { prefix = '', suffix = '', separator = ' | ', defaultTitle = 'App', } = options || {};
    return (to) => {
        const pageTitle = to.meta.title || defaultTitle;
        const parts = [prefix, pageTitle, suffix].filter(Boolean);
        document.title = parts.join(separator);
    };
}
/**
 * Create an analytics guard
 */
export function createAnalyticsGuard(options) {
    return (to) => {
        options.trackPageView(to.fullPath, to.meta.title);
    };
}
/**
 * Create a confirm navigation guard (for unsaved changes)
 */
export function createConfirmGuard(options) {
    const { shouldConfirm, getMessage = () => 'You have unsaved changes. Are you sure you want to leave?', onConfirm, } = options;
    return async (to, from, context) => {
        if (!shouldConfirm()) {
            return;
        }
        if (onConfirm) {
            const confirmed = await onConfirm();
            if (!confirmed) {
                context.abort();
            }
        }
        else if (typeof window !== 'undefined') {
            const confirmed = window.confirm(getMessage());
            if (!confirmed) {
                context.abort();
            }
        }
    };
}
/**
 * Create a rate limit guard
 */
export function createRateLimitGuard(options) {
    const { maxNavigations, windowMs, onExceeded } = options;
    const navigations = [];
    return (to, from, context) => {
        const now = Date.now();
        const windowStart = now - windowMs;
        // Remove old navigations
        while (navigations.length > 0 && navigations[0] !== undefined && navigations[0] < windowStart) {
            navigations.shift();
        }
        if (navigations.length >= maxNavigations) {
            onExceeded?.();
            context.abort();
            return;
        }
        navigations.push(now);
    };
}
// =============================================================================
// Utility Functions
// =============================================================================
function createGuardContext(to) {
    let aborted = false;
    let redirect = null;
    const context = {
        abort: () => {
            aborted = true;
        },
        redirect: (location) => {
            redirect = location;
        },
        next: () => { },
        meta: to.meta,
        params: to.params,
        query: to.query,
        get isAborted() { return aborted; },
        get redirectTo() { return redirect; },
    };
    return context;
}
function matchesRoute(path, pattern) {
    if (pattern.endsWith('*')) {
        return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
}
function generateId() {
    return Math.random().toString(36).slice(2, 11);
}
/**
 * Parse URL to RouteLocation
 */
export function parseLocation(url) {
    const urlObj = new URL(url, 'http://localhost');
    const query = {};
    urlObj.searchParams.forEach((value, key) => {
        const existing = query[key];
        if (existing) {
            query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        }
        else {
            query[key] = value;
        }
    });
    return {
        path: urlObj.pathname,
        fullPath: url,
        query,
        params: {},
        hash: urlObj.hash,
        meta: {},
        matched: [],
    };
}
/**
 * Create RouteLocation from path
 */
export function createLocation(path, params = {}, query = {}, meta = {}) {
    const queryString = Object.entries(query)
        .map(([key, value]) => {
        if (Array.isArray(value)) {
            return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
        }
        return `${key}=${encodeURIComponent(value)}`;
    })
        .join('&');
    const fullPath = queryString ? `${path}?${queryString}` : path;
    return {
        path,
        fullPath,
        query,
        params,
        hash: '',
        meta,
        matched: [],
    };
}
/**
 * Check if navigation was cancelled
 */
export function isNavigationCancelled() {
    return !isNavigating && currentNavigation === null;
}
/**
 * Get current navigation status
 */
export function getNavigationStatus() {
    return {
        isNavigating,
        to: currentNavigation?.to ?? null,
        from: currentNavigation?.from ?? null,
    };
}
/**
 * Clear all registered guards
 */
export function clearAllGuards() {
    beforeGuards = [];
    afterHooks = [];
    routeGuards.clear();
}
/**
 * Get registered guards count
 */
export function getGuardsCount() {
    let routeCount = 0;
    routeGuards.forEach(guards => {
        routeCount += guards.length;
    });
    return {
        before: beforeGuards.length,
        after: afterHooks.length,
        route: routeCount,
    };
}
//# sourceMappingURL=guards.js.map
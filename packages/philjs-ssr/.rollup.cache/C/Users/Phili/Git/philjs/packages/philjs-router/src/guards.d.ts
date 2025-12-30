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
export interface RouteLocation {
    path: string;
    fullPath: string;
    query: Record<string, string | string[]>;
    params: Record<string, string>;
    hash: string;
    meta: RouteMeta;
    name?: string;
    matched: RouteMatch[];
}
export interface RouteMatch {
    path: string;
    name?: string;
    meta: RouteMeta;
    params: Record<string, string>;
}
export interface RouteMeta {
    [key: string]: unknown;
    requiresAuth?: boolean;
    roles?: string[];
    permissions?: string[];
    title?: string;
    layout?: string;
    transition?: string;
    cache?: boolean | number;
}
export type NavigationGuardReturn = boolean | string | RouteLocation | undefined | void | {
    redirect: string | RouteLocation;
} | {
    error: Error;
};
export type NavigationGuard = (to: RouteLocation, from: RouteLocation | null, context: GuardContext) => NavigationGuardReturn | Promise<NavigationGuardReturn>;
export type AfterNavigationHook = (to: RouteLocation, from: RouteLocation | null, failure?: NavigationFailure) => void | Promise<void>;
export interface GuardContext {
    abort: () => void;
    redirect: (location: string | RouteLocation) => void;
    next: () => void;
    meta: RouteMeta;
    params: Record<string, string>;
    query: Record<string, string | string[]>;
}
export interface NavigationFailure {
    type: NavigationFailureType;
    from: RouteLocation | null;
    to: RouteLocation;
    message?: string;
}
export type NavigationFailureType = 'aborted' | 'cancelled' | 'duplicated' | 'redirected' | 'error';
export interface GuardConfig {
    priority?: number;
    name?: string;
    routes?: string[];
    excludeRoutes?: string[];
}
/**
 * Register a global before navigation guard
 */
export declare function beforeEach(guard: NavigationGuard, config?: GuardConfig): () => void;
/**
 * Register a global after navigation hook
 */
export declare function afterEach(hook: AfterNavigationHook): () => void;
/**
 * Register a guard for specific routes
 */
export declare function beforeRoute(routes: string | string[], guard: NavigationGuard): () => void;
/**
 * Execute all navigation guards
 */
export declare function runNavigationGuards(to: RouteLocation, from: RouteLocation | null): Promise<NavigationGuardReturn>;
/**
 * Run after navigation hooks
 */
export declare function runAfterHooks(to: RouteLocation, from: RouteLocation | null, failure?: NavigationFailure): Promise<void>;
/**
 * Create an authentication guard
 */
export declare function createAuthGuard(options: {
    isAuthenticated: () => boolean | Promise<boolean>;
    loginPath?: string;
    returnTo?: boolean;
}): NavigationGuard;
/**
 * Create a role-based access guard
 */
export declare function createRoleGuard(options: {
    getUserRoles: () => string[] | Promise<string[]>;
    forbiddenPath?: string;
    matchMode?: 'any' | 'all';
}): NavigationGuard;
/**
 * Create a permission-based access guard
 */
export declare function createPermissionGuard(options: {
    getUserPermissions: () => string[] | Promise<string[]>;
    forbiddenPath?: string;
}): NavigationGuard;
/**
 * Create a loading indicator guard
 */
export declare function createLoadingGuard(options: {
    onStart: () => void;
    onEnd: () => void;
    delay?: number;
}): {
    before: NavigationGuard;
    after: AfterNavigationHook;
};
/**
 * Create a scroll position guard
 */
export declare function createScrollGuard(options?: {
    behavior?: ScrollBehavior;
    delay?: number;
    savedPositions?: Map<string, {
        x: number;
        y: number;
    }>;
}): {
    before: NavigationGuard;
    after: AfterNavigationHook;
};
/**
 * Create a page title guard
 */
export declare function createTitleGuard(options?: {
    prefix?: string;
    suffix?: string;
    separator?: string;
    defaultTitle?: string;
}): AfterNavigationHook;
/**
 * Create an analytics guard
 */
export declare function createAnalyticsGuard(options: {
    trackPageView: (path: string, title?: string) => void;
}): AfterNavigationHook;
/**
 * Create a confirm navigation guard (for unsaved changes)
 */
export declare function createConfirmGuard(options: {
    shouldConfirm: () => boolean;
    getMessage?: () => string;
    onConfirm?: () => boolean | Promise<boolean>;
}): NavigationGuard;
/**
 * Create a rate limit guard
 */
export declare function createRateLimitGuard(options: {
    maxNavigations: number;
    windowMs: number;
    onExceeded?: () => void;
}): NavigationGuard;
/**
 * Parse URL to RouteLocation
 */
export declare function parseLocation(url: string): RouteLocation;
/**
 * Create RouteLocation from path
 */
export declare function createLocation(path: string, params?: Record<string, string>, query?: Record<string, string | string[]>, meta?: RouteMeta): RouteLocation;
/**
 * Check if navigation was cancelled
 */
export declare function isNavigationCancelled(): boolean;
/**
 * Get current navigation status
 */
export declare function getNavigationStatus(): {
    isNavigating: boolean;
    to: RouteLocation | null;
    from: RouteLocation | null;
};
/**
 * Clear all registered guards
 */
export declare function clearAllGuards(): void;
/**
 * Get registered guards count
 */
export declare function getGuardsCount(): {
    before: number;
    after: number;
    route: number;
};
//# sourceMappingURL=guards.d.ts.map
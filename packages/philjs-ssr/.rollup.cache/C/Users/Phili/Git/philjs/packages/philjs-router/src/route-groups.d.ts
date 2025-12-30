/**
 * SolidStart-style Route Groups for PhilJS Router.
 * Allows organizing routes without affecting the URL structure.
 *
 * @example
 * ```
 * routes/
 *   (marketing)/
 *     about.tsx      -> /about
 *     contact.tsx    -> /contact
 *     layout.tsx     -> shared layout for marketing pages
 *   (dashboard)/
 *     settings.tsx   -> /settings
 *     profile.tsx    -> /profile
 *     layout.tsx     -> shared layout for dashboard pages
 * ```
 */
import type { RouteComponent } from "./nested.js";
import type { LoaderFunction } from "./loader.js";
import type { ActionFunction } from "./action.js";
/**
 * Route group definition.
 */
export type RouteGroup = {
    /** Group name (from folder name without the URL path) */
    name: string;
    /** Shared layout component for all routes in this group */
    layout?: RouteComponent;
    /** Shared loader for the group */
    loader?: LoaderFunction;
    /** Shared action for the group */
    action?: ActionFunction;
    /** Middleware functions for the group */
    middleware?: RouteGroupMiddleware[];
    /** Child routes in this group */
    routes: GroupRoute[];
    /** Metadata for the group */
    meta?: RouteGroupMeta;
    /** Error boundary for the group */
    errorBoundary?: RouteComponent;
    /** Whether this group should be lazy loaded */
    lazy?: boolean;
};
/**
 * Route within a group.
 */
export type GroupRoute = {
    /** Route path (will not include group prefix) */
    path: string;
    /** Route component */
    component: RouteComponent;
    /** Route-specific loader */
    loader?: LoaderFunction;
    /** Route-specific action */
    action?: ActionFunction;
    /** Child routes */
    children?: GroupRoute[];
    /** Route ID */
    id?: string;
    /** Route metadata */
    meta?: Record<string, unknown>;
};
/**
 * Middleware function for route groups.
 */
export type RouteGroupMiddleware = (context: MiddlewareContext) => Promise<MiddlewareResult> | MiddlewareResult;
/**
 * Context passed to middleware.
 */
export type MiddlewareContext = {
    /** Current URL */
    url: URL;
    /** Route parameters */
    params: Record<string, string>;
    /** Request object */
    request: Request;
    /** Route group name */
    groupName: string;
    /** Route path within the group */
    routePath: string;
};
/**
 * Result from middleware execution.
 */
export type MiddlewareResult = {
    /** Whether to allow the navigation */
    allow: boolean;
    /** Redirect to a different URL */
    redirect?: string;
    /** Additional data to pass to the route */
    data?: Record<string, unknown>;
    /** Modify the request */
    modifiedRequest?: Request;
};
/**
 * Metadata for route groups.
 */
export type RouteGroupMeta = {
    /** Display name for the group */
    displayName?: string;
    /** Description of the group's purpose */
    description?: string;
    /** Whether this group requires authentication */
    requiresAuth?: boolean;
    /** Required permissions */
    permissions?: string[];
    /** Custom metadata */
    [key: string]: unknown;
};
/**
 * Configuration for route group processing.
 */
export type RouteGroupConfig = {
    /** Pattern to identify route groups (default: /^\(.*\)$/) */
    groupPattern?: RegExp;
    /** Whether to automatically discover groups from file structure */
    autoDiscover?: boolean;
    /** Base directory for route discovery */
    baseDir?: string;
};
/**
 * Processed route with group information.
 */
export type ProcessedGroupRoute = {
    /** Final route path (without group prefix) */
    path: string;
    /** Route component with group layout applied */
    component: RouteComponent;
    /** Combined loader (group + route) */
    loader?: LoaderFunction;
    /** Combined action (group + route) */
    action?: ActionFunction;
    /** Group this route belongs to */
    group: string;
    /** Applied middleware */
    middleware: RouteGroupMiddleware[];
    /** Route ID */
    id: string;
    /** Error boundary */
    errorBoundary?: RouteComponent;
};
/**
 * Parse a route path to extract group information.
 */
export declare function parseRouteGroup(path: string, config?: RouteGroupConfig): {
    group: string | null;
    cleanPath: string;
};
/**
 * Create a route group.
 */
export declare function createRouteGroup(name: string, options?: {
    layout?: RouteComponent;
    loader?: LoaderFunction;
    action?: ActionFunction;
    middleware?: RouteGroupMiddleware[];
    routes?: GroupRoute[];
    meta?: RouteGroupMeta;
    errorBoundary?: RouteComponent;
    lazy?: boolean;
}): RouteGroup;
/**
 * Add a route to a group.
 */
export declare function addRouteToGroup(group: RouteGroup, route: GroupRoute): RouteGroup;
/**
 * Process route groups into flat route definitions.
 */
export declare function processRouteGroups(groups: RouteGroup[]): ProcessedGroupRoute[];
/**
 * Execute group middleware for a route.
 */
export declare function executeGroupMiddleware(middleware: RouteGroupMiddleware[], context: MiddlewareContext): Promise<MiddlewareResult>;
/**
 * Create authentication middleware.
 */
export declare function createAuthMiddleware(checkAuth: (request: Request) => Promise<boolean> | boolean, redirectTo?: string): RouteGroupMiddleware;
/**
 * Create permission-based middleware.
 */
export declare function createPermissionMiddleware(requiredPermissions: string[], getPermissions: (request: Request) => Promise<string[]> | string[], redirectTo?: string): RouteGroupMiddleware;
/**
 * Create logging middleware.
 */
export declare function createLoggingMiddleware(logger?: (context: MiddlewareContext) => void): RouteGroupMiddleware;
/**
 * Create rate limiting middleware.
 */
export declare function createRateLimitMiddleware(options: {
    maxRequests: number;
    windowMs: number;
    keyFn?: (context: MiddlewareContext) => string;
}): RouteGroupMiddleware;
/**
 * Create header injection middleware.
 */
export declare function createHeaderMiddleware(headers: Record<string, string>): RouteGroupMiddleware;
/**
 * Discover route groups from a file structure.
 * This would typically be used with a bundler plugin.
 */
export declare function discoverRouteGroups(files: Record<string, any>, config?: RouteGroupConfig): RouteGroup[];
/**
 * Check if a path contains a route group.
 */
export declare function isGroupPath(path: string): boolean;
/**
 * Extract all groups from a path.
 */
export declare function extractGroups(path: string): string[];
/**
 * Remove all groups from a path.
 */
export declare function removeGroups(path: string): string;
/**
 * Get routes by group name.
 */
export declare function getRoutesByGroup(groups: RouteGroup[], groupName: string): GroupRoute[];
/**
 * Merge multiple route groups.
 */
export declare function mergeRouteGroups(...groups: RouteGroup[]): RouteGroup;
/**
 * Create a nested group structure.
 */
export declare function createNestedGroups(parent: RouteGroup, children: RouteGroup[]): RouteGroup;
/**
 * Validate route group configuration.
 */
export declare function validateRouteGroup(group: RouteGroup): {
    valid: boolean;
    errors: string[];
};
/**
 * Get a visual representation of route groups.
 */
export declare function visualizeRouteGroups(groups: RouteGroup[]): string;
/**
 * Export route groups as JSON.
 */
export declare function exportRouteGroups(groups: RouteGroup[]): string;
//# sourceMappingURL=route-groups.d.ts.map
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
// ============================================================================
// Route Group Processing
// ============================================================================
/**
 * Parse a route path to extract group information.
 */
export function parseRouteGroup(path, config = {}) {
    const pattern = config.groupPattern || /\(([^)]+)\)/g;
    const parts = path.split("/").filter(Boolean);
    const cleanParts = [];
    let group = null;
    for (const part of parts) {
        const match = part.match(/^\(([^)]+)\)$/);
        if (match) {
            // This is a group - don't include in path, but remember it
            if (!group) {
                group = match[1] ?? null;
            }
        }
        else {
            cleanParts.push(part);
        }
    }
    const cleanPath = "/" + cleanParts.join("/");
    return { group, cleanPath };
}
/**
 * Create a route group.
 */
export function createRouteGroup(name, options = {}) {
    const result = {
        name,
        middleware: options.middleware || [],
        routes: options.routes || [],
    };
    if (options.layout !== undefined)
        result.layout = options.layout;
    if (options.loader !== undefined)
        result.loader = options.loader;
    if (options.action !== undefined)
        result.action = options.action;
    if (options.meta !== undefined)
        result.meta = options.meta;
    if (options.errorBoundary !== undefined)
        result.errorBoundary = options.errorBoundary;
    if (options.lazy !== undefined)
        result.lazy = options.lazy;
    return result;
}
/**
 * Add a route to a group.
 */
export function addRouteToGroup(group, route) {
    return {
        ...group,
        routes: [...group.routes, route],
    };
}
/**
 * Process route groups into flat route definitions.
 */
export function processRouteGroups(groups) {
    const processed = [];
    for (const group of groups) {
        for (const route of group.routes) {
            processed.push(...processGroupRoute(group, route, []));
        }
    }
    return processed;
}
/**
 * Process a single route within a group.
 */
function processGroupRoute(group, route, parentPath) {
    const fullPath = [...parentPath, route.path].filter(Boolean).join("/");
    const cleanPath = "/" + fullPath.replace(/^\//, "");
    // Combine loaders (group loader runs first, then route loader)
    const combinedLoader = group.loader || route.loader
        ? async (context) => {
            const groupData = group.loader
                ? await group.loader(context)
                : undefined;
            const routeData = route.loader
                ? await route.loader(context)
                : undefined;
            return {
                ...(groupData || {}),
                ...(routeData || {}),
            };
        }
        : undefined;
    // Combine actions (group action as fallback)
    const combinedAction = route.action || group.action;
    // Wrap component with group layout
    const wrappedComponent = group.layout
        ? (props) => {
            const Layout = group.layout;
            const Component = route.component;
            return Layout({
                ...props,
                children: Component(props),
            });
        }
        : route.component;
    const processed = {
        path: cleanPath,
        component: wrappedComponent,
        group: group.name,
        middleware: group.middleware || [],
        id: route.id || `${group.name}:${cleanPath}`,
    };
    if (combinedLoader !== undefined)
        processed.loader = combinedLoader;
    if (combinedAction !== undefined)
        processed.action = combinedAction;
    if (group.errorBoundary !== undefined)
        processed.errorBoundary = group.errorBoundary;
    const results = [processed];
    // Process child routes recursively
    if (route.children) {
        for (const child of route.children) {
            results.push(...processGroupRoute(group, child, [fullPath]));
        }
    }
    return results;
}
/**
 * Execute group middleware for a route.
 */
export async function executeGroupMiddleware(middleware, context) {
    let result = { allow: true };
    for (const mw of middleware) {
        const mwResult = await mw(context);
        // If any middleware denies access, stop
        if (!mwResult.allow) {
            return mwResult;
        }
        // Merge data from all middleware
        if (mwResult.data) {
            result.data = { ...result.data, ...mwResult.data };
        }
        // Use the last redirect if any
        if (mwResult.redirect) {
            result.redirect = mwResult.redirect;
        }
        // Use the modified request if any
        if (mwResult.modifiedRequest) {
            context.request = mwResult.modifiedRequest;
            result.modifiedRequest = mwResult.modifiedRequest;
        }
    }
    return result;
}
// ============================================================================
// Common Middleware
// ============================================================================
/**
 * Create authentication middleware.
 */
export function createAuthMiddleware(checkAuth, redirectTo = "/login") {
    return async (context) => {
        const isAuthenticated = await checkAuth(context.request);
        if (!isAuthenticated) {
            return {
                allow: false,
                redirect: `${redirectTo}?redirect=${encodeURIComponent(context.url.pathname)}`,
            };
        }
        return { allow: true };
    };
}
/**
 * Create permission-based middleware.
 */
export function createPermissionMiddleware(requiredPermissions, getPermissions, redirectTo = "/unauthorized") {
    return async (context) => {
        const userPermissions = await getPermissions(context.request);
        const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
        if (!hasPermission) {
            return {
                allow: false,
                redirect: redirectTo,
            };
        }
        return { allow: true };
    };
}
/**
 * Create logging middleware.
 */
export function createLoggingMiddleware(logger) {
    return (context) => {
        const log = logger || console.log;
        log({
            group: context.groupName,
            path: context.routePath,
            url: context.url.pathname,
            timestamp: new Date().toISOString(),
        });
        return { allow: true };
    };
}
/**
 * Create rate limiting middleware.
 */
export function createRateLimitMiddleware(options) {
    const requests = new Map();
    return (context) => {
        const key = options.keyFn?.(context) ||
            `${context.groupName}:${context.url.pathname}`;
        const now = Date.now();
        const record = requests.get(key);
        if (!record || now > record.resetAt) {
            requests.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            return { allow: true };
        }
        if (record.count >= options.maxRequests) {
            return {
                allow: false,
                data: {
                    error: "Rate limit exceeded",
                    retryAfter: record.resetAt - now,
                },
            };
        }
        record.count++;
        return { allow: true };
    };
}
/**
 * Create header injection middleware.
 */
export function createHeaderMiddleware(headers) {
    return (context) => {
        const modifiedRequest = new Request(context.request, {
            headers: {
                ...Object.fromEntries(context.request.headers.entries()),
                ...headers,
            },
        });
        return {
            allow: true,
            modifiedRequest,
        };
    };
}
// ============================================================================
// File-based Route Group Discovery
// ============================================================================
/**
 * Discover route groups from a file structure.
 * This would typically be used with a bundler plugin.
 */
export function discoverRouteGroups(files, config = {}) {
    const groups = new Map();
    for (const [filepath, module] of Object.entries(files)) {
        const { group, cleanPath } = parseRouteGroup(filepath, config);
        if (group) {
            // Check if this is a layout file
            if (filepath.endsWith("layout.tsx") || filepath.endsWith("layout.ts")) {
                if (!groups.has(group)) {
                    groups.set(group, createRouteGroup(group, {
                        layout: module.default,
                        loader: module.loader,
                        action: module.action,
                        middleware: module.middleware,
                        meta: module.meta,
                        errorBoundary: module.ErrorBoundary,
                    }));
                }
                else {
                    const existing = groups.get(group);
                    groups.set(group, {
                        ...existing,
                        layout: module.default,
                        loader: module.loader || existing.loader,
                        action: module.action || existing.action,
                        middleware: module.middleware || existing.middleware,
                        meta: module.meta || existing.meta,
                    });
                }
            }
            else {
                // Regular route file
                const route = {
                    path: cleanPath,
                    component: module.default,
                    loader: module.loader,
                    action: module.action,
                    id: module.id,
                    meta: module.meta,
                };
                if (!groups.has(group)) {
                    groups.set(group, createRouteGroup(group, { routes: [route] }));
                }
                else {
                    const existing = groups.get(group);
                    groups.set(group, addRouteToGroup(existing, route));
                }
            }
        }
    }
    return Array.from(groups.values());
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Check if a path contains a route group.
 */
export function isGroupPath(path) {
    return /\([^)]+\)/.test(path);
}
/**
 * Extract all groups from a path.
 */
export function extractGroups(path) {
    const matches = path.match(/\(([^)]+)\)/g);
    if (!matches)
        return [];
    return matches.map((m) => m.slice(1, -1));
}
/**
 * Remove all groups from a path.
 */
export function removeGroups(path) {
    return path.replace(/\([^)]+\)\/?/g, "").replace(/\/+/g, "/") || "/";
}
/**
 * Get routes by group name.
 */
export function getRoutesByGroup(groups, groupName) {
    const group = groups.find((g) => g.name === groupName);
    return group?.routes || [];
}
/**
 * Merge multiple route groups.
 */
export function mergeRouteGroups(...groups) {
    if (groups.length === 0) {
        throw new Error("Cannot merge empty groups");
    }
    const [first, ...rest] = groups;
    let merged = { ...first };
    for (const group of rest) {
        const newMerged = {
            name: merged.name,
            routes: [...merged.routes, ...group.routes],
            middleware: [...(merged.middleware || []), ...(group.middleware || [])],
        };
        const combinedMeta = { ...merged.meta, ...group.meta };
        if (Object.keys(combinedMeta).length > 0)
            newMerged.meta = combinedMeta;
        // Layout and loaders from the last group take precedence
        const layout = group.layout || merged.layout;
        const loader = group.loader || merged.loader;
        const action = group.action || merged.action;
        if (layout !== undefined)
            newMerged.layout = layout;
        if (loader !== undefined)
            newMerged.loader = loader;
        if (action !== undefined)
            newMerged.action = action;
        if (merged.errorBoundary !== undefined)
            newMerged.errorBoundary = merged.errorBoundary;
        if (merged.lazy !== undefined)
            newMerged.lazy = merged.lazy;
        merged = newMerged;
    }
    return merged;
}
/**
 * Create a nested group structure.
 */
export function createNestedGroups(parent, children) {
    // Convert child groups into routes within the parent
    const childRoutes = children.flatMap((child) => child.routes.map((route) => ({
        ...route,
        path: `${child.name}/${route.path}`.replace(/\/+/g, "/"),
    })));
    return {
        ...parent,
        routes: [...parent.routes, ...childRoutes],
    };
}
/**
 * Validate route group configuration.
 */
export function validateRouteGroup(group) {
    const errors = [];
    if (!group.name) {
        errors.push("Group name is required");
    }
    if (group.name.includes("/")) {
        errors.push("Group name cannot contain slashes");
    }
    for (const route of group.routes) {
        if (!route.path) {
            errors.push(`Route in group "${group.name}" is missing path`);
        }
        if (!route.component) {
            errors.push(`Route "${route.path}" in group "${group.name}" is missing component`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
// ============================================================================
// Route Group Utilities for Debugging
// ============================================================================
/**
 * Get a visual representation of route groups.
 */
export function visualizeRouteGroups(groups) {
    const lines = ["Route Groups:", ""];
    for (const group of groups) {
        lines.push(`Group: (${group.name})`);
        if (group.meta?.displayName) {
            lines.push(`  Display: ${group.meta.displayName}`);
        }
        if (group.meta?.description) {
            lines.push(`  Description: ${group.meta.description}`);
        }
        if (group.layout) {
            lines.push(`  Layout: Yes`);
        }
        if (group.middleware && group.middleware.length > 0) {
            lines.push(`  Middleware: ${group.middleware.length} function(s)`);
        }
        lines.push(`  Routes:`);
        for (const route of group.routes) {
            lines.push(`    ${route.path}`);
            if (route.loader)
                lines.push(`      - loader`);
            if (route.action)
                lines.push(`      - action`);
        }
        lines.push("");
    }
    return lines.join("\n");
}
/**
 * Export route groups as JSON.
 */
export function exportRouteGroups(groups) {
    return JSON.stringify(groups.map((group) => ({
        name: group.name,
        meta: group.meta,
        hasLayout: !!group.layout,
        hasLoader: !!group.loader,
        hasAction: !!group.action,
        middlewareCount: group.middleware?.length || 0,
        routes: group.routes.map((route) => ({
            path: route.path,
            id: route.id,
            hasLoader: !!route.loader,
            hasAction: !!route.action,
            meta: route.meta,
        })),
    })), null, 2);
}
//# sourceMappingURL=route-groups.js.map
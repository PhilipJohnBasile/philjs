/**
 * Route creation and management for type-safe router
 */
import { getRouterContext } from "./context.js";
// Counter for generating unique route IDs
let routeIdCounter = 0;
/**
 * Generate a unique route ID
 */
function generateRouteId(path) {
    return `route_${path.replace(/[^a-zA-Z0-9]/g, "_")}_${routeIdCounter++}`;
}
/**
 * Create a type-safe route definition.
 *
 * @example
 * ```typescript
 * const userRoute = createRoute({
 *   path: '/users/$userId',
 *   validateSearch: z.object({ tab: z.enum(['posts', 'comments']) }),
 *   loader: async ({ params, search }) => {
 *     return fetchUser(params.userId);
 *   }
 * });
 * ```
 */
export function createRoute(options) {
    const routeId = generateRouteId(options.path);
    const route = {
        id: routeId,
        path: options.path,
        fullPath: options.path,
        validateSearch: options.validateSearch,
        parent: undefined,
        children: [],
        // Attached hooks for convenient usage in components
        useParams: () => useRouteParams(route),
        useSearch: () => useRouteSearch(route),
        useLoaderData: () => useRouteLoaderData(route),
    };
    // Use conditional assignment for optional properties (TS2375/exactOptionalPropertyTypes)
    if (options.loader !== undefined) {
        route.loader = options.loader;
    }
    if (options.component !== undefined) {
        route.component = options.component;
    }
    if (options.errorComponent !== undefined) {
        route.errorComponent = options.errorComponent;
    }
    if (options.pendingComponent !== undefined) {
        route.pendingComponent = options.pendingComponent;
    }
    if (options.beforeLoad !== undefined) {
        route.beforeLoad = options.beforeLoad;
    }
    if (options.meta !== undefined) {
        route.meta = options.meta;
    }
    return route;
}
/**
 * Create a root route that wraps all other routes.
 *
 * @example
 * ```typescript
 * const rootRoute = createRootRoute({
 *   component: ({ children }) => (
 *     <div class="app-layout">
 *       <Header />
 *       {children}
 *       <Footer />
 *     </div>
 *   )
 * });
 * ```
 */
export function createRootRoute(options = {}) {
    const routeId = generateRouteId("root");
    const route = {
        id: routeId,
        path: "/",
        fullPath: "/",
        validateSearch: undefined,
        parent: undefined,
        children: [],
        useParams: () => ({}),
        useSearch: () => ({}),
        useLoaderData: () => undefined,
    };
    // Use conditional assignment for optional properties (TS2352/exactOptionalPropertyTypes)
    if (options.component !== undefined) {
        route.component = options.component;
    }
    if (options.errorComponent !== undefined) {
        route.errorComponent = options.errorComponent;
    }
    if (options.pendingComponent !== undefined) {
        route.pendingComponent = options.pendingComponent;
    }
    return route;
}
/**
 * Add child routes to a parent route.
 *
 * @example
 * ```typescript
 * const rootRoute = createRootRoute({ ... });
 * const indexRoute = createRoute({ path: '/', ... });
 * const aboutRoute = createRoute({ path: '/about', ... });
 *
 * const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
 * ```
 */
export function addChildren(parent, children) {
    // Update children with parent reference and full paths
    const updatedChildren = children.map((child) => {
        const fullPath = joinPaths(parent.fullPath, child.path);
        return {
            ...child,
            fullPath,
            parent: parent,
        };
    });
    return {
        ...parent,
        children: updatedChildren,
    };
}
/**
 * Create a route with children in one call.
 *
 * @example
 * ```typescript
 * const usersRoute = createRouteWithChildren({
 *   path: '/users',
 *   component: UsersLayout,
 * }, [
 *   createRoute({ path: '/', component: UsersList }),
 *   createRoute({ path: '/$userId', component: UserProfile }),
 * ]);
 * ```
 */
export function createRouteWithChildren(options, children) {
    const route = createRoute(options);
    // Cast route to compatible type for addChildren (TS2379/exactOptionalPropertyTypes)
    return addChildren(route, children);
}
/**
 * Flatten a route tree into an array of routes for the router.
 */
export function flattenRouteTree(routes, parentPath = "") {
    const result = [];
    for (const route of routes) {
        const fullPath = joinPaths(parentPath, route.path);
        const updatedRoute = { ...route, fullPath };
        result.push(updatedRoute);
        if (route.children.length > 0) {
            result.push(...flattenRouteTree(route.children, fullPath));
        }
    }
    return result;
}
/**
 * Join path segments, handling leading/trailing slashes.
 */
function joinPaths(base, segment) {
    // Handle root path
    if (segment === "/" || segment === "") {
        return base || "/";
    }
    // Normalize base
    const normalizedBase = base === "/" ? "" : base.replace(/\/$/, "");
    // Normalize segment
    const normalizedSegment = segment.startsWith("/") ? segment : `/${segment}`;
    return normalizedBase + normalizedSegment || "/";
}
/**
 * Parse path parameters from a path pattern.
 *
 * @example
 * ```typescript
 * parsePathParams('/users/$userId/posts/$postId', '/users/123/posts/456')
 * // => { userId: '123', postId: '456' }
 * ```
 */
export function parsePathParams(pattern, pathname) {
    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    // Check for wildcard at the end
    const hasWildcard = patternParts[patternParts.length - 1] === "*";
    if (!hasWildcard && patternParts.length !== pathParts.length) {
        return null;
    }
    if (hasWildcard && pathParts.length < patternParts.length - 1) {
        return null;
    }
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        if (patternPart === undefined) {
            break;
        }
        if (patternPart === "*") {
            // Capture rest of path
            params["*"] = pathParts.slice(i).join("/");
            break;
        }
        if (patternPart.startsWith("$")) {
            // This is a parameter
            const paramName = patternPart.slice(1);
            if (pathPart === undefined) {
                return null;
            }
            params[paramName] = decodeURIComponent(pathPart);
        }
        else {
            // Static segment - must match exactly
            if (patternPart !== pathPart) {
                return null;
            }
        }
    }
    return params;
}
/**
 * Build a path from a pattern and params.
 *
 * @example
 * ```typescript
 * buildPath('/users/$userId/posts/$postId', { userId: '123', postId: '456' })
 * // => '/users/123/posts/456'
 * ```
 */
export function buildPath(pattern, params) {
    let result = pattern;
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            result = result.replace(`$${key}`, encodeURIComponent(String(value)));
        }
    }
    return result;
}
/**
 * Parse and validate search params using a Zod schema.
 */
export function parseSearchParams(searchString, schema) {
    const urlSearchParams = new URLSearchParams(searchString);
    const rawParams = {};
    for (const [key, value] of urlSearchParams.entries()) {
        // Try to parse as JSON for complex values
        try {
            rawParams[key] = JSON.parse(value);
        }
        catch {
            rawParams[key] = value;
        }
    }
    return schema.parse(rawParams);
}
/**
 * Serialize search params to a query string.
 */
export function serializeSearchParams(params, _schema) {
    const urlSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
            continue;
        }
        if (typeof value === "object") {
            urlSearchParams.set(key, JSON.stringify(value));
        }
        else {
            urlSearchParams.set(key, String(value));
        }
    }
    const result = urlSearchParams.toString();
    return result ? `?${result}` : "";
}
// =============================================================================
// Internal hooks used by route instances
// =============================================================================
/**
 * Get params for a specific route from the current router context.
 */
function useRouteParams(_route) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useParams must be used within a Router");
    }
    if (!context.currentMatch) {
        throw new Error("[philjs-router-typesafe] No route matched");
    }
    return context.currentMatch.params;
}
/**
 * Get search params for a specific route from the current router context.
 */
function useRouteSearch(_route) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useSearch must be used within a Router");
    }
    if (!context.currentMatch) {
        throw new Error("[philjs-router-typesafe] No route matched");
    }
    return context.currentMatch.search;
}
/**
 * Get loader data for a specific route from the current router context.
 */
function useRouteLoaderData(_route) {
    const context = getRouterContext();
    if (!context) {
        throw new Error("[philjs-router-typesafe] useLoaderData must be used within a Router");
    }
    if (!context.currentMatch) {
        throw new Error("[philjs-router-typesafe] No route matched");
    }
    return context.currentMatch.loaderData;
}
// =============================================================================
// Route Matching Utilities
// =============================================================================
/**
 * Match a pathname against a list of routes.
 */
export function matchRoutes(routes, pathname) {
    // Flatten routes for matching
    const flatRoutes = flattenRouteTree(routes);
    // ES2023+: toSorted() for non-mutating sort
    // Sort routes by specificity (more specific routes first)
    const sortedRoutes = flatRoutes.toSorted((a, b) => {
        // Count static segments (more static = more specific)
        const aStatic = a.fullPath.split("/").filter((s) => s && !s.startsWith("$")).length;
        const bStatic = b.fullPath.split("/").filter((s) => s && !s.startsWith("$")).length;
        if (aStatic !== bStatic) {
            return bStatic - aStatic;
        }
        // Prefer longer paths
        return b.fullPath.length - a.fullPath.length;
    });
    for (const route of sortedRoutes) {
        const params = parsePathParams(route.fullPath, pathname);
        if (params !== null) {
            return { route, params: params };
        }
    }
    return null;
}
/**
 * Check if a pathname matches a route pattern.
 */
export function matchesRoute(route, pathname) {
    return parsePathParams(route.fullPath, pathname) !== null;
}
/**
 * Get the active route from a list of routes.
 */
export function getActiveRoute(routes, pathname) {
    const match = matchRoutes(routes, pathname);
    return match?.route ?? null;
}
//# sourceMappingURL=route.js.map
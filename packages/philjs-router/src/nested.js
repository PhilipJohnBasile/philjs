/**
 * Nested route resolution and parallel data loading for PhilJS Router.
 * Enables Remix-style nested routes with layout components.
 *
 * @example
 * ```tsx
 * // routes/users.tsx - parent layout
 * export async function loader() {
 *   return { users: await fetchUsers() };
 * }
 *
 * export default function UsersLayout({ children }) {
 *   const { users } = useLoaderData();
 *   return (
 *     <div>
 *       <Sidebar users={users} />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 *
 * // routes/users/[id].tsx - child route
 * export async function loader({ params }) {
 *   return { user: await fetchUser(params.id) };
 * }
 *
 * export default function UserDetail() {
 *   const { user } = useLoaderData();
 *   return <UserProfile user={user} />;
 * }
 * ```
 */
import { signal } from "@philjs/core";
import { executeNestedLoaders, setCurrentRouteData, } from "./loader.js";
import { executeAction } from "./action.js";
// ============================================================================
// Route Matching
// ============================================================================
/**
 * Match a pathname against nested route definitions.
 * Returns all matching routes from root to leaf.
 */
export function matchNestedRoutes(pathname, routes, options = {}) {
    const basePath = options.basePath || "";
    const normalizedPath = normalizePath(pathname);
    const matches = matchRoutesRecursive(normalizedPath, routes, basePath, {}, options.caseSensitive);
    if (matches.length === 0) {
        return null;
    }
    // Combine params from all matches
    const params = {};
    for (const match of matches) {
        Object.assign(params, match.params);
    }
    return {
        matches,
        params,
        leaf: matches[matches.length - 1],
    };
}
/**
 * Recursively match routes.
 */
function matchRoutesRecursive(pathname, routes, parentPath, parentParams, caseSensitive, matchedPrefix = "") {
    for (const route of routes) {
        const fullPath = joinPaths(parentPath, route.path);
        const matchPattern = getMatchPattern(parentPath, route.path, fullPath);
        const result = matchPathSegment(pathname, matchPattern, caseSensitive, route.catchAll);
        if (result) {
            const params = { ...parentParams, ...result.params };
            const id = route.id || fullPath;
            const fullMatchedPath = joinMatchedPaths(matchedPrefix, result.matchedPath);
            const match = {
                route,
                params,
                pathname: fullMatchedPath,
                id,
            };
            // Check for index route
            if (route.index && result.remaining === "") {
                return [match];
            }
            // Check for child routes
            if (route.children && route.children.length > 0 && result.remaining) {
                const childMatches = matchRoutesRecursive(result.remaining, route.children, fullPath, params, caseSensitive, fullMatchedPath);
                if (childMatches.length > 0) {
                    return [match, ...childMatches];
                }
            }
            // Exact match or catch-all
            if (result.remaining === "" || route.catchAll) {
                return [match];
            }
        }
    }
    return [];
}
/**
 * Match a single path segment.
 */
function matchPathSegment(pathname, pattern, caseSensitive, catchAll) {
    const patternSegments = pattern.split("/").filter(Boolean);
    const pathSegments = pathname.split("/").filter(Boolean);
    if (!catchAll && patternSegments.length > pathSegments.length) {
        return null;
    }
    const params = {};
    let matchedSegments = 0;
    for (let i = 0; i < patternSegments.length; i++) {
        const patternSeg = patternSegments[i];
        const pathSeg = pathSegments[i];
        if (pathSeg === undefined) {
            return null;
        }
        // Dynamic segment
        if (patternSeg.startsWith(":")) {
            const paramName = patternSeg.slice(1);
            params[paramName] = decodeURIComponent(pathSeg);
            matchedSegments++;
            continue;
        }
        // Catch-all segment
        if (patternSeg === "*" || patternSeg.startsWith("*")) {
            const paramName = patternSeg === "*" ? "*" : patternSeg.slice(1);
            params[paramName] = pathSegments.slice(i).map(decodeURIComponent).join("/");
            matchedSegments = pathSegments.length;
            break;
        }
        // Static segment
        const match = caseSensitive
            ? patternSeg === pathSeg
            : patternSeg.toLowerCase() === pathSeg.toLowerCase();
        if (!match) {
            return null;
        }
        matchedSegments++;
    }
    const matchedPath = "/" + pathSegments.slice(0, matchedSegments).join("/");
    const remaining = "/" + pathSegments.slice(matchedSegments).join("/");
    return {
        params,
        matchedPath: matchedPath === "/" ? "/" : matchedPath,
        remaining: remaining === "/" ? "" : remaining,
    };
}
// ============================================================================
// Parallel Data Loading
// ============================================================================
/**
 * Load data for all matched routes in parallel.
 * No waterfall - all loaders run simultaneously.
 */
export async function loadNestedRouteData(matches, request, options = {}) {
    const routes = matches.map((match) => {
        const route = {
            routeId: match.id,
            params: match.params,
        };
        if (match.route.loader) {
            route.loader = match.route.loader;
        }
        return route;
    });
    const loaderOptions = {};
    if (options.signal) {
        loaderOptions.signal = options.signal;
    }
    if (options.revalidate !== undefined) {
        loaderOptions.revalidate = options.revalidate;
    }
    const results = await executeNestedLoaders(routes, request, loaderOptions);
    // Merge results back into matches
    return matches.map((match, index) => {
        const result = results[index];
        const merged = {
            ...match,
            data: result?.data,
        };
        if (result?.error) {
            merged.error = result.error;
        }
        return merged;
    });
}
/**
 * Execute actions for matched routes.
 */
export async function executeNestedAction(matches, request) {
    const url = new URL(request.url);
    // Find the leaf route with an action
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        if (match.route.action) {
            const context = {
                params: match.params,
                request,
                url,
            };
            const result = await executeAction(match.route.action, context);
            const actionResult = {
                routeId: match.id,
                result: result.data,
            };
            if (result.error) {
                actionResult.error = result.error;
            }
            return actionResult;
        }
    }
    return null;
}
// ============================================================================
// Route Rendering
// ============================================================================
/**
 * Render matched routes with proper nesting.
 * Parent components receive children/outlet props.
 */
export function renderNestedRoutes(matches, searchParams) {
    if (matches.length === 0) {
        return null;
    }
    // Render from leaf to root
    let outlet = null;
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const Component = match.route.component;
        if (!Component) {
            continue;
        }
        // Set current route data for useLoaderData
        setCurrentRouteData(match.id, match.data, match.error);
        const props = {
            params: match.params,
            searchParams,
            data: match.data,
            children: outlet,
            outlet,
        };
        if (match.error) {
            props.error = match.error;
        }
        outlet = Component(props);
    }
    return outlet;
}
/**
 * Create an Outlet component for rendering child routes.
 */
export function createOutlet(matches, currentIndex, searchParams) {
    const remainingMatches = matches.slice(currentIndex + 1);
    if (remainingMatches.length === 0) {
        return null;
    }
    return renderNestedRoutes(remainingMatches, searchParams);
}
// ============================================================================
// Outlet Component
// ============================================================================
const outletContextSignal = signal(null);
/**
 * Set the outlet context for nested rendering.
 */
export function setOutletContext(matches, currentIndex, searchParams) {
    outletContextSignal.set({ matches, currentIndex, searchParams });
}
/**
 * Outlet component for rendering nested routes.
 *
 * @example
 * ```tsx
 * export default function UsersLayout() {
 *   return (
 *     <div>
 *       <Sidebar />
 *       <main>
 *         <Outlet />
 *       </main>
 *     </div>
 *   );
 * }
 * ```
 */
export function Outlet() {
    const context = outletContextSignal();
    if (!context) {
        return null;
    }
    return createOutlet(context.matches, context.currentIndex, context.searchParams);
}
/**
 * Hook to access outlet context.
 */
export function useOutletContext() {
    const context = outletContextSignal();
    return context;
}
// ============================================================================
// Route Hierarchy Utilities
// ============================================================================
/**
 * Get all route IDs in the hierarchy.
 */
export function getRouteIds(matches) {
    return matches.map((match) => match.id);
}
/**
 * Find a route by ID in the match hierarchy.
 */
export function findRouteById(matches, id) {
    return matches.find((match) => match.id === id);
}
/**
 * Get the parent route of a matched route.
 */
export function getParentRoute(matches, id) {
    const index = matches.findIndex((match) => match.id === id);
    return index > 0 ? matches[index - 1] : undefined;
}
/**
 * Get ancestor routes of a matched route.
 */
export function getAncestorRoutes(matches, id) {
    const index = matches.findIndex((match) => match.id === id);
    return index > 0 ? matches.slice(0, index) : [];
}
// ============================================================================
// Route Configuration Builder
// ============================================================================
/**
 * Create a nested route definition.
 */
export function createRoute(config) {
    return {
        ...config,
        id: config.id || config.path,
    };
}
/**
 * Create a layout route (has children but may not have its own component).
 */
export function createLayoutRoute(path, children, options = {}) {
    return {
        path,
        children,
        ...options,
        id: options.id || path,
    };
}
/**
 * Create an index route (matches when parent path is exact).
 */
export function createIndexRoute(options) {
    return {
        path: "",
        index: true,
        ...options,
        id: options.id || "_index",
    };
}
/**
 * Create a catch-all route.
 */
export function createCatchAllRoute(component, options = {}) {
    return {
        path: "*",
        catchAll: true,
        component,
        ...options,
        id: options.id || "_catchAll",
    };
}
// ============================================================================
// Path Utilities
// ============================================================================
/**
 * Normalize a pathname.
 */
function normalizePath(path) {
    // Remove trailing slash (except for root)
    let normalized = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
    // Ensure leading slash
    if (!normalized.startsWith("/")) {
        normalized = "/" + normalized;
    }
    return normalized;
}
/**
 * Join two path segments.
 */
function joinPaths(parent, child) {
    if (!child || child === "/") {
        return parent || "/";
    }
    if (child.startsWith("/")) {
        return child;
    }
    if (!parent || parent === "/") {
        return child.startsWith("/") ? child : "/" + child;
    }
    const normalizedParent = parent.endsWith("/") ? parent.slice(0, -1) : parent;
    const normalizedChild = child.startsWith("/") ? child : "/" + child;
    return normalizedParent + normalizedChild;
}
function getMatchPattern(parentPath, childPath, fullPath) {
    if (!childPath || childPath === "/") {
        return fullPath;
    }
    if (!childPath.startsWith("/")) {
        return childPath;
    }
    if (!parentPath || parentPath === "/") {
        return childPath;
    }
    const normalizedParent = normalizePath(parentPath).replace(/\/$/, "");
    const normalizedChild = normalizePath(childPath).replace(/\/$/, "");
    if (normalizedChild === normalizedParent) {
        return "/";
    }
    if (normalizedChild.startsWith(normalizedParent + "/")) {
        const relative = normalizedChild.slice(normalizedParent.length);
        return relative || "/";
    }
    return childPath;
}
function joinMatchedPaths(prefix, matched) {
    if (!prefix || prefix === "/") {
        return matched === "/" ? "/" : matched;
    }
    if (!matched || matched === "/") {
        return prefix;
    }
    const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    const normalizedMatched = matched.startsWith("/") ? matched : `/${matched}`;
    return normalizedPrefix + normalizedMatched;
}
/**
 * Generate a path from a pattern and params.
 */
export function generatePath(pattern, params = {}) {
    return pattern
        .split("/")
        .map((segment) => {
        if (segment.startsWith(":")) {
            const paramName = segment.slice(1);
            return encodeURIComponent(params[paramName] || "");
        }
        if (segment === "*") {
            const value = params["*"] || "";
            return value
                .split("/")
                .map((part) => encodeURIComponent(part))
                .join("/");
        }
        return segment;
    })
        .join("/");
}
/**
 * Parse params from a pathname using a pattern.
 */
export function parseParams(pathname, pattern) {
    const match = matchPathSegment(pathname, pattern);
    return match?.params || null;
}
//# sourceMappingURL=nested.js.map
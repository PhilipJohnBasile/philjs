/**
 * Remix-style data loaders for PhilJS Router.
 * Provides data loading with parallel execution and streaming support.
 */
import { signal } from "@philjs/core";
// ============================================================================
// State Management
// ============================================================================
/**
 * Global loader data store keyed by route ID.
 */
const loaderDataStore = signal(new Map());
/**
 * Current route's loader data for useLoaderData hook.
 */
const currentRouteDataSignal = signal(null);
/**
 * Stack of loader data for nested routes.
 */
const loaderDataStack = signal([]);
/**
 * Cache for loader results with timestamps.
 */
const loaderCache = new Map();
// ============================================================================
// Loader Execution
// ============================================================================
/**
 * Execute a loader function with proper error handling.
 */
export async function executeLoader(loader, context, options = {}) {
    const startTime = Date.now();
    try {
        // Check cache first
        const cacheKey = createCacheKey(context);
        if (options.cacheDuration && !options.revalidate) {
            const cached = loaderCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < options.cacheDuration) {
                return {
                    data: cached.data,
                    loading: false,
                    timestamp: cached.timestamp,
                };
            }
        }
        // Execute the loader
        const data = await loader(context);
        // Cache the result
        if (options.cacheDuration) {
            loaderCache.set(cacheKey, { data, timestamp: startTime });
        }
        return {
            data,
            loading: false,
            timestamp: startTime,
        };
    }
    catch (error) {
        return {
            data: undefined,
            error: error instanceof Error ? error : new Error(String(error)),
            loading: false,
            timestamp: startTime,
        };
    }
}
/**
 * Execute multiple loaders in parallel.
 * This is the key to avoiding waterfalls - all loaders run simultaneously.
 */
export async function executeLoadersParallel(loaders, context, options = {}) {
    const entries = Object.entries(loaders);
    const results = await Promise.all(entries.map(async ([key, loader]) => {
        const result = await executeLoader(loader, context, options);
        return [key, result];
    }));
    return Object.fromEntries(results);
}
/**
 * Execute loaders for a nested route hierarchy in parallel.
 * Parent and child loaders run simultaneously to avoid waterfalls.
 */
export async function executeNestedLoaders(routes, request, options = {}) {
    const url = new URL(request.url);
    // Execute all loaders in parallel
    const results = await Promise.all(routes.map(async (route) => {
        if (!route.loader) {
            return {
                routeId: route.routeId,
                data: undefined,
                loading: false,
            };
        }
        const context = {
            params: route.params,
            request,
            url,
        };
        const result = await executeLoader(route.loader, context, options);
        const loaderData = {
            routeId: route.routeId,
            data: result.data,
            loading: false,
        };
        if (result.error) {
            loaderData.error = result.error;
        }
        return loaderData;
    }));
    // Update the global store
    const store = new Map(loaderDataStore());
    for (const result of results) {
        store.set(result.routeId, result);
    }
    loaderDataStore.set(store);
    // Update the stack for nested access
    loaderDataStack.set(results);
    return results;
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to access loader data for the current route.
 * Similar to Remix's useLoaderData().
 *
 * @example
 * ```tsx
 * export async function loader({ params }) {
 *   return { user: await fetchUser(params.id) };
 * }
 *
 * export default function UserPage() {
 *   const { user } = useLoaderData<typeof loader>();
 *   return <div>{user.name}</div>;
 * }
 * ```
 */
export function useLoaderData() {
    const current = currentRouteDataSignal();
    if (!current) {
        throw new Error("[PhilJS Router] useLoaderData must be used inside a route component. " +
            "Make sure your component is rendered by the router.");
    }
    if (current.error) {
        throw current.error;
    }
    return current.data;
}
/**
 * Hook to access loader data for a specific route in the hierarchy.
 * Useful for accessing parent route data from child components.
 *
 * @example
 * ```tsx
 * // In a child route component
 * const parentData = useRouteLoaderData<ParentData>('routes/users');
 * ```
 */
export function useRouteLoaderData(routeId) {
    const store = loaderDataStore();
    const data = store.get(routeId);
    if (data?.error) {
        throw data.error;
    }
    return data?.data;
}
/**
 * Hook to access all loader data from the route hierarchy.
 * Returns an array of data from parent to child.
 *
 * @example
 * ```tsx
 * const allData = useMatchesData();
 * // allData = [parentData, childData, grandchildData, ...]
 * ```
 */
export function useMatchesData() {
    return loaderDataStack().map((entry) => entry.data);
}
/**
 * Hook to check if any loaders are currently loading.
 */
export function useLoaderLoading() {
    const stack = loaderDataStack();
    return stack.some((entry) => entry.loading);
}
/**
 * Hook to get all matched route data with metadata.
 */
export function useMatches() {
    // This would be populated by the router during navigation
    const matches = typeof window !== "undefined"
        ? window.__PHILJS_ROUTE_MATCHES__ || []
        : [];
    return matches;
}
// ============================================================================
// Context Management
// ============================================================================
/**
 * Set the current route's loader data.
 * Called by the router when entering a route.
 */
export function setCurrentRouteData(routeId, data, error) {
    const routeData = { routeId, data };
    if (error) {
        routeData.error = error;
    }
    currentRouteDataSignal.set(routeData);
}
/**
 * Clear all loader data.
 * Useful for cleanup or testing.
 */
export function clearLoaderData() {
    loaderDataStore.set(new Map());
    loaderDataStack.set([]);
    currentRouteDataSignal.set(null);
    loaderCache.clear();
}
/**
 * Invalidate cached loader data for a specific route.
 */
export function invalidateLoaderCache(routeId) {
    if (routeId) {
        // Invalidate specific route
        for (const key of loaderCache.keys()) {
            if (key.startsWith(routeId)) {
                loaderCache.delete(key);
            }
        }
    }
    else {
        // Invalidate all
        loaderCache.clear();
    }
}
/**
 * Revalidate loader data for current routes.
 * Triggers a refetch of all loaders in the current route hierarchy.
 */
export async function revalidate() {
    // Signal to the router to refetch all loaders
    if (typeof window !== "undefined") {
        const event = new CustomEvent("philjs:revalidate");
        window.dispatchEvent(event);
    }
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Create a cache key for a loader based on its context.
 */
function createCacheKey(context) {
    const paramsStr = Object.entries(context.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
    return `${context.url.pathname}?${paramsStr}`;
}
/**
 * Create a Request object for loader context.
 */
export function createLoaderRequest(url, init) {
    const urlObj = typeof url === "string" ? new URL(url, "http://localhost") : url;
    return new Request(urlObj.toString(), init);
}
/**
 * Response utilities for loaders.
 */
export const json = (data, init) => {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });
};
/**
 * Redirect response for loaders.
 */
export function redirect(url, init) {
    const status = typeof init === "number" ? init : init?.status ?? 302;
    const responseInit = typeof init === "number" ? {} : init;
    return new Response(null, {
        ...responseInit,
        status,
        headers: {
            Location: url,
            ...responseInit?.headers,
        },
    });
}
/**
 * Check if a response is a redirect.
 */
export function isRedirectResponse(response) {
    return response.status >= 300 && response.status < 400;
}
/**
 * Extract redirect location from a response.
 */
export function getRedirectLocation(response) {
    return response.headers.get("Location");
}
//# sourceMappingURL=loader.js.map
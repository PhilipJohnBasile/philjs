/**
 * Remix-style data loaders for PhilJS Router.
 * Provides data loading with parallel execution and streaming support.
 */
/**
 * Context passed to loader functions.
 */
export type LoaderFunctionContext = {
    /** Route parameters extracted from the URL */
    params: Record<string, string>;
    /** The incoming request object */
    request: Request;
    /** The URL being loaded */
    url: URL;
};
/**
 * A loader function that fetches data for a route.
 */
export type LoaderFunction<T = unknown> = (context: LoaderFunctionContext) => Promise<T> | T;
/**
 * Result of a loader execution.
 */
export type LoaderResult<T = unknown> = {
    /** The loaded data */
    data: T;
    /** Error if the loader failed */
    error?: Error;
    /** Whether the loader is still loading */
    loading: boolean;
    /** Timestamp when data was loaded */
    timestamp: number;
};
/**
 * Data stored for each route in the hierarchy.
 */
export type RouteLoaderData = {
    /** Route ID/path */
    routeId: string;
    /** The loaded data */
    data: unknown;
    /** Any error that occurred */
    error?: Error;
    /** Whether loading is in progress */
    loading: boolean;
};
/**
 * Options for loader execution.
 */
export type LoaderOptions = {
    /** Whether to revalidate data on navigation */
    revalidate?: boolean;
    /** Cache duration in milliseconds */
    cacheDuration?: number;
    /** Signal for aborting the loader */
    signal?: AbortSignal;
};
/**
 * Execute a loader function with proper error handling.
 */
export declare function executeLoader<T>(loader: LoaderFunction<T>, context: LoaderFunctionContext, options?: LoaderOptions): Promise<LoaderResult<T>>;
/**
 * Execute multiple loaders in parallel.
 * This is the key to avoiding waterfalls - all loaders run simultaneously.
 */
export declare function executeLoadersParallel<T extends Record<string, LoaderFunction>>(loaders: T, context: LoaderFunctionContext, options?: LoaderOptions): Promise<{
    [K in keyof T]: LoaderResult<Awaited<ReturnType<T[K]>>>;
}>;
/**
 * Execute loaders for a nested route hierarchy in parallel.
 * Parent and child loaders run simultaneously to avoid waterfalls.
 */
export declare function executeNestedLoaders(routes: Array<{
    routeId: string;
    loader?: LoaderFunction;
    params: Record<string, string>;
}>, request: Request, options?: LoaderOptions): Promise<RouteLoaderData[]>;
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
export declare function useLoaderData<T = unknown>(): T;
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
export declare function useRouteLoaderData<T = unknown>(routeId: string): T | undefined;
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
export declare function useMatchesData(): unknown[];
/**
 * Hook to check if any loaders are currently loading.
 */
export declare function useLoaderLoading(): boolean;
/**
 * Hook to get all matched route data with metadata.
 */
export declare function useMatches(): Array<{
    id: string;
    pathname: string;
    params: Record<string, string>;
    data: unknown;
    handle?: unknown;
}>;
/**
 * Set the current route's loader data.
 * Called by the router when entering a route.
 */
export declare function setCurrentRouteData(routeId: string, data: unknown, error?: Error): void;
/**
 * Clear all loader data.
 * Useful for cleanup or testing.
 */
export declare function clearLoaderData(): void;
/**
 * Invalidate cached loader data for a specific route.
 */
export declare function invalidateLoaderCache(routeId?: string): void;
/**
 * Revalidate loader data for current routes.
 * Triggers a refetch of all loaders in the current route hierarchy.
 */
export declare function revalidate(): Promise<void>;
/**
 * Create a Request object for loader context.
 */
export declare function createLoaderRequest(url: string | URL, init?: RequestInit): Request;
/**
 * Type helper for inferring loader data type.
 */
export type InferLoaderData<T extends LoaderFunction> = Awaited<ReturnType<T>>;
/**
 * Response utilities for loaders.
 */
export declare const json: <T>(data: T, init?: ResponseInit) => Response;
/**
 * Redirect response for loaders.
 */
export declare function redirect(url: string, init?: number | ResponseInit): Response;
/**
 * Check if a response is a redirect.
 */
export declare function isRedirectResponse(response: Response): boolean;
/**
 * Extract redirect location from a response.
 */
export declare function getRedirectLocation(response: Response): string | null;
//# sourceMappingURL=loader.d.ts.map
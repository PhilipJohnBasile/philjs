/**
 * Remix-style data loaders for PhilJS Router.
 * Provides data loading with parallel execution and streaming support.
 */

import { signal } from "philjs-core";
import type { JSXElement, VNode } from "philjs-core";

// ============================================================================
// Types
// ============================================================================

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
export type LoaderFunction<T = unknown> = (
  context: LoaderFunctionContext
) => Promise<T> | T;

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

// ============================================================================
// State Management
// ============================================================================

/**
 * Global loader data store keyed by route ID.
 */
const loaderDataStore = signal<Map<string, RouteLoaderData>>(new Map());

/**
 * Current route's loader data for useLoaderData hook.
 */
const currentRouteDataSignal = signal<{
  routeId: string;
  data: unknown;
  error?: Error;
} | null>(null);

/**
 * Stack of loader data for nested routes.
 */
const loaderDataStack = signal<RouteLoaderData[]>([]);

/**
 * Cache for loader results with timestamps.
 */
const loaderCache = new Map<string, { data: unknown; timestamp: number }>();

// ============================================================================
// Loader Execution
// ============================================================================

/**
 * Execute a loader function with proper error handling.
 */
export async function executeLoader<T>(
  loader: LoaderFunction<T>,
  context: LoaderFunctionContext,
  options: LoaderOptions = {}
): Promise<LoaderResult<T>> {
  const startTime = Date.now();

  try {
    // Check cache first
    const cacheKey = createCacheKey(context);
    if (options.cacheDuration && !options.revalidate) {
      const cached = loaderCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < options.cacheDuration) {
        return {
          data: cached.data as T,
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
  } catch (error) {
    return {
      data: undefined as T,
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
export async function executeLoadersParallel<T extends Record<string, LoaderFunction>>(
  loaders: T,
  context: LoaderFunctionContext,
  options: LoaderOptions = {}
): Promise<{ [K in keyof T]: LoaderResult<Awaited<ReturnType<T[K]>>> }> {
  const entries = Object.entries(loaders);

  const results = await Promise.all(
    entries.map(async ([key, loader]) => {
      const result = await executeLoader(loader, context, options);
      return [key, result] as const;
    })
  );

  return Object.fromEntries(results) as { [K in keyof T]: LoaderResult<Awaited<ReturnType<T[K]>>> };
}

/**
 * Execute loaders for a nested route hierarchy in parallel.
 * Parent and child loaders run simultaneously to avoid waterfalls.
 */
export async function executeNestedLoaders(
  routes: Array<{
    routeId: string;
    loader?: LoaderFunction;
    params: Record<string, string>;
  }>,
  request: Request,
  options: LoaderOptions = {}
): Promise<RouteLoaderData[]> {
  const url = new URL(request.url);

  // Execute all loaders in parallel
  const results: RouteLoaderData[] = await Promise.all(
    routes.map(async (route): Promise<RouteLoaderData> => {
      if (!route.loader) {
        return {
          routeId: route.routeId,
          data: undefined,
          loading: false,
        };
      }

      const context: LoaderFunctionContext = {
        params: route.params,
        request,
        url,
      };

      const result = await executeLoader(route.loader, context, options);

      const loaderData: RouteLoaderData = {
        routeId: route.routeId,
        data: result.data,
        loading: false,
      };
      if (result.error) {
        loaderData.error = result.error;
      }
      return loaderData;
    })
  );

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
export function useLoaderData<T = unknown>(): T {
  const current = currentRouteDataSignal();
  if (!current) {
    throw new Error(
      "[PhilJS Router] useLoaderData must be used inside a route component. " +
      "Make sure your component is rendered by the router."
    );
  }

  if (current.error) {
    throw current.error;
  }

  return current.data as T;
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
export function useRouteLoaderData<T = unknown>(routeId: string): T | undefined {
  const store = loaderDataStore();
  const data = store.get(routeId);

  if (data?.error) {
    throw data.error;
  }

  return data?.data as T | undefined;
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
export function useMatchesData(): unknown[] {
  return loaderDataStack().map((entry) => entry.data);
}

/**
 * Hook to check if any loaders are currently loading.
 */
export function useLoaderLoading(): boolean {
  const stack = loaderDataStack();
  return stack.some((entry) => entry.loading);
}

/**
 * Hook to get all matched route data with metadata.
 */
export function useMatches(): Array<{
  id: string;
  pathname: string;
  params: Record<string, string>;
  data: unknown;
  handle?: unknown;
}> {
  // This would be populated by the router during navigation
  const matches = typeof window !== "undefined"
    ? (window as any).__PHILJS_ROUTE_MATCHES__ || []
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
export function setCurrentRouteData(
  routeId: string,
  data: unknown,
  error?: Error
): void {
  const routeData: { routeId: string; data: unknown; error?: Error } = { routeId, data };
  if (error) {
    routeData.error = error;
  }
  currentRouteDataSignal.set(routeData);
}

/**
 * Clear all loader data.
 * Useful for cleanup or testing.
 */
export function clearLoaderData(): void {
  loaderDataStore.set(new Map());
  loaderDataStack.set([]);
  currentRouteDataSignal.set(null);
  loaderCache.clear();
}

/**
 * Invalidate cached loader data for a specific route.
 */
export function invalidateLoaderCache(routeId?: string): void {
  if (routeId) {
    // Invalidate specific route
    for (const key of loaderCache.keys()) {
      if (key.startsWith(routeId)) {
        loaderCache.delete(key);
      }
    }
  } else {
    // Invalidate all
    loaderCache.clear();
  }
}

/**
 * Revalidate loader data for current routes.
 * Triggers a refetch of all loaders in the current route hierarchy.
 */
export async function revalidate(): Promise<void> {
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
function createCacheKey(context: LoaderFunctionContext): string {
  const paramsStr = Object.entries(context.params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return `${context.url.pathname}?${paramsStr}`;
}

/**
 * Create a Request object for loader context.
 */
export function createLoaderRequest(
  url: string | URL,
  init?: RequestInit
): Request {
  const urlObj = typeof url === "string" ? new URL(url, "http://localhost") : url;
  return new Request(urlObj.toString(), init);
}

/**
 * Type helper for inferring loader data type.
 */
export type InferLoaderData<T extends LoaderFunction> = Awaited<ReturnType<T>>;

/**
 * Response utilities for loaders.
 */
export const json = <T>(data: T, init?: ResponseInit): Response => {
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
export function redirect(url: string, init?: number | ResponseInit): Response {
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
export function isRedirectResponse(response: Response): boolean {
  return response.status >= 300 && response.status < 400;
}

/**
 * Extract redirect location from a response.
 */
export function getRedirectLocation(response: Response): string | null {
  return response.headers.get("Location");
}

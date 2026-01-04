/**
 * Advanced resource primitive for async data management (SolidStart-style).
 * Provides Suspense integration, dependent resources, and preloading.
 */
export type ResourceFetcher<T, S = unknown> = (source: S, info: ResourceFetcherInfo<T, S>) => T | Promise<T>;
export interface ResourceFetcherInfo<T, S = unknown> {
    value: T | undefined;
    refetching: boolean | unknown;
}
export interface ResourceOptions<T, S = unknown> {
    /**
     * Initial value for the resource
     */
    initialValue?: T;
    /**
     * Name for debugging
     */
    name?: string;
    /**
     * Whether to defer the initial fetch
     */
    deferStream?: boolean;
    /**
     * Server-side-only: whether to wait for this resource during SSR
     */
    ssrLoadFrom?: 'initial' | 'server';
    /**
     * Callback when resource starts loading
     */
    onHydrated?: (key: string, info: any) => void;
}
export interface Resource<T> {
    (): T | undefined;
    loading: boolean;
    error: Error | undefined;
    latest: T | undefined;
    state: 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored';
}
export interface ResourceActions<T, S = unknown> {
    mutate: (value: T | undefined) => T | undefined;
    refetch: (info?: unknown) => T | Promise<T | undefined> | null | undefined;
}
/** Tuple returned from createResource: [resource, { mutate, refetch }] */
export type ResourceReturn<T> = [Resource<T>, ResourceActions<T>];
/**
 * Enable Suspense mode for resources
 */
export declare function enableSuspense(): void;
/**
 * Disable Suspense mode for resources
 */
export declare function disableSuspense(): void;
/**
 * Check if currently in Suspense mode
 */
export declare function isSuspenseActive(): boolean;
/**
 * Create a resource for async data fetching with Suspense integration.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [data] = createResource(fetchUser);
 *
 * // With source signal
 * const [userId, setUserId] = signal(1);
 * const [user] = createResource(userId, fetchUser);
 *
 * // Access state
 * if (user.loading) return <div>Loading...</div>;
 * if (user.error) return <div>Error: {user.error.message}</div>;
 * return <div>{user()?.name}</div>;
 * ```
 */
export declare function createResource<T, S = true>(fetcher: ResourceFetcher<T, S>, options?: ResourceOptions<T, S>): ResourceReturn<T>;
export declare function createResource<T, S>(source: S | (() => S), fetcher: ResourceFetcher<T, S>, options?: ResourceOptions<T, S>): ResourceReturn<T>;
/**
 * Create a resource that depends on another resource.
 * Only fetches when the parent resource has successfully loaded.
 *
 * @example
 * ```tsx
 * const [user] = createResource(fetchUser);
 * const [posts] = createDependentResource(
 *   () => user()?.id,
 *   (userId) => fetchUserPosts(userId)
 * );
 * ```
 */
export declare function createDependentResource<T, S>(source: () => S | undefined | null, fetcher: ResourceFetcher<T, S>, options?: ResourceOptions<T, S>): ResourceReturn<T>;
/**
 * Preload a resource before it's needed.
 * Caches the result for a short time.
 *
 * @example
 * ```tsx
 * // Preload on hover
 * <Link
 *   href="/user/1"
 *   onMouseEnter={() => preload('user-1', () => fetchUser(1))}
 * >
 *   User Profile
 * </Link>
 *
 * // Use the preloaded data
 * const [user] = createResource(() => fetchUser(1));
 * ```
 */
export declare function preload<T>(key: string, fetcher: () => T | Promise<T>): Promise<T>;
/**
 * Get preloaded data if available
 */
export declare function getPreloaded<T>(key: string): T | undefined;
/**
 * Clear preload cache
 */
export declare function clearPreloadCache(key?: string): void;
/**
 * Refetch all active resources matching a predicate.
 * Useful for cache invalidation.
 *
 * @example
 * ```tsx
 * // Refetch all user-related resources
 * refetchResources((name) => name?.startsWith('user-'));
 * ```
 */
export declare function refetchResources(predicate?: (name?: string) => boolean): void;
/**
 * Create a resource with automatic retry on failure.
 *
 * @example
 * ```tsx
 * const [data] = createResourceWithRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, retryDelay: 1000 }
 * );
 * ```
 */
export declare function createResourceWithRetry<T, S = true>(fetcher: ResourceFetcher<T, S>, options?: ResourceOptions<T, S> & {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
}): ResourceReturn<T>;
export declare function createResourceWithRetry<T, S>(source: S | (() => S), fetcher: ResourceFetcher<T, S>, options?: ResourceOptions<T, S> & {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
}): ResourceReturn<T>;
//# sourceMappingURL=resource.d.ts.map
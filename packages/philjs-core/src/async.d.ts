/**
 * Advanced Async Primitives for PhilJS
 *
 * Enhanced async handling with:
 * - Suspense-like data loading
 * - Parallel/waterfall fetching
 * - Retry logic with backoff
 * - Race conditions handling
 * - Request deduplication
 * - Optimistic updates
 */
export interface AsyncState<T> {
    data: T | undefined;
    error: Error | undefined;
    loading: boolean;
    status: 'idle' | 'pending' | 'success' | 'error';
}
export interface AsyncOptions<T> {
    /** Initial data */
    initialData?: T;
    /** Retry configuration */
    retry?: RetryConfig;
    /** Cache configuration */
    cache?: CacheConfig;
    /** Dedupe identical requests */
    dedupe?: boolean;
    /** Timeout in ms */
    timeout?: number;
    /** Refetch on window focus */
    refetchOnFocus?: boolean;
    /** Refetch interval in ms */
    refetchInterval?: number;
    /** Keep previous data while refetching */
    keepPreviousData?: boolean;
    /** Placeholder data while loading */
    placeholderData?: T | (() => T);
    /** Called on success */
    onSuccess?: (data: T) => void;
    /** Called on error */
    onError?: (error: Error) => void;
    /** Called on settled (success or error) */
    onSettled?: (data: T | undefined, error: Error | undefined) => void;
}
export interface RetryConfig {
    /** Max retry attempts */
    count: number;
    /** Delay between retries in ms */
    delay: number | ((attempt: number) => number);
    /** Retry condition */
    condition?: (error: Error, attempt: number) => boolean;
}
export interface CacheConfig {
    /** Cache key */
    key: string;
    /** Time to live in ms */
    ttl?: number;
    /** Stale-while-revalidate time in ms */
    staleTime?: number;
}
export interface MutationOptions<T, V> {
    /** Optimistic update function */
    optimisticUpdate?: (variables: V) => T;
    /** Rollback function on error */
    onError?: (error: Error, variables: V, rollback: () => void) => void;
    /** Called on success */
    onSuccess?: (data: T, variables: V) => void;
    /** Invalidate cache keys on success */
    invalidate?: string[];
    /** Retry configuration */
    retry?: RetryConfig;
}
/**
 * Get cached data
 */
export declare function getCached<T>(key: string): T | undefined;
/**
 * Set cache data
 */
export declare function setCache<T>(key: string, data: T, ttl?: number): void;
/**
 * Invalidate cache
 */
export declare function invalidateCache(keyOrPattern: string | RegExp): void;
/**
 * Clear all cache
 */
export declare function clearCache(): void;
/**
 * Create an async resource with advanced features
 */
export declare function createAsync<T>(fetcher: () => Promise<T>, options?: AsyncOptions<T>): {
    data: () => T | undefined;
    error: () => Error | undefined;
    loading: () => boolean;
    status: () => AsyncState<T>['status'];
    refetch: () => Promise<T>;
    mutate: (data: T | ((prev: T | undefined) => T)) => void;
};
/**
 * Create a mutation with optimistic updates
 */
export declare function createMutation<T, V = void>(mutator: (variables: V) => Promise<T>, options?: MutationOptions<T, V>): {
    mutate: (variables: V) => Promise<T>;
    data: () => T | undefined;
    error: () => Error | undefined;
    loading: () => boolean;
    reset: () => void;
};
/**
 * Fetch multiple resources in parallel
 */
export declare function parallel<T extends readonly (() => Promise<any>)[]>(fetchers: T): Promise<{
    [K in keyof T]: Awaited<ReturnType<T[K]>>;
}>;
/**
 * Fetch resources in sequence (waterfall)
 */
export declare function waterfall<T extends readonly ((prev: any) => Promise<any>)[]>(fetchers: T, initial?: any): Promise<Awaited<ReturnType<T[number]>>>;
/**
 * Race multiple fetchers, return first successful result
 */
export declare function race<T>(fetchers: (() => Promise<T>)[], options?: {
    timeout?: number;
}): Promise<T>;
/**
 * Fetch with automatic retry and exponential backoff
 */
export declare function fetchWithRetry<T>(fetcher: () => Promise<T>, options?: RetryConfig): Promise<T>;
/**
 * Create a suspense-like resource that throws promises
 */
export declare function createSuspenseResource<T>(key: string, fetcher: () => Promise<T>): () => T;
/**
 * Preload a suspense resource
 */
export declare function preload<T>(key: string, fetcher: () => Promise<T>): void;
/**
 * Create a debounced async function
 */
export declare function debounceAsync<T, A extends any[]>(fn: (...args: A) => Promise<T>, delay: number): (...args: A) => Promise<T>;
/**
 * Create a throttled async function
 */
export declare function throttleAsync<T, A extends any[]>(fn: (...args: A) => Promise<T>, limit: number): (...args: A) => Promise<T>;
/**
 * Create a queue for sequential async operations
 */
export declare function createQueue<T>(): {
    add: (task: () => Promise<T>) => Promise<T>;
    clear: () => void;
    size: () => number;
};
/**
 * Limit concurrent async operations
 */
export declare function createConcurrencyLimiter(limit: number): {
    run: <T>(task: () => Promise<T>) => Promise<T>;
    active: () => number;
};
//# sourceMappingURL=async.d.ts.map
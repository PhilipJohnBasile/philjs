/**
 * Unified data fetching layer with caching.
 * Combines server-side loading with client-side SWR-style caching.
 */
import { type Signal, type Memo } from "./signals.js";
export type QueryKey = string | readonly unknown[];
export type QueryOptions<T> = {
    /** Unique key for this query */
    key: QueryKey;
    /** Async function that fetches the data */
    fetcher: () => Promise<T>;
    /** Stale time in ms (default: 0) */
    staleTime?: number;
    /** Cache time in ms (default: 5 minutes) */
    cacheTime?: number;
    /** Refetch on window focus (default: false) */
    refetchOnFocus?: boolean;
    /** Refetch on reconnect (default: true) */
    refetchOnReconnect?: boolean;
    /** Refetch interval in ms */
    refetchInterval?: number;
    /** Initial data */
    initialData?: T;
    /** Suspense mode (throw promise) */
    suspense?: boolean;
    /** On success callback */
    onSuccess?: (data: T) => void;
    /** On error callback */
    onError?: (error: Error) => void;
};
export type QueryResult<T> = {
    /** The data returned by the query */
    data: Signal<T | undefined>;
    /** Error if the query failed */
    error: Signal<Error | undefined>;
    /** True while the query is fetching */
    isLoading: Signal<boolean>;
    /** True while refetching (has data but fetching new) */
    isFetching: Signal<boolean>;
    /** True if the query has been fetched at least once */
    isSuccess: Memo<boolean>;
    /** True if the query failed */
    isError: Memo<boolean>;
    /** Manually trigger a refetch */
    refetch: () => Promise<T>;
    /** Manually set the data (for optimistic updates) */
    mutate: (data: T | ((prev: T | undefined) => T)) => void;
};
export type MutationOptions<TData, TVariables> = {
    /** Mutation function */
    mutationFn: (variables: TVariables) => Promise<TData>;
    /** On success callback */
    onSuccess?: (data: TData, variables: TVariables) => void;
    /** On error callback */
    onError?: (error: Error, variables: TVariables) => void;
    /** On settled (success or error) */
    onSettled?: (data: TData | undefined, error: Error | undefined, variables: TVariables) => void;
    /** Optimistic update */
    optimisticUpdate?: (variables: TVariables) => void;
};
export type MutationResult<TData, TVariables> = {
    /** Trigger the mutation */
    mutate: (variables: TVariables) => Promise<TData>;
    /** Trigger the mutation (async version) */
    mutateAsync: (variables: TVariables) => Promise<TData>;
    /** The data returned by the mutation */
    data: Signal<TData | undefined>;
    /** Error if the mutation failed */
    error: Signal<Error | undefined>;
    /** True while the mutation is running */
    isPending: Signal<boolean>;
    /** True if the mutation succeeded */
    isSuccess: Memo<boolean>;
    /** True if the mutation failed */
    isError: Memo<boolean>;
    /** Reset the mutation state */
    reset: () => void;
};
/**
 * Global cache for queries.
 */
declare class QueryCache {
    private cache;
    get(key: string): {
        data: any;
        error: Error | undefined;
        timestamp: number;
        promise?: Promise<any>;
    } | undefined;
    set(key: string, value: any, error?: Error): void;
    setPromise(key: string, promise: Promise<any>): void;
    delete(key: string): void;
    clear(): void;
    isStale(key: string, staleTime: number): boolean;
}
export declare const queryCache: QueryCache;
/**
 * Create a query hook for data fetching.
 */
export declare function createQuery<T>(options: QueryOptions<T>): QueryResult<T>;
/**
 * Create a mutation hook for data modifications.
 */
export declare function createMutation<TData, TVariables>(options: MutationOptions<TData, TVariables>): MutationResult<TData, TVariables>;
/**
 * Invalidate queries by key pattern.
 */
export declare function invalidateQueries(keyPattern?: QueryKey | ((key: QueryKey) => boolean)): void;
/**
 * Prefetch a query (for SSR or preloading).
 */
export declare function prefetchQuery<T>(options: QueryOptions<T>): Promise<T>;
export {};
//# sourceMappingURL=data-layer.d.ts.map
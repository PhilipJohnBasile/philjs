/**
 * Unified data fetching layer with caching.
 * Combines server-side loading with client-side SWR-style caching.
 */
import { signal, memo } from "./signals.js";
/**
 * Global cache for queries.
 */
class QueryCache {
    cache = new Map();
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, error) {
        this.cache.set(key, {
            data: value,
            error,
            timestamp: Date.now(),
            promise: undefined,
        });
    }
    setPromise(key, promise) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.promise = promise;
        }
        else {
            this.cache.set(key, {
                data: undefined,
                error: undefined,
                timestamp: Date.now(),
                promise,
            });
        }
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    isStale(key, staleTime) {
        const entry = this.cache.get(key);
        if (!entry)
            return true;
        return Date.now() - entry.timestamp > staleTime;
    }
}
export const queryCache = new QueryCache();
/**
 * Create a query hook for data fetching.
 */
export function createQuery(options) {
    const keyStr = JSON.stringify(options.key);
    // Signals for reactive state
    const data = signal(options.initialData);
    const error = signal(undefined);
    const isLoading = signal(false);
    const isFetching = signal(false);
    // Check cache
    const cached = queryCache.get(keyStr);
    if (cached && !queryCache.isStale(keyStr, options.staleTime || 0)) {
        data.set(cached.data);
        error.set(cached.error);
    }
    let listenersAttached = false;
    // Fetch function
    const fetchData = async () => {
        isFetching.set(true);
        try {
            // Check if there's already a promise in flight
            const existing = queryCache.get(keyStr);
            if (existing?.promise) {
                const result = await existing.promise;
                data.set(result);
                return result;
            }
            // Create new promise
            const promise = options.fetcher();
            queryCache.setPromise(keyStr, promise);
            const result = await promise;
            // Update cache and state
            queryCache.set(keyStr, result);
            data.set(result);
            error.set(undefined);
            // Call success callback
            options.onSuccess?.(result);
            return result;
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            // Update cache and state
            queryCache.set(keyStr, undefined, e);
            error.set(e);
            // Call error callback
            options.onError?.(e);
            throw e;
        }
        finally {
            isFetching.set(false);
            isLoading.set(false);
            if (!listenersAttached) {
                listenersAttached = true;
                // Set up refetch on focus
                if (options.refetchOnFocus && typeof window !== "undefined") {
                    window.addEventListener("focus", () => {
                        if (queryCache.isStale(keyStr, options.staleTime || 0)) {
                            fetchData();
                        }
                    });
                }
                // Set up refetch on reconnect
                if (options.refetchOnReconnect && typeof window !== "undefined") {
                    window.addEventListener("online", () => {
                        fetchData();
                    });
                }
                // Set up refetch interval
                if (options.refetchInterval && typeof window !== "undefined") {
                    setInterval(() => {
                        fetchData();
                    }, options.refetchInterval);
                }
            }
        }
    };
    // Initial fetch
    if (!cached || queryCache.isStale(keyStr, options.staleTime || 0)) {
        isLoading.set(true);
        if (options.suspense && typeof window === "undefined") {
            // Server-side: fetch synchronously
            throw fetchData();
        }
        else {
            // Client-side: fetch asynchronously
            fetchData();
        }
    }
    // Set up refetch on focus
    if (options.refetchOnFocus && typeof window !== "undefined") {
        window.addEventListener("focus", () => {
            if (queryCache.isStale(keyStr, options.staleTime || 0)) {
                fetchData();
            }
        });
    }
    // Set up refetch on reconnect
    if (options.refetchOnReconnect && typeof window !== "undefined") {
        window.addEventListener("online", () => {
            fetchData();
        });
    }
    // Set up refetch interval
    if (options.refetchInterval && typeof window !== "undefined") {
        setInterval(() => {
            fetchData();
        }, options.refetchInterval);
    }
    // Computed values
    const isSuccess = memo(() => data() !== undefined && !error());
    const isError = memo(() => error() !== undefined);
    return {
        data,
        error,
        isLoading,
        isFetching,
        isSuccess,
        isError,
        refetch: fetchData,
        mutate: (newData) => {
            const updated = typeof newData === "function" ? newData(data()) : newData;
            data.set(updated);
            queryCache.set(keyStr, { ...queryCache.get(keyStr), data: updated });
        },
    };
}
/**
 * Create a mutation hook for data modifications.
 */
export function createMutation(options) {
    // Signals for reactive state
    const data = signal(undefined);
    const error = signal(undefined);
    const isPending = signal(false);
    const execute = async (variables) => {
        isPending.set(true);
        error.set(undefined);
        try {
            // Optimistic update
            options.optimisticUpdate?.(variables);
            // Execute mutation
            const result = await options.mutationFn(variables);
            // Update state
            data.set(result);
            // Callbacks
            options.onSuccess?.(result, variables);
            options.onSettled?.(result, undefined, variables);
            return result;
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            // Update state
            error.set(e);
            // Callbacks
            options.onError?.(e, variables);
            options.onSettled?.(undefined, e, variables);
            throw e;
        }
        finally {
            isPending.set(false);
        }
    };
    // Computed values
    const isSuccess = memo(() => data() !== undefined && !error());
    const isError = memo(() => error() !== undefined);
    return {
        mutate: (variables) => {
            execute(variables).catch(() => {
                // Error already handled in state
            });
            return Promise.resolve(data());
        },
        mutateAsync: execute,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        reset: () => {
            data.set(undefined);
            error.set(undefined);
            isPending.set(false);
        },
    };
}
/**
 * Invalidate queries by key pattern.
 */
export function invalidateQueries(keyPattern) {
    // This would trigger refetch of matching queries
    // Implementation depends on query tracking system
    console.log("Invalidating queries:", keyPattern);
}
/**
 * Prefetch a query (for SSR or preloading).
 */
export async function prefetchQuery(options) {
    const keyStr = JSON.stringify(options.key);
    // Check if already cached and fresh
    if (!queryCache.isStale(keyStr, options.staleTime || 0)) {
        const cached = queryCache.get(keyStr);
        if (cached?.data)
            return cached.data;
    }
    // Fetch and cache
    try {
        const result = await options.fetcher();
        queryCache.set(keyStr, result);
        return result;
    }
    catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        queryCache.set(keyStr, undefined, e);
        throw e;
    }
}
//# sourceMappingURL=data-layer.js.map
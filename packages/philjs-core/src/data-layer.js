/**
 * Unified data fetching layer with caching.
 * Combines server-side loading with client-side SWR-style caching.
 */
import { signal, memo } from "./signals.js";
class QueryCache {
    cache = new Map();
    gcTimers = new Map();
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, error, cacheTime) {
        this.cache.set(key, {
            data: value,
            error,
            timestamp: Date.now(),
        });
        if (cacheTime !== undefined) {
            this.scheduleGc(key, cacheTime);
        }
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
        const timer = this.gcTimers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.gcTimers.delete(key);
        }
    }
    clear() {
        this.cache.clear();
        for (const timer of this.gcTimers.values()) {
            clearTimeout(timer);
        }
        this.gcTimers.clear();
    }
    isStale(key, staleTime) {
        const entry = this.cache.get(key);
        if (!entry)
            return true;
        return Date.now() - entry.timestamp > staleTime;
    }
    invalidate(key) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.timestamp = 0;
            entry.promise = undefined;
        }
    }
    scheduleGc(key, cacheTime) {
        if (cacheTime <= 0) {
            return;
        }
        const existing = this.gcTimers.get(key);
        if (existing) {
            clearTimeout(existing);
        }
        const timer = setTimeout(() => {
            this.cache.delete(key);
            this.gcTimers.delete(key);
        }, cacheTime);
        this.gcTimers.set(key, timer);
    }
}
export const queryCache = new QueryCache();
const queryObservers = new Map();
function registerObserver(observer) {
    const set = queryObservers.get(observer.keyStr);
    if (set) {
        set.add(observer);
    }
    else {
        queryObservers.set(observer.keyStr, new Set([observer]));
    }
}
function getKeyString(key) {
    return typeof key === "string" ? key : stableStringify(key);
}
function stableStringify(value) {
    return JSON.stringify(value, (_key, val) => {
        if (!val || typeof val !== "object" || Array.isArray(val)) {
            return val;
        }
        const sorted = {};
        for (const key of Object.keys(val).sort()) {
            sorted[key] = val[key];
        }
        return sorted;
    });
}
function isEqual(a, b) {
    return stableStringify(a) === stableStringify(b);
}
function matchesKey(key, pattern) {
    if (typeof pattern === "function") {
        return pattern(key);
    }
    if (typeof pattern === "string") {
        if (typeof key === "string")
            return key === pattern;
        if (Array.isArray(key))
            return key[0] === pattern;
        return false;
    }
    if (!Array.isArray(pattern)) {
        return isEqual(key, pattern);
    }
    if (!Array.isArray(key))
        return false;
    if (pattern.length > key.length)
        return false;
    for (let i = 0; i < pattern.length; i += 1) {
        if (!isEqual(key[i], pattern[i])) {
            return false;
        }
    }
    return true;
}
/**
 * Create a query hook for data fetching.
 */
export function createQuery(options) {
    const keyStr = getKeyString(options.key);
    const staleTime = options.staleTime ?? 0;
    const cacheTime = options.cacheTime ?? 5 * 60 * 1000;
    // Signals for reactive state
    const data = signal(options.initialData);
    const error = signal(undefined);
    const isLoading = signal(false);
    const isFetching = signal(false);
    // Check cache
    const cached = queryCache.get(keyStr);
    if (cached && !queryCache.isStale(keyStr, staleTime)) {
        data.set(cached.data);
        error.set(cached.error);
    }
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
            queryCache.set(keyStr, result, undefined, cacheTime);
            data.set(result);
            error.set(undefined);
            // Call success callback
            options.onSuccess?.(result);
            return result;
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            // Update cache and state
            queryCache.set(keyStr, undefined, e, cacheTime);
            error.set(e);
            // Call error callback
            options.onError?.(e);
            throw e;
        }
        finally {
            isFetching.set(false);
            isLoading.set(false);
        }
    };
    registerObserver({ key: options.key, keyStr, refetch: fetchData, staleTime });
    // Initial fetch
    if (!cached || queryCache.isStale(keyStr, staleTime)) {
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
    if (typeof window !== "undefined") {
        // Set up refetch on focus
        if (options.refetchOnFocus) {
            window.addEventListener("focus", () => {
                if (queryCache.isStale(keyStr, staleTime)) {
                    fetchData();
                }
            });
        }
        // Set up refetch on reconnect
        if (options.refetchOnReconnect) {
            window.addEventListener("online", () => {
                fetchData();
            });
        }
        // Set up refetch interval
        if (options.refetchInterval) {
            setInterval(() => {
                fetchData();
            }, options.refetchInterval);
        }
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
            const updated = typeof newData === "function"
                ? newData(data())
                : newData;
            data.set(updated);
            const existing = queryCache.get(keyStr);
            queryCache.set(keyStr, updated, existing?.error, cacheTime);
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
    const observers = Array.from(queryObservers.values()).flatMap((set) => Array.from(set));
    if (!keyPattern) {
        queryCache.clear();
        observers.forEach((observer) => {
            observer.refetch();
        });
        return;
    }
    for (const observer of observers) {
        if (matchesKey(observer.key, keyPattern)) {
            queryCache.invalidate(observer.keyStr);
            observer.refetch();
        }
    }
}
/**
 * Prefetch a query (for SSR or preloading).
 */
export async function prefetchQuery(options) {
    const keyStr = getKeyString(options.key);
    const staleTime = options.staleTime ?? 0;
    const cacheTime = options.cacheTime ?? 5 * 60 * 1000;
    // Check if already cached and fresh
    if (!queryCache.isStale(keyStr, staleTime)) {
        const cached = queryCache.get(keyStr);
        if (cached?.data)
            return cached.data;
    }
    // Fetch and cache
    try {
        const result = await options.fetcher();
        queryCache.set(keyStr, result, undefined, cacheTime);
        return result;
    }
    catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        queryCache.set(keyStr, undefined, e, cacheTime);
        throw e;
    }
}
//# sourceMappingURL=data-layer.js.map
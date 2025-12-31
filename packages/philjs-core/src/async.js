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
import { signal, effect, batch, untrack } from './signals.js';
const cache = new Map();
const pendingRequests = new Map();
const subscribers = new Map();
/**
 * Get cached data
 */
export function getCached(key) {
    const entry = cache.get(key);
    if (!entry)
        return undefined;
    return entry.data;
}
/**
 * Set cache data
 */
export function setCache(key, data, ttl) {
    const entry = {
        data,
        timestamp: Date.now(),
        ...(ttl !== undefined && { staleAt: Date.now() + ttl }),
    };
    cache.set(key, entry);
    notifySubscribers(key);
}
/**
 * Invalidate cache
 */
export function invalidateCache(keyOrPattern) {
    if (typeof keyOrPattern === 'string') {
        cache.delete(keyOrPattern);
        notifySubscribers(keyOrPattern);
    }
    else {
        for (const key of cache.keys()) {
            if (keyOrPattern.test(key)) {
                cache.delete(key);
                notifySubscribers(key);
            }
        }
    }
}
/**
 * Clear all cache
 */
export function clearCache() {
    cache.clear();
    for (const key of subscribers.keys()) {
        notifySubscribers(key);
    }
}
/**
 * Subscribe to cache changes
 */
function subscribeToCache(key, callback) {
    if (!subscribers.has(key)) {
        subscribers.set(key, new Set());
    }
    subscribers.get(key).add(callback);
    return () => {
        subscribers.get(key)?.delete(callback);
    };
}
/**
 * Notify cache subscribers
 */
function notifySubscribers(key) {
    const subs = subscribers.get(key);
    if (subs) {
        for (const callback of subs) {
            callback();
        }
    }
}
// =============================================================================
// Core Async Functions
// =============================================================================
/**
 * Create an async resource with advanced features
 */
export function createAsync(fetcher, options = {}) {
    const state = signal({
        data: options.initialData,
        error: undefined,
        loading: false,
        status: options.initialData ? 'success' : 'idle',
    });
    let abortController = null;
    let retryCount = 0;
    let refetchTimer = null;
    const execute = async () => {
        // Check cache first
        if (options.cache) {
            const cached = cache.get(options.cache.key);
            if (cached) {
                const isStale = cached.staleAt && Date.now() > cached.staleAt;
                if (!isStale || options.keepPreviousData) {
                    state.set((s) => ({ ...s, data: cached.data, status: 'success' }));
                    if (!isStale)
                        return cached.data;
                }
            }
        }
        // Check for pending dedupe
        if (options.dedupe && options.cache) {
            const pending = pendingRequests.get(options.cache.key);
            if (pending)
                return pending;
        }
        // Cancel previous request
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        state.set((s) => ({
            ...s,
            loading: true,
            status: 'pending',
            data: options.keepPreviousData ? s.data : (getPlaceholderData() ?? s.data),
        }));
        const fetchPromise = (async () => {
            try {
                // Apply timeout
                const timeoutPromise = options.timeout
                    ? new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), options.timeout))
                    : null;
                const result = await (timeoutPromise
                    ? Promise.race([fetcher(), timeoutPromise])
                    : fetcher());
                // Cache result
                if (options.cache) {
                    setCache(options.cache.key, result, options.cache.ttl);
                }
                state.set({
                    data: result,
                    error: undefined,
                    loading: false,
                    status: 'success',
                });
                options.onSuccess?.(result);
                options.onSettled?.(result, undefined);
                retryCount = 0;
                return result;
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                // Retry logic
                if (options.retry && retryCount < options.retry.count) {
                    const shouldRetry = options.retry.condition?.(err, retryCount) ?? true;
                    if (shouldRetry) {
                        retryCount++;
                        const delay = typeof options.retry.delay === 'function'
                            ? options.retry.delay(retryCount)
                            : options.retry.delay;
                        await new Promise((r) => setTimeout(r, delay));
                        return execute();
                    }
                }
                state.set((s) => ({
                    ...s,
                    error: err,
                    loading: false,
                    status: 'error',
                }));
                options.onError?.(err);
                options.onSettled?.(undefined, err);
                throw err;
            }
            finally {
                if (options.cache) {
                    pendingRequests.delete(options.cache.key);
                }
            }
        })();
        // Store pending request for deduplication
        if (options.dedupe && options.cache) {
            pendingRequests.set(options.cache.key, fetchPromise);
        }
        return fetchPromise;
    };
    const getPlaceholderData = () => {
        if (options.placeholderData) {
            return typeof options.placeholderData === 'function'
                ? options.placeholderData()
                : options.placeholderData;
        }
        return undefined;
    };
    // Setup refetch on focus
    if (options.refetchOnFocus && typeof window !== 'undefined') {
        const handleFocus = () => {
            execute().catch(() => { });
        };
        window.addEventListener('focus', handleFocus);
    }
    // Setup refetch interval
    if (options.refetchInterval) {
        refetchTimer = setInterval(() => {
            execute().catch(() => { });
        }, options.refetchInterval);
    }
    // Subscribe to cache changes
    if (options.cache) {
        subscribeToCache(options.cache.key, () => {
            const cached = cache.get(options.cache.key);
            if (cached) {
                state.set((s) => ({ ...s, data: cached.data }));
            }
        });
    }
    return {
        data: () => state().data,
        error: () => state().error,
        loading: () => state().loading,
        status: () => state().status,
        refetch: execute,
        mutate: (data) => {
            const newData = typeof data === 'function'
                ? data(state().data)
                : data;
            state.set((s) => ({ ...s, data: newData }));
            if (options.cache) {
                setCache(options.cache.key, newData, options.cache.ttl);
            }
        },
    };
}
/**
 * Create a mutation with optimistic updates
 */
export function createMutation(mutator, options = {}) {
    const state = signal({
        data: undefined,
        error: undefined,
        loading: false,
    });
    let previousData;
    const mutate = async (variables) => {
        state.set((s) => ({ ...s, loading: true, error: undefined }));
        // Apply optimistic update
        if (options.optimisticUpdate) {
            previousData = state().data;
            const optimisticData = options.optimisticUpdate(variables);
            state.set((s) => ({ ...s, data: optimisticData }));
        }
        try {
            const result = await mutator(variables);
            state.set({
                data: result,
                error: undefined,
                loading: false,
            });
            options.onSuccess?.(result, variables);
            // Invalidate cache
            if (options.invalidate) {
                for (const key of options.invalidate) {
                    invalidateCache(key);
                }
            }
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            // Rollback optimistic update
            const rollback = () => {
                if (previousData !== undefined) {
                    state.set((s) => ({ ...s, data: previousData }));
                }
            };
            state.set((s) => ({ ...s, error: err, loading: false }));
            options.onError?.(err, variables, rollback);
            throw err;
        }
    };
    return {
        mutate,
        data: () => state().data,
        error: () => state().error,
        loading: () => state().loading,
        reset: () => {
            state.set({ data: undefined, error: undefined, loading: false });
        },
    };
}
// =============================================================================
// Parallel & Waterfall
// =============================================================================
/**
 * Fetch multiple resources in parallel
 */
export async function parallel(fetchers) {
    const results = await Promise.all(fetchers.map((f) => f()));
    return results;
}
/**
 * Fetch resources in sequence (waterfall)
 */
export async function waterfall(fetchers, initial) {
    let result = initial;
    for (const fetcher of fetchers) {
        result = await fetcher(result);
    }
    return result;
}
/**
 * Race multiple fetchers, return first successful result
 */
export async function race(fetchers, options) {
    const promises = fetchers.map((f) => f());
    if (options?.timeout) {
        promises.push(new Promise((_, reject) => setTimeout(() => reject(new Error('Race timeout')), options.timeout)));
    }
    return Promise.race(promises);
}
/**
 * Fetch with automatic retry and exponential backoff
 */
export async function fetchWithRetry(fetcher, options = { count: 3, delay: 1000 }) {
    let lastError;
    for (let attempt = 0; attempt <= options.count; attempt++) {
        try {
            return await fetcher();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < options.count) {
                const shouldRetry = options.condition?.(lastError, attempt) ?? true;
                if (!shouldRetry)
                    throw lastError;
                const delay = typeof options.delay === 'function'
                    ? options.delay(attempt)
                    : options.delay * Math.pow(2, attempt); // Exponential backoff
                await new Promise((r) => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}
// =============================================================================
// Suspense-like Primitives
// =============================================================================
const suspenseCache = new Map();
/**
 * Create a suspense-like resource that throws promises
 */
export function createSuspenseResource(key, fetcher) {
    return () => {
        let entry = suspenseCache.get(key);
        if (!entry) {
            const promise = fetcher().then((result) => {
                entry.result = result;
            }, (error) => {
                entry.error = error;
            });
            entry = { promise };
            suspenseCache.set(key, entry);
        }
        if (entry.error) {
            throw entry.error;
        }
        if (entry.result !== undefined) {
            return entry.result;
        }
        throw entry.promise;
    };
}
/**
 * Preload a suspense resource
 */
export function preload(key, fetcher) {
    if (!suspenseCache.has(key)) {
        const promise = fetcher().then((result) => {
            const entry = suspenseCache.get(key);
            entry.result = result;
        }, (error) => {
            const entry = suspenseCache.get(key);
            entry.error = error;
        });
        suspenseCache.set(key, { promise });
    }
}
// =============================================================================
// Debounce & Throttle
// =============================================================================
/**
 * Create a debounced async function
 */
export function debounceAsync(fn, delay) {
    let timeout;
    let deferred = null;
    return (...args) => {
        clearTimeout(timeout);
        if (!deferred) {
            deferred = Promise.withResolvers();
        }
        const currentDeferred = deferred;
        timeout = setTimeout(async () => {
            try {
                const result = await fn(...args);
                currentDeferred.resolve(result);
            }
            catch (error) {
                currentDeferred.reject(error instanceof Error ? error : new Error(String(error)));
            }
            finally {
                deferred = null;
            }
        }, delay);
        return currentDeferred.promise;
    };
}
/**
 * Create a throttled async function
 */
export function throttleAsync(fn, limit) {
    let lastRun = 0;
    let pendingPromise = null;
    return async (...args) => {
        const now = Date.now();
        const timeSinceLastRun = now - lastRun;
        if (timeSinceLastRun >= limit) {
            lastRun = now;
            return fn(...args);
        }
        if (!pendingPromise) {
            pendingPromise = new Promise((resolve) => {
                setTimeout(async () => {
                    lastRun = Date.now();
                    const result = await fn(...args);
                    pendingPromise = null;
                    resolve(result);
                }, limit - timeSinceLastRun);
            });
        }
        return pendingPromise;
    };
}
// =============================================================================
// Queue & Concurrency
// =============================================================================
/**
 * Create a queue for sequential async operations
 */
export function createQueue() {
    const queue = [];
    let processing = false;
    const processQueue = async () => {
        if (processing || queue.length === 0)
            return;
        processing = true;
        while (queue.length > 0) {
            const { task, resolve, reject } = queue.shift();
            try {
                const result = await task();
                resolve(result);
            }
            catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        }
        processing = false;
    };
    return {
        add: (task) => {
            return new Promise((resolve, reject) => {
                queue.push({ task, resolve, reject });
                processQueue();
            });
        },
        clear: () => {
            queue.length = 0;
        },
        size: () => queue.length,
    };
}
/**
 * Limit concurrent async operations
 */
export function createConcurrencyLimiter(limit) {
    let active = 0;
    const waiting = [];
    const run = async (task) => {
        while (active >= limit) {
            await new Promise((resolve) => waiting.push(resolve));
        }
        active++;
        try {
            return await task();
        }
        finally {
            active--;
            if (waiting.length > 0) {
                const next = waiting.shift();
                next();
            }
        }
    };
    return {
        run,
        active: () => active,
    };
}
//# sourceMappingURL=async.js.map
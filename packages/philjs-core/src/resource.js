/**
 * Advanced resource primitive for async data management (SolidStart-style).
 * Provides Suspense integration, dependent resources, and preloading.
 */
import { signal, memo, effect, batch, onCleanup, untrack } from './signals.js';
// ============================================================================
// Suspense Integration
// ============================================================================
const SuspenseContext = {
    active: false,
    promises: new Set(),
};
/**
 * Enable Suspense mode for resources
 */
export function enableSuspense() {
    SuspenseContext.active = true;
}
/**
 * Disable Suspense mode for resources
 */
export function disableSuspense() {
    SuspenseContext.active = false;
    SuspenseContext.promises.clear();
}
/**
 * Check if currently in Suspense mode
 */
export function isSuspenseActive() {
    return SuspenseContext.active;
}
/**
 * Track a promise for Suspense
 */
function trackSuspensePromise(promise) {
    if (SuspenseContext.active) {
        SuspenseContext.promises.add(promise);
        SuspenseContext.increment?.();
        promise.finally(() => {
            SuspenseContext.promises.delete(promise);
            SuspenseContext.decrement?.();
        });
    }
}
export function createResource(sourceOrFetcher, fetcherOrOptions, maybeOptions) {
    // Determine arguments
    let source;
    let fetcher;
    let options = {};
    if (typeof fetcherOrOptions === 'function') {
        // createResource(source, fetcher, options?)
        source = typeof sourceOrFetcher === 'function'
            ? sourceOrFetcher
            : () => sourceOrFetcher;
        fetcher = fetcherOrOptions;
        options = maybeOptions || {};
    }
    else {
        // createResource(fetcher, options?)
        fetcher = sourceOrFetcher;
        options = fetcherOrOptions || {};
    }
    // State signals
    const value = signal(options.initialValue);
    const error = signal(undefined);
    const loading = signal(false);
    const state = signal('unresolved');
    let latest = options.initialValue;
    let scheduled = false;
    let resolved = false;
    // Track ongoing fetch
    let currentFetch = null;
    let fetchCounter = 0;
    /**
     * Load the resource
     */
    const load = (refetchInfo) => {
        // Get source value
        const sourceValue = source ? source() : true;
        if (sourceValue == null) {
            return undefined;
        }
        const fetchId = ++fetchCounter;
        // Call fetcher
        const fetcherInfo = {
            value: value(),
            refetching: refetchInfo !== undefined ? refetchInfo : (state() === 'refreshing'),
        };
        let result;
        try {
            result = fetcher(sourceValue, fetcherInfo);
        }
        catch (err) {
            error.set(err instanceof Error ? err : new Error(String(err)));
            state.set('errored');
            loading.set(false);
            return undefined;
        }
        // Handle synchronous result
        if (!(result instanceof Promise)) {
            batch(() => {
                value.set(result);
                latest = result;
                error.set(undefined);
                state.set('ready');
                loading.set(false);
            });
            resolved = true;
            return result;
        }
        // Handle async result
        currentFetch = result;
        scheduled = false;
        if (!resolved) {
            state.set('pending');
        }
        else {
            state.set('refreshing');
        }
        loading.set(true);
        // Track for Suspense
        trackSuspensePromise(result);
        result
            .then((data) => {
            // Ignore if this isn't the latest fetch
            if (fetchId !== fetchCounter)
                return;
            batch(() => {
                value.set(data);
                latest = data;
                error.set(undefined);
                state.set('ready');
                loading.set(false);
            });
            resolved = true;
            currentFetch = null;
        })
            .catch((err) => {
            // Ignore if this isn't the latest fetch
            if (fetchId !== fetchCounter)
                return;
            batch(() => {
                error.set(err instanceof Error ? err : new Error(String(err)));
                state.set('errored');
                loading.set(false);
            });
            currentFetch = null;
        });
        return result;
    };
    /**
     * Refetch the resource
     */
    const refetch = (info) => {
        return load(info);
    };
    /**
     * Mutate the resource value directly
     */
    const mutate = (nextValue) => {
        batch(() => {
            value.set(nextValue);
            latest = nextValue;
            if (nextValue !== undefined) {
                state.set('ready');
                error.set(undefined);
            }
        });
        return nextValue;
    };
    // Set up auto-refetch when source changes
    let lastSourceValue = null;
    let firstRun = true;
    if (source) {
        // Use effect to track source dependencies and re-run when they change
        effect(() => {
            const val = source();
            // Skip the first run - initial load handles that
            if (firstRun) {
                firstRun = false;
                lastSourceValue = val;
                return;
            }
            // Trigger refetch when source changes (from null to value, or value to different value)
            const sourceChanged = val !== lastSourceValue && (val != null || lastSourceValue != null);
            if (sourceChanged && !scheduled) {
                scheduled = true;
                Promise.resolve().then(() => {
                    if (scheduled) {
                        load();
                    }
                });
            }
            lastSourceValue = val;
        });
    }
    // Initial load (unless deferred)
    if (!options.deferStream) {
        load();
    }
    // Create the resource accessor
    const read = (() => {
        const currentValue = value();
        const currentError = error();
        const currentState = state();
        // Throw to Suspense if pending
        if (SuspenseContext.active && currentFetch && currentState === 'pending') {
            throw currentFetch;
        }
        // Throw error
        if (currentError) {
            throw currentError;
        }
        return currentValue;
    });
    // Attach properties
    Object.defineProperty(read, 'loading', {
        get: () => loading(),
        enumerable: true,
    });
    Object.defineProperty(read, 'error', {
        get: () => error(),
        enumerable: true,
    });
    Object.defineProperty(read, 'latest', {
        get: () => latest,
        enumerable: true,
    });
    Object.defineProperty(read, 'state', {
        get: () => state(),
        enumerable: true,
    });
    // Return tuple: [resource, actions]
    return [read, { mutate, refetch }];
}
// ============================================================================
// Dependent Resources
// ============================================================================
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
export function createDependentResource(source, fetcher, options) {
    // Wrap source to handle null/undefined
    const safeSource = () => {
        const val = source();
        return val ?? null;
    };
    return createResource(safeSource, fetcher, options);
}
// ============================================================================
// Preloading
// ============================================================================
const preloadCache = new Map();
const PRELOAD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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
export function preload(key, fetcher) {
    // Check cache
    const cached = preloadCache.get(key);
    if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_TTL) {
        if (cached.error) {
            return Promise.reject(cached.error);
        }
        if (cached.result !== undefined) {
            return Promise.resolve(cached.result);
        }
        return cached.promise;
    }
    // Fetch
    let promise;
    try {
        const result = fetcher();
        promise = result instanceof Promise ? result : Promise.resolve(result);
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        preloadCache.set(key, {
            promise: Promise.reject(error),
            error,
            timestamp: Date.now(),
        });
        return Promise.reject(error);
    }
    // Cache promise
    const entry = {
        promise,
        timestamp: Date.now(),
    };
    preloadCache.set(key, entry);
    // Cache result/error
    promise
        .then((result) => {
        entry.result = result;
    })
        .catch((err) => {
        entry.error = err instanceof Error ? err : new Error(String(err));
    });
    return promise;
}
/**
 * Get preloaded data if available
 */
export function getPreloaded(key) {
    const cached = preloadCache.get(key);
    if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_TTL) {
        return cached.result;
    }
    return undefined;
}
/**
 * Clear preload cache
 */
export function clearPreloadCache(key) {
    if (key) {
        preloadCache.delete(key);
    }
    else {
        preloadCache.clear();
    }
}
// ============================================================================
// Utilities
// ============================================================================
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
export function refetchResources(predicate) {
    // This would require tracking all resources
    // For now, this is a placeholder for the pattern
    console.warn('refetchResources is not yet implemented. Track resources manually.');
}
export function createResourceWithRetry(sourceOrFetcher, fetcherOrOptions, maybeOptions) {
    const maxRetries = (maybeOptions?.maxRetries ?? fetcherOrOptions?.maxRetries ?? 3);
    const retryDelay = (maybeOptions?.retryDelay ?? fetcherOrOptions?.retryDelay ?? 1000);
    const onRetry = (maybeOptions?.onRetry ?? fetcherOrOptions?.onRetry);
    // Wrap fetcher with retry logic
    const retryFetcher = async (source, info) => {
        let lastError = null;
        let attempt = 0;
        const actualFetcher = (typeof fetcherOrOptions === 'function'
            ? fetcherOrOptions
            : sourceOrFetcher);
        while (attempt <= maxRetries) {
            try {
                const result = actualFetcher(source, info);
                return result instanceof Promise ? await result : result;
            }
            catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                if (attempt < maxRetries) {
                    onRetry?.(attempt + 1, lastError);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
                    attempt++;
                }
                else {
                    break;
                }
            }
        }
        throw lastError || new Error('Resource fetch failed');
    };
    // Create resource with retry fetcher
    if (typeof fetcherOrOptions === 'function') {
        return createResource(sourceOrFetcher, retryFetcher, maybeOptions);
    }
    else {
        return createResource(retryFetcher, fetcherOrOptions);
    }
}
//# sourceMappingURL=resource.js.map
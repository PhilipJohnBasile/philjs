/**
 * PhilJS Meta - Caching Strategies
 *
 * Implements advanced caching with:
 * - SWR-style revalidation
 * - ISR (Incremental Static Regeneration)
 * - On-demand revalidation
 * - Cache tags and invalidation
 */
/**
 * Cache store implementation
 */
class CacheStore {
    cache = new Map();
    tagIndex = new Map();
    revalidationPromises = new Map();
    /**
     * Get cached entry
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            entry.isStale = true;
        }
        return entry;
    }
    /**
     * Set cache entry
     */
    set(key, data, options = {}) {
        const now = Date.now();
        const ttl = options.ttl ?? 0;
        const swr = options.swr ?? 0;
        const entry = {
            data,
            cachedAt: now,
            expiresAt: ttl > 0 ? now + ttl * 1000 : null,
            revalidatedAt: now,
            tags: options.tags || [],
            isStale: false,
            isRevalidating: false,
        };
        // Generate ETag
        entry.etag = this.generateETag(data);
        this.cache.set(key, entry);
        // Update tag index
        for (const tag of entry.tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(key);
        }
        // Schedule stale marking if SWR is enabled
        if (swr > 0 && ttl > 0) {
            setTimeout(() => {
                const e = this.cache.get(key);
                if (e && e.cachedAt === now) {
                    e.isStale = true;
                }
            }, ttl * 1000);
        }
        return entry;
    }
    /**
     * Delete cache entry
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            // Remove from tag index
            for (const tag of entry.tags) {
                const tagKeys = this.tagIndex.get(tag);
                if (tagKeys) {
                    tagKeys.delete(key);
                    if (tagKeys.size === 0) {
                        this.tagIndex.delete(tag);
                    }
                }
            }
        }
        return this.cache.delete(key);
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.tagIndex.clear();
        this.revalidationPromises.clear();
    }
    /**
     * Invalidate by tag
     */
    invalidateTag(tag) {
        const keys = this.tagIndex.get(tag);
        const invalidated = [];
        if (keys) {
            for (const key of keys) {
                const entry = this.cache.get(key);
                if (entry) {
                    entry.isStale = true;
                    invalidated.push(key);
                }
            }
        }
        return invalidated;
    }
    /**
     * Invalidate by path pattern
     */
    invalidatePath(pattern) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const invalidated = [];
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                const entry = this.cache.get(key);
                if (entry) {
                    entry.isStale = true;
                    invalidated.push(key);
                }
            }
        }
        return invalidated;
    }
    /**
     * Check if revalidation is in progress
     */
    isRevalidating(key) {
        return this.revalidationPromises.has(key);
    }
    /**
     * Get revalidation promise
     */
    getRevalidationPromise(key) {
        return this.revalidationPromises.get(key);
    }
    /**
     * Set revalidation promise
     */
    setRevalidationPromise(key, promise) {
        this.revalidationPromises.set(key, promise);
        promise.finally(() => {
            this.revalidationPromises.delete(key);
        });
    }
    /**
     * Generate ETag for data
     */
    generateETag(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return `"${Math.abs(hash).toString(16)}"`;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        let staleCount = 0;
        let expiredCount = 0;
        const now = Date.now();
        for (const entry of this.cache.values()) {
            if (entry.isStale)
                staleCount++;
            if (entry.expiresAt && now > entry.expiresAt)
                expiredCount++;
        }
        return {
            size: this.cache.size,
            staleCount,
            expiredCount,
            tagCount: this.tagIndex.size,
            revalidatingCount: this.revalidationPromises.size,
        };
    }
}
// Global cache instance
const globalCache = new CacheStore();
/**
 * Get or fetch data with caching
 */
export async function cached(key, fetcher, options = {}) {
    // Check for no-cache option
    if (options.noCache) {
        return fetcher();
    }
    // Get existing entry
    const entry = globalCache.get(key);
    // Force revalidation
    if (options.forceRevalidate && entry) {
        entry.isStale = true;
    }
    // Return cached data if fresh
    if (entry && !entry.isStale && !entry.isRevalidating) {
        return entry.data;
    }
    // If stale and SWR enabled, return stale data and revalidate in background
    if (entry && entry.isStale && options.swr && options.swr > 0) {
        // Check if already revalidating
        if (!globalCache.isRevalidating(key)) {
            const revalidationPromise = revalidateEntry(key, fetcher, options);
            globalCache.setRevalidationPromise(key, revalidationPromise);
        }
        // Return stale data
        return entry.data;
    }
    // Fetch fresh data
    const data = await fetcher();
    globalCache.set(key, data, options);
    return data;
}
/**
 * Revalidate a cache entry
 */
async function revalidateEntry(key, fetcher, options) {
    const entry = globalCache.get(key);
    if (entry) {
        entry.isRevalidating = true;
    }
    try {
        const data = await fetcher();
        globalCache.set(key, data, options);
        return data;
    }
    catch (error) {
        // Keep stale data on error
        if (entry) {
            entry.isRevalidating = false;
        }
        throw error;
    }
}
/**
 * SWR hook implementation
 */
export function useSWR(key, config) {
    const state = {
        data: config.fallbackData,
        error: undefined,
        isLoading: true,
        isValidating: false,
        mutate: async (dataOrUpdater) => {
            if (typeof dataOrUpdater === 'function') {
                const updater = dataOrUpdater;
                const newData = await updater(state.data);
                globalCache.set(key, newData, { ttl: 0 });
                state.data = newData;
                return newData;
            }
            else if (dataOrUpdater !== undefined) {
                const newData = await Promise.resolve(dataOrUpdater);
                globalCache.set(key, newData, { ttl: 0 });
                state.data = newData;
                return newData;
            }
            else {
                // Revalidate
                state.isValidating = true;
                try {
                    const newData = await config.fetcher();
                    globalCache.set(key, newData, { ttl: 0 });
                    state.data = newData;
                    state.error = undefined;
                    return newData;
                }
                catch (error) {
                    state.error = error instanceof Error ? error : new Error(String(error));
                    return state.data;
                }
                finally {
                    state.isValidating = false;
                }
            }
        },
    };
    // Initial fetch
    const cached = globalCache.get(key);
    if (cached && !cached.isStale) {
        state.data = cached.data;
        state.isLoading = false;
    }
    else {
        // Fetch data
        config.fetcher()
            .then((data) => {
            state.data = data;
            state.error = undefined;
            globalCache.set(key, data, { ttl: 0 });
        })
            .catch((error) => {
            state.error = error instanceof Error ? error : new Error(String(error));
        })
            .finally(() => {
            state.isLoading = false;
        });
    }
    // Set up refresh interval
    if (config.refreshInterval && config.refreshInterval > 0) {
        setInterval(() => {
            state.mutate();
        }, config.refreshInterval);
    }
    return state;
}
/**
 * ISR (Incremental Static Regeneration) manager
 */
export class ISRManager {
    regenerationQueue = new Map();
    pageCache = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Get cached page or trigger regeneration
     */
    async getPage(path, generator) {
        const entry = this.pageCache.get(path);
        if (entry) {
            const now = Date.now();
            const isStale = this.config.revalidate !== false &&
                now - entry.generatedAt > this.config.revalidate * 1000;
            // Trigger background regeneration if stale
            if (isStale && !this.regenerationQueue.has(path)) {
                this.queueRegeneration(path, generator);
            }
            return {
                data: entry.data,
                isStale,
                generatedAt: entry.generatedAt,
            };
        }
        // Generate page for the first time
        const data = await generator();
        this.setPage(path, data);
        return {
            data,
            isStale: false,
            generatedAt: Date.now(),
        };
    }
    /**
     * Set page in cache
     */
    setPage(path, data) {
        this.pageCache.set(path, {
            data,
            generatedAt: Date.now(),
            path,
        });
    }
    /**
     * Queue page regeneration
     */
    async queueRegeneration(path, generator) {
        const promise = (async () => {
            try {
                const data = await generator();
                this.setPage(path, data);
            }
            finally {
                this.regenerationQueue.delete(path);
            }
        })();
        this.regenerationQueue.set(path, promise);
        return promise;
    }
    /**
     * Manually trigger revalidation for a path
     */
    async revalidate(path, generator) {
        // Wait for any existing regeneration
        const existing = this.regenerationQueue.get(path);
        if (existing) {
            await existing;
        }
        const data = await generator();
        this.setPage(path, data);
    }
    /**
     * Invalidate a path
     */
    invalidate(path) {
        return this.pageCache.delete(path);
    }
    /**
     * Invalidate all paths matching a pattern
     */
    invalidatePattern(pattern) {
        const invalidated = [];
        for (const path of this.pageCache.keys()) {
            if (pattern.test(path)) {
                this.pageCache.delete(path);
                invalidated.push(path);
            }
        }
        return invalidated;
    }
    /**
     * Get all cached paths
     */
    getCachedPaths() {
        return Array.from(this.pageCache.keys());
    }
}
/**
 * On-demand revalidation handler
 */
export async function revalidatePath(path) {
    const invalidated = globalCache.invalidatePath(path);
    return invalidated.length > 0;
}
/**
 * Revalidate by tag
 */
export async function revalidateTag(tag) {
    const invalidated = globalCache.invalidateTag(tag);
    return invalidated.length > 0;
}
/**
 * Cache control directives builder
 */
export function cacheControl(options) {
    const directives = [];
    if (options.public)
        directives.push('public');
    if (options.private)
        directives.push('private');
    if (options.noCache)
        directives.push('no-cache');
    if (options.noStore)
        directives.push('no-store');
    if (options.maxAge !== undefined)
        directives.push(`max-age=${options.maxAge}`);
    if (options.sMaxAge !== undefined)
        directives.push(`s-maxage=${options.sMaxAge}`);
    if (options.staleWhileRevalidate !== undefined) {
        directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }
    if (options.staleIfError !== undefined) {
        directives.push(`stale-if-error=${options.staleIfError}`);
    }
    if (options.mustRevalidate)
        directives.push('must-revalidate');
    if (options.proxyRevalidate)
        directives.push('proxy-revalidate');
    if (options.immutable)
        directives.push('immutable');
    return directives.join(', ');
}
/**
 * Unstable cache (experimental Next.js-style caching)
 */
export function unstable_cache(fn, keyParts, options) {
    const keyPrefix = keyParts.join(':');
    return (async (...args) => {
        const key = `${keyPrefix}:${JSON.stringify(args)}`;
        const cacheOpts = {
            swr: options?.revalidate === false ? 0 : 60,
            ...(options?.tags !== undefined ? { tags: options.tags } : {}),
        };
        const ttl = options?.revalidate === false ? 0 : options?.revalidate;
        if (ttl !== undefined)
            cacheOpts.ttl = ttl;
        return cached(key, () => fn(...args), cacheOpts);
    });
}
/**
 * Export cache instance for advanced usage
 */
export const cache = {
    get: (key) => globalCache.get(key),
    set: (key, data, options) => globalCache.set(key, data, options),
    delete: (key) => globalCache.delete(key),
    clear: () => globalCache.clear(),
    invalidateTag: (tag) => globalCache.invalidateTag(tag),
    invalidatePath: (pattern) => globalCache.invalidatePath(pattern),
    getStats: () => globalCache.getStats(),
};
//# sourceMappingURL=cache.js.map
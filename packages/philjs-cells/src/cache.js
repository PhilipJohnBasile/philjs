/**
 * PhilJS Cells - Cache Implementation
 *
 * Provides caching for Cell data with TTL, stale-while-revalidate,
 * and reactive updates via signals.
 */
import { signal } from '@philjs/core';
// ============================================================================
// Cache Implementation
// ============================================================================
/**
 * Default cache TTL (5 minutes)
 */
const DEFAULT_TTL = 5 * 60 * 1000;
/**
 * Cell cache implementation with signal-based reactivity
 */
class CellCacheImpl {
    cache = new Map();
    subscribers = new Map();
    signals = new Map();
    /**
     * Get a cached entry
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        return entry;
    }
    /**
     * Get a reactive signal for a cache key
     */
    getSignal(key) {
        let sig = this.signals.get(key);
        if (!sig) {
            const entry = this.cache.get(key);
            sig = signal(entry?.data ?? null);
            this.signals.set(key, sig);
        }
        return sig;
    }
    /**
     * Set a cached entry
     */
    set(key, data, ttl = DEFAULT_TTL) {
        const entry = {
            data,
            cachedAt: Date.now(),
            ttl,
            isRevalidating: false,
        };
        this.cache.set(key, entry);
        // Update signal if exists
        const sig = this.signals.get(key);
        if (sig) {
            sig.set(data);
        }
        // Notify subscribers
        this.notifySubscribers(key, data);
    }
    /**
     * Mark an entry as revalidating (stale-while-revalidate)
     */
    markRevalidating(key, isRevalidating) {
        const entry = this.cache.get(key);
        if (entry) {
            entry.isRevalidating = isRevalidating;
        }
    }
    /**
     * Delete a cached entry
     */
    delete(key) {
        const existed = this.cache.delete(key);
        // Update signal to null
        const sig = this.signals.get(key);
        if (sig) {
            sig.set(null);
        }
        // Notify subscribers
        this.notifySubscribers(key, null);
        return existed;
    }
    /**
     * Clear all cache or entries matching a pattern
     */
    clear(pattern) {
        if (!pattern) {
            // Clear all
            const keys = Array.from(this.cache.keys());
            this.cache.clear();
            // Update all signals
            for (const sig of this.signals.values()) {
                sig.set(null);
            }
            // Notify all subscribers
            for (const key of keys) {
                this.notifySubscribers(key, null);
            }
            return;
        }
        // Clear matching pattern
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
            // Update signal
            const sig = this.signals.get(key);
            if (sig) {
                sig.set(null);
            }
            // Notify subscribers
            this.notifySubscribers(key, null);
        }
    }
    /**
     * Check if an entry is stale
     */
    isStale(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return true;
        const now = Date.now();
        return now - entry.cachedAt > entry.ttl;
    }
    /**
     * Check if an entry exists and is fresh
     */
    isFresh(key) {
        return !this.isStale(key);
    }
    /**
     * Subscribe to cache changes for a key
     */
    subscribe(key, callback) {
        let subs = this.subscribers.get(key);
        if (!subs) {
            subs = new Set();
            this.subscribers.set(key, subs);
        }
        subs.add(callback);
        // Return unsubscribe function
        return () => {
            subs.delete(callback);
            if (subs.size === 0) {
                this.subscribers.delete(key);
            }
        };
    }
    /**
     * Get all cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Notify subscribers of a change
     */
    notifySubscribers(key, data) {
        const subs = this.subscribers.get(key);
        if (subs) {
            for (const callback of subs) {
                try {
                    callback(data);
                }
                catch (error) {
                    console.error('[CellCache] Subscriber error:', error);
                }
            }
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        let freshCount = 0;
        let staleCount = 0;
        let revalidatingCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (this.isStale(key)) {
                staleCount++;
            }
            else {
                freshCount++;
            }
            if (entry.isRevalidating) {
                revalidatingCount++;
            }
        }
        return {
            size: this.cache.size,
            freshCount,
            staleCount,
            revalidatingCount,
            subscriberCount: this.subscribers.size,
        };
    }
    /**
     * Garbage collect stale entries
     */
    gc() {
        let collected = 0;
        const staleKeys = [];
        for (const key of this.cache.keys()) {
            if (this.isStale(key)) {
                staleKeys.push(key);
            }
        }
        for (const key of staleKeys) {
            // Only delete if no subscribers
            if (!this.subscribers.has(key)) {
                this.cache.delete(key);
                this.signals.delete(key);
                collected++;
            }
        }
        return collected;
    }
}
// ============================================================================
// Singleton Cache Instance
// ============================================================================
/**
 * Global cell cache instance
 */
export const cellCache = new CellCacheImpl();
// ============================================================================
// Cache Utilities
// ============================================================================
/**
 * Create a scoped cache for isolation (useful for testing)
 */
export function createScopedCache() {
    return new CellCacheImpl();
}
/**
 * Warm up cache with pre-fetched data
 *
 * @example
 * ```tsx
 * // On server
 * const users = await fetchUsers();
 * warmCache({
 *   'cell:users:': users,
 *   'cell:config:': appConfig,
 * });
 * ```
 */
export function warmCache(data, ttl) {
    for (const [key, value] of Object.entries(data)) {
        cellCache.set(key, value, ttl);
    }
}
/**
 * Create a cache key for a cell
 */
export function createCellCacheKey(cellName, variables = {}) {
    const varsStr = Object.keys(variables).length > 0
        ? ':' + JSON.stringify(variables, Object.keys(variables).sort())
        : '';
    return `cell:${cellName}${varsStr}`;
}
/**
 * Batch invalidate multiple cache keys
 */
export function batchInvalidate(keys) {
    for (const key of keys) {
        cellCache.clear(key);
    }
}
/**
 * Set up automatic garbage collection
 */
export function setupCacheGC(intervalMs = 60000) {
    const interval = setInterval(() => {
        cellCache.gc();
    }, intervalMs);
    return () => clearInterval(interval);
}
// ============================================================================
// Development Helpers
// ============================================================================
/**
 * Get cache contents for debugging
 */
export function inspectCache() {
    const result = {};
    for (const key of cellCache.keys()) {
        const entry = cellCache.get(key);
        if (entry) {
            result[key] = entry;
        }
    }
    return result;
}
/**
 * Log cache stats to console
 */
export function logCacheStats() {
    const stats = cellCache.getStats();
    console.group('[CellCache] Stats');
    console.log(`Size: ${stats.size}`);
    console.log(`Fresh: ${stats.freshCount}`);
    console.log(`Stale: ${stats.staleCount}`);
    console.log(`Revalidating: ${stats.revalidatingCount}`);
    console.log(`Subscribers: ${stats.subscriberCount}`);
    console.groupEnd();
}
//# sourceMappingURL=cache.js.map
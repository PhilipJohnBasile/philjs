/**
 * PhilJS Cells - Cache Implementation
 *
 * Provides caching for Cell data with TTL, stale-while-revalidate,
 * and reactive updates via signals.
 */
import { type Signal } from 'philjs-core';
import type { CellCache, CellCacheEntry } from './types.js';
/**
 * Cell cache implementation with signal-based reactivity
 */
declare class CellCacheImpl implements CellCache {
    private cache;
    private subscribers;
    private signals;
    /**
     * Get a cached entry
     */
    get<T>(key: string): CellCacheEntry<T> | null;
    /**
     * Get a reactive signal for a cache key
     */
    getSignal<T>(key: string): Signal<T | null>;
    /**
     * Set a cached entry
     */
    set<T>(key: string, data: T, ttl?: number): void;
    /**
     * Mark an entry as revalidating (stale-while-revalidate)
     */
    markRevalidating(key: string, isRevalidating: boolean): void;
    /**
     * Delete a cached entry
     */
    delete(key: string): boolean;
    /**
     * Clear all cache or entries matching a pattern
     */
    clear(pattern?: string | RegExp): void;
    /**
     * Check if an entry is stale
     */
    isStale(key: string): boolean;
    /**
     * Check if an entry exists and is fresh
     */
    isFresh(key: string): boolean;
    /**
     * Subscribe to cache changes for a key
     */
    subscribe(key: string, callback: (data: unknown) => void): () => void;
    /**
     * Get all cache keys
     */
    keys(): string[];
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Notify subscribers of a change
     */
    private notifySubscribers;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Garbage collect stale entries
     */
    gc(): number;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    size: number;
    freshCount: number;
    staleCount: number;
    revalidatingCount: number;
    subscriberCount: number;
}
/**
 * Global cell cache instance
 */
export declare const cellCache: CellCacheImpl;
/**
 * Create a scoped cache for isolation (useful for testing)
 */
export declare function createScopedCache(): CellCache;
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
export declare function warmCache(data: Record<string, unknown>, ttl?: number): void;
/**
 * Create a cache key for a cell
 */
export declare function createCellCacheKey(cellName: string, variables?: Record<string, unknown>): string;
/**
 * Batch invalidate multiple cache keys
 */
export declare function batchInvalidate(keys: (string | RegExp)[]): void;
/**
 * Set up automatic garbage collection
 */
export declare function setupCacheGC(intervalMs?: number): () => void;
/**
 * Get cache contents for debugging
 */
export declare function inspectCache(): Record<string, CellCacheEntry<unknown>>;
/**
 * Log cache stats to console
 */
export declare function logCacheStats(): void;
export {};
//# sourceMappingURL=cache.d.ts.map
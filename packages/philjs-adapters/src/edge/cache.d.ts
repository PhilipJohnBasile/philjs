/**
 * PhilJS Edge Cache - Edge Caching with Stale-While-Revalidate
 *
 * Provides unified caching capabilities across edge platforms:
 * - In-memory caching with LRU eviction
 * - Stale-while-revalidate pattern
 * - Edge KV store abstraction
 * - Cache tags for invalidation
 * - Automatic asset optimization caching
 */
import { type EdgeKVNamespace } from './edge-runtime.js';
export interface CacheEntry<T = unknown> {
    /** Cached value */
    value: T;
    /** When the entry was created */
    createdAt: number;
    /** When the entry expires (stale) */
    staleAt: number;
    /** When the entry should be deleted */
    expiresAt: number;
    /** Cache tags for invalidation */
    tags?: string[];
    /** ETag for conditional requests */
    etag?: string;
    /** Last modified timestamp */
    lastModified?: number;
}
export interface CacheOptions {
    /** Time-to-live in seconds (before stale) */
    ttl?: number;
    /** Stale-while-revalidate window in seconds */
    swr?: number;
    /** Cache tags for invalidation */
    tags?: string[];
    /** Custom cache key */
    key?: string;
    /** Whether to cache errors */
    cacheErrors?: boolean;
}
export interface EdgeCacheConfig {
    /** Default TTL in seconds */
    defaultTTL?: number;
    /** Default SWR window in seconds */
    defaultSWR?: number;
    /** Maximum entries in memory cache */
    maxEntries?: number;
    /** Maximum memory size in bytes */
    maxSize?: number;
    /** KV namespace for persistent cache (Cloudflare/Deno) */
    kvNamespace?: EdgeKVNamespace | string;
    /** Cache key prefix */
    keyPrefix?: string;
}
export interface CacheStats {
    /** Number of cache hits */
    hits: number;
    /** Number of cache misses */
    misses: number;
    /** Number of stale hits (SWR) */
    staleHits: number;
    /** Number of revalidations */
    revalidations: number;
    /** Current number of entries */
    entries: number;
    /** Approximate memory usage */
    memoryUsage: number;
}
export interface EdgeKVStore {
    get<T>(key: string): Promise<CacheEntry<T> | null>;
    set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
    delete(key: string): Promise<void>;
    deleteByPrefix(prefix: string): Promise<number>;
}
export declare class EdgeCache {
    private memoryCache;
    private kvStore?;
    private revalidating;
    private config;
    constructor(config?: EdgeCacheConfig);
    private initKVStore;
    private getFullKey;
    /**
     * Get a value from cache with SWR support
     */
    get<T>(key: string, revalidate?: () => Promise<T>): Promise<{
        value: T | undefined;
        stale: boolean;
        hit: boolean;
    }>;
    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    /**
     * Delete a value from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Invalidate cache entries by tag
     */
    invalidateByTag(tag: string): Promise<number>;
    /**
     * Clear all cache entries
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Wrap a function with caching
     */
    wrap<T, A extends unknown[]>(fn: (...args: A) => Promise<T>, options?: CacheOptions & {
        keyGenerator?: (...args: A) => string;
    }): (...args: A) => Promise<T>;
    private generateETag;
}
export interface ResponseCacheOptions extends CacheOptions {
    /** Cache based on these headers */
    varyHeaders?: string[];
    /** Only cache specific status codes */
    statusCodes?: number[];
    /** Skip caching for these paths */
    excludePaths?: string[];
}
/**
 * Create a cache key from a request
 */
export declare function createCacheKey(request: Request, options?: ResponseCacheOptions): string;
/**
 * Check if a response should be cached
 */
export declare function shouldCacheResponse(request: Request, response: Response, options?: ResponseCacheOptions): boolean;
/**
 * Create cached response with proper headers
 */
export declare function createCachedResponse(response: Response, entry: CacheEntry<ArrayBuffer>, options?: ResponseCacheOptions): Promise<Response>;
/**
 * Create a caching middleware for edge handlers
 */
export declare function createCacheMiddleware(cache: EdgeCache, options?: ResponseCacheOptions): (request: Request, next: () => Promise<Response>) => Promise<Response>;
export interface AssetCacheOptions {
    /** Maximum asset size to cache (bytes) */
    maxAssetSize?: number;
    /** TTL for different asset types */
    ttlByType?: Record<string, number>;
    /** Transform function for assets */
    transform?: (asset: ArrayBuffer, contentType: string) => Promise<ArrayBuffer>;
}
/**
 * Create an asset caching layer
 */
export declare function createAssetCache(cache: EdgeCache, options?: AssetCacheOptions): {
    get: (url: string) => Promise<{
        body: ArrayBuffer;
        contentType: string;
    } | null>;
    set: (url: string, body: ArrayBuffer, contentType: string) => Promise<void>;
    middleware: (request: Request, next: () => Promise<Response>) => Promise<Response>;
};
/**
 * Get or create the default cache instance
 */
export declare function getDefaultCache(config?: EdgeCacheConfig): EdgeCache;
/**
 * Reset the default cache (useful for testing)
 */
export declare function resetDefaultCache(): void;
declare const _default: {
    EdgeCache: typeof EdgeCache;
    createCacheKey: typeof createCacheKey;
    shouldCacheResponse: typeof shouldCacheResponse;
    createCachedResponse: typeof createCachedResponse;
    createCacheMiddleware: typeof createCacheMiddleware;
    createAssetCache: typeof createAssetCache;
    getDefaultCache: typeof getDefaultCache;
    resetDefaultCache: typeof resetDefaultCache;
};
export default _default;
//# sourceMappingURL=cache.d.ts.map
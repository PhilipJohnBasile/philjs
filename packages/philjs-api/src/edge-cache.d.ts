/**
 * PhilJS Edge Caching
 *
 * Edge caching utilities for optimal performance.
 * Supports Cache API, stale-while-revalidate, and cache purging.
 *
 * Features:
 * - Edge Cache API integration
 * - Cache-Control header management
 * - Stale-while-revalidate at edge
 * - Cache purging utilities
 * - Cache key generation
 * - Conditional requests (ETags, Last-Modified)
 */
import type { EdgeMiddleware, EdgeContext } from './edge-middleware.js';
export interface CacheOptions {
    /** Cache key (defaults to request URL) */
    key?: string;
    /** Cache TTL in seconds */
    ttl?: number;
    /** Stale-while-revalidate time in seconds */
    swr?: number;
    /** Cache tags for purging */
    tags?: string[];
    /** Vary headers */
    vary?: string[];
    /** Custom cache matcher */
    match?: (context: EdgeContext) => boolean;
    /** Custom cache key generator */
    generateKey?: (context: EdgeContext) => string;
}
export interface CacheControlOptions {
    /** Max age in seconds */
    maxAge?: number;
    /** S-maxage (shared cache) in seconds */
    sMaxAge?: number;
    /** Stale-while-revalidate in seconds */
    staleWhileRevalidate?: number;
    /** Stale-if-error in seconds */
    staleIfError?: number;
    /** Public or private */
    visibility?: 'public' | 'private';
    /** No cache */
    noCache?: boolean;
    /** No store */
    noStore?: boolean;
    /** Must revalidate */
    mustRevalidate?: boolean;
    /** Immutable */
    immutable?: boolean;
}
export interface CacheEntry {
    response: Response;
    timestamp: number;
    ttl: number;
    tags?: string[];
}
export interface CacheStore {
    get(key: string): Promise<Response | undefined>;
    put(key: string, response: Response, options?: CacheOptions): Promise<void>;
    delete(key: string): Promise<void>;
    purge(tags: string[]): Promise<void>;
}
/**
 * Edge caching middleware
 */
export declare function edgeCacheMiddleware(options?: CacheOptions & {
    store?: CacheStore;
}): EdgeMiddleware;
/**
 * Generate cache key
 */
export declare function generateCacheKey(context: EdgeContext, options?: CacheOptions): string;
/**
 * Set Cache-Control headers
 */
export declare function cacheControlMiddleware(options: CacheControlOptions): EdgeMiddleware;
/**
 * Generate ETag from content
 */
export declare function generateETag(content: string | ArrayBuffer): string;
/**
 * ETag middleware for conditional requests
 */
export declare function etagMiddleware(): EdgeMiddleware;
/**
 * Last-Modified middleware
 */
export declare function lastModifiedMiddleware(getLastModified: (context: EdgeContext) => Date): EdgeMiddleware;
/**
 * Purge cache by tags
 */
export declare function purgeCacheTags(tags: string[], store?: CacheStore): Promise<void>;
/**
 * Purge cache by key
 */
export declare function purgeCacheKey(key: string, store?: CacheStore): Promise<void>;
/**
 * Purge all caches
 */
export declare function purgeAllCache(cacheName?: string): Promise<void>;
export interface CloudflareCacheOptions {
    /** Cache everything (including HTML) */
    cacheEverything?: boolean;
    /** Cache TTL */
    cacheTtl?: number;
    /** Cache TTL by status */
    cacheTtlByStatus?: Record<number, number>;
    /** Cache key */
    cacheKey?: string;
}
/**
 * Cloudflare cache middleware
 */
export declare function cloudflareCacheMiddleware(options?: CloudflareCacheOptions): EdgeMiddleware;
/**
 * Add Vary headers middleware
 */
export declare function varyMiddleware(headers: string[]): EdgeMiddleware;
/**
 * Static asset caching preset
 */
export declare function staticAssetCache(): EdgeMiddleware;
/**
 * API response caching preset
 */
export declare function apiCache(ttl?: number, swr?: number): EdgeMiddleware;
/**
 * Page caching preset with SWR
 */
export declare function pageCache(ttl?: number, swr?: number): EdgeMiddleware;
//# sourceMappingURL=edge-cache.d.ts.map
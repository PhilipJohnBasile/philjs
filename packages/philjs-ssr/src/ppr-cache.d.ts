/**
 * Edge Caching Strategies for PPR
 *
 * Provides various caching implementations optimized for edge computing:
 * - In-memory caching with LRU eviction
 * - Redis-based distributed caching
 * - CDN integration patterns
 * - Cache invalidation strategies
 */
import type { PPRCache, StaticShell, CacheStats, EdgeCachingStrategy } from "./ppr-types.js";
/**
 * LRU (Least Recently Used) cache for static shells
 */
export declare class LRUPPRCache implements PPRCache {
    private cache;
    private maxSize;
    private maxAge;
    private hits;
    private misses;
    constructor(options?: {
        maxSize?: number;
        maxAge?: number;
    });
    get(path: string): Promise<StaticShell | null>;
    set(path: string, shell: StaticShell): Promise<void>;
    has(path: string): Promise<boolean>;
    invalidate(path: string): Promise<void>;
    invalidateAll(): Promise<void>;
    stats(): Promise<CacheStats>;
    /**
     * Prune expired entries
     */
    prune(): number;
}
/**
 * Redis-based distributed cache for PPR shells
 */
export declare class RedisPPRCache implements PPRCache {
    private client;
    private keyPrefix;
    private ttl;
    private hits;
    private misses;
    constructor(client: RedisClientLike, options?: {
        keyPrefix?: string;
        ttl?: number;
    });
    private key;
    get(path: string): Promise<StaticShell | null>;
    set(path: string, shell: StaticShell): Promise<void>;
    has(path: string): Promise<boolean>;
    invalidate(path: string): Promise<void>;
    invalidateAll(): Promise<void>;
    stats(): Promise<CacheStats>;
    /**
     * Invalidate by pattern (e.g., "/blog/*")
     */
    invalidatePattern(pattern: string): Promise<number>;
    /**
     * Refresh TTL without refetching
     */
    touch(path: string): Promise<boolean>;
}
interface RedisClientLike {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    del(...keys: string[]): Promise<number>;
    exists(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<number>;
}
/**
 * Controller for edge caching strategies
 */
export declare class EdgeCacheController {
    private strategy;
    private cache;
    private staleTTL;
    constructor(options: {
        strategy?: EdgeCachingStrategy;
        cache: PPRCache;
        staleTTL?: number;
    });
    /**
     * Get shell following the configured strategy
     */
    get(path: string, fetcher: () => Promise<StaticShell>): Promise<{
        shell: StaticShell;
        stale: boolean;
        revalidating: boolean;
    }>;
    /**
     * Stale-while-revalidate strategy
     */
    private staleWhileRevalidate;
    /**
     * Cache-first strategy
     */
    private cacheFirst;
    /**
     * Network-first strategy
     */
    private networkFirst;
    /**
     * Cache-only strategy
     */
    private cacheOnly;
    /**
     * Revalidate in background (non-blocking)
     */
    private revalidateInBackground;
    /**
     * Invalidate cached shell
     */
    invalidate(path: string): Promise<void>;
    /**
     * Warm cache with multiple paths
     */
    warmCache(paths: string[], fetcher: (path: string) => Promise<StaticShell>, concurrency?: number): Promise<{
        success: number;
        failed: number;
    }>;
}
/**
 * Generate cache-control headers for CDN caching
 */
export declare function generateCacheHeaders(shell: StaticShell, options?: {
    strategy?: EdgeCachingStrategy;
    maxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    private?: boolean;
}): Record<string, string>;
/**
 * Parse request for conditional caching
 */
export declare function parseConditionalRequest(request: Request): {
    ifNoneMatch?: string;
    ifModifiedSince?: Date;
};
/**
 * Check if a 304 Not Modified response should be sent
 */
export declare function shouldReturn304(shell: StaticShell, conditional: ReturnType<typeof parseConditionalRequest>): boolean;
/**
 * Create a 304 Not Modified response
 */
export declare function create304Response(shell: StaticShell): Response;
/**
 * Manage cache invalidation with tags
 */
export declare class CacheTagManager {
    private tags;
    private pathTags;
    /**
     * Associate tags with a path
     */
    tag(path: string, tags: string[]): void;
    /**
     * Get all paths for a tag
     */
    getPathsForTag(tag: string): string[];
    /**
     * Get all tags for a path
     */
    getTagsForPath(path: string): string[];
    /**
     * Invalidate all paths with a tag
     */
    invalidateTag(tag: string, cache: PPRCache): Promise<number>;
    /**
     * Remove a path from tracking
     */
    remove(path: string): void;
    /**
     * Clear all tag associations
     */
    clear(): void;
}
export type { PPRCache, CacheStats, EdgeCachingStrategy } from "./ppr-types.js";
//# sourceMappingURL=ppr-cache.d.ts.map
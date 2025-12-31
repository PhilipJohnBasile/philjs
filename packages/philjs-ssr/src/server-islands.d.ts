/**
 * Server Islands SSR Module
 *
 * Provides server-side rendering for islands architecture with caching support.
 */
import type { VNode } from 'philjs-core';
export interface ServerIslandCache {
    /** Time-to-live in seconds */
    ttl: number;
    /** Stale-while-revalidate time in seconds */
    swr?: number;
    /** Cache tags for invalidation */
    tags?: string[];
    /** Custom cache key generator */
    keyGenerator?: (props: Record<string, any>) => string;
    /** Whether cache is private (per-user) */
    private?: boolean;
    /** Whether to cache at edge */
    edge?: boolean;
    /** Headers to vary cache by */
    varyBy?: string[];
}
export interface CachedIsland {
    html: string;
    timestamp: number;
    ttl: number;
    swr: number;
    tags: string[];
    props: Record<string, any>;
    etag: string;
}
export interface IslandCacheStore {
    get(key: string): Promise<CachedIsland | null>;
    set(key: string, value: CachedIsland): Promise<void>;
    delete(key: string): Promise<void>;
    invalidateByTag(tag: string): Promise<void>;
    clear(): Promise<void>;
}
export interface ServerIslandMetrics {
    hits: number;
    misses: number;
    staleHits: number;
    revalidations: number;
    errors: number;
    avgRenderTime: number;
}
export interface ServerIslandProps {
    id?: string;
    children: VNode;
    cache?: ServerIslandCache;
    fallback?: VNode;
    defer?: 'idle' | 'visible' | 'interaction';
    priority?: number;
}
/**
 * Render a server island to HTML string
 */
export declare function renderServerIsland(islandId: string, component: any, props: Record<string, any>, cacheConfig?: ServerIslandCache): Promise<string>;
/**
 * Manually cache an island
 */
export declare function cacheIsland(islandId: string, html: string, options: {
    ttl: number;
    tags?: string[];
    swr?: number;
}): Promise<void>;
/**
 * Invalidate a specific island from cache
 */
export declare function invalidateIsland(islandId: string, props: Record<string, any>, cacheConfig?: ServerIslandCache): Promise<void>;
/**
 * Invalidate all islands with a specific tag
 */
export declare function invalidateIslandsByTag(tag: string): Promise<void>;
/**
 * Clear all island caches
 */
export declare function clearIslandCache(): Promise<void>;
/**
 * Prefetch and cache an island
 */
export declare function prefetchIsland(islandId: string, component: any, props: Record<string, any>, cacheConfig: ServerIslandCache): Promise<void>;
/**
 * Get the current cache store
 */
export declare function getIslandCacheStore(): IslandCacheStore;
/**
 * Set a custom cache store
 */
export declare function setIslandCacheStore(store: IslandCacheStore): void;
/**
 * Get server island metrics
 */
export declare function getServerIslandMetrics(): ServerIslandMetrics;
/**
 * Reset server island metrics
 */
export declare function resetServerIslandMetrics(): void;
/**
 * Generate cache headers for an island
 */
export declare function getIslandCacheHeaders(config: ServerIslandCache): Record<string, string>;
/**
 * Create a Redis cache adapter
 */
export declare function createRedisCacheAdapter(redis: any): IslandCacheStore;
/**
 * Create a KV (Cloudflare Workers) cache adapter
 */
export declare function createKVCacheAdapter(kv: any): IslandCacheStore;
/**
 * ServerIsland component for JSX usage
 */
export declare function ServerIsland(props: ServerIslandProps): {
    type: string;
    props: ServerIslandProps;
};
export type { VNode };
//# sourceMappingURL=server-islands.d.ts.map
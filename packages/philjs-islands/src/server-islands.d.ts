/**
 * PhilJS Server Islands
 *
 * Per-component server-side rendering with intelligent caching.
 * Matches Astro 5's Server Islands capabilities.
 *
 * Features:
 * - Per-component caching with TTL
 * - Stale-while-revalidate pattern
 * - Cache invalidation by tags
 * - Dynamic personalization in static pages
 * - Edge-compatible caching
 *
 * @example
 * ```tsx
 * import { ServerIsland, cacheIsland } from 'philjs-islands/server';
 *
 * // Per-component caching
 * <ServerIsland
 *   cache={{ ttl: 3600, tags: ['user', 'products'] }}
 *   fallback={<ProductSkeleton />}
 * >
 *   <ProductRecommendations userId={user.id} />
 * </ServerIsland>
 * ```
 */
/** JSX element type */
export interface VNode {
    type: string | Function;
    props: Record<string, any>;
    key?: string | number;
    __serverRender?: () => Promise<string>;
}
/** * Type for renderable components */
export type IslandComponent<P = Record<string, unknown>> = ((props: P) => unknown) | {
    new (props: P): unknown;
};
/** * Type for renderable content */
export type RenderableContent = VNode | string | number | boolean | null | undefined;
export interface ServerIslandCache {
    /** Time-to-live in seconds */
    ttl: number;
    /** Cache tags for invalidation */
    tags?: string[];
    /** Stale-while-revalidate duration in seconds */
    swr?: number;
    /** Cache key generator */
    keyGenerator?: (props: Record<string, any>) => string;
    /** Vary by headers */
    varyBy?: string[];
    /** Private cache (per-user) */
    private?: boolean;
    /** Edge caching hint */
    edge?: boolean;
}
export interface ServerIslandProps {
    /** Unique island identifier */
    id?: string;
    /** Cache configuration */
    cache?: ServerIslandCache;
    /** Fallback while loading */
    fallback?: RenderableContent;
    /** Content to render */
    children: RenderableContent;
    /** Props to pass to the island */
    props?: Record<string, any>;
    /** Defer loading strategy */
    defer?: 'visible' | 'idle' | 'interaction' | 'media' | false;
    /** Media query for defer="media" */
    media?: string;
    /** Priority (0-10) */
    priority?: number;
}
export interface CachedIsland {
    /** Rendered HTML */
    html: string;
    /** When it was cached */
    timestamp: number;
    /** TTL in seconds */
    ttl: number;
    /** SWR duration in seconds */
    swr: number;
    /** Cache tags */
    tags: string[];
    /** Props used to render */
    props: Record<string, any>;
    /** ETag for validation */
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
/**
 * Set the cache store for server islands
 */
export declare function setIslandCacheStore(store: IslandCacheStore): void;
/**
 * Get the current cache store
 */
export declare function getIslandCacheStore(): IslandCacheStore;
/**
 * Server Island with per-component caching
 *
 * @example
 * ```tsx
 * <ServerIsland
 *   id="user-recommendations"
 *   cache={{ ttl: 300, tags: ['user'] }}
 *   fallback={<Skeleton />}
 * >
 *   <Recommendations userId={userId} />
 * </ServerIsland>
 * ```
 */
export declare function ServerIsland(props: ServerIslandProps): RenderableContent;
/**
 * Render a server island with caching
 */
export declare function renderServerIsland(id: string, component: RenderableContent, props: Record<string, any>, cacheConfig?: ServerIslandCache): Promise<string>;
/**
 * Manually cache an island
 */
export declare function cacheIsland(id: string, html: string, config: ServerIslandCache): Promise<void>;
/**
 * Invalidate islands by tag
 */
export declare function invalidateIslandsByTag(tag: string): Promise<void>;
/**
 * Invalidate a specific island
 */
export declare function invalidateIsland(id: string, props?: Record<string, any>, cacheConfig?: ServerIslandCache): Promise<void>;
/**
 * Clear all island caches
 */
export declare function clearIslandCache(): Promise<void>;
/**
 * Prefetch and cache an island
 */
export declare function prefetchIsland(id: string, component: RenderableContent, props: Record<string, any>, cacheConfig: ServerIslandCache): Promise<void>;
/**
 * Minimal Redis client interface
 */
interface RedisClient {
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    sadd(key: string, ...members: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    del(...keys: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    keys(pattern: string): Promise<string[]>;
}
/**
 * Create a Redis cache adapter
 */
export declare function createRedisCacheAdapter(client: RedisClient): IslandCacheStore;
/**
 * Create an edge-compatible KV cache adapter
 */
export declare function createKVCacheAdapter(kv: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: {
        expirationTtl?: number;
    }) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: (options?: {
        prefix?: string;
    }) => Promise<{
        keys: {
            name: string;
        }[];
    }>;
}): IslandCacheStore;
/**
 * Get server island metrics
 */
export declare function getServerIslandMetrics(): ServerIslandMetrics;
/**
 * Reset metrics
 */
export declare function resetServerIslandMetrics(): void;
/**
 * Generate cache-control headers for an island
 */
export declare function getIslandCacheHeaders(config: ServerIslandCache): Record<string, string>;
export {};
//# sourceMappingURL=server-islands.d.ts.map
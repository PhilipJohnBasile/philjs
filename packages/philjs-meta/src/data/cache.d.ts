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
 * Cache entry with metadata
 */
export interface CacheEntry<T = unknown> {
    /** Cached data */
    data: T;
    /** Timestamp when cached */
    cachedAt: number;
    /** Timestamp when entry expires */
    expiresAt: number | null;
    /** Last revalidation timestamp */
    revalidatedAt: number;
    /** ETag for conditional requests */
    etag?: string;
    /** Cache tags for invalidation */
    tags: string[];
    /** Whether entry is stale */
    isStale: boolean;
    /** Whether revalidation is in progress */
    isRevalidating: boolean;
}
/**
 * Cache options
 */
export interface CacheOptions {
    /** Time to live in seconds (0 = no expiry) */
    ttl?: number;
    /** Stale-while-revalidate time in seconds */
    swr?: number;
    /** Tags for cache invalidation */
    tags?: string[];
    /** Whether to skip cache */
    noCache?: boolean;
    /** Whether to force revalidation */
    forceRevalidate?: boolean;
}
/**
 * Revalidation options
 */
export interface RevalidateOptions {
    /** Revalidate by tag */
    tag?: string;
    /** Revalidate by path pattern */
    path?: string | RegExp;
    /** Revalidate specific keys */
    keys?: string[];
}
/**
 * SWR configuration
 */
export interface SWRConfig<T = unknown> {
    /** Fetcher function */
    fetcher: () => Promise<T>;
    /** Revalidation interval in ms (0 = disabled) */
    refreshInterval?: number;
    /** Revalidate on focus */
    revalidateOnFocus?: boolean;
    /** Revalidate on reconnect */
    revalidateOnReconnect?: boolean;
    /** Dedupe interval in ms */
    dedupingInterval?: number;
    /** Error retry count */
    errorRetryCount?: number;
    /** Error retry interval in ms */
    errorRetryInterval?: number;
    /** Fallback data while loading */
    fallbackData?: T;
    /** Keep previous data while revalidating */
    keepPreviousData?: boolean;
}
/**
 * SWR state
 */
export interface SWRState<T = unknown> {
    data: T | undefined;
    error: Error | undefined;
    isLoading: boolean;
    isValidating: boolean;
    mutate: (data?: T | Promise<T> | ((current: T | undefined) => T | Promise<T>)) => Promise<T | undefined>;
}
/**
 * ISR (Incremental Static Regeneration) config
 */
export interface ISRConfig {
    /** Revalidation interval in seconds */
    revalidate: number | false;
    /** Fallback behavior for new pages */
    fallback: 'blocking' | 'static' | false;
    /** Dynamic params configuration */
    dynamicParams?: boolean;
}
/**
 * Cache statistics
 */
export interface CacheStats {
    size: number;
    staleCount: number;
    expiredCount: number;
    tagCount: number;
    revalidatingCount: number;
}
/**
 * Get or fetch data with caching
 */
export declare function cached<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T>;
/**
 * SWR hook implementation
 */
export declare function useSWR<T>(key: string, config: SWRConfig<T>): SWRState<T>;
/**
 * ISR (Incremental Static Regeneration) manager
 */
export declare class ISRManager {
    private regenerationQueue;
    private pageCache;
    private config;
    constructor(config: ISRConfig);
    /**
     * Get cached page or trigger regeneration
     */
    getPage<T>(path: string, generator: () => Promise<T>): Promise<{
        data: T;
        isStale: boolean;
        generatedAt: number;
    }>;
    /**
     * Set page in cache
     */
    setPage<T>(path: string, data: T): void;
    /**
     * Queue page regeneration
     */
    private queueRegeneration;
    /**
     * Manually trigger revalidation for a path
     */
    revalidate<T>(path: string, generator: () => Promise<T>): Promise<void>;
    /**
     * Invalidate a path
     */
    invalidate(path: string): boolean;
    /**
     * Invalidate all paths matching a pattern
     */
    invalidatePattern(pattern: RegExp): string[];
    /**
     * Get all cached paths
     */
    getCachedPaths(): string[];
}
/**
 * On-demand revalidation handler
 */
export declare function revalidatePath(path: string): Promise<boolean>;
/**
 * Revalidate by tag
 */
export declare function revalidateTag(tag: string): Promise<boolean>;
/**
 * Cache control directives builder
 */
export declare function cacheControl(options: CacheControlOptions): string;
/**
 * Cache control options
 */
export interface CacheControlOptions {
    public?: boolean;
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    mustRevalidate?: boolean;
    proxyRevalidate?: boolean;
    immutable?: boolean;
}
/**
 * Unstable cache (experimental Next.js-style caching)
 */
export declare function unstable_cache<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, keyParts: string[], options?: {
    revalidate?: number | false;
    tags?: string[];
}): T;
/**
 * Export cache instance for advanced usage
 */
export declare const cache: {
    get: <T>(key: string) => CacheEntry<T> | undefined;
    set: <T>(key: string, data: T, options?: CacheOptions) => CacheEntry<T>;
    delete: (key: string) => boolean;
    clear: () => void;
    invalidateTag: (tag: string) => string[];
    invalidatePath: (pattern: string | RegExp) => string[];
    getStats: () => CacheStats;
};
//# sourceMappingURL=cache.d.ts.map
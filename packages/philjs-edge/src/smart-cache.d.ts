/**
 * Smart Edge Caching for PhilJS
 *
 * ML-based cache optimization with:
 * - Predictive cache warming
 * - Adaptive TTL based on access patterns
 * - Cache tiering (hot/warm/cold)
 * - Automatic cache invalidation
 */
export interface CacheEntry<T = unknown> {
    key: string;
    value: T;
    size: number;
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    ttl: number;
    tier: 'hot' | 'warm' | 'cold';
    tags: string[];
    metadata?: Record<string, unknown>;
}
export interface CacheConfig {
    maxSize: number;
    defaultTTL: number;
    hotTierMaxSize: number;
    warmTierMaxSize: number;
    adaptiveTTL: boolean;
    predictiveWarming: boolean;
    staleWhileRevalidate: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    itemCount: number;
    tierDistribution: {
        hot: number;
        warm: number;
        cold: number;
    };
    avgTTL: number;
    evictions: number;
}
export interface AccessPattern {
    key: string;
    accessTimes: number[];
    frequency: number;
    avgInterval: number;
    predictedNextAccess: number;
}
/**
 * Smart Edge Cache with ML-based optimization
 */
export declare class SmartCache {
    private cache;
    private accessPatterns;
    private config;
    private stats;
    private revalidating;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get a value from cache
     */
    get<T>(key: string, fetcher?: () => Promise<T>, options?: {
        ttl?: number;
        tags?: string[];
    }): Promise<T | null>;
    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, options?: {
        ttl?: number;
        tags?: string[];
    }): void;
    /**
     * Delete a value from cache
     */
    delete(key: string): boolean;
    /**
     * Invalidate by tags
     */
    invalidateByTags(tags: string[]): number;
    /**
     * Clear all cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get predicted cache entries to warm
     */
    getPredictedWarmingList(): string[];
    /**
     * Warm cache with predicted entries
     */
    warmPredicted(fetcher: (key: string) => Promise<unknown>): Promise<void>;
    /**
     * Calculate adaptive TTL based on access patterns
     */
    private calculateAdaptiveTTL;
    /**
     * Record access for pattern learning
     */
    private recordAccess;
    /**
     * Update cache tier based on access patterns
     */
    private updateTier;
    /**
     * Update tier distribution stats
     */
    private updateTierDistribution;
    /**
     * Update average TTL stats
     */
    private updateAvgTTL;
    /**
     * Update hit rate stats
     */
    private updateHitRate;
    /**
     * Revalidate cache entry in background
     */
    private revalidateInBackground;
    /**
     * Evict entries if cache is too large
     */
    private evictIfNeeded;
    /**
     * Estimate memory size of value
     */
    private estimateSize;
}
/**
 * Create a smart cache instance
 */
export declare function createSmartCache(config?: Partial<CacheConfig>): SmartCache;
/**
 * Cache decorator for functions
 */
export declare function cached<T extends (...args: unknown[]) => Promise<unknown>>(cache: SmartCache, keyFn: (...args: Parameters<T>) => string, options?: {
    ttl?: number;
    tags?: string[];
}): (fn: T) => T;
//# sourceMappingURL=smart-cache.d.ts.map
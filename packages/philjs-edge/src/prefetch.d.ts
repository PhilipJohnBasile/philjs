/**
 * Edge Prefetching for PhilJS
 *
 * Intelligent data prefetching at the edge based on:
 * - User navigation patterns
 * - ML-based prediction
 * - Time-based patterns
 * - Geographic patterns
 */
export interface PrefetchConfig {
    maxCacheSize: number;
    defaultTTL: number;
    prefetchThreshold: number;
    enableMLPrediction: boolean;
    enableGeoPrefetch: boolean;
    enableTimePrefetch: boolean;
}
export interface PrefetchItem {
    key: string;
    data: unknown;
    fetchedAt: number;
    expiresAt: number;
    hitCount: number;
    size: number;
    priority: number;
}
export interface NavigationPattern {
    from: string;
    to: string;
    count: number;
    avgTimeBetween: number;
    probability: number;
}
export interface PrefetchPrediction {
    path: string;
    probability: number;
    reason: 'navigation' | 'ml' | 'geo' | 'time' | 'popular';
    data?: unknown;
}
export interface TimePattern {
    hour: number;
    dayOfWeek: number;
    paths: string[];
    probability: number;
}
export interface GeoPattern {
    country: string;
    region?: string;
    paths: string[];
    probability: number;
}
/**
 * Edge Prefetch Manager
 */
export declare class EdgePrefetcher {
    private cache;
    private navigationPatterns;
    private timePatterns;
    private geoPatterns;
    private accessLog;
    private config;
    constructor(config?: Partial<PrefetchConfig>);
    /**
     * Get prefetch predictions for current context
     */
    getPredictions(currentPath: string, context?: {
        geo?: string;
        userId?: string;
        sessionPaths?: string[];
    }): PrefetchPrediction[];
    /**
     * Record a navigation event
     */
    recordNavigation(from: string, to: string, geo?: string): void;
    /**
     * Prefetch data for predicted paths
     */
    prefetch(paths: string[], fetcher: (path: string) => Promise<unknown>): Promise<void>;
    /**
     * Get cached data
     */
    get<T>(key: string): T | null;
    /**
     * Set cached data
     */
    set(key: string, data: unknown, ttl?: number): void;
    /**
     * Predict from navigation sequence using Markov chain
     */
    private predictFromSequence;
    /**
     * Calculate priority for cache eviction
     */
    private calculatePriority;
    /**
     * Estimate memory size of data
     */
    private estimateSize;
    /**
     * Evict items if cache is too large
     */
    private evictIfNeeded;
    /**
     * Add time pattern
     */
    addTimePattern(pattern: TimePattern): void;
    /**
     * Add geo pattern
     */
    addGeoPattern(pattern: GeoPattern): void;
    /**
     * Learn patterns from access log
     */
    learnPatterns(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        cacheSize: number;
        itemCount: number;
        hitRate: number;
        patternCount: number;
    };
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Export patterns for persistence
     */
    exportPatterns(): {
        navigation: Array<[string, NavigationPattern[]]>;
        time: TimePattern[];
        geo: GeoPattern[];
    };
    /**
     * Import patterns from persistence
     */
    importPatterns(data: {
        navigation: Array<[string, NavigationPattern[]]>;
        time: TimePattern[];
        geo: GeoPattern[];
    }): void;
}
/**
 * Create an edge prefetcher instance
 */
export declare function createEdgePrefetcher(config?: Partial<PrefetchConfig>): EdgePrefetcher;
/**
 * Link prefetch hint generator
 */
export declare function generatePrefetchHints(predictions: PrefetchPrediction[]): string;
/**
 * Preload header generator for HTTP/2 server push
 */
export declare function generatePreloadHeaders(predictions: PrefetchPrediction[]): string;
//# sourceMappingURL=prefetch.d.ts.map
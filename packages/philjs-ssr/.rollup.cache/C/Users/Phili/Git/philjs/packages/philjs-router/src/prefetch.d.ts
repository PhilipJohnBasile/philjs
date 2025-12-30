/**
 * Qwik-style Speculative Prefetching Manager
 *
 * Provides intelligent prefetching with:
 * - Multiple prefetch modes (hover, visible, intent, render, none)
 * - Priority queue with visible > hover > idle ordering
 * - Network-aware prefetching (Save-Data, connection speed)
 * - Concurrent request limiting
 * - Service worker integration
 * - Data + code prefetching
 */
export type PrefetchMode = 'hover' | 'visible' | 'intent' | 'render' | 'none';
export type PrefetchPriority = 'critical' | 'high' | 'medium' | 'low' | 'idle';
export interface PrefetchConfig {
    /** Maximum concurrent prefetch requests */
    maxConcurrent?: number;
    /** Delay in ms before hover prefetch triggers */
    hoverDelay?: number;
    /** Intent threshold (0-1) for predictive prefetching */
    intentThreshold?: number;
    /** Respect Save-Data header */
    respectSaveData?: boolean;
    /** Minimum effective connection type to prefetch (e.g., '3g', '4g') */
    minConnectionType?: '2g' | '3g' | '4g' | 'slow-2g';
    /** Enable service worker caching */
    useServiceWorker?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
    /** Prefetch route data (loaders) */
    prefetchData?: boolean;
    /** Custom fetch options */
    fetchOptions?: RequestInit;
}
export interface PrefetchQueueItem {
    url: string;
    priority: PrefetchPriority;
    mode: PrefetchMode;
    timestamp: number;
    withData?: boolean;
    retryCount?: number;
}
export interface PrefetchStats {
    queued: number;
    loading: number;
    loaded: number;
    failed: number;
    cacheHits: number;
    cacheMisses: number;
    networkSaved: number;
}
export interface RouteLoader {
    (context: {
        params: Record<string, string>;
        request: Request;
    }): Promise<any>;
}
export interface RouteModule {
    loader?: RouteLoader;
    default?: Function;
    config?: Record<string, unknown>;
}
export interface PrefetchResult {
    url: string;
    success: boolean;
    cached: boolean;
    data?: any;
    error?: Error;
    timing?: number;
}
/**
 * Prefetch Manager - Qwik-style speculative prefetching
 */
export declare class PrefetchManager {
    private queue;
    private loading;
    private loaded;
    private failed;
    private config;
    private stats;
    private routeModules;
    private dataCache;
    private swChannel;
    constructor(config?: PrefetchConfig);
    /**
     * Initialize service worker communication
     */
    private initServiceWorkerChannel;
    /**
     * Handle messages from service worker
     */
    private handleServiceWorkerMessage;
    /**
     * Register a route module for data prefetching
     */
    registerRouteModule(path: string, module: RouteModule): void;
    /**
     * Prefetch a route (code only)
     */
    prefetchRoute(url: string, mode?: PrefetchMode): Promise<PrefetchResult>;
    /**
     * Prefetch a route with its data loader
     */
    prefetchRouteWithData(url: string, options?: {
        preload?: boolean;
        params?: Record<string, string>;
    }): Promise<PrefetchResult>;
    /**
     * Main prefetch method
     */
    prefetch(url: string, options?: {
        mode?: PrefetchMode;
        withData?: boolean;
        priority?: PrefetchPriority;
        params?: Record<string, string>;
    }): Promise<PrefetchResult>;
    /**
     * Add item to priority queue
     */
    private addToQueue;
    /**
     * Process the prefetch queue
     */
    private processQueue;
    /**
     * Execute a single prefetch
     */
    private executePrefetch;
    /**
     * Prefetch route code using link prefetch
     */
    private prefetchCode;
    /**
     * Prefetch route data (run loader)
     */
    private prefetchData;
    /**
     * Find route module for a path
     */
    private findRouteModule;
    /**
     * Simple path pattern matching
     */
    private matchPath;
    /**
     * Cancel a pending prefetch
     */
    cancel(url: string): void;
    /**
     * Cancel all pending prefetches
     */
    cancelAll(): void;
    /**
     * Get prefetch statistics
     */
    getStats(): PrefetchStats;
    /**
     * Check if a URL is prefetched
     */
    isPrefetched(url: string): boolean;
    /**
     * Check if a URL is currently loading
     */
    isLoading(url: string): boolean;
    /**
     * Get cached data for a URL
     */
    getCachedData(url: string): any | undefined;
    /**
     * Clear all caches
     */
    clear(): void;
    /**
     * Destroy the prefetch manager
     */
    destroy(): void;
}
/**
 * Initialize the global prefetch manager
 */
export declare function initPrefetchManager(config?: PrefetchConfig): PrefetchManager;
/**
 * Get the global prefetch manager
 */
export declare function getPrefetchManager(): PrefetchManager | null;
/**
 * Prefetch a route (convenience function)
 */
export declare function prefetchRoute(url: string, mode?: PrefetchMode): Promise<PrefetchResult>;
/**
 * Prefetch a route with data (convenience function)
 */
export declare function prefetchRouteWithData(url: string, options?: {
    preload?: boolean;
    params?: Record<string, string>;
}): Promise<PrefetchResult>;
//# sourceMappingURL=prefetch.d.ts.map
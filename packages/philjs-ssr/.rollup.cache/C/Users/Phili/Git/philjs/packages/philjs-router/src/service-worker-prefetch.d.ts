/**
 * Service Worker Integration for Route Prefetching
 *
 * Provides:
 * - Background fetch for prefetched routes
 * - Stale-while-revalidate caching strategy
 * - Cache management for route modules and data
 * - Offline support for prefetched routes
 * - Communication channel between main thread and SW
 */
export interface PrefetchCacheConfig {
    /** Cache name for route modules */
    routeCacheName?: string;
    /** Cache name for route data */
    dataCacheName?: string;
    /** Maximum age for cached routes (ms) */
    maxAge?: number;
    /** Maximum number of cached routes */
    maxEntries?: number;
    /** Enable stale-while-revalidate */
    staleWhileRevalidate?: boolean;
}
export interface PrefetchMessage {
    type: 'PREFETCH_REQUEST' | 'PREFETCH_COMPLETE' | 'CACHE_STATUS' | 'CLEAR_CACHE' | 'GET_CACHED_URLS';
    url?: string;
    urls?: string[];
    priority?: string;
    success?: boolean;
    cached?: boolean;
    error?: string;
    stats?: CacheStats;
}
export interface CacheStats {
    routeCount: number;
    dataCount: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
}
export interface CachedRoute {
    url: string;
    timestamp: number;
    size: number;
    hasData: boolean;
}
/**
 * Generate service worker code for prefetch caching
 *
 * This can be used to generate a service worker script or inject into an existing one.
 *
 * @example
 * ```ts
 * const swCode = generatePrefetchServiceWorker({
 *   routeCacheName: 'my-app-routes',
 *   maxAge: 12 * 60 * 60 * 1000, // 12 hours
 * });
 *
 * // Write to file or register
 * ```
 */
export declare function generatePrefetchServiceWorker(config?: PrefetchCacheConfig): string;
/**
 * Initialize service worker communication
 */
export declare function initServiceWorkerPrefetch(): void;
/**
 * Request prefetch via service worker
 */
export declare function requestSwPrefetch(url: string, priority?: string): void;
/**
 * Check if URL is cached in service worker
 */
export declare function isSwCached(url: string): boolean;
/**
 * Get all cached URLs
 */
export declare function getSwCachedUrls(): string[];
/**
 * Clear service worker cache
 */
export declare function clearSwCache(): void;
/**
 * Register a message handler
 */
export declare function onSwMessage(type: PrefetchMessage['type'], handler: (message: PrefetchMessage) => void): () => void;
/**
 * Close service worker communication
 */
export declare function closeServiceWorkerPrefetch(): void;
export interface SwRegistrationOptions {
    /** Path to service worker file */
    swPath?: string;
    /** Scope for service worker */
    scope?: string;
    /** Called when SW is ready */
    onReady?: (registration: ServiceWorkerRegistration) => void;
    /** Called on registration error */
    onError?: (error: Error) => void;
    /** Called when SW is updated */
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
}
/**
 * Register the prefetch service worker
 *
 * @example
 * ```ts
 * await registerPrefetchServiceWorker({
 *   swPath: '/sw.js',
 *   onReady: (registration) => {
 *     console.log('SW ready:', registration.scope);
 *   },
 * });
 * ```
 */
export declare function registerPrefetchServiceWorker(options?: SwRegistrationOptions): Promise<ServiceWorkerRegistration | null>;
/**
 * Create an inline service worker blob URL
 *
 * Useful for development or when you can't serve a separate SW file.
 *
 * @example
 * ```ts
 * const swUrl = createInlineServiceWorker();
 * await registerPrefetchServiceWorker({ swPath: swUrl });
 * ```
 */
export declare function createInlineServiceWorker(config?: PrefetchCacheConfig): string;
export interface SWRFetchOptions {
    /** Maximum age for cached response (ms) */
    maxAge?: number;
    /** Cache name to use */
    cacheName?: string;
    /** Called when revalidation completes */
    onRevalidate?: (response: Response) => void;
}
/**
 * Fetch with stale-while-revalidate strategy
 *
 * Returns cached response immediately if available, while revalidating in background.
 *
 * @example
 * ```ts
 * const response = await swrFetch('/api/data', {
 *   maxAge: 5 * 60 * 1000, // 5 minutes
 *   onRevalidate: (freshResponse) => {
 *     console.log('Data updated');
 *   },
 * });
 * ```
 */
export declare function swrFetch(url: string, options?: SWRFetchOptions): Promise<Response>;
//# sourceMappingURL=service-worker-prefetch.d.ts.map
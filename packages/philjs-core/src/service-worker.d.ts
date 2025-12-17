/**
 * Service worker generator for offline support.
 * Generates optimized service workers with smart caching strategies.
 */
export type CacheStrategy = "network-first" | "cache-first" | "stale-while-revalidate" | "network-only" | "cache-only";
export type CacheRule = {
    /** URL pattern to match */
    pattern: string | RegExp;
    /** Cache strategy */
    strategy: CacheStrategy;
    /** Cache name */
    cacheName?: string;
    /** Max age in seconds */
    maxAge?: number;
    /** Max entries in cache */
    maxEntries?: number;
};
export type ServiceWorkerConfig = {
    /** Cache rules for different resource types */
    cacheRules: CacheRule[];
    /** Files to precache on install */
    precache?: string[];
    /** Routes to handle offline */
    offlineRoutes?: string[];
    /** Offline fallback page */
    offlineFallback?: string;
    /** Enable background sync */
    backgroundSync?: boolean;
    /** Enable push notifications */
    pushNotifications?: boolean;
    /** Skip waiting on update */
    skipWaiting?: boolean;
    /** Claim clients immediately */
    clientsClaim?: boolean;
};
/**
 * Generate service worker code.
 */
export declare function generateServiceWorker(config: ServiceWorkerConfig): string;
/**
 * Default cache rules for common scenarios.
 */
export declare const defaultCacheRules: CacheRule[];
/**
 * Register service worker in client.
 */
export declare function registerServiceWorker(swPath?: string, options?: {
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onError?: (error: Error) => void;
}): Promise<ServiceWorkerRegistration | undefined>;
/**
 * Unregister all service workers.
 */
export declare function unregisterServiceWorkers(): Promise<void>;
/**
 * Skip waiting and activate new service worker immediately.
 */
export declare function skipWaitingAndClaim(): void;
//# sourceMappingURL=service-worker.d.ts.map
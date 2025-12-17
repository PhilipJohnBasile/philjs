declare function cacheFirst(request: any): Promise<Response>;
declare function networkFirst(request: any): Promise<Response>;
/**
 * Service Worker for PWA support.
 * Implements route-based caching strategies.
 */
declare const CACHE_NAME: "philjs-storefront-v1";
declare const RUNTIME_CACHE: "philjs-runtime";
declare const PRECACHE_ASSETS: string[];
//# sourceMappingURL=sw.d.ts.map
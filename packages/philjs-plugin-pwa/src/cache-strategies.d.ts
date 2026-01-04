/**
 * Cache strategy helpers
 */
import type { CacheRule, CacheStrategy } from './types.js';
/**
 * Create a cache rule
 */
export declare function createCacheRule(pattern: RegExp | string, strategy: CacheStrategy, options?: Partial<CacheRule>): CacheRule;
/**
 * Predefined cache rules
 */
export declare const cacheRules: {
    /**
     * Cache static assets (JS, CSS, images)
     */
    staticAssets: () => CacheRule;
    /**
     * Cache API responses with network-first strategy
     */
    apiResponses: (apiPath?: string) => CacheRule;
    /**
     * Cache images with stale-while-revalidate
     */
    images: () => CacheRule;
    /**
     * Cache fonts
     */
    fonts: () => CacheRule;
    /**
     * Cache Google Fonts
     */
    googleFonts: () => CacheRule[];
};
/**
 * Get default cache rules
 */
export declare function getDefaultCacheRules(): CacheRule[];
//# sourceMappingURL=cache-strategies.d.ts.map
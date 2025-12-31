/**
 * Speculation Rules API Integration
 *
 * Uses the native browser Speculation Rules API for prefetching and prerendering.
 * Falls back to existing prefetch system for browsers that don't support it.
 *
 * @see https://developer.chrome.com/docs/web-platform/prerender-pages
 */
export type SpeculationAction = 'prefetch' | 'prerender';
export type SpeculationEagerness = 'immediate' | 'eager' | 'moderate' | 'conservative';
export interface SpeculationRule {
    /**
     * URLs or URL patterns to speculate
     */
    source: 'list' | 'document';
    /**
     * URL list (when source is 'list')
     */
    urls?: string[];
    /**
     * CSS selector for links (when source is 'document')
     */
    where?: {
        /**
         * CSS selector
         */
        selector_matches?: string;
        /**
         * Href matches pattern
         */
        href_matches?: string | string[];
        /**
         * Relative URLs only
         */
        relative_to?: 'document';
        /**
         * And/Or/Not conditions
         */
        and?: SpeculationRule['where'][];
        or?: SpeculationRule['where'][];
        not?: SpeculationRule['where'];
    };
    /**
     * How aggressively to speculate
     */
    eagerness?: SpeculationEagerness;
    /**
     * Require same-origin
     */
    requires?: ('anonymous-client-ip-when-cross-origin')[];
    /**
     * Referrer policy
     */
    referrer_policy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}
export interface SpeculationRuleSet {
    prefetch?: SpeculationRule[];
    prerender?: SpeculationRule[];
}
export interface SpeculationRulesOptions {
    /**
     * Enable prefetching
     */
    prefetch?: boolean;
    /**
     * Enable prerendering
     */
    prerender?: boolean;
    /**
     * Eagerness level
     */
    eagerness?: SpeculationEagerness;
    /**
     * Custom CSS selector for links
     */
    selector?: string;
    /**
     * URL patterns to include
     */
    include?: string[];
    /**
     * URL patterns to exclude
     */
    exclude?: string[];
    /**
     * Fallback to existing prefetch system
     */
    fallback?: boolean;
}
/**
 * Check if Speculation Rules API is supported
 */
export declare function supportsSpeculationRules(): boolean;
/**
 * Check if prerendering is supported
 */
export declare function supportsPrerendering(): boolean;
/**
 * Check if page was prerendered
 */
export declare function wasPrerendered(): boolean;
export declare class SpeculationRulesManager {
    private scriptElement;
    private rules;
    private mutationObserver;
    constructor();
    private init;
    /**
     * Add speculation rules
     */
    addRules(action: SpeculationAction, rules: SpeculationRule[]): void;
    /**
     * Remove all rules for an action
     */
    clearRules(action?: SpeculationAction): void;
    /**
     * Prefetch specific URLs
     */
    prefetchUrls(urls: string[], eagerness?: SpeculationEagerness): void;
    /**
     * Prerender specific URLs
     */
    prerenderUrls(urls: string[], eagerness?: SpeculationEagerness): void;
    /**
     * Prefetch links matching selector
     */
    prefetchLinks(selector: string, eagerness?: SpeculationEagerness): void;
    /**
     * Prerender links matching selector
     */
    prerenderLinks(selector: string, eagerness?: SpeculationEagerness): void;
    /**
     * Auto-detect and prefetch same-origin links
     */
    enableAutoPrefetch(options?: SpeculationRulesOptions): void;
    /**
     * Observe DOM for new links and update rules
     */
    observeLinks(callback?: (addedLinks: HTMLAnchorElement[]) => void): void;
    /**
     * Update the script element with current rules
     */
    private updateScriptElement;
    /**
     * Cleanup
     */
    destroy(): void;
}
export declare function initSpeculationRules(options?: SpeculationRulesOptions): SpeculationRulesManager;
export declare function getSpeculationRulesManager(): SpeculationRulesManager | null;
/**
 * Prefetch a URL using Speculation Rules or fallback
 */
export declare function speculativePrefetch(url: string, fallback?: () => void): void;
/**
 * Prerender a URL using Speculation Rules or fallback
 */
export declare function speculativePrerender(url: string, fallback?: () => void): void;
/**
 * Mark a link for speculative prefetch
 */
export declare function markForPrefetch(element: HTMLAnchorElement, eagerness?: SpeculationEagerness): () => void;
/**
 * Mark a link for speculative prerender
 */
export declare function markForPrerender(element: HTMLAnchorElement, eagerness?: SpeculationEagerness): () => void;
/**
 * Execute callback when page finishes prerendering
 */
export declare function onPrerenderComplete(callback: () => void): () => void;
/**
 * Get prerendering activation start time
 */
export declare function getPrerenderActivationTime(): number;
/**
 * Create a hybrid prefetch strategy that uses Speculation Rules when available
 */
export declare function createHybridPrefetch(fallbackPrefetch: (url: string) => void): (url: string) => void;
//# sourceMappingURL=speculation-rules.d.ts.map
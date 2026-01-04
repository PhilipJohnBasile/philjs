/**
 * Speculation Rules API Integration
 *
 * Uses the native browser Speculation Rules API for prefetching and prerendering.
 * Falls back to existing prefetch system for browsers that don't support it.
 *
 * @see https://developer.chrome.com/docs/web-platform/prerender-pages
 */
// ============================================================================
// Feature Detection
// ============================================================================
/**
 * Check if Speculation Rules API is supported
 */
export function supportsSpeculationRules() {
    if (typeof HTMLScriptElement === 'undefined')
        return false;
    return 'supports' in HTMLScriptElement && HTMLScriptElement.supports('speculationrules');
}
/**
 * Check if prerendering is supported
 */
export function supportsPrerendering() {
    if (typeof document === 'undefined')
        return false;
    return 'prerendering' in document || document.visibilityState === 'prerender';
}
/**
 * Check if page was prerendered
 */
export function wasPrerendered() {
    if (typeof document === 'undefined')
        return false;
    const doc = document;
    const navEntry = performance.getEntriesByType?.('navigation')[0];
    return doc.prerendering === true || (navEntry?.activationStart ?? 0) > 0;
}
// ============================================================================
// Speculation Rules Manager
// ============================================================================
export class SpeculationRulesManager {
    scriptElement = null;
    rules = {};
    mutationObserver = null;
    constructor() {
        this.init();
    }
    init() {
        if (typeof document === 'undefined' || !supportsSpeculationRules()) {
            return;
        }
        // Create script element for speculation rules
        this.scriptElement = document.createElement('script');
        this.scriptElement.type = 'speculationrules';
        document.head.appendChild(this.scriptElement);
    }
    /**
     * Add speculation rules
     */
    addRules(action, rules) {
        if (!supportsSpeculationRules()) {
            console.warn('[Speculation Rules] Not supported in this browser');
            return;
        }
        if (!this.rules[action]) {
            this.rules[action] = [];
        }
        this.rules[action].push(...rules);
        this.updateScriptElement();
    }
    /**
     * Remove all rules for an action
     */
    clearRules(action) {
        if (action) {
            this.rules[action] = [];
        }
        else {
            this.rules = {};
        }
        this.updateScriptElement();
    }
    /**
     * Prefetch specific URLs
     */
    prefetchUrls(urls, eagerness = 'moderate') {
        this.addRules('prefetch', [
            {
                source: 'list',
                urls,
                eagerness,
            },
        ]);
    }
    /**
     * Prerender specific URLs
     */
    prerenderUrls(urls, eagerness = 'conservative') {
        this.addRules('prerender', [
            {
                source: 'list',
                urls,
                eagerness,
            },
        ]);
    }
    /**
     * Prefetch links matching selector
     */
    prefetchLinks(selector, eagerness = 'moderate') {
        this.addRules('prefetch', [
            {
                source: 'document',
                where: { selector_matches: selector },
                eagerness,
            },
        ]);
    }
    /**
     * Prerender links matching selector
     */
    prerenderLinks(selector, eagerness = 'conservative') {
        this.addRules('prerender', [
            {
                source: 'document',
                where: { selector_matches: selector },
                eagerness,
            },
        ]);
    }
    /**
     * Auto-detect and prefetch same-origin links
     */
    enableAutoPrefetch(options = {}) {
        const { prefetch = true, prerender = false, eagerness = 'moderate', selector = 'a[href]', include = [], exclude = ['/logout', '/signout', '/api/*'], } = options;
        const whereConditions = {
            and: [
                { selector_matches: selector },
                { relative_to: 'document' },
            ],
        };
        // Add include patterns
        if (include.length > 0) {
            whereConditions.and.push({
                or: include.map(pattern => ({ href_matches: pattern })),
            });
        }
        // Add exclude patterns
        if (exclude.length > 0) {
            whereConditions.not = {
                or: exclude.map(pattern => ({ href_matches: pattern })),
            };
        }
        const rules = [
            {
                source: 'document',
                where: whereConditions,
                eagerness,
            },
        ];
        if (prefetch) {
            this.addRules('prefetch', rules);
        }
        if (prerender) {
            this.addRules('prerender', rules);
        }
    }
    /**
     * Observe DOM for new links and update rules
     */
    observeLinks(callback) {
        if (typeof MutationObserver === 'undefined')
            return;
        this.mutationObserver = new MutationObserver((mutations) => {
            const addedLinks = [];
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLAnchorElement) {
                        addedLinks.push(node);
                    }
                    else if (node instanceof Element) {
                        const links = node.querySelectorAll('a[href]');
                        addedLinks.push(...Array.from(links));
                    }
                }
            }
            if (addedLinks.length > 0) {
                callback?.(addedLinks);
            }
        });
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
    /**
     * Update the script element with current rules
     */
    updateScriptElement() {
        if (!this.scriptElement)
            return;
        this.scriptElement.textContent = JSON.stringify(this.rules, null, 2);
    }
    /**
     * Cleanup
     */
    destroy() {
        this.scriptElement?.remove();
        this.mutationObserver?.disconnect();
        this.scriptElement = null;
        this.mutationObserver = null;
        this.rules = {};
    }
}
// ============================================================================
// Global Instance
// ============================================================================
let globalManager = null;
export function initSpeculationRules(options) {
    if (!globalManager) {
        globalManager = new SpeculationRulesManager();
        if (options) {
            globalManager.enableAutoPrefetch(options);
        }
    }
    return globalManager;
}
export function getSpeculationRulesManager() {
    return globalManager;
}
// ============================================================================
// High-Level API
// ============================================================================
/**
 * Prefetch a URL using Speculation Rules or fallback
 */
export function speculativePrefetch(url, fallback) {
    if (supportsSpeculationRules()) {
        const manager = getSpeculationRulesManager() || initSpeculationRules();
        manager.prefetchUrls([url], 'eager');
    }
    else if (fallback) {
        fallback();
    }
}
/**
 * Prerender a URL using Speculation Rules or fallback
 */
export function speculativePrerender(url, fallback) {
    if (supportsSpeculationRules()) {
        const manager = getSpeculationRulesManager() || initSpeculationRules();
        manager.prerenderUrls([url], 'moderate');
    }
    else if (fallback) {
        fallback();
    }
}
/**
 * Mark a link for speculative prefetch
 */
export function markForPrefetch(element, eagerness = 'moderate') {
    // Add data attribute for selector matching
    element.setAttribute('data-prefetch', eagerness);
    const manager = getSpeculationRulesManager() || initSpeculationRules();
    manager.prefetchLinks('[data-prefetch]', eagerness);
    return () => {
        element.removeAttribute('data-prefetch');
    };
}
/**
 * Mark a link for speculative prerender
 */
export function markForPrerender(element, eagerness = 'conservative') {
    // Add data attribute
    element.setAttribute('data-prerender', eagerness);
    const manager = getSpeculationRulesManager() || initSpeculationRules();
    manager.prerenderLinks('[data-prerender]', eagerness);
    return () => {
        element.removeAttribute('data-prerender');
    };
}
// ============================================================================
// Prerender Lifecycle
// ============================================================================
/**
 * Execute callback when page finishes prerendering
 */
export function onPrerenderComplete(callback) {
    if (typeof document === 'undefined')
        return () => { };
    const doc = document;
    if (!doc.prerendering) {
        // Already completed
        callback();
        return () => { };
    }
    const handler = () => {
        if (document.visibilityState === 'visible') {
            callback();
        }
    };
    document.addEventListener('visibilitychange', handler, { once: true });
    return () => {
        document.removeEventListener('visibilitychange', handler);
    };
}
/**
 * Get prerendering activation start time
 */
export function getPrerenderActivationTime() {
    if (typeof performance === 'undefined')
        return 0;
    const navEntry = performance.getEntriesByType('navigation')[0];
    return navEntry?.activationStart || 0;
}
// ============================================================================
// Integration with Existing Prefetch System
// ============================================================================
/**
 * Create a hybrid prefetch strategy that uses Speculation Rules when available
 */
export function createHybridPrefetch(fallbackPrefetch) {
    return (url) => {
        speculativePrefetch(url, () => fallbackPrefetch(url));
    };
}
//# sourceMappingURL=speculation-rules.js.map
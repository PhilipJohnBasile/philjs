/**
 * Speculation Rules API Integration
 *
 * Uses the native browser Speculation Rules API for prefetching and prerendering.
 * Falls back to existing prefetch system for browsers that don't support it.
 *
 * @see https://developer.chrome.com/docs/web-platform/prerender-pages
 */

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Check if Speculation Rules API is supported
 */
export function supportsSpeculationRules(): boolean {
  if (typeof HTMLScriptElement === 'undefined') return false;
  return 'supports' in HTMLScriptElement && HTMLScriptElement.supports('speculationrules');
}

/**
 * Check if prerendering is supported
 */
export function supportsPrerendering(): boolean {
  if (typeof document === 'undefined') return false;
  return 'prerendering' in document || document.visibilityState === 'prerender';
}

/**
 * Check if page was prerendered
 */
export function wasPrerendered(): boolean {
  if (typeof document === 'undefined') return false;
  return document.prerendering === true || performance.getEntriesByType?.('navigation')[0]?.activationStart > 0;
}

// ============================================================================
// Speculation Rules Manager
// ============================================================================

export class SpeculationRulesManager {
  private scriptElement: HTMLScriptElement | null = null;
  private rules: SpeculationRuleSet = {};
  private mutationObserver: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  private init() {
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
  public addRules(action: SpeculationAction, rules: SpeculationRule[]): void {
    if (!supportsSpeculationRules()) {
      console.warn('[Speculation Rules] Not supported in this browser');
      return;
    }

    if (!this.rules[action]) {
      this.rules[action] = [];
    }

    this.rules[action]!.push(...rules);
    this.updateScriptElement();
  }

  /**
   * Remove all rules for an action
   */
  public clearRules(action?: SpeculationAction): void {
    if (action) {
      this.rules[action] = [];
    } else {
      this.rules = {};
    }

    this.updateScriptElement();
  }

  /**
   * Prefetch specific URLs
   */
  public prefetchUrls(urls: string[], eagerness: SpeculationEagerness = 'moderate'): void {
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
  public prerenderUrls(urls: string[], eagerness: SpeculationEagerness = 'conservative'): void {
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
  public prefetchLinks(selector: string, eagerness: SpeculationEagerness = 'moderate'): void {
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
  public prerenderLinks(selector: string, eagerness: SpeculationEagerness = 'conservative'): void {
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
  public enableAutoPrefetch(options: SpeculationRulesOptions = {}): void {
    const {
      prefetch = true,
      prerender = false,
      eagerness = 'moderate',
      selector = 'a[href]',
      include = [],
      exclude = ['/logout', '/signout', '/api/*'],
    } = options;

    const whereConditions: SpeculationRule['where'] = {
      and: [
        { selector_matches: selector },
        { relative_to: 'document' },
      ],
    };

    // Add include patterns
    if (include.length > 0) {
      whereConditions.and!.push({
        or: include.map(pattern => ({ href_matches: pattern })),
      });
    }

    // Add exclude patterns
    if (exclude.length > 0) {
      whereConditions.not = {
        or: exclude.map(pattern => ({ href_matches: pattern })),
      };
    }

    const rules: SpeculationRule[] = [
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
  public observeLinks(callback?: (addedLinks: HTMLAnchorElement[]) => void): void {
    if (typeof MutationObserver === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      const addedLinks: HTMLAnchorElement[] = [];

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLAnchorElement) {
            addedLinks.push(node);
          } else if (node instanceof Element) {
            const links = node.querySelectorAll('a[href]');
            addedLinks.push(...Array.from(links) as HTMLAnchorElement[]);
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
  private updateScriptElement(): void {
    if (!this.scriptElement) return;

    this.scriptElement.textContent = JSON.stringify(this.rules, null, 2);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
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

let globalManager: SpeculationRulesManager | null = null;

export function initSpeculationRules(options?: SpeculationRulesOptions): SpeculationRulesManager {
  if (!globalManager) {
    globalManager = new SpeculationRulesManager();

    if (options) {
      globalManager.enableAutoPrefetch(options);
    }
  }

  return globalManager;
}

export function getSpeculationRulesManager(): SpeculationRulesManager | null {
  return globalManager;
}

// ============================================================================
// High-Level API
// ============================================================================

/**
 * Prefetch a URL using Speculation Rules or fallback
 */
export function speculativePrefetch(url: string, fallback?: () => void): void {
  if (supportsSpeculationRules()) {
    const manager = getSpeculationRulesManager() || initSpeculationRules();
    manager.prefetchUrls([url], 'eager');
  } else if (fallback) {
    fallback();
  }
}

/**
 * Prerender a URL using Speculation Rules or fallback
 */
export function speculativePrerender(url: string, fallback?: () => void): void {
  if (supportsSpeculationRules()) {
    const manager = getSpeculationRulesManager() || initSpeculationRules();
    manager.prerenderUrls([url], 'moderate');
  } else if (fallback) {
    fallback();
  }
}

/**
 * Mark a link for speculative prefetch
 */
export function markForPrefetch(element: HTMLAnchorElement, eagerness: SpeculationEagerness = 'moderate'): () => void {
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
export function markForPrerender(element: HTMLAnchorElement, eagerness: SpeculationEagerness = 'conservative'): () => void {
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
export function onPrerenderComplete(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};

  if (!document.prerendering) {
    // Already completed
    callback();
    return () => {};
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
export function getPrerenderActivationTime(): number {
  if (typeof performance === 'undefined') return 0;

  const navEntry = performance.getEntriesByType('navigation')[0] as any;
  return navEntry?.activationStart || 0;
}

// ============================================================================
// Integration with Existing Prefetch System
// ============================================================================

/**
 * Create a hybrid prefetch strategy that uses Speculation Rules when available
 */
export function createHybridPrefetch(fallbackPrefetch: (url: string) => void) {
  return (url: string) => {
    speculativePrefetch(url, () => fallbackPrefetch(url));
  };
}

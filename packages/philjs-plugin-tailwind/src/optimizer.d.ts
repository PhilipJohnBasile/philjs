/**
 * CSS Optimizer for Tailwind CSS
 * Production-ready CSS optimization utilities
 */
/**
 * Optimization options
 */
export interface OptimizationOptions {
    /** Minify CSS */
    minify?: boolean;
    /** Remove comments */
    removeComments?: boolean;
    /** Combine duplicate rules */
    deduplicateRules?: boolean;
    /** Merge media queries */
    mergeMediaQueries?: boolean;
    /** Sort properties */
    sortProperties?: boolean;
    /** Remove empty rules */
    removeEmptyRules?: boolean;
    /** Generate sourcemap */
    sourcemap?: boolean;
}
/**
 * Optimization result
 */
export interface OptimizationResult {
    /** Optimized CSS */
    css: string;
    /** Original size in bytes */
    originalSize: number;
    /** Optimized size in bytes */
    optimizedSize: number;
    /** Size reduction percentage */
    reduction: number;
    /** Sourcemap (if generated) */
    map?: string;
}
/**
 * CSS Optimizer class
 */
export declare class CSSOptimizer {
    private options;
    constructor(options?: OptimizationOptions);
    /**
     * Optimize CSS content
     */
    optimize(css: string): OptimizationResult;
    /**
     * Remove CSS comments
     */
    private removeComments;
    /**
     * Remove empty rules
     */
    private removeEmptyRules;
    /**
     * Deduplicate identical rules
     */
    private deduplicateRules;
    /**
     * Merge media queries with same conditions
     */
    private mergeMediaQueries;
    /**
     * Sort CSS properties alphabetically
     */
    private sortProperties;
    /**
     * Merge CSS properties (last one wins for duplicates)
     */
    private mergeProperties;
    /**
     * Minify CSS
     */
    private minify;
}
/**
 * Quick optimization function
 */
export declare function optimizeCSS(css: string, options?: OptimizationOptions): OptimizationResult;
/**
 * Critical CSS extractor
 */
export declare class CriticalCSSExtractor {
    private viewportWidth;
    private viewportHeight;
    constructor(viewportWidth?: number, viewportHeight?: number);
    /**
     * Extract critical CSS rules for above-the-fold content
     * Note: This is a simplified version - full implementation requires a DOM parser
     */
    extractCritical(css: string, html: string): {
        critical: string;
        deferred: string;
    };
    /**
     * Check if a selector is used in the HTML
     */
    private isSelectorUsed;
}
/**
 * Extract critical CSS
 */
export declare function extractCriticalCSS(css: string, html: string): {
    critical: string;
    deferred: string;
};
/**
 * Unused CSS purger
 */
export declare function purgeUnusedCSS(css: string, content: string[], options?: {
    safelist?: string[];
    blocklist?: string[];
}): string;
/**
 * CSS statistics analyzer
 */
export interface CSSStats {
    /** Total file size in bytes */
    size: number;
    /** Number of rules */
    ruleCount: number;
    /** Number of selectors */
    selectorCount: number;
    /** Number of declarations */
    declarationCount: number;
    /** Media query count */
    mediaQueryCount: number;
    /** Unique properties used */
    uniqueProperties: string[];
    /** Unique colors used */
    uniqueColors: string[];
    /** Specificity stats */
    specificity: {
        max: number;
        avg: number;
    };
}
export declare function analyzeCSSStats(css: string): CSSStats;
//# sourceMappingURL=optimizer.d.ts.map
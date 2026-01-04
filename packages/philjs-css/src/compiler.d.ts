/**
 * PhilJS CSS Compiler - Compile-Time CSS Optimization
 *
 * This module provides build-time utilities for:
 * - Dead code elimination
 * - CSS purging
 * - Atomic CSS deduplication
 * - Critical CSS extraction
 * - Bundle splitting
 */
interface UsageInfo {
    classes: Set<string>;
    ids: Set<string>;
    tags: Set<string>;
    attributes: Set<string>;
}
/**
 * Extract CSS class usage from source files
 *
 * @example
 * ```ts
 * const usage = await extractUsageFromFiles(['src/**\/*.tsx']);
 * ```
 */
export declare function extractUsageFromFiles(patterns: string[]): Promise<UsageInfo>;
/**
 * Extract CSS usage from HTML string
 */
export declare function extractUsageFromHTML(html: string): UsageInfo;
/**
 * Extract CSS usage from JSX/TSX source
 */
export declare function extractUsageFromJSX(source: string): UsageInfo;
/**
 * Remove unused CSS rules
 *
 * @example
 * ```ts
 * const optimizedCSS = purgeUnusedCSS(css, {
 *   classes: new Set(['btn', 'card']),
 *   tags: new Set(['button', 'div'])
 * });
 * ```
 */
export declare function purgeUnusedCSS(css: string, usage: UsageInfo): string;
/**
 * Deduplicate identical CSS declarations
 */
export declare function deduplicateCSS(css: string): string;
/**
 * Atomic CSS deduplication - extract common declarations
 */
export declare function atomicDeduplication(css: string): {
    atomic: string;
    composed: string;
};
/**
 * Extract above-the-fold critical CSS
 */
export declare function extractCriticalCSS(fullCSS: string, aboveFoldSelectors: string[]): {
    critical: string;
    deferred: string;
};
interface CSSChunk {
    name: string;
    css: string;
    selectors: string[];
}
/**
 * Split CSS into route-based chunks
 *
 * @example
 * ```ts
 * const chunks = splitCSSByRoute({
 *   '/': ['container', 'header', 'hero'],
 *   '/about': ['container', 'about-content'],
 *   '/products': ['container', 'product-grid', 'product-card']
 * });
 * ```
 */
export declare function splitCSSByRoute(routeSelectors: Record<string, string[]>): CSSChunk[];
interface SourceMap {
    version: 3;
    file: string;
    sources: string[];
    sourcesContent: string[];
    mappings: string;
    names: string[];
}
/**
 * Generate source map for CSS
 */
export declare function generateSourceMap(css: string, sourceFile: string): SourceMap;
interface OptimizationReport {
    originalSize: number;
    optimizedSize: number;
    savings: number;
    savingsPercent: number;
    unusedRulesRemoved: number;
    duplicatesRemoved: number;
    atomicClassesCreated: number;
}
/**
 * Generate optimization report
 */
export declare function generateOptimizationReport(originalCSS: string, optimizedCSS: string, options?: {
    unusedRules?: number;
    duplicates?: number;
    atomicClasses?: number;
}): OptimizationReport;
/**
 * Full optimization pipeline
 *
 * @example
 * ```ts
 * const result = await optimizeCSS({
 *   input: extractCSS(),
 *   usage: await extractUsageFromFiles(['src/**\/*.tsx']),
 *   options: {
 *     purge: true,
 *     deduplicate: true,
 *     atomic: true,
 *     minify: true
 *   }
 * });
 * ```
 */
export declare function optimizeCSS(config: {
    input: string;
    usage?: UsageInfo;
    options?: {
        purge?: boolean;
        deduplicate?: boolean;
        atomic?: boolean;
        minify?: boolean;
        sourcemap?: boolean;
    };
}): {
    css: string;
    sourcemap?: SourceMap;
    report: OptimizationReport;
};
export {};
//# sourceMappingURL=compiler.d.ts.map
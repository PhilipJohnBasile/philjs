import type { ExtractConfig } from './types.js';
/**
 * Extract all CSS from the registry
 *
 * @example
 * ```ts
 * const css = extractCSS({
 *   outputPath: './dist/styles.css',
 *   minify: true,
 *   sourceMap: true,
 *   atomicClasses: true
 * });
 * ```
 */
export declare function extractCSS(config?: Partial<ExtractConfig>): string;
/**
 * Extract CSS and write to file
 */
export declare function extractToFile(filePath: string, config?: Partial<ExtractConfig>): Promise<void>;
/**
 * CSS extraction plugin for build tools
 */
export interface BuildPlugin {
    name: string;
    setup?: (build: any) => void;
    transform?: (code: string, id: string) => {
        code: string;
        map?: any;
    } | null;
    generateBundle?: () => void | Promise<void>;
}
/**
 * Create a Vite plugin for CSS extraction
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { createVitePlugin } from 'philjs-css/extract';
 *
 * export default {
 *   plugins: [
 *     createVitePlugin({
 *       outputPath: 'dist/styles.css',
 *       minify: true
 *     })
 *   ]
 * };
 * ```
 */
export declare function createVitePlugin(config?: Partial<ExtractConfig>): any;
/**
 * Create a Rollup plugin for CSS extraction
 */
export declare function createRollupPlugin(config?: Partial<ExtractConfig>): BuildPlugin;
/**
 * Create a Webpack plugin for CSS extraction
 */
export declare function createWebpackPlugin(config?: Partial<ExtractConfig>): any;
/**
 * Extract critical CSS for SSR
 *
 * This function extracts only the CSS that's actually used
 * in the rendered HTML for faster first paint.
 *
 * @example
 * ```ts
 * const criticalCSS = extractCriticalCSS(html, {
 *   minify: true
 * });
 * ```
 */
export declare function extractCriticalCSS(html: string, config?: Partial<ExtractConfig>): string;
/**
 * Bundle stats for analyzing CSS output
 */
export interface BundleStats {
    totalSize: number;
    minifiedSize: number;
    gzipSize: number;
    classCount: number;
    ruleCount: number;
    themeVars: number;
}
/**
 * Analyze CSS bundle and return statistics
 *
 * @example
 * ```ts
 * const stats = analyzeCSSBundle();
 * console.log(`Total size: ${stats.totalSize} bytes`);
 * console.log(`Minified: ${stats.minifiedSize} bytes`);
 * console.log(`Classes: ${stats.classCount}`);
 * ```
 */
export declare function analyzeCSSBundle(): BundleStats;
//# sourceMappingURL=extract.d.ts.map
/**
 * Vite plugin for PhilJS compiler
 *
 * Integrates PhilJS automatic optimizations into the Vite build pipeline.
 * Applies transformations during development and production builds.
 *
 * Features:
 * - Auto-memoization of expensive computations
 * - Auto-batching of multiple signal updates
 * - Dead code elimination
 * - Effect optimization warnings
 * - Full HMR support with state preservation
 * - Enhanced error overlay integration
 * - Source map accuracy for debugging
 * - Build performance optimizations with caching
 * - Verbose logging option for debugging
 */
import type { Plugin } from 'vite';
import type { CompilerConfig } from '../types';
export interface PhilJSCompilerPluginOptions extends CompilerConfig {
    /**
     * Enable/disable the plugin
     * @default true
     */
    enabled?: boolean;
    /**
     * Enable verbose logging
     * @default false
     */
    verbose?: boolean;
    /**
     * Custom file filter function
     */
    filter?: (id: string) => boolean;
    /**
     * Enable build caching for better performance
     * @default true
     */
    cache?: boolean;
    /**
     * Enable HMR state preservation
     * @default true
     */
    preserveHmrState?: boolean;
    /**
     * Show detailed error messages in overlay
     * @default true
     */
    enhancedErrors?: boolean;
    /**
     * Production optimizations
     */
    production?: {
        /**
         * Enable aggressive minification
         * @default true
         */
        minify?: boolean;
        /**
         * Enable chunk splitting strategies
         * @default true
         */
        chunkSplitting?: boolean;
        /**
         * Generate preload/prefetch hints
         * @default true
         */
        resourceHints?: boolean;
        /**
         * Enable bundle analysis
         * @default false
         */
        analyze?: boolean;
        /**
         * Performance budgets (in bytes)
         */
        budgets?: {
            maxInitial?: number;
            maxChunk?: number;
            maxTotal?: number;
        };
    };
    /**
     * Asset optimization settings
     */
    assets?: {
        /**
         * Inline assets smaller than this (bytes)
         * @default 4096
         */
        inlineLimit?: number;
        /**
         * Enable image optimization
         * @default true
         */
        optimizeImages?: boolean;
        /**
         * Enable SVG optimization
         * @default true
         */
        optimizeSvg?: boolean;
    };
}
/**
 * Creates a Vite plugin for PhilJS compiler
 *
 * @param options - Plugin configuration options
 * @returns Vite plugin instance
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import philjs from 'philjs-compiler/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     philjs({
 *       autoMemo: true,
 *       autoBatch: true,
 *       verbose: true,
 *       cache: true,
 *       development: process.env.NODE_ENV === 'development'
 *     })
 *   ]
 * });
 * ```
 */
export default function philJSCompiler(options?: PhilJSCompilerPluginOptions): Plugin;
/**
 * Type-safe plugin factory with better TypeScript support
 *
 * @example
 * ```typescript
 * import { createPhilJSPlugin } from 'philjs-compiler/vite';
 *
 * const plugin = createPhilJSPlugin({
 *   autoMemo: true
 * });
 * ```
 */
export declare function createPhilJSPlugin(options?: PhilJSCompilerPluginOptions): Plugin;
//# sourceMappingURL=vite.d.ts.map
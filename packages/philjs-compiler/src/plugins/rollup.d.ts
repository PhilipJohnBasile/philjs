/**
 * Rollup plugin for PhilJS compiler
 *
 * Integrates PhilJS automatic optimizations into the Rollup build pipeline.
 * Can be used with Rollup, Vite (as a Rollup plugin), or other Rollup-based tools.
 */
import type { Plugin } from 'rollup';
import type { CompilerConfig } from '../types';
export interface PhilJSRollupPluginOptions extends CompilerConfig {
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
}
/**
 * Creates a Rollup plugin for PhilJS compiler
 *
 * @param options - Plugin configuration options
 * @returns Rollup plugin instance
 *
 * @example
 * ```typescript
 * // rollup.config.js
 * import philjs from 'philjs-compiler/rollup';
 *
 * export default {
 *   input: 'src/index.ts',
 *   output: {
 *     file: 'dist/bundle.js',
 *     format: 'esm'
 *   },
 *   plugins: [
 *     philjs({
 *       autoMemo: true,
 *       autoBatch: true,
 *       sourceMaps: true
 *     })
 *   ]
 * };
 * ```
 */
export default function philJSCompiler(options?: PhilJSRollupPluginOptions): Plugin;
/**
 * Type-safe plugin factory with better TypeScript support
 *
 * @example
 * ```typescript
 * import { createPhilJSPlugin } from 'philjs-compiler/rollup';
 *
 * const plugin = createPhilJSPlugin({
 *   autoMemo: true,
 *   verbose: true
 * });
 * ```
 */
export declare function createPhilJSPlugin(options?: PhilJSRollupPluginOptions): Plugin;
//# sourceMappingURL=rollup.d.ts.map
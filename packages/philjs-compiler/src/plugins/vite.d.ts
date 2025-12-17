/**
 * Vite plugin for PhilJS compiler
 *
 * Integrates PhilJS automatic optimizations into the Vite build pipeline.
 * Applies transformations during development and production builds.
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
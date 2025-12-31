/**
 * Vite Plugin for WASM loading in PhilJS
 *
 * Provides seamless WASM module loading, optimization, and HMR support.
 */
import type { Plugin } from 'vite';
export interface ViteWasmPluginOptions {
    /**
     * Directory containing WASM files
     * @default 'src/wasm'
     */
    wasmDir?: string;
    /**
     * File patterns to include for WASM handling
     * @default ['**\/*.wasm']
     */
    include?: string[];
    /**
     * File patterns to exclude
     * @default ['node_modules/**']
     */
    exclude?: string[];
    /**
     * Enable streaming compilation for better performance
     * @default true
     */
    streaming?: boolean;
    /**
     * Enable WASM module caching
     * @default true
     */
    cache?: boolean;
    /**
     * Generate TypeScript type definitions for WASM exports
     * @default true
     */
    generateTypes?: boolean;
    /**
     * Custom WASM optimization settings
     */
    optimize?: {
        /**
         * Enable wasm-opt optimization (requires wasm-opt to be installed)
         */
        wasmOpt?: boolean;
        /**
         * Optimization level for wasm-opt
         * @default 's' (optimize for size)
         */
        level?: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
        /**
         * Strip debug information
         * @default true
         */
        stripDebug?: boolean;
    };
    /**
     * Enable HMR for WASM modules in development
     * @default true
     */
    hmr?: boolean;
    /**
     * Debug mode
     * @default false
     */
    debug?: boolean;
}
/**
 * Vite plugin for WASM loading and optimization
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { viteWasmPlugin } from 'philjs-wasm/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     viteWasmPlugin({
 *       wasmDir: 'src/wasm',
 *       generateTypes: true,
 *       optimize: {
 *         wasmOpt: true,
 *         level: 'Os'
 *       }
 *     })
 *   ]
 * });
 * ```
 */
export declare function viteWasmPlugin(options?: ViteWasmPluginOptions): Plugin;
/**
 * Helper to detect WASM imports in source code
 */
export declare function detectWasmImports(code: string): Array<{
    type: 'import' | 'fetch';
    path: string;
    line: number;
}>;
/**
 * Create optimized WASM config for Vite
 */
export declare function createWasmConfig(options?: ViteWasmPluginOptions): {
    plugins: Plugin<any>[];
    build: {
        target: string;
        modulePreload: {
            polyfill: boolean;
        };
    };
    optimizeDeps: {
        exclude: string[];
    };
};
export default viteWasmPlugin;
//# sourceMappingURL=vite-plugin.d.ts.map
/**
 * Rollup plugin for PhilJS compiler
 *
 * Integrates PhilJS automatic optimizations into the Rollup build pipeline.
 * Can be used with Rollup, Vite (as a Rollup plugin), or other Rollup-based tools.
 */
import { createFilter } from '@rollup/pluginutils';
import { Optimizer } from '../optimizer.js';
/**
 * Creates a Rollup plugin for PhilJS compiler
 *
 * @param options - Plugin configuration options
 * @returns Rollup plugin instance
 *
 * @example
 * ```typescript
 * // rollup.config.ts
 * import philjs from '@philjs/compiler/rollup';
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
export default function philJSCompiler(options = {}) {
    const { enabled = true, verbose = false, filter: customFilter, ...compilerConfig } = options;
    const include = compilerConfig.include ?? ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'];
    const exclude = compilerConfig.exclude ?? ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'];
    // Create file filter
    const filter = customFilter || createFilter(include, exclude);
    // Create optimizer instance
    const optimizer = new Optimizer({
        ...compilerConfig,
        include,
        exclude
    });
    // Track optimizations for statistics
    const stats = {
        filesProcessed: 0,
        filesOptimized: 0,
        totalOptimizations: 0,
        totalTime: 0
    };
    return {
        name: 'philjs-compiler',
        /**
         * Transform hook - Apply PhilJS optimizations
         */
        transform(code, id) {
            // Skip if plugin is disabled
            if (!enabled) {
                return null;
            }
            // Skip if file doesn't match filter
            if (!filter(id)) {
                return null;
            }
            // Skip non-PhilJS files (check for PhilJS imports)
            if (!code.includes('@philjs/core') && !code.includes('from "philjs')) {
                return null;
            }
            try {
                stats.filesProcessed++;
                const startTime = performance.now();
                // Apply optimizations
                const result = optimizer.optimize(code, id);
                const endTime = performance.now();
                const duration = endTime - startTime;
                stats.totalTime += duration;
                if (result.optimizations.length > 0) {
                    stats.filesOptimized++;
                    stats.totalOptimizations += result.optimizations.length;
                    if (verbose) {
                        console.log(`[philjs-compiler] Optimized ${id} in ${duration.toFixed(2)}ms (${result.optimizations.length} optimizations)`);
                        result.optimizations.forEach((opt) => {
                            console.log(`  - ${opt}`);
                        });
                    }
                }
                // Return transformed code with source map
                return {
                    code: result.code,
                    map: result.map || null
                };
            }
            catch (error) {
                // Log error but don't fail the build
                console.error(`[philjs-compiler] Error optimizing ${id}:`, error);
                // Return original code on error
                return null;
            }
        },
        /**
         * Build start hook - Reset statistics
         */
        buildStart() {
            stats.filesProcessed = 0;
            stats.filesOptimized = 0;
            stats.totalOptimizations = 0;
            stats.totalTime = 0;
            if (verbose && enabled) {
                console.log('[philjs-compiler] Starting build with PhilJS optimizations');
            }
        },
        /**
         * Build end hook - Log statistics
         */
        buildEnd() {
            if (verbose && enabled) {
                console.log('[philjs-compiler] Build completed:');
                console.log(`  Files processed: ${stats.filesProcessed}`);
                console.log(`  Files optimized: ${stats.filesOptimized}`);
                console.log(`  Total optimizations: ${stats.totalOptimizations}`);
                console.log(`  Total time: ${stats.totalTime.toFixed(2)}ms`);
                if (stats.filesOptimized > 0) {
                    const avgTime = stats.totalTime / stats.filesOptimized;
                    const avgOpts = stats.totalOptimizations / stats.filesOptimized;
                    console.log(`  Average time per file: ${avgTime.toFixed(2)}ms`);
                    console.log(`  Average optimizations per file: ${avgOpts.toFixed(1)}`);
                }
            }
        }
    };
}
/**
 * Type-safe plugin factory with better TypeScript support
 *
 * @example
 * ```typescript
 * import { createPhilJSPlugin } from '@philjs/compiler/rollup';
 *
 * const plugin = createPhilJSPlugin({
 *   autoMemo: true,
 *   verbose: true
 * });
 * ```
 */
export function createPhilJSPlugin(options) {
    return philJSCompiler(options);
}
//# sourceMappingURL=rollup.js.map
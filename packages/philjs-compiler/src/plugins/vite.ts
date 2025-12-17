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
 * - Full HMR support
 */

import type { Plugin, HmrContext } from 'vite';
import { createFilter } from '@rollup/pluginutils';
import { Optimizer } from '../optimizer';
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
export default function philJSCompiler(options: PhilJSCompilerPluginOptions = {}): Plugin {
  const {
    enabled = true,
    verbose = false,
    filter: customFilter,
    include = ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
    exclude = ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
    ...compilerConfig
  } = options;

  // Create file filter
  const filter = customFilter || createFilter(include, exclude);

  // Create optimizer instance
  let optimizer: Optimizer;
  let isDevelopment = false;

  return {
    name: 'philjs-compiler',

    // Run before other plugins
    enforce: 'pre',

    /**
     * Vite config hook - Initialize optimizer with correct environment
     */
    configResolved(config) {
      isDevelopment = config.mode === 'development';

      // Initialize optimizer with environment-aware config
      optimizer = new Optimizer({
        ...compilerConfig,
        development: isDevelopment,
        sourceMaps: config.build.sourcemap !== false,
        include,
        exclude
      });

      if (verbose) {
        console.log('[philjs-compiler] Initialized with config:', {
          mode: config.mode,
          development: isDevelopment,
          sourceMaps: config.build.sourcemap !== false
        });
      }
    },

    /**
     * Transform hook - Apply PhilJS optimizations
     */
    transform(code: string, id: string) {
      // Skip if plugin is disabled
      if (!enabled) {
        return null;
      }

      // Skip if file doesn't match filter
      if (!filter(id)) {
        return null;
      }

      // Skip non-PhilJS files (check for PhilJS imports)
      if (!code.includes('philjs-core') && !code.includes('from "philjs')) {
        return null;
      }

      try {
        const startTime = performance.now();

        // Apply optimizations
        const result = optimizer.optimize(code, id);

        const endTime = performance.now();
        const duration = endTime - startTime;

        if (verbose) {
          console.log(
            `[philjs-compiler] Optimized ${id} in ${duration.toFixed(2)}ms (${result.optimizations.length} optimizations)`
          );

          if (result.optimizations.length > 0) {
            result.optimizations.forEach(opt => {
              console.log(`  - ${opt}`);
            });
          }
        }

        // Log warnings in development mode
        if (isDevelopment && result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            const loc = warning.location;
            const location = loc?.start ? `:${loc.start.line}${loc.start.column ? `:${loc.start.column}` : ''}` : '';
            console.warn(`[philjs-compiler] ⚠️  ${id}${location}: ${warning.message}`);
            if (warning.suggestion) {
              console.warn(`  💡 Suggestion: ${warning.suggestion}`);
            }
          });
        }

        // Return transformed code with source map
        return {
          code: result.code,
          map: result.map || null
        };
      } catch (error) {
        // Format error message with helpful context
        const err = error as Error & { loc?: { line: number; column: number } };
        const location = err.loc ? ` at line ${err.loc.line}, column ${err.loc.column}` : '';

        console.error(`\n[philjs-compiler] ❌ Error optimizing ${id}${location}:`);
        console.error(`  ${err.message}`);

        // Provide helpful suggestions based on common errors
        if (err.message.includes('Unexpected token')) {
          console.error(`\n  💡 This might be a syntax error. Check for:`);
          console.error(`     - Missing semicolons or brackets`);
          console.error(`     - Invalid JSX syntax`);
          console.error(`     - Unsupported TypeScript features\n`);
        } else if (err.message.includes('Cannot find')) {
          console.error(`\n  💡 This might be an import error. Check for:`);
          console.error(`     - Correct import paths`);
          console.error(`     - Missing dependencies\n`);
        }

        // Return original code on error (don't break the build)
        return null;
      }
    },

    /**
     * Build start hook - Log plugin status
     */
    buildStart() {
      if (verbose && enabled) {
        console.log('[philjs-compiler] Starting build with PhilJS optimizations');
      }
    },

    /**
     * Build end hook - Log completion
     */
    buildEnd() {
      if (verbose && enabled) {
        console.log('[philjs-compiler] Build completed');
      }
    },

    /**
     * HMR hook - Handle hot module replacement
     */
    handleHotUpdate(ctx: HmrContext) {
      const { file, modules } = ctx;

      // Only process PhilJS files
      if (!filter(file)) {
        return;
      }

      // Check if this is a PhilJS component file
      const isPhilJSFile = modules.some(mod =>
        mod.file && (mod.file.includes('philjs') || mod.file.endsWith('.tsx') || mod.file.endsWith('.jsx'))
      );

      if (isPhilJSFile && verbose) {
        console.log(`[philjs-compiler] HMR update: ${file}`);
      }

      // Return modules to invalidate - Vite will handle the rest
      return modules;
    }
  };
}

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
export function createPhilJSPlugin(options?: PhilJSCompilerPluginOptions): Plugin {
  return philJSCompiler(options);
}

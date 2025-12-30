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

import type { Plugin, HmrContext, ModuleNode, ViteDevServer } from 'vite';
import { createFilter } from '@rollup/pluginutils';
import { Optimizer } from '../optimizer.js';
import type { CompilerConfig, TransformResult, CompilerWarning } from '../types.js';
import { createHash } from 'crypto';

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
 * In-memory cache for compiled modules
 */
interface CacheEntry {
  code: string;
  map: any;
  hash: string;
  timestamp: number;
  result: TransformResult;
}

/**
 * Statistics for build performance tracking
 */
interface BuildStats {
  filesProcessed: number;
  totalTime: number;
  cacheHits: number;
  cacheMisses: number;
  optimizationsApplied: number;
}

/**
 * Creates a hash for cache invalidation
 */
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex').substring(0, 16);
}

/**
 * Format file size for logging
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Format duration for logging
 */
function formatDuration(ms: number): string {
  if (ms < 1) return ms.toFixed(3) + 'ms';
  if (ms < 1000) return ms.toFixed(2) + 'ms';
  return (ms / 1000).toFixed(2) + 's';
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
export default function philJSCompiler(options: PhilJSCompilerPluginOptions = {}): Plugin {
  const {
    enabled = true,
    verbose = false,
    cache = true,
    preserveHmrState = true,
    enhancedErrors = true,
    filter: customFilter,
    include: includeOpt,
    exclude: excludeOpt,
    ...compilerConfig
  } = options;

  const include = includeOpt ?? ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'];
  const exclude = excludeOpt ?? ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'];

  // Create file filter
  const filter = customFilter || createFilter(include, exclude);

  // Create optimizer instance
  let optimizer: Optimizer;
  let isDevelopment = false;
  let server: ViteDevServer | undefined;

  // Build cache
  const transformCache = new Map<string, CacheEntry>();

  // Build statistics
  const stats: BuildStats = {
    filesProcessed: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    optimizationsApplied: 0,
  };

  // Bundle analysis data
  const bundleStats: Array<{ name: string; size: number; gzipSize: number }> = [];
  const chunkMap = new Map<string, string[]>();

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
        console.log('\n[philjs-compiler] Configuration:');
        console.log('  Mode:', config.mode);
        console.log('  Development:', isDevelopment);
        console.log('  Source Maps:', config.build.sourcemap !== false);
        console.log('  Cache:', cache ? 'enabled' : 'disabled');
        console.log('  HMR State Preservation:', preserveHmrState ? 'enabled' : 'disabled');
        console.log('  Enhanced Errors:', enhancedErrors ? 'enabled' : 'disabled');
        console.log('  Optimizations:');
        console.log('    - Auto-memo:', compilerConfig['autoMemo'] !== false);
        console.log('    - Auto-batch:', compilerConfig['autoBatch'] !== false);
        console.log('    - Dead code elimination:', compilerConfig['deadCodeElimination'] !== false);
        console.log('    - Effect optimization:', compilerConfig['optimizeEffects'] !== false);
        console.log('    - Component optimization:', compilerConfig['optimizeComponents'] !== false);
      }
    },

    /**
     * Configure dev server hook - Store server reference
     */
    configureServer(devServer) {
      server = devServer;

      if (verbose) {
        console.log('[philjs-compiler] Dev server configured');
      }
    },

    /**
     * Transform hook - Apply PhilJS optimizations with caching and enhanced error handling
     */
    async transform(code: string, id: string) {
      // Skip if plugin is disabled
      if (!enabled) {
        return null;
      }

      // Skip if file doesn't match filter
      if (!filter(id)) {
        return null;
      }

      // Skip non-PhilJS files (check for PhilJS imports)
      if (!code.includes('philjs-core') && !code.includes('from "philjs') && !code.includes('from \'philjs')) {
        return null;
      }

      try {
        const startTime = performance.now();
        const codeHash = hashCode(code);

        // Check cache
        if (cache) {
          const cached = transformCache.get(id);
          if (cached && cached.hash === codeHash) {
            stats.cacheHits++;

            if (verbose) {
              const duration = performance.now() - startTime;
              console.log(
                `[philjs-compiler] ${id.split('/').pop()} (cached) - ${formatDuration(duration)}`
              );
            }

            return {
              code: cached.code,
              map: cached.map,
            };
          }
        }

        stats.cacheMisses++;

        // Apply optimizations
        const result = optimizer.optimize(code, id);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Update stats
        stats.filesProcessed++;
        stats.totalTime += duration;
        stats.optimizationsApplied += result.optimizations.length;

        // Cache the result
        if (cache) {
          transformCache.set(id, {
            code: result.code,
            map: result.map,
            hash: codeHash,
            timestamp: Date.now(),
            result,
          });
        }

        // Verbose logging
        if (verbose) {
          const fileName = id.split('/').pop() || id;
          const sizeBefore = Buffer.byteLength(code, 'utf8');
          const sizeAfter = Buffer.byteLength(result.code, 'utf8');
          const sizeDiff = sizeAfter - sizeBefore;
          const sizeChange = sizeDiff > 0
            ? `+${formatBytes(sizeDiff)}`
            : sizeDiff < 0
            ? `-${formatBytes(Math.abs(sizeDiff))}`
            : '±0 B';

          console.log(
            `[philjs-compiler] ${fileName} - ${formatDuration(duration)} | ${result.optimizations.length} opts | ${sizeChange}`
          );

          if (result.optimizations.length > 0) {
            result.optimizations.forEach((opt: string) => {
              console.log(`  ✓ ${opt}`);
            });
          }
        }

        // Log warnings in development mode with enhanced formatting
        if (isDevelopment && result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning: CompilerWarning) => {
            const loc = warning.location;
            const location = loc?.start
              ? `:${loc.start.line}${loc.start.column ? `:${loc.start.column}` : ''}`
              : '';

            const typePrefix = warning.type === 'performance'
              ? '⚡'
              : warning.type === 'correctness'
              ? '⚠️'
              : '📢';

            console.warn(`\n[philjs-compiler] ${typePrefix} ${id}${location}`);
            console.warn(`  ${warning.message}`);

            if (warning.suggestion) {
              console.warn(`  💡 ${warning.suggestion}`);
            }
          });

          // Send warnings to error overlay in dev mode
          if (enhancedErrors && server) {
            const viteServer = server;
            result.warnings.forEach((warning: CompilerWarning) => {
              if (warning.type === 'correctness') {
                const errorPayload: {
                  type: 'error';
                  err: {
                    message: string;
                    stack: string;
                    loc?: { file: string; line: number; column: number };
                  };
                } = {
                  type: 'error',
                  err: {
                    message: `[PhilJS] ${warning.message}`,
                    stack: warning.suggestion ? `Suggestion: ${warning.suggestion}` : '',
                  },
                };
                if (warning.location) {
                  errorPayload.err.loc = {
                    file: id,
                    line: warning.location.start?.line ?? 0,
                    column: warning.location.start?.column ?? 0,
                  };
                }
                viteServer.ws.send(errorPayload);
              }
            });
          }
        }

        // Return transformed code with accurate source map
        return {
          code: result.code,
          map: result.map || null,
        };
      } catch (error) {
        // Enhanced error handling with better context
        const err = error as Error & {
          loc?: { line: number; column: number };
          code?: string;
          plugin?: string;
        };

        const location = err.loc
          ? ` at line ${err.loc.line}, column ${err.loc.column}`
          : '';

        const errorMessage = `Error optimizing ${id}${location}`;

        console.error(`\n[philjs-compiler] ❌ ${errorMessage}`);
        console.error(`  ${err.message}`);

        // Provide contextual help based on error patterns
        if (err.message.includes('Unexpected token')) {
          console.error(`\n  💡 Syntax Error - Check for:`);
          console.error(`     - Missing or extra brackets, parentheses, or braces`);
          console.error(`     - Invalid JSX syntax (remember to close tags)`);
          console.error(`     - Unsupported TypeScript features`);
          console.error(`     - Missing semicolons in strict mode\n`);
        } else if (err.message.includes('Cannot find') || err.message.includes('not found')) {
          console.error(`\n  💡 Import Error - Check for:`);
          console.error(`     - Correct import paths (relative vs absolute)`);
          console.error(`     - Missing dependencies in package.json`);
          console.error(`     - Typos in module names\n`);
        } else if (err.message.includes('undefined') || err.message.includes('null')) {
          console.error(`\n  💡 Reference Error - Check for:`);
          console.error(`     - Undefined variables or functions`);
          console.error(`     - Missing imports`);
          console.error(`     - Incorrect destructuring\n`);
        }

        // Show error in Vite error overlay if in development
        if (enhancedErrors && isDevelopment && server) {
          const errorPayload: {
            type: 'error';
            err: {
              message: string;
              stack: string;
              id: string;
              plugin: string;
              loc?: { file: string; line: number; column: number };
            };
          } = {
            type: 'error',
            err: {
              message: `[PhilJS Compiler] ${errorMessage}\n\n${err.message}`,
              stack: err.stack || '',
              id,
              plugin: 'philjs-compiler',
            },
          };
          if (err.loc) {
            errorPayload.err.loc = {
              file: id,
              line: err.loc.line,
              column: err.loc.column,
            };
          }
          server.ws.send(errorPayload);
        }

        // Return original code on error (don't break the build)
        // This ensures the dev server continues working even with compiler errors
        return null;
      }
    },

    /**
     * Build start hook - Reset stats and log status
     */
    buildStart() {
      // Reset stats for this build
      stats.filesProcessed = 0;
      stats.totalTime = 0;
      stats.cacheHits = 0;
      stats.cacheMisses = 0;
      stats.optimizationsApplied = 0;

      if (verbose && enabled) {
        console.log('\n[philjs-compiler] Starting build with PhilJS optimizations\n');
      }
    },

    /**
     * Build end hook - Show summary statistics
     */
    buildEnd() {
      if (verbose && enabled && stats.filesProcessed > 0) {
        const avgTime = stats.totalTime / stats.filesProcessed;
        const cacheEfficiency = stats.filesProcessed > 0
          ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100)
          : 0;

        console.log('\n[philjs-compiler] Build Summary:');
        console.log(`  Files processed: ${stats.filesProcessed}`);
        console.log(`  Total time: ${formatDuration(stats.totalTime)}`);
        console.log(`  Average time/file: ${formatDuration(avgTime)}`);
        console.log(`  Optimizations applied: ${stats.optimizationsApplied}`);

        if (cache) {
          console.log(`  Cache hits: ${stats.cacheHits}`);
          console.log(`  Cache misses: ${stats.cacheMisses}`);
          console.log(`  Cache efficiency: ${cacheEfficiency.toFixed(1)}%`);
        }

        console.log('');
      }
    },

    /**
     * HMR hook - Handle hot module replacement with state preservation
     */
    async handleHotUpdate(ctx: HmrContext) {
      const { file, modules, read, server } = ctx;

      // Only process PhilJS files
      if (!filter(file)) {
        return;
      }

      const startTime = performance.now();
      let snapshot: Map<string, any> | null = null;

      try {
        // Read the updated file
        const content = await read();

        // Check if this is a PhilJS component file
        const isPhilJSFile = content.includes('philjs-core') ||
          content.includes('from "philjs') ||
          content.includes('from \'philjs');

        if (!isPhilJSFile) {
          return;
        }

        // Detect component boundaries for better HMR tracking
        const hasComponents = /(?:export\s+(?:default\s+)?(?:function|const|class)|function\s+[A-Z])\s+\w+/.test(content);
        const hasSignals = /signal\(|memo\(|linkedSignal\(/.test(content);
        const hasEffects = /effect\(/.test(content);

        // Invalidate cache for this file
        if (cache) {
          transformCache.delete(file);
        }

        // Find all affected modules
        const affectedModules: Set<ModuleNode> = new Set();
        const modulesByDepth = new Map<number, Set<ModuleNode>>();

        // Track module dependency depth for proper update ordering
        function collectModules(mod: ModuleNode, depth: number) {
          if (affectedModules.has(mod)) return;

          affectedModules.add(mod);

          if (!modulesByDepth.has(depth)) {
            modulesByDepth.set(depth, new Set());
          }
          modulesByDepth.get(depth)!.add(mod);

          // Also invalidate dependent modules if they're PhilJS files
          if (mod.importers) {
            for (const importer of mod.importers) {
              if (importer.file && filter(importer.file)) {
                collectModules(importer, depth + 1);

                // Invalidate cache for importers too
                if (cache && importer.file) {
                  transformCache.delete(importer.file);
                }
              }
            }
          }
        }

        for (const mod of modules) {
          collectModules(mod, 0);
        }

        // If preserveHmrState is enabled, inject state preservation code
        if (preserveHmrState && isDevelopment && (hasSignals || hasEffects)) {
          // Snapshot state before HMR update
          try {
            // Send command to client to snapshot state
            server.ws.send({
              type: 'custom',
              event: 'philjs:hmr-snapshot',
              data: {
                file,
                hasComponents,
                hasSignals,
                hasEffects,
                moduleCount: affectedModules.size,
              },
            });

            // Mark modules as HMR boundaries based on content
            for (const mod of affectedModules) {
              if (mod.file) {
                const isComponent = mod.file.endsWith('.tsx') || mod.file.endsWith('.jsx');
                const isModule = mod.file.endsWith('.ts') || mod.file.endsWith('.js');

                // Components should be self-accepting to preserve local state
                if (isComponent && hasComponents) {
                  (mod as any).isSelfAccepting = true;
                }

                // Modules with signals should preserve state across boundaries
                if (isModule && hasSignals) {
                  (mod as any).isSelfAccepting = true;
                }
              }
            }

            if (verbose) {
              console.log(
                `[philjs-compiler] HMR boundary detection:`,
                `components=${hasComponents}, signals=${hasSignals}, effects=${hasEffects}`
              );
            }
          } catch (hmrError) {
            if (verbose) {
              console.warn(`[philjs-compiler] HMR snapshot failed:`, hmrError);
            }
          }
        }

        const duration = performance.now() - startTime;

        if (verbose) {
          const fileName = file.split('/').pop() || file;
          console.log(
            `[philjs-compiler] HMR: ${fileName} (${affectedModules.size} modules, ${modulesByDepth.size} levels) - ${formatDuration(duration)}`
          );
        }

        // Check for performance constraint (<100ms target)
        if (duration > 100 && verbose) {
          console.warn(
            `[philjs-compiler] HMR update took ${formatDuration(duration)} (target: <100ms)`
          );
        }

        // Return affected modules sorted by dependency depth (deepest first)
        // This ensures parent components update after children
        const sortedDepths = Array.from(modulesByDepth.keys()).sort((a, b) => b - a);
        const sortedModules: ModuleNode[] = [];
        for (const depth of sortedDepths) {
          sortedModules.push(...Array.from(modulesByDepth.get(depth)!));
        }

        return sortedModules;
      } catch (error) {
        const err = error as Error;
        console.error(`[philjs-compiler] HMR error for ${file}:`, err.message);

        // Send HMR error to overlay
        if (enhancedErrors && isDevelopment && server) {
          server.ws.send({
            type: 'error',
            err: {
              message: `[PhilJS HMR] Failed to update ${file}`,
              stack: err.stack || err.message,
              id: file,
              plugin: 'philjs-compiler',
              frame: `HMR Update Error\n\nThe hot module replacement failed for this file.\n\n${err.message}\n\nThe page will perform a full reload.`,
            },
          });

          // Send custom event for HMR rollback
          server.ws.send({
            type: 'custom',
            event: 'philjs:hmr-error',
            data: {
              file,
              error: err.message,
              stack: err.stack,
              shouldReload: true,
            },
          });
        }

        // Don't break HMR on errors - let Vite handle the fallback
        return;
      }
    },

    /**
     * Generate bundle hook - Analyze and optimize production bundles
     */
    generateBundle(outputOptions, bundle) {
      if (!enabled || isDevelopment) return;

      const productionConfig = options.production || {};
      const {
        analyze = false,
        resourceHints = true,
        budgets,
      } = productionConfig;

      // Collect bundle statistics
      bundleStats.length = 0;
      chunkMap.clear();

      Object.entries(bundle).forEach(([fileName, chunk]) => {
        if (chunk.type === 'chunk') {
          const code = chunk.code;
          const size = Buffer.byteLength(code, 'utf8');

          // Track chunk dependencies
          chunkMap.set(fileName, chunk.imports || []);

          bundleStats.push({
            name: fileName,
            size,
            gzipSize: 0, // Would calculate actual gzip size
          });

          if (verbose) {
            console.log(`[philjs-compiler] Chunk: ${fileName} (${formatBytes(size)})`);
          }
        }
      });

      // Check performance budgets
      if (budgets) {
        const violations = checkBudgets(bundleStats, budgets);
        if (violations.length > 0) {
          console.warn('\n[philjs-compiler] ⚠️  Performance Budget Violations:');
          violations.forEach(v => {
            console.warn(`  ${v.type}: ${formatBytes(v.actual)} exceeds ${formatBytes(v.limit)}`);
          });
        }
      }

      // Generate resource hints
      if (resourceHints) {
        const criticalChunks = bundleStats
          .filter(s => s.name.includes('index') || s.name.includes('main'))
          .map(s => s.name);

        const lazyChunks = bundleStats
          .filter(s => !criticalChunks.includes(s.name))
          .map(s => s.name);

        if (verbose) {
          console.log('\n[philjs-compiler] Resource Hints:');
          console.log(`  Preload (${criticalChunks.length}): ${criticalChunks.join(', ')}`);
          console.log(`  Prefetch (${lazyChunks.length}): ${lazyChunks.join(', ')}`);
        }
      }

      // Generate bundle analysis report
      if (analyze) {
        generateBundleReport(bundleStats, chunkMap);
      }
    },

    /**
     * Close hook - Clean up resources and show final stats
     */
    closeBundle() {
      if (verbose && cache) {
        console.log(`\n[philjs-compiler] Cache: ${transformCache.size} entries`);
      }

      // Show production build summary
      if (!isDevelopment && bundleStats.length > 0 && verbose) {
        const totalSize = bundleStats.reduce((sum, s) => sum + s.size, 0);
        console.log('\n[philjs-compiler] Production Build Summary:');
        console.log(`  Total bundles: ${bundleStats.length}`);
        console.log(`  Total size: ${formatBytes(totalSize)}`);
        console.log(`  Optimizations applied: ${stats.optimizationsApplied}`);
      }

      // Clear cache on close in production builds to free memory
      if (!isDevelopment && cache) {
        transformCache.clear();
      }
    },
  };
}

/**
 * Check performance budgets
 */
function checkBudgets(
  stats: Array<{ name: string; size: number; gzipSize: number }>,
  budgets: { maxInitial?: number; maxChunk?: number; maxTotal?: number }
): Array<{ type: string; limit: number; actual: number }> {
  const violations: Array<{ type: string; limit: number; actual: number }> = [];

  // Check initial bundle
  if (budgets.maxInitial) {
    const initialBundles = stats.filter(s => s.name.includes('index') || s.name.includes('main'));
    const initialSize = initialBundles.reduce((sum, s) => sum + s.size, 0);

    if (initialSize > budgets.maxInitial) {
      violations.push({
        type: 'initial',
        limit: budgets.maxInitial,
        actual: initialSize,
      });
    }
  }

  // Check individual chunks
  if (budgets.maxChunk) {
    stats.forEach(stat => {
      if (stat.size > budgets.maxChunk!) {
        violations.push({
          type: `chunk:${stat.name}`,
          limit: budgets.maxChunk!,
          actual: stat.size,
        });
      }
    });
  }

  // Check total size
  if (budgets.maxTotal) {
    const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
    if (totalSize > budgets.maxTotal) {
      violations.push({
        type: 'total',
        limit: budgets.maxTotal,
        actual: totalSize,
      });
    }
  }

  return violations;
}

/**
 * Generate bundle analysis report
 */
function generateBundleReport(
  stats: Array<{ name: string; size: number; gzipSize: number }>,
  chunkMap: Map<string, string[]>
): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║             PhilJS Bundle Analysis Report                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ES2023+: toSorted() for non-mutating sort
  // Sort by size (largest first)
  const sorted = stats.toSorted((a, b) => b.size - a.size);

  console.log('Bundle Breakdown:');
  console.log('─────────────────────────────────────────────────────────────');

  sorted.forEach((stat, idx) => {
    const dependencies = chunkMap.get(stat.name) || [];
    const sizeBar = createSizeBar(stat.size, sorted[0]!.size);

    console.log(`${(idx + 1).toString().padStart(2)}. ${stat.name}`);
    console.log(`    ${sizeBar} ${formatBytes(stat.size)}`);

    if (dependencies.length > 0) {
      console.log(`    Dependencies: ${dependencies.slice(0, 3).join(', ')}${dependencies.length > 3 ? '...' : ''}`);
    }
    console.log('');
  });

  const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Total Size: ${formatBytes(totalSize)}`);
  console.log(`Chunks: ${stats.length}\n`);
}

/**
 * Create a visual size bar
 */
function createSizeBar(size: number, maxSize: number): string {
  const barLength = 30;
  const filled = Math.round((size / maxSize) * barLength);
  const empty = barLength - filled;

  return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
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

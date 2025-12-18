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
import { createFilter } from '@rollup/pluginutils';
import { Optimizer } from '../optimizer';
import { createHash } from 'crypto';
/**
 * Creates a hash for cache invalidation
 */
function hashCode(code) {
    return createHash('sha256').update(code).digest('hex').substring(0, 16);
}
/**
 * Format file size for logging
 */
function formatBytes(bytes) {
    if (bytes < 1024)
        return bytes + ' B';
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
/**
 * Format duration for logging
 */
function formatDuration(ms) {
    if (ms < 1)
        return ms.toFixed(3) + 'ms';
    if (ms < 1000)
        return ms.toFixed(2) + 'ms';
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
export default function philJSCompiler(options = {}) {
    const { enabled = true, verbose = false, cache = true, preserveHmrState = true, enhancedErrors = true, filter: customFilter, include = ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'], exclude = ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'], ...compilerConfig } = options;
    // Create file filter
    const filter = customFilter || createFilter(include, exclude);
    // Create optimizer instance
    let optimizer;
    let isDevelopment = false;
    let server;
    // Build cache
    const transformCache = new Map();
    // Build statistics
    const stats = {
        filesProcessed: 0,
        totalTime: 0,
        cacheHits: 0,
        cacheMisses: 0,
        optimizationsApplied: 0,
    };
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
                console.log('    - Auto-memo:', compilerConfig.autoMemo !== false);
                console.log('    - Auto-batch:', compilerConfig.autoBatch !== false);
                console.log('    - Dead code elimination:', compilerConfig.deadCodeElimination !== false);
                console.log('    - Effect optimization:', compilerConfig.optimizeEffects !== false);
                console.log('    - Component optimization:', compilerConfig.optimizeComponents !== false);
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
        async transform(code, id) {
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
                            console.log(`[philjs-compiler] ${id.split('/').pop()} (cached) - ${formatDuration(duration)}`);
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
                    console.log(`[philjs-compiler] ${fileName} - ${formatDuration(duration)} | ${result.optimizations.length} opts | ${sizeChange}`);
                    if (result.optimizations.length > 0) {
                        result.optimizations.forEach(opt => {
                            console.log(`  ✓ ${opt}`);
                        });
                    }
                }
                // Log warnings in development mode with enhanced formatting
                if (isDevelopment && result.warnings && result.warnings.length > 0) {
                    result.warnings.forEach(warning => {
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
                        result.warnings.forEach(warning => {
                            if (warning.type === 'correctness') {
                                server.ws.send({
                                    type: 'error',
                                    err: {
                                        message: `[PhilJS] ${warning.message}`,
                                        stack: warning.suggestion ? `Suggestion: ${warning.suggestion}` : '',
                                        loc: warning.location ? {
                                            file: id,
                                            line: warning.location.start?.line || 0,
                                            column: warning.location.start?.column || 0,
                                        } : undefined,
                                    },
                                });
                            }
                        });
                    }
                }
                // Return transformed code with accurate source map
                return {
                    code: result.code,
                    map: result.map || null,
                };
            }
            catch (error) {
                // Enhanced error handling with better context
                const err = error;
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
                }
                else if (err.message.includes('Cannot find') || err.message.includes('not found')) {
                    console.error(`\n  💡 Import Error - Check for:`);
                    console.error(`     - Correct import paths (relative vs absolute)`);
                    console.error(`     - Missing dependencies in package.json`);
                    console.error(`     - Typos in module names\n`);
                }
                else if (err.message.includes('undefined') || err.message.includes('null')) {
                    console.error(`\n  💡 Reference Error - Check for:`);
                    console.error(`     - Undefined variables or functions`);
                    console.error(`     - Missing imports`);
                    console.error(`     - Incorrect destructuring\n`);
                }
                // Show error in Vite error overlay if in development
                if (enhancedErrors && isDevelopment && server) {
                    server.ws.send({
                        type: 'error',
                        err: {
                            message: `[PhilJS Compiler] ${errorMessage}\n\n${err.message}`,
                            stack: err.stack || '',
                            id,
                            loc: err.loc ? {
                                file: id,
                                line: err.loc.line,
                                column: err.loc.column,
                            } : undefined,
                            plugin: 'philjs-compiler',
                        },
                    });
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
        async handleHotUpdate(ctx) {
            const { file, modules, read, server } = ctx;
            // Only process PhilJS files
            if (!filter(file)) {
                return;
            }
            const startTime = performance.now();
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
                // Invalidate cache for this file
                if (cache) {
                    transformCache.delete(file);
                }
                // Find all affected modules
                const affectedModules = new Set();
                for (const mod of modules) {
                    affectedModules.add(mod);
                    // Also invalidate dependent modules if they're PhilJS files
                    if (mod.importers) {
                        for (const importer of mod.importers) {
                            if (importer.file && filter(importer.file)) {
                                affectedModules.add(importer);
                                // Invalidate cache for importers too
                                if (cache && importer.file) {
                                    transformCache.delete(importer.file);
                                }
                            }
                        }
                    }
                }
                const duration = performance.now() - startTime;
                if (verbose) {
                    const fileName = file.split('/').pop() || file;
                    console.log(`[philjs-compiler] HMR: ${fileName} (${affectedModules.size} modules) - ${formatDuration(duration)}`);
                }
                // If preserveHmrState is enabled, inject state preservation code
                if (preserveHmrState && isDevelopment) {
                    // Add HMR boundary to preserve signal state
                    for (const mod of affectedModules) {
                        if (mod.file && mod.file.endsWith('.tsx') || mod.file?.endsWith('.jsx')) {
                            // Mark as HMR boundary to preserve component state
                            mod.isSelfAccepting = true;
                        }
                    }
                }
                // Return affected modules for Vite to handle
                return Array.from(affectedModules);
            }
            catch (error) {
                const err = error;
                console.error(`[philjs-compiler] HMR error for ${file}:`, err.message);
                // Don't break HMR on errors
                return;
            }
        },
        /**
         * Close hook - Clean up resources and show final stats
         */
        closeBundle() {
            if (verbose && cache) {
                console.log(`\n[philjs-compiler] Cache: ${transformCache.size} entries`);
            }
            // Clear cache on close in production builds to free memory
            if (!isDevelopment && cache) {
                transformCache.clear();
            }
        },
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
export function createPhilJSPlugin(options) {
    return philJSCompiler(options);
}
//# sourceMappingURL=vite.js.map
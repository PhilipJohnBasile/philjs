/**
 * Bundle Optimization Utilities
 *
 * Advanced build optimization for PhilJS applications:
 * - Smart tree-shaking with side-effect analysis
 * - Route-based code splitting
 * - Chunk optimization and deduplication
 * - Dead code elimination
 * - Module preloading strategies
 * - Bundle size analysis and budgets
 */

import type { Plugin, ResolvedConfig, Rollup } from 'vite';
import { createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface BundleOptimizerOptions {
  /**
   * Enable aggressive tree-shaking
   */
  treeShaking?: boolean | TreeShakingOptions;

  /**
   * Enable route-based code splitting
   */
  routeSplitting?: boolean | RouteSplittingOptions;

  /**
   * Enable chunk optimization
   */
  chunkOptimization?: boolean | ChunkOptimizationOptions;

  /**
   * Enable dead code elimination
   */
  deadCodeElimination?: boolean;

  /**
   * Module preloading strategy
   */
  preload?: PreloadStrategy;

  /**
   * Bundle size budgets
   */
  budgets?: BundleBudget[];

  /**
   * Generate bundle analysis report
   */
  analyze?: boolean | AnalyzeOptions;
}

export interface TreeShakingOptions {
  /**
   * Annotate modules as side-effect free
   */
  annotatePure?: boolean;

  /**
   * Remove unused exports
   */
  removeUnusedExports?: boolean;

  /**
   * Modules with no side effects
   */
  sideEffectFreeModules?: string[];

  /**
   * Preserve specific exports
   */
  preserveExports?: string[];
}

export interface RouteSplittingOptions {
  /**
   * Routes directory
   */
  routesDir?: string;

  /**
   * Create separate chunks per route
   */
  perRoute?: boolean;

  /**
   * Minimum chunk size (bytes)
   */
  minChunkSize?: number;

  /**
   * Maximum chunk size (bytes)
   */
  maxChunkSize?: number;

  /**
   * Shared chunk threshold
   */
  sharedThreshold?: number;
}

export interface ChunkOptimizationOptions {
  /**
   * Deduplicate modules across chunks
   */
  dedupe?: boolean;

  /**
   * Extract common dependencies
   */
  extractCommon?: boolean;

  /**
   * Vendor chunk strategy
   */
  vendor?: 'auto' | 'manual' | 'none';

  /**
   * Manual vendor modules
   */
  vendorModules?: string[];

  /**
   * Chunk naming strategy
   */
  naming?: 'hash' | 'content-hash' | 'name';
}

export type PreloadStrategy =
  | 'none'
  | 'critical'
  | 'visible'
  | 'all'
  | {
      critical?: string[];
      preload?: string[];
      prefetch?: string[];
    };

export interface BundleBudget {
  /**
   * Budget name
   */
  name: string;

  /**
   * File pattern
   */
  pattern?: string;

  /**
   * Maximum size (bytes)
   */
  maxSize: number;

  /**
   * Warning threshold (0-1)
   */
  warning?: number;

  /**
   * Error on exceed
   */
  error?: boolean;
}

export interface AnalyzeOptions {
  /**
   * Output file
   */
  outputFile?: string;

  /**
   * Include source maps
   */
  sourceMaps?: boolean;

  /**
   * Show treemap
   */
  treemap?: boolean;

  /**
   * Show dependencies
   */
  dependencies?: boolean;
}

export interface BundleStats {
  totalSize: number;
  chunkCount: number;
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  duplicates: DuplicateModule[];
  budgetViolations: BudgetViolation[];
}

export interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  modules: number;
  imports: string[];
  exports: string[];
}

export interface ModuleInfo {
  id: string;
  size: number;
  chunks: string[];
  imports: string[];
  exports: string[];
  usedExports: string[];
  sideEffects: boolean;
}

export interface DuplicateModule {
  id: string;
  chunks: string[];
  totalSize: number;
  wastedSize: number;
}

export interface BudgetViolation {
  budget: string;
  actualSize: number;
  maxSize: number;
  exceeded: number;
  percentage: number;
}

// ============================================================================
// Bundle Optimizer Plugin
// ============================================================================

export function bundleOptimizerPlugin(
  options: BundleOptimizerOptions = {}
): Plugin {
  const {
    treeShaking = true,
    routeSplitting = true,
    chunkOptimization = true,
    deadCodeElimination = true,
    preload = 'critical',
    budgets = [],
    analyze = false,
  } = options;

  let config: ResolvedConfig;
  const stats: BundleStats = {
    totalSize: 0,
    chunkCount: 0,
    chunks: [],
    modules: [],
    duplicates: [],
    budgetViolations: [],
  };

  return {
    name: 'philjs-bundle-optimizer',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    // Optimize imports and tree-shaking
    transform(code, id) {
      if (!treeShaking) return null;

      const treeShakeOpts = typeof treeShaking === 'object' ? treeShaking : {};

      // Annotate pure functions for better tree-shaking
      if (treeShakeOpts.annotatePure) {
        code = annotatePureFunctions(code);
      }

      // Mark side-effect free modules
      if (
        treeShakeOpts.sideEffectFreeModules?.some(pattern =>
          id.includes(pattern)
        )
      ) {
        // This is handled by package.json sideEffects field in production
        // But we can optimize during transform
        code = `/* @__PURE__ */\n${code}`;
      }

      return { code, map: null };
    },

    // Configure build options
    config() {
      const buildOptions: any = {
        rollupOptions: {
          output: {},
        },
      };

      // Configure tree-shaking
      if (treeShaking) {
        buildOptions.rollupOptions.treeshake = {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        };
      }

      // Configure chunk splitting
      if (chunkOptimization) {
        const chunkOpts = typeof chunkOptimization === 'object' ? chunkOptimization : {};

        buildOptions.rollupOptions.output.manualChunks = (id: string) => {
          // Extract vendor chunks
          if (chunkOpts.vendor === 'auto' || chunkOpts.vendor === 'manual') {
            if (id.includes('node_modules')) {
              // Split large vendors
              if (id.includes('react') || id.includes('preact')) {
                return 'vendor-react';
              }
              if (chunkOpts.vendorModules?.some(m => id.includes(m))) {
                return 'vendor';
              }
              return 'vendor-libs';
            }
          }

          // Route-based splitting
          if (routeSplitting) {
            const routeOpts = typeof routeSplitting === 'object' ? routeSplitting : {};
            const routesDir = routeOpts.routesDir || 'routes';

            if (id.includes(routesDir)) {
              const match = id.match(new RegExp(`${routesDir}/([^/]+)`));
              if (match) {
                return `route-${match[1]}`;
              }
            }
          }

          return undefined;
        };

        // Configure chunk naming
        if (chunkOpts.naming === 'content-hash') {
          buildOptions.rollupOptions.output.chunkFileNames = '[name].[hash].js';
          buildOptions.rollupOptions.output.assetFileNames = '[name].[hash].[ext]';
        }
      }

      return buildOptions;
    },

    // Analyze bundle after build
    generateBundle(outputOptions, bundle) {
      // Collect stats
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk') {
          const chunkSize = chunk.code.length;
          stats.totalSize += chunkSize;
          stats.chunkCount++;

          stats.chunks.push({
            id: fileName,
            name: chunk.name,
            size: chunkSize,
            modules: Object.keys(chunk.modules).length,
            imports: chunk.imports,
            exports: chunk.exports || [],
          });

          // Track modules
          for (const [moduleId, module] of Object.entries(chunk.modules)) {
            const moduleSize = module.code?.length || 0;

            const existing = stats.modules.find(m => m.id === moduleId);
            if (existing) {
              existing.chunks.push(fileName);
            } else {
              stats.modules.push({
                id: moduleId,
                size: moduleSize,
                chunks: [fileName],
                imports: module.importedIds || [],
                exports: [], // Would need AST analysis
                usedExports: [],
                sideEffects: !module.removedExports,
              });
            }
          }
        }
      }

      // Find duplicates
      for (const module of stats.modules) {
        if (module.chunks.length > 1) {
          const wastedSize = module.size * (module.chunks.length - 1);
          stats.duplicates.push({
            id: module.id,
            chunks: module.chunks,
            totalSize: module.size * module.chunks.length,
            wastedSize,
          });
        }
      }

      // Check budgets
      for (const budget of budgets) {
        let actualSize = 0;

        if (budget.pattern) {
          const regex = new RegExp(budget.pattern);
          actualSize = stats.chunks
            .filter(c => regex.test(c.id))
            .reduce((sum, c) => sum + c.size, 0);
        } else {
          actualSize = stats.totalSize;
        }

        if (actualSize > budget.maxSize) {
          const exceeded = actualSize - budget.maxSize;
          const percentage = (exceeded / budget.maxSize) * 100;

          stats.budgetViolations.push({
            budget: budget.name,
            actualSize,
            maxSize: budget.maxSize,
            exceeded,
            percentage,
          });

          const message = `[Bundle Budget] ${budget.name}: ${formatBytes(actualSize)} exceeds budget of ${formatBytes(budget.maxSize)} by ${formatBytes(exceeded)} (${percentage.toFixed(1)}%)`;

          if (budget.error) {
            this.error(message);
          } else {
            this.warn(message);
          }
        }
      }

      // Generate analysis report
      if (analyze) {
        const analyzeOpts = typeof analyze === 'object' ? analyze : {};
        generateAnalysisReport(stats, analyzeOpts);
      }
    },

    // Log bundle stats
    closeBundle() {
      console.log('\n[Bundle Optimizer] Stats:');
      console.log(`  Total Size: ${formatBytes(stats.totalSize)}`);
      console.log(`  Chunks: ${stats.chunkCount}`);
      console.log(`  Modules: ${stats.modules.length}`);

      if (stats.duplicates.length > 0) {
        console.log(`  Duplicates: ${stats.duplicates.length} (wasted ${formatBytes(stats.duplicates.reduce((sum, d) => sum + d.wastedSize, 0))})`);
      }

      if (stats.budgetViolations.length > 0) {
        console.log(`  Budget Violations: ${stats.budgetViolations.length}`);
      }

      // Show top chunks
      const topChunks = stats.chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);

      console.log('\n  Top Chunks:');
      for (const chunk of topChunks) {
        console.log(`    ${chunk.name}: ${formatBytes(chunk.size)} (${chunk.modules} modules)`);
      }
    },
  };
}

// ============================================================================
// Tree-Shaking Utilities
// ============================================================================

/**
 * Annotate pure functions for better tree-shaking
 */
function annotatePureFunctions(code: string): string {
  // Simple regex-based annotation (production should use AST)
  const patterns = [
    // Function calls
    /(\w+)\(/g,
    // Method calls
    /\.(\w+)\(/g,
    // Constructor calls
    /new (\w+)\(/g,
  ];

  const pureFunctions = new Set([
    'createSignal',
    'createMemo',
    'createEffect',
    'createResource',
    'createContext',
  ]);

  let annotated = code;

  for (const pattern of patterns) {
    annotated = annotated.replace(pattern, (match, name) => {
      if (pureFunctions.has(name)) {
        return `/*#__PURE__*/ ${match}`;
      }
      return match;
    });
  }

  return annotated;
}

/**
 * Detect unused exports
 */
export function detectUnusedExports(
  modules: Map<string, Set<string>>,
  imports: Map<string, Set<string>>
): Map<string, string[]> {
  const unused = new Map<string, string[]>();

  for (const [moduleId, exports] of modules) {
    const imported = imports.get(moduleId) || new Set<string>();
    // ES2024: Use Set.difference() for cleaner set operations
    const unusedExports = [...exports.difference(imported)];

    if (unusedExports.length > 0) {
      unused.set(moduleId, unusedExports);
    }
  }

  return unused;
}

// ============================================================================
// Chunk Optimization
// ============================================================================

/**
 * Calculate optimal chunk sizes
 */
export function calculateOptimalChunks(
  modules: ModuleInfo[],
  options: {
    minSize?: number;
    maxSize?: number;
    targetSize?: number;
  } = {}
): Map<string, ModuleInfo[]> {
  const {
    minSize = 20 * 1024, // 20 KB
    maxSize = 500 * 1024, // 500 KB
    targetSize = 200 * 1024, // 200 KB
  } = options;

  const chunks = new Map<string, ModuleInfo[]>();
  const sorted = modules.sort((a, b) => b.size - a.size);

  let currentChunk: ModuleInfo[] = [];
  let currentSize = 0;
  let chunkId = 0;

  for (const module of sorted) {
    if (currentSize + module.size > maxSize && currentChunk.length > 0) {
      // Start new chunk
      chunks.set(`chunk-${chunkId++}`, currentChunk);
      currentChunk = [];
      currentSize = 0;
    }

    currentChunk.push(module);
    currentSize += module.size;

    if (currentSize >= targetSize) {
      chunks.set(`chunk-${chunkId++}`, currentChunk);
      currentChunk = [];
      currentSize = 0;
    }
  }

  if (currentChunk.length > 0) {
    if (currentSize < minSize && chunks.size > 0) {
      // Merge with last chunk
      const lastKey = Array.from(chunks.keys()).pop()!;
      const lastChunk = chunks.get(lastKey)!;
      chunks.set(lastKey, [...lastChunk, ...currentChunk]);
    } else {
      chunks.set(`chunk-${chunkId}`, currentChunk);
    }
  }

  return chunks;
}

/**
 * Find common dependencies across chunks
 */
export function findCommonDependencies(
  chunks: ChunkInfo[],
  threshold = 0.5
): Set<string> {
  const moduleCounts = new Map<string, number>();

  for (const chunk of chunks) {
    const modules = new Set<string>();
    // Collect all module IDs from imports
    for (const imp of chunk.imports) {
      modules.add(imp);
    }

    for (const module of modules) {
      moduleCounts.set(module, (moduleCounts.get(module) || 0) + 1);
    }
  }

  const common = new Set<string>();
  const minChunks = Math.ceil(chunks.length * threshold);

  for (const [module, count] of moduleCounts) {
    if (count >= minChunks) {
      common.add(module);
    }
  }

  return common;
}

// ============================================================================
// Analysis & Reporting
// ============================================================================

/**
 * Generate bundle analysis report
 */
async function generateAnalysisReport(
  stats: BundleStats,
  options: AnalyzeOptions = {}
): Promise<void> {
  const {
    outputFile = 'bundle-analysis.json',
    treemap = false,
  } = options;

  const report = {
    summary: {
      totalSize: stats.totalSize,
      chunkCount: stats.chunkCount,
      moduleCount: stats.modules.length,
      duplicates: stats.duplicates.length,
      wastedSize: stats.duplicates.reduce((sum, d) => sum + d.wastedSize, 0),
    },
    chunks: stats.chunks.map(c => ({
      name: c.name,
      size: c.size,
      sizeFormatted: formatBytes(c.size),
      modules: c.modules,
      percentage: ((c.size / stats.totalSize) * 100).toFixed(2) + '%',
    })),
    modules: stats.modules.map(m => ({
      id: m.id,
      size: m.size,
      sizeFormatted: formatBytes(m.size),
      chunks: m.chunks,
      chunkCount: m.chunks.length,
      sideEffects: m.sideEffects,
    })),
    duplicates: stats.duplicates.map(d => ({
      id: d.id,
      chunks: d.chunks,
      totalSize: d.totalSize,
      wastedSize: d.wastedSize,
      wastedFormatted: formatBytes(d.wastedSize),
    })),
    budgets: stats.budgetViolations,
  };

  // Write to file
  try {
    const fs = await import('fs');
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`\n[Bundle Analyzer] Report written to ${outputFile}`);
  } catch (error) {
    console.error('[Bundle Analyzer] Failed to write report:', error);
  }

  if (treemap) {
    await generateTreeMap(stats);
  }
}

/**
 * Generate treemap visualization
 */
async function generateTreeMap(stats: BundleStats): Promise<void> {
  // Generate HTML treemap (simplified)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Treemap</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
    .treemap { display: flex; flex-wrap: wrap; height: 100vh; }
    .chunk { border: 1px solid #ccc; padding: 8px; overflow: hidden; }
    .chunk-name { font-weight: bold; margin-bottom: 4px; }
    .chunk-size { font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="treemap">
    ${stats.chunks
      .map(
        chunk => `
      <div class="chunk" style="flex: ${chunk.size}; background: hsl(${(chunk.size / stats.totalSize) * 360}, 70%, 80%)">
        <div class="chunk-name">${chunk.name}</div>
        <div class="chunk-size">${formatBytes(chunk.size)}</div>
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
  `;

  try {
    const fs = await import('fs');
    fs.writeFileSync('bundle-treemap.html', html);
    console.log('[Bundle Analyzer] Treemap written to bundle-treemap.html');
  } catch (error) {
    console.error('[Bundle Analyzer] Failed to write treemap:', error);
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Generate content hash
 */
export function generateContentHash(content: string): string {
  return createHash('md5').update(content).digest('hex').slice(0, 8);
}

/**
 * Estimate gzipped size
 */
export function estimateGzipSize(content: string): number {
  // Rough estimate: ~30% of original size
  return Math.floor(content.length * 0.3);
}

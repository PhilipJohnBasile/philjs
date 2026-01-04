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
import type { Plugin } from 'vite';
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
export type PreloadStrategy = 'none' | 'critical' | 'visible' | 'all' | {
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
export declare function bundleOptimizerPlugin(options?: BundleOptimizerOptions): Plugin;
/**
 * Detect unused exports
 */
export declare function detectUnusedExports(modules: Map<string, Set<string>>, imports: Map<string, Set<string>>): Map<string, string[]>;
/**
 * Calculate optimal chunk sizes
 */
export declare function calculateOptimalChunks(modules: ModuleInfo[], options?: {
    minSize?: number;
    maxSize?: number;
    targetSize?: number;
}): Map<string, ModuleInfo[]>;
/**
 * Find common dependencies across chunks
 */
export declare function findCommonDependencies(chunks: ChunkInfo[], threshold?: number): Set<string>;
/**
 * Generate content hash
 */
export declare function generateContentHash(content: string): string;
/**
 * Estimate gzipped size
 */
export declare function estimateGzipSize(content: string): number;
//# sourceMappingURL=bundle-optimizer.d.ts.map
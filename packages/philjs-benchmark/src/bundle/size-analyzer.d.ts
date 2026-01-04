/**
 * Bundle size analyzer.
 * Analyzes bundle sizes and tree-shaking effectiveness.
 */
import type { BenchmarkSuite } from '../types.js';
/**
 * Bundle analysis result.
 */
export interface BundleAnalysis {
    name: string;
    rawSize: number;
    minSize: number;
    gzipSize: number;
    brotliSize?: number;
}
/**
 * Tree-shaking analysis result.
 */
export interface TreeShakingAnalysis {
    fullBundleSize: number;
    minimalBundleSize: number;
    treeShakenPercentage: number;
    unusedExports: string[];
}
/**
 * Analyze a single bundle file.
 */
export declare function analyzeBundle(filePath: string): Promise<BundleAnalysis>;
/**
 * Estimate PhilJS core bundle size.
 */
export declare function estimateCoreSize(): Promise<BundleAnalysis>;
/**
 * Estimate full framework size (core + all features).
 */
export declare function estimateFullSize(): Promise<BundleAnalysis>;
/**
 * Analyze tree-shaking effectiveness.
 */
export declare function analyzeTreeShaking(): Promise<TreeShakingAnalysis>;
/**
 * Compare bundle sizes with other frameworks.
 */
export declare function compareWithFrameworks(): Promise<Record<string, BundleAnalysis>>;
/**
 * Analyze code splitting overhead.
 */
export declare function analyzeCodeSplitting(): Promise<{
    routerChunkSize: number;
    lazyComponentOverhead: number;
    dynamicImportRuntime: number;
}>;
/**
 * Run bundle size benchmarks.
 */
export declare function runBundleBenchmarks(options?: {
    verbose?: boolean;
}): Promise<BenchmarkSuite>;
export default runBundleBenchmarks;
//# sourceMappingURL=size-analyzer.d.ts.map
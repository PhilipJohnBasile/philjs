/**
 * Utility functions for benchmarking.
 */
import type { BenchmarkResult, BenchmarkOptions, Benchmark, EnvironmentInfo } from './types.js';
/**
 * Default benchmark options.
 */
export declare const DEFAULT_OPTIONS: Required<BenchmarkOptions>;
/**
 * Generate a random label for a row.
 */
export declare function randomLabel(): string;
/**
 * High-resolution timer for benchmarks.
 */
export declare function now(): number;
/**
 * Calculate statistics from benchmark samples.
 */
export declare function calculateStats(samples: number[]): {
    mean: number;
    median: number;
    min: number;
    max: number;
    stddev: number;
};
/**
 * Run a benchmark with proper warmup and iterations.
 */
export declare function runBenchmark(benchmark: Benchmark, options?: BenchmarkOptions): Promise<BenchmarkResult>;
/**
 * Run multiple benchmarks sequentially.
 */
export declare function runBenchmarkSuite(benchmarks: Benchmark[], options?: BenchmarkOptions): Promise<BenchmarkResult[]>;
/**
 * Format a benchmark result for display.
 */
export declare function formatResult(result: BenchmarkResult): string;
/**
 * Get environment information.
 */
export declare function getEnvironmentInfo(): EnvironmentInfo;
/**
 * Compare two benchmark results.
 */
export declare function compareResults(baseline: BenchmarkResult, current: BenchmarkResult): {
    difference: number;
    percentage: string;
    faster: boolean;
};
/**
 * Create a mock DOM environment for benchmarks.
 */
export declare function createMockDOM(): {
    document: {
        createElement: (tag: string) => any;
        createTextNode: (text: string) => any;
        body: any;
    };
    window: any;
};
/**
 * Wait for the next microtask.
 */
export declare function nextTick(): Promise<void>;
/**
 * Force garbage collection if available.
 */
export declare function gc(): void;
/**
 * Get current memory usage.
 */
export declare function getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
};
//# sourceMappingURL=utils.d.ts.map
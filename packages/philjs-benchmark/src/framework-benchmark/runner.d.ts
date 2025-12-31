/**
 * Framework benchmark runner - compatible with js-framework-benchmark.
 * Runs all framework benchmarks and generates results.
 */
import type { BenchmarkSuite, BenchmarkOptions } from '../types.js';
/**
 * All framework benchmarks.
 */
export declare const allFrameworkBenchmarks: import("../types.js").Benchmark[];
/**
 * Core js-framework-benchmark compatible tests.
 */
export declare const coreFrameworkBenchmarks: import("../types.js").Benchmark[];
/**
 * Run all framework benchmarks.
 */
export declare function runFrameworkBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>;
/**
 * Run only the core js-framework-benchmark compatible tests.
 */
export declare function runCoreBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>;
export default runFrameworkBenchmarks;
//# sourceMappingURL=runner.d.ts.map
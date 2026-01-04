/**
 * SSR benchmarks index.
 * Exports all SSR benchmark suites and a runner.
 */
import type { BenchmarkSuite, BenchmarkOptions } from '../types.js';
export { renderTimeBenchmarks } from './render-time.js';
export { hydrationBenchmarks } from './hydration.js';
export { streamingBenchmarks } from './streaming.js';
/**
 * All SSR benchmarks.
 */
export declare const allSSRBenchmarks: import("../types.js").Benchmark[];
/**
 * Core SSR benchmarks (quick run).
 */
export declare const coreSSRBenchmarks: import("../types.js").Benchmark[];
/**
 * Run all SSR benchmarks.
 */
export declare function runSSRBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>;
/**
 * Run core SSR benchmarks (quick run).
 */
export declare function runCoreSSRBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>;
export default runSSRBenchmarks;
//# sourceMappingURL=index.d.ts.map
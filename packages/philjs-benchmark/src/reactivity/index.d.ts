/**
 * Reactivity benchmarks index.
 * Exports all reactivity benchmark suites and a runner.
 */
import type { BenchmarkSuite, BenchmarkOptions } from '../types.js';
export { signalBenchmarks } from './signals.js';
export { effectBenchmarks } from './effects.js';
export { memoBenchmarks } from './memos.js';
export { batchBenchmarks } from './batch.js';
/**
 * All reactivity benchmarks.
 */
export declare const allReactivityBenchmarks: import("../types.js").Benchmark[];
/**
 * Core reactivity benchmarks (quick run).
 */
export declare const coreReactivityBenchmarks: import("../types.js").Benchmark[];
/**
 * Run all reactivity benchmarks.
 */
export declare function runReactivityBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>;
/**
 * Run core reactivity benchmarks (quick run).
 */
export declare function runCoreReactivityBenchmarks(options?: BenchmarkOptions): Promise<BenchmarkSuite>;
export default runReactivityBenchmarks;
//# sourceMappingURL=index.d.ts.map
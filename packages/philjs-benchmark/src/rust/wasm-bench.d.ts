/**
 * Rust/WASM benchmarks.
 * Compares performance between JavaScript and WASM implementations.
 */
import type { BenchmarkSuite, Benchmark } from '../types.js';
/**
 * WASM initialization benchmark.
 */
export declare const wasmInitialization: Benchmark;
/**
 * Compare signal creation: JS vs WASM.
 */
export declare const signalCreationComparison: Benchmark;
/**
 * Compare signal updates: JS vs WASM.
 */
export declare const signalUpdateComparison: Benchmark;
/**
 * Compare DOM manipulation: JS vs WASM.
 */
export declare const domManipulationComparison: Benchmark;
/**
 * Compare memory usage: JS vs WASM.
 */
export declare const memoryComparison: Benchmark;
/**
 * Batch operations comparison.
 */
export declare const batchComparison: Benchmark;
/**
 * Heavy computation comparison.
 */
export declare const heavyComputationComparison: Benchmark;
/**
 * String handling comparison (JS typically wins here).
 */
export declare const stringHandlingComparison: Benchmark;
export declare const wasmBenchmarks: Benchmark[];
/**
 * Run all WASM benchmarks.
 */
export declare function runWasmBenchmarks(options?: {
    verbose?: boolean;
}): Promise<BenchmarkSuite>;
export default runWasmBenchmarks;
//# sourceMappingURL=wasm-bench.d.ts.map
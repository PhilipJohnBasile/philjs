/**
 * Batch update benchmarks.
 * Tests batching performance and its impact on reactivity.
 */
import type { Benchmark } from '../types.js';
/**
 * Batch 100 updates.
 */
export declare const batch100Updates: Benchmark;
/**
 * Batch 1000 updates.
 */
export declare const batch1000Updates: Benchmark;
/**
 * Batch 10000 updates.
 */
export declare const batch10000Updates: Benchmark;
/**
 * Batch vs unbatched comparison - unbatched baseline.
 */
export declare const unbatched1000Updates: Benchmark;
/**
 * Batch multiple signals.
 */
export declare const batchMultipleSignals: Benchmark;
/**
 * Nested batches.
 */
export declare const nestedBatches: Benchmark;
/**
 * Batch with derived values.
 */
export declare const batchWithDerived: Benchmark;
/**
 * Batch with diamond dependency.
 */
export declare const batchDiamondDependency: Benchmark;
/**
 * Batch with multiple effects.
 */
export declare const batchMultipleEffects: Benchmark;
/**
 * Batch return value.
 */
export declare const batchReturnValue: Benchmark;
/**
 * Interleaved batch and non-batch.
 */
export declare const interleavedBatch: Benchmark;
/**
 * Batch array operations.
 */
export declare const batchArrayOperations: Benchmark;
export declare const batchBenchmarks: Benchmark[];
export default batchBenchmarks;
//# sourceMappingURL=batch.d.ts.map
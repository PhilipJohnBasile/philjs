/**
 * Update rows benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to perform partial updates efficiently.
 */
import type { Benchmark } from '../types.js';
/**
 * Update every 10th row benchmark (1,000 rows).
 */
export declare const updateEvery10thRow: Benchmark;
/**
 * Update every 10th row with batching benchmark (1,000 rows).
 */
export declare const updateEvery10thRowBatched: Benchmark;
/**
 * Partial update benchmark (update 100 random rows).
 */
export declare const partialUpdate: Benchmark;
/**
 * Single row update benchmark.
 */
export declare const singleRowUpdate: Benchmark;
/**
 * Coarse-grained update (replace entire rows array).
 */
export declare const coarseGrainedUpdate: Benchmark;
export declare const updateRowsBenchmarks: Benchmark[];
export default updateRowsBenchmarks;
//# sourceMappingURL=update-rows.d.ts.map
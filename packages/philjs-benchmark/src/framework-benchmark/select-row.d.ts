/**
 * Select row benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to handle selection state efficiently.
 */
import type { Benchmark } from '../types.js';
/**
 * Select row benchmark.
 */
export declare const selectRow: Benchmark;
/**
 * Select row with fine-grained signals.
 */
export declare const selectRowFineGrained: Benchmark;
/**
 * Select row with fine-grained signals and batching.
 */
export declare const selectRowBatched: Benchmark;
/**
 * Select row with computed/memo.
 */
export declare const selectRowComputed: Benchmark;
/**
 * Toggle selection rapidly.
 */
export declare const toggleSelection: Benchmark;
export declare const selectRowBenchmarks: Benchmark[];
export default selectRowBenchmarks;
//# sourceMappingURL=select-row.d.ts.map
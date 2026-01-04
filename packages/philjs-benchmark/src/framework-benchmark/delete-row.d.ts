/**
 * Delete row benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to handle deletions efficiently.
 */
import type { Benchmark } from '../types.js';
/**
 * Remove row benchmark.
 */
export declare const removeRow: Benchmark;
export declare const deleteRow: Benchmark;
/**
 * Remove row with keyed reconciliation.
 */
export declare const removeRowKeyed: Benchmark;
/**
 * Remove first row.
 */
export declare const removeFirstRow: Benchmark;
/**
 * Remove last row.
 */
export declare const removeLastRow: Benchmark;
/**
 * Remove multiple rows (10 at once).
 */
export declare const removeMultipleRows: Benchmark;
/**
 * Clear all rows benchmark.
 */
export declare const clearRows: Benchmark;
/**
 * Clear 10,000 rows benchmark.
 */
export declare const clear10000Rows: Benchmark;
export declare const deleteRowBenchmarks: Benchmark[];
export default deleteRowBenchmarks;
//# sourceMappingURL=delete-row.d.ts.map
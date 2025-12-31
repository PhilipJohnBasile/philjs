/**
 * Create rows benchmarks - compatible with js-framework-benchmark.
 * Tests the framework's ability to create and render large numbers of rows.
 */
import type { Benchmark } from '../types.js';
/**
 * Create 1,000 rows benchmark.
 */
export declare const create1000Rows: Benchmark;
/**
 * Create 10,000 rows benchmark.
 */
export declare const create10000Rows: Benchmark;
/**
 * Append 1,000 rows benchmark (start with 1,000 rows and add 1,000 more).
 */
export declare const append1000Rows: Benchmark;
/**
 * Replace all rows benchmark (replace 1,000 rows with new 1,000 rows).
 */
export declare const replaceAllRows: Benchmark;
/**
 * Non-reactive baseline for comparison.
 */
export declare const create1000RowsNonReactive: Benchmark;
export declare const createRowsBenchmarks: Benchmark[];
export default createRowsBenchmarks;
//# sourceMappingURL=create-rows.d.ts.map
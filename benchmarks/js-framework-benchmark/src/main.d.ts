/**
 * PhilJS Benchmark for js-framework-benchmark
 *
 * Implements the standard benchmark operations:
 * - Create 1000 rows
 * - Create 10000 rows
 * - Append 1000 rows
 * - Update every 10th row
 * - Select row
 * - Swap rows
 * - Remove row
 * - Clear all rows
 *
 * @see https://github.com/nickyvanurk/js-framework-benchmark
 */
declare function create(): void;
declare function createMany(): void;
declare function append(): void;
declare function updateEvery10th(): void;
declare function clear(): void;
declare function swapRows(): void;
declare function selectRow(id: number): void;
declare function removeRow(id: number): void;
export { create, createMany, append, updateEvery10th, clear, swapRows, selectRow, removeRow };
//# sourceMappingURL=main.d.ts.map
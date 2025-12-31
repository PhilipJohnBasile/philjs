/**
 * Memo/computed value benchmarks.
 * Tests derived value computation and caching performance.
 */
import type { Benchmark } from '../types.js';
/**
 * Create 100k memos.
 */
export declare const create100kMemos: Benchmark;
/**
 * Create 10k memos.
 */
export declare const create10kMemos: Benchmark;
/**
 * Memo caching performance (read cached value).
 */
export declare const memoCaching: Benchmark;
/**
 * Memo recomputation performance.
 */
export declare const memoRecomputation: Benchmark;
/**
 * Chain of memos.
 */
export declare const memoChain: Benchmark;
/**
 * Wide memo tree.
 */
export declare const wideMemoTree: Benchmark;
/**
 * Memo with expensive computation.
 */
export declare const memoExpensiveComputation: Benchmark;
/**
 * Memo with filter/map operations.
 */
export declare const memoFilterMap: Benchmark;
/**
 * Memo equality check with objects.
 */
export declare const memoObjectEquality: Benchmark;
/**
 * Cascading memos.
 */
export declare const cascadingMemos: Benchmark;
/**
 * Memo with conditional logic.
 */
export declare const memoConditional: Benchmark;
/**
 * Multiple memos with shared dependency.
 */
export declare const memosSharedDependency: Benchmark;
export declare const memoBenchmarks: Benchmark[];
export default memoBenchmarks;
//# sourceMappingURL=memos.d.ts.map
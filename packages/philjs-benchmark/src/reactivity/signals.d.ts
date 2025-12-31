/**
 * Signal creation and update benchmarks.
 * Tests the core reactivity primitives performance.
 */
import type { Benchmark } from '../types.js';
/**
 * Create 1 million signals.
 */
export declare const createMillionSignals: Benchmark;
/**
 * Create 100k signals.
 */
export declare const create100kSignals: Benchmark;
/**
 * Create 10k signals.
 */
export declare const create10kSignals: Benchmark;
/**
 * Signal read performance (1M reads).
 */
export declare const readMillionSignals: Benchmark;
/**
 * Signal write performance (100k writes).
 */
export declare const write100kSignals: Benchmark;
/**
 * Signal write with updater function (100k writes).
 */
export declare const writeUpdater100k: Benchmark;
/**
 * Wide signal graph (1000 signals, each with 10 dependents).
 */
export declare const wideSignalGraph: Benchmark;
/**
 * Deep signal graph (chain of 1000 memos).
 */
export declare const deepSignalGraph: Benchmark;
/**
 * Diamond dependency pattern.
 */
export declare const diamondDependency: Benchmark;
/**
 * Multiple diamond dependencies.
 */
export declare const multipleDiamonds: Benchmark;
/**
 * Untrack performance.
 */
export declare const untrackPerformance: Benchmark;
/**
 * Signal peek performance.
 */
export declare const peekPerformance: Benchmark;
/**
 * Object signal updates.
 */
export declare const objectSignalUpdates: Benchmark;
/**
 * Array signal updates.
 */
export declare const arraySignalUpdates: Benchmark;
export declare const signalBenchmarks: Benchmark[];
export default signalBenchmarks;
//# sourceMappingURL=signals.d.ts.map
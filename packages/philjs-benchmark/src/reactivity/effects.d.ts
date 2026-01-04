/**
 * Effect execution benchmarks.
 * Tests effect creation, execution, and cleanup performance.
 */
import type { Benchmark } from '../types.js';
/**
 * Create 10k effects.
 */
export declare const create10kEffects: Benchmark;
/**
 * Create 1k effects.
 */
export declare const create1kEffects: Benchmark;
/**
 * Effect with single dependency update.
 */
export declare const effectSingleDependency: Benchmark;
/**
 * Effect with multiple dependencies.
 */
export declare const effectMultipleDependencies: Benchmark;
/**
 * Effect cleanup performance.
 */
export declare const effectCleanup: Benchmark;
/**
 * Effect disposal performance.
 */
export declare const effectDisposal: Benchmark;
/**
 * Nested effects.
 */
export declare const nestedEffects: Benchmark;
/**
 * Effect with conditional dependencies.
 */
export declare const conditionalDependencies: Benchmark;
/**
 * Effect with root scope.
 */
export declare const effectInRoot: Benchmark;
/**
 * Many effects on same signal.
 */
export declare const manyEffectsSameSignal: Benchmark;
/**
 * Effect execution order verification.
 */
export declare const effectExecutionOrder: Benchmark;
export declare const effectBenchmarks: Benchmark[];
export default effectBenchmarks;
//# sourceMappingURL=effects.d.ts.map
/**
 * Hydration benchmarks.
 * Tests client-side hydration performance.
 */
import type { Benchmark } from '../types.js';
/**
 * Hydration of 100 rows.
 */
export declare const hydrate100Rows: Benchmark;
/**
 * Hydration of 1000 rows.
 */
export declare const hydrate1000Rows: Benchmark;
/**
 * Hydration with reactive state.
 */
export declare const hydrateWithState: Benchmark;
/**
 * Time to interactive simulation.
 */
export declare const timeToInteractive: Benchmark;
/**
 * Partial hydration simulation.
 */
export declare const partialHydration: Benchmark;
/**
 * Progressive hydration simulation.
 */
export declare const progressiveHydration: Benchmark;
export declare const hydrationBenchmarks: Benchmark[];
export default hydrationBenchmarks;
//# sourceMappingURL=hydration.d.ts.map
/**
 * SSR render time benchmarks.
 * Tests server-side rendering performance.
 */
import type { Benchmark } from '../types.js';
/**
 * Render simple elements benchmark.
 */
export declare const renderSimpleElements: Benchmark;
/**
 * Render 1000 rows benchmark.
 */
export declare const render1000Rows: Benchmark;
/**
 * Render 10000 rows benchmark.
 */
export declare const render10000Rows: Benchmark;
/**
 * Render full page benchmark.
 */
export declare const renderFullPage: Benchmark;
/**
 * Render deeply nested components.
 */
export declare const renderDeepNesting: Benchmark;
/**
 * Render with fragments.
 */
export declare const renderWithFragments: Benchmark;
/**
 * Render with many attributes.
 */
export declare const renderManyAttributes: Benchmark;
/**
 * Render with reactive signals.
 */
export declare const renderWithSignals: Benchmark;
/**
 * Measure HTML output size.
 */
export declare const measureOutputSize: Benchmark;
export declare const renderTimeBenchmarks: Benchmark[];
export default renderTimeBenchmarks;
//# sourceMappingURL=render-time.d.ts.map
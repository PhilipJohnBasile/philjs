/**
 * Streaming SSR benchmarks.
 * Tests streaming render performance and characteristics.
 */
import type { Benchmark } from '../types.js';
/**
 * Streaming render of 1000 rows.
 */
export declare const stream1000Rows: Benchmark;
/**
 * Time to first byte simulation.
 */
export declare const timeToFirstByte: Benchmark;
/**
 * Streaming with Suspense-like boundaries.
 */
export declare const streamWithSuspense: Benchmark;
/**
 * Chunk size analysis.
 */
export declare const chunkSizeAnalysis: Benchmark;
/**
 * Streaming throughput.
 */
export declare const streamingThroughput: Benchmark;
/**
 * Partial streaming with early flush.
 */
export declare const partialStreaming: Benchmark;
/**
 * Out-of-order streaming simulation.
 */
export declare const outOfOrderStreaming: Benchmark;
export declare const streamingBenchmarks: Benchmark[];
export default streamingBenchmarks;
//# sourceMappingURL=streaming.d.ts.map
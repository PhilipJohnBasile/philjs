/**
 * PhilJS Benchmark Suite
 *
 * Comprehensive performance benchmarking for PhilJS covering:
 * - JS Framework Benchmark compatible tests
 * - Reactivity performance
 * - SSR/Streaming benchmarks
 * - Bundle size analysis
 * - WASM/Rust benchmarks
 *
 * @packageDocumentation
 */
export * from './types.js';
export * from './utils.js';
export { runFrameworkBenchmarks, allFrameworkBenchmarks, coreFrameworkBenchmarks, } from './framework-benchmark/runner.js';
export { create1000Rows, create10000Rows, createRowsBenchmarks } from './framework-benchmark/create-rows.js';
export { updateEvery10thRow, updateEvery10th, updateRowsBenchmarks } from './framework-benchmark/update-rows.js';
export { swapRows, swapRowsBenchmarks } from './framework-benchmark/swap-rows.js';
export { selectRow, selectRowBenchmarks } from './framework-benchmark/select-row.js';
export { removeRow, deleteRow, clearRows, deleteRowBenchmarks } from './framework-benchmark/delete-row.js';
export { runReactivityBenchmarks, allReactivityBenchmarks, coreReactivityBenchmarks, } from './reactivity/index.js';
export { signalBenchmarks } from './reactivity/signals.js';
export { effectBenchmarks } from './reactivity/effects.js';
export { memoBenchmarks } from './reactivity/memos.js';
export { batchBenchmarks } from './reactivity/batch.js';
export { runSSRBenchmarks as runSSRBenchmarkSuite, allSSRBenchmarks, coreSSRBenchmarks, } from './ssr/index.js';
export { renderTimeBenchmarks } from './ssr/render-time.js';
export { hydrationBenchmarks, progressiveHydration } from './ssr/hydration.js';
export { streamingBenchmarks, streamingThroughput } from './ssr/streaming.js';
/**
 * Run all benchmarks and generate a comprehensive report
 */
export declare function runAllBenchmarks(options?: {
    iterations?: number;
    warmup?: number;
    outputFormat?: 'json' | 'markdown' | 'html';
    outputPath?: string;
}): Promise<BenchmarkReport>;
interface BenchmarkReport {
    timestamp: string;
    environment: EnvironmentInfo;
    framework: BenchmarkResult[];
    reactivity: BenchmarkResult[];
    ssr: BenchmarkResult[];
    bundle: BundleAnalysis | null;
    rust: RustBenchmark | null;
}
interface EnvironmentInfo {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
    memory: number;
}
interface BenchmarkResult {
    name: string;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    ops: number;
}
interface BundleAnalysis {
    totalSize: number;
    gzipSize: number;
    brotliSize: number;
    packages: Record<string, number>;
}
interface RustBenchmark {
    wasmSize: number;
    initTime: number;
    operations: BenchmarkResult[];
}
//# sourceMappingURL=index.d.ts.map
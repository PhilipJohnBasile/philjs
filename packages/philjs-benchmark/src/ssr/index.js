/**
 * SSR benchmarks index.
 * Exports all SSR benchmark suites and a runner.
 */
import { runBenchmarkSuite, formatResult, getEnvironmentInfo } from '../utils.js';
import { renderTimeBenchmarks } from './render-time.js';
import { hydrationBenchmarks } from './hydration.js';
import { streamingBenchmarks } from './streaming.js';
export { renderTimeBenchmarks } from './render-time.js';
export { hydrationBenchmarks } from './hydration.js';
export { streamingBenchmarks } from './streaming.js';
/**
 * All SSR benchmarks.
 */
export const allSSRBenchmarks = [
    ...renderTimeBenchmarks,
    ...hydrationBenchmarks,
    ...streamingBenchmarks,
];
/**
 * Core SSR benchmarks (quick run).
 */
export const coreSSRBenchmarks = [
    renderTimeBenchmarks.find(b => b.name === 'ssr-render-1000-rows'),
    renderTimeBenchmarks.find(b => b.name === 'ssr-render-full-page'),
    hydrationBenchmarks.find(b => b.name === 'hydrate-1000-rows'),
    hydrationBenchmarks.find(b => b.name === 'time-to-interactive'),
    streamingBenchmarks.find(b => b.name === 'stream-1000-rows'),
    streamingBenchmarks.find(b => b.name === 'time-to-first-byte'),
];
/**
 * Run all SSR benchmarks.
 */
export async function runSSRBenchmarks(options = {}) {
    const verbose = options.verbose ?? true;
    if (verbose) {
        console.log('='.repeat(60));
        console.log('PhilJS SSR Benchmark Suite');
        console.log('='.repeat(60));
        console.log();
    }
    // Run render time benchmarks
    if (verbose)
        console.log('Render Time Benchmarks:\n');
    const renderResults = await runBenchmarkSuite(renderTimeBenchmarks, { ...options, verbose });
    // Run hydration benchmarks
    if (verbose)
        console.log('\nHydration Benchmarks:\n');
    const hydrationResults = await runBenchmarkSuite(hydrationBenchmarks, { ...options, verbose });
    // Run streaming benchmarks
    if (verbose)
        console.log('\nStreaming SSR Benchmarks:\n');
    const streamingResults = await runBenchmarkSuite(streamingBenchmarks, { ...options, verbose });
    const allResults = [
        ...renderResults,
        ...hydrationResults,
        ...streamingResults,
    ];
    if (verbose) {
        console.log('\n' + '='.repeat(60));
        console.log('SSR Benchmark Complete');
        console.log('='.repeat(60));
        // Print additional metrics if available
        if (globalThis.__lastSSRSize) {
            const size = globalThis.__lastSSRSize;
            console.log(`\nHTML Output Size (1000 rows): ${size.kb.toFixed(2)} KB`);
        }
        if (globalThis.__lastThroughput) {
            const throughput = globalThis.__lastThroughput;
            console.log(`Streaming Throughput: ${throughput.throughputMBps.toFixed(2)} MB/s`);
        }
        if (globalThis.__lastChunkAnalysis) {
            const analysis = globalThis.__lastChunkAnalysis;
            console.log(`\nChunk Analysis:`);
            console.log(`  Total Chunks: ${analysis.totalChunks}`);
            console.log(`  Avg Chunk Size: ${analysis.avgChunkSize.toFixed(0)} chars`);
            console.log(`  Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
        }
    }
    return {
        name: 'ssr-benchmark',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: getEnvironmentInfo(),
        results: allResults,
    };
}
/**
 * Run core SSR benchmarks (quick run).
 */
export async function runCoreSSRBenchmarks(options = {}) {
    const verbose = options.verbose ?? true;
    if (verbose) {
        console.log('='.repeat(60));
        console.log('PhilJS Core SSR Benchmarks');
        console.log('='.repeat(60));
        console.log();
    }
    const results = await runBenchmarkSuite(coreSSRBenchmarks, { ...options, verbose });
    return {
        name: 'core-ssr-benchmark',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: getEnvironmentInfo(),
        results,
    };
}
// Run if executed directly
const isMainModule = typeof require !== 'undefined' &&
    require.main === module ||
    import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '');
if (isMainModule) {
    runSSRBenchmarks({ verbose: true })
        .then(suite => {
        console.log('\nResults JSON:');
        console.log(JSON.stringify(suite, null, 2));
    })
        .catch(console.error);
}
export default runSSRBenchmarks;
//# sourceMappingURL=index.js.map
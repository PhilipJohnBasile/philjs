/**
 * Reactivity benchmarks index.
 * Exports all reactivity benchmark suites and a runner.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBenchmarkSuite, formatResult, getEnvironmentInfo } from '../utils.js';
import { signalBenchmarks } from './signals.js';
import { effectBenchmarks } from './effects.js';
import { memoBenchmarks } from './memos.js';
import { batchBenchmarks } from './batch.js';
export { signalBenchmarks } from './signals.js';
export { effectBenchmarks } from './effects.js';
export { memoBenchmarks } from './memos.js';
export { batchBenchmarks } from './batch.js';
/**
 * All reactivity benchmarks.
 */
export const allReactivityBenchmarks = [
    ...signalBenchmarks,
    ...effectBenchmarks,
    ...memoBenchmarks,
    ...batchBenchmarks,
];
/**
 * Core reactivity benchmarks (quick run).
 */
export const coreReactivityBenchmarks = [
    signalBenchmarks.find(b => b.name === 'create-10k-signals'),
    signalBenchmarks.find(b => b.name === 'read-1m-signals'),
    signalBenchmarks.find(b => b.name === 'write-100k-signals'),
    signalBenchmarks.find(b => b.name === 'deep-signal-graph-1000'),
    effectBenchmarks.find(b => b.name === 'create-1k-effects'),
    effectBenchmarks.find(b => b.name === 'effect-single-dependency-10k-updates'),
    memoBenchmarks.find(b => b.name === 'memo-caching-1m-reads'),
    memoBenchmarks.find(b => b.name === 'memo-recomputation-10k'),
    batchBenchmarks.find(b => b.name === 'batch-1000-updates'),
    batchBenchmarks.find(b => b.name === 'unbatched-1000-updates'),
];
/**
 * Run all reactivity benchmarks.
 */
export async function runReactivityBenchmarks(options = {}) {
    const verbose = options.verbose ?? true;
    const mode = options.mode ?? 'full';
    if (verbose) {
    }
    let allResults;
    if (mode === 'core' || mode === 'test') {
        if (verbose)
        allResults = await runBenchmarkSuite(coreReactivityBenchmarks, { ...options, verbose });
    }
    else {
        // Run signal benchmarks
        if (verbose)
        const signalResults = await runBenchmarkSuite(signalBenchmarks, { ...options, verbose });
        // Run effect benchmarks
        if (verbose)
        const effectResults = await runBenchmarkSuite(effectBenchmarks, { ...options, verbose });
        // Run memo benchmarks
        if (verbose)
        const memoResults = await runBenchmarkSuite(memoBenchmarks, { ...options, verbose });
        // Run batch benchmarks
        if (verbose)
        const batchResults = await runBenchmarkSuite(batchBenchmarks, { ...options, verbose });
        allResults = [
            ...signalResults,
            ...effectResults,
            ...memoResults,
            ...batchResults,
        ];
    }
    if (verbose) {
    }
    return {
        name: 'reactivity-benchmark',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: getEnvironmentInfo(),
        results: allResults,
    };
}
/**
 * Run core reactivity benchmarks (quick run).
 */
export async function runCoreReactivityBenchmarks(options = {}) {
    const verbose = options.verbose ?? true;
    if (verbose) {
    }
    const results = await runBenchmarkSuite(coreReactivityBenchmarks, { ...options, verbose });
    return {
        name: 'core-reactivity-benchmark',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: getEnvironmentInfo(),
        results,
    };
}
// Run if executed directly
const entryUrl = process.argv[1]
    ? pathToFileURL(path.resolve(process.argv[1])).href
    : '';
const isMainModule = entryUrl !== '' && import.meta.url === entryUrl;
if (isMainModule) {
    runReactivityBenchmarks({ verbose: true })
        .then(suite => {
    })
        .catch(console.error);
}
export default runReactivityBenchmarks;
//# sourceMappingURL=index.js.map
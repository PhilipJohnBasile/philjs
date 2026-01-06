/**
 * SSR benchmarks index.
 * Exports all SSR benchmark suites and a runner.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBenchmarkSuite, formatResult, getEnvironmentInfo } from '../utils.js';
import type { BenchmarkSuite, BenchmarkOptions } from '../types.js';

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
  renderTimeBenchmarks.find(b => b.name === 'ssr-render-1000-rows')!,
  renderTimeBenchmarks.find(b => b.name === 'ssr-render-full-page')!,
  hydrationBenchmarks.find(b => b.name === 'hydrate-1000-rows')!,
  hydrationBenchmarks.find(b => b.name === 'time-to-interactive')!,
  streamingBenchmarks.find(b => b.name === 'stream-1000-rows')!,
  streamingBenchmarks.find(b => b.name === 'time-to-first-byte')!,
];

/**
 * Run all SSR benchmarks.
 */
export async function runSSRBenchmarks(
  options: BenchmarkOptions = {}
): Promise<BenchmarkSuite> {
  const verbose = options.verbose ?? true;

  if (verbose) {
  }

  // Run render time benchmarks
  if (verbose) console.log('Render Time Benchmarks:\n');
  const renderResults = await runBenchmarkSuite(renderTimeBenchmarks, { ...options, verbose });

  // Run hydration benchmarks
  if (verbose) console.log('\nHydration Benchmarks:\n');
  const hydrationResults = await runBenchmarkSuite(hydrationBenchmarks, { ...options, verbose });

  // Run streaming benchmarks
  if (verbose) console.log('\nStreaming SSR Benchmarks:\n');
  const streamingResults = await runBenchmarkSuite(streamingBenchmarks, { ...options, verbose });

  const allResults = [
    ...renderResults,
    ...hydrationResults,
    ...streamingResults,
  ];

  if (verbose) {

    // Print additional metrics if available
    if ((globalThis as any).__lastSSRSize) {
      const size = (globalThis as any).__lastSSRSize;
      console.log(`\nHTML Output Size (1000 rows): ${size.kb.toFixed(2)} KB`);
    }

    if ((globalThis as any).__lastThroughput) {
      const throughput = (globalThis as any).__lastThroughput;
      console.log(`Streaming Throughput: ${throughput.throughputMBps.toFixed(2)} MB/s`);
    }

    if ((globalThis as any).__lastChunkAnalysis) {
      const analysis = (globalThis as any).__lastChunkAnalysis;
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
export async function runCoreSSRBenchmarks(
  options: BenchmarkOptions = {}
): Promise<BenchmarkSuite> {
  const verbose = options.verbose ?? true;

  if (verbose) {
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
const entryUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : '';
const isMainModule = entryUrl !== '' && import.meta.url === entryUrl;

if (isMainModule) {
  runSSRBenchmarks({ verbose: true })
    .then(suite => {
    })
    .catch(console.error);
}

export default runSSRBenchmarks;

/**
 * Framework benchmark runner - compatible with js-framework-benchmark.
 * Runs all framework benchmarks and generates results.
 */

import {
  runBenchmarkSuite,
  formatResult,
  getEnvironmentInfo,
  getMemoryUsage,
  gc,
} from '../utils.js';
import type { BenchmarkSuite, BenchmarkOptions, BenchmarkResult } from '../types.js';

import { createRowsBenchmarks } from './create-rows.js';
import { updateRowsBenchmarks } from './update-rows.js';
import { swapRowsBenchmarks } from './swap-rows.js';
import { selectRowBenchmarks } from './select-row.js';
import { deleteRowBenchmarks } from './delete-row.js';

/**
 * All framework benchmarks.
 */
export const allFrameworkBenchmarks = [
  ...createRowsBenchmarks,
  ...updateRowsBenchmarks,
  ...swapRowsBenchmarks,
  ...selectRowBenchmarks,
  ...deleteRowBenchmarks,
];

/**
 * Core js-framework-benchmark compatible tests.
 */
export const coreFrameworkBenchmarks = [
  createRowsBenchmarks.find(b => b.name === 'create-1000-rows')!,
  createRowsBenchmarks.find(b => b.name === 'create-10000-rows')!,
  createRowsBenchmarks.find(b => b.name === 'append-1000-rows')!,
  updateRowsBenchmarks.find(b => b.name === 'update-every-10th-row')!,
  selectRowBenchmarks.find(b => b.name === 'select-row')!,
  swapRowsBenchmarks.find(b => b.name === 'swap-rows')!,
  deleteRowBenchmarks.find(b => b.name === 'remove-row')!,
  deleteRowBenchmarks.find(b => b.name === 'clear-rows')!,
];

/**
 * Memory usage benchmark.
 */
async function measureMemory(
  name: string,
  setup: () => Promise<void> | void
): Promise<BenchmarkResult> {
  gc();
  const before = getMemoryUsage();

  await setup();

  gc();
  const after = getMemoryUsage();

  const heapDelta = (after.heapUsed - before.heapUsed) / (1024 * 1024);

  return {
    name,
    mean: heapDelta,
    median: heapDelta,
    min: heapDelta,
    max: heapDelta,
    stddev: 0,
    samples: 1,
    ops: 0,
    unit: 'MB',
  };
}

/**
 * Startup time benchmark.
 */
async function measureStartupTime(): Promise<BenchmarkResult> {
  const iterations = 50;
  const samples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Simulate app startup - import and initialize
    const { signal, effect, memo } = await import('philjs-core');

    // Create initial reactive state
    const count = signal(0);
    const doubled = memo(() => count() * 2);

    // Set up an effect
    let value = 0;
    const dispose = effect(() => {
      value = doubled();
    });

    // Initial render
    count.set(1);

    const end = performance.now();
    samples.push(end - start);

    // Cleanup
    dispose();
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  const squaredDiffs = samples.map(x => Math.pow(x - mean, 2));
  const stddev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / samples.length);

  return {
    name: 'startup-time',
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev,
    samples: iterations,
    ops: 1000 / mean,
    unit: 'ms',
  };
}

/**
 * Run all framework benchmarks.
 */
export async function runFrameworkBenchmarks(
  options: BenchmarkOptions = {}
): Promise<BenchmarkSuite> {
  const verbose = options.verbose ?? true;

  if (verbose) {
    console.log('='.repeat(60));
    console.log('PhilJS Framework Benchmark Suite');
    console.log('Compatible with js-framework-benchmark');
    console.log('='.repeat(60));
    console.log();
  }

  const results: BenchmarkResult[] = [];

  // Run startup benchmark
  if (verbose) console.log('Running startup benchmarks...\n');
  const startupResult = await measureStartupTime();
  results.push(startupResult);
  if (verbose) console.log(formatResult(startupResult), '\n');

  // Run core benchmarks
  if (verbose) console.log('Running core benchmarks...\n');
  const coreResults = await runBenchmarkSuite(coreFrameworkBenchmarks, {
    ...options,
    verbose,
  });
  results.push(...coreResults);

  // Run all additional benchmarks
  if (verbose) console.log('\nRunning extended benchmarks...\n');

  // Create benchmarks
  const createResults = await runBenchmarkSuite(
    createRowsBenchmarks.filter(b => !coreFrameworkBenchmarks.includes(b)),
    { ...options, verbose }
  );
  results.push(...createResults);

  // Update benchmarks
  const updateResults = await runBenchmarkSuite(
    updateRowsBenchmarks.filter(b => !coreFrameworkBenchmarks.includes(b)),
    { ...options, verbose }
  );
  results.push(...updateResults);

  // Swap benchmarks
  const swapResults = await runBenchmarkSuite(
    swapRowsBenchmarks.filter(b => !coreFrameworkBenchmarks.includes(b)),
    { ...options, verbose }
  );
  results.push(...swapResults);

  // Select benchmarks
  const selectResults = await runBenchmarkSuite(
    selectRowBenchmarks.filter(b => !coreFrameworkBenchmarks.includes(b)),
    { ...options, verbose }
  );
  results.push(...selectResults);

  // Delete benchmarks
  const deleteResults = await runBenchmarkSuite(
    deleteRowBenchmarks.filter(b => !coreFrameworkBenchmarks.includes(b)),
    { ...options, verbose }
  );
  results.push(...deleteResults);

  // Memory benchmarks
  if (verbose) console.log('\nRunning memory benchmarks...\n');

  const memoryResult = await measureMemory('memory-1000-rows', async () => {
    const { signal, effect } = await import('philjs-core');
    const rows = signal<any[]>([]);
    for (let i = 0; i < 1000; i++) {
      rows.set([...rows(), { id: i, label: `Row ${i}` }]);
    }
  });
  results.push(memoryResult);
  if (verbose) console.log(`memory-1000-rows: ${memoryResult.mean.toFixed(2)}MB\n`);

  if (verbose) {
    console.log('='.repeat(60));
    console.log('Benchmark Complete');
    console.log('='.repeat(60));
  }

  return {
    name: 'framework-benchmark',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: getEnvironmentInfo(),
    results,
  };
}

/**
 * Run only the core js-framework-benchmark compatible tests.
 */
export async function runCoreBenchmarks(
  options: BenchmarkOptions = {}
): Promise<BenchmarkSuite> {
  const verbose = options.verbose ?? true;

  if (verbose) {
    console.log('='.repeat(60));
    console.log('PhilJS Core Framework Benchmarks');
    console.log('js-framework-benchmark compatible');
    console.log('='.repeat(60));
    console.log();
  }

  const results = await runBenchmarkSuite(coreFrameworkBenchmarks, {
    ...options,
    verbose,
  });

  return {
    name: 'core-framework-benchmark',
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
  runFrameworkBenchmarks({ verbose: true })
    .then(suite => {
      console.log('\nResults JSON:');
      console.log(JSON.stringify(suite, null, 2));
    })
    .catch(console.error);
}

export default runFrameworkBenchmarks;

#!/usr/bin/env tsx
/**
 * Run all benchmark suites and generate a complete report.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { runFrameworkBenchmarks } from '../src/framework-benchmark/runner.js';
import { runReactivityBenchmarks } from '../src/reactivity/index.js';
import { runSSRBenchmarks } from '../src/ssr/index.js';
import { runBundleBenchmarks } from '../src/bundle/size-analyzer.js';
import { runWasmBenchmarks } from '../src/rust/wasm-bench.js';
import { getEnvironmentInfo } from '../src/utils.js';
import type { FullBenchmarkReport, BenchmarkSuite } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, '..', 'results');

/**
 * Parse command line arguments.
 */
function parseArgs(): {
  verbose: boolean;
  save: boolean;
  suites: string[];
  outputPath: string;
} {
  const args = process.argv.slice(2);
  const verbose = !args.includes('--quiet');
  const save = args.includes('--save');
  const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1] || RESULTS_DIR;

  // Parse specific suites to run
  const suiteArg = args.find(a => a.startsWith('--suites='));
  const suites = suiteArg
    ? suiteArg.split('=')[1].split(',')
    : ['framework', 'reactivity', 'ssr', 'bundle', 'rust'];

  return { verbose, save, suites, outputPath };
}

/**
 * Run all benchmark suites.
 */
async function runAllBenchmarks(): Promise<FullBenchmarkReport> {
  const { verbose, save, suites, outputPath } = parseArgs();

  console.log('='.repeat(70));
  console.log('PhilJS Comprehensive Performance Benchmark Suite');
  console.log('='.repeat(70));
  console.log();
  console.log(`Environment: ${getEnvironmentInfo().runtime} ${getEnvironmentInfo().runtimeVersion}`);
  console.log(`OS: ${getEnvironmentInfo().os}`);
  console.log(`CPU: ${getEnvironmentInfo().cpu}`);
  console.log(`Memory: ${getEnvironmentInfo().memory}`);
  console.log();
  console.log(`Running suites: ${suites.join(', ')}`);
  console.log();

  const results: Partial<FullBenchmarkReport['suites']> = {};
  const warnings: string[] = [];
  let passed = 0;
  let failed = 0;

  // Framework benchmarks
  if (suites.includes('framework')) {
    try {
      console.log('\n[1/5] Running Framework Benchmarks...\n');
      results.framework = await runFrameworkBenchmarks({ verbose });
      passed += results.framework.results.length;
    } catch (error) {
      console.error('Framework benchmarks failed:', error);
      warnings.push(`Framework benchmarks failed: ${error}`);
      failed++;
    }
  }

  // Reactivity benchmarks
  if (suites.includes('reactivity')) {
    try {
      console.log('\n[2/5] Running Reactivity Benchmarks...\n');
      results.reactivity = await runReactivityBenchmarks({ verbose });
      passed += results.reactivity.results.length;
    } catch (error) {
      console.error('Reactivity benchmarks failed:', error);
      warnings.push(`Reactivity benchmarks failed: ${error}`);
      failed++;
    }
  }

  // SSR benchmarks
  if (suites.includes('ssr')) {
    try {
      console.log('\n[3/5] Running SSR Benchmarks...\n');
      results.ssr = await runSSRBenchmarks({ verbose });
      passed += results.ssr.results.length;
    } catch (error) {
      console.error('SSR benchmarks failed:', error);
      warnings.push(`SSR benchmarks failed: ${error}`);
      failed++;
    }
  }

  // Bundle size analysis
  if (suites.includes('bundle')) {
    try {
      console.log('\n[4/5] Running Bundle Size Analysis...\n');
      results.bundle = await runBundleBenchmarks({ verbose });
      passed += results.bundle.results.length;
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      warnings.push(`Bundle analysis failed: ${error}`);
      failed++;
    }
  }

  // WASM benchmarks
  if (suites.includes('rust')) {
    try {
      console.log('\n[5/5] Running Rust/WASM Benchmarks...\n');
      results.rust = await runWasmBenchmarks({ verbose });
      passed += results.rust.results.length;
    } catch (error) {
      console.error('WASM benchmarks failed:', error);
      warnings.push(`WASM benchmarks failed: ${error}`);
      failed++;
    }
  }

  // Generate full report
  const report: FullBenchmarkReport = {
    framework: 'philjs',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: getEnvironmentInfo(),
    suites: results as FullBenchmarkReport['suites'],
    comparison: generateComparison(results),
    summary: {
      totalBenchmarks: passed + failed,
      passed,
      failed,
      warnings,
    },
  };

  // Save results if requested
  if (save) {
    await saveResults(report, outputPath);
  }

  // Print summary
  printSummary(report);

  return report;
}

/**
 * Generate comparison with other frameworks.
 */
function generateComparison(
  results: Partial<FullBenchmarkReport['suites']>
): Record<string, any> {
  // Baseline comparisons (estimated)
  const baselines: Record<string, Record<string, number>> = {
    react: {
      'create-1000-rows': 65,
      'update-every-10th-row': 25,
      'swap-rows': 30,
      'select-row': 15,
      'remove-row': 20,
    },
    vue: {
      'create-1000-rows': 55,
      'update-every-10th-row': 18,
      'swap-rows': 22,
      'select-row': 12,
      'remove-row': 15,
    },
    solid: {
      'create-1000-rows': 40,
      'update-every-10th-row': 8,
      'swap-rows': 12,
      'select-row': 5,
      'remove-row': 8,
    },
  };

  const comparison: Record<string, any> = {};

  for (const [framework, benchmarks] of Object.entries(baselines)) {
    comparison[framework] = {
      framework,
      benchmarks: {},
    };

    for (const [benchName, baselineValue] of Object.entries(benchmarks)) {
      const result = results.framework?.results.find(r => r.name === benchName);
      if (result) {
        const diff = ((baselineValue - result.mean) / baselineValue) * 100;
        comparison[framework].benchmarks[benchName] = {
          philjs: result.mean,
          [framework]: baselineValue,
          difference: diff > 0 ? `+${diff.toFixed(1)}% faster` : `${Math.abs(diff).toFixed(1)}% slower`,
        };
      }
    }
  }

  return comparison;
}

/**
 * Save benchmark results to file.
 */
async function saveResults(report: FullBenchmarkReport, outputPath: string): Promise<void> {
  // Ensure directory exists
  await fs.promises.mkdir(outputPath, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `benchmark-${timestamp}.json`;
  const filepath = path.join(outputPath, filename);

  await fs.promises.writeFile(filepath, JSON.stringify(report, null, 2));
  console.log(`\nResults saved to: ${filepath}`);

  // Also update latest.json
  const latestPath = path.join(outputPath, 'latest.json');
  await fs.promises.writeFile(latestPath, JSON.stringify(report, null, 2));
  console.log(`Latest results: ${latestPath}`);
}

/**
 * Print summary of benchmark results.
 */
function printSummary(report: FullBenchmarkReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('BENCHMARK SUMMARY');
  console.log('='.repeat(70));

  console.log(`\nFramework: ${report.framework} v${report.version}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Benchmarks: ${report.summary.totalBenchmarks}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);

  if (report.summary.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of report.summary.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  // Key metrics
  console.log('\n' + '-'.repeat(70));
  console.log('KEY METRICS');
  console.log('-'.repeat(70));

  // Framework benchmarks
  if (report.suites.framework) {
    const create1k = report.suites.framework.results.find(r => r.name === 'create-1000-rows');
    const update10th = report.suites.framework.results.find(r => r.name === 'update-every-10th-row');

    if (create1k) {
      console.log(`\nCreate 1,000 rows: ${create1k.mean.toFixed(2)}ms`);
    }
    if (update10th) {
      console.log(`Update every 10th row: ${update10th.mean.toFixed(2)}ms`);
    }
  }

  // Reactivity metrics
  if (report.suites.reactivity) {
    const signalCreate = report.suites.reactivity.results.find(r => r.name === 'create-10k-signals');
    const batchUpdate = report.suites.reactivity.results.find(r => r.name === 'batch-1000-updates');

    if (signalCreate) {
      console.log(`\nCreate 10k signals: ${signalCreate.mean.toFixed(2)}ms`);
    }
    if (batchUpdate) {
      console.log(`Batch 1,000 updates: ${batchUpdate.mean.toFixed(2)}ms`);
    }
  }

  // SSR metrics
  if (report.suites.ssr) {
    const ssr1k = report.suites.ssr.results.find(r => r.name === 'ssr-render-1000-rows');
    const hydrate1k = report.suites.ssr.results.find(r => r.name === 'hydrate-1000-rows');

    if (ssr1k) {
      console.log(`\nSSR render 1,000 rows: ${ssr1k.mean.toFixed(2)}ms`);
    }
    if (hydrate1k) {
      console.log(`Hydrate 1,000 rows: ${hydrate1k.mean.toFixed(2)}ms`);
    }
  }

  // Bundle size
  if (report.suites.bundle) {
    const coreGzip = report.suites.bundle.results.find(r => r.name === 'core-bundle-gzip');
    if (coreGzip) {
      console.log(`\nCore bundle (gzip): ${(coreGzip.mean / 1024).toFixed(2)} KB`);
    }
  }

  // Comparison summary
  if (report.comparison && Object.keys(report.comparison).length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('FRAMEWORK COMPARISON');
    console.log('-'.repeat(70));

    for (const [framework, data] of Object.entries(report.comparison)) {
      console.log(`\nvs ${framework}:`);
      for (const [bench, metrics] of Object.entries((data as any).benchmarks || {})) {
        console.log(`  ${bench}: ${(metrics as any).difference}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Benchmark run complete!');
  console.log('='.repeat(70));
}

// Run
runAllBenchmarks()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });

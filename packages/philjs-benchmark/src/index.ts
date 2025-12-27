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

// Framework Benchmark (krausest/js-framework-benchmark compatible)
export { runFrameworkBenchmarks } from './framework-benchmark/runner.js';
export { create1000Rows, create10000Rows } from './framework-benchmark/create-rows.js';
export { updateEvery10th } from './framework-benchmark/update-rows.js';
export { swapRows } from './framework-benchmark/swap-rows.js';
export { selectRow } from './framework-benchmark/select-row.js';
export { deleteRow } from './framework-benchmark/delete-row.js';

// Reactivity Benchmarks
export {
  runReactivityBenchmarks,
  signalReadBenchmark,
  signalWriteBenchmark,
  signalPropagationBenchmark,
} from './reactivity/signals.js';
export {
  effectCreationBenchmark,
  effectTriggerBenchmark,
  effectCleanupBenchmark,
} from './reactivity/effects.js';
export {
  memoCreationBenchmark,
  memoCachingBenchmark,
  memoDependencyBenchmark,
} from './reactivity/memos.js';
export {
  batchSmallBenchmark,
  batchLargeBenchmark,
  batchNestedBenchmark,
} from './reactivity/batch.js';

// SSR Benchmarks
export {
  ssrRenderTimeBenchmark,
  ssrThroughputBenchmark,
  ssrMemoryBenchmark,
} from './ssr/render-time.js';
export {
  hydrationTimeBenchmark,
  partialHydrationBenchmark,
  progressiveHydrationBenchmark,
} from './ssr/hydration.js';
export {
  streamingTTFBBenchmark,
  streamingThroughputBenchmark,
  streamingChunkBenchmark,
} from './ssr/streaming.js';

/**
 * Run all benchmarks and generate a comprehensive report
 */
export async function runAllBenchmarks(options: {
  iterations?: number;
  warmup?: number;
  outputFormat?: 'json' | 'markdown' | 'html';
  outputPath?: string;
} = {}): Promise<BenchmarkReport> {
  const {
    iterations = 50,
    warmup = 5,
    outputFormat = 'json',
    outputPath,
  } = options;

  console.log('🚀 PhilJS Benchmark Suite');
  console.log('========================\n');

  const results: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    environment: await getEnvironmentInfo(),
    framework: [],
    reactivity: [],
    ssr: [],
    bundle: null,
    rust: null,
  };

  // Framework benchmarks
  console.log('📊 Running Framework Benchmarks...');
  results.framework = await runFrameworkBenchmarks({ iterations, warmup });

  // Reactivity benchmarks
  console.log('\n⚡ Running Reactivity Benchmarks...');
  results.reactivity = await runReactivityBenchmarks({ iterations, warmup });

  // SSR benchmarks
  console.log('\n🖥️ Running SSR Benchmarks...');
  results.ssr = await runSSRBenchmarks({ iterations, warmup });

  // Generate report
  if (outputPath) {
    await writeReport(results, outputPath, outputFormat);
    console.log(`\n✅ Report saved to ${outputPath}`);
  }

  return results;
}

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

async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  const os = await import('os');
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    memory: os.totalmem(),
  };
}

async function runSSRBenchmarks(options: { iterations: number; warmup: number }): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  // Import and run SSR benchmarks
  const { ssrRenderTimeBenchmark, ssrThroughputBenchmark, ssrMemoryBenchmark } = await import('./ssr/render-time.js');
  const { hydrationTimeBenchmark, partialHydrationBenchmark } = await import('./ssr/hydration.js');
  const { streamingTTFBBenchmark, streamingThroughputBenchmark } = await import('./ssr/streaming.js');

  const benchmarks = [
    ssrRenderTimeBenchmark,
    ssrThroughputBenchmark,
    ssrMemoryBenchmark,
    hydrationTimeBenchmark,
    partialHydrationBenchmark,
    streamingTTFBBenchmark,
    streamingThroughputBenchmark,
  ];

  for (const benchmark of benchmarks) {
    if (benchmark) {
      const result = await benchmark.fn(options);
      results.push(result);
    }
  }

  return results;
}

async function writeReport(
  report: BenchmarkReport,
  outputPath: string,
  format: 'json' | 'markdown' | 'html'
): Promise<void> {
  const fs = await import('fs/promises');

  let content: string;

  switch (format) {
    case 'markdown':
      content = generateMarkdownReport(report);
      break;
    case 'html':
      content = generateHTMLReport(report);
      break;
    default:
      content = JSON.stringify(report, null, 2);
  }

  await fs.writeFile(outputPath, content, 'utf-8');
}

function generateMarkdownReport(report: BenchmarkReport): string {
  let md = `# PhilJS Benchmark Report\n\n`;
  md += `**Generated:** ${report.timestamp}\n\n`;
  md += `## Environment\n\n`;
  md += `- Node: ${report.environment.nodeVersion}\n`;
  md += `- Platform: ${report.environment.platform} (${report.environment.arch})\n`;
  md += `- CPUs: ${report.environment.cpus}\n`;
  md += `- Memory: ${(report.environment.memory / 1024 / 1024 / 1024).toFixed(2)} GB\n\n`;

  if (report.framework.length > 0) {
    md += `## Framework Benchmarks\n\n`;
    md += `| Benchmark | Mean (ms) | Median | Min | Max | Ops/sec |\n`;
    md += `|-----------|-----------|--------|-----|-----|--------|\n`;
    for (const r of report.framework) {
      md += `| ${r.name} | ${r.mean.toFixed(2)} | ${r.median.toFixed(2)} | ${r.min.toFixed(2)} | ${r.max.toFixed(2)} | ${r.ops.toFixed(0)} |\n`;
    }
    md += '\n';
  }

  if (report.reactivity.length > 0) {
    md += `## Reactivity Benchmarks\n\n`;
    md += `| Benchmark | Mean (ms) | Ops/sec |\n`;
    md += `|-----------|-----------|--------|\n`;
    for (const r of report.reactivity) {
      md += `| ${r.name} | ${r.mean.toFixed(4)} | ${r.ops.toFixed(0)} |\n`;
    }
    md += '\n';
  }

  if (report.ssr.length > 0) {
    md += `## SSR Benchmarks\n\n`;
    md += `| Benchmark | Mean (ms) | Ops/sec |\n`;
    md += `|-----------|-----------|--------|\n`;
    for (const r of report.ssr) {
      md += `| ${r.name} | ${r.mean.toFixed(2)} | ${r.ops.toFixed(0)} |\n`;
    }
    md += '\n';
  }

  return md;
}

function generateHTMLReport(report: BenchmarkReport): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS Benchmark Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; }
    .chart-container { height: 400px; margin: 2rem 0; }
  </style>
</head>
<body>
  <h1>PhilJS Benchmark Report</h1>
  <p><strong>Generated:</strong> ${report.timestamp}</p>

  <h2>Environment</h2>
  <ul>
    <li>Node: ${report.environment.nodeVersion}</li>
    <li>Platform: ${report.environment.platform} (${report.environment.arch})</li>
    <li>CPUs: ${report.environment.cpus}</li>
    <li>Memory: ${(report.environment.memory / 1024 / 1024 / 1024).toFixed(2)} GB</li>
  </ul>

  <h2>Framework Benchmarks</h2>
  <div class="chart-container">
    <canvas id="frameworkChart"></canvas>
  </div>

  <script>
    const data = ${JSON.stringify(report)};
    new Chart(document.getElementById('frameworkChart'), {
      type: 'bar',
      data: {
        labels: data.framework.map(r => r.name),
        datasets: [{
          label: 'Mean (ms)',
          data: data.framework.map(r => r.mean),
          backgroundColor: '#4f46e5'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  </script>
</body>
</html>`;
}

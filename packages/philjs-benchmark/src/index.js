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
export { runFrameworkBenchmarks, allFrameworkBenchmarks, coreFrameworkBenchmarks, } from './framework-benchmark/runner.js';
export { create1000Rows, create10000Rows, createRowsBenchmarks } from './framework-benchmark/create-rows.js';
export { updateEvery10thRow, updateRowsBenchmarks } from './framework-benchmark/update-rows.js';
export { swapRows, swapRowsBenchmarks } from './framework-benchmark/swap-rows.js';
export { selectRow, selectRowBenchmarks } from './framework-benchmark/select-row.js';
export { removeRow, clearRows, deleteRowBenchmarks } from './framework-benchmark/delete-row.js';
// Reactivity Benchmarks
export { runReactivityBenchmarks, allReactivityBenchmarks, coreReactivityBenchmarks, } from './reactivity/index.js';
export { signalBenchmarks } from './reactivity/signals.js';
export { effectBenchmarks } from './reactivity/effects.js';
export { memoBenchmarks } from './reactivity/memos.js';
export { batchBenchmarks } from './reactivity/batch.js';
// SSR Benchmarks
export { runSSRBenchmarks as runSSRBenchmarkSuite, allSSRBenchmarks, coreSSRBenchmarks, } from './ssr/index.js';
export { renderTimeBenchmarks } from './ssr/render-time.js';
export { hydrationBenchmarks, progressiveHydration } from './ssr/hydration.js';
export { streamingBenchmarks, streamingThroughput } from './ssr/streaming.js';
/**
 * Run all benchmarks and generate a comprehensive report
 */
export async function runAllBenchmarks(options = {}) {
    const { iterations = 50, warmup = 5, outputFormat = 'json', outputPath, } = options;
    console.log('PhilJS Benchmark Suite');
    console.log('========================\n');
    const results = {
        timestamp: new Date().toISOString(),
        environment: await getEnvironmentInfoLocal(),
        framework: [],
        reactivity: [],
        ssr: [],
        bundle: null,
        rust: null,
    };
    // Framework benchmarks - dynamically import to avoid circular deps
    console.log('Running Framework Benchmarks...');
    const { runFrameworkBenchmarks: runFwBench } = await import('./framework-benchmark/runner.js');
    const fwSuite = await runFwBench({ iterations, warmupIterations: warmup, verbose: false });
    results.framework = fwSuite.results.map(r => ({
        name: r.name,
        mean: r.mean,
        median: r.median,
        min: r.min,
        max: r.max,
        stdDev: r.stddev,
        ops: r.ops,
    }));
    // Reactivity benchmarks
    console.log('\nRunning Reactivity Benchmarks...');
    const { runReactivityBenchmarks: runReactBench } = await import('./reactivity/index.js');
    const reactSuite = await runReactBench({ iterations, warmupIterations: warmup, verbose: false });
    results.reactivity = reactSuite.results.map(r => ({
        name: r.name,
        mean: r.mean,
        median: r.median,
        min: r.min,
        max: r.max,
        stdDev: r.stddev,
        ops: r.ops,
    }));
    // SSR benchmarks
    console.log('\nRunning SSR Benchmarks...');
    const { runSSRBenchmarks: runSSRBench } = await import('./ssr/index.js');
    const ssrSuite = await runSSRBench({ iterations, warmupIterations: warmup, verbose: false });
    results.ssr = ssrSuite.results.map(r => ({
        name: r.name,
        mean: r.mean,
        median: r.median,
        min: r.min,
        max: r.max,
        stdDev: r.stddev,
        ops: r.ops,
    }));
    // Generate report
    if (outputPath) {
        await writeReport(results, outputPath, outputFormat);
        console.log(`\nReport saved to ${outputPath}`);
    }
    return results;
}
async function getEnvironmentInfoLocal() {
    const os = await import('os');
    return {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        memory: os.totalmem(),
    };
}
async function writeReport(report, outputPath, format) {
    const fs = await import('fs/promises');
    let content;
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
function generateMarkdownReport(report) {
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
function generateHTMLReport(report) {
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
//# sourceMappingURL=index.js.map
/**
 * Generate comparison charts from benchmark results.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { FullBenchmarkReport, BenchmarkResult } from '../types.js';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface ComparisonData {
  philjs: FullBenchmarkReport;
  frameworks: Record<string, any>;
}

/**
 * Load framework comparison data.
 */
export async function loadComparisonData(
  frameworksPath?: string
): Promise<Record<string, any>> {
  const defaultPath = path.join(__dirname, 'frameworks.json');
  const filePath = frameworksPath || defaultPath;

  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Generate comparison chart data.
 */
export function generateComparisonChart(
  philjsResults: BenchmarkResult[],
  frameworkData: Record<string, any>,
  benchmarkName: string
): ChartData {
  const frameworks = frameworkData['frameworks'] as Record<string, any> | undefined;
  const labels: string[] = ['PhilJS'];
  const data: number[] = [];

  // Get PhilJS result
  const philjsResult = philjsResults.find(r => r.name === benchmarkName);
  if (philjsResult) {
    data.push(philjsResult.mean);
  } else {
    data.push(0);
  }

  // Add other frameworks
  if (frameworks) {
    for (const [key, framework] of Object.entries(frameworks)) {
      const fw = framework as Record<string, any>;
      if (fw['benchmarks'] && fw['benchmarks'][benchmarkName]) {
        labels.push(fw['name'] as string);
        data.push(fw['benchmarks'][benchmarkName].mean as number);
      }
    }
  }

  return {
    labels,
    datasets: [
      {
        label: benchmarkName,
        data,
        backgroundColor: '#4f46e5',
      },
    ],
  };
}

/**
 * Generate multiple comparison charts.
 */
export function generateAllComparisonCharts(
  philjsResults: BenchmarkResult[],
  frameworkData: Record<string, any>
): Record<string, ChartData> {
  const charts: Record<string, ChartData> = {};

  const benchmarks = [
    'create-1000-rows',
    'update-every-10th-row',
    'swap-rows',
    'select-row',
    'remove-row',
    'clear-rows',
    'startup-time',
    'memory-1000-rows',
  ];

  for (const benchmark of benchmarks) {
    charts[benchmark] = generateComparisonChart(philjsResults, frameworkData, benchmark);
  }

  return charts;
}

/**
 * Generate Chart.js configuration.
 */
export function generateChartJsConfig(chartData: ChartData, options: {
  title?: string;
  yAxisLabel?: string;
  type?: 'bar' | 'line' | 'radar';
} = {}): string {
  const {
    title = '',
    yAxisLabel = 'Time (ms)',
    type = 'bar',
  } = options;

  const config = {
    type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: { size: 16 },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.label}: ${context.parsed.y.toFixed(2)}ms`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: yAxisLabel,
          },
        },
      },
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generate HTML page with all comparison charts.
 */
export function generateComparisonHTML(
  charts: Record<string, ChartData>,
  philjsResults: BenchmarkResult[],
  frameworkData: Record<string, any>
): string {
  const benchmarkDescriptions = (frameworkData['benchmarkDescriptions'] as Record<string, string> | undefined) ?? {};

  const chartSections = Object.entries(charts)
    .map(([benchmark, chartData]) => {
      const description = benchmarkDescriptions[benchmark] || benchmark;
      const config = generateChartJsConfig(chartData, {
        title: description,
        yAxisLabel: benchmark.includes('memory') ? 'Memory (MB)' : 'Time (ms)',
      });

      return `
    <section class="chart-section">
      <h2>${description}</h2>
      <div class="chart-container">
        <canvas id="chart-${benchmark}"></canvas>
      </div>
      <div class="chart-stats">
        ${generateStatsTable(benchmark, chartData)}
      </div>
    </section>`;
    })
    .join('\n');

  const chartScripts = Object.entries(charts)
    .map(([benchmark, chartData]) => {
      const config = generateChartJsConfig(chartData, {
        yAxisLabel: benchmark.includes('memory') ? 'Memory (MB)' : 'Time (ms)',
      });
      return `new Chart(document.getElementById('chart-${benchmark}'), ${config});`;
    })
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS vs Other Frameworks - Benchmark Comparison</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%);
      color: #c9d1d9;
      padding: 2rem;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: #8b949e;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .info-box {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .info-box h3 {
      color: #58a6ff;
      margin-bottom: 0.5rem;
    }

    .chart-section {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .chart-section h2 {
      color: #c9d1d9;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }

    .chart-container {
      position: relative;
      height: 400px;
      margin-bottom: 1.5rem;
    }

    .chart-stats {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #30363d;
    }

    th {
      background: #0d1117;
      font-weight: 600;
      color: #8b949e;
    }

    tr:hover {
      background: rgba(88, 166, 255, 0.05);
    }

    .fastest {
      color: #3fb950;
      font-weight: bold;
    }

    .slowest {
      color: #f85149;
    }

    .winner-badge {
      display: inline-block;
      background: #238636;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      margin-left: 0.5rem;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #30363d;
      color: #8b949e;
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      h1 {
        font-size: 2rem;
      }

      .chart-container {
        height: 300px;
      }

      .chart-section {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PhilJS vs Other Frameworks</h1>
    <p class="subtitle">Performance Benchmark Comparison</p>

    <div class="info-box">
      <h3>About These Benchmarks</h3>
      <p>
        These charts compare PhilJS against popular JavaScript frameworks using benchmarks
        compatible with <a href="https://krausest.github.io/js-framework-benchmark/" target="_blank" style="color: #58a6ff;">js-framework-benchmark</a>.
        Lower values are better for time-based benchmarks. Results vary by hardware and browser.
      </p>
      <p style="margin-top: 0.5rem;">
        <strong>Frameworks compared:</strong> Vanilla JS, React, Vue, Svelte, SolidJS, Qwik, Preact, Angular, Lit
      </p>
    </div>

    ${chartSections}

    <footer>
      <p>Generated by PhilJS Benchmark Suite</p>
      <p style="margin-top: 0.5rem; font-size: 0.9rem;">
        Data source: js-framework-benchmark compatible tests |
        Last updated: ${new Date().toLocaleDateString()}
      </p>
    </footer>
  </div>

  <script>
    ${chartScripts}
  </script>
</body>
</html>`;
}

/**
 * Generate stats table for a benchmark.
 */
function generateStatsTable(benchmark: string, chartData: ChartData): string {
  const dataset = chartData.datasets[0];
  if (!dataset) {
    return '<table><tbody><tr><td>No data available</td></tr></tbody></table>';
  }

  const values = chartData.labels.map((label, i) => ({
    framework: label,
    value: dataset.data[i] ?? 0,
  }));

  // Sort by value
  values.sort((a, b) => a.value - b.value);

  const fastest = values[0];
  const philjs = values.find(v => v.framework === 'PhilJS');

  const rows = values
    .map((v, i) => {
      const isFastest = v === fastest;
      const isPhilJS = v.framework === 'PhilJS';
      const className = isFastest ? 'fastest' : '';

      const speedup = philjs && v.value > 0
        ? ((philjs.value / v.value) * 100).toFixed(0)
        : '100';

      return `
        <tr>
          <td>
            ${v.framework}
            ${isFastest ? '<span class="winner-badge">FASTEST</span>' : ''}
          </td>
          <td class="${className}">${v.value.toFixed(2)}</td>
          <td>${isPhilJS ? '100%' : speedup + '%'}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Framework</th>
          <th>${benchmark.includes('memory') ? 'Memory (MB)' : 'Time (ms)'}</th>
          <th>Relative to PhilJS</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Generate and save comparison charts.
 */
export async function generateAndSaveCharts(
  philjsReport: FullBenchmarkReport,
  outputDir: string,
  frameworksPath?: string
): Promise<void> {
  // Load framework data
  const frameworkData = await loadComparisonData(frameworksPath);

  // Generate charts
  const charts = generateAllComparisonCharts(
    philjsReport.suites.framework?.results || [],
    frameworkData
  );

  // Generate HTML
  const html = generateComparisonHTML(
    charts,
    philjsReport.suites.framework?.results || [],
    frameworkData
  );

  // Save HTML
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'comparison.html'), html, 'utf-8');

  // Save chart data as JSON
  await fs.writeFile(
    path.join(outputDir, 'comparison-data.json'),
    JSON.stringify(charts, null, 2),
    'utf-8'
  );

  console.log(`Comparison charts saved to ${outputDir}/comparison.html`);
}

/**
 * Generate markdown comparison table.
 */
export function generateComparisonMarkdown(
  philjsResults: BenchmarkResult[],
  frameworkData: Record<string, any>
): string {
  const frameworks = frameworkData['frameworks'] as Record<string, any> | undefined;
  const benchmarks = [
    'create-1000-rows',
    'update-every-10th-row',
    'swap-rows',
    'select-row',
    'remove-row',
  ];

  let md = '# Framework Comparison\n\n';
  md += 'PhilJS compared to other popular frameworks (lower is better):\n\n';

  for (const benchmark of benchmarks) {
    const benchmarkDescriptions = frameworkData['benchmarkDescriptions'] as Record<string, string> | undefined;
    const description = benchmarkDescriptions?.[benchmark] ?? benchmark;
    md += `## ${description}\n\n`;
    md += '| Framework | Time (ms) | vs PhilJS |\n';
    md += '|-----------|-----------|----------|\n';

    const philjsResult = philjsResults.find(r => r.name === benchmark);
    const philjsValue = philjsResult?.mean ?? 0;

    const results: Array<{ name: string; value: number }> = [
      { name: 'PhilJS', value: philjsValue },
    ];

    if (frameworks) {
      for (const [key, framework] of Object.entries(frameworks)) {
        const fw = framework as Record<string, any>;
        if (fw['benchmarks'] && fw['benchmarks'][benchmark]) {
          results.push({
            name: fw['name'] as string,
            value: fw['benchmarks'][benchmark].mean as number,
          });
        }
      }
    }

    results.sort((a, b) => a.value - b.value);

    for (const result of results) {
      const diff = philjsValue > 0 ? ((result.value / philjsValue - 1) * 100) : 0;
      const diffStr = diff === 0
        ? 'baseline'
        : diff > 0
        ? `+${diff.toFixed(1)}% slower`
        : `${Math.abs(diff).toFixed(1)}% faster`;

      const badge = result === results[0] ? ' (fastest)' : '';
      md += `| ${result.name}${badge} | ${result.value.toFixed(2)} | ${diffStr} |\n`;
    }

    md += '\n';
  }

  return md;
}

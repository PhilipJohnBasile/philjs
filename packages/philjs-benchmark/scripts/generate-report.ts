#!/usr/bin/env tsx
/**
 * Generate HTML benchmark report from JSON results.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { FullBenchmarkReport, BenchmarkResult } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, '..', 'results');

/**
 * Load benchmark results from file.
 */
async function loadResults(filepath?: string): Promise<FullBenchmarkReport> {
  const resultsPath = filepath || path.join(RESULTS_DIR, 'latest.json');

  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Results file not found: ${resultsPath}`);
  }

  const content = await fs.promises.readFile(resultsPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Generate performance badge SVG.
 */
function generateBadge(label: string, value: string, color: string): string {
  const labelWidth = label.length * 7 + 10;
  const valueWidth = value.length * 7 + 10;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="smooth" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="${totalWidth}" height="20" fill="#555"/>
  <rect rx="3" x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
  <rect rx="3" width="${totalWidth}" height="20" fill="url(#smooth)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

/**
 * Generate HTML report.
 */
function generateHTMLReport(report: FullBenchmarkReport): string {
  const formatValue = (result: BenchmarkResult) => {
    if (result.unit === 'B' || result.unit === 'KB' || result.unit === 'MB') {
      if (result.mean > 1024 * 1024) {
        return `${(result.mean / (1024 * 1024)).toFixed(2)} MB`;
      } else if (result.mean > 1024) {
        return `${(result.mean / 1024).toFixed(2)} KB`;
      }
      return `${result.mean.toFixed(0)} B`;
    }
    return `${result.mean.toFixed(2)} ${result.unit}`;
  };

  const generateResultsTable = (results: BenchmarkResult[]) => {
    return `
    <table class="results-table">
      <thead>
        <tr>
          <th>Benchmark</th>
          <th>Mean</th>
          <th>Median</th>
          <th>Min</th>
          <th>Max</th>
          <th>Std Dev</th>
          <th>Samples</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => `
        <tr>
          <td><code>${r.name}</code></td>
          <td><strong>${formatValue(r)}</strong></td>
          <td>${r.median.toFixed(2)} ${r.unit}</td>
          <td>${r.min.toFixed(2)} ${r.unit}</td>
          <td>${r.max.toFixed(2)} ${r.unit}</td>
          <td>${r.stddev.toFixed(2)} ${r.unit}</td>
          <td>${r.samples}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS Benchmark Report</title>
  <style>
    :root {
      --bg: #0d1117;
      --fg: #c9d1d9;
      --accent: #58a6ff;
      --border: #30363d;
      --success: #3fb950;
      --warning: #d29922;
      --error: #f85149;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: var(--accent);
      margin-bottom: 1rem;
    }

    h2 {
      color: var(--fg);
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    h3 {
      color: var(--accent);
      margin: 1.5rem 0 0.5rem;
    }

    .meta {
      background: #161b22;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .meta p {
      margin: 0.25rem 0;
    }

    .badges {
      display: flex;
      gap: 0.5rem;
      margin: 1rem 0;
      flex-wrap: wrap;
    }

    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
    }

    .results-table th,
    .results-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }

    .results-table th {
      background: #161b22;
      font-weight: 600;
    }

    .results-table tr:hover {
      background: rgba(88, 166, 255, 0.1);
    }

    .results-table code {
      background: #21262d;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .comparison-card {
      background: #161b22;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .comparison-card h4 {
      color: var(--accent);
      margin-bottom: 0.5rem;
    }

    .comparison-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }

    .comparison-item:last-child {
      border-bottom: none;
    }

    .faster {
      color: var(--success);
    }

    .slower {
      color: var(--error);
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat-card {
      background: #161b22;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: var(--accent);
    }

    .stat-label {
      font-size: 0.9rem;
      color: #8b949e;
    }

    .chart-container {
      background: #161b22;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: #8b949e;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      .results-table {
        font-size: 0.8rem;
      }

      .results-table th,
      .results-table td {
        padding: 0.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PhilJS Benchmark Report</h1>

    <div class="meta">
      <p><strong>Framework:</strong> ${report.framework} v${report.version}</p>
      <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
      <p><strong>Runtime:</strong> ${report.environment.runtime} ${report.environment.runtimeVersion}</p>
      <p><strong>OS:</strong> ${report.environment.os}</p>
      <p><strong>CPU:</strong> ${report.environment.cpu}</p>
      <p><strong>Memory:</strong> ${report.environment.memory}</p>
    </div>

    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalBenchmarks}</div>
        <div class="stat-label">Total Benchmarks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--success)">${report.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--error)">${report.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      ${report.suites.bundle?.results.find(r => r.name === 'core-bundle-gzip') ?
        `<div class="stat-card">
          <div class="stat-value">${(report.suites.bundle.results.find(r => r.name === 'core-bundle-gzip')!.mean / 1024).toFixed(1)}KB</div>
          <div class="stat-label">Core Bundle (gzip)</div>
        </div>` : ''}
    </div>

    ${report.suites.framework ? `
    <h2>Framework Benchmarks</h2>
    <p>Compatible with js-framework-benchmark</p>
    ${generateResultsTable(report.suites.framework.results)}
    ` : ''}

    ${report.suites.reactivity ? `
    <h2>Reactivity Benchmarks</h2>
    <p>Signal, effect, memo, and batch performance</p>
    ${generateResultsTable(report.suites.reactivity.results)}
    ` : ''}

    ${report.suites.ssr ? `
    <h2>SSR Benchmarks</h2>
    <p>Server-side rendering, hydration, and streaming performance</p>
    ${generateResultsTable(report.suites.ssr.results)}
    ` : ''}

    ${report.suites.bundle ? `
    <h2>Bundle Size Analysis</h2>
    <p>Bundle sizes and tree-shaking effectiveness</p>
    ${generateResultsTable(report.suites.bundle.results)}
    ` : ''}

    ${report.suites.rust ? `
    <h2>Rust/WASM Benchmarks</h2>
    <p>JavaScript vs WASM performance comparison</p>
    ${generateResultsTable(report.suites.rust.results)}
    ` : ''}

    ${report.comparison && Object.keys(report.comparison).length > 0 ? `
    <h2>Framework Comparison</h2>
    <div class="comparison-grid">
      ${Object.entries(report.comparison).map(([framework, data]: [string, any]) => `
        <div class="comparison-card">
          <h4>vs ${framework}</h4>
          ${Object.entries(data.benchmarks || {}).map(([bench, metrics]: [string, any]) => `
            <div class="comparison-item">
              <span>${bench}</span>
              <span class="${metrics.difference?.includes('faster') ? 'faster' : 'slower'}">${metrics.difference}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <footer>
      <p>Generated by PhilJS Benchmark Suite</p>
      <p>${new Date().toISOString()}</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Generate Markdown report.
 */
function generateMarkdownReport(report: FullBenchmarkReport): string {
  const formatValue = (result: BenchmarkResult) => {
    if (result.unit === 'B' || result.unit === 'KB' || result.unit === 'MB') {
      if (result.mean > 1024) {
        return `${(result.mean / 1024).toFixed(2)} KB`;
      }
      return `${result.mean.toFixed(0)} B`;
    }
    return `${result.mean.toFixed(2)} ${result.unit}`;
  };

  let md = `# PhilJS Benchmark Report

**Framework:** ${report.framework} v${report.version}
**Date:** ${new Date(report.timestamp).toLocaleString()}
**Environment:** ${report.environment.runtime} ${report.environment.runtimeVersion} on ${report.environment.os}

## Summary

- Total Benchmarks: ${report.summary.totalBenchmarks}
- Passed: ${report.summary.passed}
- Failed: ${report.summary.failed}

`;

  if (report.suites.framework) {
    md += `## Framework Benchmarks

| Benchmark | Mean | Std Dev | Samples |
|-----------|------|---------|---------|
${report.suites.framework.results.map(r =>
  `| ${r.name} | ${formatValue(r)} | ${r.stddev.toFixed(2)} ${r.unit} | ${r.samples} |`
).join('\n')}

`;
  }

  if (report.suites.reactivity) {
    md += `## Reactivity Benchmarks

| Benchmark | Mean | Std Dev | Samples |
|-----------|------|---------|---------|
${report.suites.reactivity.results.map(r =>
  `| ${r.name} | ${formatValue(r)} | ${r.stddev.toFixed(2)} ${r.unit} | ${r.samples} |`
).join('\n')}

`;
  }

  if (report.suites.ssr) {
    md += `## SSR Benchmarks

| Benchmark | Mean | Std Dev | Samples |
|-----------|------|---------|---------|
${report.suites.ssr.results.map(r =>
  `| ${r.name} | ${formatValue(r)} | ${r.stddev.toFixed(2)} ${r.unit} | ${r.samples} |`
).join('\n')}

`;
  }

  if (report.suites.bundle) {
    md += `## Bundle Size Analysis

| Metric | Value |
|--------|-------|
${report.suites.bundle.results.map(r =>
  `| ${r.name} | ${formatValue(r)} |`
).join('\n')}

`;
  }

  md += `---
*Generated by PhilJS Benchmark Suite*
`;

  return md;
}

/**
 * Main function.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const inputFile = args.find(a => !a.startsWith('--'));
  const format = args.includes('--markdown') ? 'markdown' : 'html';

  console.log('Loading benchmark results...');
  const report = await loadResults(inputFile);

  console.log('Generating report...');

  if (format === 'markdown') {
    const markdown = generateMarkdownReport(report);
    const outputPath = path.join(RESULTS_DIR, 'report.md');
    await fs.promises.writeFile(outputPath, markdown);
    console.log(`Markdown report saved to: ${outputPath}`);
  } else {
    const html = generateHTMLReport(report);
    const outputPath = path.join(RESULTS_DIR, 'report.html');
    await fs.promises.writeFile(outputPath, html);
    console.log(`HTML report saved to: ${outputPath}`);
  }

  // Generate badges
  const badgesDir = path.join(RESULTS_DIR, 'badges');
  await fs.promises.mkdir(badgesDir, { recursive: true });

  // Core size badge
  const coreSize = report.suites.bundle?.results.find(r => r.name === 'core-bundle-gzip');
  if (coreSize) {
    const badge = generateBadge('size', `${(coreSize.mean / 1024).toFixed(1)}KB`, '#4c1');
    await fs.promises.writeFile(path.join(badgesDir, 'size.svg'), badge);
  }

  // Performance badge
  const create1k = report.suites.framework?.results.find(r => r.name === 'create-1000-rows');
  if (create1k) {
    const color = create1k.mean < 50 ? '#4c1' : create1k.mean < 100 ? '#dfb317' : '#e05d44';
    const badge = generateBadge('perf', `${create1k.mean.toFixed(0)}ms`, color);
    await fs.promises.writeFile(path.join(badgesDir, 'performance.svg'), badge);
  }

  console.log(`Badges saved to: ${badgesDir}`);
  console.log('Done!');
}

main().catch(console.error);

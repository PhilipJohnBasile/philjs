import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredSuites = ['performance.test.ts', 'benchmarks.test.ts'];

export function parseBenchmarkResults(report) {
  if (report.success !== true || report.numFailedTests !== 0 || report.numFailedTestSuites !== 0) {
    throw new Error('Performance tests did not complete successfully');
  }
  if (!Array.isArray(report.testResults) || !(report.numPassedTests > 0)) {
    throw new Error('Performance report contains no passed tests');
  }

  const tests = [];
  for (const filename of requiredSuites) {
    const suites = report.testResults.filter(suite => basename(suite.name) === filename);
    if (suites.length !== 1 || suites[0].status !== 'passed') {
      throw new Error(`Missing or unsuccessful performance suite: ${filename}`);
    }
    const passed = suites[0].assertionResults.filter(test => test.status === 'passed');
    if (passed.length === 0) {
      throw new Error(`Performance suite contains no passed tests: ${filename}`);
    }
    for (const test of passed) {
      if (!test.fullName || !Number.isFinite(test.duration) || test.duration < 0) {
        throw new Error(`Missing or invalid test duration in ${filename}`);
      }
      tests.push({ name: `${filename}: ${test.fullName}`, duration: test.duration });
    }
    if (suites[0].assertionResults.some(test => test.status === 'failed')) {
      throw new Error(`Failed assertion in performance suite: ${filename}`);
    }
  }
  if (tests.length !== report.numPassedTests) {
    throw new Error('Performance report count does not match the selected suites');
  }

  const durations = tests.map(test => test.duration);
  const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
  return {
    schema_version: 1,
    measurement: 'vitest-test-duration-ms',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform,
    tests,
    summary: {
      totalTests: tests.length,
      skippedTests: report.numPendingTests ?? 0,
      totalTime,
      avgTime: totalTime / tests.length,
      maxTime: Math.max(...durations),
      minTime: Math.min(...durations),
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , input, output] = process.argv;
  if (!input || !output) throw new Error('Usage: parse-benchmark-results.mjs INPUT OUTPUT');
  const results = parseBenchmarkResults(JSON.parse(readFileSync(input, 'utf8')));
  writeFileSync(output, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`Parsed ${results.tests.length} passed performance tests`);
}

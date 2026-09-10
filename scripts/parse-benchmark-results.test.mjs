import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBenchmarkResults } from './parse-benchmark-results.mjs';

function report() {
  return {
    success: true, numFailedTests: 0, numFailedTestSuites: 0,
    numPassedTests: 2, numPendingTests: 1,
    testResults: ['performance.test.ts', 'benchmarks.test.ts'].map(name => ({
      name: `/checkout/packages/philjs-core/src/${name}`, status: 'passed',
      assertionResults: [{ fullName: 'nested suite same title', status: 'passed', duration: 0.125 }],
    })),
  };
}

test('reads fractional JSON timings and disambiguates names across suites', () => {
  const input = report();
  input.testResults[1].assertionResults.push({ fullName: 'skipped', status: 'pending' });
  const result = parseBenchmarkResults(input);
  assert.equal(result.summary.totalTests, 2);
  assert.equal(result.summary.skippedTests, 1);
  assert.equal(result.summary.totalTime, 0.25);
  assert.equal(result.measurement, 'vitest-test-duration-ms');
  assert.notEqual(result.tests[0].name, result.tests[1].name);
});

test('rejects a successful but empty report', () => {
  const input = report(); input.numPassedTests = 0; input.testResults = [];
  assert.throws(() => parseBenchmarkResults(input), /no passed tests/);
});

test('rejects missing, duplicated, failed, and skipped required suites', () => {
  for (const mutate of [
    input => input.testResults.pop(),
    input => input.testResults.push(input.testResults[0]),
    input => { input.testResults[0].status = 'failed'; },
    input => { input.testResults[0].assertionResults[0].status = 'pending'; },
  ]) {
    const input = report(); mutate(input);
    assert.throws(() => parseBenchmarkResults(input));
  }
});

test('rejects failures and inconsistent counts even when timing rows exist', () => {
  for (const mutate of [
    input => { input.success = false; },
    input => { input.numFailedTests = 1; },
    input => { input.numFailedTestSuites = 1; },
    input => { input.numPassedTests = 3; },
    input => { input.testResults[0].assertionResults.push({status: 'failed'}); },
  ]) {
    const input = report(); mutate(input);
    assert.throws(() => parseBenchmarkResults(input));
  }
});

test('rejects absent and invalid timings while allowing zero duration', () => {
  for (const duration of [undefined, null, '1', -1, NaN, Infinity]) {
    const input = report(); input.testResults[0].assertionResults[0].duration = duration;
    assert.throws(() => parseBenchmarkResults(input), /invalid test duration/);
  }
  const input = report(); input.testResults[0].assertionResults[0].duration = 0;
  assert.equal(parseBenchmarkResults(input).tests[0].duration, 0);
});

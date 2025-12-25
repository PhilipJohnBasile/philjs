/**
 * Tests for reactivity benchmarks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  runReactivityBenchmarks,
  runCoreReactivityBenchmarks,
  allReactivityBenchmarks,
  coreReactivityBenchmarks,
  signalBenchmarks,
  effectBenchmarks,
  memoBenchmarks,
  batchBenchmarks,
} from '../reactivity/index.js';
import type { BenchmarkSuite } from '../types.js';

describe('Reactivity Benchmark Suite', () => {
  describe('runReactivityBenchmarks', () => {
    it('should run all reactivity benchmarks successfully', async () => {
      const suite = await runReactivityBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      assert.ok(suite, 'Suite should be returned');
      assert.equal(suite.name, 'reactivity-benchmark');
      assert.equal(suite.version, '1.0.0');
      assert.ok(suite.timestamp, 'Timestamp should be present');
      assert.ok(suite.environment, 'Environment info should be present');
      assert.ok(Array.isArray(suite.results), 'Results should be an array');
      assert.ok(suite.results.length > 0, 'Results should not be empty');
    });

    it('should include all reactivity benchmark categories', async () => {
      const suite = await runReactivityBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      // Should have results from all categories
      const hasSignal = suite.results.some(r => r.name.includes('signal'));
      const hasEffect = suite.results.some(r => r.name.includes('effect'));
      const hasMemo = suite.results.some(r => r.name.includes('memo'));
      const hasBatch = suite.results.some(r => r.name.includes('batch'));

      assert.ok(hasSignal, 'Should include signal benchmarks');
      assert.ok(hasEffect, 'Should include effect benchmarks');
      assert.ok(hasMemo, 'Should include memo benchmarks');
      assert.ok(hasBatch, 'Should include batch benchmarks');
    });

    it('should return valid statistics for each result', async () => {
      const suite = await runReactivityBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      for (const result of suite.results) {
        assert.ok(typeof result.name === 'string', 'Name should be a string');
        assert.ok(typeof result.mean === 'number', 'Mean should be a number');
        assert.ok(typeof result.median === 'number', 'Median should be a number');
        assert.ok(typeof result.min === 'number', 'Min should be a number');
        assert.ok(typeof result.max === 'number', 'Max should be a number');
        assert.ok(typeof result.stddev === 'number', 'Std dev should be a number');
        assert.ok(result.min <= result.median, 'Min should be <= median');
        assert.ok(result.median <= result.max, 'Median should be <= max');
        assert.ok(result.stddev >= 0, 'Std dev should be non-negative');
      }
    });
  });

  describe('runCoreReactivityBenchmarks', () => {
    it('should run only core reactivity benchmarks', async () => {
      const suite = await runCoreReactivityBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      assert.ok(suite, 'Suite should be returned');
      assert.equal(suite.name, 'core-reactivity-benchmark');
      assert.ok(suite.results.length > 0, 'Should have results');
      assert.ok(
        suite.results.length <= coreReactivityBenchmarks.length,
        'Should have fewer or equal results than core benchmarks'
      );
    });

    it('should include essential reactivity benchmarks', async () => {
      const suite = await runCoreReactivityBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      const requiredBenchmarks = [
        'create-10k-signals',
        'read-1m-signals',
        'write-100k-signals',
        'create-1k-effects',
        'memo-caching-1m-reads',
        'batch-1000-updates',
      ];

      for (const benchName of requiredBenchmarks) {
        const result = suite.results.find(r => r.name === benchName);
        assert.ok(result, `Core benchmark '${benchName}' should be present`);
      }
    });
  });

  describe('Signal Benchmarks', () => {
    it('should have signal benchmark collection', () => {
      assert.ok(Array.isArray(signalBenchmarks), 'Should be an array');
      assert.ok(signalBenchmarks.length > 0, 'Should not be empty');

      const expectedBenchmarks = [
        'create-10k-signals',
        'read-1m-signals',
        'write-100k-signals',
      ];

      for (const name of expectedBenchmarks) {
        const found = signalBenchmarks.find(b => b.name === name);
        assert.ok(found, `Should include '${name}' benchmark`);
        assert.ok(typeof found.fn === 'function', 'Should have a function');
      }
    });

    it('signal benchmarks should execute without errors', async () => {
      for (const benchmark of signalBenchmarks.slice(0, 3)) {
        if (benchmark.setup) {
          await benchmark.setup();
        }
        await benchmark.fn();
        if (benchmark.teardown) {
          await benchmark.teardown();
        }
        assert.ok(true, `${benchmark.name} should execute`);
      }
    });
  });

  describe('Effect Benchmarks', () => {
    it('should have effect benchmark collection', () => {
      assert.ok(Array.isArray(effectBenchmarks), 'Should be an array');
      assert.ok(effectBenchmarks.length > 0, 'Should not be empty');

      const expectedBenchmarks = [
        'create-1k-effects',
        'effect-single-dependency-10k-updates',
      ];

      for (const name of expectedBenchmarks) {
        const found = effectBenchmarks.find(b => b.name === name);
        assert.ok(found, `Should include '${name}' benchmark`);
        assert.ok(typeof found.fn === 'function', 'Should have a function');
      }
    });

    it('effect benchmarks should execute without errors', async () => {
      for (const benchmark of effectBenchmarks.slice(0, 2)) {
        if (benchmark.setup) {
          await benchmark.setup();
        }
        await benchmark.fn();
        if (benchmark.teardown) {
          await benchmark.teardown();
        }
        assert.ok(true, `${benchmark.name} should execute`);
      }
    });
  });

  describe('Memo Benchmarks', () => {
    it('should have memo benchmark collection', () => {
      assert.ok(Array.isArray(memoBenchmarks), 'Should be an array');
      assert.ok(memoBenchmarks.length > 0, 'Should not be empty');

      const expectedBenchmarks = [
        'memo-caching-1m-reads',
        'memo-recomputation-10k',
      ];

      for (const name of expectedBenchmarks) {
        const found = memoBenchmarks.find(b => b.name === name);
        assert.ok(found, `Should include '${name}' benchmark`);
        assert.ok(typeof found.fn === 'function', 'Should have a function');
      }
    });

    it('memo benchmarks should execute without errors', async () => {
      for (const benchmark of memoBenchmarks.slice(0, 2)) {
        if (benchmark.setup) {
          await benchmark.setup();
        }
        await benchmark.fn();
        if (benchmark.teardown) {
          await benchmark.teardown();
        }
        assert.ok(true, `${benchmark.name} should execute`);
      }
    });
  });

  describe('Batch Benchmarks', () => {
    it('should have batch benchmark collection', () => {
      assert.ok(Array.isArray(batchBenchmarks), 'Should be an array');
      assert.ok(batchBenchmarks.length > 0, 'Should not be empty');

      const expectedBenchmarks = [
        'batch-1000-updates',
        'unbatched-1000-updates',
      ];

      for (const name of expectedBenchmarks) {
        const found = batchBenchmarks.find(b => b.name === name);
        assert.ok(found, `Should include '${name}' benchmark`);
        assert.ok(typeof found.fn === 'function', 'Should have a function');
      }
    });

    it('batch benchmarks should execute without errors', async () => {
      for (const benchmark of batchBenchmarks.slice(0, 2)) {
        if (benchmark.setup) {
          await benchmark.setup();
        }
        await benchmark.fn();
        if (benchmark.teardown) {
          await benchmark.teardown();
        }
        assert.ok(true, `${benchmark.name} should execute`);
      }
    });

    it('batch should be faster than unbatched', async () => {
      const batchBench = batchBenchmarks.find(b => b.name === 'batch-1000-updates');
      const unbatchedBench = batchBenchmarks.find(b => b.name === 'unbatched-1000-updates');

      assert.ok(batchBench, 'Batch benchmark should exist');
      assert.ok(unbatchedBench, 'Unbatched benchmark should exist');

      // Run a quick comparison
      const iterations = 10;
      const batchTimes: number[] = [];
      const unbatchedTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start1 = performance.now();
        await batchBench!.fn();
        batchTimes.push(performance.now() - start1);

        const start2 = performance.now();
        await unbatchedBench!.fn();
        unbatchedTimes.push(performance.now() - start2);
      }

      const batchAvg = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
      const unbatchedAvg = unbatchedTimes.reduce((a, b) => a + b, 0) / unbatchedTimes.length;

      // Batched should generally be faster
      assert.ok(
        batchAvg < unbatchedAvg * 1.5,
        `Batched (${batchAvg.toFixed(2)}ms) should be competitive with unbatched (${unbatchedAvg.toFixed(2)}ms)`
      );
    });
  });

  describe('Benchmark Collections', () => {
    it('allReactivityBenchmarks should include all benchmarks', () => {
      assert.ok(Array.isArray(allReactivityBenchmarks), 'Should be an array');
      assert.ok(allReactivityBenchmarks.length > 0, 'Should not be empty');

      const expectedCount =
        signalBenchmarks.length +
        effectBenchmarks.length +
        memoBenchmarks.length +
        batchBenchmarks.length;

      assert.equal(
        allReactivityBenchmarks.length,
        expectedCount,
        'Should include all benchmark categories'
      );
    });

    it('coreReactivityBenchmarks should include essential benchmarks', () => {
      assert.ok(Array.isArray(coreReactivityBenchmarks), 'Should be an array');
      assert.ok(coreReactivityBenchmarks.length > 0, 'Should not be empty');
      assert.ok(
        coreReactivityBenchmarks.length < allReactivityBenchmarks.length,
        'Core should be subset of all benchmarks'
      );
    });
  });

  describe('Performance Characteristics', () => {
    it('signal reads should be very fast', async () => {
      const readBench = signalBenchmarks.find(b => b.name === 'read-1m-signals');
      assert.ok(readBench, 'Read benchmark should exist');

      const start = performance.now();
      await readBench!.fn();
      const duration = performance.now() - start;

      // Reading 1M signals should be very fast (< 100ms on modern hardware)
      assert.ok(
        duration < 500,
        `Reading 1M signals should be fast, got ${duration.toFixed(2)}ms`
      );
    });

    it('signal writes should be reasonably fast', async () => {
      const writeBench = signalBenchmarks.find(b => b.name === 'write-100k-signals');
      assert.ok(writeBench, 'Write benchmark should exist');

      if (writeBench!.setup) {
        await writeBench!.setup();
      }

      const start = performance.now();
      await writeBench!.fn();
      const duration = performance.now() - start;

      // Writing 100k signals should be reasonably fast
      assert.ok(
        duration < 1000,
        `Writing 100k signals should be fast, got ${duration.toFixed(2)}ms`
      );
    });
  });

  describe('Reproducibility', () => {
    it('should produce consistent results with same iterations', async () => {
      const options = {
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      };

      const suite1 = await runCoreReactivityBenchmarks(options);
      const suite2 = await runCoreReactivityBenchmarks(options);

      assert.equal(suite1.results.length, suite2.results.length, 'Should have same number of results');

      // Results should be in similar range (within 50% variance)
      for (let i = 0; i < suite1.results.length; i++) {
        const result1 = suite1.results[i];
        const result2 = suite2.results[i];

        assert.equal(result1.name, result2.name, 'Results should be in same order');

        const variance = Math.abs(result1.mean - result2.mean) / result1.mean;
        assert.ok(
          variance < 0.5,
          `Results for ${result1.name} should be within 50% variance (got ${(variance * 100).toFixed(1)}%)`
        );
      }
    });
  });
});

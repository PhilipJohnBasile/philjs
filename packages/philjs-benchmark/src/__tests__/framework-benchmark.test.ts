/**
 * Tests for framework benchmark runners.
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  runFrameworkBenchmarks,
  runCoreBenchmarks,
  allFrameworkBenchmarks,
  coreFrameworkBenchmarks,
} from '../framework-benchmark/runner.ts';
import {
  createRowsBenchmarks,
  create1000Rows,
  create10000Rows,
} from '../framework-benchmark/create-rows.ts';
import { updateRowsBenchmarks, updateEvery10th } from '../framework-benchmark/update-rows.ts';
import { swapRowsBenchmarks, swapRows } from '../framework-benchmark/swap-rows.ts';
import { selectRowBenchmarks, selectRow } from '../framework-benchmark/select-row.ts';
import { deleteRowBenchmarks, deleteRow } from '../framework-benchmark/delete-row.ts';
import type { BenchmarkSuite } from '../types.ts';

describe('Framework Benchmark Suite', () => {
  describe('runFrameworkBenchmarks', () => {
    it('should run all framework benchmarks successfully', async () => {
      const suite = await runFrameworkBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      assert.ok(suite, 'Suite should be returned');
      assert.equal(suite.name, 'framework-benchmark');
      assert.equal(suite.version, '1.0.0');
      assert.ok(suite.timestamp, 'Timestamp should be present');
      assert.ok(suite.environment, 'Environment info should be present');
      assert.ok(Array.isArray(suite.results), 'Results should be an array');
      assert.ok(suite.results.length > 0, 'Results should not be empty');
    });

    it('should include required benchmark results', async () => {
      const suite = await runFrameworkBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      const requiredBenchmarks = [
        'startup-time',
        'create-1000-rows',
        'update-every-10th-row',
        'swap-rows',
        'select-row',
        'remove-row',
        'clear-rows',
        'memory-1000-rows',
      ];

      for (const benchName of requiredBenchmarks) {
        const result = suite.results.find(r => r.name === benchName);
        assert.ok(result, `Benchmark '${benchName}' should be present`);
        assert.ok(typeof result.mean === 'number', 'Mean should be a number');
        assert.ok(result.mean >= 0, 'Mean should be non-negative');
      }
    });

    it('should return valid statistics for each result', async () => {
      const suite = await runFrameworkBenchmarks({
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
        assert.ok(result.min <= result.mean, 'Min should be <= mean');
        assert.ok(result.mean <= result.max, 'Mean should be <= max');
      }
    });
  });

  describe('runCoreBenchmarks', () => {
    it('should run only core benchmarks', async () => {
      const suite = await runCoreBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      assert.ok(suite, 'Suite should be returned');
      assert.equal(suite.name, 'core-framework-benchmark');
      assert.ok(suite.results.length > 0, 'Should have results');
      assert.ok(
        suite.results.length <= coreFrameworkBenchmarks.length,
        'Should have fewer or equal results than core benchmarks'
      );
    });
  });

  describe('Individual Benchmarks', () => {
    it('should have valid create-rows benchmarks', () => {
      assert.ok(Array.isArray(createRowsBenchmarks), 'Should be an array');
      assert.ok(createRowsBenchmarks.length > 0, 'Should not be empty');

      const create1k = createRowsBenchmarks.find(b => b.name === 'create-1000-rows');
      assert.ok(create1k, 'Should have create-1000-rows benchmark');
      assert.ok(typeof create1k.fn === 'function', 'Should have a function');
    });

    it('should have valid update-rows benchmarks', () => {
      assert.ok(Array.isArray(updateRowsBenchmarks), 'Should be an array');
      assert.ok(updateRowsBenchmarks.length > 0, 'Should not be empty');

      const update10th = updateRowsBenchmarks.find(b => b.name === 'update-every-10th-row');
      assert.ok(update10th, 'Should have update-every-10th-row benchmark');
      assert.ok(typeof update10th.fn === 'function', 'Should have a function');
    });

    it('should have valid swap-rows benchmarks', () => {
      assert.ok(Array.isArray(swapRowsBenchmarks), 'Should be an array');
      assert.ok(swapRowsBenchmarks.length > 0, 'Should not be empty');

      const swap = swapRowsBenchmarks.find(b => b.name === 'swap-rows');
      assert.ok(swap, 'Should have swap-rows benchmark');
      assert.ok(typeof swap.fn === 'function', 'Should have a function');
    });

    it('should have valid select-row benchmarks', () => {
      assert.ok(Array.isArray(selectRowBenchmarks), 'Should be an array');
      assert.ok(selectRowBenchmarks.length > 0, 'Should not be empty');

      const select = selectRowBenchmarks.find(b => b.name === 'select-row');
      assert.ok(select, 'Should have select-row benchmark');
      assert.ok(typeof select.fn === 'function', 'Should have a function');
    });

    it('should have valid delete-row benchmarks', () => {
      assert.ok(Array.isArray(deleteRowBenchmarks), 'Should be an array');
      assert.ok(deleteRowsBenchmarks.length > 0, 'Should not be empty');

      const remove = deleteRowBenchmarks.find(b => b.name === 'remove-row');
      assert.ok(remove, 'Should have remove-row benchmark');
      assert.ok(typeof remove.fn === 'function', 'Should have a function');
    });
  });

  describe('Benchmark Functions', () => {
    it('create1000Rows should work', async () => {
      const result = await create1000Rows.fn();
      // Should not throw
      assert.ok(true);
    });

    it('create10000Rows should work', async () => {
      const result = await create10000Rows.fn();
      // Should not throw
      assert.ok(true);
    });

    it('updateEvery10th should work', async () => {
      // Setup first
      if (updateEvery10th.setup) {
        await updateEvery10th.setup();
      }
      const result = await updateEvery10th.fn();
      // Should not throw
      assert.ok(true);
    });

    it('swapRows should work', async () => {
      // Setup first
      if (swapRows.setup) {
        await swapRows.setup();
      }
      const result = await swapRows.fn();
      // Should not throw
      assert.ok(true);
    });

    it('selectRow should work', async () => {
      // Setup first
      if (selectRow.setup) {
        await selectRow.setup();
      }
      const result = await selectRow.fn();
      // Should not throw
      assert.ok(true);
    });

    it('deleteRow should work', async () => {
      // Setup first
      if (deleteRow.setup) {
        await deleteRow.setup();
      }
      const result = await deleteRow.fn();
      // Should not throw
      assert.ok(true);
    });
  });

  describe('Benchmark Collections', () => {
    it('allFrameworkBenchmarks should include all benchmarks', () => {
      assert.ok(Array.isArray(allFrameworkBenchmarks), 'Should be an array');
      assert.ok(allFrameworkBenchmarks.length > 0, 'Should not be empty');

      const expectedCount =
        createRowsBenchmarks.length +
        updateRowsBenchmarks.length +
        swapRowsBenchmarks.length +
        selectRowBenchmarks.length +
        deleteRowsBenchmarks.length;

      assert.equal(
        allFrameworkBenchmarks.length,
        expectedCount,
        'Should include all benchmark categories'
      );
    });

    it('coreFrameworkBenchmarks should include essential benchmarks', () => {
      assert.ok(Array.isArray(coreFrameworkBenchmarks), 'Should be an array');
      assert.ok(coreFrameworkBenchmarks.length > 0, 'Should not be empty');

      const requiredNames = [
        'create-1000-rows',
        'create-10000-rows',
        'append-1000-rows',
        'update-every-10th-row',
        'select-row',
        'swap-rows',
        'remove-row',
        'clear-rows',
      ];

      for (const name of requiredNames) {
        const found = coreFrameworkBenchmarks.find(b => b.name === name);
        assert.ok(found, `Core benchmarks should include '${name}'`);
      }
    });
  });

  describe('Environment Info', () => {
    it('should include environment information in suite', async () => {
      const suite = await runFrameworkBenchmarks({
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      assert.ok(suite.environment, 'Environment should be present');
      assert.ok(suite.environment.runtime, 'Runtime should be present');
      assert.ok(suite.environment.runtimeVersion, 'Runtime version should be present');
      assert.ok(suite.environment.os, 'OS should be present');
      assert.ok(suite.environment.cpu, 'CPU should be present');
      assert.ok(suite.environment.memory, 'Memory should be present');
    });
  });

  describe('Reproducibility', () => {
    it('should produce consistent results with same iterations', async () => {
      const options = {
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      };

      const suite1 = await runCoreBenchmarks(options);
      const suite2 = await runCoreBenchmarks(options);

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

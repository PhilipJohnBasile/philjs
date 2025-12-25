/**
 * Tests for utility functions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  randomLabel,
  now,
  calculateStats,
  runBenchmark,
  runBenchmarkSuite,
  formatResult,
  getEnvironmentInfo,
  compareResults,
  createMockDOM,
  nextTick,
  gc,
  getMemoryUsage,
  DEFAULT_OPTIONS,
} from '../utils.js';
import type { Benchmark, BenchmarkResult } from '../types.js';

describe('Utility Functions', () => {
  describe('randomLabel', () => {
    it('should generate random labels', () => {
      const label = randomLabel();
      assert.ok(typeof label === 'string', 'Should return a string');
      assert.ok(label.length > 0, 'Should not be empty');
      assert.ok(label.includes(' '), 'Should contain spaces');
    });

    it('should generate different labels', () => {
      const labels = new Set();
      for (let i = 0; i < 100; i++) {
        labels.add(randomLabel());
      }
      assert.ok(labels.size > 50, 'Should generate varied labels');
    });

    it('should follow format: adjective color noun', () => {
      const label = randomLabel();
      const parts = label.split(' ');
      assert.equal(parts.length, 3, 'Should have 3 parts');
    });
  });

  describe('now', () => {
    it('should return a number', () => {
      const time = now();
      assert.ok(typeof time === 'number', 'Should return a number');
      assert.ok(time > 0, 'Should be positive');
    });

    it('should return increasing values', async () => {
      const time1 = now();
      await new Promise(resolve => setTimeout(resolve, 10));
      const time2 = now();
      assert.ok(time2 > time1, 'Time should increase');
    });

    it('should have millisecond precision', () => {
      const time1 = now();
      const time2 = now();
      assert.ok(time2 >= time1, 'Should maintain precision');
    });
  });

  describe('calculateStats', () => {
    it('should calculate statistics correctly', () => {
      const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = calculateStats(samples);

      assert.equal(stats.mean, 5.5, 'Mean should be 5.5');
      assert.equal(stats.median, 5.5, 'Median should be 5.5');
      assert.equal(stats.min, 1, 'Min should be 1');
      assert.equal(stats.max, 10, 'Max should be 10');
      assert.ok(stats.stddev > 0, 'Std dev should be positive');
    });

    it('should handle empty array', () => {
      const stats = calculateStats([]);
      assert.equal(stats.mean, 0);
      assert.equal(stats.median, 0);
      assert.equal(stats.min, 0);
      assert.equal(stats.max, 0);
      assert.equal(stats.stddev, 0);
    });

    it('should handle single value', () => {
      const stats = calculateStats([42]);
      assert.equal(stats.mean, 42);
      assert.equal(stats.median, 42);
      assert.equal(stats.min, 42);
      assert.equal(stats.max, 42);
      assert.equal(stats.stddev, 0);
    });

    it('should calculate median for odd-length array', () => {
      const stats = calculateStats([1, 2, 3, 4, 5]);
      assert.equal(stats.median, 3);
    });

    it('should calculate median for even-length array', () => {
      const stats = calculateStats([1, 2, 3, 4]);
      assert.equal(stats.median, 2.5);
    });

    it('should handle unsorted input', () => {
      const stats = calculateStats([5, 2, 8, 1, 9, 3]);
      assert.equal(stats.min, 1);
      assert.equal(stats.max, 9);
    });
  });

  describe('runBenchmark', () => {
    it('should run a benchmark', async () => {
      const benchmark: Benchmark = {
        name: 'test-bench',
        fn: async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
        },
      };

      const result = await runBenchmark(benchmark, {
        iterations: 5,
        warmupIterations: 2,
      });

      assert.equal(result.name, 'test-bench');
      assert.ok(result.mean > 0, 'Mean should be positive');
      assert.ok(result.samples === 5, 'Should have 5 samples');
    });

    it('should run setup and teardown', async () => {
      let setupCalled = false;
      let teardownCalled = false;

      const benchmark: Benchmark = {
        name: 'test-bench',
        fn: async () => {},
        setup: async () => {
          setupCalled = true;
        },
        teardown: async () => {
          teardownCalled = true;
        },
      };

      await runBenchmark(benchmark, {
        iterations: 5,
        warmupIterations: 2,
      });

      assert.ok(setupCalled, 'Setup should be called');
      assert.ok(teardownCalled, 'Teardown should be called');
    });

    it('should respect custom iterations', async () => {
      const benchmark: Benchmark = {
        name: 'test-bench',
        fn: async () => {},
        iterations: 10,
      };

      const result = await runBenchmark(benchmark, {
        iterations: 5,
        warmupIterations: 2,
      });

      assert.equal(result.samples, 10, 'Should use benchmark-specific iterations');
    });

    it('should calculate ops/sec', async () => {
      const benchmark: Benchmark = {
        name: 'test-bench',
        fn: async () => {},
      };

      const result = await runBenchmark(benchmark, {
        iterations: 5,
        warmupIterations: 2,
      });

      assert.ok(result.ops > 0, 'Ops should be positive');
      assert.ok(result.ops === 1000 / result.mean, 'Ops should be calculated correctly');
    });
  });

  describe('runBenchmarkSuite', () => {
    it('should run multiple benchmarks', async () => {
      const benchmarks: Benchmark[] = [
        {
          name: 'bench1',
          fn: async () => {},
        },
        {
          name: 'bench2',
          fn: async () => {},
        },
        {
          name: 'bench3',
          fn: async () => {},
        },
      ];

      const results = await runBenchmarkSuite(benchmarks, {
        iterations: 5,
        warmupIterations: 2,
        verbose: false,
      });

      assert.equal(results.length, 3, 'Should have 3 results');
      assert.equal(results[0].name, 'bench1');
      assert.equal(results[1].name, 'bench2');
      assert.equal(results[2].name, 'bench3');
    });

    it('should run benchmarks sequentially', async () => {
      const order: number[] = [];

      const benchmarks: Benchmark[] = [
        {
          name: 'bench1',
          fn: async () => {
            order.push(1);
          },
        },
        {
          name: 'bench2',
          fn: async () => {
            order.push(2);
          },
        },
      ];

      await runBenchmarkSuite(benchmarks, {
        iterations: 1,
        warmupIterations: 0,
        verbose: false,
      });

      assert.deepEqual(order, [1, 2], 'Should run in order');
    });
  });

  describe('formatResult', () => {
    it('should format result as string', () => {
      const result: BenchmarkResult = {
        name: 'test-bench',
        mean: 10.5,
        median: 10.0,
        min: 8.0,
        max: 15.0,
        stddev: 2.5,
        samples: 100,
        ops: 95.24,
        unit: 'ms',
      };

      const formatted = formatResult(result);
      assert.ok(typeof formatted === 'string', 'Should return a string');
      assert.ok(formatted.includes('test-bench'), 'Should include name');
      assert.ok(formatted.includes('10.50'), 'Should include mean');
      assert.ok(formatted.includes('ms'), 'Should include unit');
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return environment information', () => {
      const env = getEnvironmentInfo();

      assert.ok(env.runtime, 'Should have runtime');
      assert.ok(env.runtimeVersion, 'Should have runtime version');
      assert.ok(env.os, 'Should have OS');
      assert.ok(env.cpu, 'Should have CPU');
      assert.ok(env.memory, 'Should have memory');
    });

    it('should detect Node.js runtime', () => {
      const env = getEnvironmentInfo();
      assert.ok(['node', 'bun', 'deno'].includes(env.runtime), 'Should detect runtime');
    });

    it('should include version in correct format', () => {
      const env = getEnvironmentInfo();
      assert.ok(env.runtimeVersion.startsWith('v'), 'Version should start with v');
    });
  });

  describe('compareResults', () => {
    it('should compare two results', () => {
      const baseline: BenchmarkResult = {
        name: 'test',
        mean: 100,
        median: 100,
        min: 90,
        max: 110,
        stddev: 5,
        samples: 10,
        ops: 10,
        unit: 'ms',
      };

      const current: BenchmarkResult = {
        name: 'test',
        mean: 80,
        median: 80,
        min: 70,
        max: 90,
        stddev: 5,
        samples: 10,
        ops: 12.5,
        unit: 'ms',
      };

      const comparison = compareResults(baseline, current);

      assert.equal(comparison.difference, 20, 'Difference should be 20');
      assert.ok(comparison.faster, 'Should be faster');
      assert.ok(comparison.percentage.includes('faster'), 'Should indicate faster');
    });

    it('should detect slower performance', () => {
      const baseline: BenchmarkResult = {
        name: 'test',
        mean: 100,
        median: 100,
        min: 90,
        max: 110,
        stddev: 5,
        samples: 10,
        ops: 10,
        unit: 'ms',
      };

      const current: BenchmarkResult = {
        name: 'test',
        mean: 120,
        median: 120,
        min: 110,
        max: 130,
        stddev: 5,
        samples: 10,
        ops: 8.33,
        unit: 'ms',
      };

      const comparison = compareResults(baseline, current);

      assert.equal(comparison.difference, -20, 'Difference should be -20');
      assert.ok(!comparison.faster, 'Should be slower');
      assert.ok(comparison.percentage.includes('slower'), 'Should indicate slower');
    });

    it('should calculate percentage correctly', () => {
      const baseline: BenchmarkResult = {
        name: 'test',
        mean: 100,
        median: 100,
        min: 90,
        max: 110,
        stddev: 5,
        samples: 10,
        ops: 10,
        unit: 'ms',
      };

      const current: BenchmarkResult = {
        name: 'test',
        mean: 50,
        median: 50,
        min: 45,
        max: 55,
        stddev: 5,
        samples: 10,
        ops: 20,
        unit: 'ms',
      };

      const comparison = compareResults(baseline, current);

      assert.ok(comparison.percentage.includes('50.0%'), 'Should calculate 50% improvement');
    });
  });

  describe('createMockDOM', () => {
    it('should create mock DOM objects', () => {
      const dom = createMockDOM();

      assert.ok(dom.document, 'Should have document');
      assert.ok(dom.window, 'Should have window');
      assert.ok(typeof dom.document.createElement === 'function', 'Should have createElement');
      assert.ok(typeof dom.document.createTextNode === 'function', 'Should have createTextNode');
    });

    it('should create elements', () => {
      const dom = createMockDOM();
      const div = dom.document.createElement('div');

      assert.equal(div.tagName, 'DIV', 'Should create DIV element');
      assert.ok(Array.isArray(div.children), 'Should have children array');
    });

    it('should support appendChild', () => {
      const dom = createMockDOM();
      const parent = dom.document.createElement('div');
      const child = dom.document.createElement('span');

      parent.appendChild(child);

      assert.equal(parent.children.length, 1, 'Should have 1 child');
      assert.equal(parent.children[0], child, 'Child should be appended');
      assert.equal(child.parentNode, parent, 'Parent should be set');
    });

    it('should support removeChild', () => {
      const dom = createMockDOM();
      const parent = dom.document.createElement('div');
      const child = dom.document.createElement('span');

      parent.appendChild(child);
      parent.removeChild(child);

      assert.equal(parent.children.length, 0, 'Should have no children');
      assert.equal(child.parentNode, null, 'Parent should be null');
    });

    it('should support attributes', () => {
      const dom = createMockDOM();
      const div = dom.document.createElement('div');

      div.setAttribute('id', 'test');
      assert.equal(div.getAttribute('id'), 'test', 'Should get attribute');

      div.removeAttribute('id');
      assert.equal(div.getAttribute('id'), undefined, 'Should remove attribute');
    });

    it('should create text nodes', () => {
      const dom = createMockDOM();
      const text = dom.document.createTextNode('Hello');

      assert.equal(text.nodeType, 3, 'Should be text node');
      assert.equal(text.textContent, 'Hello', 'Should have text content');
    });
  });

  describe('nextTick', () => {
    it('should defer execution', async () => {
      let executed = false;

      const promise = nextTick().then(() => {
        executed = true;
      });

      assert.ok(!executed, 'Should not execute immediately');

      await promise;

      assert.ok(executed, 'Should execute after tick');
    });

    it('should use microtask queue', async () => {
      const order: number[] = [];

      setTimeout(() => order.push(3), 0);
      nextTick().then(() => order.push(2));
      order.push(1);

      await new Promise(resolve => setTimeout(resolve, 10));

      assert.deepEqual(order, [1, 2, 3], 'Should execute in microtask queue');
    });
  });

  describe('gc', () => {
    it('should not throw', () => {
      assert.doesNotThrow(() => gc(), 'Should not throw');
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage', () => {
      const mem = getMemoryUsage();

      assert.ok(typeof mem.heapUsed === 'number', 'heapUsed should be a number');
      assert.ok(typeof mem.heapTotal === 'number', 'heapTotal should be a number');
      assert.ok(typeof mem.external === 'number', 'external should be a number');
    });

    it('should return reasonable values', () => {
      const mem = getMemoryUsage();

      assert.ok(mem.heapUsed >= 0, 'heapUsed should be non-negative');
      assert.ok(mem.heapTotal >= 0, 'heapTotal should be non-negative');
      assert.ok(mem.heapTotal >= mem.heapUsed, 'heapTotal should be >= heapUsed');
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    it('should have default options', () => {
      assert.ok(DEFAULT_OPTIONS, 'Should exist');
      assert.ok(typeof DEFAULT_OPTIONS.iterations === 'number', 'iterations should be a number');
      assert.ok(typeof DEFAULT_OPTIONS.warmupIterations === 'number', 'warmupIterations should be a number');
      assert.ok(typeof DEFAULT_OPTIONS.timeout === 'number', 'timeout should be a number');
      assert.ok(typeof DEFAULT_OPTIONS.verbose === 'boolean', 'verbose should be a boolean');
      assert.ok(typeof DEFAULT_OPTIONS.saveResults === 'boolean', 'saveResults should be a boolean');
      assert.ok(typeof DEFAULT_OPTIONS.outputPath === 'string', 'outputPath should be a string');
    });

    it('should have reasonable defaults', () => {
      assert.ok(DEFAULT_OPTIONS.iterations > 0, 'iterations should be positive');
      assert.ok(DEFAULT_OPTIONS.warmupIterations >= 0, 'warmupIterations should be non-negative');
      assert.ok(DEFAULT_OPTIONS.timeout > 0, 'timeout should be positive');
    });
  });
});

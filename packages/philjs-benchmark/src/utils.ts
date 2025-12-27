/**
 * Utility functions for benchmarking.
 */

import type { BenchmarkResult, BenchmarkOptions, Benchmark, EnvironmentInfo } from './types.js';
import * as os from 'os';

/**
 * Default benchmark options.
 */
export const DEFAULT_OPTIONS: Required<BenchmarkOptions> = {
  iterations: 100,
  warmupIterations: 10,
  timeout: 60000,
  verbose: false,
  saveResults: true,
  outputPath: './results',
};

/**
 * Generate random string for row labels.
 */
const ADJECTIVES = [
  'pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome',
  'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful',
  'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive',
  'cheap', 'expensive', 'fancy'
];

const COLORS = [
  'red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown',
  'white', 'black', 'orange'
];

const NOUNS = [
  'table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie',
  'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'
];

/**
 * Generate a random label for a row.
 */
export function randomLabel(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${color} ${noun}`;
}

/**
 * High-resolution timer for benchmarks.
 */
export function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  const [sec, nsec] = process.hrtime();
  return sec * 1000 + nsec / 1e6;
}

/**
 * Calculate statistics from benchmark samples.
 */
export function calculateStats(samples: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
} {
  if (samples.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stddev: 0 };
  }

  // ES2023+: toSorted() is cleaner and more explicit than spread + sort
  const sorted = samples.toSorted((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  const mean = sum / samples.length;

  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  // Standard deviation
  const squaredDiffs = samples.map(x => Math.pow(x - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / samples.length;
  const stddev = Math.sqrt(avgSquaredDiff);

  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev,
  };
}

/**
 * Run a benchmark with proper warmup and iterations.
 */
export async function runBenchmark(
  benchmark: Benchmark,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const samples: number[] = [];

  // Setup
  if (benchmark.setup) {
    await benchmark.setup();
  }

  // Warmup
  for (let i = 0; i < opts.warmupIterations; i++) {
    await benchmark.fn();
  }

  // Run iterations
  const iterations = benchmark.iterations ?? opts.iterations;
  for (let i = 0; i < iterations; i++) {
    const start = now();
    await benchmark.fn();
    const end = now();
    samples.push(end - start);

    // Check timeout
    if (samples.reduce((a, b) => a + b, 0) > opts.timeout) {
      console.warn(`Benchmark "${benchmark.name}" exceeded timeout`);
      break;
    }
  }

  // Teardown
  if (benchmark.teardown) {
    await benchmark.teardown();
  }

  const stats = calculateStats(samples);

  return {
    name: benchmark.name,
    ...stats,
    samples: samples.length,
    ops: 1000 / stats.mean,
    unit: 'ms',
  };
}

/**
 * Run multiple benchmarks sequentially.
 */
export async function runBenchmarkSuite(
  benchmarks: Benchmark[],
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const benchmark of benchmarks) {
    if (options.verbose) {
      console.log(`Running: ${benchmark.name}...`);
    }

    const result = await runBenchmark(benchmark, options);
    results.push(result);

    if (options.verbose) {
      console.log(`  ${result.mean.toFixed(2)}ms (stddev: ${result.stddev.toFixed(2)}ms)`);
    }
  }

  return results;
}

/**
 * Format a benchmark result for display.
 */
export function formatResult(result: BenchmarkResult): string {
  return [
    `${result.name}:`,
    `  Mean: ${result.mean.toFixed(2)}${result.unit}`,
    `  Median: ${result.median.toFixed(2)}${result.unit}`,
    `  Min: ${result.min.toFixed(2)}${result.unit}`,
    `  Max: ${result.max.toFixed(2)}${result.unit}`,
    `  Std Dev: ${result.stddev.toFixed(2)}${result.unit}`,
    `  Samples: ${result.samples}`,
    `  Ops/sec: ${result.ops.toFixed(0)}`,
  ].join('\n');
}

// Declare runtime globals for type checking
declare const Bun: unknown | undefined;
declare const Deno: unknown | undefined;

/**
 * Get environment information.
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  const cpus = os.cpus();
  return {
    runtime: typeof Bun !== 'undefined' ? 'bun' : typeof Deno !== 'undefined' ? 'deno' : 'node',
    runtimeVersion: process.version,
    os: `${os.type()} ${os.release()}`,
    cpu: cpus.length > 0 ? `${cpus[0].model} (${cpus.length} cores)` : 'Unknown',
    memory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
  };
}

/**
 * Compare two benchmark results.
 */
export function compareResults(
  baseline: BenchmarkResult,
  current: BenchmarkResult
): { difference: number; percentage: string; faster: boolean } {
  const difference = baseline.mean - current.mean;
  const percentage = ((difference / baseline.mean) * 100).toFixed(1);
  const faster = difference > 0;

  return {
    difference,
    percentage: faster ? `+${percentage}% faster` : `${Math.abs(parseFloat(percentage))}% slower`,
    faster,
  };
}

/**
 * Create a mock DOM environment for benchmarks.
 */
export function createMockDOM(): {
  document: {
    createElement: (tag: string) => any;
    createTextNode: (text: string) => any;
    body: any;
  };
  window: any;
} {
  const elements: any[] = [];

  const createElement = (tag: string) => {
    const element = {
      tagName: tag.toUpperCase(),
      children: [] as any[],
      attributes: {} as Record<string, string>,
      textContent: '',
      parentNode: null as any,
      appendChild(child: any) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      removeChild(child: any) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
        }
        return child;
      },
      insertBefore(newChild: any, refChild: any) {
        const index = this.children.indexOf(refChild);
        if (index > -1) {
          this.children.splice(index, 0, newChild);
        } else {
          this.children.push(newChild);
        }
        newChild.parentNode = this;
        return newChild;
      },
      replaceChild(newChild: any, oldChild: any) {
        const index = this.children.indexOf(oldChild);
        if (index > -1) {
          this.children[index] = newChild;
          newChild.parentNode = this;
          oldChild.parentNode = null;
        }
        return oldChild;
      },
      setAttribute(name: string, value: string) {
        this.attributes[name] = value;
      },
      getAttribute(name: string) {
        return this.attributes[name];
      },
      removeAttribute(name: string) {
        delete this.attributes[name];
      },
      addEventListener() {},
      removeEventListener() {},
      classList: {
        add() {},
        remove() {},
        toggle() {},
        contains() { return false; },
      },
      style: {},
    };
    elements.push(element);
    return element;
  };

  const createTextNode = (text: string) => ({
    nodeType: 3,
    textContent: text,
    parentNode: null,
  });

  const body = createElement('body');

  return {
    document: {
      createElement,
      createTextNode,
      body,
    },
    window: {
      requestAnimationFrame: (cb: () => void) => setTimeout(cb, 16),
      cancelAnimationFrame: clearTimeout,
    },
  };
}

/**
 * Wait for the next microtask.
 */
export function nextTick(): Promise<void> {
  return new Promise(resolve => {
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(resolve);
    } else {
      Promise.resolve().then(resolve);
    }
  });
}

/**
 * Force garbage collection if available.
 */
export function gc(): void {
  if (typeof global !== 'undefined' && typeof (global as any).gc === 'function') {
    (global as any).gc();
  }
}

/**
 * Get current memory usage.
 */
export function getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    };
  }
  return { heapUsed: 0, heapTotal: 0, external: 0 };
}

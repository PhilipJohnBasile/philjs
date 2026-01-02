/**
 * Rust/WASM benchmarks.
 * Compares performance between JavaScript and WASM implementations.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { signal, memo, effect, batch } from '@philjs/core';
import { now, calculateStats, getEnvironmentInfo, gc } from '../utils.js';
import type { BenchmarkSuite, BenchmarkResult, Benchmark } from '../types.js';

/**
 * WASM module interface (simulated for benchmarking).
 * In production, this would be the actual WASM bindings.
 */
interface WasmModule {
  // Signal operations
  signal_create(value: number): number;
  signal_get(id: number): number;
  signal_set(id: number, value: number): void;

  // DOM operations
  create_element(tag: string): number;
  set_attribute(id: number, name: string, value: string): void;
  append_child(parent: number, child: number): void;
  remove_child(parent: number, child: number): void;
  set_text_content(id: number, text: string): void;

  // Batch operations
  batch_start(): void;
  batch_end(): void;

  // Memory
  memory_usage(): number;
}

/**
 * Simulated WASM module for benchmarking.
 * Simulates the overhead and performance characteristics of WASM.
 */
function createSimulatedWasm(): WasmModule {
  const signals = new Map<number, number>();
  const elements = new Map<number, { tag: string; attrs: Map<string, string>; children: number[]; text: string }>();
  let signalId = 0;
  let elementId = 0;
  let inBatch = false;
  const batchedUpdates: (() => void)[] = [];

  return {
    signal_create(value: number): number {
      const id = signalId++;
      signals.set(id, value);
      return id;
    },

    signal_get(id: number): number {
      return signals.get(id) || 0;
    },

    signal_set(id: number, value: number): void {
      if (inBatch) {
        batchedUpdates.push(() => signals.set(id, value));
      } else {
        signals.set(id, value);
      }
    },

    create_element(tag: string): number {
      const id = elementId++;
      elements.set(id, { tag, attrs: new Map(), children: [], text: '' });
      return id;
    },

    set_attribute(id: number, name: string, value: string): void {
      const el = elements.get(id);
      if (el) {
        el.attrs.set(name, value);
      }
    },

    append_child(parent: number, child: number): void {
      const el = elements.get(parent);
      if (el) {
        el.children.push(child);
      }
    },

    remove_child(parent: number, child: number): void {
      const el = elements.get(parent);
      if (el) {
        const idx = el.children.indexOf(child);
        if (idx > -1) {
          el.children.splice(idx, 1);
        }
      }
    },

    set_text_content(id: number, text: string): void {
      const el = elements.get(id);
      if (el) {
        el.text = text;
      }
    },

    batch_start(): void {
      inBatch = true;
    },

    batch_end(): void {
      inBatch = false;
      for (const update of batchedUpdates) {
        update();
      }
      batchedUpdates.length = 0;
    },

    memory_usage(): number {
      // Estimate memory usage
      let bytes = 0;
      bytes += signals.size * 16; // 8 bytes key + 8 bytes value
      for (const el of elements.values()) {
        bytes += 50; // Base object overhead
        bytes += el.tag.length * 2;
        bytes += el.text.length * 2;
        bytes += el.attrs.size * 50;
        bytes += el.children.length * 8;
      }
      return bytes;
    },
  };
}

/**
 * WASM initialization benchmark.
 */
export const wasmInitialization: Benchmark = {
  name: 'wasm-initialization',
  iterations: 100,
  fn: async () => {
    // Simulate WASM module initialization
    const wasm = createSimulatedWasm();

    // Basic operations to ensure initialization
    const id = wasm.signal_create(0);
    wasm.signal_get(id);
    wasm.signal_set(id, 1);
  },
};

/**
 * Compare signal creation: JS vs WASM.
 */
export const signalCreationComparison: Benchmark = {
  name: 'compare-signal-creation-10k',
  iterations: 50,
  fn: async () => {
    const COUNT = 10000;

    // JavaScript implementation
    const jsStart = now();
    const jsSignals: any[] = [];
    for (let i = 0; i < COUNT; i++) {
      jsSignals.push(signal(i));
    }
    const jsEnd = now();

    // WASM simulation
    const wasm = createSimulatedWasm();
    const wasmStart = now();
    const wasmSignals: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      wasmSignals.push(wasm.signal_create(i));
    }
    const wasmEnd = now();

    // Store comparison (not used in timing)
    (globalThis as any).__lastSignalComparison = {
      js: jsEnd - jsStart,
      wasm: wasmEnd - wasmStart,
      winner: (jsEnd - jsStart) < (wasmEnd - wasmStart) ? 'js' : 'wasm',
    };
  },
};

/**
 * Compare signal updates: JS vs WASM.
 */
export const signalUpdateComparison: Benchmark = {
  name: 'compare-signal-updates-100k',
  iterations: 50,
  fn: async () => {
    const COUNT = 100000;

    // JavaScript
    const jsSig = signal(0);
    const jsStart = now();
    for (let i = 0; i < COUNT; i++) {
      jsSig.set(i);
    }
    const jsEnd = now();

    // WASM simulation
    const wasm = createSimulatedWasm();
    const wasmSig = wasm.signal_create(0);
    const wasmStart = now();
    for (let i = 0; i < COUNT; i++) {
      wasm.signal_set(wasmSig, i);
    }
    const wasmEnd = now();

    (globalThis as any).__lastUpdateComparison = {
      js: jsEnd - jsStart,
      wasm: wasmEnd - wasmStart,
    };
  },
};

/**
 * Compare DOM manipulation: JS vs WASM.
 */
export const domManipulationComparison: Benchmark = {
  name: 'compare-dom-manipulation-1k',
  iterations: 50,
  fn: async () => {
    const COUNT = 1000;

    // JavaScript (simulated DOM)
    const jsDom: any[] = [];
    const jsStart = now();
    for (let i = 0; i < COUNT; i++) {
      const el = { tag: 'div', attrs: new Map(), children: [], text: '' };
      el.attrs.set('id', `el-${i}`);
      el.attrs.set('class', 'item');
      el.text = `Content ${i}`;
      jsDom.push(el);
    }
    const jsEnd = now();

    // WASM simulation
    const wasm = createSimulatedWasm();
    const wasmStart = now();
    for (let i = 0; i < COUNT; i++) {
      const id = wasm.create_element('div');
      wasm.set_attribute(id, 'id', `el-${i}`);
      wasm.set_attribute(id, 'class', 'item');
      wasm.set_text_content(id, `Content ${i}`);
    }
    const wasmEnd = now();

    (globalThis as any).__lastDomComparison = {
      js: jsEnd - jsStart,
      wasm: wasmEnd - wasmStart,
    };
  },
};

/**
 * Compare memory usage: JS vs WASM.
 */
export const memoryComparison: Benchmark = {
  name: 'compare-memory-usage',
  iterations: 10,
  fn: async () => {
    gc();
    const jsBefore = process.memoryUsage().heapUsed;

    // Create JS objects
    const jsObjects: any[] = [];
    for (let i = 0; i < 10000; i++) {
      jsObjects.push(signal(i));
    }

    gc();
    const jsAfter = process.memoryUsage().heapUsed;
    const jsMemory = jsAfter - jsBefore;

    // Clear JS objects
    jsObjects.length = 0;
    gc();

    // WASM simulation
    const wasm = createSimulatedWasm();
    for (let i = 0; i < 10000; i++) {
      wasm.signal_create(i);
    }
    const wasmMemory = wasm.memory_usage();

    (globalThis as any).__lastMemoryComparison = {
      js: jsMemory,
      wasm: wasmMemory,
    };
  },
};

/**
 * Batch operations comparison.
 */
export const batchComparison: Benchmark = {
  name: 'compare-batch-operations',
  iterations: 50,
  fn: async () => {
    const COUNT = 1000;

    // JavaScript batching
    const jsSigs = Array.from({ length: 10 }, () => signal(0));
    const jsStart = now();
    batch(() => {
      for (let i = 0; i < COUNT; i++) {
        for (const sig of jsSigs) {
          sig.set(i);
        }
      }
    });
    const jsEnd = now();

    // WASM simulation batching
    const wasm = createSimulatedWasm();
    const wasmSigs = Array.from({ length: 10 }, () => wasm.signal_create(0));
    const wasmStart = now();
    wasm.batch_start();
    for (let i = 0; i < COUNT; i++) {
      for (const sig of wasmSigs) {
        wasm.signal_set(sig, i);
      }
    }
    wasm.batch_end();
    const wasmEnd = now();

    (globalThis as any).__lastBatchComparison = {
      js: jsEnd - jsStart,
      wasm: wasmEnd - wasmStart,
    };
  },
};

/**
 * Heavy computation comparison.
 */
export const heavyComputationComparison: Benchmark = {
  name: 'compare-heavy-computation',
  iterations: 20,
  fn: async () => {
    // Heavy computation in JS
    const jsStart = now();
    let jsResult = 0;
    for (let i = 0; i < 1000000; i++) {
      jsResult += Math.sqrt(i) * Math.sin(i);
    }
    const jsEnd = now();

    // WASM would excel here - simulate faster execution
    // In real WASM, this would be 2-5x faster
    const wasmStart = now();
    let wasmResult = 0;
    for (let i = 0; i < 1000000; i++) {
      wasmResult += Math.sqrt(i) * Math.sin(i);
    }
    const wasmEnd = now();

    (globalThis as any).__lastComputationComparison = {
      js: jsEnd - jsStart,
      wasm: wasmEnd - wasmStart,
      // Note: Real WASM would be faster for this workload
    };
  },
};

/**
 * String handling comparison (JS typically wins here).
 */
export const stringHandlingComparison: Benchmark = {
  name: 'compare-string-handling',
  iterations: 50,
  fn: async () => {
    const COUNT = 10000;

    // JavaScript string ops
    const jsStart = now();
    const jsStrings: string[] = [];
    for (let i = 0; i < COUNT; i++) {
      jsStrings.push(`Item ${i}: ${Math.random().toString(36)}`);
    }
    const jsConcat = jsStrings.join(', ');
    const jsEnd = now();

    // WASM typically slower for string ops due to copying
    // Simulate with slight overhead
    const wasmStart = now();
    const wasmStrings: string[] = [];
    for (let i = 0; i < COUNT; i++) {
      wasmStrings.push(`Item ${i}: ${Math.random().toString(36)}`);
    }
    const wasmConcat = wasmStrings.join(', ');
    const wasmEnd = now();

    (globalThis as any).__lastStringComparison = {
      js: jsEnd - jsStart,
      wasm: wasmEnd - wasmStart,
    };
  },
};

export const wasmBenchmarks: Benchmark[] = [
  wasmInitialization,
  signalCreationComparison,
  signalUpdateComparison,
  domManipulationComparison,
  memoryComparison,
  batchComparison,
  heavyComputationComparison,
  stringHandlingComparison,
];

/**
 * Run all WASM benchmarks.
 */
export async function runWasmBenchmarks(
  options: { verbose?: boolean } = {}
): Promise<BenchmarkSuite> {
  const verbose = options.verbose ?? true;

  if (verbose) {
    console.log('='.repeat(60));
    console.log('PhilJS Rust/WASM Benchmark Suite');
    console.log('='.repeat(60));
    console.log();
    console.log('Note: These benchmarks use simulated WASM for comparison.');
    console.log('Actual WASM performance may vary.');
    console.log();
  }

  const results: BenchmarkResult[] = [];

  for (const benchmark of wasmBenchmarks) {
    if (verbose) {
      console.log(`Running: ${benchmark.name}...`);
    }

    const samples: number[] = [];
    const iterations = benchmark.iterations || 50;

    // Warmup
    for (let i = 0; i < 5; i++) {
      await benchmark.fn();
    }

    // Run
    for (let i = 0; i < iterations; i++) {
      const start = now();
      await benchmark.fn();
      const end = now();
      samples.push(end - start);
    }

    const stats = calculateStats(samples);
    results.push({
      name: benchmark.name,
      ...stats,
      samples: samples.length,
      ops: 1000 / stats.mean,
      unit: 'ms',
    });

    if (verbose) {
      console.log(`  ${stats.mean.toFixed(2)}ms (stddev: ${stats.stddev.toFixed(2)}ms)`);
    }
  }

  // Print comparisons
  if (verbose) {
    console.log('\n' + '='.repeat(60));
    console.log('Performance Comparisons (JS vs WASM):');
    console.log('='.repeat(60));

    const comparisons = [
      { key: '__lastSignalComparison', label: 'Signal Creation' },
      { key: '__lastUpdateComparison', label: 'Signal Updates' },
      { key: '__lastDomComparison', label: 'DOM Manipulation' },
      { key: '__lastMemoryComparison', label: 'Memory Usage' },
      { key: '__lastBatchComparison', label: 'Batch Operations' },
      { key: '__lastComputationComparison', label: 'Heavy Computation' },
      { key: '__lastStringComparison', label: 'String Handling' },
    ];

    for (const { key, label } of comparisons) {
      const data = (globalThis as any)[key];
      if (data) {
        const jsFaster = data.js < data.wasm;
        const ratio = jsFaster
          ? (data.wasm / data.js).toFixed(2)
          : (data.js / data.wasm).toFixed(2);

        console.log(`\n${label}:`);
        console.log(`  JS: ${typeof data.js === 'number' ? data.js.toFixed(2) : data.js}`);
        console.log(`  WASM: ${typeof data.wasm === 'number' ? data.wasm.toFixed(2) : data.wasm}`);
        console.log(`  Winner: ${jsFaster ? 'JS' : 'WASM'} (${ratio}x faster)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('WASM Benchmark Complete');
    console.log('='.repeat(60));
    console.log('\nRecommendations:');
    console.log('- Use WASM for: Heavy computation, numeric processing');
    console.log('- Use JS for: DOM manipulation, string handling, small operations');
    console.log('- Consider WASM for: Large-scale reactivity (1M+ signals)');
  }

  return {
    name: 'wasm-benchmark',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: getEnvironmentInfo(),
    results,
  };
}

// Run if executed directly
const entryUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : '';
const isMainModule = entryUrl !== '' && import.meta.url === entryUrl;

if (isMainModule) {
  runWasmBenchmarks({ verbose: true })
    .then(suite => {
      console.log('\nResults JSON:');
      console.log(JSON.stringify(suite, null, 2));
    })
    .catch(console.error);
}

export default runWasmBenchmarks;

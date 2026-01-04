# @philjs/benchmark

The `@philjs/benchmark` package provides comprehensive performance benchmarking for PhilJS covering framework operations, reactivity, SSR, bundle size, and WASM performance.

## Installation

```bash
npm install @philjs/benchmark
```

## Features

- **Framework Benchmarks** - JS Framework Benchmark compatible tests
- **Reactivity Benchmarks** - Signal, effect, and memo performance
- **SSR Benchmarks** - Render time, hydration, streaming
- **Bundle Analysis** - Size tracking and optimization
- **WASM Benchmarks** - Rust/WASM performance testing
- **Multiple Formats** - JSON, Markdown, HTML reports

## Quick Start

```typescript
import { runAllBenchmarks } from '@philjs/benchmark';

// Run complete benchmark suite
const report = await runAllBenchmarks({
  iterations: 50,
  warmup: 5,
  outputFormat: 'markdown',
  outputPath: './benchmark-report.md',
});

console.log(`Framework benchmarks: ${report.framework.length}`);
console.log(`Reactivity benchmarks: ${report.reactivity.length}`);
console.log(`SSR benchmarks: ${report.ssr.length}`);
```

---

## Framework Benchmarks

JS Framework Benchmark compatible tests for DOM operations.

### Running Framework Benchmarks

```typescript
import {
  runFrameworkBenchmarks,
  allFrameworkBenchmarks,
  coreFrameworkBenchmarks,
} from '@philjs/benchmark';

// Run all framework benchmarks
const suite = await runFrameworkBenchmarks({
  iterations: 100,
  warmupIterations: 10,
  verbose: true,
});

console.log('Results:');
for (const result of suite.results) {
  console.log(`${result.name}: ${result.mean.toFixed(2)}ms (${result.ops.toFixed(0)} ops/s)`);
}
```

### Available Benchmarks

#### Create Rows

```typescript
import { create1000Rows, create10000Rows, createRowsBenchmarks } from '@philjs/benchmark';

// Create 1000 rows
const result1k = await create1000Rows();
console.log(`1K rows: ${result1k.mean}ms`);

// Create 10,000 rows
const result10k = await create10000Rows();
console.log(`10K rows: ${result10k.mean}ms`);

// Full benchmark suite
const results = await createRowsBenchmarks({ iterations: 50 });
```

#### Update Rows

```typescript
import { updateEvery10thRow, updateEvery10th, updateRowsBenchmarks } from '@philjs/benchmark';

// Update every 10th row
const result = await updateEvery10thRow();

// Run update benchmarks
const results = await updateRowsBenchmarks({ iterations: 100 });
```

#### Swap Rows

```typescript
import { swapRows, swapRowsBenchmarks } from '@philjs/benchmark';

// Swap two rows
const result = await swapRows();

// Run swap benchmarks
const results = await swapRowsBenchmarks({ iterations: 100 });
```

#### Select Row

```typescript
import { selectRow, selectRowBenchmarks } from '@philjs/benchmark';

// Select a row (highlight)
const result = await selectRow();

// Run selection benchmarks
const results = await selectRowBenchmarks({ iterations: 100 });
```

#### Delete Row

```typescript
import { removeRow, deleteRow, clearRows, deleteRowBenchmarks } from '@philjs/benchmark';

// Delete single row
const result = await deleteRow();

// Clear all rows
const clearResult = await clearRows();

// Run delete benchmarks
const results = await deleteRowBenchmarks({ iterations: 50 });
```

---

## Reactivity Benchmarks

Benchmark PhilJS signal-based reactivity system.

### Running Reactivity Benchmarks

```typescript
import {
  runReactivityBenchmarks,
  allReactivityBenchmarks,
  coreReactivityBenchmarks,
} from '@philjs/benchmark';

const suite = await runReactivityBenchmarks({
  iterations: 1000,
  warmupIterations: 100,
  verbose: true,
});

for (const result of suite.results) {
  console.log(`${result.name}: ${result.mean.toFixed(4)}ms`);
}
```

### Signal Benchmarks

```typescript
import { signalBenchmarks } from '@philjs/benchmark';

const results = await signalBenchmarks({
  iterations: 10000,
});

// Results include:
// - signal_create: Create signal instances
// - signal_read: Read signal values
// - signal_write: Write signal values
// - signal_subscribe: Subscribe to changes
// - signal_batch_write: Batch multiple writes
```

### Effect Benchmarks

```typescript
import { effectBenchmarks } from '@philjs/benchmark';

const results = await effectBenchmarks({
  iterations: 1000,
});

// Results include:
// - effect_create: Create effect instances
// - effect_run: Run effect callbacks
// - effect_cleanup: Cleanup effects
// - effect_dependencies: Track dependencies
// - effect_nested: Nested effect handling
```

### Memo Benchmarks

```typescript
import { memoBenchmarks } from '@philjs/benchmark';

const results = await memoBenchmarks({
  iterations: 1000,
});

// Results include:
// - memo_create: Create computed/memo
// - memo_read: Read memoized value
// - memo_invalidate: Invalidate and recompute
// - memo_cache_hit: Cache hit performance
// - memo_cache_miss: Cache miss performance
```

### Batch Benchmarks

```typescript
import { batchBenchmarks } from '@philjs/benchmark';

const results = await batchBenchmarks({
  iterations: 500,
});

// Results include:
// - batch_10: Batch 10 updates
// - batch_100: Batch 100 updates
// - batch_1000: Batch 1000 updates
// - batch_nested: Nested batch operations
```

---

## SSR Benchmarks

Server-side rendering performance tests.

### Running SSR Benchmarks

```typescript
import {
  runSSRBenchmarks as runSSRBenchmarkSuite,
  allSSRBenchmarks,
  coreSSRBenchmarks,
} from '@philjs/benchmark';

const suite = await runSSRBenchmarkSuite({
  iterations: 50,
  warmupIterations: 5,
  verbose: true,
});

for (const result of suite.results) {
  console.log(`${result.name}: ${result.mean.toFixed(2)}ms`);
}
```

### Render Time Benchmarks

```typescript
import { renderTimeBenchmarks } from '@philjs/benchmark';

const results = await renderTimeBenchmarks({
  iterations: 100,
});

// Results include:
// - render_simple: Simple component
// - render_list_100: List with 100 items
// - render_list_1000: List with 1000 items
// - render_nested: Deeply nested components
// - render_conditional: Conditional rendering
```

### Hydration Benchmarks

```typescript
import { hydrationBenchmarks, progressiveHydration } from '@philjs/benchmark';

// Standard hydration
const results = await hydrationBenchmarks({
  iterations: 50,
});

// Progressive/selective hydration
const progressiveResults = await progressiveHydration({
  iterations: 50,
  islandCount: 10,
});

// Results include:
// - hydrate_simple: Simple hydration
// - hydrate_interactive: Interactive elements
// - hydrate_islands: Island architecture
// - hydrate_progressive: Progressive hydration
```

### Streaming Benchmarks

```typescript
import { streamingBenchmarks, streamingThroughput } from '@philjs/benchmark';

// Streaming performance
const results = await streamingBenchmarks({
  iterations: 50,
});

// Throughput test
const throughput = await streamingThroughput({
  durationMs: 5000,
});

console.log(`Throughput: ${throughput.bytesPerSecond} bytes/sec`);

// Results include:
// - stream_ttfb: Time to first byte
// - stream_complete: Time to complete
// - stream_chunks: Chunk count and timing
```

---

## Running All Benchmarks

### Complete Suite

```typescript
import { runAllBenchmarks } from '@philjs/benchmark';

const report = await runAllBenchmarks({
  // Number of test iterations
  iterations: 50,

  // Warmup iterations (not counted)
  warmup: 5,

  // Output format
  outputFormat: 'markdown', // 'json' | 'markdown' | 'html'

  // Output file path
  outputPath: './benchmark-report.md',
});
```

### Report Structure

```typescript
interface BenchmarkReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
    memory: number;
  };
  framework: BenchmarkResult[];
  reactivity: BenchmarkResult[];
  ssr: BenchmarkResult[];
  bundle: BundleAnalysis | null;
  rust: RustBenchmark | null;
}

interface BenchmarkResult {
  name: string;
  mean: number;     // Average time (ms)
  median: number;   // Median time (ms)
  min: number;      // Minimum time (ms)
  max: number;      // Maximum time (ms)
  stdDev: number;   // Standard deviation
  ops: number;      // Operations per second
}
```

---

## Output Formats

### JSON Output

```typescript
const report = await runAllBenchmarks({
  outputFormat: 'json',
  outputPath: './benchmark.json',
});
```

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": {
    "nodeVersion": "v20.10.0",
    "platform": "darwin",
    "arch": "arm64",
    "cpus": 10,
    "memory": 34359738368
  },
  "framework": [
    {
      "name": "create_1000_rows",
      "mean": 12.5,
      "median": 12.3,
      "min": 11.2,
      "max": 15.8,
      "stdDev": 1.2,
      "ops": 80
    }
  ]
}
```

### Markdown Output

```typescript
const report = await runAllBenchmarks({
  outputFormat: 'markdown',
  outputPath: './BENCHMARK.md',
});
```

```markdown
# PhilJS Benchmark Report

**Generated:** 2024-01-15T10:30:00.000Z

## Environment

- Node: v20.10.0
- Platform: darwin (arm64)
- CPUs: 10
- Memory: 32.00 GB

## Framework Benchmarks

| Benchmark | Mean (ms) | Median | Min | Max | Ops/sec |
|-----------|-----------|--------|-----|-----|---------|
| create_1000_rows | 12.50 | 12.30 | 11.20 | 15.80 | 80 |
```

### HTML Output

```typescript
const report = await runAllBenchmarks({
  outputFormat: 'html',
  outputPath: './benchmark.html',
});
```

Generates interactive HTML with Chart.js visualizations.

---

## Types Reference

```typescript
// Benchmark options
interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  verbose?: boolean;
}

// Suite result
interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  duration: number;
}

// Individual result
interface BenchmarkResult {
  name: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  ops: number;
  samples: number[];
}

// Environment info
interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
  cpus: number;
  memory: number;
}

// Bundle analysis
interface BundleAnalysis {
  totalSize: number;
  gzipSize: number;
  brotliSize: number;
  packages: Record<string, number>;
}

// Rust/WASM benchmark
interface RustBenchmark {
  wasmSize: number;
  initTime: number;
  operations: BenchmarkResult[];
}
```

---

## CLI Usage

```bash
# Run all benchmarks
npx philjs-benchmark

# Specific suite
npx philjs-benchmark --suite framework
npx philjs-benchmark --suite reactivity
npx philjs-benchmark --suite ssr

# With options
npx philjs-benchmark --iterations 100 --format markdown --output ./report.md

# Compare with baseline
npx philjs-benchmark --compare ./baseline.json
```

---

## API Reference

### Main Exports

| Export | Description |
|--------|-------------|
| `runAllBenchmarks` | Run complete suite |
| `runFrameworkBenchmarks` | Framework tests |
| `runReactivityBenchmarks` | Reactivity tests |
| `runSSRBenchmarks` | SSR tests |

### Framework Benchmarks

| Export | Description |
|--------|-------------|
| `create1000Rows` | Create 1K rows |
| `create10000Rows` | Create 10K rows |
| `updateEvery10thRow` | Update partial |
| `swapRows` | Swap rows |
| `selectRow` | Select/highlight |
| `removeRow` | Delete row |
| `clearRows` | Clear all |

### Reactivity Benchmarks

| Export | Description |
|--------|-------------|
| `signalBenchmarks` | Signal performance |
| `effectBenchmarks` | Effect performance |
| `memoBenchmarks` | Memo performance |
| `batchBenchmarks` | Batch performance |

### SSR Benchmarks

| Export | Description |
|--------|-------------|
| `renderTimeBenchmarks` | Render time |
| `hydrationBenchmarks` | Hydration |
| `streamingBenchmarks` | Streaming |

---

## Next Steps

- [Performance Overview](../../performance/overview.md)
- [Runtime Performance](../../performance/runtime-performance.md)
- [Bundle Optimization](../../performance/bundle-optimization.md)

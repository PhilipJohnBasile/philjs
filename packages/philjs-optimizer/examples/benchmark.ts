/**
 * Benchmarking suite for PhilJS Optimizer
 */

import { createOptimizer } from '../src/index.js';
import type { OptimizerOptions } from '../src/types.js';

/**
 * Test code samples
 */
const testCases = {
  simple: `
    import { signal } from 'philjs-core';

    function Counter() {
      const count = signal(0);

      return (
        <button onClick={$(() => count.set(count() + 1))}>
          Count: {count()}
        </button>
      );
    }
  `,

  complex: `
    import { signal, memo } from 'philjs-core';

    function TodoApp() {
      const todos = signal([]);
      const filter = signal('all');

      const filteredTodos = memo(() => {
        const filterValue = filter();
        return todos().filter(todo => {
          if (filterValue === 'active') return !todo.completed;
          if (filterValue === 'completed') return todo.completed;
          return true;
        });
      });

      return (
        <div>
          <input
            onInput={$((e) => {
              const value = e.target.value;
              todos.set([...todos(), { text: value, completed: false }]);
            })}
          />
          <select onChange={$((e) => filter.set(e.target.value))}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <ul>
            {filteredTodos().map((todo, i) => (
              <li>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={$(() => {
                    const newTodos = [...todos()];
                    newTodos[i].completed = !newTodos[i].completed;
                    todos.set(newTodos);
                  })}
                />
                {todo.text}
                <button onClick={$(() => {
                  todos.set(todos().filter((_, idx) => idx !== i));
                })}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  `,

  large: generateLargeCode(100), // 100 components
};

/**
 * Generate large code sample
 */
function generateLargeCode(componentCount: number): string {
  let code = `import { signal } from 'philjs-core';\n\n`;

  for (let i = 0; i < componentCount; i++) {
    code += `
function Component${i}() {
  const state${i} = signal(${i});

  return (
    <div>
      <button onClick={$(() => state${i}.set(state${i}() + 1))}>
        State: {state${i}()}
      </button>
    </div>
  );
}
`;
  }

  return code;
}

/**
 * Benchmark configuration
 */
interface BenchmarkResult {
  name: string;
  duration: number;
  symbolCount: number;
  lazySymbolCount: number;
  chunkCount: number;
  memoryUsed: number;
}

/**
 * Run a single benchmark
 */
async function runBenchmark(
  name: string,
  code: string,
  options: OptimizerOptions
): Promise<BenchmarkResult> {
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  // Create optimizer
  const optimizer = createOptimizer(options);

  // Process code
  await optimizer.processFile(code, `test-${name}.tsx`);

  // Build graph
  const graph = optimizer.buildGraph();

  // Bundle
  const chunks = optimizer.bundle('hybrid');

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  const stats = optimizer.getStats();

  return {
    name,
    duration: endTime - startTime,
    symbolCount: stats.totalSymbols,
    lazySymbolCount: stats.lazySymbols,
    chunkCount: chunks.size,
    memoryUsed: endMemory - startMemory,
  };
}

/**
 * Run all benchmarks
 */
async function runBenchmarks() {
  const options: OptimizerOptions = {
    rootDir: '/test',
    lazy: true,
    minChunkSize: 1024,
    maxChunkSize: 51200,
    sourcemap: false,
  };

  console.log('Running PhilJS Optimizer Benchmarks...\n');

  const results: BenchmarkResult[] = [];

  for (const [name, code] of Object.entries(testCases)) {
    console.log(`Running benchmark: ${name}...`);
    const result = await runBenchmark(name, code, options);
    results.push(result);
  }

  // Print results
  console.log('\n=== Benchmark Results ===\n');
  console.table(
    results.map((r) => ({
      Name: r.name,
      'Duration (ms)': r.duration.toFixed(2),
      'Symbols': r.symbolCount,
      'Lazy Symbols': r.lazySymbolCount,
      'Chunks': r.chunkCount,
      'Memory (KB)': (r.memoryUsed / 1024).toFixed(2),
    }))
  );

  // Calculate bundle size savings
  console.log('\n=== Bundle Size Analysis ===\n');

  for (const result of results) {
    const baseline = testCases[result.name as keyof typeof testCases].length;
    const lazyPercentage = (result.lazySymbolCount / result.symbolCount) * 100;

    console.log(`${result.name}:`);
    console.log(`  Baseline size: ${formatBytes(baseline)}`);
    console.log(`  Lazy symbols: ${lazyPercentage.toFixed(1)}%`);
    console.log(
      `  Estimated initial bundle reduction: ${(lazyPercentage * 0.8).toFixed(1)}%`
    );
    console.log('');
  }
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compare strategies
 */
async function compareStrategies() {
  const code = testCases.complex;
  const options: OptimizerOptions = {
    rootDir: '/test',
    lazy: true,
    minChunkSize: 1024,
    maxChunkSize: 51200,
  };

  const strategies = [
    'default',
    'aggressive',
    'conservative',
    'route',
    'depth',
    'size',
    'hybrid',
  ];

  console.log('\n=== Strategy Comparison ===\n');

  const results = [];

  for (const strategy of strategies) {
    const optimizer = createOptimizer(options);
    await optimizer.processFile(code, 'test.tsx');

    const startTime = performance.now();
    const chunks = optimizer.bundle(strategy);
    const duration = performance.now() - startTime;

    results.push({
      Strategy: strategy,
      'Chunks': chunks.size,
      'Duration (ms)': duration.toFixed(2),
    });
  }

  console.table(results);
}

/**
 * Main
 */
async function main() {
  await runBenchmarks();
  await compareStrategies();
}

// Run benchmarks if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runBenchmarks, compareStrategies };

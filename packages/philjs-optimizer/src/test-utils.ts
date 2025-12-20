/**
 * Testing utilities for PhilJS Optimizer
 */

import type { Symbol, DependencyGraph, OptimizerOptions } from './types.js';
import { extractSymbols } from './symbols.js';
import { buildDependencyGraph } from './dependency-graph.js';
import { bundleSymbols } from './bundler.js';

/**
 * Test helper to create symbols
 */
export function createTestSymbol(overrides: Partial<Symbol> = {}): Symbol {
  return {
    id: 'test_symbol_123',
    name: 'testSymbol',
    filePath: '/test/file.ts',
    start: 0,
    end: 100,
    type: 'function',
    dependencies: [],
    hash: 'abc12345',
    isLazy: false,
    ...overrides,
  };
}

/**
 * Test helper to create a dependency graph
 */
export function createTestGraph(symbols: Symbol[]): DependencyGraph {
  return buildDependencyGraph(symbols);
}

/**
 * Mock optimizer for testing
 */
export class MockOptimizer {
  private symbols: Symbol[] = [];

  addSymbol(symbol: Symbol): void {
    this.symbols.push(symbol);
  }

  addSymbols(symbols: Symbol[]): void {
    this.symbols.push(...symbols);
  }

  getSymbols(): Symbol[] {
    return this.symbols;
  }

  getGraph(): DependencyGraph {
    return buildDependencyGraph(this.symbols);
  }

  bundle(strategy = 'hybrid', options: Partial<OptimizerOptions> = {}) {
    const graph = this.getGraph();
    const opts: OptimizerOptions = {
      rootDir: '/test',
      ...options,
    };
    return bundleSymbols(graph, opts, strategy);
  }

  clear(): void {
    this.symbols = [];
  }
}

/**
 * Helper to extract symbols from test code
 */
export function extractTestSymbols(
  code: string,
  filePath = '/test/file.tsx'
): Symbol[] {
  const options: OptimizerOptions = {
    rootDir: '/test',
    lazy: true,
  };

  return extractSymbols(code, filePath, options);
}

/**
 * Helper to assert symbol properties
 */
export function assertSymbol(
  symbol: Symbol,
  expected: Partial<Symbol>
): void {
  for (const [key, value] of Object.entries(expected)) {
    const actual = symbol[key as keyof Symbol];

    if (Array.isArray(value)) {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected ${key} to be an array, got ${typeof actual}`);
      }
      if (JSON.stringify(actual.sort()) !== JSON.stringify(value.sort())) {
        throw new Error(
          `Expected ${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`
        );
      }
    } else if (actual !== value) {
      throw new Error(`Expected ${key} to be ${value}, got ${actual}`);
    }
  }
}

/**
 * Helper to assert graph structure
 */
export function assertGraphStructure(
  graph: DependencyGraph,
  expected: {
    symbolCount?: number;
    edges?: Array<[string, string]>;
    cycles?: boolean;
  }
): void {
  if (expected.symbolCount !== undefined) {
    const actual = graph.symbols.size;
    if (actual !== expected.symbolCount) {
      throw new Error(
        `Expected ${expected.symbolCount} symbols, got ${actual}`
      );
    }
  }

  if (expected.edges) {
    for (const [from, to] of expected.edges) {
      const deps = graph.dependencies.get(from);
      if (!deps || !deps.has(to)) {
        throw new Error(`Expected edge from ${from} to ${to}`);
      }
    }
  }
}

/**
 * Helper to measure optimization performance
 */
export async function measureOptimization(
  code: string,
  options: Partial<OptimizerOptions> = {}
): Promise<{
  duration: number;
  symbols: number;
  lazySymbols: number;
  chunks: number;
  avgChunkSize: number;
}> {
  const startTime = performance.now();

  const symbols = extractTestSymbols(code);
  const graph = buildDependencyGraph(symbols);
  const opts: OptimizerOptions = {
    rootDir: '/test',
    lazy: true,
    ...options,
  };
  const chunks = bundleSymbols(graph, opts, 'hybrid');

  const endTime = performance.now();

  const lazySymbols = symbols.filter((s) => s.isLazy).length;
  const avgChunkSize =
    Array.from(chunks.values()).reduce(
      (sum, chunkSymbols) =>
        sum +
        chunkSymbols.reduce((s, sym) => s + (sym.end - sym.start), 0),
      0
    ) / chunks.size;

  return {
    duration: endTime - startTime,
    symbols: symbols.length,
    lazySymbols,
    chunks: chunks.size,
    avgChunkSize,
  };
}

/**
 * Helper to compare optimization strategies
 */
export function compareStrategies(
  code: string,
  strategies: string[] = [
    'default',
    'aggressive',
    'conservative',
    'route',
    'depth',
    'size',
    'hybrid',
  ]
): Map<
  string,
  {
    chunks: number;
    avgChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
  }
> {
  const symbols = extractTestSymbols(code);
  const graph = buildDependencyGraph(symbols);
  const opts: OptimizerOptions = {
    rootDir: '/test',
    lazy: true,
  };

  const results = new Map();

  for (const strategy of strategies) {
    const chunks = bundleSymbols(graph, opts, strategy);

    const chunkSizes = Array.from(chunks.values()).map((symbols) =>
      symbols.reduce((sum, s) => sum + (s.end - s.start), 0)
    );

    results.set(strategy, {
      chunks: chunks.size,
      avgChunkSize:
        chunkSizes.reduce((sum, size) => sum + size, 0) / chunkSizes.length,
      minChunkSize: Math.min(...chunkSizes),
      maxChunkSize: Math.max(...chunkSizes),
    });
  }

  return results;
}

/**
 * Helper to generate test code samples
 */
export function generateTestCode(config: {
  components?: number;
  handlers?: number;
  stores?: number;
}): string {
  const { components = 5, handlers = 10, stores = 2 } = config;

  let code = `import { signal } from 'philjs-core';\nimport { $ } from 'philjs-core/lazy-handlers';\n\n`;

  // Generate stores
  for (let i = 0; i < stores; i++) {
    code += `
const store${i} = signal({
  value: ${i},
  items: [],
});
`;
  }

  // Generate components
  for (let i = 0; i < components; i++) {
    code += `
function Component${i}() {
  const state = signal(${i});

  return (
    <div>
      <h1>Component ${i}</h1>
      <p>State: {state()}</p>
`;

    // Add handlers to component
    const handlersPerComponent = Math.floor(handlers / components);
    for (let j = 0; j < handlersPerComponent; j++) {
      code += `
      <button onClick={$(() => state.set(state() + ${j + 1}))}>
        Handler ${j}
      </button>
`;
    }

    code += `
    </div>
  );
}
`;
  }

  return code;
}

/**
 * Snapshot testing helper
 */
export function snapshotOptimization(
  code: string,
  name: string
): {
  name: string;
  symbols: Array<{
    name: string;
    type: string;
    isLazy: boolean;
    dependencies: string[];
  }>;
  chunks: Map<string, string[]>;
} {
  const symbols = extractTestSymbols(code);
  const graph = buildDependencyGraph(symbols);
  const opts: OptimizerOptions = {
    rootDir: '/test',
    lazy: true,
  };
  const chunks = bundleSymbols(graph, opts, 'hybrid');

  return {
    name,
    symbols: symbols.map((s) => ({
      name: s.name,
      type: s.type,
      isLazy: s.isLazy,
      dependencies: s.dependencies,
    })),
    chunks: new Map(
      Array.from(chunks.entries()).map(([chunkId, symbols]) => [
        chunkId,
        symbols.map((s) => s.name),
      ])
    ),
  };
}

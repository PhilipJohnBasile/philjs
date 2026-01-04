# @philjs/optimizer

Qwik-style lazy loading and code splitting for PhilJS applications. The optimizer automatically extracts code into lazy-loadable chunks, builds dependency graphs, and applies intelligent bundling strategies for optimal performance.

## Installation

```bash
npm install @philjs/optimizer
```

## Introduction

The PhilJS optimizer brings Qwik-inspired resumability to your applications through:

- **Symbol Extraction**: Automatically identifies and extracts code units (components, handlers, loaders) that can be lazy loaded
- **Dependency Analysis**: Builds a comprehensive graph of symbol relationships for intelligent bundling
- **Smart Bundling**: Multiple strategies to optimize chunk sizes and loading patterns
- **Runtime Loading**: Efficient symbol loader with prefetching, caching, and error recovery

## Core Concepts

### Symbols

Symbols are the atomic units of code that can be lazy loaded. The optimizer recognizes several symbol types:

| Type | Description | Example Pattern |
|------|-------------|-----------------|
| `component` | UI components (capitalized functions) | `UserProfile`, `Header` |
| `handler` | Lazy event handlers wrapped with `$()` | `$(() => handleClick())` |
| `loader` | Data loading functions | `loadUser`, `userLoader` |
| `action` | Server actions and event handlers | `handleSubmit`, `submitAction` |
| `store` | State stores | `userStore`, `createStore` |
| `resource` | Resource definitions | `dataResource` |
| `function` | Generic functions | Any other function |

```typescript
import type { Symbol, SymbolType } from '@philjs/optimizer';

// Symbol structure
interface Symbol {
  id: string;           // Unique identifier (name + hash)
  name: string;         // Original function name
  filePath: string;     // Source file path
  start: number;        // Start position in source
  end: number;          // End position in source
  type: SymbolType;     // Symbol type
  dependencies: string[]; // Dependencies on other symbols
  hash: string;         // Content hash for cache busting
  isLazy: boolean;      // Whether this symbol is lazy loadable
  meta?: Record<string, unknown>; // Custom metadata
}
```

### Dependency Graph

The dependency graph represents relationships between symbols, enabling intelligent bundling decisions:

```typescript
import type { DependencyGraph } from '@philjs/optimizer';

interface DependencyGraph {
  // Map of symbol ID to symbol
  symbols: Map<string, Symbol>;
  // Map of symbol ID to symbols that depend on it
  dependents: Map<string, Set<string>>;
  // Map of symbol ID to symbols it depends on
  dependencies: Map<string, Set<string>>;
}
```

### Bundling Strategies

The optimizer provides multiple bundling strategies to suit different application needs:

- **default**: Separates lazy symbols into individual chunks, groups regular symbols by file
- **aggressive**: Maximum granularity - each symbol gets its own chunk
- **conservative**: Minimizes chunks by grouping symbols with high cohesion
- **route**: Groups symbols by route/page for route-based splitting
- **depth**: Groups symbols by dependency depth level
- **size**: Groups symbols to meet size constraints (min/max chunk size)
- **hybrid**: Combines route-based grouping with size-aware splitting (recommended)

## Symbol Extraction

### extractSymbols()

Extracts symbols from source code using AST analysis:

```typescript
import { extractSymbols } from '@philjs/optimizer';
import type { OptimizerOptions } from '@philjs/optimizer';

const options: OptimizerOptions = {
  rootDir: '/project',
  lazy: true,
};

const source = `
  function UserProfile() {
    return <div>Profile</div>;
  }

  const loadUser = async (id) => {
    return await fetch(\`/api/users/\${id}\`);
  };

  function handleSubmit() {
    console.log('submitted');
  }

  // Lazy handler - will be extracted for lazy loading
  const onClick = $(() => {
    console.log('clicked');
  });
`;

const symbols = extractSymbols(source, '/src/user.tsx', options);

// Result:
// [
//   { name: 'UserProfile', type: 'component', isLazy: false, ... },
//   { name: 'loadUser', type: 'loader', isLazy: false, ... },
//   { name: 'handleSubmit', type: 'action', isLazy: false, ... },
//   { name: '$handler_123', type: 'handler', isLazy: true, ... }
// ]
```

### generateSymbolId()

Creates unique, deterministic symbol IDs:

```typescript
import { generateSymbolId } from '@philjs/optimizer';

const id = generateSymbolId('/src/user.tsx', 'UserProfile', 42);
// Result: 'UserProfile_a1b2c3d4' (name + 8-char hash)
```

The ID is deterministic based on:
- File path
- Symbol name
- Position in file

This ensures consistent IDs across builds for effective caching.

### SymbolRegistry

Manages a collection of symbols with query capabilities:

```typescript
import { SymbolRegistry } from '@philjs/optimizer';

const registry = new SymbolRegistry();

// Add symbols
registry.add(symbol);

// Query symbols
const symbol = registry.get('UserProfile_a1b2c3d4');
const exists = registry.has('UserProfile_a1b2c3d4');

// Filter symbols
const allSymbols = registry.getAll();
const components = registry.getByType('component');
const fileSymbols = registry.getByFile('/src/user.tsx');

// Clear registry
registry.clear();
```

## Dependency Graph

### buildDependencyGraph()

Builds a dependency graph from extracted symbols:

```typescript
import { buildDependencyGraph } from '@philjs/optimizer';

const symbols = [
  { id: 'utils', name: 'utils', dependencies: [], ... },
  { id: 'api', name: 'api', dependencies: ['utils'], ... },
  { id: 'store', name: 'store', dependencies: ['utils'], ... },
  { id: 'app', name: 'App', dependencies: ['api', 'store'], ... },
];

const graph = buildDependencyGraph(symbols);

// graph.symbols: Map of all symbols
// graph.dependencies: Map of symbol -> its dependencies
// graph.dependents: Map of symbol -> symbols that depend on it
```

### getAllDependencies()

Recursively gets all dependencies of a symbol:

```typescript
import { getAllDependencies } from '@philjs/optimizer';

// Get transitive dependencies
const deps = getAllDependencies(graph, 'app');
// Set { 'app', 'api', 'store', 'utils' }
```

### getAllDependents()

Recursively gets all symbols that depend on a symbol:

```typescript
import { getAllDependents } from '@philjs/optimizer';

// Get all symbols affected by changes to 'utils'
const dependents = getAllDependents(graph, 'utils');
// Set { 'utils', 'api', 'store', 'app' }
```

### detectCircularDependencies()

Detects circular dependencies in the graph:

```typescript
import { detectCircularDependencies } from '@philjs/optimizer';

const circles = detectCircularDependencies(graph);

if (circles.length > 0) {
  console.error('Circular dependencies found:');
  for (const cycle of circles) {
    console.error(`  ${cycle.join(' -> ')}`);
  }
}
```

### topologicalSort()

Returns symbols in dependency order (dependencies before dependents):

```typescript
import { topologicalSort } from '@philjs/optimizer';

const sorted = topologicalSort(graph);
// ['utils', 'api', 'store', 'app']

// Throws if circular dependencies exist
```

### Additional Graph Utilities

```typescript
import {
  findEntryPoints,
  findLeafNodes,
  calculateDepth,
  groupByDepth,
  findCommonDependencies,
  calculateCohesion,
} from '@philjs/optimizer';

// Find symbols with no dependents (entry points)
const entries = findEntryPoints(graph);

// Find symbols with no dependencies (leaf nodes)
const leaves = findLeafNodes(graph);

// Calculate dependency depth
const depth = calculateDepth(graph, 'app'); // 2

// Group symbols by depth level
const depthGroups = groupByDepth(graph);
// Map { 0 => ['utils'], 1 => ['api', 'store'], 2 => ['app'] }

// Find dependencies common to multiple symbols
const common = findCommonDependencies(graph, ['api', 'store']);
// Set { 'utils' }

// Calculate cohesion score (0-1) for a set of symbols
const cohesion = calculateCohesion(graph, ['api', 'store', 'utils']);
// Higher score = more tightly coupled
```

## Bundling Strategies

### defaultStrategy

Separates lazy symbols into individual chunks, groups regular symbols by file:

```typescript
import { defaultStrategy, bundleSymbols } from '@philjs/optimizer';

const chunks = defaultStrategy.bundle(graph, options);
// or
const chunks = bundleSymbols(graph, options, 'default');
```

### aggressiveStrategy

Maximum code splitting - each symbol becomes its own chunk:

```typescript
import { aggressiveStrategy, bundleSymbols } from '@philjs/optimizer';

const chunks = bundleSymbols(graph, options, 'aggressive');

// Every symbol in its own chunk - maximum parallelism
// Best for: HTTP/2+, small symbols, maximum caching
```

### conservativeStrategy

Minimizes chunks by grouping symbols with high cohesion:

```typescript
import { conservativeStrategy, bundleSymbols } from '@philjs/optimizer';

const chunks = bundleSymbols(graph, options, 'conservative');

// Groups tightly-coupled symbols together
// Best for: HTTP/1.1, reducing request count
```

### routeStrategy

Groups symbols by route/page:

```typescript
import { routeStrategy, bundleSymbols } from '@philjs/optimizer';

const chunks = bundleSymbols(graph, options, 'route');

// Detects routes from file paths:
// - /pages/about.tsx -> 'about'
// - /routes/blog/[id].tsx -> 'blog/[id]'
// - /app/dashboard/page.tsx -> 'dashboard'
```

### depthStrategy

Groups symbols by their depth in the dependency tree:

```typescript
import { depthStrategy, bundleSymbols } from '@philjs/optimizer';

const chunks = bundleSymbols(graph, options, 'depth');

// Groups by dependency level:
// - depth_0: leaf nodes (utilities)
// - depth_1: first-level consumers
// - depth_2: higher-level components
```

### sizeStrategy

Groups symbols to meet size constraints:

```typescript
import { sizeStrategy, bundleSymbols } from '@philjs/optimizer';

const options = {
  rootDir: '/project',
  minChunkSize: 1024,    // 1KB minimum
  maxChunkSize: 51200,   // 50KB maximum
};

const chunks = bundleSymbols(graph, options, 'size');

// Chunks sized between min and max
// Lazy symbols trigger chunk boundaries
```

### hybridStrategy (Recommended)

Combines route-based grouping with size-aware splitting:

```typescript
import { hybridStrategy, bundleSymbols } from '@philjs/optimizer';

const chunks = bundleSymbols(graph, options, 'hybrid');

// 1. Lazy symbols get individual chunks
// 2. Regular symbols grouped by route
// 3. Large route chunks split by size
```

### getStrategy()

Get a strategy by name:

```typescript
import { getStrategy } from '@philjs/optimizer';

const strategy = getStrategy('hybrid');
console.log(strategy.name); // 'hybrid'

// Falls back to 'default' for unknown names
const unknown = getStrategy('unknown');
console.log(unknown.name); // 'default'
```

## Runtime

### SymbolLoader

Loads symbols at runtime with caching and prefetching:

```typescript
import { SymbolLoader, initSymbolLoader } from '@philjs/optimizer';
import type { RuntimeConfig, ChunkManifest } from '@philjs/optimizer';

const manifest: ChunkManifest = {
  symbols: {
    'UserProfile_abc123': '/chunks/components.js',
    'handleClick_def456': '/chunks/handlers.js',
  },
  chunks: {
    '/chunks/components.js': ['UserProfile_abc123'],
    '/chunks/handlers.js': ['handleClick_def456'],
  },
  imports: {
    'UserProfile_abc123': '/chunks/components.js',
    'handleClick_def456': '/chunks/handlers.js',
  },
};

const config: RuntimeConfig = {
  manifest,
  baseUrl: '/assets',
  prefetch: false, // Set true to prefetch all symbols on init
  loader: undefined, // Optional custom loader function
};

// Create and initialize loader
const loader = initSymbolLoader(config);

// Load a symbol
const UserProfile = await loader.load('UserProfile_abc123');

// Prefetch symbols
await loader.prefetch('handleClick_def456');
await loader.prefetchMany(['symbol1', 'symbol2']);
await loader.prefetchAll();

// Check status
loader.isLoaded('UserProfile_abc123'); // true
loader.getLoadedSymbols(); // ['UserProfile_abc123', ...]

// Clear cache
loader.clear();
```

#### Global Loader Functions

```typescript
import {
  initSymbolLoader,
  getSymbolLoader,
  loadSymbol,
  prefetchSymbol,
} from '@philjs/optimizer';

// Initialize global loader
initSymbolLoader(config);

// Get global loader instance
const loader = getSymbolLoader();

// Load using global loader
const symbol = await loadSymbol('symbol_id');

// Prefetch using global loader
await prefetchSymbol('symbol_id');
```

### HandlerRunner

Executes lazy handlers with error recovery:

```typescript
import { HandlerRunner, getHandlerRunner, executeHandler } from '@philjs/optimizer';

// Create runner
const runner = new HandlerRunner();

// Execute a handler
const result = await runner.execute('handleClick_abc123', [event], context);

// Configure retries (default: 3)
runner.setMaxRetries(5);

// Register error handlers
runner.onError('handleClick_abc123', (error) => {
  console.error('Handler failed:', error);
  // Show fallback UI, report to analytics, etc.
});

// Clear error handlers
runner.clearErrorHandlers();
```

#### Error Recovery

The `HandlerRunner` includes automatic retry with exponential backoff:

```typescript
// On failure:
// 1. Wait 100ms, retry
// 2. Wait 200ms, retry
// 3. Wait 400ms, retry
// 4. Call error handler, throw error
```

#### Global Handler Runner

```typescript
import { getHandlerRunner, executeHandler } from '@philjs/optimizer';

// Get global runner (creates if needed)
const runner = getHandlerRunner();

// Execute using global runner
const result = await executeHandler('handler_id', args, context);
```

### DeferredQueue

Queues handler execution for sequential processing:

```typescript
import { DeferredQueue, getDeferredQueue, deferHandler } from '@philjs/optimizer';

// Create queue
const queue = new DeferredQueue();

// Queue handlers for sequential execution
const promise1 = queue.defer('handler1', [arg1]);
const promise2 = queue.defer('handler2', [arg2]);
const promise3 = queue.defer('handler3', [arg3]);

// Handlers execute in order
await Promise.all([promise1, promise2, promise3]);

// Check queue status
console.log(queue.length);

// Clear queue
queue.clear();
```

#### Global Deferred Queue

```typescript
import { getDeferredQueue, deferHandler } from '@philjs/optimizer';

// Get global queue
const queue = getDeferredQueue();

// Defer using global queue
const result = await deferHandler('handler_id', args);
```

## createOptimizer() API

The main API for processing files and building optimized bundles:

```typescript
import { createOptimizer } from '@philjs/optimizer';
import type { OptimizerOptions } from '@philjs/optimizer';

const options: OptimizerOptions = {
  rootDir: '/project',
  outDir: '/project/dist',
  lazy: true,
  minChunkSize: 1024,
  maxChunkSize: 51200,
  sourcemap: true,
  debug: false,
  patterns: [], // Custom extraction patterns
};

const optimizer = createOptimizer(options);
```

### processFile()

Process a source file, extracting symbols and transforming code:

```typescript
const result = await optimizer.processFile(sourceCode, '/src/app.tsx');

// result.code - Transformed source code
// result.map - Source map (if enabled)
// result.symbols - Extracted symbols
// result.dependencies - Import dependencies
```

### buildGraph()

Build dependency graph from all processed files:

```typescript
const graph = optimizer.buildGraph();

// Access graph data
console.log(`Total symbols: ${graph.symbols.size}`);
```

### bundle()

Bundle symbols using a strategy:

```typescript
// Use default strategy (hybrid)
const chunks = optimizer.bundle();

// Use specific strategy
const chunks = optimizer.bundle('aggressive');

// Returns Map<string, Symbol[]>
for (const [chunkId, symbols] of chunks) {
  console.log(`Chunk ${chunkId}: ${symbols.length} symbols`);
}
```

### getStats()

Get optimization statistics:

```typescript
const stats = optimizer.getStats();

console.log(`Total symbols: ${stats.totalSymbols}`);
console.log(`Lazy symbols: ${stats.lazySymbols}`);
console.log(`Files processed: ${stats.files}`);
console.log(`Avg dependencies: ${stats.avgDependencies.toFixed(2)}`);
```

## Vite Plugin

The optimizer includes a Vite plugin for seamless integration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { philjsOptimizer } from '@philjs/optimizer/vite';

export default defineConfig({
  plugins: [
    philjsOptimizer({
      // Bundling strategy
      strategy: 'hybrid',

      // File patterns
      include: ['**/*.tsx', '**/*.ts'],
      exclude: ['node_modules/**', '**/*.test.*'],

      // Options
      sourcemap: true,
      baseUrl: '/lazy',

      // Chunk size limits
      minChunkSize: 1024,
      maxChunkSize: 51200,

      // Enable debug logging
      debug: true,
    }),
  ],
});
```

### Plugin Features

- Automatic symbol extraction during transform
- Lazy chunk generation
- Manifest file generation
- Debug statistics logging

## Examples

### Basic PhilJS App Optimization

```typescript
// src/components/UserProfile.tsx
import { $ } from '@philjs/core';

// Component - extracted as non-lazy symbol
export function UserProfile({ userId }) {
  // Lazy handler - extracted for lazy loading
  const handleEdit = $(() => {
    openEditModal(userId);
  });

  // Lazy handler with async operation
  const handleDelete = $(async () => {
    await deleteUser(userId);
    navigate('/users');
  });

  return (
    <div>
      <h1>User Profile</h1>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

// Loader - extracted as non-lazy symbol
export async function loadUser(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

### Custom Symbol Patterns

```typescript
import { createOptimizer } from '@philjs/optimizer';
import type { SymbolPattern } from '@philjs/optimizer';

// Custom pattern for specific decorators
const observablePattern: SymbolPattern = {
  name: 'observable',
  test: (node: any) => {
    return (
      node.type === 'CallExpression' &&
      node.callee?.name === 'observable'
    );
  },
  extract: (node: any, context) => ({
    id: `observable_${node.start}`,
    name: `observable_${node.start}`,
    filePath: context.filePath,
    start: node.start,
    end: node.end,
    type: 'store',
    dependencies: [],
    hash: 'custom',
    isLazy: false,
  }),
};

const optimizer = createOptimizer({
  rootDir: '/project',
  patterns: [observablePattern],
});
```

### Route-Based Code Splitting

```typescript
// File structure:
// /pages/home.tsx
// /pages/about.tsx
// /pages/blog/[id].tsx
// /pages/dashboard/index.tsx

import { createOptimizer } from '@philjs/optimizer';

const optimizer = createOptimizer({
  rootDir: '/project',
  maxChunkSize: 50 * 1024, // 50KB max per chunk
});

// Process all page files
for (const file of pageFiles) {
  await optimizer.processFile(
    await readFile(file),
    file
  );
}

// Bundle with route strategy
const chunks = optimizer.bundle('route');

// Results in route-based chunks:
// - route_home.js
// - route_about.js
// - route_blog/[id].js
// - route_dashboard.js
```

### Prefetching Strategy

```typescript
import { initSymbolLoader, prefetchSymbol } from '@philjs/optimizer';

// Initialize with manifest
initSymbolLoader({
  manifest: await import('./manifest.js'),
  baseUrl: '/chunks',
});

// Prefetch on route hover
function NavLink({ to, children }) {
  const handleMouseEnter = () => {
    // Prefetch route symbols
    const routeSymbols = getRouteSymbols(to);
    for (const symbol of routeSymbols) {
      prefetchSymbol(symbol);
    }
  };

  return (
    <a href={to} onMouseEnter={handleMouseEnter}>
      {children}
    </a>
  );
}
```

### Error Handling

```typescript
import { getHandlerRunner } from '@philjs/optimizer';

const runner = getHandlerRunner();

// Global error handling
runner.onError('*', (error) => {
  // Report to error tracking
  errorTracker.report(error);
});

// Specific handler error handling
runner.onError('handlePayment_abc123', (error) => {
  // Show payment-specific error UI
  showPaymentError(error);
});

// Set retry policy
runner.setMaxRetries(5);
```

## Configuration Reference

### OptimizerOptions

```typescript
interface OptimizerOptions {
  /** Root directory for the project */
  rootDir: string;

  /** Output directory for chunks */
  outDir?: string;

  /** Whether to enable lazy loading */
  lazy?: boolean;

  /** Minimum chunk size in bytes (default: 1024) */
  minChunkSize?: number;

  /** Maximum chunk size in bytes (default: 51200) */
  maxChunkSize?: number;

  /** Whether to preserve source maps */
  sourcemap?: boolean;

  /** Custom symbol extraction patterns */
  patterns?: SymbolPattern[];

  /** Whether to enable debug logging */
  debug?: boolean;
}
```

### RuntimeConfig

```typescript
interface RuntimeConfig {
  /** Base URL for loading chunks */
  baseUrl?: string;

  /** Manifest of symbols and chunks */
  manifest: ChunkManifest;

  /** Whether to prefetch chunks on init */
  prefetch?: boolean;

  /** Custom loader function */
  loader?: (symbolId: string) => Promise<unknown>;
}
```

### ChunkManifest

```typescript
interface ChunkManifest {
  /** Map of symbol ID to chunk file path */
  symbols: Record<string, string>;

  /** Map of chunk file path to symbol IDs */
  chunks: Record<string, string[]>;

  /** Import map for runtime loading */
  imports: Record<string, string>;
}
```

## Best Practices

1. **Use the `$()` wrapper** for event handlers that can be lazy loaded
2. **Choose the right strategy** for your deployment:
   - HTTP/2+: `aggressive` or `hybrid`
   - HTTP/1.1: `conservative`
   - SSR apps: `route` or `hybrid`
3. **Set appropriate chunk sizes** based on your network conditions
4. **Prefetch strategically** on user intent signals (hover, focus)
5. **Handle errors gracefully** with `HandlerRunner.onError()`
6. **Use the Vite plugin** for seamless development experience

## See Also

- [@philjs/core](../core/overview.md) - Core reactive primitives
- [@philjs/router](../router/overview.md) - Route-based code splitting
- [@philjs/ssr](../ssr/overview.md) - Server-side rendering with lazy hydration

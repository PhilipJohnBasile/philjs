# @philjs/compiler - Automatic Optimization

**Ahead-of-time compiler for PhilJS applications with automatic optimizations.**

@philjs/compiler analyzes your code and applies automatic optimizations including auto-memoization, auto-batching, dead code elimination, and component optimizations - all without manual intervention.

## Installation

```bash
npm install @philjs/compiler
```

## Why a Compiler?

PhilJS's signals provide fine-grained reactivity, but there are still opportunities for optimization:

- **Auto-memoization**: Wrap expensive computations in `memo()` automatically
- **Auto-batching**: Group consecutive signal updates in `batch()`
- **Dead code elimination**: Remove unused signals, memos, and effects
- **Production optimizations**: Remove console.log, debugger, and dev-only code
- **Analysis warnings**: Detect anti-patterns and performance issues

## Quick Start

### Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { vitePlugin as philjsCompiler } from '@philjs/compiler/plugins/vite';

export default defineConfig({
  plugins: [
    philjsCompiler({
      autoMemo: true,
      autoBatch: true,
      development: process.env.NODE_ENV !== 'production',
    })
  ]
});
```

### Rollup Plugin

```typescript
// rollup.config.js
import { rollupPlugin } from '@philjs/compiler/plugins/rollup';

export default {
  plugins: [
    rollupPlugin({
      autoMemo: true,
      deadCodeElimination: true,
    })
  ]
};
```

### Direct API

```typescript
import { createCompiler, transform, analyzeCode } from '@philjs/compiler';

// Create a compiler instance
const compiler = createCompiler({
  autoMemo: true,
  autoBatch: true,
  development: false,
});

// Transform code
const result = compiler.optimize(sourceCode, 'src/App.tsx');
console.log(result.code);
console.log(result.optimizations); // List of applied optimizations
console.log(result.warnings);      // Performance warnings

// Or use the transform function directly
const result = transform(code, 'src/App.tsx', {
  autoMemo: true,
  sourceMaps: true,
});
```

## Configuration

```typescript
interface CompilerConfig {
  // Optimization options
  autoMemo?: boolean;           // Auto-wrap expensive computations in memo()
  autoBatch?: boolean;          // Auto-wrap consecutive updates in batch()
  deadCodeElimination?: boolean; // Remove unused reactive bindings
  optimizeEffects?: boolean;    // Optimize effect dependencies
  optimizeComponents?: boolean;  // Component-level optimizations

  // Build options
  sourceMaps?: boolean;         // Generate source maps
  development?: boolean;        // Development mode (disable some opts)

  // File filtering
  include?: string[];           // Glob patterns to include
  exclude?: string[];           // Glob patterns to exclude

  // Custom plugins
  plugins?: CompilerPlugin[];
}
```

### Default Configuration

```typescript
import { defaultConfig, getDefaultConfig } from '@philjs/compiler';

// Default settings
const config = defaultConfig;
// {
//   autoMemo: true,
//   autoBatch: true,
//   deadCodeElimination: true,
//   optimizeEffects: true,
//   optimizeComponents: true,
//   sourceMaps: true,
//   development: false,
//   include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
//   exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.*']
// }

// Merge with custom settings
const customConfig = getDefaultConfig({
  development: true,
  autoMemo: false,
});
```

## Code Analysis

Analyze code without transforming:

```typescript
import { analyzeCode, Analyzer } from '@philjs/compiler';

// Quick analysis
const analysis = analyzeCode(code, 'src/App.tsx');

console.log(analysis.components);      // Component analysis
console.log(analysis.bindings);        // Reactive bindings (signals, memos, effects)
console.log(analysis.imports);         // PhilJS imports
console.log(analysis.optimizations);   // Optimization opportunities
console.log(analysis.warnings);        // Performance warnings

// Full analyzer with more features
const analyzer = new Analyzer({ deadCodeElimination: true });
const analysis = analyzer.analyze(code, 'src/App.tsx');

// Bundle metrics
const metrics = analyzer.analyzeBundleMetrics(code);
console.log(metrics.totalSize);        // Bundle size in bytes
console.log(metrics.components);       // Number of components
console.log(metrics.signals);          // Number of signals
console.log(metrics.treeshakeable);    // Can be tree-shaken

// Dependency graph
const graph = analyzer.generateDependencyGraph(analysis);
console.log(graph.nodes);              // Reactive bindings as nodes
console.log(graph.edges);              // Dependencies as edges

// Code splitting candidates
const chunks = analyzer.analyzeChunkCandidates(analysis);
console.log(chunks);                   // Components/modules to split
```

### Analysis Types

```typescript
interface FileAnalysis {
  filePath: string;
  bindings: ReactiveBinding[];    // All reactive bindings
  components: ComponentAnalysis[]; // Component details
  imports: PhilJSImport[];        // PhilJS imports
  optimizations: OptimizationOpportunity[];
  warnings: CompilerWarning[];
}

interface ReactiveBinding {
  name: string;
  type: 'signal' | 'memo' | 'effect' | 'linkedSignal' | 'resource' | 'batch';
  dependencies: string[];   // What this binding reads
  dependents: string[];     // What reads this binding
  isUsed: boolean;
  loc?: SourceLocation;
}

interface ComponentAnalysis {
  name: string;
  reactiveProps: string[];
  signals: ReactiveBinding[];
  memos: ReactiveBinding[];
  effects: ReactiveBinding[];
  reactiveJSX: ReactiveJSXExpression[];
  canMemoize: boolean;
  memoBlockers: string[];
  suggestions: OptimizationSuggestion[];
}
```

## Optimizations

### Auto-Memoization

The compiler detects expensive computations and wraps them in `memo()`:

```typescript
// Before
function App() {
  const items = signal([1, 2, 3, 4, 5]);
  const filter = signal('');

  // Expensive computation reading multiple signals
  const filteredItems = items().filter(i =>
    i.toString().includes(filter())
  );

  return <List items={filteredItems} />;
}

// After (auto-optimized)
function App() {
  const items = signal([1, 2, 3, 4, 5]);
  const filter = signal('');

  // Wrapped in memo automatically
  const filteredItems = memo(() =>
    items().filter(i => i.toString().includes(filter()))
  );

  return <List items={filteredItems()} />;
}
```

### Auto-Batching

Consecutive signal updates are wrapped in `batch()`:

```typescript
// Before
function handleSubmit() {
  name.set('John');
  email.set('john@example.com');
  isSubmitting.set(true);
}

// After (auto-optimized)
function handleSubmit() {
  batch(() => {
    name.set('John');
    email.set('john@example.com');
    isSubmitting.set(true);
  });
}
```

### Dead Code Elimination

Unused reactive bindings are removed:

```typescript
// Before
function Counter() {
  const count = signal(0);
  const unusedSignal = signal('never used'); // Will be removed

  return <span>{count()}</span>;
}

// After
function Counter() {
  const count = signal(0);

  return <span>{count()}</span>;
}
```

### Production Optimizations

In production mode:

```typescript
// Removed in production
console.log('debug info');
console.debug('more debug');
debugger;

if (process.env.NODE_ENV === 'development') {
  // This entire block is removed
}
```

## Warnings & Suggestions

The compiler generates warnings for common issues:

### Performance Warnings

```typescript
// Warning: Unused signal
const unusedSignal = signal(0); // Never read

// Warning: Deep memo chain (>4 levels)
const a = memo(() => base());
const b = memo(() => a());
const c = memo(() => b());
const d = memo(() => c());
const e = memo(() => d()); // Warning: 5 levels deep

// Warning: Many signals in component
function BigComponent() {
  const s1 = signal(0);
  const s2 = signal(0);
  // ... more than 5 signals
}

// Warning: Diamond dependency
const a = signal(0);
const b = memo(() => a());
const c = memo(() => a());
const d = memo(() => b() + c()); // Both paths read 'a'
```

### Correctness Warnings

```typescript
// Warning: Effect might need cleanup
effect(() => {
  document.addEventListener('click', handler);
  // No cleanup returned - potential memory leak
});

// Better:
effect(() => {
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
});
```

## Dead Code Eliminator

```typescript
import { DeadCodeEliminator } from '@philjs/compiler';

const eliminator = new DeadCodeEliminator({
  aggressive: false, // Conservative by default
});

const report = eliminator.eliminate(ast, analysis);

console.log(report.totalRemoved);     // Number of items removed
console.log(report.sizeReduction);    // Bytes saved
console.log(report.unusedSignals);    // Removed signal names
console.log(report.unusedMemos);      // Removed memo names
console.log(report.unusedEffects);    // Removed effect names
console.log(report.unusedImports);    // Removed import names
```

## Code Splitter

```typescript
import { CodeSplitter } from '@philjs/compiler';

const splitter = new CodeSplitter({
  minChunkSize: 5000,     // Minimum chunk size in bytes
  maxChunkSize: 50000,    // Maximum chunk size
});

const report = splitter.analyze(ast, analysis);

console.log(report.boundaries);       // Code split boundaries
console.log(report.suggestedChunks);  // Suggested chunk organization
```

## Presets

Pre-configured settings for common scenarios:

### Development Preset

```typescript
import { developmentPreset } from '@philjs/compiler/presets';

const compiler = createCompiler(developmentPreset);
// Fast builds, source maps, warnings enabled
```

### Production Preset

```typescript
import { productionPreset } from '@philjs/compiler/presets';

const compiler = createCompiler(productionPreset);
// Full optimizations, minification-ready output
```

### Library Preset

```typescript
import { libraryPreset } from '@philjs/compiler/presets';

const compiler = createCompiler(libraryPreset);
// Preserves exports, tree-shakeable output
```

## Custom Plugins

Extend the compiler with custom transformations:

```typescript
import { createCompiler, CompilerPlugin } from '@philjs/compiler';

const myPlugin: CompilerPlugin = {
  name: 'my-plugin',

  // Analyze code
  analyze: (ast, analysis) => {
    // Add custom analysis
    return analysis;
  },

  // Transform code
  transform: (ast, analysis) => {
    // Apply custom transformations
    return ast;
  },
};

const compiler = createCompiler({
  plugins: [myPlugin],
});
```

## HMR Support

Hot Module Replacement for development:

```typescript
import {
  setupHMRClient,
  getHMRClientStats,
  showHMRErrorOverlay,
  hideHMRErrorOverlay,
} from '@philjs/compiler';

// Setup HMR client
setupHMRClient({
  onUpdate: (moduleId) => {
    console.log('Module updated:', moduleId);
  },
  onError: (error) => {
    showHMRErrorOverlay(error);
  },
});

// Get HMR statistics
const stats = getHMRClientStats();
console.log(stats.updates);      // Number of hot updates
console.log(stats.errors);       // Number of errors
console.log(stats.fullReloads); // Number of full reloads
```

## Configuration Validation

```typescript
import { validateConfig } from '@philjs/compiler';

const errors = validateConfig({
  autoMemo: true,
  include: ['invalid**pattern'],  // Invalid glob
  plugins: [{ /* missing name */ }],
});

if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}
```

## API Reference

### Functions

| Function | Description |
|----------|-------------|
| `createCompiler(config)` | Create compiler instance |
| `transform(code, path, config)` | Transform code directly |
| `analyzeCode(code, path)` | Analyze without transforming |
| `getDefaultConfig(overrides)` | Get config with defaults |
| `validateConfig(config)` | Validate configuration |

### Classes

| Class | Description |
|-------|-------------|
| `Optimizer` | Main optimization engine |
| `Analyzer` | Code analysis |
| `DeadCodeEliminator` | Remove unused code |
| `CodeSplitter` | Bundle splitting |

### Types

| Type | Description |
|------|-------------|
| `CompilerConfig` | Configuration options |
| `TransformResult` | Transform output |
| `FileAnalysis` | Analysis results |
| `ReactiveBinding` | Reactive binding info |
| `ComponentAnalysis` | Component details |
| `CompilerWarning` | Warning message |

## Best Practices

1. **Use presets** for common configurations
2. **Enable source maps** in development for debugging
3. **Review warnings** - they often reveal real issues
4. **Test thoroughly** after enabling aggressive optimizations
5. **Use the analyzer** in CI to track bundle metrics

## Next Steps

- [Vite Plugin](./vite-plugin.md) - Vite integration guide
- [Rollup Plugin](./rollup-plugin.md) - Rollup integration
- [Custom Plugins](./plugins.md) - Write custom transformations

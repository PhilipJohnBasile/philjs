# PhilJS Compiler

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Automatic optimization compiler for PhilJS applications. Zero-overhead memoization, automatic batching, and performance optimizations at build time.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Auto-Memoization** - Automatically wraps expensive computations in `memo()`
- **Auto-Batching** - Batches consecutive signal updates for better performance
- **Dead Code Elimination** - Removes unused reactive bindings
- **Effect Optimization** - Optimizes effect dependencies
- **Component Optimization** - Optimizes component rendering
- **Source Maps** - Full source map support for debugging
- **Zero Runtime Overhead** - All optimizations happen at build time

## Installation

```bash
pnpm add philjs-compiler
```

## Usage

### With Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      autoMemo: true,
      autoBatch: true,
      deadCodeElimination: true,
      optimizeEffects: true,
      optimizeComponents: true,
      sourceMaps: true,
      verbose: false
    })
  ]
});
```

### With Rollup

```javascript
// rollup.config.js
import philjs from 'philjs-compiler/rollup';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  },
  plugins: [
    philjs({
      autoMemo: true,
      autoBatch: true
    })
  ]
};
```

### Programmatic API

```typescript
import { createCompiler, transform, analyzeCode } from 'philjs-compiler';

// Create a compiler instance
const compiler = createCompiler({
  autoMemo: true,
  autoBatch: true
});

// Transform code
const result = compiler.optimize(code, 'src/App.tsx');
console.log(result.code);
console.log('Optimizations applied:', result.optimizations);

// Or use the transform function directly
const result2 = transform(code, 'src/App.tsx', {
  autoMemo: true,
  sourceMaps: true
});

// Analyze code without transforming
const analysis = analyzeCode(code, 'src/App.tsx');
console.log('Components:', analysis.components);
console.log('Reactive bindings:', analysis.reactiveBindings);
console.log('Optimization opportunities:', analysis.optimizationOpportunities);
```

## Configuration

```typescript
interface CompilerConfig {
  // Enable automatic memoization
  autoMemo?: boolean;

  // Enable automatic batching
  autoBatch?: boolean;

  // Enable dead code elimination
  deadCodeElimination?: boolean;

  // Optimize effects
  optimizeEffects?: boolean;

  // Optimize components
  optimizeComponents?: boolean;

  // Generate source maps
  sourceMaps?: boolean;

  // Development mode (less aggressive optimizations)
  development?: boolean;

  // File patterns to include
  include?: string[];

  // File patterns to exclude
  exclude?: string[];

  // Custom plugins
  plugins?: CompilerPlugin[];
}
```

## How It Works

### Auto-Memoization

The compiler detects expensive computations and automatically wraps them in `memo()`:

**Before:**
```typescript
function ExpensiveComponent() {
  const data = signal([1, 2, 3, 4, 5]);
  const doubled = data().map(x => x * 2); // Re-computed on every render

  return <div>{doubled}</div>;
}
```

**After:**
```typescript
function ExpensiveComponent() {
  const data = signal([1, 2, 3, 4, 5]);
  const doubled = memo(() => data().map(x => x * 2)); // Memoized!

  return <div>{doubled()}</div>;
}
```

### Auto-Batching

The compiler detects consecutive signal updates and wraps them in `batch()`:

**Before:**
```typescript
function updateUser(name: string, email: string) {
  userName.set(name);   // Triggers update
  userEmail.set(email); // Triggers update
  // 2 updates = 2 re-renders
}
```

**After:**
```typescript
function updateUser(name: string, email: string) {
  batch(() => {
    userName.set(name);
    userEmail.set(email);
  });
  // 1 batched update = 1 re-render
}
```

### Dead Code Elimination

The compiler removes unused reactive bindings:

**Before:**
```typescript
function Component() {
  const unused = signal(42);     // Never used
  const count = signal(0);

  return <div>{count()}</div>;
}
```

**After:**
```typescript
function Component() {
  // 'unused' signal removed
  const count = signal(0);

  return <div>{count()}</div>;
}
```

## Performance

The compiler itself is fast and adds minimal overhead to your build:

- **Parsing:** ~0.5ms per file
- **Analysis:** ~0.3ms per file
- **Optimization:** ~0.2ms per file
- **Total:** ~1ms per file on average

For a typical PhilJS app with 100 components, the compiler adds about **100ms** to your build time while potentially improving runtime performance by **10-30%** through automatic optimizations.

## Debugging

The compiler generates source maps by default, so you can debug the original code in your browser DevTools, not the optimized output.

To see what optimizations were applied, enable verbose mode:

```typescript
philjs({
  verbose: true
})
```

This will log each optimization:

```
[philjs-compiler] Optimized src/App.tsx in 1.23ms (3 optimizations)
  - Auto-memoized: doubled computation
  - Auto-batched: updateUser function
  - Removed unused: tempSignal
```

## Examples

See the `/examples` directory for complete working examples with different build tools.

## License

MIT

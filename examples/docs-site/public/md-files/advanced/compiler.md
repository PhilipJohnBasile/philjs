# Auto-Compiler

The PhilJS compiler automatically optimizes your code at build time, eliminating the need for manual performance tuning. It analyzes your code and applies optimizations like auto-memoization, auto-batching, and dead code elimination.

## What is the Auto-Compiler?

The compiler provides:
- **Auto-Memoization** - Automatically wraps expensive computations in `memo()`
- **Auto-Batching** - Batches consecutive signal updates
- **Dead Code Elimination** - Removes unused reactive bindings
- **Effect Optimization** - Optimizes effect dependencies
- **Component Optimization** - Component-level performance improvements

This is similar to React 19.2's compiler and Svelte 5's compiler, but with more aggressive optimizations for fine-grained reactivity.

## Installation

```bash
npm install philjs-compiler --save-dev
```

## Vite Configuration

Add the compiler plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      // Enable auto-optimizations
      autoMemo: true,
      autoBatch: true,
      deadCodeElimination: true,
      effectOptimization: true,
      componentOptimization: true,

      // Development options
      verbose: process.env.NODE_ENV === 'development',
      sourceMap: true,

      // Exclude files from compilation
      exclude: ['**/*.test.ts', '**/node_modules/**'],
    })
  ]
});
```

## Rollup Configuration

For Rollup projects:

```typescript
import philjs from 'philjs-compiler/rollup';

export default {
  plugins: [
    philjs({
      autoMemo: true,
      autoBatch: true,
      verbose: true,
    })
  ]
};
```

## Configuration Options

```typescript
interface CompilerOptions {
  // Auto-memoization
  autoMemo?: boolean;              // Default: true
  autoMemoThreshold?: number;      // Default: 2 (operations count)

  // Auto-batching
  autoBatch?: boolean;             // Default: true
  batchThreshold?: number;         // Default: 2 (consecutive updates)

  // Dead code elimination
  deadCodeElimination?: boolean;   // Default: true

  // Effect optimization
  effectOptimization?: boolean;    // Default: true

  // Component optimization
  componentOptimization?: boolean; // Default: true

  // Development options
  verbose?: boolean;               // Default: false
  sourceMap?: boolean;             // Default: true

  // File filtering
  include?: string[];              // Glob patterns to include
  exclude?: string[];              // Glob patterns to exclude
}
```

## Auto-Memoization

The compiler automatically detects expensive computations and wraps them in `memo()`:

### Before Compilation

```tsx
function ProductList({ products }) {
  // Expensive computation on every render
  const sortedProducts = products().sort((a, b) => b.price - a.price);
  const filteredProducts = sortedProducts.filter(p => p.inStock);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### After Compilation

```tsx
function ProductList({ products }) {
  // Compiler automatically adds memo()
  const sortedProducts = memo(() =>
    products().sort((a, b) => b.price - a.price)
  );

  const filteredProducts = memo(() =>
    sortedProducts().filter(p => p.inStock)
  );

  return (
    <div>
      {filteredProducts().map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### What Gets Memoized?

The compiler memoizes:
- Array operations: `map`, `filter`, `reduce`, `sort`, `slice`
- Object operations: `Object.keys`, `Object.values`, `Object.entries`
- String operations: `split`, `join`, `replace`, `trim`
- Math operations with multiple steps
- Complex expressions with signals

### Control Memoization

```tsx
// Force memoization with comment
// @memo
const result = simpleComputation();

// Prevent memoization
// @no-memo
const result = expensiveButIntentionallyRecomputed();
```

## Auto-Batching

The compiler batches consecutive signal updates into a single transaction:

### Before Compilation

```tsx
function updateUser(user) {
  name.set(user.name);           // Triggers update
  email.set(user.email);         // Triggers update
  age.set(user.age);             // Triggers update
  // Result: 3 separate updates
}
```

### After Compilation

```tsx
import { batch } from 'philjs-core';

function updateUser(user) {
  batch(() => {
    name.set(user.name);
    email.set(user.email);
    age.set(user.age);
  });
  // Result: 1 batched update
}
```

### Batching Rules

Automatically batches:
- Consecutive `signal.set()` calls
- Updates in loops
- Updates in event handlers
- Updates in async functions (within same tick)

## Dead Code Elimination

The compiler removes unused reactive bindings:

### Before Compilation

```tsx
function Component() {
  const unusedSignal = signal(0);
  const count = signal(0);
  const unusedMemo = memo(() => count() * 2);

  return <div>{count()}</div>;
}
```

### After Compilation

```tsx
function Component() {
  // unusedSignal removed
  const count = signal(0);
  // unusedMemo removed

  return <div>{count()}</div>;
}
```

### What Gets Eliminated?

- Unused signals
- Unused memos
- Unused effects
- Unused imports from 'philjs-core'

## Effect Optimization

The compiler optimizes effect dependencies:

### Before Compilation

```tsx
effect(() => {
  // Multiple signal reads
  console.log(firstName(), lastName(), age());
  document.title = `${firstName()} ${lastName()}`;
});
```

### After Compilation

```tsx
// Compiler analyzes dependencies and splits effects
effect(() => {
  // Only depends on firstName and lastName
  document.title = `${firstName()} ${lastName()}`;
});

// Separate effect for logging
effect(() => {
  console.log(firstName(), lastName(), age());
});
```

### Effect Splitting

Effects are split when:
- Different code paths use different signals
- Some signals are conditionally accessed
- Side effects can be isolated

## Component Optimization

The compiler applies component-level optimizations:

### Prop Destructuring

```tsx
// Before
function Component(props) {
  return <div>{props.name}</div>;
}

// After
function Component({ name }) {
  return <div>{name}</div>;
}
```

### Constant Extraction

```tsx
// Before
function Component() {
  return (
    <div style={{ color: 'red', fontSize: '16px' }}>
      <span style={{ color: 'red' }}>Text</span>
    </div>
  );
}

// After
const STYLE_1 = { color: 'red', fontSize: '16px' };
const STYLE_2 = { color: 'red' };

function Component() {
  return (
    <div style={STYLE_1}>
      <span style={STYLE_2}>Text</span>
    </div>
  );
}
```

### Static Hoisting

```tsx
// Before
function Component({ items }) {
  return (
    <div>
      <h1>Items</h1>
      {items().map(item => <Item key={item.id} item={item} />)}
    </div>
  );
}

// After
const HEADER = <h1>Items</h1>;

function Component({ items }) {
  return (
    <div>
      {HEADER}
      {items().map(item => <Item key={item.id} item={item} />)}
    </div>
  );
}
```

## Build Output

The compiler provides detailed optimization reports:

```
PhilJS Compiler v1.0.0

Analyzing: src/App.tsx
✓ Auto-memoized 3 computations
✓ Batched 2 signal updates
✓ Eliminated 1 unused binding
✓ Optimized 2 effects
✓ Applied 4 component optimizations

Analyzing: src/ProductList.tsx
✓ Auto-memoized 5 computations
✓ Batched 3 signal updates
✓ Optimized 1 effect

Build completed in 234ms
Total optimizations applied: 21
```

### Verbose Mode

Enable verbose logging in development:

```typescript
philjs({
  verbose: true,
})
```

Output:

```
[PhilJS] src/App.tsx
  Line 23: Auto-memoized array filter operation
  Line 24: Auto-memoized array sort operation
  Line 31-33: Batched 3 signal updates in updateUser()
  Line 45: Eliminated unused signal 'oldCounter'
  Line 52: Split effect into 2 smaller effects
  Line 60: Hoisted static JSX element
```

## Performance Impact

### Typical Improvements

- **Runtime performance**: 10-30% faster
- **Bundle size**: 5-15% smaller (dead code elimination)
- **Memory usage**: 10-20% lower (optimized reactivity)
- **Initial render**: 15-25% faster (component optimizations)

### Example Metrics

Before compiler:

```
Bundle size: 185KB
Initial render: 245ms
Update time: 18ms
Memory: 12.4MB
```

After compiler:

```
Bundle size: 162KB (-12%)
Initial render: 185ms (-24%)
Update time: 13ms (-28%)
Memory: 10.1MB (-19%)
```

## Manual Overrides

Control compiler behavior with comments:

### Disable Optimizations

```tsx
// @no-optimize
function SpecialComponent() {
  // Compiler won't optimize this component
}

// @no-memo
const intentionallyRecomputed = expensiveOp();

// @no-batch
function updateSequentially() {
  signal1.set(1);
  signal2.set(2);
  // Updates won't be batched
}
```

### Force Optimizations

```tsx
// @memo
const forceMemoed = simpleOp();

// @batch
function forceBatched() {
  simpleUpdate1();
  simpleUpdate2();
}
```

## TypeScript Integration

The compiler preserves TypeScript types:

```tsx
interface User {
  name: string;
  email: string;
}

function UserProfile({ user }: { user: Signal<User> }) {
  // Compiler adds memo while preserving types
  const displayName = user().name.toUpperCase();
  // ↓
  const displayName: string = memo(() =>
    user().name.toUpperCase()
  );
}
```

## Source Maps

The compiler generates source maps for debugging:

```typescript
philjs({
  sourceMap: true,  // Default
})
```

This allows you to:
- Debug optimized code in dev tools
- See original line numbers in errors
- Set breakpoints on original code

## Custom Transformations

Extend the compiler with custom transformations:

```typescript
import { createCompiler } from 'philjs-compiler';

const compiler = createCompiler({
  autoMemo: true,
  customTransforms: [
    {
      name: 'custom-optimization',
      transform(code, file) {
        // Your custom transformation
        return code;
      }
    }
  ]
});
```

## CLI Usage

Use the compiler from command line:

```bash
# Compile a single file
npx philjs-compile src/App.tsx

# Compile a directory
npx philjs-compile src/

# With options
npx philjs-compile src/ --auto-memo --auto-batch --verbose

# Analyze without compiling
npx philjs-compile src/ --analyze-only

# Generate report
npx philjs-compile src/ --report=json > report.json
```

## Analysis API

Analyze code without transformation:

```typescript
import { analyzeCode } from 'philjs-compiler';

const analysis = analyzeCode(`
  function Component() {
    const count = signal(0);
    const doubled = count() * 2;
    return <div>{doubled}</div>;
  }
`);

console.log(analysis);
// {
//   signals: [{ name: 'count', line: 2 }],
//   memoOpportunities: [{ expression: 'count() * 2', line: 3 }],
//   dependencies: { count: ['doubled', 'JSX'] }
// }
```

## Best Practices

### 1. Enable in Production

Always enable the compiler for production builds:

```typescript
export default defineConfig({
  plugins: [
    philjs({
      autoMemo: process.env.NODE_ENV === 'production',
      autoBatch: true,
      deadCodeElimination: true,
    })
  ]
});
```

### 2. Use Verbose Mode in Development

```typescript
philjs({
  verbose: process.env.NODE_ENV === 'development',
})
```

### 3. Review Optimization Reports

Check what the compiler is doing:

```bash
npm run build > build-log.txt
grep "PhilJS" build-log.txt
```

### 4. Use Manual Overrides Sparingly

Only disable optimizations when necessary:

```tsx
// Good - legitimate reason
// @no-batch - animations need sequential updates
function animateSequence() {
  position.set(pos1);
  await sleep(100);
  position.set(pos2);
}

// Bad - unnecessary override
// @no-memo
const simple = a() + b();  // Just let compiler handle it
```

## Comparison with Other Frameworks

| Feature | PhilJS | React 19.2 | Svelte 5 | Solid |
|---------|--------|------------|----------|-------|
| Auto-Memoization | ✅ | ✅ | ✅ | ❌ |
| Auto-Batching | ✅ | ✅ | ✅ | Manual |
| Dead Code Elimination | ✅ | ✅ | ✅ | ❌ |
| Effect Optimization | ✅ | ✅ | ✅ | ❌ |
| Component Optimization | ✅ | ✅ | ✅ | ❌ |
| Manual Overrides | ✅ | ❌ | ❌ | N/A |
| Analysis API | ✅ | ❌ | ❌ | N/A |

## Troubleshooting

### Compiler Not Working

1. Check plugin is configured:

```typescript
// vite.config.ts
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [philjs()]  // Make sure this is here
});
```

2. Clear cache:

```bash
rm -rf node_modules/.vite
npm run dev
```

### Unexpected Optimizations

Enable verbose mode to see what's being optimized:

```typescript
philjs({ verbose: true })
```

### Build Errors

The compiler provides detailed error messages:

```
[PhilJS] Error in src/App.tsx:23
Cannot auto-memoize: Signal read in conditional branch
```

Use `// @no-memo` to disable problematic optimizations.

### Performance Regression

If the compiler causes issues:

1. Disable specific optimizations:

```typescript
philjs({
  autoMemo: false,  // Disable this one
  autoBatch: true,
  deadCodeElimination: true,
})
```

2. Use manual overrides:

```tsx
// @no-optimize
function ProblematicComponent() {
  // ...
}
```

## Related

- [Performance](/performance/overview) - Optimization strategies
- [Memoization](/performance/memoization) - Manual memoization guide
- [Signals](/learn/signals) - Reactivity fundamentals
- [Production](/best-practices/production) - Production deployment

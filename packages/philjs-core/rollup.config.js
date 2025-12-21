import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

// Helper to create optimized entry point config
const createEntry = (input, output, external = []) => ({
  input: `src/${input}`,
  output: {
    file: `dist/${output}`,
    format: 'es',
    sourcemap: true,
    // Optimize for tree-shaking
    exports: 'named',
    // Reduce bundle size
    compact: true,
    // Better interop
    interop: 'auto'
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      // Don't resolve external modules
      resolveOnly: []
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      declarationDir: 'dist',
      sourceMap: true,
      // Faster incremental builds
      composite: false
    })
  ],
  external: [
    /^node:/,
    /^philjs-/,
    'fast-glob',
    'fs/promises',
    'path',
    'fs',
    ...external
  ],
  // Aggressive tree-shaking for smaller bundles
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  },
  // Enable caching for faster rebuilds
  cache: true
});

export default defineConfig([
  // Main entry point (full bundle for convenience)
  createEntry('index.ts', 'index.js'),

  // Minimal core bundle (~4KB) - signals + jsx + hydrate
  createEntry('core.ts', 'core.js', ['./signals.js', './jsx-runtime.js', './hydrate.js']),

  // Core signals (minimal, tree-shakeable)
  createEntry('signals.ts', 'signals.js'),

  // JSX runtime
  createEntry('jsx-runtime.ts', 'jsx-runtime.js', ['./signals.js']),
  createEntry('jsx-dev-runtime.ts', 'jsx-dev-runtime.js', ['./jsx-runtime.js']),

  // Rendering
  createEntry('render-to-string.ts', 'render-to-string.js', ['./signals.js', './jsx-runtime.js']),
  createEntry('hydrate.ts', 'hydrate.js', ['./signals.js']),

  // Optional features (tree-shakeable)
  createEntry('forms.ts', 'forms.js', ['./signals.js']),
  createEntry('i18n.ts', 'i18n.js', ['./signals.js']),
  createEntry('animation.ts', 'animation.js', ['./signals.js']),
  createEntry('accessibility.ts', 'accessibility.js', ['./signals.js']),
  createEntry('ab-testing.ts', 'ab-testing.js', ['./signals.js']),
  createEntry('context.ts', 'context.js', ['./signals.js']),
  createEntry('error-boundary.ts', 'error-boundary.js', ['./signals.js']),
  createEntry('result.ts', 'result.js'),

  // Advanced features (separate bundles)
  createEntry('resumability.ts', 'resumability.js', ['./signals.js']),
  createEntry('data-layer.ts', 'data-layer.js', ['./signals.js']),
  createEntry('service-worker.ts', 'service-worker.js'),
  createEntry('performance-budgets.ts', 'performance-budgets.js', ['./signals.js']),
  createEntry('cost-tracking.ts', 'cost-tracking.js', ['./signals.js']),
  createEntry('usage-analytics.ts', 'usage-analytics.js', ['./signals.js']),
  createEntry('testing.ts', 'testing.js', ['./signals.js', './jsx-runtime.js']),

  // Serialization
  createEntry('superjson.ts', 'superjson.js'),
]);

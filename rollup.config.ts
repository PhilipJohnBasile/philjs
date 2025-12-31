/**
 * Shared Rollup configuration for all packages.
 * Optimized for:
 * - Smaller bundle sizes (target: 20% reduction)
 * - Better tree-shaking with aggressive optimizations
 * - Faster builds with caching
 * - Proper externals
 * - Pure function annotations
 */

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    // Enable better tree-shaking
    preserveModules: false,
    // Optimize exports for better tree-shaking
    exports: 'named',
    // Reduce bundle size
    compact: true,
    // Better interop with CommonJS
    interop: 'auto',
    // Hoist transitive imports for better tree-shaking
    hoistTransitiveImports: true,
    // Generate smaller output
    generatedCode: {
      arrowFunctions: true,
      constBindings: true,
      objectShorthand: true,
      preset: 'es2015',
      reservedNamesAsProps: false,
      symbols: false,
    },
    // Minify identifiers
    minifyInternalExports: true,
  },
  plugins: [
    resolve({
      // Only bundle project files, not node_modules
      preferBuiltins: true,
      // Skip resolving external dependencies
      resolveOnly: [],
      // Dedupe packages for smaller bundles
      dedupe: ['philjs-core'],
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      declarationDir: 'dist',
      // Optimize TypeScript compilation
      sourceMap: true,
      // Use incremental compilation for faster rebuilds
      composite: false,
      // Emit declaration files only once
      declarationMap: true,
      // Enable tree-shaking for TypeScript
      module: 'ESNext',
      target: 'ES2020',
    })
  ],
  external: [
    // Mark all node built-ins as external
    /^node:/,
    // Mark workspace packages as external
    /^philjs-/,
    // Mark common dependencies as external
    /^@babel\//,
    /^@rollup\//,
    /^@graphql/,
    'graphql',
    'vite',
    'rollup',
    'esbuild',
    'chokidar',
    'commander',
    'picocolors',
    'prompts'
  ],
  // Aggressive tree-shaking optimizations
  treeshake: {
    // Advanced preset for maximum tree-shaking
    preset: 'smallest',
    // Assume no module has side effects unless marked in package.json
    moduleSideEffects: false,
    // Assume property reads have no side effects
    propertyReadSideEffects: false,
    // Don't deoptimize try-catch blocks
    tryCatchDeoptimization: false,
    // Assume unknown globals have no side effects
    unknownGlobalSideEffects: false,
    // Additional aggressive optimizations
    annotations: true,
    correctVarValueBeforeDeclaration: false,
    manualPureFunctions: [
      // Mark PhilJS reactive primitives as pure
      'signal',
      'memo',
      'effect',
      'resource',
      'linkedSignal',
      'batch',
      'untrack',
      // Mark common utility functions as pure
      'createSignal',
      'createMemo',
      'createEffect',
      'createResource',
      'createContext',
      'useContext',
    ],
  },
  // Faster builds with persistent cache
  cache: true,

  // Performance optimizations
  maxParallelFileOps: 20,
});

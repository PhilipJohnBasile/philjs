/**
 * Shared Rollup configuration for all packages.
 * Optimized for:
 * - Smaller bundle sizes
 * - Better tree-shaking
 * - Faster builds
 * - Proper externals
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
    interop: 'auto'
  },
  plugins: [
    resolve({
      // Only bundle project files, not node_modules
      preferBuiltins: true,
      // Skip resolving external dependencies
      resolveOnly: []
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
      declarationMap: true
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
  // Tree-shaking optimizations
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  },
  // Faster builds
  cache: true
});

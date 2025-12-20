/**
 * Vite configuration example with PhilJS Optimizer
 */

import { defineConfig } from 'vite';
import { philjsOptimizer } from '../src/vite.js';

export default defineConfig({
  plugins: [
    philjsOptimizer({
      // Bundling strategy
      strategy: 'hybrid',

      // Include/exclude patterns
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['**/*.test.*', '**/*.spec.*'],

      // Optimization options
      minChunkSize: 1024, // 1KB
      maxChunkSize: 51200, // 50KB
      sourcemap: true,

      // Base URL for lazy chunks
      baseUrl: '/lazy',

      // Debug mode
      debug: true,
    }),
  ],

  build: {
    // Target modern browsers
    target: 'es2020',

    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk
          vendor: ['philjs-core'],
        },
      },
    },

    // Generate source maps
    sourcemap: true,

    // Minify
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});

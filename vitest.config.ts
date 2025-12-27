import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Faster test discovery
    include: ['packages/**/src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Enable benchmarking
    benchmark: {
      include: ['packages/**/src/**/*.bench.ts'],
      reporters: ['default'],
    },

    // Coverage with v8 (faster than istanbul)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['packages/**/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.bench.ts', '**/types.ts'],
    },

    // Globals for faster imports
    globals: true,

    // TypeScript
    typecheck: {
      enabled: false, // Let tsc handle this
    },

    // Caching
    cache: {
      dir: 'node_modules/.cache/vitest',
    },
  },
});

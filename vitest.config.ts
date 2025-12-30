import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Use Vite's cacheDir instead of deprecated test.cache.dir
  cacheDir: 'node_modules/.cache/vitest',
  test: {
    // Performance optimizations - Vitest 4+ uses top-level pool config
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 4,

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
  },
});

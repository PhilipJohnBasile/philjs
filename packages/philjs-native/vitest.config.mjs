import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@philjs/core': resolve(__dirname, '../philjs-core/src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@philjs/core',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/examples/**',
      ],
    },
  },
});


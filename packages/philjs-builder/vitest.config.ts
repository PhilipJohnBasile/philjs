import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      'philjs-core': path.resolve(__dirname, '../philjs-core/src/index.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    // Skip complex integration tests that require real IndexedDB/SQL.js setup
    exclude: [
      'src/__tests__/persistence.test.ts',
      'src/__tests__/sqlite-wasm.test.ts',
      'src/__tests__/sync-engine.test.ts',
    ],
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});


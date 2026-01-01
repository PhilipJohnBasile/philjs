import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom for Web Components testing
    environment: 'jsdom',

    // Test discovery
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Enable globals
    globals: true,

    // TypeScript
    typecheck: {
      enabled: false,
    },
  },
});


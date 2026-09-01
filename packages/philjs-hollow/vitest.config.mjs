import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Lower legacy decorators for the Node test runtime. Vite 8's default Oxc
  // transform preserves them when targeting ESNext, which leaves invalid
  // syntax for Node to evaluate.
  oxc: {
    target: 'es2022',
    decorator: {
      legacy: true,
    },
  },
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

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 defaults to Oxc; this package's custom JSX runtime is configured
  // through esbuild below.
  oxc: false,
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
    },
    setupFiles: ['./src/test-setup.ts'],
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@philjs/core',
  },
});

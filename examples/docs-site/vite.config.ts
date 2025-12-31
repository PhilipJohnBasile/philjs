import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@philjs/core',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    fs: {
      allow: [repoRoot],
    },
  },
  appType: 'spa', // Enable SPA mode for client-side routing
});

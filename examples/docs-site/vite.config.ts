import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'philjs-core',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
  },
  appType: 'spa', // Enable SPA mode for client-side routing
});

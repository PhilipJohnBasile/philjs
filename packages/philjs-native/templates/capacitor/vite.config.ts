import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

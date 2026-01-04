import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/protocol.ts', 'src/adapters/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  minify: false,
  sourcemap: true,
  external: ['@philjs/core', 'react', 'vue', 'svelte', 'solid-js'],
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/composables/index.ts', 'src/plugin.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  minify: false,
  sourcemap: true,
  external: ['@philjs/core', '@philjs/universal', 'vue'],
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['cannon-es', 'ammo.js', '@philjs/core', 'three', '@dimforge/rapier3d-compat'],
});

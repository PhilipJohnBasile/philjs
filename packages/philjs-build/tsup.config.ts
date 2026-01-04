import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'rspack/index': 'src/rspack/index.ts',
    'rslib/index': 'src/rslib/index.ts',
    'vite/index': 'src/vite/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  minify: false,
  external: ['@rspack/core', '@rslib/core', 'vite', 'commander', 'chalk', '@philjs/core'],
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'canvas/index': 'src/canvas/index.ts',
    'components/index': 'src/components/index.ts',
    'serialization/index': 'src/serialization/index.ts',
    'state/index': 'src/state/index.ts',
    'preview/index': 'src/preview/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['@philjs/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.jsxImportSource = '@philjs/core';
  },
});

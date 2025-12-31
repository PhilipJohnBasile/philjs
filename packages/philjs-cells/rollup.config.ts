import { defineConfig } from 'rollup';

export default defineConfig({
  input: {
    index: 'src/index.ts',
    cell: 'src/cell.ts',
    context: 'src/context.ts',
    cache: 'src/cache.ts',
    types: 'src/types.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    entryFileNames: '[name].js',
  },
  external: [
    'philjs-core',
    'philjs-core/signals',
    'philjs-core/jsx-runtime',
    'philjs-core/context',
    'philjs-core/error-boundary',
    'philjs-graphql',
  ],
  plugins: [
    {
      name: 'typescript-declarations',
      generateBundle() {
        // TypeScript declarations are handled by tsc
      }
    }
  ],
  treeshake: {
    moduleSideEffects: false,
  },
});

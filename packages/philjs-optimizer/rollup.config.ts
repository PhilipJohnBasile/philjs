import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig([
  {
    input: {
      'index': 'src/index.ts',
      'vite': 'src/vite.ts',
      'runtime': 'src/runtime.ts',
      'transform': 'src/transform.ts',
      'symbols': 'src/symbols.ts',
    },
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      preserveModules: false,
    },
    external: [
      '@babel/parser',
      '@babel/traverse',
      '@babel/types',
      '@babel/generator',
      'magic-string',
      'acorn',
      'acorn-walk',
      'vite',
      'fs',
      'path',
      'url',
      'crypto',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      }),
    ],
  },
]);

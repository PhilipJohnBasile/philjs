import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

const createEntry = (input, output, external = []) => ({
  input: `src/${input}`,
  output: {
    file: `dist/${output}`,
    format: 'es',
    sourcemap: true,
    exports: 'named',
    compact: true,
    interop: 'auto'
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      resolveOnly: []
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      declarationDir: 'dist',
      sourceMap: true,
      composite: false
    })
  ],
  external: [
    /^node:/,
    /^philjs-/,
    ...external
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  },
  cache: true
});

export default defineConfig([
  createEntry('index.ts', 'index.js')
]);

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

const createEntry = (input: string, output: string, external: string[] = []) => ({
  input: `src/${input}`,
  output: {
    file: `dist/${output}`,
    format: 'es' as const,
    sourcemap: true,
    exports: 'named' as const,
    compact: true,
    interop: 'auto' as const
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
    /^@philjs\//,
    'dompurify',
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
  createEntry('index.ts', 'index.js'),
  createEntry('csrf/index.ts', 'csrf/index.js'),
  createEntry('headers/index.ts', 'headers/index.js'),
  createEntry('xss/index.ts', 'xss/index.js'),
  createEntry('validation/index.ts', 'validation/index.js')
]);

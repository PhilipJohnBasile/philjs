/**
 * Shared Rollup configuration for all packages.
 */

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      declarationDir: 'dist'
    })
  ],
  external: [
    // Mark all node built-ins as external
    /^node:/,
    // Mark workspace packages as external
    /^philjs-/
  ]
};

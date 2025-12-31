import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    exports: 'named',
    // Inline dynamic imports to avoid multiple chunks
    inlineDynamicImports: true,
  },
  plugins: [
    resolve({
      preferBuiltins: true,
      resolveOnly: [],
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationMap: true,
      declarationDir: 'dist',
      sourceMap: true,
    })
  ],
  external: [
    /^node:/,
    /^philjs-/,
    // Framework dependencies are external
    'react',
    'react-dom',
    'react-dom/client',
    'preact',
    'preact/hooks',
    'vue',
    'svelte',
    'solid-js',
    'solid-js/web',
    'vite',
  ],
  treeshake: {
    preset: 'recommended',
    moduleSideEffects: false,
  },
});

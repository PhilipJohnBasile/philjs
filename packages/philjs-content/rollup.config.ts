import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';

export default defineConfig([
  // Main entry point
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
      }),
    ],
    external: [
      /^node:/,
      /^philjs-/,
      'zod',
      'gray-matter',
      'unified',
      'remark',
      'remark-parse',
      'remark-gfm',
      'remark-mdx',
      'rehype-stringify',
      'remark-rehype',
      'rehype-slug',
      'rehype-autolink-headings',
      'rehype-prism-plus',
      'estree-util-value-to-estree',
      'vfile',
      'globby',
      'chokidar',
      'image-size',
      'vite',
    ],
    treeshake: {
      preset: 'smallest',
      moduleSideEffects: false,
    },
  },
  // Collection module
  {
    input: 'src/collection.ts',
    output: {
      file: 'dist/collection.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
      }),
    ],
    external: [
      /^node:/,
      /^philjs-/,
      'zod',
    ],
    treeshake: {
      preset: 'smallest',
      moduleSideEffects: false,
    },
  },
  // Query module
  {
    input: 'src/query.ts',
    output: {
      file: 'dist/query.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
      }),
    ],
    external: [
      /^node:/,
      /^philjs-/,
      'zod',
      'gray-matter',
      'globby',
      './collection.js',
      './render.js',
      './types.js',
    ],
    treeshake: {
      preset: 'smallest',
      moduleSideEffects: false,
    },
  },
  // Render module
  {
    input: 'src/render.ts',
    output: {
      file: 'dist/render.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
      }),
    ],
    external: [
      /^node:/,
      /^philjs-/,
      'unified',
      'remark-parse',
      'remark-gfm',
      'remark-mdx',
      'rehype-stringify',
      'remark-rehype',
      'rehype-slug',
      'rehype-autolink-headings',
      './types.js',
    ],
    treeshake: {
      preset: 'smallest',
      moduleSideEffects: false,
    },
  },
  // Vite plugin
  {
    input: 'src/vite-plugin.ts',
    output: {
      file: 'dist/vite-plugin.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationMap: true,
        declarationDir: 'dist',
      }),
    ],
    external: [
      /^node:/,
      /^philjs-/,
      'vite',
      'gray-matter',
      'globby',
      'chokidar',
      'image-size',
      './collection.js',
      './query.js',
      './types.js',
    ],
    treeshake: {
      preset: 'smallest',
      moduleSideEffects: false,
    },
  },
]);

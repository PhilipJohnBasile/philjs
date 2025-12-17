import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig([
  // Main bundle
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      '@babel/core',
      '@babel/parser',
      '@babel/traverse',
      '@babel/generator',
      '@babel/types',
      '@rollup/pluginutils'
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ]
  },
  // Vite plugin
  {
    input: 'src/plugins/vite.ts',
    output: {
      file: 'dist/plugins/vite.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      'vite',
      '@rollup/pluginutils',
      '../optimizer',
      '../types'
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ]
  },
  // Rollup plugin
  {
    input: 'src/plugins/rollup.ts',
    output: {
      file: 'dist/plugins/rollup.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      'rollup',
      '@rollup/pluginutils',
      '../optimizer',
      '../types'
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ]
  }
]);

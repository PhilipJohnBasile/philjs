import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default defineConfig({
  input: {
    index: 'src/index.ts',
    hooks: 'src/hooks.ts',
    'sync/index': 'src/sync/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src',
    sourcemap: true,
  },
  external: [
    '@philjs/core',
    '@philjs/collab',
    '@philjs/genui',
    '@philjs/intent',
    '@philjs/ai',
    '@philjs/storage',
  ],
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      compilerOptions: {
        module: 'esnext',
        moduleResolution: 'bundler',
        declarationMap: false,
      },
    }),
  ],
});

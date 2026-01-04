import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type { RollupOptions } from 'rollup';

const config: RollupOptions = {
  input: {
    index: 'src/index.ts',
    'detection/index': 'src/detection/index.ts',
    'polyfills/index': 'src/polyfills/index.ts',
    'loader/index': 'src/loader/index.ts',
  },
  output: [
    {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
  ],
  external: [
    '@philjs/core',
    '@webcomponents/custom-elements',
    '@webcomponents/shadydom',
    'intersection-observer',
    'resize-observer-polyfill',
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      sourceMap: true,
    }),
  ],
};

export default config;

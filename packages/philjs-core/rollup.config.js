import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default [
  // Main entry point
  {
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
      /^node:/,
      /^philjs-/
    ]
  },
  // JSX runtime entry point
  {
    input: 'src/jsx-runtime.ts',
    output: {
      file: 'dist/jsx-runtime.js',
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
      /^node:/,
      /^philjs-/,
      './signals.js'
    ]
  },
  // JSX dev runtime entry point
  {
    input: 'src/jsx-dev-runtime.ts',
    output: {
      file: 'dist/jsx-dev-runtime.js',
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
      /^node:/,
      /^philjs-/,
      './jsx-runtime.js'
    ]
  }
];

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

// Plugin to add shebang
const shebang = () => ({
  name: 'shebang',
  renderChunk(code, chunk) {
    if (chunk.fileName === 'cli.js') {
      return '#!/usr/bin/env node\n' + code;
    }
    return code;
  },
});

// Build both index.ts and cli.ts
export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    external: [
      /^node:/,
      'vite',
      'rollup',
      'esbuild',
      'chokidar',
      'commander',
      'picocolors',
      'prompts',
      /^philjs-/
    ],
    plugins: [
      resolve({ preferBuiltins: true }),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
  {
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'es',
      sourcemap: true,
    },
    external: [
      /^node:/,
      'vite',
      'rollup',
      'esbuild',
      'chokidar',
      'commander',
      'picocolors',
      'prompts',
      /^philjs-/
    ],
    plugins: [
      resolve({ preferBuiltins: true }),
      typescript({ tsconfig: './tsconfig.json' }),
      shebang(),
    ],
  },
];

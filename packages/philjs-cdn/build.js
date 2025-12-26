import * as esbuild from 'esbuild';
import { minify } from 'terser';
import { writeFileSync, mkdirSync } from 'fs';

const isWatch = process.argv.includes('--watch');

async function build() {
  mkdirSync('./dist', { recursive: true });

  // ESM build
  await esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    format: 'esm',
    outfile: './dist/philjs.esm.js',
    target: 'es2020',
    minify: true,
    sourcemap: true,
  });

  // Global/UMD build
  const globalResult = await esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'PhilJS',
    outfile: './dist/philjs.global.js',
    target: 'es2020',
    minify: true,
    sourcemap: true,
    write: false,
  });

  // Write global build
  writeFileSync('./dist/philjs.global.js', globalResult.outputFiles[0].text);

  // Create minified version with terser for maximum compression
  const miniResult = await minify(globalResult.outputFiles[0].text, {
    compress: {
      passes: 3,
      unsafe: true,
      pure_getters: true,
    },
    mangle: {
      properties: {
        regex: /^_/,
      },
    },
    format: {
      comments: false,
    },
  });

  writeFileSync('./dist/philjs.mini.js', miniResult.code);

  // CJS build
  await esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    format: 'cjs',
    outfile: './dist/philjs.cjs.js',
    target: 'es2020',
    minify: true,
    sourcemap: true,
  });

  console.log('Build complete!');
  console.log('  - dist/philjs.esm.js (ESM)');
  console.log('  - dist/philjs.global.js (Global/IIFE)');
  console.log('  - dist/philjs.mini.js (Ultra-minified)');
  console.log('  - dist/philjs.cjs.js (CommonJS)');
}

build().catch(console.error);

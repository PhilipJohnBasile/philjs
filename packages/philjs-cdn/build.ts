import * as esbuild from 'esbuild';
import { minify } from 'terser';
import { mkdirSync, watch, writeFileSync } from 'node:fs';

const isWatch = process.argv.includes('--watch');

async function buildOnce() {
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

  if (!miniResult.code) {
    throw new Error('Terser did not return minified output');
  }

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

async function watchBuild() {
  let timer: NodeJS.Timeout | null = null;

  await buildOnce();
  console.log('Watching for changes...');

  watch('./src', { recursive: true }, () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(async () => {
      try {
        await buildOnce();
      } catch (error) {
        console.error(error);
      }
    }, 100);
  });
}

const run = isWatch ? watchBuild() : buildOnce();
run.catch(console.error);

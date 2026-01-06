import * as esbuild from 'esbuild';
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

  // Create extra-minified version using esbuild (terser has issues with esbuild output)
  const miniResult = await esbuild.build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'PhilJS',
    outfile: './dist/philjs.mini.js',
    target: 'es2020',
    minify: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    sourcemap: false,
    treeShaking: true,
    drop: ['console', 'debugger'],
  });

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

  console.log('  - dist/philjs.global.js (Global/IIFE)');
  console.log('  - dist/philjs.mini.js (Ultra-minified)');
}

async function watchBuild() {
  let timer: NodeJS.Timeout | null = null;

  await buildOnce();

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


/**
 * Rollup configuration for @philjs/ai
 * Uses JavaScript to avoid ESM module resolution issues
 */

const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');

module.exports = {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'es',
        sourcemap: true,
        exports: 'named',
        compact: true,
        interop: 'auto',
        hoistTransitiveImports: true,
        generatedCode: {
            arrowFunctions: true,
            constBindings: true,
            objectShorthand: true,
            preset: 'es2015',
        },
        minifyInternalExports: true,
        entryFileNames: 'index.js',
    },
    plugins: [
        resolve.default ? resolve.default({
            preferBuiltins: true,
        }) : resolve({
            preferBuiltins: true,
        }),
        typescript.default ? typescript.default({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: 'dist',
            declarationMap: false,
            sourceMap: true,
        }) : typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: 'dist',
            declarationMap: false,
            sourceMap: true,
        })
    ],
    external: [
        /^node:/,
        /^@philjs\//,
        '@philjs/core',
        'openai',
        'anthropic',
        '@anthropic-ai/sdk',
        'crypto',
        'zod',
    ],
    treeshake: {
        preset: 'smallest',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
    },
    cache: true,
};

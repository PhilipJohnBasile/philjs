/**
 * PhilJS Compiler Types
 */
export const defaultConfig = {
    autoMemo: true,
    autoBatch: true,
    deadCodeElimination: true,
    optimizeEffects: true,
    optimizeComponents: true,
    sourceMaps: true,
    development: process.env.NODE_ENV !== 'production',
    include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    plugins: [],
};
//# sourceMappingURL=types.js.map
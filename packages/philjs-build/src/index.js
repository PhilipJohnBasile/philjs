/**
 * @philjs/build
 * Rspack/Rslib build toolchain for PhilJS with Module Federation support
 *
 * @packageDocumentation
 */
// Rspack
export { createRspackConfig, createModuleFederationPlugin, createPhilJSPlugin, philJSRspackPlugin, defaultRspackConfig, mergeRspackConfig, } from './rspack/config.js';
export const presets = {
    development: (entry) => ({
        mode: 'development',
        entry,
        philjs: {
            signals: true,
            jsx: 'transform',
            autoMemo: false,
            treeshake: 'standard',
        },
        devServer: {
            port: 3000,
            hot: true,
            open: true,
        },
    }),
    production: (entry) => ({
        mode: 'production',
        entry,
        philjs: {
            signals: true,
            jsx: 'transform',
            autoMemo: true,
            treeshake: 'aggressive',
        },
        devtool: 'source-map',
    }),
    library: (entry, externals) => ({
        mode: 'production',
        entry,
        output: {
            filename: '[name].js',
        },
        externals: Object.fromEntries((externals ?? ['@philjs/core']).map((e) => [e, e])),
        philjs: {
            signals: true,
            jsx: 'transform',
            autoMemo: true,
            treeshake: 'aggressive',
        },
    }),
    microfrontend: (name, entry, options) => ({
        mode: 'production',
        entry: { main: entry },
        moduleFederation: {
            name,
            exposes: options.exposes,
            remotes: options.remotes,
        },
        philjs: {
            signals: true,
            jsx: 'transform',
            autoMemo: true,
            treeshake: 'aggressive',
        },
    }),
};
export const rspackPresets = presets;
// Rslib
export { createRslibConfig, defineConfig, mergeConfigs, entriesFromGlob, generateExportsField, rslibPresets, } from './rslib/config.js';
// Vite Compatibility
export { philJSVite, rspackViteCompat, adaptVitePlugin, createDevServerConfig, toViteServerConfig, toRspackDevServerConfig, } from './vite/compatibility.js';
//# sourceMappingURL=index.js.map
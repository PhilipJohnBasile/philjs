/**
 * @philjs/build
 * Rspack/Rslib build toolchain for PhilJS with Module Federation support
 *
 * @packageDocumentation
 */
// Rspack
export { createRspackConfig, createModuleFederationPlugin, createPhilJSPlugin, presets as rspackPresets, } from './rspack/config.js';
// Rslib
export { createRslibConfig, defineConfig, mergeConfigs, entriesFromGlob, generateExportsField, rslibPresets, } from './rslib/config.js';
// Vite Compatibility
export { philJSVite, rspackViteCompat, adaptVitePlugin, createDevServerConfig, toViteServerConfig, toRspackDevServerConfig, } from './vite/compatibility.js';
//# sourceMappingURL=index.js.map
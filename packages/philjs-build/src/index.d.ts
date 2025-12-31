/**
 * @philjs/build
 * Rspack/Rslib build toolchain for PhilJS with Module Federation support
 *
 * @packageDocumentation
 */
export { createRspackConfig, createModuleFederationPlugin, createPhilJSPlugin, presets as rspackPresets, type RspackConfiguration, type RspackRule, type PhilJSRspackOptions, type ModuleFederationOptions, type SharedModuleConfig, } from './rspack/config.js';
export { createRslibConfig, defineConfig, mergeConfigs, entriesFromGlob, generateExportsField, rslibPresets, type RslibConfig, type RslibLibConfig, type PhilJSRslibOptions, type OutputFormat, } from './rslib/config.js';
export { philJSVite, rspackViteCompat, adaptVitePlugin, createDevServerConfig, toViteServerConfig, toRspackDevServerConfig, type VitePlugin, type PhilJSViteOptions, type DevServerConfig, } from './vite/compatibility.js';
//# sourceMappingURL=index.d.ts.map
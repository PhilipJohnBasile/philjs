/**
 * @philjs/build
 * Rspack/Rslib build toolchain for PhilJS with Module Federation support
 *
 * @packageDocumentation
 */
import type { PhilJSRspackOptions } from './rspack/config.js';
export { createRspackConfig, createModuleFederationPlugin, createPhilJSPlugin, philJSRspackPlugin, defaultRspackConfig, mergeRspackConfig, type RspackConfiguration, type RspackRule, type PhilJSRspackOptions, type RspackPluginOptions, type ModuleFederationOptions, type SharedModuleConfig, } from './rspack/config.js';
export declare const presets: {
    development: (entry: string | Record<string, string>) => PhilJSRspackOptions;
    production: (entry: string | Record<string, string>) => PhilJSRspackOptions;
    library: (entry: string | Record<string, string>, externals?: string[]) => PhilJSRspackOptions;
    microfrontend: (name: string, entry: string, options: {
        exposes?: Record<string, string>;
        remotes?: Record<string, string>;
    }) => PhilJSRspackOptions;
};
export declare const rspackPresets: {
    development: (entry: string | Record<string, string>) => PhilJSRspackOptions;
    production: (entry: string | Record<string, string>) => PhilJSRspackOptions;
    library: (entry: string | Record<string, string>, externals?: string[]) => PhilJSRspackOptions;
    microfrontend: (name: string, entry: string, options: {
        exposes?: Record<string, string>;
        remotes?: Record<string, string>;
    }) => PhilJSRspackOptions;
};
export { createRslibConfig, defineConfig, mergeConfigs, entriesFromGlob, generateExportsField, rslibPresets, type RslibConfig, type RslibLibConfig, type PhilJSRslibOptions, type OutputFormat, } from './rslib/config.js';
export { philJSVite, rspackViteCompat, adaptVitePlugin, createDevServerConfig, toViteServerConfig, toRspackDevServerConfig, type VitePlugin, type PhilJSViteOptions, type DevServerConfig, } from './vite/compatibility.js';
//# sourceMappingURL=index.d.ts.map
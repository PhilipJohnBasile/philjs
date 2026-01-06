/**
 * @philjs/build
 * Rspack/Rslib build toolchain for PhilJS with Module Federation support
 *
 * @packageDocumentation
 */

import type { PhilJSRspackOptions } from './rspack/config.js';

// Rspack
export {
  createRspackConfig,
  createModuleFederationPlugin,
  createPhilJSPlugin,
  philJSRspackPlugin,
  defaultRspackConfig,
  mergeRspackConfig,
  type RspackConfiguration,
  type RspackRule,
  type PhilJSRspackOptions,
  type RspackPluginOptions,
  type ModuleFederationOptions,
  type SharedModuleConfig,
} from './rspack/config.js';

export const presets = {
  development: (entry: string | Record<string, string>): PhilJSRspackOptions => ({
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
  production: (entry: string | Record<string, string>): PhilJSRspackOptions => ({
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
  library: (
    entry: string | Record<string, string>,
    externals?: string[]
  ): PhilJSRspackOptions => ({
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
  microfrontend: (
    name: string,
    entry: string,
    options: { exposes?: Record<string, string>; remotes?: Record<string, string> }
  ): PhilJSRspackOptions => ({
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
export {
  createRslibConfig,
  defineConfig,
  mergeConfigs,
  entriesFromGlob,
  generateExportsField,
  rslibPresets,
  type RslibConfig,
  type PhilJSRslibOptions,
  type OutputFormat,
} from './rslib/config.js';

// Vite Compatibility
export {
  philJSVite,
  rspackViteCompat,
  adaptVitePlugin,
  createDevServerConfig,
  toViteServerConfig,
  toRspackDevServerConfig,
  type VitePlugin,
  type PhilJSViteOptions,
  type DevServerConfig,
} from './vite/compatibility.js';

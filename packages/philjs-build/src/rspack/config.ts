/**
 * Rspack Configuration
 * Base configuration for PhilJS applications using Rspack
 */

// Type definitions for Rspack (will be provided by @rspack/core in production)
export interface RspackConfiguration {
  mode?: 'development' | 'production' | 'none';
  entry?: string | string[] | Record<string, string | string[]>;
  output?: {
    path?: string;
    filename?: string;
    publicPath?: string;
    clean?: boolean;
    library?: {
      type?: string;
      name?: string;
    };
    chunkFilename?: string;
    assetModuleFilename?: string;
  };
  module?: {
    rules?: RspackRule[];
  };
  plugins?: unknown[];
  resolve?: {
    extensions?: string[];
    alias?: Record<string, string>;
    modules?: string[];
  };
  optimization?: {
    moduleIds?: string;
    chunkIds?: string;
    minimize?: boolean;
    usedExports?: boolean;
    sideEffects?: boolean;
    minimizer?: unknown[];
    splitChunks?: {
      chunks?: string;
      cacheGroups?: Record<string, {
        test?: RegExp;
        name?: string;
        priority?: number;
        reuseExistingChunk?: boolean;
      }>;
    };
  };
  devServer?: {
    port?: number;
    hot?: boolean;
    open?: boolean;
    historyApiFallback?: boolean;
    proxy?: Record<string, string>;
  };
  experiments?: {
    css?: boolean;
    rspackFuture?: {
      newTreeshaking?: boolean;
    };
  };
  devtool?: string | false;
  target?: string | string[];
  externals?: Record<string, string> | unknown[];
  cache?: boolean | { type: string };
}

export interface RspackRule {
  test?: RegExp;
  exclude?: RegExp;
  include?: RegExp;
  type?: string;
  use?: Array<{
    loader: string;
    options?: Record<string, unknown>;
  }>;
}

/**
 * PhilJS-specific Rspack options
 */
export interface PhilJSRspackOptions {
  /** Build mode */
  mode?: 'development' | 'production';
  /** Entry points */
  entry?: string | Record<string, string>;
  /** Output configuration */
  output?: {
    path?: string;
    filename?: string;
    publicPath?: string;
  };
  /** Resolve configuration overrides */
  resolve?: {
    extensions?: string[];
    alias?: Record<string, string>;
    modules?: string[];
  };
  /** Optimization overrides */
  optimization?: {
    moduleIds?: string;
    chunkIds?: string;
    minimize?: boolean;
    usedExports?: boolean;
    sideEffects?: boolean;
    splitChunks?: {
      chunks?: string;
      cacheGroups?: Record<string, {
        test?: RegExp;
        name?: string;
        priority?: number;
        reuseExistingChunk?: boolean;
      }>;
    };
  };
  /** Build target */
  target?: string | string[];
  /** PhilJS-specific options */
  philjs?: {
    /** Enable signal optimization */
    signals?: boolean;
    /** JSX handling */
    jsx?: 'transform' | 'preserve';
    /** Auto-memoization */
    autoMemo?: boolean;
    /** Tree-shaking mode */
    treeshake?: 'aggressive' | 'standard';
  };
  /** Module Federation configuration */
  moduleFederation?: ModuleFederationOptions;
  /** Dev server options */
  devServer?: {
    port?: number;
    hot?: boolean;
    open?: boolean;
    proxy?: Record<string, string>;
  };
  /** Source maps */
  devtool?: string | false;
  /** External dependencies */
  externals?: Record<string, string>;
  /** Enable CSS experiments */
  experimentalCss?: boolean;
}

/**
 * Module Federation options
 */
export interface ModuleFederationOptions {
  /** Application name */
  name: string;
  /** Remote entry filename */
  filename?: string;
  /** Exposed modules */
  exposes?: Record<string, string>;
  /** Remote modules to consume */
  remotes?: Record<string, string>;
  /** Shared dependencies */
  shared?: Record<string, SharedModuleConfig | boolean>;
}

/**
 * Shared module configuration
 */
export interface SharedModuleConfig {
  singleton?: boolean;
  requiredVersion?: string;
  eager?: boolean;
  strictVersion?: boolean;
}

/**
 * Rspack plugin options for PhilJS build integration.
 */
export interface RspackPluginOptions {
  /** Build mode */
  mode?: 'development' | 'production';
  /** Enable minification */
  minify?: boolean;
  /** Source map mode */
  sourcemap?: boolean | 'inline' | 'hidden' | 'nosources';
  /** Compilation target */
  target?: 'es2020' | 'es2021' | 'es2022' | 'es2023' | 'es2024' | 'esnext';
  /** Enable signal optimization */
  signals?: boolean;
  /** JSX handling */
  jsx?: 'transform' | 'preserve';
  /** Auto-memoization */
  autoMemo?: boolean;
  /** Tree-shaking mode */
  treeshake?: 'aggressive' | 'standard';
}

const DEFAULT_ENTRY = './src/index.ts';
const DEFAULT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.json'];

const DEFAULT_PLUGIN_OPTIONS: Required<Pick<RspackPluginOptions, 'mode' | 'minify' | 'sourcemap' | 'target'>> = {
  mode: 'development',
  minify: false,
  sourcemap: true,
  target: 'es2024',
};

/**
 * Create Rspack configuration for PhilJS
 */
export function createRspackConfig(options: PhilJSRspackOptions = {}): RspackConfiguration {
  const mode = options.mode ?? 'development';
  const isDev = mode === 'development';

  const config: RspackConfiguration = {
    mode,
    entry: options.entry ?? DEFAULT_ENTRY,
    output: {
      path: options.output?.path ?? 'dist',
      filename: options.output?.filename ?? (isDev ? '[name].js' : '[name].[contenthash].js'),
      publicPath: options.output?.publicPath ?? 'auto',
      clean: true,
      chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    module: {
      rules: [
        // TypeScript/JavaScript with SWC
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                    decorators: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      importSource: '@philjs/core',
                      development: isDev,
                      refresh: isDev,
                    },
                    decoratorVersion: '2022-03',
                  },
                  target: 'es2024',
                },
                minify: !isDev,
              },
            },
          ],
        },
        // CSS
        {
          test: /\.css$/,
          type: 'css',
        },
        // Assets
        {
          test: /\.(png|jpe?g|gif|svg|webp|avif)$/,
          type: 'asset',
        },
        {
          test: /\.(woff2?|eot|ttf|otf)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [],
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        // Ensure consistent @philjs/core resolution
        '@philjs/core': '@philjs/core',
      },
    },
    optimization: {
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      minimize: !isDev,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for PhilJS packages
          philjs: {
            test: /[\\/]node_modules[\\/]@philjs[\\/]/,
            name: 'philjs-vendor',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common vendor chunk
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    },
    devServer: isDev
      ? {
          port: options.devServer?.port ?? 3000,
          hot: options.devServer?.hot ?? true,
          open: options.devServer?.open ?? false,
          historyApiFallback: true,
          proxy: options.devServer?.proxy,
        }
      : undefined,
    devtool: options.devtool ?? (isDev ? 'eval-source-map' : 'source-map'),
    experiments: {
      css: options.experimentalCss ?? true,
      rspackFuture: {
        newTreeshaking: options.philjs?.treeshake === 'aggressive',
      },
    },
    cache: isDev ? { type: 'memory' } : false,
    target: options.target ?? 'web',
  };

  config.resolve = {
    extensions: options.resolve?.extensions ?? DEFAULT_EXTENSIONS,
    alias: {
      '@philjs/core': '@philjs/core',
      ...(options.resolve?.alias ?? {}),
    },
    modules: options.resolve?.modules,
  };

  config.optimization = {
    moduleIds: options.optimization?.moduleIds ?? 'deterministic',
    chunkIds: options.optimization?.chunkIds ?? 'deterministic',
    minimize: options.optimization?.minimize ?? !isDev,
    usedExports: options.optimization?.usedExports ?? !isDev,
    sideEffects: options.optimization?.sideEffects ?? !isDev,
    splitChunks: {
      chunks: options.optimization?.splitChunks?.chunks ?? 'all',
      cacheGroups: {
        philjs: {
          test: /[\\/]node_modules[\\/]@philjs[\\/]/,
          name: 'philjs-vendor',
          priority: 20,
          reuseExistingChunk: true,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        ...(options.optimization?.splitChunks?.cacheGroups ?? {}),
      },
    },
  };

  // Add external dependencies
  if (options.externals) {
    config.externals = options.externals;
  }

  // Add Module Federation if configured
  if (options.moduleFederation) {
    config.plugins = config.plugins || [];
    config.plugins.push(createModuleFederationPlugin(options.moduleFederation));
  }

  // Add PhilJS optimization plugin
  if (options.philjs !== false) {
    config.plugins = config.plugins || [];
    config.plugins.push(philJSRspackPlugin({
      ...DEFAULT_PLUGIN_OPTIONS,
      mode,
      minify: !isDev,
      sourcemap: options.devtool !== false,
      target: typeof options.target === 'string' ? (options.target as RspackPluginOptions['target']) : DEFAULT_PLUGIN_OPTIONS.target,
      ...(options.philjs ?? {}),
    }));
    if (options.philjs && typeof options.philjs === 'object') {
      config.plugins.push(createPhilJSPlugin(options.philjs));
    }
  }

  return config;
}

/**
 * Create Module Federation plugin configuration
 */
export function createModuleFederationPlugin(options: ModuleFederationOptions): unknown {
  return {
    name: 'ModuleFederationPlugin',
    options: {
      name: options.name,
      filename: options.filename ?? 'remoteEntry.js',
      exposes: options.exposes,
      remotes: options.remotes,
      shared: {
        '@philjs/core': {
          singleton: true,
          requiredVersion: '^0.1.0',
          eager: false,
        },
        '@philjs/router': {
          singleton: true,
          requiredVersion: '^0.1.0',
          eager: false,
        },
        ...Object.fromEntries(
          Object.entries(options.shared ?? {}).map(([key, value]) => [
            key,
            typeof value === 'boolean' ? { singleton: value } : value,
          ])
        ),
      },
    },
  };
}

/**
 * Create PhilJS optimization plugin
 */
export function createPhilJSPlugin(options: PhilJSRspackOptions['philjs']): unknown {
  return {
    name: 'PhilJSPlugin',
    apply(compiler: unknown) {
      // Plugin implementation would go here
      // This is a placeholder for the actual Rspack plugin
    },
  };
}

/**
 * Create PhilJS Rspack plugin (compat wrapper).
 */
export function philJSRspackPlugin(options: RspackPluginOptions = {}): unknown {
  const merged = {
    ...DEFAULT_PLUGIN_OPTIONS,
    ...options,
  };

  return {
    name: 'philjs-rspack-plugin',
    apply(_compiler: unknown) {
      // Placeholder for real plugin integration.
      void merged;
    },
  };
}

/**
 * Deep merge Rspack configurations.
 */
export function mergeRspackConfig<T extends Record<string, unknown>>(
  ...configs: Array<T | undefined>
): T {
  const result: Record<string, unknown> = {};

  for (const config of configs) {
    if (!config) continue;
    for (const [key, value] of Object.entries(config)) {
      if (value === undefined) continue;

      const existing = result[key];
      if (Array.isArray(existing) && Array.isArray(value)) {
        result[key] = [...existing, ...value];
      } else if (isPlainObject(existing) && isPlainObject(value)) {
        result[key] = mergeRspackConfig(existing as Record<string, unknown>, value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Preset configurations
 */
export const presets = {
  /**
   * Development preset
   */
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

  /**
   * Production preset
   */
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

  /**
   * Library preset (for publishing packages)
   */
  library: (entry: string | Record<string, string>, externals?: string[]): PhilJSRspackOptions => ({
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

  /**
   * Micro-frontend preset
   */
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

/**
 * Default Rspack configuration (development mode).
 */
export const defaultRspackConfig = createRspackConfig();

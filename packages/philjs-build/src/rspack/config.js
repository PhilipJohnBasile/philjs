/**
 * Rspack Configuration
 * Base configuration for PhilJS applications using Rspack
 */
const DEFAULT_ENTRY = './src/index.ts';
const DEFAULT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.json'];
const DEFAULT_PLUGIN_OPTIONS = {
    mode: 'development',
    minify: false,
    sourcemap: true,
    target: 'es2024',
};
/**
 * Create Rspack configuration for PhilJS
 */
export function createRspackConfig(options = {}) {
    const mode = options.mode ?? 'development';
    const isDev = mode === 'development';
    const config = {
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
            target: typeof options.target === 'string' ? options.target : DEFAULT_PLUGIN_OPTIONS.target,
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
export function createModuleFederationPlugin(options) {
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
                ...Object.fromEntries(Object.entries(options.shared ?? {}).map(([key, value]) => [
                    key,
                    typeof value === 'boolean' ? { singleton: value } : value,
                ])),
            },
        },
    };
}
/**
 * Create PhilJS optimization plugin
 */
export function createPhilJSPlugin(options) {
    return {
        name: 'PhilJSPlugin',
        apply(compiler) {
            // Plugin implementation would go here
            // This is a placeholder for the actual Rspack plugin
        },
    };
}
/**
 * Create PhilJS Rspack plugin (compat wrapper).
 */
export function philJSRspackPlugin(options = {}) {
    const merged = {
        ...DEFAULT_PLUGIN_OPTIONS,
        ...options,
    };
    return {
        name: 'philjs-rspack-plugin',
        apply(_compiler) {
            // Placeholder for real plugin integration.
            void merged;
        },
    };
}
/**
 * Deep merge Rspack configurations.
 */
export function mergeRspackConfig(...configs) {
    const result = {};
    for (const config of configs) {
        if (!config)
            continue;
        for (const [key, value] of Object.entries(config)) {
            if (value === undefined)
                continue;
            const existing = result[key];
            if (Array.isArray(existing) && Array.isArray(value)) {
                result[key] = [...existing, ...value];
            }
            else if (isPlainObject(existing) && isPlainObject(value)) {
                result[key] = mergeRspackConfig(existing, value);
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
/**
 * Preset configurations
 */
export const presets = {
    /**
     * Development preset
     */
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
    /**
     * Production preset
     */
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
    /**
     * Library preset (for publishing packages)
     */
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
    /**
     * Micro-frontend preset
     */
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
/**
 * Default Rspack configuration (development mode).
 */
export const defaultRspackConfig = createRspackConfig();
//# sourceMappingURL=config.js.map
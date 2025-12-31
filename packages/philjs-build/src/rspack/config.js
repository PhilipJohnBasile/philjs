/**
 * Rspack Configuration
 * Base configuration for PhilJS applications using Rspack
 */
/**
 * Create Rspack configuration for PhilJS
 */
export function createRspackConfig(options) {
    const isDev = options.mode === 'development';
    const config = {
        mode: options.mode,
        entry: options.entry,
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
        target: ['web', 'es2024'],
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
    if (options.philjs) {
        config.plugins = config.plugins || [];
        config.plugins.push(createPhilJSPlugin(options.philjs));
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
//# sourceMappingURL=config.js.map
/**
 * Rspack Configuration
 * Base configuration for PhilJS applications using Rspack
 */
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
    cache?: boolean | {
        type: string;
    };
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
/**
 * Create Rspack configuration for PhilJS
 */
export declare function createRspackConfig(options?: PhilJSRspackOptions): RspackConfiguration;
/**
 * Create Module Federation plugin configuration
 */
export declare function createModuleFederationPlugin(options: ModuleFederationOptions): unknown;
/**
 * Create PhilJS optimization plugin
 */
export declare function createPhilJSPlugin(options: PhilJSRspackOptions['philjs']): unknown;
/**
 * Create PhilJS Rspack plugin (compat wrapper).
 */
export declare function philJSRspackPlugin(options?: RspackPluginOptions): unknown;
/**
 * Deep merge Rspack configurations.
 */
export declare function mergeRspackConfig<T extends Record<string, unknown>>(...configs: Array<T | undefined>): T;
/**
 * Preset configurations
 */
export declare const presets: {
    /**
     * Development preset
     */
    development: (entry: string | Record<string, string>) => PhilJSRspackOptions;
    /**
     * Production preset
     */
    production: (entry: string | Record<string, string>) => PhilJSRspackOptions;
    /**
     * Library preset (for publishing packages)
     */
    library: (entry: string | Record<string, string>, externals?: string[]) => PhilJSRspackOptions;
    /**
     * Micro-frontend preset
     */
    microfrontend: (name: string, entry: string, options: {
        exposes?: Record<string, string>;
        remotes?: Record<string, string>;
    }) => PhilJSRspackOptions;
};
/**
 * Default Rspack configuration (development mode).
 */
export declare const defaultRspackConfig: RspackConfiguration;
//# sourceMappingURL=config.d.ts.map
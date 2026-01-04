/**
 * Rslib Configuration
 * Library/app build configuration for PhilJS packages.
 */
/**
 * Output format
 */
export type OutputFormat = 'esm' | 'cjs' | 'umd';
/**
 * Supported presets
 */
export type RslibPreset = 'library' | 'application' | 'component' | 'node';
/**
 * Rslib configuration (simplified shape for PhilJS).
 */
export interface RslibConfig {
    source: {
        entry?: string | Record<string, string>;
        alias?: Record<string, string>;
    };
    output: {
        format?: OutputFormat;
        formats?: OutputFormat[];
        dir?: string;
        filename?: string;
        clean?: boolean;
        minify?: boolean;
        splitting?: boolean;
        dts?: boolean;
        sourceMap?: boolean;
        target?: 'node' | 'browser';
        extractCSS?: boolean;
        preserveModules?: boolean;
    };
    external?: string[];
    autoExternal?: {
        peerDependencies?: boolean;
        builtins?: boolean;
    };
    plugins?: unknown[];
}
/**
 * New-style configuration options.
 */
export interface RslibConfigOptions {
    preset?: RslibPreset;
    source?: RslibConfig['source'];
    output?: RslibConfig['output'];
    external?: string[];
    autoExternal?: RslibConfig['autoExternal'];
    autoExternalPeers?: boolean;
    autoExternalNode?: boolean;
    plugins?: unknown[];
}
/**
 * Legacy library options (kept for CLI compatibility).
 */
export interface LegacyRslibOptions {
    entry: string | Record<string, string>;
    formats: OutputFormat[];
    external?: string[];
    dts?: boolean;
    umdName?: string;
    umdGlobals?: Record<string, string>;
    minify?: boolean;
    sourceMap?: boolean;
    outDir?: string;
}
export type PhilJSRslibOptions = RslibConfigOptions | LegacyRslibOptions;
export declare const libraryPreset: RslibConfigOptions;
export declare const applicationPreset: RslibConfigOptions;
export declare const componentPreset: RslibConfigOptions;
export declare const nodePreset: RslibConfigOptions;
export declare const rslibPresets: {
    library: RslibConfigOptions;
    application: RslibConfigOptions;
    component: RslibConfigOptions;
    node: RslibConfigOptions;
};
/**
 * Create Rslib configuration for PhilJS libraries/apps.
 */
export declare function createRslibConfig(options?: PhilJSRslibOptions): RslibConfig;
/**
 * Define an Rslib configuration (for rslib.config.ts files).
 */
export declare function defineConfig(config: RslibConfig): RslibConfig;
/**
 * Merge multiple configurations.
 */
export declare function mergeConfigs<T extends Record<string, unknown>>(...configs: Array<T | undefined>): T;
/**
 * Helper to create entry points from glob pattern.
 */
export declare function entriesFromGlob(pattern: string, baseDir?: string): Record<string, string>;
/**
 * Generate package.json exports field from Rslib config.
 */
export declare function generateExportsField(config: RslibConfig): Record<string, Record<string, string> | string>;
//# sourceMappingURL=config.d.ts.map
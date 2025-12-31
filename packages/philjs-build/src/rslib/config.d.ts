/**
 * Rslib Configuration
 * Library build configuration for PhilJS packages
 */
/**
 * Output format
 */
export type OutputFormat = 'esm' | 'cjs' | 'umd';
/**
 * Rslib configuration
 */
export interface RslibConfig {
    lib: RslibLibConfig[];
    source?: {
        entry?: Record<string, string>;
    };
    output?: {
        externals?: (string | RegExp)[];
        minify?: boolean;
        sourceMap?: boolean;
    };
    plugins?: unknown[];
}
/**
 * Library output configuration
 */
export interface RslibLibConfig {
    format: OutputFormat;
    output?: {
        distPath?: {
            root?: string;
        };
    };
    umd?: {
        name?: string;
        globals?: Record<string, string>;
    };
}
/**
 * PhilJS Rslib options
 */
export interface PhilJSRslibOptions {
    /** Entry file(s) */
    entry: string | Record<string, string>;
    /** Output formats to generate */
    formats: OutputFormat[];
    /** External dependencies (not bundled) */
    external?: string[];
    /** Generate .d.ts files */
    dts?: boolean;
    /** UMD global name (for UMD format) */
    umdName?: string;
    /** UMD globals mapping */
    umdGlobals?: Record<string, string>;
    /** Minify output */
    minify?: boolean;
    /** Generate source maps */
    sourceMap?: boolean;
    /** Output directory base */
    outDir?: string;
}
/**
 * Create Rslib configuration for PhilJS libraries
 */
export declare function createRslibConfig(options: PhilJSRslibOptions): RslibConfig;
/**
 * Preset configurations for common use cases
 */
export declare const rslibPresets: {
    /**
     * Core framework package preset
     * ESM only, strict tree-shaking
     */
    core: (entry: string) => PhilJSRslibOptions;
    /**
     * Library package preset
     * Multiple formats for maximum compatibility
     */
    library: (entry: string, umdName?: string) => PhilJSRslibOptions;
    /**
     * UI component package preset
     * ESM and CJS, external React/Vue/Svelte
     */
    components: (entry: string) => PhilJSRslibOptions;
    /**
     * Utility package preset
     * ESM only, no external dependencies
     */
    utility: (entry: string) => PhilJSRslibOptions;
    /**
     * Node.js package preset
     * CJS and ESM for Node compatibility
     */
    node: (entry: string) => PhilJSRslibOptions;
};
/**
 * Define an Rslib configuration (for rslib.config.ts files)
 */
export declare function defineConfig(config: RslibConfig): RslibConfig;
/**
 * Merge multiple Rslib configurations
 */
export declare function mergeConfigs(...configs: Partial<RslibConfig>[]): RslibConfig;
/**
 * Helper to create entry points from glob pattern
 */
export declare function entriesFromGlob(pattern: string, baseDir?: string): Record<string, string>;
/**
 * Generate package.json exports field from Rslib config
 */
export declare function generateExportsField(config: RslibConfig): Record<string, Record<string, string> | string>;
//# sourceMappingURL=config.d.ts.map
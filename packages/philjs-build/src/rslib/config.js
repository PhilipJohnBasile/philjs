/**
 * Rslib Configuration
 * Library build configuration for PhilJS packages
 */
/**
 * Create Rslib configuration for PhilJS libraries
 */
export function createRslibConfig(options) {
    return {
        lib: options.formats.map((format) => ({
            format,
            output: {
                distPath: {
                    root: options.outDir ? `${options.outDir}/${format}` : `dist/${format}`,
                },
            },
            ...(format === 'umd' && options.umdName
                ? {
                    umd: {
                        name: options.umdName,
                        globals: options.umdGlobals ?? {
                            '@philjs/core': 'PhilJSCore',
                            react: 'React',
                        },
                    },
                }
                : {}),
        })),
        source: {
            entry: typeof options.entry === 'string'
                ? { index: options.entry }
                : options.entry,
        },
        output: {
            externals: [
                /^@philjs\//,
                ...(options.external ?? []),
            ],
            minify: options.minify ?? true,
            sourceMap: options.sourceMap ?? true,
        },
        plugins: [
            // DTS plugin would be added here if dts is enabled
            ...(options.dts !== false ? [createDtsPlugin()] : []),
        ],
    };
}
/**
 * Create DTS (TypeScript declarations) plugin
 */
function createDtsPlugin() {
    return {
        name: 'dts-plugin',
        // Plugin implementation placeholder
        // In production, use @rslib/plugin-dts or similar
    };
}
/**
 * Preset configurations for common use cases
 */
export const rslibPresets = {
    /**
     * Core framework package preset
     * ESM only, strict tree-shaking
     */
    core: (entry) => ({
        entry,
        formats: ['esm'],
        dts: true,
        minify: true,
        sourceMap: true,
    }),
    /**
     * Library package preset
     * Multiple formats for maximum compatibility
     */
    library: (entry, umdName) => ({
        entry,
        formats: ['esm', 'cjs', 'umd'],
        dts: true,
        umdName,
        minify: true,
        sourceMap: true,
    }),
    /**
     * UI component package preset
     * ESM and CJS, external React/Vue/Svelte
     */
    components: (entry) => ({
        entry,
        formats: ['esm', 'cjs'],
        dts: true,
        external: ['react', 'react-dom', 'vue', 'svelte'],
        minify: true,
        sourceMap: true,
    }),
    /**
     * Utility package preset
     * ESM only, no external dependencies
     */
    utility: (entry) => ({
        entry,
        formats: ['esm'],
        dts: true,
        external: [],
        minify: true,
        sourceMap: true,
    }),
    /**
     * Node.js package preset
     * CJS and ESM for Node compatibility
     */
    node: (entry) => ({
        entry,
        formats: ['esm', 'cjs'],
        dts: true,
        minify: false,
        sourceMap: true,
    }),
};
/**
 * Define an Rslib configuration (for rslib.config.ts files)
 */
export function defineConfig(config) {
    return config;
}
/**
 * Merge multiple Rslib configurations
 */
export function mergeConfigs(...configs) {
    const merged = {
        lib: [],
        source: {},
        output: {},
        plugins: [],
    };
    for (const config of configs) {
        if (config.lib) {
            merged.lib.push(...config.lib);
        }
        if (config.source) {
            merged.source = { ...merged.source, ...config.source };
        }
        if (config.output) {
            merged.output = { ...merged.output, ...config.output };
        }
        if (config.plugins) {
            merged.plugins.push(...config.plugins);
        }
    }
    return merged;
}
/**
 * Helper to create entry points from glob pattern
 */
export function entriesFromGlob(pattern, baseDir = 'src') {
    // In production, use fast-glob
    // This is a simplified version
    const entries = {};
    // For now, just return a placeholder
    // Real implementation would use fast-glob to find files
    entries.index = `${baseDir}/index.ts`;
    return entries;
}
/**
 * Generate package.json exports field from Rslib config
 */
export function generateExportsField(config) {
    const exports = {};
    const entries = config.source?.entry ?? { index: './src/index.ts' };
    for (const [name, _entry] of Object.entries(entries)) {
        const exportPath = name === 'index' ? '.' : `./${name}`;
        const basePath = name === 'index' ? '' : `/${name}`;
        exports[exportPath] = {
            types: `./dist/esm${basePath}/index.d.ts`,
            import: `./dist/esm${basePath}/index.js`,
            require: `./dist/cjs${basePath}/index.js`,
        };
    }
    return exports;
}
//# sourceMappingURL=config.js.map
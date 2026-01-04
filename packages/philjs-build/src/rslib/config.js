/**
 * Rslib Configuration
 * Library/app build configuration for PhilJS packages.
 */
const DEFAULT_ENTRY = './src/index.ts';
export const libraryPreset = {
    output: {
        format: 'esm',
        dts: true,
        clean: true,
        minify: false,
        sourceMap: true,
    },
    autoExternal: {
        peerDependencies: true,
    },
};
export const applicationPreset = {
    output: {
        format: 'esm',
        minify: true,
        splitting: true,
        clean: true,
    },
};
export const componentPreset = {
    output: {
        format: 'esm',
        dts: true,
        extractCSS: true,
        preserveModules: true,
    },
};
export const nodePreset = {
    output: {
        format: 'cjs',
        target: 'node',
        dts: true,
        sourceMap: true,
    },
    autoExternal: {
        builtins: true,
    },
};
export const rslibPresets = {
    library: libraryPreset,
    application: applicationPreset,
    component: componentPreset,
    node: nodePreset,
};
/**
 * Create Rslib configuration for PhilJS libraries/apps.
 */
export function createRslibConfig(options = {}) {
    const normalized = normalizeRslibOptions(options);
    const presetConfig = normalized.preset ? rslibPresets[normalized.preset] : {};
    const { preset: _preset, ...normalizedConfig } = normalized;
    const base = {
        source: { entry: DEFAULT_ENTRY },
        output: {
            format: 'esm',
            dts: true,
            sourceMap: true,
        },
        plugins: [],
    };
    const merged = mergeConfigs(base, presetConfig, normalizedConfig);
    if (merged.output?.formats?.length && !merged.output.format) {
        merged.output.format = merged.output.formats[0];
    }
    if (!merged.output?.format) {
        merged.output = { ...(merged.output ?? {}), format: 'esm' };
    }
    return merged;
}
function normalizeRslibOptions(options) {
    if (isLegacyOptions(options)) {
        const legacy = options;
        return {
            source: { entry: legacy.entry },
            output: {
                formats: legacy.formats,
                format: legacy.formats[0] ?? 'esm',
                dts: legacy.dts ?? true,
                dir: legacy.outDir,
                minify: legacy.minify ?? true,
                sourceMap: legacy.sourceMap ?? true,
            },
            external: legacy.external,
        };
    }
    const modern = options;
    const autoExternal = {
        ...(modern.autoExternal ?? {}),
        ...(modern.autoExternalPeers ? { peerDependencies: true } : {}),
        ...(modern.autoExternalNode ? { builtins: true } : {}),
    };
    return {
        ...modern,
        autoExternal: Object.keys(autoExternal).length ? autoExternal : modern.autoExternal,
    };
}
function isLegacyOptions(options) {
    return Boolean(options &&
        typeof options === 'object' &&
        'formats' in options &&
        'entry' in options);
}
/**
 * Define an Rslib configuration (for rslib.config.ts files).
 */
export function defineConfig(config) {
    return config;
}
/**
 * Merge multiple configurations.
 */
export function mergeConfigs(...configs) {
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
                result[key] = mergeConfigs(existing, value);
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
 * Helper to create entry points from glob pattern.
 */
export function entriesFromGlob(pattern, baseDir = 'src') {
    // In production, use fast-glob.
    const entries = {};
    void pattern;
    entries.index = `${baseDir}/index.ts`;
    return entries;
}
/**
 * Generate package.json exports field from Rslib config.
 */
export function generateExportsField(config) {
    const exports = {};
    const entries = config.source?.entry ?? { index: './src/index.ts' };
    const normalizedEntries = typeof entries === 'string' ? { index: entries } : entries;
    for (const [name] of Object.entries(normalizedEntries)) {
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
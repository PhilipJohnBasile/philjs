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
export function createRslibConfig(options: PhilJSRslibOptions): RslibConfig {
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
      entry:
        typeof options.entry === 'string'
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
function createDtsPlugin(): unknown {
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
  core: (entry: string): PhilJSRslibOptions => ({
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
  library: (entry: string, umdName?: string): PhilJSRslibOptions => ({
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
  components: (entry: string): PhilJSRslibOptions => ({
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
  utility: (entry: string): PhilJSRslibOptions => ({
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
  node: (entry: string): PhilJSRslibOptions => ({
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
export function defineConfig(config: RslibConfig): RslibConfig {
  return config;
}

/**
 * Merge multiple Rslib configurations
 */
export function mergeConfigs(...configs: Partial<RslibConfig>[]): RslibConfig {
  const merged: RslibConfig = {
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
      merged.plugins!.push(...config.plugins);
    }
  }

  return merged;
}

/**
 * Helper to create entry points from glob pattern
 */
export function entriesFromGlob(pattern: string, baseDir = 'src'): Record<string, string> {
  // In production, use fast-glob
  // This is a simplified version
  const entries: Record<string, string> = {};

  // For now, just return a placeholder
  // Real implementation would use fast-glob to find files
  entries.index = `${baseDir}/index.ts`;

  return entries;
}

/**
 * Generate package.json exports field from Rslib config
 */
export function generateExportsField(
  config: RslibConfig
): Record<string, Record<string, string> | string> {
  const exports: Record<string, Record<string, string> | string> = {};

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

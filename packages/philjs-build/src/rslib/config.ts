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

const DEFAULT_ENTRY = './src/index.ts';

export const libraryPreset: RslibConfigOptions = {
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

export const applicationPreset: RslibConfigOptions = {
  output: {
    format: 'esm',
    minify: true,
    splitting: true,
    clean: true,
  },
};

export const componentPreset: RslibConfigOptions = {
  output: {
    format: 'esm',
    dts: true,
    extractCSS: true,
    preserveModules: true,
  },
};

export const nodePreset: RslibConfigOptions = {
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
export function createRslibConfig(options: PhilJSRslibOptions = {}): RslibConfig {
  const normalized = normalizeRslibOptions(options);
  const presetConfig = normalized.preset ? rslibPresets[normalized.preset] : {};
  const { preset: _preset, ...normalizedConfig } = normalized;

  const base: RslibConfigOptions = {
    source: { entry: DEFAULT_ENTRY },
    output: {
      format: 'esm',
      dts: true,
      sourceMap: true,
    },
    plugins: [],
  };

  const merged = mergeConfigs(base, presetConfig, normalizedConfig) as RslibConfig;

  if (merged.output?.formats?.length && !merged.output.format) {
    merged.output.format = merged.output.formats[0];
  }

  if (!merged.output?.format) {
    merged.output = { ...(merged.output ?? {}), format: 'esm' };
  }

  return merged;
}

function normalizeRslibOptions(options: PhilJSRslibOptions): RslibConfigOptions {
  if (isLegacyOptions(options)) {
    const legacy = options as LegacyRslibOptions;
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

  const modern = options as RslibConfigOptions;
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

function isLegacyOptions(options: PhilJSRslibOptions): options is LegacyRslibOptions {
  return Boolean(
    options &&
      typeof options === 'object' &&
      'formats' in options &&
      'entry' in options
  );
}

/**
 * Define an Rslib configuration (for rslib.config.ts files).
 */
export function defineConfig(config: RslibConfig): RslibConfig {
  return config;
}

/**
 * Merge multiple configurations.
 */
export function mergeConfigs<T extends Record<string, unknown>>(
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
        result[key] = mergeConfigs(existing as Record<string, unknown>, value as Record<string, unknown>);
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
 * Helper to create entry points from glob pattern.
 */
export function entriesFromGlob(pattern: string, baseDir = 'src'): Record<string, string> {
  // In production, use fast-glob.
  const entries: Record<string, string> = {};
  void pattern;
  entries.index = `${baseDir}/index.ts`;
  return entries;
}

/**
 * Generate package.json exports field from Rslib config.
 */
export function generateExportsField(
  config: RslibConfig
): Record<string, Record<string, string> | string> {
  const exports: Record<string, Record<string, string> | string> = {};

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

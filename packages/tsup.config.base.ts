import { defineConfig, type Options } from 'tsup';

/**
 * Optimized tsup configuration for PhilJS packages
 *
 * Performance optimizations:
 * - esbuild for 100x faster builds than tsc
 * - Parallel DTS generation
 * - Code splitting for tree-shaking
 * - Minimal external dependencies
 * - ESNext target (ES2025+ features, no transpilation overhead)
 */

const isProduction = process.env.NODE_ENV === 'production';

export const baseConfig: Options = {
  // Output formats
  format: ['esm', 'cjs'],

  // Type generation - use experimental faster DTS
  dts: {
    compilerOptions: {
      // Speed up DTS generation
      incremental: true,
      tsBuildInfoFile: './node_modules/.cache/tsup/.tsbuildinfo',
    },
  },

  // Source maps only in dev (faster production builds)
  sourcemap: !isProduction,

  // Clean dist before build
  clean: true,

  // Minify in production for smaller bundles
  minify: isProduction ? 'esbuild' : false,

  // Tree-shake friendly output
  treeshake: {
    preset: 'smallest',
    moduleSideEffects: false,
  },

  // Code splitting for lazy loading
  splitting: true,

  // Target modern JS - ESNext for ES2025+ features
  target: 'esnext',

  // Platform browser (lighter output)
  platform: 'neutral',

  // Optimize esbuild
  esbuildOptions(options) {
    // Dead code elimination
    options.drop = isProduction ? ['console', 'debugger'] : [];
    // Faster parsing
    options.charset = 'utf8';
    // Smaller output
    options.legalComments = 'none';
    // Tree shaking
    options.treeShaking = true;
    // Pure annotations for better DCE
    options.pure = ['console.log', 'console.debug'];
  },

  // Don't bundle workspace packages
  external: [
    /^@philjs\//,
    'tslib',
  ],

  // No shims for smaller bundles
  shims: false,

  // Skip node_modules
  skipNodeModulesBundle: true,
};

/**
 * Create package-specific config
 */
export function createConfig(
  entry: string | string[] | Record<string, string>,
  options?: Partial<Options>
): ReturnType<typeof defineConfig> {
  const entries = typeof entry === 'string'
    ? [entry]
    : Array.isArray(entry)
      ? entry
      : entry;

  return defineConfig({
    entry: entries,
    ...baseConfig,
    ...options,
    esbuildOptions(opts) {
      baseConfig.esbuildOptions?.(opts);
      options?.esbuildOptions?.(opts);
    },
  });
}

/**
 * Minimal config for fastest builds (dev mode)
 */
export function createDevConfig(entry: string | string[]): ReturnType<typeof defineConfig> {
  return defineConfig({
    entry: Array.isArray(entry) ? entry : [entry],
    format: ['esm'],
    dts: false, // Skip DTS in dev for speed
    sourcemap: 'inline',
    clean: false, // Don't clean in watch mode
    splitting: false, // Faster single file output
    target: 'esnext',
    treeshake: false, // Skip for speed
  });
}

export default baseConfig;

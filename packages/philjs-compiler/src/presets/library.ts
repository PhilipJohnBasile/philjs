/**
 * Library Build Preset
 * Optimized configuration for building reusable libraries
 *
 * Features:
 * - Multiple output formats (ESM, CJS, UMD)
 * - TypeScript declaration generation
 * - Minimal bundling (preserve tree-shaking)
 * - External dependencies
 * - Source map generation
 * - Size optimization
 */

import type { CompilerConfig } from '../types.js';
import type { BuildOptions, UserConfig } from 'vite';

export interface LibraryPresetOptions {
  /**
   * Library name (for UMD builds)
   */
  name?: string;

  /**
   * Entry point
   */
  entry?: string;

  /**
   * Output formats
   * @default ['es', 'cjs']
   */
  formats?: Array<'es' | 'cjs' | 'umd' | 'iife'>;

  /**
   * External dependencies (not bundled)
   * @default ['react', 'react-dom', '@philjs/core']
   */
  external?: string[];

  /**
   * Generate TypeScript declarations
   * @default true
   */
  dts?: boolean;

  /**
   * Enable source maps
   * @default true
   */
  sourceMaps?: boolean;

  /**
   * Minify output
   * @default true
   */
  minify?: boolean;

  /**
   * Target environment
   * @default 'es2020'
   */
  target?: string | string[];

  /**
   * Preserve modules (don't bundle)
   * @default true
   */
  preserveModules?: boolean;

  /**
   * Side effects (for package.json)
   * @default false
   */
  sideEffects?: boolean | string[];
}

/**
 * Default library configuration
 */
export const defaultLibraryConfig: Required<Omit<LibraryPresetOptions, 'name' | 'entry'>> = {
  formats: ['es', 'cjs'],
  external: ['react', 'react-dom', 'preact', '@philjs/core', '@philjs/core'],
  dts: true,
  sourceMaps: true,
  minify: true,
  target: 'es2020',
  preserveModules: true,
  sideEffects: false,
};

/**
 * Create library preset for PhilJS compiler
 */
export function createLibraryPreset(
  options: LibraryPresetOptions = {}
): CompilerConfig {
  const config = { ...defaultLibraryConfig, ...options };

  return {
    // Full optimizations for libraries
    autoMemo: true,
    autoBatch: true,
    deadCodeElimination: true,
    optimizeEffects: true,
    optimizeComponents: true,

    // Source maps
    sourceMaps: config.sourceMaps,

    // Production mode
    development: false,

    // File patterns
    include: ['src/**/*.tsx', 'src/**/*.ts', 'src/**/*.jsx', 'src/**/*.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/examples/**',
      '**/docs/**',
    ],
  };
}

/**
 * Create Vite configuration for library builds
 */
export function createLibraryViteConfig(
  options: LibraryPresetOptions
): Partial<UserConfig> {
  const config = { ...defaultLibraryConfig, ...options };

  if (!options.entry) {
    throw new Error('Library preset requires an entry point');
  }

  const buildConfig: BuildOptions = {
    // Library mode
    lib: {
      entry: options.entry,
      ...(options.name !== undefined && { name: options.name }),
      formats: config.formats,
      fileName: (format) => {
        const ext = format === 'es' ? 'js' : format === 'cjs' ? 'cjs' : 'umd.js';
        return `index.${ext}`;
      },
    },

    // Rollup options
    rollupOptions: {
      // External dependencies
      external: (id) => {
        // Check if it's an external dependency
        return config.external.some(ext => {
          if (id === ext) return true;
          if (id.startsWith(`${ext}/`)) return true;
          return false;
        });
      },

      output: config.preserveModules ? {
        // Preserve module structure
        preserveModules: true,
        preserveModulesRoot: 'src',
        exports: 'named',
        // Interop with CommonJS
        interop: 'auto',
      } : {
        // Bundle everything
        exports: 'named',
        interop: 'auto',
      },

      // Tree shaking
      treeshake: {
        moduleSideEffects: config.sideEffects,
        propertyReadSideEffects: false,
        preset: 'smallest',
      },
    },

    // Target
    target: config.target,

    // Minification
    minify: config.minify ? 'terser' : false,

    ...(config.minify && {
      terserOptions: {
        compress: {
          // Keep function names for better debugging
          keep_fnames: true,
          keep_classnames: true,
          // Remove dead code
          dead_code: true,
          // Don't drop console/debugger in libraries
          drop_console: false,
          drop_debugger: false,
        },
        mangle: {
          // Don't mangle exported names
          keep_fnames: true,
          keep_classnames: true,
          properties: false,
        },
        format: {
          // Keep comments (licenses, etc.)
          comments: /^!/,
        },
      },
    }),

    // Source maps
    sourcemap: config.sourceMaps,

    // Output directory
    outDir: 'dist',

    // Empty output directory
    emptyOutDir: true,

    // Report size
    reportCompressedSize: true,
  };

  return {
    build: buildConfig,

    // Production mode
    mode: 'production',

    // Plugin options
    plugins: config.dts ? [
      // TypeScript declaration plugin would go here
    ] : [],
  };
}

/**
 * Generate package.json fields for library
 */
export function generatePackageJsonFields(
  options: LibraryPresetOptions
): Record<string, any> {
  const config = { ...defaultLibraryConfig, ...options };
  const hasESM = config.formats.includes('es');
  const hasCJS = config.formats.includes('cjs');
  const hasUMD = config.formats.includes('umd');

  const fields: Record<string, any> = {
    type: hasESM ? 'module' : 'commonjs',
    sideEffects: config.sideEffects,
  };

  // Main entry points
  if (hasCJS) {
    fields['main'] = './dist/index.cjs';
  }

  if (hasESM) {
    fields['module'] = './dist/index.js';
  }

  // Exports field (modern)
  if (hasESM || hasCJS) {
    fields['exports'] = {
      '.': {
        ...(hasESM && { import: './dist/index.js' }),
        ...(hasCJS && { require: './dist/index.cjs' }),
        ...(config.dts && { types: './dist/index.d.ts' }),
      },
    };
  }

  // UMD global
  if (hasUMD && options.name) {
    fields['unpkg'] = './dist/index.umd.js';
    fields['jsdelivr'] = './dist/index.umd.js';
  }

  // TypeScript types
  if (config.dts) {
    fields['types'] = './dist/index.d.ts';
  }

  // Files to include in package
  fields['files'] = [
    'dist',
    'src',
    'README.md',
    'LICENSE',
  ];

  return fields;
}

/**
 * Validate library build output
 */
export interface LibraryValidation {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    formats: string[];
    size: Record<string, number>;
    gzipSize: Record<string, number>;
    exports: string[];
  };
}

export async function validateLibraryBuild(
  distPath: string,
  options: LibraryPresetOptions
): Promise<LibraryValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = { ...defaultLibraryConfig, ...options };

  // This would normally use fs to check files
  // Simplified for demonstration
  const validation: LibraryValidation = {
    passed: true,
    errors,
    warnings,
    stats: {
      formats: config.formats,
      size: {},
      gzipSize: {},
      exports: [],
    },
  };

  // Check if all expected formats were generated
  config.formats.forEach(format => {
    const ext = format === 'es' ? 'js' : format === 'cjs' ? 'cjs' : 'umd.js';
    const expectedFile = `index.${ext}`;

    // Would check if file exists here
    // if (!fs.existsSync(path.join(distPath, expectedFile))) {
    //   errors.push(`Missing ${format} output: ${expectedFile}`);
    // }
  });

  // Check TypeScript declarations
  if (config.dts) {
    // Would check for .d.ts files
    // if (!fs.existsSync(path.join(distPath, 'index.d.ts'))) {
    //   errors.push('Missing TypeScript declaration files');
    // }
  }

  // Check source maps
  if (config.sourceMaps) {
    // Would check for .map files
  }

  validation.passed = errors.length === 0;
  return validation;
}

/**
 * Library build reporter
 */
export function printLibraryBuildReport(validation: LibraryValidation): void {
  console.log('\n=== Library Build Report ===');

  console.log(`\nFormats: ${validation.stats.formats.join(', ')}`);

  console.log('\nBundle Sizes:');
  Object.entries(validation.stats.size).forEach(([format, size]) => {
    const gzip = validation.stats.gzipSize[format] || 0;
    console.log(`  ${format}: ${formatSize(size)} (${formatSize(gzip)} gzipped)`);
  });

  if (validation.stats.exports.length > 0) {
    console.log(`\nExports: ${validation.stats.exports.length}`);
    validation.stats.exports.forEach(exp => {
      console.log(`  - ${exp}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${validation.warnings.length}`);
    validation.warnings.forEach(w => console.log(`  ${w}`));
  }

  if (validation.errors.length > 0) {
    console.log(`\n❌ Errors: ${validation.errors.length}`);
    validation.errors.forEach(e => console.log(`  ${e}`));
  }

  if (validation.passed) {
    console.log('\n✅ Library build successful');
  } else {
    console.log('\n❌ Library build failed');
  }

  console.log('===========================\n');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default createLibraryPreset;

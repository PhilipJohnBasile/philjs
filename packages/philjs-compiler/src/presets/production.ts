/**
 * Production Build Preset
 * Optimized configuration for production deployments
 *
 * Features:
 * - Maximum minification
 * - Aggressive tree shaking
 * - Optimized chunk splitting
 * - Source maps for debugging
 * - Asset optimization
 * - Performance budgets
 */

import type { CompilerConfig } from '../types';
import type { Plugin, BuildOptions, UserConfig } from 'vite';

export interface ProductionPresetOptions {
  /**
   * Enable source maps (recommended for error tracking)
   * @default true
   */
  sourceMaps?: boolean;

  /**
   * Minification level
   * @default 'aggressive'
   */
  minify?: 'none' | 'basic' | 'aggressive';

  /**
   * Enable code splitting
   * @default true
   */
  codeSplitting?: boolean;

  /**
   * Target browsers (for polyfills and transpilation)
   * @default ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
   */
  target?: string | string[];

  /**
   * Performance budgets (in bytes)
   */
  budgets?: {
    /** Maximum initial bundle size */
    maxInitial?: number;
    /** Maximum chunk size */
    maxChunk?: number;
    /** Maximum total size */
    maxTotal?: number;
  };

  /**
   * Asset optimization settings
   */
  assets?: {
    /** Inline assets smaller than this (bytes) */
    inlineLimit?: number;
    /** Enable image optimization */
    optimizeImages?: boolean;
    /** Enable SVG optimization */
    optimizeSvg?: boolean;
    /** Enable font subsetting */
    subsetFonts?: boolean;
  };

  /**
   * Preload/prefetch hints
   */
  hints?: {
    /** Enable preload for critical chunks */
    preload?: boolean;
    /** Enable prefetch for lazy chunks */
    prefetch?: boolean;
  };

  /**
   * Enable bundle analysis report
   * @default true
   */
  analyze?: boolean;
}

/**
 * Default production configuration
 */
export const defaultProductionConfig: Required<ProductionPresetOptions> = {
  sourceMaps: true,
  minify: 'aggressive',
  codeSplitting: true,
  target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  budgets: {
    maxInitial: 100 * 1024, // 100 KB
    maxChunk: 50 * 1024,    // 50 KB
    maxTotal: 500 * 1024,   // 500 KB
  },
  assets: {
    inlineLimit: 4096,      // 4 KB
    optimizeImages: true,
    optimizeSvg: true,
    subsetFonts: true,
  },
  hints: {
    preload: true,
    prefetch: true,
  },
  analyze: true,
};

/**
 * Create production preset for PhilJS compiler
 */
export function createProductionPreset(
  options: ProductionPresetOptions = {}
): CompilerConfig {
  const config = { ...defaultProductionConfig, ...options };

  return {
    // Compiler optimizations
    autoMemo: true,
    autoBatch: true,
    deadCodeElimination: true,
    optimizeEffects: true,
    optimizeComponents: true,

    // Source maps (for error tracking in production)
    sourceMaps: config.sourceMaps,

    // Production mode
    development: false,

    // File patterns
    include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',
      '**/__mocks__/**',
    ],
  };
}

/**
 * Create Vite configuration for production builds
 */
export function createProductionViteConfig(
  options: ProductionPresetOptions = {}
): Partial<UserConfig> {
  const config = { ...defaultProductionConfig, ...options };

  const buildConfig: BuildOptions = {
    // Target modern browsers
    target: config.target,

    // Minification
    minify: config.minify === 'none' ? false : 'terser',

    terserOptions: config.minify === 'aggressive' ? {
      compress: {
        // Remove console and debugger in production
        drop_console: true,
        drop_debugger: true,
        // Remove dead code
        dead_code: true,
        // Evaluate constant expressions
        evaluate: true,
        // Inline single-use functions
        inline: 2,
        // Join consecutive var statements
        join_vars: true,
        // Optimize loops
        loops: true,
        // Remove unused code
        unused: true,
        // Remove unreachable code
        passes: 2,
      },
      mangle: {
        // Mangle property names for maximum compression
        properties: {
          // Don't mangle React/PhilJS internals
          regex: /^_(?!_)/,
        },
        // Top-level names
        toplevel: true,
      },
      format: {
        // Remove comments
        comments: false,
        // Use ES6+ syntax when possible
        ecma: 2020,
      },
    } : {
      compress: {
        drop_debugger: true,
        dead_code: true,
        unused: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },

    // Source maps
    sourcemap: config.sourceMaps ? 'hidden' : false,

    // Chunk splitting strategy
    rollupOptions: {
      output: config.codeSplitting ? {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Split large libraries into separate chunks
            if (id.includes('philjs-core')) {
              return 'vendor-philjs';
            }
            if (id.includes('react') || id.includes('preact')) {
              return 'vendor-framework';
            }
            // Other node_modules go into vendor chunk
            return 'vendor';
          }

          // Component chunks (lazy loaded routes)
          if (id.includes('/routes/') || id.includes('/pages/')) {
            const match = id.match(/\/(?:routes|pages)\/(.+?)\//);
            if (match) {
              return `route-${match[1]}`;
            }
          }

          // Utility chunks
          if (id.includes('/utils/') || id.includes('/helpers/')) {
            return 'utils';
          }
        },

        // Naming patterns for better debugging
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      } : undefined,

      // Tree shaking
      treeshake: {
        // Aggressive tree shaking
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        // Assume all imports are side-effect free unless marked
        preset: 'smallest',
      },
    },

    // Asset handling
    assetsInlineLimit: config.assets.inlineLimit,

    // Report compressed size
    reportCompressedSize: true,

    // Chunk size warning limit
    chunkSizeWarningLimit: config.budgets.maxChunk! / 1024, // Convert to KB
  };

  return {
    build: buildConfig,

    // Optimize dependencies
    optimizeDeps: {
      include: ['philjs-core'],
      exclude: [],
    },

    // Production-specific settings
    mode: 'production',

    // Clear screen in production builds
    clearScreen: false,
  };
}

/**
 * Generate module preload directives for critical chunks
 */
export function generatePreloadHints(chunks: string[]): string {
  return chunks
    .map(chunk => `<link rel="modulepreload" href="${chunk}" />`)
    .join('\n');
}

/**
 * Generate prefetch directives for lazy chunks
 */
export function generatePrefetchHints(chunks: string[]): string {
  return chunks
    .map(chunk => `<link rel="prefetch" href="${chunk}" />`)
    .join('\n');
}

/**
 * Check if build meets performance budgets
 */
export function checkPerformanceBudgets(
  stats: { size: number; gzipSize: number; name: string }[],
  budgets: ProductionPresetOptions['budgets'] = {}
): {
  passed: boolean;
  violations: Array<{ type: string; limit: number; actual: number }>;
} {
  const config = { ...defaultProductionConfig.budgets, ...budgets };
  const violations: Array<{ type: string; limit: number; actual: number }> = [];

  // Check initial bundle size
  const initialBundles = stats.filter(s => s.name.includes('index') || s.name.includes('main'));
  const initialSize = initialBundles.reduce((sum, s) => sum + s.gzipSize, 0);

  if (config.maxInitial && initialSize > config.maxInitial) {
    violations.push({
      type: 'initial',
      limit: config.maxInitial,
      actual: initialSize,
    });
  }

  // Check individual chunk sizes
  stats.forEach(stat => {
    if (config.maxChunk && stat.gzipSize > config.maxChunk) {
      violations.push({
        type: `chunk:${stat.name}`,
        limit: config.maxChunk,
        actual: stat.gzipSize,
      });
    }
  });

  // Check total size
  const totalSize = stats.reduce((sum, s) => sum + s.gzipSize, 0);
  if (config.maxTotal && totalSize > config.maxTotal) {
    violations.push({
      type: 'total',
      limit: config.maxTotal,
      actual: totalSize,
    });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Format size for display
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(original: number, compressed: number): string {
  const ratio = ((original - compressed) / original) * 100;
  return `${ratio.toFixed(1)}%`;
}

export default createProductionPreset;

/**
 * Development Build Preset
 * Optimized configuration for development workflow
 *
 * Features:
 * - Fast rebuilds with caching
 * - Detailed source maps
 * - HMR optimization
 * - Enhanced error messages
 * - Performance profiling
 * - No minification (for readability)
 */

import type { CompilerConfig } from '../types.js';
import type { UserConfig, BuildOptions } from 'vite';

export interface DevelopmentPresetOptions {
  /**
   * Enable source maps
   * @default true
   */
  sourceMaps?: boolean;

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Enable HMR state preservation
   * @default true
   */
  hmrStatePreservation?: boolean;

  /**
   * Enable enhanced error overlay
   * @default true
   */
  enhancedErrors?: boolean;

  /**
   * Enable performance profiling
   * @default true
   */
  profiling?: boolean;

  /**
   * Enable build caching
   * @default true
   */
  cache?: boolean;

  /**
   * Port for dev server
   * @default 3000
   */
  port?: number;

  /**
   * Enable HTTPS
   * @default false
   */
  https?: boolean;

  /**
   * Open browser on start
   * @default true
   */
  open?: boolean;
}

/**
 * Default development configuration
 */
export const defaultDevelopmentConfig: Required<DevelopmentPresetOptions> = {
  sourceMaps: true,
  verbose: false,
  hmrStatePreservation: true,
  enhancedErrors: true,
  profiling: true,
  cache: true,
  port: 3000,
  https: false,
  open: true,
};

/**
 * Create development preset for PhilJS compiler
 */
export function createDevelopmentPreset(
  options: DevelopmentPresetOptions = {}
): CompilerConfig {
  const config = { ...defaultDevelopmentConfig, ...options };

  return {
    // Compiler optimizations (some disabled for faster builds)
    autoMemo: true,
    autoBatch: true,
    deadCodeElimination: false, // Disabled in dev for faster builds
    optimizeEffects: true,
    optimizeComponents: false,  // Disabled in dev for faster builds

    // Detailed source maps for debugging
    sourceMaps: config.sourceMaps,

    // Development mode
    development: true,

    // File patterns
    include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
  };
}

/**
 * Create Vite configuration for development builds
 */
export function createDevelopmentViteConfig(
  options: DevelopmentPresetOptions = {}
): Partial<UserConfig> {
  const config = { ...defaultDevelopmentConfig, ...options };

  return {
    // Development server configuration
    server: {
      port: config.port,
      open: config.open,
      ...(config.https && { https: {} }),

      // HMR configuration
      hmr: {
        // Use WebSocket for HMR
        protocol: config.https ? 'wss' : 'ws',
        // Timeout for HMR updates
        timeout: 30000,
      },

      // CORS for development
      cors: true,

      // File watching
      watch: {
        // Ignore node_modules for better performance
        ignored: ['**/node_modules/**', '**/dist/**'],
      },
    },

    // Build configuration (for dev builds)
    build: {
      // No minification in development
      minify: false,

      // Detailed source maps
      sourcemap: config.sourceMaps ? 'inline' : false,

      // Faster builds in development
      target: 'esnext',

      // Rollup options
      rollupOptions: {
        // No tree shaking in development (faster builds)
        treeshake: false,

        output: {
          // Preserve module names for better debugging
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },

      // Report size in development
      reportCompressedSize: false, // Skip in dev for speed

      // Higher chunk size limit in development
      chunkSizeWarningLimit: 1000,
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['philjs-core'],
      exclude: [],

      // Force re-optimization on changes
      force: false,
    },

    // Development mode
    mode: 'development',

    // Clear screen on updates
    clearScreen: config.verbose ? false : true,

    // Log level
    logLevel: config.verbose ? 'info' : 'warn',
  };
}

/**
 * Development performance metrics
 */
export interface DevMetrics {
  /** HMR update time (ms) */
  hmrTime: number;
  /** Full rebuild time (ms) */
  rebuildTime: number;
  /** Cache hit rate (%) */
  cacheHitRate: number;
  /** Number of modules */
  moduleCount: number;
  /** Memory usage (MB) */
  memoryUsage: number;
}

/**
 * Track development performance metrics
 */
export class DevPerformanceTracker {
  private metrics: DevMetrics[] = [];
  private startTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(type: 'hmr' | 'rebuild'): number {
    const duration = performance.now() - this.startTime;

    // Store metric
    if (type === 'hmr') {
      this.metrics.push({
        hmrTime: duration,
        rebuildTime: 0,
        cacheHitRate: 0,
        moduleCount: 0,
        memoryUsage: this.getMemoryUsage(),
      });
    } else {
      this.metrics.push({
        hmrTime: 0,
        rebuildTime: duration,
        cacheHitRate: 0,
        moduleCount: 0,
        memoryUsage: this.getMemoryUsage(),
      });
    }

    return duration;
  }

  getMetrics(): DevMetrics[] {
    return this.metrics;
  }

  getAverageHmrTime(): number {
    const hmrMetrics = this.metrics.filter(m => m.hmrTime > 0);
    if (hmrMetrics.length === 0) return 0;
    return hmrMetrics.reduce((sum, m) => sum + m.hmrTime, 0) / hmrMetrics.length;
  }

  getAverageRebuildTime(): number {
    const rebuildMetrics = this.metrics.filter(m => m.rebuildTime > 0);
    if (rebuildMetrics.length === 0) return 0;
    return rebuildMetrics.reduce((sum, m) => sum + m.rebuildTime, 0) / rebuildMetrics.length;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / (1024 * 1024);
    }
    return 0;
  }

  reset(): void {
    this.metrics = [];
  }

  printSummary(): void {
    if (this.metrics.length === 0) {
      console.log('[dev] No performance metrics available');
      return;
    }

    console.log('\n=== Development Performance Summary ===');
    console.log(`Average HMR time: ${this.getAverageHmrTime().toFixed(2)}ms`);
    console.log(`Average rebuild time: ${this.getAverageRebuildTime().toFixed(2)}ms`);
    console.log(`Total updates: ${this.metrics.length}`);
    console.log(`Memory usage: ${this.getMemoryUsage().toFixed(2)} MB`);
    console.log('=====================================\n');
  }
}

/**
 * Enhanced error formatter for development
 */
export function formatDevError(error: Error): string {
  const stack = error.stack || '';
  const lines = stack.split('\n');

  // Format stack trace with colors (if terminal supports it)
  const formatted = lines.map((line, idx) => {
    if (idx === 0) {
      // Error message
      return `\n❌ ${line}\n`;
    }

    // Stack frame
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      const [, fn, file, lineNum, col] = match;
      return `   at ${fn}\n      ${file}:${lineNum}:${col}`;
    }

    return `   ${line.trim()}`;
  });

  return formatted.join('\n');
}

/**
 * Development build reporter
 */
export interface DevBuildReport {
  /** Build duration (ms) */
  duration: number;
  /** Modules processed */
  modules: number;
  /** Cache hits */
  cacheHits: number;
  /** Warnings */
  warnings: string[];
  /** Errors */
  errors: string[];
}

export function printDevBuildReport(report: DevBuildReport): void {
  console.log('\n=== Development Build Complete ===');
  console.log(`Duration: ${report.duration.toFixed(2)}ms`);
  console.log(`Modules: ${report.modules}`);
  console.log(`Cache hits: ${report.cacheHits} (${((report.cacheHits / report.modules) * 100).toFixed(1)}%)`);

  if (report.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${report.warnings.length}`);
    report.warnings.forEach(w => console.log(`   ${w}`));
  }

  if (report.errors.length > 0) {
    console.log(`\n❌ Errors: ${report.errors.length}`);
    report.errors.forEach(e => console.log(`   ${e}`));
  }

  console.log('==================================\n');
}

export default createDevelopmentPreset;

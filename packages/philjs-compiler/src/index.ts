/**
 * PhilJS Compiler - Automatic optimization for PhilJS applications
 *
 * Main entry point for the compiler package.
 * Exports all public APIs for use in build tools.
 */

import { Optimizer } from './optimizer';
import { Analyzer } from './analyzer';
import { DeadCodeEliminator } from './dead-code-eliminator';
import { CodeSplitter } from './code-splitter';
import type {
  CompilerConfig,
  TransformResult,
  FileAnalysis,
  ComponentAnalysis,
  ReactiveBinding,
  CompilerPlugin,
  OptimizationOpportunity
} from './types';
import type { DeadCodeReport } from './dead-code-eliminator';
import type { CodeSplitReport, CodeSplitBoundary } from './code-splitter';

// Re-export types
export type {
  CompilerConfig,
  TransformResult,
  FileAnalysis,
  ComponentAnalysis,
  ReactiveBinding,
  CompilerPlugin,
  OptimizationOpportunity,
  DeadCodeReport,
  CodeSplitReport,
  CodeSplitBoundary,
};

// Re-export main classes
export { Optimizer, Analyzer, DeadCodeEliminator, CodeSplitter };

/**
 * Creates a new PhilJS compiler instance with the given configuration
 *
 * @param config - Compiler configuration options
 * @returns An optimizer instance ready to transform code
 *
 * @example
 * ```typescript
 * import { createCompiler } from 'philjs-compiler';
 *
 * const compiler = createCompiler({
 *   autoMemo: true,
 *   autoBatch: true,
 *   development: false
 * });
 *
 * const result = compiler.optimize(code, filePath);
 * ```
 */
export function createCompiler(config: CompilerConfig = {}): Optimizer {
  return new Optimizer(config);
}

/**
 * Analyzes PhilJS code without transforming it
 *
 * Useful for:
 * - IDE integrations (show optimization suggestions)
 * - Linting tools (detect anti-patterns)
 * - Documentation generation
 *
 * @param code - Source code to analyze
 * @param filePath - Path to the file being analyzed
 * @returns Analysis results with optimization opportunities
 *
 * @example
 * ```typescript
 * import { analyzeCode } from 'philjs-compiler';
 *
 * const analysis = analyzeCode(code, 'src/App.tsx');
 *
 * console.log('Optimization opportunities:', analysis.optimizationOpportunities);
 * console.log('Components found:', analysis.components);
 * console.log('Reactive bindings:', analysis.reactiveBindings);
 * ```
 */
export function analyzeCode(code: string, filePath: string): FileAnalysis {
  const analyzer = new Analyzer();
  return analyzer.analyze(code, filePath);
}

/**
 * Transforms PhilJS code with automatic optimizations
 *
 * Applies:
 * - Auto-memoization for expensive computations
 * - Auto-batching for consecutive updates
 * - Dead code elimination for unused bindings
 * - Effect optimizations
 * - Component optimizations
 *
 * @param code - Source code to transform
 * @param filePath - Path to the file being transformed
 * @param config - Compiler configuration options
 * @returns Transformed code with optional source maps
 *
 * @example
 * ```typescript
 * import { transform } from 'philjs-compiler';
 *
 * const result = transform(code, 'src/App.tsx', {
 *   autoMemo: true,
 *   sourceMaps: true
 * });
 *
 * console.log(result.code);
 * if (result.map) {
 *   console.log('Source map generated');
 * }
 * ```
 */
export function transform(
  code: string,
  filePath: string,
  config: CompilerConfig = {}
): TransformResult {
  const optimizer = new Optimizer(config);
  return optimizer.optimize(code, filePath);
}

/**
 * Default compiler configuration
 *
 * Used when no configuration is provided to createCompiler() or transform()
 */
export const defaultConfig: CompilerConfig = {
  autoMemo: true,
  autoBatch: true,
  deadCodeElimination: true,
  optimizeEffects: true,
  optimizeComponents: true,
  sourceMaps: true,
  development: false,
  include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
  plugins: []
};

/**
 * Gets the default configuration, optionally merged with custom options
 *
 * @param overrides - Custom configuration to merge with defaults
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * import { getDefaultConfig } from 'philjs-compiler';
 *
 * const config = getDefaultConfig({
 *   development: true,
 *   autoMemo: false
 * });
 * ```
 */
export function getDefaultConfig(overrides: Partial<CompilerConfig> = {}): CompilerConfig {
  return {
    ...defaultConfig,
    ...overrides,
    include: overrides.include || defaultConfig.include,
    exclude: overrides.exclude || defaultConfig.exclude,
    plugins: [...(defaultConfig.plugins || []), ...(overrides.plugins || [])]
  };
}

/**
 * Validates a compiler configuration
 *
 * Checks for:
 * - Invalid options
 * - Conflicting settings
 * - Missing required values
 *
 * @param config - Configuration to validate
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * import { validateConfig } from 'philjs-compiler';
 *
 * const errors = validateConfig({
 *   autoMemo: true,
 *   include: ['invalid**pattern']
 * });
 *
 * if (errors.length > 0) {
 *   console.error('Configuration errors:', errors);
 * }
 * ```
 */
export function validateConfig(config: CompilerConfig): string[] {
  const errors: string[] = [];

  // Validate include/exclude patterns
  if (config.include) {
    for (const pattern of config.include) {
      if (typeof pattern !== 'string') {
        errors.push(`Invalid include pattern: ${pattern} (must be string)`);
      }
    }
  }

  if (config.exclude) {
    for (const pattern of config.exclude) {
      if (typeof pattern !== 'string') {
        errors.push(`Invalid exclude pattern: ${pattern} (must be string)`);
      }
    }
  }

  // Validate plugins
  if (config.plugins) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (!plugin.name) {
        errors.push(`Plugin at index ${i} is missing required 'name' field`);
      }
      if (plugin.transform && typeof plugin.transform !== 'function') {
        errors.push(`Plugin '${plugin.name}' has invalid 'transform' (must be function)`);
      }
      if (plugin.analyze && typeof plugin.analyze !== 'function') {
        errors.push(`Plugin '${plugin.name}' has invalid 'analyze' (must be function)`);
      }
    }
  }

  return errors;
}

/**
 * Version of the PhilJS compiler
 */
export const version = '0.1.0';

// Re-export HMR utilities for development
export {
  setupHMRClient,
  getHMRClientStats,
  resetHMRClientStats,
} from './hmr-client';

export {
  showHMRErrorOverlay,
  hideHMRErrorOverlay,
  getHMRErrorHistory,
  clearHMRErrorHistory,
  type HMRErrorType,
} from './hmr-overlay';

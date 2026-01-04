/**
 * PhilJS Compiler - Automatic optimization for PhilJS applications
 *
 * Main entry point for the compiler package.
 * Exports all public APIs for use in build tools.
 */
import { Optimizer } from './optimizer.js';
import { Analyzer } from './analyzer.js';
import { DeadCodeEliminator } from './dead-code-eliminator.js';
import { CodeSplitter } from './code-splitter.js';
import type { CompilerConfig, TransformResult, FileAnalysis, ComponentAnalysis, ReactiveBinding, CompilerPlugin, OptimizationOpportunity } from './types.js';
import type { DeadCodeReport } from './dead-code-eliminator.js';
import type { CodeSplitReport, CodeSplitBoundary } from './code-splitter.js';
export type { CompilerConfig, TransformResult, FileAnalysis, ComponentAnalysis, ReactiveBinding, CompilerPlugin, OptimizationOpportunity, DeadCodeReport, CodeSplitReport, CodeSplitBoundary, };
export type { BundleMetrics, DependencyGraph, ChunkCandidate, } from './analyzer.js';
export { Optimizer, Analyzer, DeadCodeEliminator, CodeSplitter };
export * from './presets/index.js';
/**
 * Creates a new PhilJS compiler instance with the given configuration
 *
 * @param config - Compiler configuration options
 * @returns An optimizer instance ready to transform code
 *
 * @example
 * ```typescript
 * import { createCompiler } from '@philjs/compiler';
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
export declare function createCompiler(config?: CompilerConfig): Optimizer;
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
 * import { analyzeCode } from '@philjs/compiler';
 *
 * const analysis = analyzeCode(code, 'src/App.tsx');
 *
 * console.log('Optimization opportunities:', analysis.optimizationOpportunities);
 * console.log('Components found:', analysis.components);
 * console.log('Reactive bindings:', analysis.reactiveBindings);
 * ```
 */
export declare function analyzeCode(code: string, filePath: string): FileAnalysis;
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
 * import { transform } from '@philjs/compiler';
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
export declare function transform(code: string, filePath: string, config?: CompilerConfig): TransformResult;
/**
 * Default compiler configuration
 *
 * Used when no configuration is provided to createCompiler() or transform()
 */
export declare const defaultConfig: CompilerConfig;
/**
 * Gets the default configuration, optionally merged with custom options
 *
 * @param overrides - Custom configuration to merge with defaults
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * import { getDefaultConfig } from '@philjs/compiler';
 *
 * const config = getDefaultConfig({
 *   development: true,
 *   autoMemo: false
 * });
 * ```
 */
export declare function getDefaultConfig(overrides?: Partial<CompilerConfig>): CompilerConfig;
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
 * import { validateConfig } from '@philjs/compiler';
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
export declare function validateConfig(config: CompilerConfig): string[];
/**
 * Version of the PhilJS compiler
 */
export declare const version = "0.1.0";
export { setupHMRClient, getHMRClientStats, resetHMRClientStats, } from './hmr-client.js';
export { showHMRErrorOverlay, hideHMRErrorOverlay, getHMRErrorHistory, clearHMRErrorHistory, type HMRErrorType, } from './hmr-overlay.js';
//# sourceMappingURL=index.d.ts.map
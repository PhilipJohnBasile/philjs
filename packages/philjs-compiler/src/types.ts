/**
 * PhilJS Compiler Types
 */

import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

// ============================================================================
// Configuration
// ============================================================================

export interface CompilerConfig {
  /** Enable automatic memoization */
  autoMemo?: boolean;
  /** Enable automatic batching optimization */
  autoBatch?: boolean;
  /** Enable dead code elimination */
  deadCodeElimination?: boolean;
  /** Enable effect optimization */
  optimizeEffects?: boolean;
  /** Enable component optimization */
  optimizeComponents?: boolean;
  /** Source maps */
  sourceMaps?: boolean;
  /** Development mode (adds debugging info) */
  development?: boolean;
  /** Files to include (glob patterns) */
  include?: string[];
  /** Files to exclude (glob patterns) */
  exclude?: string[];
  /** Custom optimization passes */
  plugins?: CompilerPlugin[];
}

export const defaultConfig: Required<CompilerConfig> = {
  autoMemo: true,
  autoBatch: true,
  deadCodeElimination: true,
  optimizeEffects: true,
  optimizeComponents: true,
  sourceMaps: true,
  development: process.env['NODE_ENV'] !== 'production',
  include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
  exclude: ['**/node_modules/**', '**/dist/**'],
  plugins: [],
};

// ============================================================================
// Analysis Types
// ============================================================================

export interface ReactiveBinding {
  /** Name of the binding */
  name: string;
  /** Type of reactive primitive */
  type: 'signal' | 'memo' | 'effect' | 'linkedSignal' | 'resource';
  /** AST node */
  node: t.Node;
  /** Scope where this binding exists */
  scope: string;
  /** Dependencies (other signals this reads) */
  dependencies: string[];
  /** Dependents (what reads this signal) */
  dependents: string[];
  /** Is this binding used? */
  isUsed: boolean;
  /** Location in source */
  loc?: t.SourceLocation | null;
}

export interface ComponentAnalysis {
  /** Component name */
  name: string;
  /** Props that are reactive */
  reactiveProps: string[];
  /** Signals created in component */
  signals: ReactiveBinding[];
  /** Memos in component */
  memos: ReactiveBinding[];
  /** Effects in component */
  effects: ReactiveBinding[];
  /** JSX expressions with reactive reads */
  reactiveJSX: ReactiveJSXExpression[];
  /** Can this component be memoized? */
  canMemoize: boolean;
  /** Reasons why memoization isn't possible */
  memoBlockers: string[];
  /** Optimization suggestions */
  suggestions: OptimizationSuggestion[];
}

export interface ReactiveJSXExpression {
  /** The expression */
  expression: string;
  /** Signals read in this expression */
  signalsRead: string[];
  /** Location in JSX */
  jsxPath: string;
  /** Is this already optimized? */
  isOptimized: boolean;
}

export interface OptimizationSuggestion {
  type: 'memo' | 'batch' | 'lazy' | 'split' | 'inline';
  description: string;
  impact: 'high' | 'medium' | 'low';
  automatic: boolean;
}

export interface FileAnalysis {
  /** File path */
  filePath: string;
  /** All reactive bindings in file */
  bindings: ReactiveBinding[];
  /** Components in file */
  components: ComponentAnalysis[];
  /** Imports of PhilJS primitives */
  imports: PhilJSImport[];
  /** Optimization opportunities */
  optimizations: OptimizationOpportunity[];
  /** Warnings */
  warnings: CompilerWarning[];
}

export interface PhilJSImport {
  name: string;
  alias?: string;
  source: '@philjs/core' | 'philjs' | string;
}

export interface OptimizationOpportunity {
  type: 'auto-memo' | 'auto-batch' | 'dead-code' | 'effect-cleanup' | 'component-split';
  location: t.SourceLocation | null;
  description: string;
  transform: () => void;
}

export interface CompilerWarning {
  type: 'performance' | 'correctness' | 'deprecation';
  message: string;
  location?: t.SourceLocation | null;
  suggestion?: string;
}

// ============================================================================
// Transformation Types
// ============================================================================

export interface TransformResult {
  /** Transformed code */
  code: string;
  /** Source map (compatible with Rollup/Vite) */
  map?: any;
  /** Analysis data */
  analysis?: FileAnalysis;
  /** Applied optimizations */
  optimizations: string[];
  /** Warnings */
  warnings?: CompilerWarning[];
}

export interface CompilerPlugin {
  name: string;
  /** Run during analysis phase */
  analyze?: (analysis: FileAnalysis) => FileAnalysis;
  /** Run during transform phase */
  transform?: (path: NodePath, analysis: FileAnalysis) => void;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry {
  hash: string;
  result: TransformResult;
  timestamp: number;
}

export interface CompilerCache {
  get(key: string): CacheEntry | undefined;
  set(key: string, entry: CacheEntry): void;
  has(key: string): boolean;
  clear(): void;
}

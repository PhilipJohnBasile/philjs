/**
 * PhilJS Compiler - Dependency Analyzer
 * Analyzes code to detect reactive dependencies and optimization opportunities
 */

import { parse } from '@babel/parser';
import type { NodePath, TraverseOptions } from '@babel/traverse';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';

// Handle both ESM and CJS exports - babel traverse exports default as the traverse function
const traverse: (ast: t.Node, opts?: TraverseOptions) => void = (_traverse as unknown as { default: (ast: t.Node, opts?: TraverseOptions) => void }).default;
import type {
  FileAnalysis,
  ReactiveBinding,
  ComponentAnalysis,
  PhilJSImport,
  OptimizationOpportunity,
  CompilerWarning,
  ReactiveJSXExpression,
  OptimizationSuggestion,
  CompilerConfig,
} from './types.js';

const PHILJS_SOURCES = ['@philjs/core', 'philjs', '@philjs/core'];
const REACTIVE_PRIMITIVES = ['signal', 'memo', 'effect', 'linkedSignal', 'resource', 'batch'];

export class Analyzer {
  private config: CompilerConfig;

  constructor(config: CompilerConfig = {}) {
    this.config = config;
  }

  /**
   * Analyze a source file for reactive patterns
   */
  analyze(code: string, filePath: string): FileAnalysis {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      sourceFilename: filePath,
    });

    const analysis: FileAnalysis = {
      filePath,
      bindings: [],
      components: [],
      imports: [],
      optimizations: [],
      warnings: [],
    };

    // First pass: collect imports
    this.collectImports(ast, analysis);

    // Second pass: collect reactive bindings
    this.collectBindings(ast, analysis);

    // Third pass: analyze components
    this.analyzeComponents(ast, analysis);

    // Fourth pass: find optimization opportunities
    this.findOptimizations(ast, analysis);

    // Fifth pass: generate warnings
    this.generateWarnings(analysis);

    return analysis;
  }

  /**
   * Collect PhilJS imports
   */
  private collectImports(ast: t.File, analysis: FileAnalysis): void {
    traverse(ast, {
      ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
        const source = path.node.source.value;

        if (PHILJS_SOURCES.some((s: string) => source.includes(s))) {
          path.node.specifiers.forEach((spec: t.ImportDeclaration['specifiers'][number]) => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              const importEntry: PhilJSImport = {
                name: spec.imported.name,
                source,
              };
              if (spec.local.name !== spec.imported.name) {
                importEntry.alias = spec.local.name;
              }
              analysis.imports.push(importEntry);
            }
          });
        }
      },
    });
  }

  /**
   * Collect all reactive bindings
   */
  private collectBindings(ast: t.File, analysis: FileAnalysis): void {
    const importedNames = new Map<string, string>();

    // Map imported names to their original names
    analysis.imports.forEach((imp: PhilJSImport) => {
      importedNames.set(imp.alias || imp.name, imp.name);
    });

    traverse(ast, {
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        const init = path.node.init;

        if (t.isCallExpression(init)) {
          const callee = init.callee;
          let calleeName: string | null = null;

          if (t.isIdentifier(callee)) {
            calleeName = importedNames.get(callee.name) || callee.name;
          }

          if (calleeName && REACTIVE_PRIMITIVES.includes(calleeName)) {
            const binding = this.createReactiveBinding(
              path.node,
              calleeName as ReactiveBinding['type'],
              path.scope.uid.toString()
            );

            if (binding) {
              analysis.bindings.push(binding);
            }
          }
        }
      },
    });

    // Analyze dependencies between bindings
    this.analyzeDependencies(ast, analysis);
  }

  /**
   * Create a reactive binding from a variable declarator
   */
  private createReactiveBinding(
    node: t.VariableDeclarator,
    type: ReactiveBinding['type'],
    scope: string
  ): ReactiveBinding | null {
    if (!t.isIdentifier(node.id)) return null;

    const binding: ReactiveBinding = {
      name: node.id.name,
      type,
      node,
      scope,
      dependencies: [],
      dependents: [],
      isUsed: false,
    };
    if (node.loc !== undefined) {
      binding.loc = node.loc;
    }
    return binding;
  }

  /**
   * Analyze dependencies between reactive bindings
   */
  private analyzeDependencies(ast: t.File, analysis: FileAnalysis): void {
    const bindingIndex = new Map(analysis.bindings.map((b: ReactiveBinding) => [b.name, b] as const));
    const bindingNames = new Set(bindingIndex.keys());

    traverse(ast, {
      CallExpression: (path: NodePath<t.CallExpression>) => {
        // Find signal reads (calls like `count()`)
        if (t.isIdentifier(path.node.callee) && bindingNames.has(path.node.callee.name)) {
          const signalName = path.node.callee.name;
          const binding = bindingIndex.get(signalName);

          if (binding) {
            binding.isUsed = true;

            // Find containing reactive context
            const containingBinding = this.findContainingReactiveContext(path, bindingIndex);
            if (containingBinding && containingBinding.name !== signalName) {
              containingBinding.dependencies.push(signalName);
              binding.dependents.push(containingBinding.name);
            }
          }
        }
      },
    });
  }

  /**
   * Find the containing reactive context (memo, effect, etc.)
   */
  private findContainingReactiveContext(
    path: NodePath,
    bindingIndex: Map<string, ReactiveBinding>
  ): ReactiveBinding | null {
    let current = path.parentPath;

    while (current) {
      if (t.isCallExpression(current.node)) {
        const callee = current.node.callee;

        if (t.isIdentifier(callee)) {
          const binding = bindingIndex.get(callee.name);
          if (binding) return binding;
        }
      }

      if (!current) break;

      if (t.isVariableDeclarator(current.node) && t.isIdentifier(current.node.id)) {
        const node = current.node as t.VariableDeclarator;
        const id = node.id as t.Identifier;
        const binding = bindingIndex.get(id.name);
        if (binding) return binding;
      }

      current = current.parentPath;
    }

    return null;
  }

  /**
   * Analyze components for optimization opportunities
   */
  private analyzeComponents(ast: t.File, analysis: FileAnalysis): void {
    traverse(ast, {
      FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
        if (this.isComponent(path)) {
          const comp = this.analyzeComponent(path, analysis);
          if (comp) analysis.components.push(comp);
        }
      },
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        if (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init)) {
          if (this.isComponentDeclarator(path)) {
            const comp = this.analyzeComponentDeclarator(path, analysis);
            if (comp) analysis.components.push(comp);
          }
        }
      },
    });
  }

  /**
   * Check if a function is a React-style component
   */
  private isComponent(path: NodePath<t.FunctionDeclaration>): boolean {
    const name = path.node.id?.name;
    if (!name) return false;

    // Components start with uppercase
    if (!/^[A-Z]/.test(name)) return false;

    // Check for JSX return
    let hasJSX = false;
    path.traverse({
      JSXElement: () => { hasJSX = true; },
      JSXFragment: () => { hasJSX = true; },
    });

    return hasJSX;
  }

  /**
   * Check if a variable declarator is a component
   */
  private isComponentDeclarator(path: NodePath<t.VariableDeclarator>): boolean {
    if (!t.isIdentifier(path.node.id)) return false;

    const name = path.node.id.name;
    if (!/^[A-Z]/.test(name)) return false;

    let hasJSX = false;
    path.traverse({
      JSXElement: () => { hasJSX = true; },
      JSXFragment: () => { hasJSX = true; },
    });

    return hasJSX;
  }

  /**
   * Analyze a function component
   */
  private analyzeComponent(
    path: NodePath<t.FunctionDeclaration>,
    analysis: FileAnalysis
  ): ComponentAnalysis | null {
    const name = path.node.id?.name;
    if (!name) return null;

    const comp: ComponentAnalysis = {
      name,
      reactiveProps: [],
      signals: [],
      memos: [],
      effects: [],
      reactiveJSX: [],
      canMemoize: true,
      memoBlockers: [],
      suggestions: [],
    };

    // Find reactive patterns in component
    this.analyzeComponentBody(path, comp, analysis);

    // Determine if component can be memoized
    this.determineMemoizability(comp);

    // Generate suggestions
    this.generateComponentSuggestions(comp);

    return comp;
  }

  /**
   * Analyze a component declared as a variable
   */
  private analyzeComponentDeclarator(
    path: NodePath<t.VariableDeclarator>,
    analysis: FileAnalysis
  ): ComponentAnalysis | null {
    if (!t.isIdentifier(path.node.id)) return null;

    const name = path.node.id.name;

    const comp: ComponentAnalysis = {
      name,
      reactiveProps: [],
      signals: [],
      memos: [],
      effects: [],
      reactiveJSX: [],
      canMemoize: true,
      memoBlockers: [],
      suggestions: [],
    };

    this.analyzeComponentBody(path, comp, analysis);
    this.determineMemoizability(comp);
    this.generateComponentSuggestions(comp);

    return comp;
  }

  /**
   * Analyze component body for reactive patterns
   */
  private analyzeComponentBody(
    path: NodePath,
    comp: ComponentAnalysis,
    analysis: FileAnalysis
  ): void {
    const bindingNames = new Map(analysis.bindings.map((b: ReactiveBinding) => [b.name, b] as const));

    path.traverse({
      // Find signal/memo/effect calls
      CallExpression: (callPath: NodePath<t.CallExpression>) => {
        const callee = callPath.node.callee;

        if (t.isIdentifier(callee)) {
          const binding = bindingNames.get(callee.name);
          if (binding) {
            if (binding.type === 'signal') comp.signals.push(binding);
            else if (binding.type === 'memo') comp.memos.push(binding);
            else if (binding.type === 'effect') comp.effects.push(binding);
          }
        }
      },

      // Find JSX expressions that read signals
      JSXExpressionContainer: (jsxPath: NodePath<t.JSXExpressionContainer>) => {
        const expr = jsxPath.node.expression;
        if (t.isExpression(expr)) {
          const signalsRead: string[] = [];

          jsxPath.traverse({
            CallExpression: (innerPath: NodePath<t.CallExpression>) => {
              if (t.isIdentifier(innerPath.node.callee)) {
                const binding = bindingNames.get(innerPath.node.callee.name);
                if (binding && (binding.type === 'signal' || binding.type === 'memo')) {
                  signalsRead.push(binding.name);
                }
              }
            },
          });

          if (signalsRead.length > 0) {
            comp.reactiveJSX.push({
              expression: this.nodeToString(expr),
              signalsRead,
              jsxPath: this.getJSXPath(jsxPath),
              isOptimized: false,
            });
          }
        }
      },
    });
  }

  /**
   * Determine if a component can be safely memoized
   */
  private determineMemoizability(comp: ComponentAnalysis): void {
    // Components with effects might have side effects that prevent memoization
    if (comp.effects.length > 0) {
      comp.memoBlockers.push('Component has effects that may prevent memoization');
    }

    // If no reactive patterns, memoization might not be beneficial
    if (comp.signals.length === 0 && comp.memos.length === 0 && comp.reactiveJSX.length === 0) {
      comp.canMemoize = false;
      comp.memoBlockers.push('No reactive patterns detected');
    }
  }

  /**
   * Generate optimization suggestions for a component
   */
  private generateComponentSuggestions(comp: ComponentAnalysis): void {
    // Suggest memoization if component has expensive computations
    if (comp.reactiveJSX.length > 3 && comp.canMemoize) {
      comp.suggestions.push({
        type: 'memo',
        description: 'Component has multiple reactive expressions - consider memoization',
        impact: 'medium',
        automatic: true,
      });
    }

    // Suggest splitting if component is too large
    if (comp.signals.length > 5 || comp.memos.length > 5) {
      comp.suggestions.push({
        type: 'split',
        description: 'Component has many reactive bindings - consider splitting',
        impact: 'high',
        automatic: false,
      });
    }

    // Suggest batching if multiple signal updates
    if (comp.signals.length > 2) {
      comp.suggestions.push({
        type: 'batch',
        description: 'Multiple signals detected - automatic batching will be applied',
        impact: 'medium',
        automatic: true,
      });
    }
  }

  /**
   * Find optimization opportunities in the code
   */
  private findOptimizations(ast: t.File, analysis: FileAnalysis): void {
    // Find unused bindings (dead code)
    analysis.bindings.forEach((binding: ReactiveBinding) => {
      if (!binding.isUsed && this.config.deadCodeElimination) {
        analysis.optimizations.push({
          type: 'dead-code',
          location: binding.loc || null,
          description: `Unused ${binding.type}: ${binding.name}`,
          transform: () => {
            // Will be handled in transformer
          },
        });
      }
    });

    // Find memo opportunities
    analysis.components.forEach((comp: ComponentAnalysis) => {
      if (comp.canMemoize && comp.reactiveJSX.length > 0) {
        comp.reactiveJSX.forEach((jsx: ReactiveJSXExpression) => {
          if (!jsx.isOptimized && jsx.signalsRead.length > 1) {
            analysis.optimizations.push({
              type: 'auto-memo',
              location: null,
              description: `Auto-memoize expression reading ${jsx.signalsRead.join(', ')}`,
              transform: () => {
                // Will be handled in transformer
              },
            });
          }
        });
      }
    });
  }

  /**
   * Generate warnings about potential issues
   */
  private generateWarnings(analysis: FileAnalysis): void {
    const bindingIndex = new Map(analysis.bindings.map((b: ReactiveBinding) => [b.name, b] as const));

    // Warn about diamond dependencies
    analysis.bindings.forEach((binding: ReactiveBinding) => {
      if (binding.dependencies.length > 1) {
        const sharedDeps = this.findSharedDependencies(binding, bindingIndex);
        if (sharedDeps.length > 0) {
          const warning: CompilerWarning = {
            type: 'performance',
            message: `Potential diamond dependency in "${binding.name}"`,
            suggestion: `PhilJS handles this automatically with glitch-free updates. Consider simplifying if the dependency chain is complex.`,
          };
          if (binding.loc !== undefined) {
            warning.location = binding.loc;
          }
          analysis.warnings.push(warning);
        }
      }
    });

    // Warn about effects that might need cleanup
    analysis.bindings
      .filter((b: ReactiveBinding) => b.type === 'effect')
      .forEach((effect: ReactiveBinding) => {
        // Only warn if dependencies suggest cleanup might be needed
        if (effect.dependencies.length > 0) {
          const warning: CompilerWarning = {
            type: 'correctness',
            message: `Effect depends on ${effect.dependencies.length} signal(s)`,
            suggestion: `If this effect sets up subscriptions, event listeners, or timers, return a cleanup function: effect(() => { /* setup */ return () => { /* cleanup */ }; });`,
          };
          if (effect.loc !== undefined) {
            warning.location = effect.loc;
          }
          analysis.warnings.push(warning);
        }
      });

    // Warn about unused signals (dead code)
    analysis.bindings
      .filter((b: ReactiveBinding) => b.type === 'signal' && !b.isUsed)
      .forEach((binding: ReactiveBinding) => {
        const warning: CompilerWarning = {
          type: 'performance',
          message: `Signal "${binding.name}" is declared but never read`,
          suggestion: `Remove unused signal to reduce memory usage, or ensure you're reading it with ${binding.name}() in your JSX or effects.`,
        };
        if (binding.loc !== undefined) {
          warning.location = binding.loc;
        }
        analysis.warnings.push(warning);
      });

    // Warn about memos with no dependents
    analysis.bindings
      .filter((b: ReactiveBinding) => b.type === 'memo' && b.dependents.length === 0 && b.isUsed)
      .forEach((binding: ReactiveBinding) => {
        const warning: CompilerWarning = {
          type: 'performance',
          message: `Memo "${binding.name}" has no reactive dependents`,
          suggestion: `This memo runs but nothing reacts to its changes. If you only need the computed value once, consider using a regular variable instead.`,
        };
        if (binding.loc !== undefined) {
          warning.location = binding.loc;
        }
        analysis.warnings.push(warning);
      });

    // Warn about deeply nested memo chains
    analysis.bindings
      .filter((b: ReactiveBinding) => b.type === 'memo')
      .forEach((binding: ReactiveBinding) => {
        const depth = this.getMemoDepth(binding, bindingIndex, new Set());
        if (depth > 4) {
          const warning: CompilerWarning = {
            type: 'performance',
            message: `Memo "${binding.name}" is ${depth} levels deep in the dependency chain`,
            suggestion: `Deep memo chains can impact performance. Consider flattening the computation or using batch() for updates.`,
          };
          if (binding.loc !== undefined) {
            warning.location = binding.loc;
          }
          analysis.warnings.push(warning);
        }
      });

    // Warn about components with many signals
    analysis.components.forEach((comp: ComponentAnalysis) => {
      if (comp.signals.length > 5) {
        const warning: CompilerWarning = {
          type: 'performance',
          message: `Component "${comp.name}" has ${comp.signals.length} signals`,
          suggestion: `Consider extracting some state into a custom hook or splitting into smaller components for better maintainability.`,
        };
        const firstSignalLoc = comp.signals[0]?.loc;
        if (firstSignalLoc !== undefined) {
          warning.location = firstSignalLoc;
        }
        analysis.warnings.push(warning);
      }

      // Warn about components with many reactive JSX expressions
      if (comp.reactiveJSX.length > 10) {
        const warning: CompilerWarning = {
          type: 'performance',
          message: `Component "${comp.name}" has ${comp.reactiveJSX.length} reactive expressions in JSX`,
          location: null,
          suggestion: `Consider using memos to cache expensive computations or splitting into smaller components.`,
        };
        analysis.warnings.push(warning);
      }
    });
  }

  /**
   * Get the depth of a memo in the dependency chain
   */
  private getMemoDepth(
    binding: ReactiveBinding,
    bindingIndex: Map<string, ReactiveBinding>,
    visited: Set<string>
  ): number {
    if (visited.has(binding.name)) return 0;
    visited.add(binding.name);

    if (binding.dependencies.length === 0) return 1;

    let maxDepth = 0;
    for (const dep of binding.dependencies) {
      const depBinding = bindingIndex.get(dep);
      if (depBinding && depBinding.type === 'memo') {
        const depth = this.getMemoDepth(depBinding, bindingIndex, visited);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth + 1;
  }

  /**
   * Find shared dependencies (diamond pattern)
   */
  private findSharedDependencies(
    binding: ReactiveBinding,
    bindingIndex: Map<string, ReactiveBinding>
  ): string[] {
    const deps = binding.dependencies;
    const shared: string[] = [];

    deps.forEach((dep: string) => {
      const depBinding = bindingIndex.get(dep);
      if (depBinding) {
        const overlap = depBinding.dependencies.filter((d: string) => deps.includes(d));
        shared.push(...overlap);
      }
    });

    return [...new Set(shared)];
  }

  /**
   * Convert AST node to string representation
   */
  private nodeToString(node: t.Expression): string {
    // Simplified - actual implementation would use generator
    if (t.isIdentifier(node)) return node.name;
    if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
      return `${node.callee.name}()`;
    }
    return '[expression]';
  }

  /**
   * Get JSX path for an expression container
   */
  private getJSXPath(path: NodePath): string {
    const parts: string[] = [];
    let current = path.parentPath;

    while (current) {
      if (t.isJSXElement(current.node) && t.isJSXIdentifier(current.node.openingElement.name)) {
        parts.unshift(current.node.openingElement.name.name);
      }
      current = current.parentPath;
    }

    return parts.join(' > ') || 'unknown';
  }

  /**
   * Analyze bundle for production metrics
   */
  analyzeBundleMetrics(code: string): BundleMetrics {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const dependencySet = new Set<string>();
    const metrics: BundleMetrics = {
      totalSize: Buffer.byteLength(code, 'utf8'),
      imports: 0,
      exports: 0,
      components: 0,
      signals: 0,
      effects: 0,
      dependencies: [],
      complexity: 0,
      treeshakeable: true,
    };

    traverse(ast, {
      ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
        metrics.imports++;
        const source = path.node.source.value;
        dependencySet.add(source);
      },

      ExportDeclaration: () => {
        metrics.exports++;
      },

      FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
        const name = path.node.id?.name;
        if (name && /^[A-Z]/.test(name)) {
          metrics.components++;
        }
        metrics.complexity += this.calculateComplexity(path);
      },

      CallExpression: (path: NodePath<t.CallExpression>) => {
        if (t.isIdentifier(path.node.callee)) {
          const name = path.node.callee.name;
          if (name === 'signal' || name === 'linkedSignal') {
            metrics.signals++;
          } else if (name === 'effect') {
            metrics.effects++;
          }
        }
      },

      // Check for side effects that prevent tree shaking
      ExpressionStatement: (path: NodePath<t.ExpressionStatement>) => {
        const expr = path.node.expression;
        // Top-level expressions indicate side effects
        if (path.scope.parent === null) {
          if (!t.isLiteral(expr) && !t.isIdentifier(expr)) {
            metrics.treeshakeable = false;
          }
        }
      },
    });

    if (dependencySet.size > 0) {
      metrics.dependencies = Array.from(dependencySet);
    }

    return metrics;
  }

  /**
   * Calculate cyclomatic complexity of a function
   */
  private calculateComplexity(path: NodePath): number {
    let complexity = 1; // Base complexity

    path.traverse({
      IfStatement: () => complexity++,
      ConditionalExpression: () => complexity++,
      ForStatement: () => complexity++,
      WhileStatement: () => complexity++,
      DoWhileStatement: () => complexity++,
      SwitchCase: (casePath) => {
        if (casePath.node.test !== null) complexity++;
      },
      CatchClause: () => complexity++,
      LogicalExpression: (logPath) => {
        if (logPath.node.operator === '&&' || logPath.node.operator === '||') {
          complexity++;
        }
      },
    });

    return complexity;
  }

  /**
   * Generate dependency graph
   */
  generateDependencyGraph(analysis: FileAnalysis): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: [],
      edges: [],
    };

    // Add nodes for each binding
    analysis.bindings.forEach((binding: ReactiveBinding) => {
      graph.nodes.push({
        id: binding.name,
        type: binding.type,
        used: binding.isUsed,
      });
    });

    // Add edges for dependencies
    analysis.bindings.forEach((binding: ReactiveBinding) => {
      binding.dependencies.forEach((dep: string) => {
        graph.edges.push({
          from: dep,
          to: binding.name,
          type: 'depends',
        });
      });
    });

    return graph;
  }

  /**
   * Analyze chunk candidates for code splitting
   */
  analyzeChunkCandidates(analysis: FileAnalysis): ChunkCandidate[] {
    const candidates: ChunkCandidate[] = [];

    // Analyze each component for code splitting potential
    analysis.components.forEach((comp: ComponentAnalysis) => {
      const complexity = this.calculateComponentComplexity(comp);
      const size = this.estimateComponentSize(comp);

      // Components with high complexity or size are good candidates
      if (complexity > 10 || size > 5000) {
        candidates.push({
          name: comp.name,
          type: 'component',
          size,
          complexity,
          priority: this.calculatePriority(complexity, size),
          lazy: true,
        });
      }
    });

    // Check for large utility modules
    const utilitySize = analysis.bindings.filter(
      (b: ReactiveBinding) => b.type === 'memo' || b.type === 'signal'
    ).length;

    if (utilitySize > 10) {
      candidates.push({
        name: 'utilities',
        type: 'utilities',
        size: utilitySize * 100, // Rough estimate
        complexity: utilitySize,
        priority: 'medium',
        lazy: false,
      });
    }

    return candidates;
  }

  /**
   * Calculate component complexity
   */
  private calculateComponentComplexity(comp: ComponentAnalysis): number {
    return (
      comp.signals.length * 2 +
      comp.memos.length * 3 +
      comp.effects.length * 4 +
      comp.reactiveJSX.length
    );
  }

  /**
   * Estimate component size in bytes
   */
  private estimateComponentSize(comp: ComponentAnalysis): number {
    // Rough estimation based on reactive elements
    const baseSize = 500;
    const signalSize = comp.signals.length * 50;
    const memoSize = comp.memos.length * 100;
    const effectSize = comp.effects.length * 150;
    const jsxSize = comp.reactiveJSX.length * 80;

    return baseSize + signalSize + memoSize + effectSize + jsxSize;
  }

  /**
   * Calculate splitting priority
   */
  private calculatePriority(complexity: number, size: number): 'high' | 'medium' | 'low' {
    const score = complexity * 0.6 + size / 1000 * 0.4;

    if (score > 20) return 'high';
    if (score > 10) return 'medium';
    return 'low';
  }
}

/**
 * Bundle metrics for production analysis
 */
export interface BundleMetrics {
  totalSize: number;
  imports: number;
  exports: number;
  components: number;
  signals: number;
  effects: number;
  dependencies: string[];
  complexity: number;
  treeshakeable: boolean;
}

/**
 * Dependency graph structure
 */
export interface DependencyGraph {
  nodes: Array<{
    id: string;
    type: string;
    used: boolean;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

/**
 * Chunk candidate for code splitting
 */
export interface ChunkCandidate {
  name: string;
  type: 'component' | 'route' | 'utilities';
  size: number;
  complexity: number;
  priority: 'high' | 'medium' | 'low';
  lazy: boolean;
}

/**
 * Create a new analyzer instance
 */
export const createAnalyzer = /*#__PURE__*/ function createAnalyzer(config?: CompilerConfig): Analyzer {
  return new Analyzer(config);
}

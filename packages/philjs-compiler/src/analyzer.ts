/**
 * PhilJS Compiler - Dependency Analyzer
 * Analyzes code to detect reactive dependencies and optimization opportunities
 */

import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
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
} from './types';

const PHILJS_SOURCES = ['philjs-core', 'philjs', '@philjs/core'];
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
      ImportDeclaration: (path) => {
        const source = path.node.source.value;

        if (PHILJS_SOURCES.some(s => source.includes(s))) {
          path.node.specifiers.forEach(spec => {
            if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported)) {
              analysis.imports.push({
                name: spec.imported.name,
                alias: spec.local.name !== spec.imported.name ? spec.local.name : undefined,
                source,
              });
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
    analysis.imports.forEach(imp => {
      importedNames.set(imp.alias || imp.name, imp.name);
    });

    traverse(ast, {
      VariableDeclarator: (path) => {
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

    return {
      name: node.id.name,
      type,
      node,
      scope,
      dependencies: [],
      dependents: [],
      isUsed: false,
      loc: node.loc,
    };
  }

  /**
   * Analyze dependencies between reactive bindings
   */
  private analyzeDependencies(ast: t.File, analysis: FileAnalysis): void {
    const bindingNames = new Set(analysis.bindings.map(b => b.name));

    traverse(ast, {
      CallExpression: (path) => {
        // Find signal reads (calls like `count()`)
        if (t.isIdentifier(path.node.callee) && bindingNames.has(path.node.callee.name)) {
          const signalName = path.node.callee.name;
          const binding = analysis.bindings.find(b => b.name === signalName);

          if (binding) {
            binding.isUsed = true;

            // Find containing reactive context
            const containingBinding = this.findContainingReactiveContext(path, analysis);
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
    analysis: FileAnalysis
  ): ReactiveBinding | null {
    let current = path.parentPath;

    while (current) {
      if (t.isCallExpression(current.node)) {
        const callee = current.node.callee;

        if (t.isIdentifier(callee)) {
          const binding = analysis.bindings.find(b => b.name === callee.name);
          if (binding) return binding;
        }
      }

      if (!current) break;

      if (t.isVariableDeclarator(current.node) && t.isIdentifier(current.node.id)) {
        const node = current.node as t.VariableDeclarator;
        const id = node.id as t.Identifier;
        const binding = analysis.bindings.find(b => b.name === id.name);
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
      FunctionDeclaration: (path) => {
        if (this.isComponent(path)) {
          const comp = this.analyzeComponent(path, analysis);
          if (comp) analysis.components.push(comp);
        }
      },
      VariableDeclarator: (path) => {
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
    const bindingNames = new Map(analysis.bindings.map(b => [b.name, b]));

    path.traverse({
      // Find signal/memo/effect calls
      CallExpression: (callPath) => {
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
      JSXExpressionContainer: (jsxPath) => {
        const expr = jsxPath.node.expression;
        if (t.isExpression(expr)) {
          const signalsRead: string[] = [];

          jsxPath.traverse({
            CallExpression: (innerPath) => {
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
    analysis.bindings.forEach(binding => {
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
    analysis.components.forEach(comp => {
      if (comp.canMemoize && comp.reactiveJSX.length > 0) {
        comp.reactiveJSX.forEach(jsx => {
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
    // Warn about diamond dependencies
    analysis.bindings.forEach(binding => {
      if (binding.dependencies.length > 1) {
        const sharedDeps = this.findSharedDependencies(binding, analysis);
        if (sharedDeps.length > 0) {
          analysis.warnings.push({
            type: 'performance',
            message: `Potential diamond dependency in ${binding.name}`,
            location: binding.loc,
            suggestion: 'PhilJS handles this automatically, but consider simplifying',
          });
        }
      }
    });

    // Warn about effects without cleanup
    analysis.bindings
      .filter(b => b.type === 'effect')
      .forEach(effect => {
        analysis.warnings.push({
          type: 'correctness',
          message: `Effect "${effect.name}" - ensure cleanup is handled`,
          location: effect.loc,
          suggestion: 'Return a cleanup function from the effect',
        });
      });
  }

  /**
   * Find shared dependencies (diamond pattern)
   */
  private findSharedDependencies(
    binding: ReactiveBinding,
    analysis: FileAnalysis
  ): string[] {
    const deps = binding.dependencies;
    const shared: string[] = [];

    deps.forEach(dep => {
      const depBinding = analysis.bindings.find(b => b.name === dep);
      if (depBinding) {
        const overlap = depBinding.dependencies.filter(d => deps.includes(d));
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
}

/**
 * Create a new analyzer instance
 */
export function createAnalyzer(config?: CompilerConfig): Analyzer {
  return new Analyzer(config);
}

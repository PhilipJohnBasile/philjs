/**
 * PhilJS Compiler - Enhanced Dead Code Elimination
 * Detects and removes unused signals, effects, and other reactive primitives
 */

import type { NodePath, TraverseOptions } from '@babel/traverse';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { FileAnalysis, ReactiveBinding, CompilerConfig } from './types.js';

// Handle both ESM and CJS exports - babel traverse exports default as the traverse function
const traverse: (ast: t.Node, opts?: TraverseOptions) => void = (_traverse as unknown as { default: (ast: t.Node, opts?: TraverseOptions) => void }).default;

export interface DeadCodeReport {
  unusedSignals: string[];
  unusedMemos: string[];
  unusedEffects: string[];
  unusedComponents: string[];
  totalRemoved: number;
  sizeReduction: number;
}

export class DeadCodeEliminator {
  private config: CompilerConfig;

  constructor(config: CompilerConfig = {}) {
    this.config = config;
  }

  /**
   * Eliminate dead code from AST based on analysis
   */
  eliminate(ast: t.File, analysis: FileAnalysis): DeadCodeReport {
    const report: DeadCodeReport = {
      unusedSignals: [],
      unusedMemos: [],
      unusedEffects: [],
      unusedComponents: [],
      totalRemoved: 0,
      sizeReduction: 0,
    };

    // Build set of unused bindings
    const bindingIndex = new Map(
      analysis.bindings.map((b: ReactiveBinding) => [b.name, b] as const)
    );
    const unusedBindings = new Set(
      analysis.bindings
        .filter((b: ReactiveBinding) => !b.isUsed)
        .map((b: ReactiveBinding) => b.name)
    );

    let initialSize = 0;
    let finalSize = 0;

    // Store reference to this for use in traverse callbacks
    const self = this;

    traverse(ast, {
      Program(path: NodePath<t.Program>) {
        // Estimate initial size
        initialSize = path.toString().length;
      },

      VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
        if (!t.isIdentifier(path.node.id)) return;

        const name = path.node.id.name;
        if (!unusedBindings.has(name)) return;

        const binding = bindingIndex.get(name);

        if (binding && !binding.isUsed && self.isSafeToRemove(binding)) {
          // Track what we're removing
          switch (binding.type) {
            case 'signal':
              report.unusedSignals.push(name);
              break;
            case 'memo':
              report.unusedMemos.push(name);
              break;
            case 'effect':
              report.unusedEffects.push(name);
              break;
          }

          // Remove the entire variable declaration if it's the only declarator
          const declaration = path.parentPath;
          if (
            declaration &&
            t.isVariableDeclaration(declaration.node) &&
            declaration.node.declarations.length === 1
          ) {
            declaration.remove();
            report.totalRemoved++;
          } else {
            // Just remove this declarator
            path.remove();
            report.totalRemoved++;
          }
        }
      },

      // Remove unused imports
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        const specifiersToRemove: number[] = [];

        path.node.specifiers.forEach((spec: t.ImportSpecifier | t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier, idx: number) => {
          if (t.isImportSpecifier(spec)) {
            const localName = spec.local.name;
            const binding = path.scope.getBinding(localName);

            if (binding && !binding.referenced) {
              specifiersToRemove.push(idx);
            }
          }
        });

        // Remove unused specifiers
        if (specifiersToRemove.length > 0) {
          specifiersToRemove.reverse().forEach(idx => {
            path.node.specifiers.splice(idx, 1);
          });

          // If no specifiers left, remove the entire import
          if (path.node.specifiers.length === 0) {
            path.remove();
            report.totalRemoved++;
          }
        }
      },

      // Mark pure function calls for better tree-shaking
      CallExpression(path: NodePath<t.CallExpression>) {
        const callee = path.node.callee;

        // Mark signal/memo/effect creators as pure
        if (t.isIdentifier(callee)) {
          const pureFunctions = ['signal', 'memo', 'resource', 'linkedSignal'];
          if (pureFunctions.includes(callee.name)) {
            self.markAsPure(path);
          }
        }
      },
    });

    traverse(ast, {
      Program(path: NodePath<t.Program>) {
        finalSize = path.toString().length;
      },
    });

    report.sizeReduction = initialSize - finalSize;

    return report;
  }

  /**
   * Check if a binding is safe to remove
   */
  private isSafeToRemove(binding: ReactiveBinding): boolean {
    // Effects might have side effects even if the return value isn't used
    if (binding.type === 'effect') {
      // Only remove if effect has no dependencies (unlikely to do anything useful)
      return binding.dependencies.length === 0;
    }

    // Signals and memos are safe to remove if truly unused
    return true;
  }

  /**
   * Mark a call expression as pure
   */
  private markAsPure(path: any): void {
    // Add /*#__PURE__*/ comment
    const pureComment = {
      type: 'CommentBlock',
      value: '#__PURE__',
    };

    if (!path.node.leadingComments) {
      path.node.leadingComments = [];
    }

    // Check if pure comment already exists
    const hasPureComment = path.node.leadingComments.some(
      (comment: any) => comment.value === '#__PURE__'
    );

    if (!hasPureComment) {
      path.node.leadingComments.unshift(pureComment);
    }
  }

  /**
   * Generate a report summary
   */
  static /*#__PURE__*/ formatReport(report: DeadCodeReport): string {
    const lines: string[] = [
      'Dead Code Elimination Report:',
      `  Unused signals removed: ${report.unusedSignals.length}`,
      `  Unused memos removed: ${report.unusedMemos.length}`,
      `  Unused effects removed: ${report.unusedEffects.length}`,
      `  Unused components removed: ${report.unusedComponents.length}`,
      `  Total items removed: ${report.totalRemoved}`,
      `  Estimated size reduction: ${report.sizeReduction} bytes`,
    ];

    if (report.unusedSignals.length > 0) {
      lines.push(`\n  Removed signals: ${report.unusedSignals.join(', ')}`);
    }
    if (report.unusedMemos.length > 0) {
      lines.push(`  Removed memos: ${report.unusedMemos.join(', ')}`);
    }
    if (report.unusedEffects.length > 0) {
      lines.push(`  Removed effects: ${report.unusedEffects.join(', ')}`);
    }
    if (report.unusedComponents.length > 0) {
      lines.push(`  Removed components: ${report.unusedComponents.join(', ')}`);
    }

    return lines.join('\n');
  }
}

/**
 * Create a new dead code eliminator instance
 */
export const createDeadCodeEliminator = /*#__PURE__*/ function createDeadCodeEliminator(
  config?: CompilerConfig
): DeadCodeEliminator {
  return new DeadCodeEliminator(config);
};

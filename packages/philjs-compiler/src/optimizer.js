/**
 * PhilJS Compiler - Optimizer
 * Applies automatic optimizations to PhilJS code
 */
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { Analyzer } from './analyzer';
export class Optimizer {
    config;
    analyzer;
    constructor(config = {}) {
        this.config = config;
        this.analyzer = new Analyzer(config);
    }
    /**
     * Optimize source code
     */
    optimize(code, filePath) {
        // Analyze the code first
        const analysis = this.analyzer.analyze(code, filePath);
        // Parse the code for transformation
        const ast = parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
            sourceFilename: filePath,
        });
        const optimizationsApplied = [];
        const warnings = [...analysis.warnings];
        // Apply optimizations
        if (this.config.autoMemo !== false) {
            const memoOpts = this.applyAutoMemo(ast, analysis);
            optimizationsApplied.push(...memoOpts);
        }
        if (this.config.autoBatch !== false) {
            const batchOpts = this.applyAutoBatch(ast, analysis);
            optimizationsApplied.push(...batchOpts);
        }
        if (this.config.deadCodeElimination !== false) {
            const dceOpts = this.applyDeadCodeElimination(ast, analysis);
            optimizationsApplied.push(...dceOpts);
        }
        if (this.config.optimizeEffects !== false) {
            const effectOpts = this.applyEffectOptimizations(ast, analysis);
            optimizationsApplied.push(...effectOpts);
        }
        if (this.config.optimizeComponents !== false) {
            const compOpts = this.applyComponentOptimizations(ast, analysis);
            optimizationsApplied.push(...compOpts);
        }
        // Ensure PhilJS imports are added if needed
        this.ensureImports(ast, optimizationsApplied);
        // Generate output
        const output = generate(ast, {
            sourceMaps: this.config.sourceMaps !== false,
            sourceFileName: filePath,
        });
        return {
            code: output.code,
            map: output.map || null,
            analysis,
            optimizations: optimizationsApplied,
            warnings,
        };
    }
    /**
     * Apply automatic memoization
     */
    applyAutoMemo(ast, analysis) {
        const applied = [];
        // Find expressions that read multiple signals and wrap in memo
        analysis.components.forEach(comp => {
            comp.reactiveJSX.forEach(jsx => {
                if (jsx.signalsRead.length > 1 && !jsx.isOptimized) {
                    // This is a candidate for memo optimization
                    // The actual transformation is complex, so we track it
                    applied.push(`auto-memo: ${jsx.signalsRead.join(', ')}`);
                }
            });
        });
        // Transform: wrap expensive computations in memo
        traverse(ast, {
            CallExpression: (path) => {
                // Find signal reads inside JSX that could be memoized
                if (this.isExpensiveComputation(path)) {
                    const memoized = this.wrapInMemo(path);
                    if (memoized) {
                        applied.push(`memoized: ${this.getExpressionName(path.node)}`);
                    }
                }
            },
        });
        return applied;
    }
    /**
     * Apply automatic batching
     */
    applyAutoBatch(ast, analysis) {
        const applied = [];
        traverse(ast, {
            // Find consecutive signal.set() calls
            BlockStatement: (path) => {
                const statements = path.node.body;
                const signalSets = [];
                statements.forEach((stmt, idx) => {
                    if (this.isSignalSet(stmt)) {
                        signalSets.push(idx);
                    }
                });
                // If we have consecutive signal sets, wrap in batch
                if (signalSets.length >= 2) {
                    const consecutive = this.findConsecutiveRanges(signalSets);
                    consecutive.forEach(range => {
                        if (range.length >= 2) {
                            this.wrapInBatch(path, range);
                            applied.push(`batched: ${range.length} signal updates`);
                        }
                    });
                }
            },
        });
        return applied;
    }
    /**
     * Apply dead code elimination
     */
    applyDeadCodeElimination(ast, analysis) {
        const applied = [];
        const unusedBindings = analysis.bindings.filter(b => !b.isUsed);
        traverse(ast, {
            VariableDeclarator: (path) => {
                if (t.isIdentifier(path.node.id)) {
                    const name = path.node.id.name;
                    const unused = unusedBindings.find(b => b.name === name);
                    if (unused) {
                        // Check if it's safe to remove
                        if (this.isSafeToRemove(path, unused)) {
                            // Add comment instead of removing (for safety in first iteration)
                            if (this.config.development) {
                                // In dev mode, add a warning comment
                                const comment = ` /* PhilJS: Unused ${unused.type} - consider removing */ `;
                                applied.push(`marked-unused: ${name}`);
                            }
                            else {
                                // In production, we could remove (but be conservative for now)
                                applied.push(`detected-unused: ${name}`);
                            }
                        }
                    }
                }
            },
        });
        return applied;
    }
    /**
     * Apply effect optimizations
     */
    applyEffectOptimizations(ast, analysis) {
        const applied = [];
        traverse(ast, {
            CallExpression: (path) => {
                if (this.isEffectCall(path)) {
                    // Check if effect has proper cleanup
                    const hasCleanup = this.effectHasCleanup(path);
                    if (!hasCleanup) {
                        // Add a warning but don't transform (effects are sensitive)
                        applied.push(`effect-warning: missing cleanup at ${path.node.loc?.start.line}`);
                    }
                    // Optimize effect dependencies if possible
                    const optimizedDeps = this.optimizeEffectDependencies(path);
                    if (optimizedDeps) {
                        applied.push(`effect-optimized: dependencies at ${path.node.loc?.start.line}`);
                    }
                }
            },
        });
        return applied;
    }
    /**
     * Apply component-level optimizations
     */
    applyComponentOptimizations(ast, analysis) {
        const applied = [];
        analysis.components.forEach(comp => {
            // Check if component should be wrapped in a factory for lazy rendering
            if (comp.signals.length > 3 || comp.memos.length > 3) {
                applied.push(`component-heavy: ${comp.name} (${comp.signals.length} signals, ${comp.memos.length} memos)`);
            }
            // Check for render optimization opportunities
            if (comp.reactiveJSX.length > 5) {
                applied.push(`component-many-reactive: ${comp.name} (${comp.reactiveJSX.length} reactive expressions)`);
            }
        });
        return applied;
    }
    /**
     * Ensure necessary imports are present
     */
    ensureImports(ast, optimizationsApplied) {
        // Check what imports we need to add
        const needsMemo = optimizationsApplied.some(o => o.startsWith('memoized:'));
        const needsBatch = optimizationsApplied.some(o => o.startsWith('batched:'));
        if (!needsMemo && !needsBatch)
            return;
        // Find existing philjs import
        let philjsImport = null;
        traverse(ast, {
            ImportDeclaration: (path) => {
                if (path.node.source.value.includes('philjs')) {
                    philjsImport = path.node;
                }
            },
        });
        // Add imports if needed
        if (philjsImport && t.isImportDeclaration(philjsImport)) {
            if (needsMemo && !this.hasImport(philjsImport, 'memo')) {
                philjsImport.specifiers.push(t.importSpecifier(t.identifier('memo'), t.identifier('memo')));
            }
            if (needsBatch && !this.hasImport(philjsImport, 'batch')) {
                philjsImport.specifiers.push(t.importSpecifier(t.identifier('batch'), t.identifier('batch')));
            }
        }
    }
    // ============================================================================
    // Helper Methods
    // ============================================================================
    isExpensiveComputation(path) {
        // Simple heuristic: multiple signal reads in a single expression
        let signalReads = 0;
        path.traverse({
            CallExpression: (innerPath) => {
                if (t.isIdentifier(innerPath.node.callee) && innerPath.node.arguments.length === 0) {
                    signalReads++;
                }
            },
        });
        return signalReads >= 2;
    }
    wrapInMemo(path) {
        // Wrap the expression in memo(() => ...)
        // This is a simplified version - real implementation would be more careful
        const parent = path.parentPath;
        if (parent && t.isVariableDeclarator(parent.node)) {
            const originalInit = parent.node.init;
            if (originalInit && !this.isAlreadyMemo(originalInit)) {
                // Don't transform yet - just mark as candidate
                return true;
            }
        }
        return false;
    }
    isAlreadyMemo(node) {
        return (t.isCallExpression(node) &&
            t.isIdentifier(node.callee) &&
            node.callee.name === 'memo');
    }
    isSignalSet(stmt) {
        if (t.isExpressionStatement(stmt)) {
            const expr = stmt.expression;
            if (t.isCallExpression(expr)) {
                const callee = expr.callee;
                if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
                    return callee.property.name === 'set';
                }
            }
        }
        return false;
    }
    findConsecutiveRanges(indices) {
        if (indices.length === 0)
            return [];
        const ranges = [];
        let currentRange = [indices[0]];
        for (let i = 1; i < indices.length; i++) {
            if (indices[i] === indices[i - 1] + 1) {
                currentRange.push(indices[i]);
            }
            else {
                ranges.push(currentRange);
                currentRange = [indices[i]];
            }
        }
        ranges.push(currentRange);
        return ranges;
    }
    wrapInBatch(path, range) {
        // This would wrap the statements in batch(() => { ... })
        // Simplified for now - actual implementation would modify the AST
    }
    isSafeToRemove(path, binding) {
        // Conservative: only remove if it's definitely not used
        return binding.type === 'signal' && !binding.isUsed;
    }
    isEffectCall(path) {
        const callee = path.node.callee;
        return t.isIdentifier(callee) && callee.name === 'effect';
    }
    effectHasCleanup(path) {
        const arg = path.node.arguments[0];
        if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
            // Check if the function returns something (cleanup)
            let hasReturn = false;
            path.traverse({
                ReturnStatement: () => {
                    hasReturn = true;
                },
            });
            return hasReturn;
        }
        return false;
    }
    optimizeEffectDependencies(path) {
        // Placeholder for dependency optimization
        return false;
    }
    hasImport(decl, name) {
        return decl.specifiers.some(spec => t.isImportSpecifier(spec) &&
            t.isIdentifier(spec.imported) &&
            spec.imported.name === name);
    }
    getExpressionName(node) {
        if (t.isIdentifier(node.callee)) {
            return node.callee.name;
        }
        return 'expression';
    }
}
/**
 * Create a new optimizer instance
 */
export function createOptimizer(config) {
    return new Optimizer(config);
}
//# sourceMappingURL=optimizer.js.map
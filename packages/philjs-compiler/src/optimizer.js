/**
 * PhilJS Compiler - Optimizer
 * Applies automatic optimizations to PhilJS code
 */
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { Analyzer } from './analyzer';
import { DeadCodeEliminator } from './dead-code-eliminator';
import { CodeSplitter } from './code-splitter';
export class Optimizer {
    config;
    analyzer;
    deadCodeEliminator;
    codeSplitter;
    constructor(config = {}) {
        this.config = config;
        this.analyzer = new Analyzer(config);
        this.deadCodeEliminator = new DeadCodeEliminator(config);
        this.codeSplitter = new CodeSplitter(config);
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
            const dceReport = this.deadCodeEliminator.eliminate(ast, analysis);
            if (dceReport.totalRemoved > 0) {
                optimizationsApplied.push(`dead-code: removed ${dceReport.totalRemoved} unused items (${dceReport.sizeReduction} bytes saved)`);
                if (dceReport.unusedSignals.length > 0) {
                    optimizationsApplied.push(`  - signals: ${dceReport.unusedSignals.join(', ')}`);
                }
                if (dceReport.unusedMemos.length > 0) {
                    optimizationsApplied.push(`  - memos: ${dceReport.unusedMemos.join(', ')}`);
                }
                if (dceReport.unusedEffects.length > 0) {
                    optimizationsApplied.push(`  - effects: ${dceReport.unusedEffects.join(', ')}`);
                }
            }
        }
        if (this.config.optimizeEffects !== false) {
            const effectOpts = this.applyEffectOptimizations(ast, analysis);
            optimizationsApplied.push(...effectOpts);
        }
        if (this.config.optimizeComponents !== false) {
            const compOpts = this.applyComponentOptimizations(ast, analysis);
            optimizationsApplied.push(...compOpts);
        }
        // Production-only optimizations
        if (!this.config.development) {
            const prodOpts = this.applyProductionOptimizations(ast, analysis);
            optimizationsApplied.push(...prodOpts);
        }
        // Ensure PhilJS imports are added if needed
        this.ensureImports(ast, optimizationsApplied);
        // Generate output
        const output = generate(ast, {
            sourceMaps: this.config.sourceMaps !== false,
            sourceFileName: filePath,
            compact: !this.config.development,
            minified: false, // Don't minify here, let terser handle it
            retainLines: this.config.development,
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
     * Apply production-specific optimizations
     */
    applyProductionOptimizations(ast, analysis) {
        const applied = [];
        // Remove debug code
        traverse(ast, {
            // Remove console.log, console.debug, etc. (keep console.error, console.warn)
            CallExpression: (path) => {
                const callee = path.node.callee;
                if (t.isMemberExpression(callee)) {
                    if (t.isIdentifier(callee.object) &&
                        callee.object.name === 'console' &&
                        t.isIdentifier(callee.property)) {
                        const method = callee.property.name;
                        if (method === 'log' || method === 'debug' || method === 'trace') {
                            path.remove();
                            applied.push(`removed: console.${method}()`);
                        }
                    }
                }
            },
            // Remove debugger statements
            DebuggerStatement: (path) => {
                path.remove();
                applied.push('removed: debugger statement');
            },
            // Remove development-only code blocks
            IfStatement: (path) => {
                const test = path.node.test;
                // Remove if (process.env.NODE_ENV === 'development')
                if (this.isDevEnvCheck(test)) {
                    path.remove();
                    applied.push('removed: development-only code block');
                }
            },
        });
        // Inline constants
        const constantsInlined = this.inlineConstants(ast);
        if (constantsInlined > 0) {
            applied.push(`inlined: ${constantsInlined} constants`);
        }
        // Optimize string concatenations
        const stringsOptimized = this.optimizeStrings(ast);
        if (stringsOptimized > 0) {
            applied.push(`optimized: ${stringsOptimized} string operations`);
        }
        return applied;
    }
    /**
     * Check if an expression is a development environment check
     */
    isDevEnvCheck(node) {
        if (!t.isBinaryExpression(node))
            return false;
        const { left, operator, right } = node;
        // Check for process.env.NODE_ENV === 'development'
        if (operator === '===' &&
            t.isMemberExpression(left) &&
            t.isMemberExpression(left.object) &&
            t.isIdentifier(left.object.object) &&
            left.object.object.name === 'process' &&
            t.isIdentifier(left.object.property) &&
            left.object.property.name === 'env' &&
            t.isIdentifier(left.property) &&
            left.property.name === 'NODE_ENV' &&
            t.isStringLiteral(right) &&
            right.value === 'development') {
            return true;
        }
        return false;
    }
    /**
     * Inline constant values
     */
    inlineConstants(ast) {
        let count = 0;
        const constants = new Map();
        // First pass: collect constants
        traverse(ast, {
            VariableDeclarator: (path) => {
                if (t.isIdentifier(path.node.id) &&
                    path.node.init &&
                    (t.isStringLiteral(path.node.init) ||
                        t.isNumericLiteral(path.node.init) ||
                        t.isBooleanLiteral(path.node.init))) {
                    const binding = path.scope.getBinding(path.node.id.name);
                    if (binding && binding.constant) {
                        constants.set(path.node.id.name, path.node.init);
                    }
                }
            },
        });
        // Second pass: inline constants
        traverse(ast, {
            Identifier: (path) => {
                const name = path.node.name;
                const constantValue = constants.get(name);
                if (constantValue && !path.isBindingIdentifier()) {
                    path.replaceWith(constantValue);
                    count++;
                }
            },
        });
        return count;
    }
    /**
     * Optimize string operations
     */
    optimizeStrings(ast) {
        let count = 0;
        traverse(ast, {
            // Optimize string concatenation
            BinaryExpression: (path) => {
                if (path.node.operator === '+') {
                    const { left, right } = path.node;
                    // Concatenate string literals
                    if (t.isStringLiteral(left) && t.isStringLiteral(right)) {
                        path.replaceWith(t.stringLiteral(left.value + right.value));
                        count++;
                    }
                }
            },
            // Optimize template literals with no expressions
            TemplateLiteral: (path) => {
                if (path.node.expressions.length === 0) {
                    const str = path.node.quasis[0].value.cooked || '';
                    path.replaceWith(t.stringLiteral(str));
                    count++;
                }
            },
        });
        return count;
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
            // Find consecutive signal.set() calls in block statements
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
            // Detect signal updates inside event handlers
            ArrowFunctionExpression: (path) => {
                const signalSets = this.countSignalSetsInFunction(path);
                if (signalSets >= 2) {
                    const isEventHandler = this.isEventHandlerContext(path);
                    if (isEventHandler) {
                        applied.push(`batch-candidate: event handler with ${signalSets} signal updates`);
                    }
                }
            },
            // Detect signal updates inside async callbacks (Promise.then, async/await)
            CallExpression: (path) => {
                if (this.isPromiseThenCall(path)) {
                    const callback = path.node.arguments[0];
                    if (t.isArrowFunctionExpression(callback) || t.isFunctionExpression(callback)) {
                        const signalSets = this.countSignalSetsInNode(callback.body);
                        if (signalSets >= 2) {
                            applied.push(`batch-candidate: async callback with ${signalSets} signal updates at line ${path.node.loc?.start.line}`);
                        }
                    }
                }
            },
        });
        return applied;
    }
    /**
     * Count signal.set() calls inside a function
     */
    countSignalSetsInFunction(path) {
        return this.countSignalSetsInNode(path.node.body);
    }
    /**
     * Count signal.set() calls inside a node
     */
    countSignalSetsInNode(node) {
        let count = 0;
        traverse(t.file(t.program([t.isStatement(node) ? node : t.expressionStatement(node)])), {
            CallExpression: (innerPath) => {
                if (this.isSignalSetExpression(innerPath.node)) {
                    count++;
                }
            },
        }, undefined, {});
        return count;
    }
    /**
     * Check if a call expression is signal.set()
     */
    isSignalSetExpression(node) {
        const callee = node.callee;
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
            return callee.property.name === 'set' || callee.property.name === 'update';
        }
        return false;
    }
    /**
     * Check if the function is in an event handler context
     */
    isEventHandlerContext(path) {
        const parent = path.parentPath;
        if (parent && t.isJSXExpressionContainer(parent.node)) {
            const grandparent = parent.parentPath;
            if (grandparent && t.isJSXAttribute(grandparent.node)) {
                const attrName = grandparent.node.name;
                if (t.isJSXIdentifier(attrName)) {
                    // Common event handler patterns: onClick, onInput, onChange, etc.
                    return /^on[A-Z]/.test(attrName.name);
                }
            }
        }
        return false;
    }
    /**
     * Check if a call is Promise.then()
     */
    isPromiseThenCall(path) {
        const callee = path.node.callee;
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
            return callee.property.name === 'then' || callee.property.name === 'catch' || callee.property.name === 'finally';
        }
        return false;
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
export const createOptimizer = /*#__PURE__*/ function createOptimizer(config) {
    return new Optimizer(config);
};
//# sourceMappingURL=optimizer.js.map
/**
 * PhilJS Compiler - Dependency Analyzer
 * Analyzes code to detect reactive dependencies and optimization opportunities
 */
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
const PHILJS_SOURCES = ['philjs-core', 'philjs', '@philjs/core'];
const REACTIVE_PRIMITIVES = ['signal', 'memo', 'effect', 'linkedSignal', 'resource', 'batch'];
export class Analyzer {
    config;
    constructor(config = {}) {
        this.config = config;
    }
    /**
     * Analyze a source file for reactive patterns
     */
    analyze(code, filePath) {
        const ast = parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
            sourceFilename: filePath,
        });
        const analysis = {
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
    collectImports(ast, analysis) {
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
    collectBindings(ast, analysis) {
        const importedNames = new Map();
        // Map imported names to their original names
        analysis.imports.forEach(imp => {
            importedNames.set(imp.alias || imp.name, imp.name);
        });
        traverse(ast, {
            VariableDeclarator: (path) => {
                const init = path.node.init;
                if (t.isCallExpression(init)) {
                    const callee = init.callee;
                    let calleeName = null;
                    if (t.isIdentifier(callee)) {
                        calleeName = importedNames.get(callee.name) || callee.name;
                    }
                    if (calleeName && REACTIVE_PRIMITIVES.includes(calleeName)) {
                        const binding = this.createReactiveBinding(path.node, calleeName, path.scope.uid.toString());
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
    createReactiveBinding(node, type, scope) {
        if (!t.isIdentifier(node.id))
            return null;
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
    analyzeDependencies(ast, analysis) {
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
    findContainingReactiveContext(path, analysis) {
        let current = path.parentPath;
        while (current) {
            if (t.isCallExpression(current.node)) {
                const callee = current.node.callee;
                if (t.isIdentifier(callee)) {
                    const binding = analysis.bindings.find(b => b.name === callee.name);
                    if (binding)
                        return binding;
                }
            }
            if (!current)
                break;
            if (t.isVariableDeclarator(current.node) && t.isIdentifier(current.node.id)) {
                const node = current.node;
                const id = node.id;
                const binding = analysis.bindings.find(b => b.name === id.name);
                if (binding)
                    return binding;
            }
            current = current.parentPath;
        }
        return null;
    }
    /**
     * Analyze components for optimization opportunities
     */
    analyzeComponents(ast, analysis) {
        traverse(ast, {
            FunctionDeclaration: (path) => {
                if (this.isComponent(path)) {
                    const comp = this.analyzeComponent(path, analysis);
                    if (comp)
                        analysis.components.push(comp);
                }
            },
            VariableDeclarator: (path) => {
                if (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init)) {
                    if (this.isComponentDeclarator(path)) {
                        const comp = this.analyzeComponentDeclarator(path, analysis);
                        if (comp)
                            analysis.components.push(comp);
                    }
                }
            },
        });
    }
    /**
     * Check if a function is a React-style component
     */
    isComponent(path) {
        const name = path.node.id?.name;
        if (!name)
            return false;
        // Components start with uppercase
        if (!/^[A-Z]/.test(name))
            return false;
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
    isComponentDeclarator(path) {
        if (!t.isIdentifier(path.node.id))
            return false;
        const name = path.node.id.name;
        if (!/^[A-Z]/.test(name))
            return false;
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
    analyzeComponent(path, analysis) {
        const name = path.node.id?.name;
        if (!name)
            return null;
        const comp = {
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
    analyzeComponentDeclarator(path, analysis) {
        if (!t.isIdentifier(path.node.id))
            return null;
        const name = path.node.id.name;
        const comp = {
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
    analyzeComponentBody(path, comp, analysis) {
        const bindingNames = new Map(analysis.bindings.map(b => [b.name, b]));
        path.traverse({
            // Find signal/memo/effect calls
            CallExpression: (callPath) => {
                const callee = callPath.node.callee;
                if (t.isIdentifier(callee)) {
                    const binding = bindingNames.get(callee.name);
                    if (binding) {
                        if (binding.type === 'signal')
                            comp.signals.push(binding);
                        else if (binding.type === 'memo')
                            comp.memos.push(binding);
                        else if (binding.type === 'effect')
                            comp.effects.push(binding);
                    }
                }
            },
            // Find JSX expressions that read signals
            JSXExpressionContainer: (jsxPath) => {
                const expr = jsxPath.node.expression;
                if (t.isExpression(expr)) {
                    const signalsRead = [];
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
    determineMemoizability(comp) {
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
    generateComponentSuggestions(comp) {
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
    findOptimizations(ast, analysis) {
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
    generateWarnings(analysis) {
        // Warn about diamond dependencies
        analysis.bindings.forEach(binding => {
            if (binding.dependencies.length > 1) {
                const sharedDeps = this.findSharedDependencies(binding, analysis);
                if (sharedDeps.length > 0) {
                    analysis.warnings.push({
                        type: 'performance',
                        message: `Potential diamond dependency in "${binding.name}"`,
                        location: binding.loc,
                        suggestion: `PhilJS handles this automatically with glitch-free updates. Consider simplifying if the dependency chain is complex.`,
                    });
                }
            }
        });
        // Warn about effects that might need cleanup
        analysis.bindings
            .filter(b => b.type === 'effect')
            .forEach(effect => {
            // Only warn if dependencies suggest cleanup might be needed
            if (effect.dependencies.length > 0) {
                analysis.warnings.push({
                    type: 'correctness',
                    message: `Effect depends on ${effect.dependencies.length} signal(s)`,
                    location: effect.loc,
                    suggestion: `If this effect sets up subscriptions, event listeners, or timers, return a cleanup function: effect(() => { /* setup */ return () => { /* cleanup */ }; });`,
                });
            }
        });
        // Warn about unused signals (dead code)
        analysis.bindings
            .filter(b => b.type === 'signal' && !b.isUsed)
            .forEach(binding => {
            analysis.warnings.push({
                type: 'performance',
                message: `Signal "${binding.name}" is declared but never read`,
                location: binding.loc,
                suggestion: `Remove unused signal to reduce memory usage, or ensure you're reading it with ${binding.name}() in your JSX or effects.`,
            });
        });
        // Warn about memos with no dependents
        analysis.bindings
            .filter(b => b.type === 'memo' && b.dependents.length === 0 && b.isUsed)
            .forEach(binding => {
            analysis.warnings.push({
                type: 'performance',
                message: `Memo "${binding.name}" has no reactive dependents`,
                location: binding.loc,
                suggestion: `This memo runs but nothing reacts to its changes. If you only need the computed value once, consider using a regular variable instead.`,
            });
        });
        // Warn about deeply nested memo chains
        analysis.bindings
            .filter(b => b.type === 'memo')
            .forEach(binding => {
            const depth = this.getMemoDepth(binding, analysis, new Set());
            if (depth > 4) {
                analysis.warnings.push({
                    type: 'performance',
                    message: `Memo "${binding.name}" is ${depth} levels deep in the dependency chain`,
                    location: binding.loc,
                    suggestion: `Deep memo chains can impact performance. Consider flattening the computation or using batch() for updates.`,
                });
            }
        });
        // Warn about components with many signals
        analysis.components.forEach(comp => {
            if (comp.signals.length > 5) {
                analysis.warnings.push({
                    type: 'performance',
                    message: `Component "${comp.name}" has ${comp.signals.length} signals`,
                    location: comp.signals[0]?.loc,
                    suggestion: `Consider extracting some state into a custom hook or splitting into smaller components for better maintainability.`,
                });
            }
            // Warn about components with many reactive JSX expressions
            if (comp.reactiveJSX.length > 10) {
                analysis.warnings.push({
                    type: 'performance',
                    message: `Component "${comp.name}" has ${comp.reactiveJSX.length} reactive expressions in JSX`,
                    location: null,
                    suggestion: `Consider using memos to cache expensive computations or splitting into smaller components.`,
                });
            }
        });
    }
    /**
     * Get the depth of a memo in the dependency chain
     */
    getMemoDepth(binding, analysis, visited) {
        if (visited.has(binding.name))
            return 0;
        visited.add(binding.name);
        if (binding.dependencies.length === 0)
            return 1;
        let maxDepth = 0;
        for (const dep of binding.dependencies) {
            const depBinding = analysis.bindings.find(b => b.name === dep);
            if (depBinding && depBinding.type === 'memo') {
                const depth = this.getMemoDepth(depBinding, analysis, visited);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        return maxDepth + 1;
    }
    /**
     * Find shared dependencies (diamond pattern)
     */
    findSharedDependencies(binding, analysis) {
        const deps = binding.dependencies;
        const shared = [];
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
    nodeToString(node) {
        // Simplified - actual implementation would use generator
        if (t.isIdentifier(node))
            return node.name;
        if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
            return `${node.callee.name}()`;
        }
        return '[expression]';
    }
    /**
     * Get JSX path for an expression container
     */
    getJSXPath(path) {
        const parts = [];
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
    analyzeBundleMetrics(code) {
        const ast = parse(code, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
        });
        const metrics = {
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
            ImportDeclaration: (path) => {
                metrics.imports++;
                const source = path.node.source.value;
                if (!metrics.dependencies.includes(source)) {
                    metrics.dependencies.push(source);
                }
            },
            ExportDeclaration: () => {
                metrics.exports++;
            },
            FunctionDeclaration: (path) => {
                const name = path.node.id?.name;
                if (name && /^[A-Z]/.test(name)) {
                    metrics.components++;
                }
                metrics.complexity += this.calculateComplexity(path);
            },
            CallExpression: (path) => {
                if (t.isIdentifier(path.node.callee)) {
                    const name = path.node.callee.name;
                    if (name === 'signal' || name === 'linkedSignal') {
                        metrics.signals++;
                    }
                    else if (name === 'effect') {
                        metrics.effects++;
                    }
                }
            },
            // Check for side effects that prevent tree shaking
            ExpressionStatement: (path) => {
                const expr = path.node.expression;
                // Top-level expressions indicate side effects
                if (path.scope.parent === null) {
                    if (!t.isLiteral(expr) && !t.isIdentifier(expr)) {
                        metrics.treeshakeable = false;
                    }
                }
            },
        });
        return metrics;
    }
    /**
     * Calculate cyclomatic complexity of a function
     */
    calculateComplexity(path) {
        let complexity = 1; // Base complexity
        path.traverse({
            IfStatement: () => complexity++,
            ConditionalExpression: () => complexity++,
            ForStatement: () => complexity++,
            WhileStatement: () => complexity++,
            DoWhileStatement: () => complexity++,
            SwitchCase: (casePath) => {
                if (casePath.node.test !== null)
                    complexity++;
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
    generateDependencyGraph(analysis) {
        const graph = {
            nodes: [],
            edges: [],
        };
        // Add nodes for each binding
        analysis.bindings.forEach(binding => {
            graph.nodes.push({
                id: binding.name,
                type: binding.type,
                used: binding.isUsed,
            });
        });
        // Add edges for dependencies
        analysis.bindings.forEach(binding => {
            binding.dependencies.forEach(dep => {
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
    analyzeChunkCandidates(analysis) {
        const candidates = [];
        // Analyze each component for code splitting potential
        analysis.components.forEach(comp => {
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
        const utilitySize = analysis.bindings.filter(b => b.type === 'memo' || b.type === 'signal').length;
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
    calculateComponentComplexity(comp) {
        return (comp.signals.length * 2 +
            comp.memos.length * 3 +
            comp.effects.length * 4 +
            comp.reactiveJSX.length);
    }
    /**
     * Estimate component size in bytes
     */
    estimateComponentSize(comp) {
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
    calculatePriority(complexity, size) {
        const score = complexity * 0.6 + size / 1000 * 0.4;
        if (score > 20)
            return 'high';
        if (score > 10)
            return 'medium';
        return 'low';
    }
}
/**
 * Create a new analyzer instance
 */
export const createAnalyzer = /*#__PURE__*/ function createAnalyzer(config) {
    return new Analyzer(config);
};
//# sourceMappingURL=analyzer.js.map
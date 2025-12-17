/**
 * PhilJS Compiler - Dependency Analyzer
 * Analyzes code to detect reactive dependencies and optimization opportunities
 */
import type { FileAnalysis, CompilerConfig } from './types';
export declare class Analyzer {
    private config;
    constructor(config?: CompilerConfig);
    /**
     * Analyze a source file for reactive patterns
     */
    analyze(code: string, filePath: string): FileAnalysis;
    /**
     * Collect PhilJS imports
     */
    private collectImports;
    /**
     * Collect all reactive bindings
     */
    private collectBindings;
    /**
     * Create a reactive binding from a variable declarator
     */
    private createReactiveBinding;
    /**
     * Analyze dependencies between reactive bindings
     */
    private analyzeDependencies;
    /**
     * Find the containing reactive context (memo, effect, etc.)
     */
    private findContainingReactiveContext;
    /**
     * Analyze components for optimization opportunities
     */
    private analyzeComponents;
    /**
     * Check if a function is a React-style component
     */
    private isComponent;
    /**
     * Check if a variable declarator is a component
     */
    private isComponentDeclarator;
    /**
     * Analyze a function component
     */
    private analyzeComponent;
    /**
     * Analyze a component declared as a variable
     */
    private analyzeComponentDeclarator;
    /**
     * Analyze component body for reactive patterns
     */
    private analyzeComponentBody;
    /**
     * Determine if a component can be safely memoized
     */
    private determineMemoizability;
    /**
     * Generate optimization suggestions for a component
     */
    private generateComponentSuggestions;
    /**
     * Find optimization opportunities in the code
     */
    private findOptimizations;
    /**
     * Generate warnings about potential issues
     */
    private generateWarnings;
    /**
     * Find shared dependencies (diamond pattern)
     */
    private findSharedDependencies;
    /**
     * Convert AST node to string representation
     */
    private nodeToString;
    /**
     * Get JSX path for an expression container
     */
    private getJSXPath;
}
/**
 * Create a new analyzer instance
 */
export declare function createAnalyzer(config?: CompilerConfig): Analyzer;
//# sourceMappingURL=analyzer.d.ts.map
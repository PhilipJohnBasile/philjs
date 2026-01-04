/**
 * PhilJS Compiler - Dependency Analyzer
 * Analyzes code to detect reactive dependencies and optimization opportunities
 */
import type { FileAnalysis, CompilerConfig } from './types.js';
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
     * Get the depth of a memo in the dependency chain
     */
    private getMemoDepth;
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
    /**
     * Analyze bundle for production metrics
     */
    analyzeBundleMetrics(code: string): BundleMetrics;
    /**
     * Calculate cyclomatic complexity of a function
     */
    private calculateComplexity;
    /**
     * Generate dependency graph
     */
    generateDependencyGraph(analysis: FileAnalysis): DependencyGraph;
    /**
     * Analyze chunk candidates for code splitting
     */
    analyzeChunkCandidates(analysis: FileAnalysis): ChunkCandidate[];
    /**
     * Calculate component complexity
     */
    private calculateComponentComplexity;
    /**
     * Estimate component size in bytes
     */
    private estimateComponentSize;
    /**
     * Calculate splitting priority
     */
    private calculatePriority;
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
export declare const createAnalyzer: (config?: CompilerConfig) => Analyzer;
//# sourceMappingURL=analyzer.d.ts.map
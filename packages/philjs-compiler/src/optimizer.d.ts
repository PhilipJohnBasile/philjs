/**
 * PhilJS Compiler - Optimizer
 * Applies automatic optimizations to PhilJS code
 */
import type { CompilerConfig, TransformResult } from './types';
export declare class Optimizer {
    private config;
    private analyzer;
    private deadCodeEliminator;
    private codeSplitter;
    constructor(config?: CompilerConfig);
    /**
     * Optimize source code
     */
    optimize(code: string, filePath: string): TransformResult;
    /**
     * Apply production-specific optimizations
     */
    private applyProductionOptimizations;
    /**
     * Check if an expression is a development environment check
     */
    private isDevEnvCheck;
    /**
     * Inline constant values
     */
    private inlineConstants;
    /**
     * Optimize string operations
     */
    private optimizeStrings;
    /**
     * Apply automatic memoization
     */
    private applyAutoMemo;
    /**
     * Apply automatic batching
     */
    private applyAutoBatch;
    /**
     * Count signal.set() calls inside a function
     */
    private countSignalSetsInFunction;
    /**
     * Count signal.set() calls inside a node
     */
    private countSignalSetsInNode;
    /**
     * Check if a call expression is signal.set()
     */
    private isSignalSetExpression;
    /**
     * Check if the function is in an event handler context
     */
    private isEventHandlerContext;
    /**
     * Check if a call is Promise.then()
     */
    private isPromiseThenCall;
    /**
     * Apply dead code elimination
     */
    private applyDeadCodeElimination;
    /**
     * Apply effect optimizations
     */
    private applyEffectOptimizations;
    /**
     * Apply component-level optimizations
     */
    private applyComponentOptimizations;
    /**
     * Ensure necessary imports are present
     */
    private ensureImports;
    private isExpensiveComputation;
    private wrapInMemo;
    private isAlreadyMemo;
    private isSignalSet;
    private findConsecutiveRanges;
    private wrapInBatch;
    private isSafeToRemove;
    private isEffectCall;
    private effectHasCleanup;
    private optimizeEffectDependencies;
    private hasImport;
    private getExpressionName;
}
/**
 * Create a new optimizer instance
 */
export declare const createOptimizer: (config?: CompilerConfig) => Optimizer;
//# sourceMappingURL=optimizer.d.ts.map
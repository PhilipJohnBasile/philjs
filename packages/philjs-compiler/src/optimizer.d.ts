/**
 * PhilJS Compiler - Optimizer
 * Applies automatic optimizations to PhilJS code
 */
import type { CompilerConfig, TransformResult } from './types';
export declare class Optimizer {
    private config;
    private analyzer;
    constructor(config?: CompilerConfig);
    /**
     * Optimize source code
     */
    optimize(code: string, filePath: string): TransformResult;
    /**
     * Apply automatic memoization
     */
    private applyAutoMemo;
    /**
     * Apply automatic batching
     */
    private applyAutoBatch;
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
export declare function createOptimizer(config?: CompilerConfig): Optimizer;
//# sourceMappingURL=optimizer.d.ts.map
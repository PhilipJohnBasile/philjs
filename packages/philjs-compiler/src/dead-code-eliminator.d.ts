/**
 * PhilJS Compiler - Enhanced Dead Code Elimination
 * Detects and removes unused signals, effects, and other reactive primitives
 */
import * as t from '@babel/types';
import type { FileAnalysis, CompilerConfig } from './types.js';
export interface DeadCodeReport {
    unusedSignals: string[];
    unusedMemos: string[];
    unusedEffects: string[];
    unusedComponents: string[];
    totalRemoved: number;
    sizeReduction: number;
}
export declare class DeadCodeEliminator {
    private config;
    constructor(config?: CompilerConfig);
    /**
     * Eliminate dead code from AST based on analysis
     */
    eliminate(ast: t.File, analysis: FileAnalysis): DeadCodeReport;
    /**
     * Check if a binding is safe to remove
     */
    private isSafeToRemove;
    /**
     * Mark a call expression as pure
     */
    private markAsPure;
    /**
     * Generate a report summary
     */
    static formatReport(report: DeadCodeReport): string;
}
/**
 * Create a new dead code eliminator instance
 */
export declare const createDeadCodeEliminator: (config?: CompilerConfig) => DeadCodeEliminator;
//# sourceMappingURL=dead-code-eliminator.d.ts.map
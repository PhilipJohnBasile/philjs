/**
 * Testing utilities for PhilJS Optimizer
 */
import type { Symbol, DependencyGraph, OptimizerOptions } from './types.js';
/**
 * Test helper to create symbols
 */
export declare function createTestSymbol(overrides?: Partial<Symbol>): Symbol;
/**
 * Test helper to create a dependency graph
 */
export declare function createTestGraph(symbols: Symbol[]): DependencyGraph;
/**
 * Mock optimizer for testing
 */
export declare class MockOptimizer {
    private symbols;
    addSymbol(symbol: Symbol): void;
    addSymbols(symbols: Symbol[]): void;
    getSymbols(): Symbol[];
    getGraph(): DependencyGraph;
    bundle(strategy?: string, options?: Partial<OptimizerOptions>): Map<string, Symbol[]>;
    clear(): void;
}
/**
 * Helper to extract symbols from test code
 */
export declare function extractTestSymbols(code: string, filePath?: string): Symbol[];
/**
 * Helper to assert symbol properties
 */
export declare function assertSymbol(symbol: Symbol, expected: Partial<Symbol>): void;
/**
 * Helper to assert graph structure
 */
export declare function assertGraphStructure(graph: DependencyGraph, expected: {
    symbolCount?: number;
    edges?: Array<[string, string]>;
    cycles?: boolean;
}): void;
/**
 * Helper to measure optimization performance
 */
export declare function measureOptimization(code: string, options?: Partial<OptimizerOptions>): Promise<{
    duration: number;
    symbols: number;
    lazySymbols: number;
    chunks: number;
    avgChunkSize: number;
}>;
/**
 * Helper to compare optimization strategies
 */
export declare function compareStrategies(code: string, strategies?: string[]): Map<string, {
    chunks: number;
    avgChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
}>;
/**
 * Helper to generate test code samples
 */
export declare function generateTestCode(config: {
    components?: number;
    handlers?: number;
    stores?: number;
}): string;
/**
 * Snapshot testing helper
 */
export declare function snapshotOptimization(code: string, name: string): {
    name: string;
    symbols: Array<{
        name: string;
        type: string;
        isLazy: boolean;
        dependencies: string[];
    }>;
    chunks: Map<string, string[]>;
};
//# sourceMappingURL=test-utils.d.ts.map
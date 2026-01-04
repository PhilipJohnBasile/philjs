/**
 * Symbol extraction and management
 */
import type { Symbol, SymbolType, OptimizerOptions } from './types.js';
/**
 * Extract symbols from source code
 */
export declare function extractSymbols(source: string, filePath: string, options: OptimizerOptions): Symbol[];
/**
 * Generate a unique symbol ID
 */
export declare function generateSymbolId(filePath: string, name: string, position: number): string;
/**
 * Create a symbol registry
 */
export declare class SymbolRegistry {
    private symbols;
    add(symbol: Symbol): void;
    get(id: string): Symbol | undefined;
    has(id: string): boolean;
    getAll(): Symbol[];
    getByType(type: SymbolType): Symbol[];
    getByFile(filePath: string): Symbol[];
    clear(): void;
}
//# sourceMappingURL=symbols.d.ts.map
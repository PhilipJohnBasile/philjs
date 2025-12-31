/**
 * AST transformation for lazy loading
 */
import type { TransformResult, OptimizerOptions } from './types.js';
/**
 * Transform source code to enable lazy loading
 */
export declare function transform(source: string, filePath: string, options: OptimizerOptions): TransformResult;
/**
 * Extract lazy handler chunks from source
 */
export declare function extractLazyChunks(source: string, filePath: string): Map<string, string>;
/**
 * Generate import statements for lazy chunks
 */
export declare function generateLazyImports(symbolIds: string[], baseUrl?: string): string;
/**
 * Inject lazy handler registrations
 */
export declare function injectHandlerRegistrations(source: string, handlers: Map<string, string>): string;
/**
 * Create a loader function for a symbol
 */
export declare function createSymbolLoader(symbolId: string, modulePath: string): string;
/**
 * Generate manifest file
 */
export declare function generateManifest(symbols: Map<string, {
    modulePath: string;
    dependencies: string[];
}>): string;
//# sourceMappingURL=transform.d.ts.map
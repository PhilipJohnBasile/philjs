/**
 * PhilJS Optimizer - Qwik-style lazy loading and code splitting
 */
export type { Symbol, SymbolType, DependencyGraph, ChunkManifest, OptimizerOptions, SymbolPattern, ExtractionContext, TransformResult, BundleStrategy, LazyHandler, RuntimeConfig, } from './types.js';
import type { OptimizerOptions } from './types.js';
export { extractSymbols, generateSymbolId, SymbolRegistry, } from './symbols.js';
export { buildDependencyGraph, getAllDependencies, getAllDependents, detectCircularDependencies, topologicalSort, findEntryPoints, findLeafNodes, calculateDepth, groupByDepth, findCommonDependencies, calculateCohesion, } from './dependency-graph.js';
export { bundleSymbols, getStrategy, defaultStrategy, aggressiveStrategy, conservativeStrategy, routeStrategy, depthStrategy, sizeStrategy, hybridStrategy, } from './bundler.js';
export { transform, extractLazyChunks, generateLazyImports, injectHandlerRegistrations, createSymbolLoader, generateManifest, } from './transform.js';
export { SymbolLoader, initSymbolLoader, getSymbolLoader, loadSymbol, prefetchSymbol, HandlerRunner, getHandlerRunner, executeHandler, DeferredQueue, getDeferredQueue, deferHandler, } from './runtime.js';
/**
 * Create an optimizer instance
 */
export declare function createOptimizer(options: OptimizerOptions): {
    registry: any;
    options: OptimizerOptions;
    /**
     * Process a file
     */
    processFile(source: string, filePath: string): Promise<any>;
    /**
     * Build dependency graph
     */
    buildGraph(): any;
    /**
     * Bundle symbols
     */
    bundle(strategy?: string): any;
    /**
     * Get optimization stats
     */
    getStats(): {
        totalSymbols: any;
        lazySymbols: any;
        files: number;
        avgDependencies: number;
    };
};
//# sourceMappingURL=index.d.ts.map
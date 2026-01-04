/**
 * PhilJS Optimizer - Qwik-style lazy loading and code splitting
 */
// Symbol extraction
export { extractSymbols, generateSymbolId, SymbolRegistry, } from './symbols.js';
// Dependency graph
export { buildDependencyGraph, getAllDependencies, getAllDependents, detectCircularDependencies, topologicalSort, findEntryPoints, findLeafNodes, calculateDepth, groupByDepth, findCommonDependencies, calculateCohesion, } from './dependency-graph.js';
// Bundling strategies
export { bundleSymbols, getStrategy, defaultStrategy, aggressiveStrategy, conservativeStrategy, routeStrategy, depthStrategy, sizeStrategy, hybridStrategy, } from './bundler.js';
// Transformation
export { transform, extractLazyChunks, generateLazyImports, injectHandlerRegistrations, createSymbolLoader, generateManifest, } from './transform.js';
// Runtime
export { SymbolLoader, initSymbolLoader, getSymbolLoader, loadSymbol, prefetchSymbol, HandlerRunner, getHandlerRunner, executeHandler, DeferredQueue, getDeferredQueue, deferHandler, } from './runtime.js';
/**
 * Create an optimizer instance
 */
export function createOptimizer(options) {
    const { SymbolRegistry } = require('./symbols.js');
    const registry = new SymbolRegistry();
    return {
        registry,
        options,
        /**
         * Process a file
         */
        async processFile(source, filePath) {
            const { extractSymbols } = require('./symbols.js');
            const { transform } = require('./transform.js');
            // Extract symbols
            const symbols = extractSymbols(source, filePath, options);
            // Add to registry
            for (const symbol of symbols) {
                registry.add(symbol);
            }
            // Transform the code
            const result = transform(source, filePath, options);
            return result;
        },
        /**
         * Build dependency graph
         */
        buildGraph() {
            const { buildDependencyGraph } = require('./dependency-graph.js');
            return buildDependencyGraph(registry.getAll());
        },
        /**
         * Bundle symbols
         */
        bundle(strategy = 'hybrid') {
            const { bundleSymbols } = require('./bundler.js');
            const graph = this.buildGraph();
            return bundleSymbols(graph, options, strategy);
        },
        /**
         * Get optimization stats
         */
        getStats() {
            const symbols = registry.getAll();
            const lazySymbols = symbols.filter((s) => s.isLazy);
            const graph = this.buildGraph();
            return {
                totalSymbols: symbols.length,
                lazySymbols: lazySymbols.length,
                files: new Set(symbols.map((s) => s.filePath)).size,
                avgDependencies: symbols.reduce((sum, s) => sum + s.dependencies.length, 0) /
                    symbols.length,
            };
        },
    };
}
//# sourceMappingURL=index.js.map
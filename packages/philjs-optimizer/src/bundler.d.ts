/**
 * Smart bundling strategies for optimal code splitting
 */
import type { Symbol, DependencyGraph, OptimizerOptions, BundleStrategy } from './types.js';
/**
 * Default bundling strategy: group by type and dependencies
 */
export declare const defaultStrategy: BundleStrategy;
/**
 * Aggressive strategy: maximize granularity
 * Each symbol gets its own chunk
 */
export declare const aggressiveStrategy: BundleStrategy;
/**
 * Conservative strategy: minimize chunks
 * Group symbols with high cohesion together
 */
export declare const conservativeStrategy: BundleStrategy;
/**
 * Route-based strategy: group by route/page
 */
export declare const routeStrategy: BundleStrategy;
/**
 * Depth-based strategy: group by dependency depth
 */
export declare const depthStrategy: BundleStrategy;
/**
 * Size-based strategy: group symbols to meet size constraints
 */
export declare const sizeStrategy: BundleStrategy;
/**
 * Hybrid strategy: combines multiple strategies
 */
export declare const hybridStrategy: BundleStrategy;
/**
 * Get bundling strategy by name
 */
export declare function getStrategy(name: string): BundleStrategy;
/**
 * Bundle symbols using a strategy
 */
export declare function bundleSymbols(graph: DependencyGraph, options: OptimizerOptions, strategyName?: string): Map<string, Symbol[]>;
//# sourceMappingURL=bundler.d.ts.map
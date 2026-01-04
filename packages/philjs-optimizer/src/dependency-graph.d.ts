/**
 * Dependency graph analysis for smart bundling
 */
import type { Symbol, DependencyGraph } from './types.js';
/**
 * Build a dependency graph from symbols
 */
export declare function buildDependencyGraph(symbols: Symbol[]): DependencyGraph;
/**
 * Get all dependencies of a symbol (recursive)
 */
export declare function getAllDependencies(graph: DependencyGraph, symbolId: string, visited?: Set<string>): Set<string>;
/**
 * Get all dependents of a symbol (recursive)
 */
export declare function getAllDependents(graph: DependencyGraph, symbolId: string, visited?: Set<string>): Set<string>;
/**
 * Detect circular dependencies
 */
export declare function detectCircularDependencies(graph: DependencyGraph): string[][];
/**
 * Topological sort of symbols
 */
export declare function topologicalSort(graph: DependencyGraph): string[];
/**
 * Find entry points (symbols with no dependents)
 */
export declare function findEntryPoints(graph: DependencyGraph): string[];
/**
 * Find leaf nodes (symbols with no dependencies)
 */
export declare function findLeafNodes(graph: DependencyGraph): string[];
/**
 * Calculate symbol depth in the dependency tree
 */
export declare function calculateDepth(graph: DependencyGraph, symbolId: string): number;
/**
 * Group symbols by depth level
 */
export declare function groupByDepth(graph: DependencyGraph): Map<number, string[]>;
/**
 * Find common dependencies between symbols
 */
export declare function findCommonDependencies(graph: DependencyGraph, symbolIds: string[]): Set<string>;
/**
 * Calculate module cohesion score (0-1)
 * Higher score means symbols are more tightly coupled
 */
export declare function calculateCohesion(graph: DependencyGraph, symbolIds: string[]): number;
//# sourceMappingURL=dependency-graph.d.ts.map
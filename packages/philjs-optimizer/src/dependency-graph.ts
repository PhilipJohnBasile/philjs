/**
 * Dependency graph analysis for smart bundling
 */

import type { Symbol, DependencyGraph } from './types.js';

/**
 * Build a dependency graph from symbols
 */
export function buildDependencyGraph(symbols: Symbol[]): DependencyGraph {
  const graph: DependencyGraph = {
    symbols: new Map(),
    dependents: new Map(),
    dependencies: new Map(),
  };

  // Add all symbols to the graph
  for (const symbol of symbols) {
    graph.symbols.set(symbol.id, symbol);
    graph.dependents.set(symbol.id, new Set());
    graph.dependencies.set(symbol.id, new Set());
  }

  // Build dependency edges
  for (const symbol of symbols) {
    for (const depName of symbol.dependencies) {
      // Find the symbol that matches this dependency name
      const depSymbol = Array.from(graph.symbols.values()).find(
        (s) => s.name === depName
      );

      if (depSymbol) {
        // Add dependency edge
        graph.dependencies.get(symbol.id)?.add(depSymbol.id);
        // Add dependent edge (reverse)
        graph.dependents.get(depSymbol.id)?.add(symbol.id);
      }
    }
  }

  return graph;
}

/**
 * Get all dependencies of a symbol (recursive)
 */
export function getAllDependencies(
  graph: DependencyGraph,
  symbolId: string,
  visited = new Set<string>()
): Set<string> {
  if (visited.has(symbolId)) {
    return visited;
  }

  visited.add(symbolId);

  const deps = graph.dependencies.get(symbolId);
  if (deps) {
    for (const depId of deps) {
      getAllDependencies(graph, depId, visited);
    }
  }

  return visited;
}

/**
 * Get all dependents of a symbol (recursive)
 */
export function getAllDependents(
  graph: DependencyGraph,
  symbolId: string,
  visited = new Set<string>()
): Set<string> {
  if (visited.has(symbolId)) {
    return visited;
  }

  visited.add(symbolId);

  const deps = graph.dependents.get(symbolId);
  if (deps) {
    for (const depId of deps) {
      getAllDependents(graph, depId, visited);
    }
  }

  return visited;
}

/**
 * Detect circular dependencies
 */
export function detectCircularDependencies(
  graph: DependencyGraph
): string[][] {
  const circles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(symbolId: string, path: string[]): void {
    visited.add(symbolId);
    recursionStack.add(symbolId);
    path.push(symbolId);

    const deps = graph.dependencies.get(symbolId);
    if (deps) {
      for (const depId of deps) {
        if (!visited.has(depId)) {
          dfs(depId, [...path]);
        } else if (recursionStack.has(depId)) {
          // Found a cycle
          const cycleStart = path.indexOf(depId);
          circles.push(path.slice(cycleStart));
        }
      }
    }

    recursionStack.delete(symbolId);
  }

  for (const symbolId of graph.symbols.keys()) {
    if (!visited.has(symbolId)) {
      dfs(symbolId, []);
    }
  }

  return circles;
}

/**
 * Topological sort of symbols
 */
export function topologicalSort(graph: DependencyGraph): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const tempMarked = new Set<string>();

  function visit(symbolId: string): void {
    if (tempMarked.has(symbolId)) {
      throw new Error(
        `Circular dependency detected involving ${symbolId}`
      );
    }

    if (visited.has(symbolId)) {
      return;
    }

    tempMarked.add(symbolId);

    const deps = graph.dependencies.get(symbolId);
    if (deps) {
      for (const depId of deps) {
        visit(depId);
      }
    }

    tempMarked.delete(symbolId);
    visited.add(symbolId);
    sorted.push(symbolId);
  }

  for (const symbolId of graph.symbols.keys()) {
    if (!visited.has(symbolId)) {
      visit(symbolId);
    }
  }

  return sorted;
}

/**
 * Find entry points (symbols with no dependents)
 */
export function findEntryPoints(graph: DependencyGraph): string[] {
  const entryPoints: string[] = [];

  for (const [symbolId, dependents] of graph.dependents) {
    if (dependents.size === 0) {
      entryPoints.push(symbolId);
    }
  }

  return entryPoints;
}

/**
 * Find leaf nodes (symbols with no dependencies)
 */
export function findLeafNodes(graph: DependencyGraph): string[] {
  const leafNodes: string[] = [];

  for (const [symbolId, dependencies] of graph.dependencies) {
    if (dependencies.size === 0) {
      leafNodes.push(symbolId);
    }
  }

  return leafNodes;
}

/**
 * Calculate symbol depth in the dependency tree
 */
export function calculateDepth(
  graph: DependencyGraph,
  symbolId: string
): number {
  const deps = graph.dependencies.get(symbolId);
  if (!deps || deps.size === 0) {
    return 0;
  }

  let maxDepth = 0;
  for (const depId of deps) {
    const depth = calculateDepth(graph, depId);
    maxDepth = Math.max(maxDepth, depth);
  }

  return maxDepth + 1;
}

/**
 * Group symbols by depth level
 */
export function groupByDepth(
  graph: DependencyGraph
): Map<number, string[]> {
  // ES2024: Use Map.groupBy() for cleaner grouping
  const symbolIds = Array.from(graph.symbols.keys());
  return Map.groupBy(symbolIds, (symbolId) => calculateDepth(graph, symbolId));
}

/**
 * Find common dependencies between symbols
 */
export function findCommonDependencies(
  graph: DependencyGraph,
  symbolIds: string[]
): Set<string> {
  if (symbolIds.length === 0) return new Set();

  const allDeps = symbolIds.map((id) =>
    getAllDependencies(graph, id, new Set())
  );

  // Find intersection of all dependency sets
  const firstDeps = allDeps[0];
  if (!firstDeps) return new Set();
  let common = new Set(firstDeps);
  for (let i = 1; i < allDeps.length; i++) {
    const deps = allDeps[i];
    if (deps) {
      common = new Set(
        Array.from(common).filter((id) => deps.has(id))
      );
    }
  }

  return common;
}

/**
 * Calculate module cohesion score (0-1)
 * Higher score means symbols are more tightly coupled
 */
export function calculateCohesion(
  graph: DependencyGraph,
  symbolIds: string[]
): number {
  if (symbolIds.length < 2) return 0;

  let internalEdges = 0;
  let totalPossibleEdges = 0;

  const symbolSet = new Set(symbolIds);

  for (const symbolId of symbolIds) {
    const deps = graph.dependencies.get(symbolId);
    if (deps) {
      for (const depId of deps) {
        if (symbolSet.has(depId)) {
          internalEdges++;
        }
      }
    }
    totalPossibleEdges += symbolIds.length - 1;
  }

  return totalPossibleEdges > 0 ? internalEdges / totalPossibleEdges : 0;
}

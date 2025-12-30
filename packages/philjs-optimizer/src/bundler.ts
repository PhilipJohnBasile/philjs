/**
 * Smart bundling strategies for optimal code splitting
 */

import type {
  Symbol,
  DependencyGraph,
  OptimizerOptions,
  BundleStrategy,
} from './types.js';
import {
  findCommonDependencies,
  getAllDependencies,
  calculateCohesion,
  groupByDepth,
} from './dependency-graph.js';

/**
 * Default bundling strategy: group by type and dependencies
 */
export const defaultStrategy: BundleStrategy = {
  name: 'default',
  bundle: (graph, options) => {
    const chunks = new Map<string, Symbol[]>();

    // Separate lazy symbols from regular symbols
    const lazySymbols: Symbol[] = [];
    const regularSymbols: Symbol[] = [];

    for (const symbol of graph.symbols.values()) {
      if (symbol.isLazy) {
        lazySymbols.push(symbol);
      } else {
        regularSymbols.push(symbol);
      }
    }

    // Each lazy symbol gets its own chunk
    for (const symbol of lazySymbols) {
      chunks.set(symbol.id, [symbol]);
    }

    // ES2024: Group regular symbols by file using Map.groupBy()
    const byFile = Map.groupBy(regularSymbols, (symbol) => symbol.filePath);

    // Add file-based chunks
    for (const [filePath, symbols] of byFile) {
      const chunkId = `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      chunks.set(chunkId, symbols);
    }

    return chunks;
  },
};

/**
 * Aggressive strategy: maximize granularity
 * Each symbol gets its own chunk
 */
export const aggressiveStrategy: BundleStrategy = {
  name: 'aggressive',
  bundle: (graph) => {
    const chunks = new Map<string, Symbol[]>();

    for (const symbol of graph.symbols.values()) {
      chunks.set(symbol.id, [symbol]);
    }

    return chunks;
  },
};

/**
 * Conservative strategy: minimize chunks
 * Group symbols with high cohesion together
 */
export const conservativeStrategy: BundleStrategy = {
  name: 'conservative',
  bundle: (graph, options) => {
    const chunks = new Map<string, Symbol[]>();
    const processed = new Set<string>();

    // Group symbols with high cohesion
    for (const symbol of graph.symbols.values()) {
      if (processed.has(symbol.id)) continue;

      // Find symbols with dependencies on this symbol
      const related = findRelatedSymbols(graph, symbol.id);
      const symbolIds = [symbol.id, ...Array.from(related)];

      // Calculate cohesion
      const cohesion = calculateCohesion(graph, symbolIds);

      // If cohesion is high enough, group them
      if (cohesion > 0.5 || symbolIds.length === 1) {
        const chunkSymbols = symbolIds
          .map((id) => graph.symbols.get(id))
          .filter((s): s is Symbol => s !== undefined);

        chunks.set(`chunk_${symbol.id}`, chunkSymbols);

        for (const id of symbolIds) {
          processed.add(id);
        }
      }
    }

    return chunks;
  },
};

/**
 * Route-based strategy: group by route/page
 */
export const routeStrategy: BundleStrategy = {
  name: 'route',
  bundle: (graph) => {
    const chunks = new Map<string, Symbol[]>();

    // ES2024: Group by route using Map.groupBy()
    const symbols = Array.from(graph.symbols.values());
    const byRoute = Map.groupBy(symbols, (symbol) => extractRoute(symbol.filePath));

    for (const [route, symbols] of byRoute) {
      chunks.set(`route_${route}`, symbols);
    }

    return chunks;
  },
};

/**
 * Depth-based strategy: group by dependency depth
 */
export const depthStrategy: BundleStrategy = {
  name: 'depth',
  bundle: (graph) => {
    const chunks = new Map<string, Symbol[]>();
    const depthGroups = groupByDepth(graph);

    for (const [depth, symbolIds] of depthGroups) {
      const symbols = symbolIds
        .map((id) => graph.symbols.get(id))
        .filter((s): s is Symbol => s !== undefined);

      chunks.set(`depth_${depth}`, symbols);
    }

    return chunks;
  },
};

/**
 * Size-based strategy: group symbols to meet size constraints
 */
export const sizeStrategy: BundleStrategy = {
  name: 'size',
  bundle: (graph, options) => {
    const chunks = new Map<string, Symbol[]>();
    const minSize = options.minChunkSize || 1024; // 1KB
    const maxSize = options.maxChunkSize || 51200; // 50KB

    let currentChunk: Symbol[] = [];
    let currentSize = 0;
    let chunkIndex = 0;

    for (const symbol of graph.symbols.values()) {
      const symbolSize = symbol.end - symbol.start;

      // If adding this symbol would exceed max size, start a new chunk
      if (currentSize + symbolSize > maxSize && currentChunk.length > 0) {
        chunks.set(`size_chunk_${chunkIndex++}`, [...currentChunk]);
        currentChunk = [];
        currentSize = 0;
      }

      currentChunk.push(symbol);
      currentSize += symbolSize;

      // If we've reached min size and have lazy symbols, start a new chunk
      if (currentSize >= minSize && symbol.isLazy) {
        chunks.set(`size_chunk_${chunkIndex++}`, [...currentChunk]);
        currentChunk = [];
        currentSize = 0;
      }
    }

    // Add remaining symbols
    if (currentChunk.length > 0) {
      chunks.set(`size_chunk_${chunkIndex}`, currentChunk);
    }

    return chunks;
  },
};

/**
 * Hybrid strategy: combines multiple strategies
 */
export const hybridStrategy: BundleStrategy = {
  name: 'hybrid',
  bundle: (graph, options) => {
    const chunks = new Map<string, Symbol[]>();

    // 1. Lazy symbols get individual chunks
    const lazySymbols = Array.from(graph.symbols.values()).filter(
      (s) => s.isLazy
    );
    for (const symbol of lazySymbols) {
      chunks.set(`lazy_${symbol.id}`, [symbol]);
    }

    // 2. ES2024: Group non-lazy symbols by route using Map.groupBy()
    const regularSymbols = Array.from(graph.symbols.values()).filter(
      (s) => !s.isLazy
    );
    const byRoute = Map.groupBy(regularSymbols, (symbol) => extractRoute(symbol.filePath));

    // 3. Split large route chunks by size
    for (const [route, symbols] of byRoute) {
      const totalSize = symbols.reduce((sum, s) => sum + (s.end - s.start), 0);
      const maxSize = options.maxChunkSize || 51200;

      if (totalSize > maxSize) {
        // Split into multiple chunks
        let chunkIndex = 0;
        let currentChunk: Symbol[] = [];
        let currentSize = 0;

        for (const symbol of symbols) {
          const symbolSize = symbol.end - symbol.start;

          if (currentSize + symbolSize > maxSize && currentChunk.length > 0) {
            chunks.set(`route_${route}_${chunkIndex++}`, [...currentChunk]);
            currentChunk = [];
            currentSize = 0;
          }

          currentChunk.push(symbol);
          currentSize += symbolSize;
        }

        if (currentChunk.length > 0) {
          chunks.set(`route_${route}_${chunkIndex}`, currentChunk);
        }
      } else {
        chunks.set(`route_${route}`, symbols);
      }
    }

    return chunks;
  },
};

/**
 * Helper: Find related symbols (dependencies and dependents)
 */
function findRelatedSymbols(
  graph: DependencyGraph,
  symbolId: string
): Set<string> {
  const related = new Set<string>();

  const deps = graph.dependencies.get(symbolId);
  if (deps) {
    for (const depId of deps) {
      related.add(depId);
    }
  }

  const dependents = graph.dependents.get(symbolId);
  if (dependents) {
    for (const depId of dependents) {
      related.add(depId);
    }
  }

  return related;
}

/**
 * Helper: Extract route from file path
 */
function extractRoute(filePath: string): string {
  // Extract route from common patterns:
  // - pages/about.tsx -> about
  // - routes/blog/[id].tsx -> blog/[id]
  // - src/app/dashboard/page.tsx -> dashboard

  const patterns = [
    /pages\/(.+?)(?:\.[^.]+)?$/,
    /routes\/(.+?)(?:\.[^.]+)?$/,
    /app\/(.+?)\/page(?:\.[^.]+)?$/,
    /src\/(.+?)(?:\.[^.]+)?$/,
  ];

  for (const pattern of patterns) {
    const match = filePath.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\\/g, '/');
    }
  }

  // Fallback: use the file name
  const segments = filePath.split(/[/\\]/);
  return (segments[segments.length - 1] ?? '').replace(/\.[^.]+$/, '');
}

/**
 * Get bundling strategy by name
 */
export function getStrategy(name: string): BundleStrategy {
  const strategies: Record<string, BundleStrategy> = {
    default: defaultStrategy,
    aggressive: aggressiveStrategy,
    conservative: conservativeStrategy,
    route: routeStrategy,
    depth: depthStrategy,
    size: sizeStrategy,
    hybrid: hybridStrategy,
  };

  return strategies[name] || defaultStrategy;
}

/**
 * Bundle symbols using a strategy
 */
export function bundleSymbols(
  graph: DependencyGraph,
  options: OptimizerOptions,
  strategyName = 'hybrid'
): Map<string, Symbol[]> {
  const strategy = getStrategy(strategyName);
  return strategy.bundle(graph, options);
}

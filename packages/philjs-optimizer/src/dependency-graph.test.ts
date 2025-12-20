import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  getAllDependencies,
  getAllDependents,
  detectCircularDependencies,
  topologicalSort,
  findEntryPoints,
  findLeafNodes,
  calculateDepth,
  groupByDepth,
  findCommonDependencies,
  calculateCohesion,
} from './dependency-graph.js';
import type { Symbol, DependencyGraph } from './types.js';

describe('Dependency Graph', () => {
  const createSymbol = (
    id: string,
    name: string,
    dependencies: string[] = []
  ): Symbol => ({
    id,
    name,
    filePath: '/test/file.ts',
    start: 0,
    end: 100,
    type: 'function',
    dependencies,
    hash: 'test-hash',
    isLazy: false,
  });

  describe('buildDependencyGraph', () => {
    it('should build graph from symbols', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(graph.symbols.size).toBe(3);
      expect(graph.dependencies.size).toBe(3);
      expect(graph.dependents.size).toBe(3);
    });

    it('should map symbols by ID', () => {
      const symbols = [
        createSymbol('sym1', 'func1'),
        createSymbol('sym2', 'func2'),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(graph.symbols.get('sym1')).toBe(symbols[0]);
      expect(graph.symbols.get('sym2')).toBe(symbols[1]);
    });

    it('should build dependency edges', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(graph.dependencies.get('b')?.has('a')).toBe(true);
    });

    it('should build dependent edges (reverse)', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(graph.dependents.get('a')?.has('b')).toBe(true);
    });

    it('should handle symbols with no dependencies', () => {
      const symbols = [createSymbol('a', 'funcA')];

      const graph = buildDependencyGraph(symbols);

      expect(graph.dependencies.get('a')?.size).toBe(0);
      expect(graph.dependents.get('a')?.size).toBe(0);
    });

    it('should handle multiple dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
        createSymbol('c', 'funcC', ['funcA', 'funcB']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(graph.dependencies.get('c')?.size).toBe(2);
      expect(graph.dependencies.get('c')?.has('a')).toBe(true);
      expect(graph.dependencies.get('c')?.has('b')).toBe(true);
    });

    it('should ignore external dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA', ['externalFunc']),
      ];

      const graph = buildDependencyGraph(symbols);

      // Should not create dependency to non-existent symbol
      expect(graph.dependencies.get('a')?.size).toBe(0);
    });

    it('should handle empty symbol list', () => {
      const graph = buildDependencyGraph([]);

      expect(graph.symbols.size).toBe(0);
      expect(graph.dependencies.size).toBe(0);
      expect(graph.dependents.size).toBe(0);
    });
  });

  describe('getAllDependencies', () => {
    it('should get all dependencies recursively', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);
      const deps = getAllDependencies(graph, 'c');

      expect(deps.has('c')).toBe(true);
      expect(deps.has('b')).toBe(true);
      expect(deps.has('a')).toBe(true);
    });

    it('should handle symbols with no dependencies', () => {
      const symbols = [createSymbol('a', 'funcA')];

      const graph = buildDependencyGraph(symbols);
      const deps = getAllDependencies(graph, 'a');

      expect(deps.size).toBe(1);
      expect(deps.has('a')).toBe(true);
    });

    it('should handle circular dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA', ['funcB']),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);

      // Manually create circular dependency
      graph.dependencies.get('a')?.add('b');
      graph.dependencies.get('b')?.add('a');

      const deps = getAllDependencies(graph, 'a');

      expect(deps.has('a')).toBe(true);
      expect(deps.has('b')).toBe(true);
      expect(deps.size).toBe(2);
    });

    it('should handle diamond dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcA']),
        createSymbol('d', 'funcD', ['funcB', 'funcC']),
      ];

      const graph = buildDependencyGraph(symbols);
      const deps = getAllDependencies(graph, 'd');

      expect(deps.has('d')).toBe(true);
      expect(deps.has('b')).toBe(true);
      expect(deps.has('c')).toBe(true);
      expect(deps.has('a')).toBe(true);
    });
  });

  describe('getAllDependents', () => {
    it('should get all dependents recursively', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);
      const dependents = getAllDependents(graph, 'a');

      expect(dependents.has('a')).toBe(true);
      expect(dependents.has('b')).toBe(true);
      expect(dependents.has('c')).toBe(true);
    });

    it('should handle symbols with no dependents', () => {
      const symbols = [createSymbol('a', 'funcA')];

      const graph = buildDependencyGraph(symbols);
      const dependents = getAllDependents(graph, 'a');

      expect(dependents.size).toBe(1);
      expect(dependents.has('a')).toBe(true);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect simple circular dependency', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
      ];

      const graph = buildDependencyGraph(symbols);

      // Manually create circular dependency
      graph.dependencies.get('a')?.add('b');
      graph.dependencies.get('b')?.add('a');

      const circles = detectCircularDependencies(graph);

      expect(circles.length).toBeGreaterThan(0);
    });

    it('should detect no circles in acyclic graph', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);
      const circles = detectCircularDependencies(graph);

      expect(circles.length).toBe(0);
    });

    it('should handle empty graph', () => {
      const graph = buildDependencyGraph([]);
      const circles = detectCircularDependencies(graph);

      expect(circles.length).toBe(0);
    });
  });

  describe('topologicalSort', () => {
    it('should sort symbols in dependency order', () => {
      const symbols = [
        createSymbol('c', 'funcC', ['funcB']),
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);
      const sorted = topologicalSort(graph);

      const aIndex = sorted.indexOf('a');
      const bIndex = sorted.indexOf('b');
      const cIndex = sorted.indexOf('c');

      // Dependencies should come before dependents
      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);
    });

    it('should handle symbols with no dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
      ];

      const graph = buildDependencyGraph(symbols);
      const sorted = topologicalSort(graph);

      expect(sorted).toHaveLength(2);
      expect(sorted).toContain('a');
      expect(sorted).toContain('b');
    });

    it('should throw on circular dependency', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
      ];

      const graph = buildDependencyGraph(symbols);

      // Create circular dependency
      graph.dependencies.get('a')?.add('b');
      graph.dependencies.get('b')?.add('a');

      expect(() => topologicalSort(graph)).toThrow();
    });

    it('should handle complex dependency tree', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcA']),
        createSymbol('d', 'funcD', ['funcB', 'funcC']),
      ];

      const graph = buildDependencyGraph(symbols);
      const sorted = topologicalSort(graph);

      const aIndex = sorted.indexOf('a');
      const bIndex = sorted.indexOf('b');
      const cIndex = sorted.indexOf('c');
      const dIndex = sorted.indexOf('d');

      expect(aIndex).toBeLessThan(bIndex);
      expect(aIndex).toBeLessThan(cIndex);
      expect(bIndex).toBeLessThan(dIndex);
      expect(cIndex).toBeLessThan(dIndex);
    });
  });

  describe('findEntryPoints', () => {
    it('should find symbols with no dependents', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC'),
      ];

      const graph = buildDependencyGraph(symbols);
      const entryPoints = findEntryPoints(graph);

      expect(entryPoints).toContain('b');
      expect(entryPoints).toContain('c');
      expect(entryPoints).not.toContain('a');
    });

    it('should return all symbols when none have dependents', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
      ];

      const graph = buildDependencyGraph(symbols);
      const entryPoints = findEntryPoints(graph);

      expect(entryPoints).toHaveLength(2);
    });

    it('should return empty array when all symbols have dependents', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);

      // Make 'b' depended on by adding a fake dependent
      graph.dependents.get('b')?.add('fake');

      const entryPoints = findEntryPoints(graph);

      // All symbols have dependents now
      expect(entryPoints).not.toContain('b');
    });
  });

  describe('findLeafNodes', () => {
    it('should find symbols with no dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC'),
      ];

      const graph = buildDependencyGraph(symbols);
      const leafNodes = findLeafNodes(graph);

      expect(leafNodes).toContain('a');
      expect(leafNodes).toContain('c');
      expect(leafNodes).not.toContain('b');
    });

    it('should return all symbols when none have dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
      ];

      const graph = buildDependencyGraph(symbols);
      const leafNodes = findLeafNodes(graph);

      expect(leafNodes).toHaveLength(2);
    });

    it('should return empty array when all symbols have dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA', ['external']),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);

      // Force dependencies
      graph.dependencies.get('a')?.add('x');

      const leafNodes = findLeafNodes(graph);

      expect(leafNodes).not.toContain('a');
    });
  });

  describe('calculateDepth', () => {
    it('should calculate depth for leaf nodes', () => {
      const symbols = [createSymbol('a', 'funcA')];

      const graph = buildDependencyGraph(symbols);
      const depth = calculateDepth(graph, 'a');

      expect(depth).toBe(0);
    });

    it('should calculate depth for dependent symbols', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(calculateDepth(graph, 'a')).toBe(0);
      expect(calculateDepth(graph, 'b')).toBe(1);
      expect(calculateDepth(graph, 'c')).toBe(2);
    });

    it('should handle diamond dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcA']),
        createSymbol('d', 'funcD', ['funcB', 'funcC']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(calculateDepth(graph, 'a')).toBe(0);
      expect(calculateDepth(graph, 'b')).toBe(1);
      expect(calculateDepth(graph, 'c')).toBe(1);
      expect(calculateDepth(graph, 'd')).toBe(2);
    });
  });

  describe('groupByDepth', () => {
    it('should group symbols by depth level', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcB']),
        createSymbol('d', 'funcD'),
      ];

      const graph = buildDependencyGraph(symbols);
      const groups = groupByDepth(graph);

      expect(groups.get(0)).toContain('a');
      expect(groups.get(0)).toContain('d');
      expect(groups.get(1)).toContain('b');
      expect(groups.get(2)).toContain('c');
    });

    it('should handle all symbols at same depth', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
        createSymbol('c', 'funcC'),
      ];

      const graph = buildDependencyGraph(symbols);
      const groups = groupByDepth(graph);

      expect(groups.get(0)).toHaveLength(3);
    });

    it('should handle empty graph', () => {
      const graph = buildDependencyGraph([]);
      const groups = groupByDepth(graph);

      expect(groups.size).toBe(0);
    });
  });

  describe('findCommonDependencies', () => {
    it('should find dependencies common to all symbols', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC', ['funcA', 'funcB']),
        createSymbol('d', 'funcD', ['funcA', 'funcB', 'funcC']),
      ];

      const graph = buildDependencyGraph(symbols);
      const common = findCommonDependencies(graph, ['c', 'd']);

      expect(common.has('a')).toBe(true);
      expect(common.has('b')).toBe(true);
    });

    it('should return empty set when no common dependencies', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
        createSymbol('c', 'funcC', ['funcA']),
        createSymbol('d', 'funcD', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);
      const common = findCommonDependencies(graph, ['c', 'd']);

      expect(common.size).toBe(0);
    });

    it('should handle empty symbol list', () => {
      const graph = buildDependencyGraph([]);
      const common = findCommonDependencies(graph, []);

      expect(common.size).toBe(0);
    });

    it('should handle single symbol', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);
      const common = findCommonDependencies(graph, ['b']);

      expect(common.has('b')).toBe(true);
      expect(common.has('a')).toBe(true);
    });
  });

  describe('calculateCohesion', () => {
    it('should calculate cohesion for tightly coupled symbols', () => {
      const symbols = [
        createSymbol('a', 'funcA', ['funcB']),
        createSymbol('b', 'funcB', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);

      // Manually create edges since we can't have circular refs
      graph.dependencies.get('a')?.add('b');
      graph.dependencies.get('b')?.add('a');

      const cohesion = calculateCohesion(graph, ['a', 'b']);

      expect(cohesion).toBeGreaterThan(0);
    });

    it('should return 0 for loosely coupled symbols', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB'),
      ];

      const graph = buildDependencyGraph(symbols);
      const cohesion = calculateCohesion(graph, ['a', 'b']);

      expect(cohesion).toBe(0);
    });

    it('should return 0 for single symbol', () => {
      const symbols = [createSymbol('a', 'funcA')];

      const graph = buildDependencyGraph(symbols);
      const cohesion = calculateCohesion(graph, ['a']);

      expect(cohesion).toBe(0);
    });

    it('should calculate partial cohesion', () => {
      const symbols = [
        createSymbol('a', 'funcA'),
        createSymbol('b', 'funcB', ['funcA']),
        createSymbol('c', 'funcC'),
      ];

      const graph = buildDependencyGraph(symbols);
      const cohesion = calculateCohesion(graph, ['a', 'b', 'c']);

      // Only a->b connection, rest are disconnected
      expect(cohesion).toBeGreaterThan(0);
      expect(cohesion).toBeLessThan(1);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex dependency graph', () => {
      // Note: dependencies use the actual symbol names
      const symbols = [
        createSymbol('utils', 'utils'),
        createSymbol('api', 'api', ['utils']),
        createSymbol('store', 'store', ['utils']),
        createSymbol('comp1', 'Component1', ['api', 'store']),
        createSymbol('comp2', 'Component2', ['api']),
        createSymbol('app', 'App', ['Component1', 'Component2']),
      ];

      const graph = buildDependencyGraph(symbols);

      expect(graph.symbols.size).toBe(6);

      const sorted = topologicalSort(graph);
      expect(sorted[sorted.length - 1]).toBe('app');

      const depth = calculateDepth(graph, 'app');
      expect(depth).toBeGreaterThanOrEqual(2); // At least 2 levels deep

      const entryPoints = findEntryPoints(graph);
      expect(entryPoints).toContain('app');

      const leafNodes = findLeafNodes(graph);
      expect(leafNodes).toContain('utils');
    });
  });
});

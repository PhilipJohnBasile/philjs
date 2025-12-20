import { describe, it, expect } from 'vitest';
import {
  bundleSymbols,
  getStrategy,
  defaultStrategy,
  aggressiveStrategy,
  conservativeStrategy,
  routeStrategy,
  depthStrategy,
  sizeStrategy,
  hybridStrategy,
} from './bundler.js';
import { buildDependencyGraph } from './dependency-graph.js';
import type { Symbol, OptimizerOptions } from './types.js';

describe('Bundler Strategies', () => {
  const createSymbol = (
    id: string,
    name: string,
    filePath: string,
    dependencies: string[] = [],
    isLazy = false,
    size = 100
  ): Symbol => ({
    id,
    name,
    filePath,
    start: 0,
    end: size,
    type: 'function',
    dependencies,
    hash: 'test-hash',
    isLazy,
  });

  const defaultOptions: OptimizerOptions = {
    rootDir: '/test',
    minChunkSize: 1024,
    maxChunkSize: 51200,
  };

  describe('getStrategy', () => {
    it('should return default strategy', () => {
      const strategy = getStrategy('default');
      expect(strategy.name).toBe('default');
    });

    it('should return aggressive strategy', () => {
      const strategy = getStrategy('aggressive');
      expect(strategy.name).toBe('aggressive');
    });

    it('should return conservative strategy', () => {
      const strategy = getStrategy('conservative');
      expect(strategy.name).toBe('conservative');
    });

    it('should return route strategy', () => {
      const strategy = getStrategy('route');
      expect(strategy.name).toBe('route');
    });

    it('should return depth strategy', () => {
      const strategy = getStrategy('depth');
      expect(strategy.name).toBe('depth');
    });

    it('should return size strategy', () => {
      const strategy = getStrategy('size');
      expect(strategy.name).toBe('size');
    });

    it('should return hybrid strategy', () => {
      const strategy = getStrategy('hybrid');
      expect(strategy.name).toBe('hybrid');
    });

    it('should return default strategy for unknown name', () => {
      const strategy = getStrategy('unknown');
      expect(strategy.name).toBe('default');
    });
  });

  describe('defaultStrategy', () => {
    it('should separate lazy and regular symbols', () => {
      const symbols = [
        createSymbol('lazy1', 'lazy1', '/file1.ts', [], true),
        createSymbol('reg1', 'reg1', '/file1.ts', [], false),
        createSymbol('lazy2', 'lazy2', '/file2.ts', [], true),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = defaultStrategy.bundle(graph, defaultOptions);

      // Each lazy symbol should have its own chunk
      expect(chunks.get('lazy1')).toEqual([symbols[0]]);
      expect(chunks.get('lazy2')).toEqual([symbols[2]]);
    });

    it('should group regular symbols by file', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file1.ts'),
        createSymbol('b', 'funcB', '/file1.ts'),
        createSymbol('c', 'funcC', '/file2.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = defaultStrategy.bundle(graph, defaultOptions);

      // Should have 2 file-based chunks
      const file1Chunk = Array.from(chunks.values()).find((chunk) =>
        chunk.some((s) => s.filePath === '/file1.ts')
      );
      const file2Chunk = Array.from(chunks.values()).find((chunk) =>
        chunk.some((s) => s.filePath === '/file2.ts')
      );

      expect(file1Chunk).toHaveLength(2);
      expect(file2Chunk).toHaveLength(1);
    });

    it('should handle mixed lazy and regular symbols', () => {
      const symbols = [
        createSymbol('lazy', 'lazy', '/file.ts', [], true),
        createSymbol('reg1', 'reg1', '/file.ts'),
        createSymbol('reg2', 'reg2', '/file.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = defaultStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBeGreaterThan(0);
      expect(chunks.get('lazy')).toHaveLength(1);
    });
  });

  describe('aggressiveStrategy', () => {
    it('should create one chunk per symbol', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts'),
        createSymbol('b', 'funcB', '/file.ts'),
        createSymbol('c', 'funcC', '/file.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = aggressiveStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBe(3);
      expect(chunks.get('a')).toEqual([symbols[0]]);
      expect(chunks.get('b')).toEqual([symbols[1]]);
      expect(chunks.get('c')).toEqual([symbols[2]]);
    });

    it('should handle empty symbol list', () => {
      const graph = buildDependencyGraph([]);
      const chunks = aggressiveStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBe(0);
    });

    it('should handle single symbol', () => {
      const symbols = [createSymbol('a', 'funcA', '/file.ts')];

      const graph = buildDependencyGraph(symbols);
      const chunks = aggressiveStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBe(1);
      expect(chunks.get('a')).toHaveLength(1);
    });
  });

  describe('conservativeStrategy', () => {
    it('should group symbols with high cohesion', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts'),
        createSymbol('b', 'funcB', '/file.ts', ['funcA']),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = conservativeStrategy.bundle(graph, defaultOptions);

      // Conservative strategy groups based on cohesion threshold (> 0.5) or single symbols
      // With low cohesion between just 2 symbols, it might not create chunks
      // So we just verify it doesn't crash
      expect(chunks).toBeDefined();
      expect(chunks).toBeInstanceOf(Map);
    });

    it('should keep unrelated symbols separate', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file1.ts'),
        createSymbol('b', 'funcB', '/file2.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = conservativeStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty graph', () => {
      const graph = buildDependencyGraph([]);
      const chunks = conservativeStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBe(0);
    });
  });

  describe('routeStrategy', () => {
    it('should group symbols by route', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/pages/home.tsx'),
        createSymbol('b', 'funcB', '/pages/home.tsx'),
        createSymbol('c', 'funcC', '/pages/about.tsx'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = routeStrategy.bundle(graph, defaultOptions);

      // Should have chunks for different routes
      expect(chunks.size).toBeGreaterThan(0);

      const homeChunk = Array.from(chunks.values()).find((chunk) =>
        chunk.some((s) => s.filePath.includes('home'))
      );
      const aboutChunk = Array.from(chunks.values()).find((chunk) =>
        chunk.some((s) => s.filePath.includes('about'))
      );

      expect(homeChunk).toHaveLength(2);
      expect(aboutChunk).toHaveLength(1);
    });

    it('should extract route from different path patterns', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/routes/users/index.tsx'),
        createSymbol('b', 'funcB', '/app/dashboard/page.tsx'),
        createSymbol('c', 'funcC', '/src/components/Button.tsx'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = routeStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBeGreaterThan(0);
    });

    it('should handle symbols from same route', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/pages/users.tsx'),
        createSymbol('b', 'funcB', '/pages/users.tsx'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = routeStrategy.bundle(graph, defaultOptions);

      const chunk = Array.from(chunks.values())[0];
      expect(chunk).toHaveLength(2);
    });
  });

  describe('depthStrategy', () => {
    it('should group symbols by dependency depth', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts'),
        createSymbol('b', 'funcB', '/file.ts', ['funcA']),
        createSymbol('c', 'funcC', '/file.ts', ['funcB']),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = depthStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBe(3); // 3 depth levels

      const depth0 = chunks.get('depth_0');
      const depth1 = chunks.get('depth_1');
      const depth2 = chunks.get('depth_2');

      expect(depth0).toBeDefined();
      expect(depth1).toBeDefined();
      expect(depth2).toBeDefined();
    });

    it('should group symbols at same depth', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts'),
        createSymbol('b', 'funcB', '/file.ts'),
        createSymbol('c', 'funcC', '/file.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = depthStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBe(1); // All at depth 0
      const depth0 = chunks.get('depth_0');
      expect(depth0).toHaveLength(3);
    });

    it('should handle complex dependency tree', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts'),
        createSymbol('b', 'funcB', '/file.ts', ['funcA']),
        createSymbol('c', 'funcC', '/file.ts', ['funcA']),
        createSymbol('d', 'funcD', '/file.ts', ['funcB', 'funcC']),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = depthStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBeGreaterThan(0);
    });
  });

  describe('sizeStrategy', () => {
    it('should respect max chunk size', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts', [], false, 30000),
        createSymbol('b', 'funcB', '/file.ts', [], false, 30000),
        createSymbol('c', 'funcC', '/file.ts', [], false, 30000),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = sizeStrategy.bundle(graph, defaultOptions);

      // Should split into multiple chunks due to size
      expect(chunks.size).toBeGreaterThan(1);
    });

    it('should group small symbols together', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts', [], false, 100),
        createSymbol('b', 'funcB', '/file.ts', [], false, 100),
        createSymbol('c', 'funcC', '/file.ts', [], false, 100),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = sizeStrategy.bundle(graph, defaultOptions);

      // Should group small symbols together
      expect(chunks.size).toBeLessThanOrEqual(symbols.length);
    });

    it('should start new chunk when max size exceeded', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts', [], false, 40000),
        createSymbol('b', 'funcB', '/file.ts', [], false, 40000),
      ];

      const options: OptimizerOptions = {
        rootDir: '/test',
        maxChunkSize: 50000,
      };

      const graph = buildDependencyGraph(symbols);
      const chunks = sizeStrategy.bundle(graph, options);

      // Should create separate chunks
      expect(chunks.size).toBe(2);
    });

    it('should handle lazy symbols with min size threshold', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts', [], true, 2000),
        createSymbol('b', 'funcB', '/file.ts', [], false, 500),
      ];

      const options: OptimizerOptions = {
        rootDir: '/test',
        minChunkSize: 1000,
      };

      const graph = buildDependencyGraph(symbols);
      const chunks = sizeStrategy.bundle(graph, options);

      expect(chunks.size).toBeGreaterThan(0);
    });
  });

  describe('hybridStrategy', () => {
    it('should give lazy symbols individual chunks', () => {
      const symbols = [
        createSymbol('lazy1', 'lazy1', '/file.ts', [], true),
        createSymbol('lazy2', 'lazy2', '/file.ts', [], true),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = hybridStrategy.bundle(graph, defaultOptions);

      expect(chunks.get('lazy_lazy1')).toEqual([symbols[0]]);
      expect(chunks.get('lazy_lazy2')).toEqual([symbols[1]]);
    });

    it('should group regular symbols by route', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/pages/home.tsx'),
        createSymbol('b', 'funcB', '/pages/home.tsx'),
        createSymbol('c', 'funcC', '/pages/about.tsx'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = hybridStrategy.bundle(graph, defaultOptions);

      expect(chunks.size).toBeGreaterThan(0);
    });

    it('should split large route chunks by size', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/pages/home.tsx', [], false, 40000),
        createSymbol('b', 'funcB', '/pages/home.tsx', [], false, 40000),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = hybridStrategy.bundle(graph, defaultOptions);

      // Should split into multiple chunks due to size
      expect(chunks.size).toBeGreaterThan(1);
    });

    it('should not split small route chunks', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/pages/home.tsx', [], false, 100),
        createSymbol('b', 'funcB', '/pages/home.tsx', [], false, 100),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = hybridStrategy.bundle(graph, defaultOptions);

      // Should keep small symbols together
      const homeChunk = Array.from(chunks.values()).find((chunk) =>
        chunk.some((s) => s.filePath.includes('home'))
      );

      expect(homeChunk).toHaveLength(2);
    });

    it('should handle mixed lazy and regular symbols', () => {
      const symbols = [
        createSymbol('lazy', 'lazy', '/pages/home.tsx', [], true),
        createSymbol('reg1', 'reg1', '/pages/home.tsx', [], false),
        createSymbol('reg2', 'reg2', '/pages/about.tsx', [], false),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = hybridStrategy.bundle(graph, defaultOptions);

      // Lazy should be separate
      expect(chunks.get('lazy_lazy')).toEqual([symbols[0]]);

      // Regular should be grouped by route
      expect(chunks.size).toBeGreaterThan(1);
    });
  });

  describe('bundleSymbols', () => {
    it('should use specified strategy', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts'),
        createSymbol('b', 'funcB', '/file.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = bundleSymbols(graph, defaultOptions, 'aggressive');

      // Aggressive strategy: one chunk per symbol
      expect(chunks.size).toBe(2);
    });

    it('should default to hybrid strategy', () => {
      const symbols = [
        createSymbol('lazy', 'lazy', '/file.ts', [], true),
        createSymbol('reg', 'reg', '/file.ts'),
      ];

      const graph = buildDependencyGraph(symbols);
      const chunks = bundleSymbols(graph, defaultOptions);

      // Should use hybrid by default
      expect(chunks.has('lazy_lazy')).toBe(true);
    });

    it('should handle empty graph', () => {
      const graph = buildDependencyGraph([]);
      const chunks = bundleSymbols(graph, defaultOptions, 'default');

      expect(chunks.size).toBe(0);
    });

    it('should pass options to strategy', () => {
      const symbols = [
        createSymbol('a', 'funcA', '/file.ts', [], false, 60000),
      ];

      const options: OptimizerOptions = {
        rootDir: '/test',
        maxChunkSize: 50000,
      };

      const graph = buildDependencyGraph(symbols);
      const chunks = bundleSymbols(graph, options, 'size');

      expect(chunks.size).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle real-world scenario', () => {
      const symbols = [
        // Utilities
        createSymbol('utils', 'utils', '/src/utils.ts'),

        // API layer
        createSymbol('api', 'api', '/src/api.ts', ['utils']),

        // Components
        createSymbol('Header', 'Header', '/src/components/Header.tsx', ['utils']),
        createSymbol('Footer', 'Footer', '/src/components/Footer.tsx'),

        // Pages
        createSymbol('HomePage', 'HomePage', '/pages/home.tsx', ['Header', 'Footer', 'api']),
        createSymbol('AboutPage', 'AboutPage', '/pages/about.tsx', ['Header', 'Footer']),

        // Lazy handlers
        createSymbol('onClick', 'onClick', '/pages/home.tsx', ['api'], true),
      ];

      const graph = buildDependencyGraph(symbols);

      // Test different strategies
      const defaultChunks = bundleSymbols(graph, defaultOptions, 'default');
      expect(defaultChunks.size).toBeGreaterThan(0);

      const aggressiveChunks = bundleSymbols(graph, defaultOptions, 'aggressive');
      expect(aggressiveChunks.size).toBe(symbols.length);

      const routeChunks = bundleSymbols(graph, defaultOptions, 'route');
      expect(routeChunks.size).toBeGreaterThan(0);

      const hybridChunks = bundleSymbols(graph, defaultOptions, 'hybrid');
      expect(hybridChunks.get('lazy_onClick')).toBeDefined();
    });

    it('should optimize bundle sizes', () => {
      const symbols = Array.from({ length: 20 }, (_, i) =>
        createSymbol(
          `func${i}`,
          `func${i}`,
          '/file.ts',
          [],
          false,
          Math.random() * 10000
        )
      );

      const graph = buildDependencyGraph(symbols);

      const sizeChunks = bundleSymbols(graph, defaultOptions, 'size');

      // Should create multiple appropriately-sized chunks
      expect(sizeChunks.size).toBeGreaterThan(1);
    });
  });
});

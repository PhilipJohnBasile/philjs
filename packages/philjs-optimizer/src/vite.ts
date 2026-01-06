/**
 * Vite plugin for PhilJS optimizer
 */

import type { Plugin, ResolvedConfig } from 'vite';
import { transform, extractLazyChunks, generateManifest } from './transform.js';
import { extractSymbols } from './symbols.js';
import { buildDependencyGraph } from './dependency-graph.js';
import { bundleSymbols } from './bundler.js';
import type { OptimizerOptions, ChunkManifest, Symbol } from './types.js';
import { createHash } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

export interface ViteOptimizerOptions extends Partial<OptimizerOptions> {
  /** Bundling strategy */
  strategy?: 'default' | 'aggressive' | 'conservative' | 'route' | 'depth' | 'size' | 'hybrid';
  /** Include patterns */
  include?: string | string[];
  /** Exclude patterns */
  exclude?: string | string[];
  /** Whether to generate source maps */
  sourcemap?: boolean;
  /** Base URL for lazy chunks */
  baseUrl?: string;
}

/**
 * Vite plugin for PhilJS optimizer
 */
export function philjsOptimizer(options: ViteOptimizerOptions = {}): Plugin {
  let config: ResolvedConfig;
  let isBuild = false;
  const symbolRegistry = new Map<string, Symbol>();
  const lazyChunks = new Map<string, string>();
  const manifestData: ChunkManifest = {
    symbols: {},
    chunks: {},
    imports: {},
  };

  const {
    strategy = 'hybrid',
    include = ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
    exclude = ['node_modules/**', '**/*.test.*', '**/*.spec.*'],
    sourcemap = true,
    baseUrl = '/lazy',
    ...optimizerOptions
  } = options;

  return {
    name: 'philjs-optimizer',

    enforce: 'pre',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isBuild = config.command === 'build';
    },

    async transform(code, id) {
      // Skip excluded files
      if (shouldExclude(id, exclude)) {
        return null;
      }

      // Skip non-included files
      if (!shouldInclude(id, include)) {
        return null;
      }

      // Skip node_modules
      if (id.includes('node_modules')) {
        return null;
      }

      try {
        const opts: OptimizerOptions = {
          rootDir: config.root,
          outDir: config.build.outDir,
          sourcemap,
          ...optimizerOptions,
        };

        // Transform the code
        const result = transform(code, id, opts);

        // Store symbols
        for (const symbol of result.symbols) {
          symbolRegistry.set(symbol.id, symbol);
        }

        // Extract lazy chunks
        const chunks = extractLazyChunks(code, id);
        for (const [symbolId, chunkCode] of chunks) {
          lazyChunks.set(symbolId, chunkCode);

          // Update manifest
          const chunkPath = `${baseUrl}/${symbolId}.js`;
          manifestData.symbols[symbolId] = chunkPath;
          manifestData.imports[symbolId] = chunkPath;

          if (!manifestData.chunks[chunkPath]) {
            manifestData.chunks[chunkPath] = [];
          }
          manifestData.chunks[chunkPath].push(symbolId);
        }

        return {
          code: result.code,
          map: result.map,
        } as any;
      } catch (error) {
        console.error(`Error transforming ${id}:`, error);
        return null;
      }
    },

    async resolveId(id) {
      // Resolve lazy chunk imports
      if (id.startsWith(baseUrl)) {
        return id;
      }

      return null;
    },

    async load(id) {
      // Load lazy chunks
      if (id.startsWith(baseUrl)) {
        const symbolId = path.basename(id, '.js');
        const chunk = lazyChunks.get(symbolId);

        if (chunk) {
          return {
            code: chunk,
            map: null,
          };
        }
      }

      return null;
    },

    async generateBundle(outputOptions, bundle) {
      if (!isBuild) return;

      // Build dependency graph
      const symbols = Array.from(symbolRegistry.values());
      const graph = buildDependencyGraph(symbols);

      // Bundle symbols
      const opts: OptimizerOptions = {
        rootDir: config.root,
        outDir: config.build.outDir,
        sourcemap,
        ...optimizerOptions,
      };

      const chunks = bundleSymbols(graph, opts, strategy);

      // Generate chunk files
      for (const [chunkId, chunkSymbols] of chunks) {
        const chunkCode = generateChunkCode(chunkSymbols);
        const chunkFileName = `lazy/${chunkId}.js`;

        // Add chunk to bundle
        this.emitFile({
          type: 'asset',
          fileName: chunkFileName,
          source: chunkCode,
        });

        // Update manifest
        const chunkPath = `/${chunkFileName}`;
        manifestData.chunks[chunkPath] = chunkSymbols.map((s) => s.id);

        for (const symbol of chunkSymbols) {
          manifestData.symbols[symbol.id] = chunkPath;
          manifestData.imports[symbol.id] = chunkPath;
        }
      }

      // Generate manifest file
      const manifestCode = generateManifestCode(manifestData);
      this.emitFile({
        type: 'asset',
        fileName: 'lazy/manifest.js',
        source: manifestCode,
      });

      // Log optimization stats
      if (optimizerOptions.debug) {
        logOptimizationStats(symbols, chunks, lazyChunks);
      }
    },

    async writeBundle() {
      // Clean up
      symbolRegistry.clear();
      lazyChunks.clear();
    },
  };
}

/**
 * Check if a file should be included
 */
function shouldInclude(id: string, patterns: string | string[]): boolean {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

  return patternsArray.some((pattern) => {
    const regex = new RegExp(
      pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
    );
    return regex.test(id);
  });
}

/**
 * Check if a file should be excluded
 */
function shouldExclude(id: string, patterns: string | string[]): boolean {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];

  return patternsArray.some((pattern) => {
    const regex = new RegExp(
      pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
    );
    return regex.test(id);
  });
}

/**
 * Generate code for a chunk
 */
function generateChunkCode(symbols: Symbol[]): string {
  // For now, just export a placeholder
  // In a real implementation, this would include the actual symbol code
  const exports = symbols
    .map(
      (s) => `
export const ${s.id} = () => {
  console.log('Lazy loaded: ${s.name}');
};
`
    )
    .join('\n');

  return `
// PhilJS Lazy Chunk
// Generated by philjs-optimizer

${exports}
`;
}

/**
 * Generate manifest code
 */
function generateManifestCode(manifest: ChunkManifest): string {
  return `// PhilJS Optimizer Manifest
// Generated by philjs-optimizer

export default ${JSON.stringify(manifest, null, 2)};
`;
}

/**
 * Log optimization statistics
 */
function logOptimizationStats(
  symbols: Symbol[],
  chunks: Map<string, Symbol[]>,
  lazyChunks: Map<string, string>
): void {
  console.log(`Total symbols: ${symbols.length}`);
  console.log(`Lazy symbols: ${symbols.filter((s) => s.isLazy).length}`);
  console.log(`Chunks: ${chunks.size}`);
  console.log(`Lazy chunks: ${lazyChunks.size}`);

  // Symbol types breakdown
  const typeBreakdown = new Map<string, number>();
  for (const symbol of symbols) {
    typeBreakdown.set(symbol.type, (typeBreakdown.get(symbol.type) || 0) + 1);
  }

  for (const [type, count] of typeBreakdown) {
    console.log(`  ${type}: ${count}`);
  }

  // Chunk size analysis
  const chunkSizes = Array.from(chunks.values()).map((symbols) =>
    symbols.reduce((sum, s) => sum + (s.end - s.start), 0)
  );

  if (chunkSizes.length > 0) {
    const totalSize = chunkSizes.reduce((sum, size) => sum + size, 0);
    const avgSize = totalSize / chunkSizes.length;
    const maxSize = Math.max(...chunkSizes);
    const minSize = Math.min(...chunkSizes);

    console.log(`  Total: ${formatBytes(totalSize)}`);
    console.log(`  Average: ${formatBytes(avgSize)}`);
    console.log(`  Max: ${formatBytes(maxSize)}`);
    console.log(`  Min: ${formatBytes(minSize)}`);
  }

}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Default export
 */
export default philjsOptimizer;

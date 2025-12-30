/**
 * PhilJS Compiler - Automatic Code Splitting
 * Analyzes routes and creates optimal code splitting boundaries
 */

import { parse } from '@babel/parser';
import type { NodePath, TraverseOptions } from '@babel/traverse';
import * as _traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { CompilerConfig } from './types.js';

// Handle both ESM and CJS exports - babel traverse exports default as the traverse function
const traverse: (ast: t.Node, opts?: TraverseOptions) => void = (_traverse as unknown as { default: (ast: t.Node, opts?: TraverseOptions) => void }).default;

export interface CodeSplitBoundary {
  /** Route path */
  route: string;
  /** Component file path */
  filePath: string;
  /** Import statement to add */
  lazyImport: string;
  /** Estimated component size (lines of code) */
  estimatedSize: number;
  /** Dependencies this component needs */
  dependencies: string[];
  /** Priority (for preloading) */
  priority: 'high' | 'medium' | 'low';
}

export interface CodeSplitReport {
  boundaries: CodeSplitBoundary[];
  totalChunks: number;
  estimatedSavings: number;
  recommendations: string[];
}

export class CodeSplitter {
  private config: CompilerConfig;

  constructor(config: CompilerConfig = {}) {
    this.config = config;
  }

  /**
   * Analyze a routes directory and determine splitting boundaries
   */
  analyzeRoutes(routesDir: string, files: Map<string, string>): CodeSplitReport {
    const boundaries: CodeSplitBoundary[] = [];
    const recommendations: string[] = [];

    files.forEach((code, filePath) => {
      // Check if this is a route file
      if (!this.isRouteFile(filePath, routesDir)) return;

      const route = this.filePathToRoute(filePath, routesDir);
      const analysis = this.analyzeRouteComponent(code, filePath);

      // Determine if this route should be code-split
      if (this.shouldSplit(analysis)) {
        boundaries.push({
          route,
          filePath,
          lazyImport: this.generateLazyImport(filePath, route),
          estimatedSize: analysis.size,
          dependencies: analysis.dependencies,
          priority: this.calculatePriority(route, analysis),
        });

        recommendations.push(
          `Route "${route}" (${analysis.size} LOC) should be lazy-loaded`
        );
      }
    });

    // Sort by priority
    boundaries.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      boundaries,
      totalChunks: boundaries.length,
      estimatedSavings: this.calculateEstimatedSavings(boundaries),
      recommendations,
    };
  }

  /**
   * Analyze a single route component
   */
  private analyzeRouteComponent(code: string, filePath: string) {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      sourceFilename: filePath,
    });

    const analysis = {
      size: code.split('\n').length,
      hasHeavyDependencies: false,
      dependencies: [] as string[],
      isLazy: false,
    };

    traverse(ast, {
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        const source = path.node.source.value;
        analysis.dependencies.push(source);

        // Check for heavy dependencies
        const heavyDeps = [
          'chart.js',
          'd3',
          'three',
          '@tensorflow',
          'monaco-editor',
          'pdf',
          'video.js',
        ];

        if (heavyDeps.some(dep => source.includes(dep))) {
          analysis.hasHeavyDependencies = true;
        }
      },

      CallExpression(path: NodePath<t.CallExpression>) {
        // Check if already using lazy loading
        if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'lazy') {
          analysis.isLazy = true;
        }
      },
    });

    return analysis;
  }

  /**
   * Determine if a route should be code-split
   */
  private shouldSplit(analysis: any): boolean {
    // Always split if it has heavy dependencies
    if (analysis.hasHeavyDependencies) return true;

    // Split if component is large (>200 LOC)
    if (analysis.size > 200) return true;

    // Don't split if already lazy
    if (analysis.isLazy) return false;

    // Don't split very small components (<50 LOC)
    if (analysis.size < 50) return false;

    return true;
  }

  /**
   * Calculate priority for preloading
   */
  private calculatePriority(
    route: string,
    analysis: any
  ): 'high' | 'medium' | 'low' {
    // High priority for index/home routes
    if (route === '/' || route === '/index') return 'high';

    // Medium priority for top-level routes
    if (route.split('/').length === 2) return 'medium';

    // Low priority for deeply nested routes
    return 'low';
  }

  /**
   * Generate a lazy import statement
   */
  private generateLazyImport(filePath: string, route: string): string {
    const componentName = this.routeToComponentName(route);
    return `const ${componentName} = /*#__PURE__*/ lazy(() => import('${filePath}'));`;
  }

  /**
   * Convert route to component name
   */
  private routeToComponentName(route: string): string {
    return route
      .split('/')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') || 'Index';
  }

  /**
   * Convert file path to route
   */
  private filePathToRoute(filePath: string, routesDir: string): string {
    // Remove routesDir prefix and extension
    let route = filePath
      .replace(routesDir, '')
      .replace(/\\/g, '/')
      .replace(/\.(tsx?|jsx?)$/, '');

    // Convert index files to directory route
    route = route.replace(/\/index$/, '');

    // Convert [param] to :param for route params
    route = route.replace(/\[([^\]]+)\]/g, ':$1');

    return route || '/';
  }

  /**
   * Check if file is a route file
   */
  private isRouteFile(filePath: string, routesDir: string): boolean {
    // Must be in routes directory
    if (!filePath.includes(routesDir)) return false;

    // Must be a component file
    if (!/\.(tsx?|jsx?)$/.test(filePath)) return false;

    // Exclude layout files, middleware, etc.
    if (filePath.includes('_layout') || filePath.includes('_middleware')) {
      return false;
    }

    return true;
  }

  /**
   * Calculate estimated bundle size savings
   */
  private calculateEstimatedSavings(boundaries: CodeSplitBoundary[]): number {
    // Rough estimate: 50 bytes per line of code
    return boundaries.reduce((total, boundary) => {
      return total + boundary.estimatedSize * 50;
    }, 0);
  }

  /**
   * Generate rollup/vite manual chunks configuration
   */
  static /*#__PURE__*/ generateManualChunks(
    boundaries: CodeSplitBoundary[]
  ): Record<string, string[]> {
    const chunks: Record<string, string[]> = {};

    boundaries.forEach(boundary => {
      const chunkName = boundary.route
        .replace(/^\//, '')
        .replace(/\//g, '-')
        .replace(/:/g, '_') || 'index';

      chunks[`routes/${chunkName}`] = [boundary.filePath];
    });

    return chunks;
  }

  /**
   * Generate vite dynamic import optimization
   */
  static /*#__PURE__*/ generateViteDynamicImports(
    boundaries: CodeSplitBoundary[]
  ): string[] {
    return boundaries.map(b => b.filePath);
  }
}

/**
 * Create a new code splitter instance
 */
export const createCodeSplitter = /*#__PURE__*/ function createCodeSplitter(
  config?: CompilerConfig
): CodeSplitter {
  return new CodeSplitter(config);
};

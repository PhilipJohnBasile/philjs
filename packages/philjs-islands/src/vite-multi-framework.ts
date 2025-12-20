/**
 * Vite Plugin for Multi-Framework Island Architecture
 * Automatically detects and bundles only the needed framework code
 */

import type { Plugin, ResolvedConfig } from 'vite';
import { getSupportedFrameworks } from './adapters/index.js';

export interface ViteMultiFrameworkOptions {
  /**
   * Frameworks to include in the build
   * If not specified, auto-detects based on imports
   */
  frameworks?: string[];

  /**
   * Directory containing island components
   */
  islandsDir?: string;

  /**
   * File patterns to scan for islands
   */
  include?: string[];

  /**
   * File patterns to exclude from scanning
   */
  exclude?: string[];

  /**
   * Generate island manifest
   */
  generateManifest?: boolean;

  /**
   * Custom island detection pattern
   */
  islandPattern?: RegExp;

  /**
   * Enable code splitting per framework
   */
  splitByFramework?: boolean;

  /**
   * Inject client directives automatically
   */
  autoInjectDirectives?: boolean;

  /**
   * Debug mode
   */
  debug?: boolean;
}

interface DetectedIsland {
  id: string;
  framework: string;
  component: string;
  importPath: string;
  strategy?: string;
}

/**
 * Vite plugin for multi-framework islands
 */
export function viteMultiFramework(options: ViteMultiFrameworkOptions = {}): Plugin {
  const {
    frameworks: configFrameworks,
    islandsDir = 'src/islands',
    include = ['**/*.tsx', '**/*.jsx', '**/*.vue', '**/*.svelte'],
    exclude = ['node_modules/**', 'dist/**'],
    generateManifest = true,
    islandPattern = /<Island\s+framework=["'](\w+)["']/g,
    splitByFramework = true,
    autoInjectDirectives = true,
    debug = false
  } = options;

  let config: ResolvedConfig;
  const detectedFrameworks = new Set<string>();
  const detectedIslands = new Map<string, DetectedIsland>();
  let islandCounter = 0;

  return {
    name: 'vite-multi-framework-islands',

    enforce: 'pre',

    configResolved(resolvedConfig) {
      config = resolvedConfig;

      if (debug) {
        console.log('[vite-multi-framework] Plugin initialized');
        console.log('[vite-multi-framework] Islands directory:', islandsDir);
      }
    },

    /**
     * Resolve imports to detect framework usage
     */
    async resolveId(source, importer) {
      // Track framework imports
      const supportedFrameworks = getSupportedFrameworks();

      for (const framework of supportedFrameworks) {
        if (source === framework || source.startsWith(`${framework}/`)) {
          detectedFrameworks.add(framework);

          if (debug) {
            console.log(`[vite-multi-framework] Detected ${framework} import in:`, importer);
          }
        }
      }

      return null; // Let Vite handle the actual resolution
    },

    /**
     * Transform code to inject island directives
     */
    async transform(code, id) {
      // Skip if not in include patterns or in exclude patterns
      if (!shouldProcess(id, include, exclude)) {
        return null;
      }

      let transformed = code;
      let hasChanges = false;

      // Detect Island components in the code
      const islandMatches = [...code.matchAll(islandPattern)];

      for (const match of islandMatches) {
        const framework = match[1];

        if (!detectedFrameworks.has(framework)) {
          detectedFrameworks.add(framework);
        }

        // Extract island metadata
        const islandId = `island-${++islandCounter}`;
        const componentMatch = code.match(new RegExp(`component=\\{([^}]+)\\}`, 'g'));

        if (componentMatch) {
          detectedIslands.set(islandId, {
            id: islandId,
            framework,
            component: componentMatch[0],
            importPath: id,
            strategy: extractStrategy(code, match.index!)
          });
        }
      }

      // Auto-inject client directives
      if (autoInjectDirectives && islandMatches.length > 0) {
        // Add import for multi-framework hydration
        const importStatement = `import { registerIslandComponent } from 'philjs-islands/multi-framework';\n`;

        if (!code.includes('registerIslandComponent')) {
          transformed = importStatement + transformed;
          hasChanges = true;
        }
      }

      // Inject framework-specific optimizations
      if (hasChanges) {
        return {
          code: transformed,
          map: null // You could generate a source map here
        };
      }

      return null;
    },

    /**
     * Configure build optimizations
     */
    config(config, { command }) {
      const optimizeDeps = config.optimizeDeps || {};
      const include = optimizeDeps.include || [];
      const exclude = optimizeDeps.exclude || [];

      // Add detected frameworks to optimization
      const frameworksToInclude = configFrameworks || Array.from(detectedFrameworks);

      frameworksToInclude.forEach(framework => {
        // Core framework packages
        if (!include.includes(framework)) {
          include.push(framework);
        }

        // Framework-specific dependencies
        switch (framework) {
          case 'react':
            if (!include.includes('react-dom')) include.push('react-dom');
            if (!include.includes('react-dom/client')) include.push('react-dom/client');
            break;
          case 'vue':
            // Vue is typically pre-bundled
            break;
          case 'svelte':
            // Svelte compiles to vanilla JS
            break;
          case 'preact':
            if (!include.includes('preact/hooks')) include.push('preact/hooks');
            break;
          case 'solid':
            if (!include.includes('solid-js/web')) include.push('solid-js/web');
            break;
        }
      });

      return {
        optimizeDeps: {
          ...optimizeDeps,
          include,
          exclude
        },
        build: {
          ...config.build,
          rollupOptions: {
            ...config.build?.rollupOptions,
            output: splitByFramework ? {
              ...config.build?.rollupOptions?.output,
              manualChunks: (id) => {
                // Split frameworks into separate chunks
                for (const framework of detectedFrameworks) {
                  if (id.includes(`node_modules/${framework}`)) {
                    return `framework-${framework}`;
                  }
                }
                return undefined;
              }
            } : config.build?.rollupOptions?.output
          }
        }
      };
    },

    /**
     * Generate island manifest
     */
    async generateBundle(options, bundle) {
      if (!generateManifest) return;

      const manifest = {
        version: '1.0.0',
        frameworks: Array.from(detectedFrameworks),
        islands: Array.from(detectedIslands.values()).map(island => ({
          id: island.id,
          framework: island.framework,
          component: island.component,
          strategy: island.strategy || 'visible'
        })),
        chunks: Object.keys(bundle).filter(key => key.startsWith('framework-'))
      };

      // Emit manifest as a separate file
      this.emitFile({
        type: 'asset',
        fileName: 'islands-manifest.json',
        source: JSON.stringify(manifest, null, 2)
      });

      if (debug) {
        console.log('[vite-multi-framework] Generated manifest:');
        console.log(JSON.stringify(manifest, null, 2));
      }
    },

    /**
     * Log detected frameworks after build
     */
    closeBundle() {
      if (debug || detectedFrameworks.size > 0) {
        console.log('\n[vite-multi-framework] Build Summary:');
        console.log(`  Detected Frameworks: ${Array.from(detectedFrameworks).join(', ') || 'none'}`);
        console.log(`  Islands Found: ${detectedIslands.size}`);

        if (detectedIslands.size > 0) {
          console.log('\n  Islands:');
          detectedIslands.forEach((island, id) => {
            console.log(`    - ${id}: ${island.framework} (${island.strategy || 'visible'})`);
          });
        }
      }
    }
  };
}

/**
 * Check if file should be processed
 */
function shouldProcess(id: string, include: string[], exclude: string[]): boolean {
  // Simple pattern matching (in production, use picomatch or similar)
  const shouldInclude = include.some(pattern => {
    const regex = patternToRegex(pattern);
    return regex.test(id);
  });

  const shouldExclude = exclude.some(pattern => {
    const regex = patternToRegex(pattern);
    return regex.test(id);
  });

  return shouldInclude && !shouldExclude;
}

/**
 * Convert glob pattern to regex
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');

  return new RegExp(escaped);
}

/**
 * Extract hydration strategy from Island component
 */
function extractStrategy(code: string, startIndex: number): string | undefined {
  // Look for hydration={{ strategy: 'xxx' }} pattern
  const strategyMatch = code.slice(startIndex, startIndex + 200).match(/strategy:\s*["'](\w+)["']/);
  return strategyMatch ? strategyMatch[1] : undefined;
}

/**
 * Helper to detect island components in source files
 */
export function detectIslandComponents(code: string): Array<{
  framework: string;
  component: string;
  line: number;
}> {
  const islands: Array<{ framework: string; component: string; line: number }> = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const match = line.match(/<Island\s+framework=["'](\w+)["']\s+component=\{([^}]+)\}/);
    if (match) {
      islands.push({
        framework: match[1],
        component: match[2],
        line: index + 1
      });
    }
  });

  return islands;
}

/**
 * Create framework-specific optimization config
 */
export function createFrameworkOptimizations(frameworks: string[]) {
  const optimizations: Record<string, any> = {};

  frameworks.forEach(framework => {
    switch (framework) {
      case 'react':
        optimizations.react = {
          alias: {
            'react': 'react',
            'react-dom': 'react-dom'
          },
          dedupe: ['react', 'react-dom']
        };
        break;

      case 'vue':
        optimizations.vue = {
          alias: {
            'vue': 'vue/dist/vue.esm-bundler.js'
          }
        };
        break;

      case 'preact':
        optimizations.preact = {
          alias: {
            'react': 'preact/compat',
            'react-dom': 'preact/compat'
          }
        };
        break;

      case 'solid':
        optimizations.solid = {
          alias: {
            'solid-js': 'solid-js'
          }
        };
        break;
    }
  });

  return optimizations;
}

export default viteMultiFramework;

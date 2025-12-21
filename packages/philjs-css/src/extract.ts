import type { ExtractConfig, CSSRule } from './types';
import { styleRegistry } from './css';
import { atomicRegistry } from './atomic';
import { getTheme, generateThemeCSS } from './theme';

/**
 * CSS minification helper
 */
function minifyCSS(css: string): string {
  return css
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around punctuation
    .replace(/;}/g, '}') // Remove last semicolon in block
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .trim();
}

/**
 * Generate source map for CSS
 */
function generateSourceMap(css: string): string {
  // Simplified source map generation
  // In production, use a proper source map library
  return JSON.stringify({
    version: 3,
    sources: ['philjs-css'],
    names: [],
    mappings: '',
    sourcesContent: [css]
  });
}

/**
 * Extract all CSS from the registry
 *
 * @example
 * ```ts
 * const css = extractCSS({
 *   outputPath: './dist/styles.css',
 *   minify: true,
 *   sourceMap: true,
 *   atomicClasses: true
 * });
 * ```
 */
export function extractCSS(config?: Partial<ExtractConfig>): string {
  const sections: string[] = [];

  // Add theme CSS variables
  const theme = getTheme();
  if (theme) {
    sections.push('/* Theme Variables */');
    sections.push(generateThemeCSS(theme));
    sections.push('');
  }

  // Add component styles
  const componentStyles = styleRegistry.getStyles();
  if (componentStyles) {
    sections.push('/* Component Styles */');
    sections.push(componentStyles);
    sections.push('');
  }

  // Add atomic utilities if enabled
  if (config?.atomicClasses) {
    const atomicClasses = atomicRegistry.getAll();
    if (atomicClasses.size > 0) {
      sections.push('/* Atomic Utilities */');
      for (const [, result] of atomicClasses) {
        sections.push(result.css);
      }
      sections.push('');
    }
  }

  let css = sections.join('\n').trim();

  // Minify if requested
  if (config?.minify) {
    css = minifyCSS(css);
  }

  // Add source map comment if requested
  if (config?.sourceMap) {
    const sourceMap = generateSourceMap(css);
    css += `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(sourceMap).toString('base64')} */`;
  }

  return css;
}

/**
 * Extract CSS and write to file
 */
export async function extractToFile(
  filePath: string,
  config?: Partial<ExtractConfig>
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  const css = extractCSS(config);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Write CSS file
  await fs.writeFile(filePath, css, 'utf-8');

  // Write source map if requested
  if (config?.sourceMap) {
    const sourceMapPath = `${filePath}.map`;
    const sourceMap = generateSourceMap(css);
    await fs.writeFile(sourceMapPath, sourceMap, 'utf-8');
  }
}

/**
 * CSS extraction plugin for build tools
 */
export interface BuildPlugin {
  name: string;
  setup?: (build: any) => void;
  transform?: (code: string, id: string) => { code: string; map?: any } | null;
  generateBundle?: () => void | Promise<void>;
}

/**
 * Create a Vite plugin for CSS extraction
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { createVitePlugin } from 'philjs-css/extract';
 *
 * export default {
 *   plugins: [
 *     createVitePlugin({
 *       outputPath: 'dist/styles.css',
 *       minify: true
 *     })
 *   ]
 * };
 * ```
 */
export function createVitePlugin(config?: Partial<ExtractConfig>): any {
  return {
    name: 'philjs-css',
    enforce: 'post',

    // Transform imports
    transform(code: string, id: string) {
      // Skip if not a JS/TS file
      if (!id.match(/\.(js|ts|jsx|tsx)$/)) {
        return null;
      }

      // Check if it imports philjs-css
      if (!code.includes('philjs-css')) {
        return null;
      }

      return null; // Let the normal build process handle it
    },

    // Generate CSS bundle
    async generateBundle() {
      if (!config?.outputPath) return;

      const css = extractCSS({
        minify: config.minify ?? true,
        sourceMap: config.sourceMap ?? true,
        atomicClasses: config.atomicClasses ?? true
      });

      // Emit CSS file
      this.emitFile({
        type: 'asset',
        fileName: config.outputPath,
        source: css
      });
    }
  };
}

/**
 * Create a Rollup plugin for CSS extraction
 */
export function createRollupPlugin(config?: Partial<ExtractConfig>): BuildPlugin {
  return {
    name: 'philjs-css',

    async generateBundle() {
      if (!config?.outputPath) return;

      const css = extractCSS({
        minify: config.minify ?? true,
        sourceMap: config.sourceMap ?? true,
        atomicClasses: config.atomicClasses ?? true
      });

      // Write to file
      await extractToFile(config.outputPath, config);
    }
  };
}

/**
 * Create a Webpack plugin for CSS extraction
 */
export function createWebpackPlugin(config?: Partial<ExtractConfig>): any {
  return class PhilJSCSSPlugin {
    apply(compiler: any) {
      compiler.hooks.emit.tapAsync('PhilJSCSSPlugin', async (compilation: any, callback: any) => {
        try {
          const css = extractCSS({
            minify: config?.minify ?? true,
            sourceMap: config?.sourceMap ?? true,
            atomicClasses: config?.atomicClasses ?? true
          });

          if (config?.outputPath) {
            // Add to webpack assets
            compilation.assets[config.outputPath] = {
              source: () => css,
              size: () => css.length
            };
          }

          callback();
        } catch (error) {
          callback(error);
        }
      });
    }
  };
}

/**
 * Extract critical CSS for SSR
 *
 * This function extracts only the CSS that's actually used
 * in the rendered HTML for faster first paint.
 *
 * @example
 * ```ts
 * const criticalCSS = extractCriticalCSS(html, {
 *   minify: true
 * });
 * ```
 */
export function extractCriticalCSS(
  html: string,
  config?: Partial<ExtractConfig>
): string {
  // Extract all class names from HTML
  const classNames = new Set<string>();
  const classRegex = /class="([^"]*)"/g;
  let match;

  while ((match = classRegex.exec(html)) !== null) {
    const classes = match[1].split(/\s+/);
    classes.forEach(cls => {
      if (cls) classNames.add(cls);
    });
  }

  // Get all styles from registry
  const allStyles = styleRegistry.getStyles();
  const lines = allStyles.split('\n');

  // Filter only used styles
  const usedStyles: string[] = [];
  let currentRule = '';
  let inRule = false;

  for (const line of lines) {
    if (line.includes('{')) {
      inRule = true;
      currentRule = line;

      // Check if this rule matches any used class
      for (const className of classNames) {
        if (line.includes(`.${className}`)) {
          usedStyles.push(currentRule);
          break;
        }
      }
    } else if (line.includes('}')) {
      inRule = false;
      currentRule = '';
    } else if (inRule) {
      currentRule += '\n' + line;
    }
  }

  let css = usedStyles.join('\n');

  // Add theme variables (always needed)
  const theme = getTheme();
  if (theme) {
    css = generateThemeCSS(theme) + '\n\n' + css;
  }

  // Minify if requested
  if (config?.minify) {
    css = minifyCSS(css);
  }

  return css;
}

/**
 * Bundle stats for analyzing CSS output
 */
export interface BundleStats {
  totalSize: number;
  minifiedSize: number;
  gzipSize: number;
  classCount: number;
  ruleCount: number;
  themeVars: number;
}

/**
 * Analyze CSS bundle and return statistics
 *
 * @example
 * ```ts
 * const stats = analyzeCSSBundle();
 * console.log(`Total size: ${stats.totalSize} bytes`);
 * console.log(`Minified: ${stats.minifiedSize} bytes`);
 * console.log(`Classes: ${stats.classCount}`);
 * ```
 */
export function analyzeCSSBundle(): BundleStats {
  const css = extractCSS();
  const minified = minifyCSS(css);

  // Count classes
  const classMatches = css.match(/\.[a-zA-Z0-9_-]+/g) || [];
  const classCount = new Set(classMatches).size;

  // Count rules
  const ruleCount = (css.match(/\{/g) || []).length;

  // Count theme vars
  const themeVarCount = (css.match(/--[a-zA-Z0-9-]+:/g) || []).length;

  // Calculate gzip size (rough estimate)
  const gzipSize = Math.round(minified.length * 0.3); // Rough estimate

  return {
    totalSize: css.length,
    minifiedSize: minified.length,
    gzipSize,
    classCount,
    ruleCount,
    themeVars: themeVarCount
  };
}

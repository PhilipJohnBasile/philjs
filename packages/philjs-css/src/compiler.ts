/**
 * PhilJS CSS Compiler - Compile-Time CSS Optimization
 *
 * This module provides build-time utilities for:
 * - Dead code elimination
 * - CSS purging
 * - Atomic CSS deduplication
 * - Critical CSS extraction
 * - Bundle splitting
 */

import type { CSSStyleObject, ExtractConfig, CSSResult } from './types.js';
import { styleRegistry } from './css.js';
import { atomicRegistry } from './atomic.js';
import { getTheme, generateThemeCSS } from './theme.js';

// ============================================================================
// AST Types
// ============================================================================

interface CSSNode {
  type: 'rule' | 'atrule' | 'declaration';
  selector?: string;
  name?: string;
  params?: string;
  property?: string;
  value?: string;
  children?: CSSNode[];
}

interface UsageInfo {
  classes: Set<string>;
  ids: Set<string>;
  tags: Set<string>;
  attributes: Set<string>;
}

// ============================================================================
// CSS Parser (Simplified)
// ============================================================================

/**
 * Parse CSS string to AST
 */
function parseCSS(css: string): CSSNode[] {
  const nodes: CSSNode[] = [];
  const ruleRegex = /([^{]+)\{([^}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1]!.trim();
    const declarations = match[2]!.trim();

    if (selector.startsWith('@')) {
      // At-rule
      const [name, ...params] = selector.split(/\s+/);
      nodes.push({
        type: 'atrule',
        name: name!.substring(1),
        params: params.join(' '),
        children: parseDeclarations(declarations)
      });
    } else {
      // Regular rule
      nodes.push({
        type: 'rule',
        selector,
        children: parseDeclarations(declarations)
      });
    }
  }

  return nodes;
}

/**
 * Parse CSS declarations
 */
function parseDeclarations(css: string): CSSNode[] {
  const nodes: CSSNode[] = [];
  const declarations = css.split(';').filter(d => d.trim());

  for (const decl of declarations) {
    const [property, ...valueParts] = decl.split(':');
    if (property && valueParts.length) {
      nodes.push({
        type: 'declaration',
        property: property.trim(),
        value: valueParts.join(':').trim()
      });
    }
  }

  return nodes;
}

/**
 * Stringify AST back to CSS
 */
function stringifyCSS(nodes: CSSNode[], minify = false): string {
  const results: string[] = [];
  const space = minify ? '' : ' ';
  const newline = minify ? '' : '\n';

  for (const node of nodes) {
    if (node.type === 'rule') {
      const declarations = node.children
        ?.filter(c => c.type === 'declaration')
        .map(c => `${c.property}:${space}${c.value}`)
        .join(`;${space}`);

      results.push(`${node.selector}${space}{${space}${declarations}${minify ? '' : ';'}${space}}`);
    } else if (node.type === 'atrule') {
      const content = stringifyCSS(node.children || [], minify);
      results.push(`@${node.name}${space}${node.params}${space}{${newline}${content}${newline}}`);
    }
  }

  return results.join(newline);
}

// ============================================================================
// Usage Extraction
// ============================================================================

/**
 * Extract CSS class usage from source files
 *
 * @example
 * ```ts
 * const usage = await extractUsageFromFiles(['src/**\/*.tsx']);
 * ```
 */
export async function extractUsageFromFiles(patterns: string[]): Promise<UsageInfo> {
  const usage: UsageInfo = {
    classes: new Set(),
    ids: new Set(),
    tags: new Set(),
    attributes: new Set()
  };

  // This would typically use a file glob library
  // For now, we'll provide the interface
  console.warn('extractUsageFromFiles requires a file system implementation');

  return usage;
}

/**
 * Extract CSS usage from HTML string
 */
export function extractUsageFromHTML(html: string): UsageInfo {
  const usage: UsageInfo = {
    classes: new Set(),
    ids: new Set(),
    tags: new Set(),
    attributes: new Set()
  };

  // Extract classes
  const classRegex = /class=["']([^"']+)["']/g;
  let match;

  while ((match = classRegex.exec(html)) !== null) {
    const classes = match[1]!.split(/\s+/);
    classes.forEach(c => c && usage.classes.add(c));
  }

  // Extract IDs
  const idRegex = /id=["']([^"']+)["']/g;
  while ((match = idRegex.exec(html)) !== null) {
    usage.ids.add(match[1]!);
  }

  // Extract tags
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)/g;
  while ((match = tagRegex.exec(html)) !== null) {
    usage.tags.add(match[1]!.toLowerCase());
  }

  // Extract data attributes
  const attrRegex = /data-([a-zA-Z0-9-]+)/g;
  while ((match = attrRegex.exec(html)) !== null) {
    usage.attributes.add(`data-${match[1]!}`);
  }

  return usage;
}

/**
 * Extract CSS usage from JSX/TSX source
 */
export function extractUsageFromJSX(source: string): UsageInfo {
  const usage: UsageInfo = {
    classes: new Set(),
    ids: new Set(),
    tags: new Set(),
    attributes: new Set()
  };

  // Extract className strings
  const classNameRegex = /className=["']([^"']+)["']/g;
  let match;

  while ((match = classNameRegex.exec(source)) !== null) {
    const classes = match[1]!.split(/\s+/);
    classes.forEach(c => c && usage.classes.add(c));
  }

  // Extract className with template literals (simplified)
  const templateRegex = /className=\{`([^`]+)`\}/g;
  while ((match = templateRegex.exec(source)) !== null) {
    const classes = match[1]!.split(/\s+/).filter(c => !c.includes('$'));
    classes.forEach(c => c && usage.classes.add(c));
  }

  // Extract css() usage for class extraction
  const cssCallRegex = /css\s*\(\s*\{/g;
  while ((match = cssCallRegex.exec(source)) !== null) {
    // Mark that CSS is used (actual classes will be in registry)
  }

  // Extract JSX tags (React components are PascalCase, HTML is lowercase)
  const tagRegex = /<([A-Za-z][A-Za-z0-9]*)/g;
  while ((match = tagRegex.exec(source)) !== null) {
    const tag = match[1]!;
    if (tag[0] === tag[0]!.toLowerCase()) {
      usage.tags.add(tag);
    }
  }

  return usage;
}

// ============================================================================
// Dead Code Elimination
// ============================================================================

/**
 * Remove unused CSS rules
 *
 * @example
 * ```ts
 * const optimizedCSS = purgeUnusedCSS(css, {
 *   classes: new Set(['btn', 'card']),
 *   tags: new Set(['button', 'div'])
 * });
 * ```
 */
export function purgeUnusedCSS(css: string, usage: UsageInfo): string {
  const nodes = parseCSS(css);
  const usedNodes: CSSNode[] = [];

  for (const node of nodes) {
    if (node.type === 'rule') {
      const selector = node.selector || '';

      // Check if selector matches any used class, id, or tag
      let isUsed = false;

      // Check class selectors
      const classMatches = selector.match(/\.([a-zA-Z0-9_-]+)/g);
      if (classMatches) {
        for (const match of classMatches) {
          const className = match.substring(1);
          if (usage.classes.has(className)) {
            isUsed = true;
            break;
          }
        }
      }

      // Check ID selectors
      const idMatches = selector.match(/#([a-zA-Z0-9_-]+)/g);
      if (idMatches) {
        for (const match of idMatches) {
          const id = match.substring(1);
          if (usage.ids.has(id)) {
            isUsed = true;
            break;
          }
        }
      }

      // Check tag selectors
      const tagMatch = selector.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
      if (tagMatch && usage.tags.has(tagMatch[1]!.toLowerCase())) {
        isUsed = true;
      }

      // Always keep :root, *, and html/body
      if (selector.match(/^(:root|\*|html|body)/)) {
        isUsed = true;
      }

      if (isUsed) {
        usedNodes.push(node);
      }
    } else if (node.type === 'atrule') {
      // Keep at-rules (media queries, keyframes, etc.)
      usedNodes.push(node);
    }
  }

  return stringifyCSS(usedNodes);
}

// ============================================================================
// CSS Deduplication
// ============================================================================

/**
 * Deduplicate identical CSS declarations
 */
export function deduplicateCSS(css: string): string {
  const nodes = parseCSS(css);
  const seen = new Map<string, CSSNode>();
  const result: CSSNode[] = [];

  for (const node of nodes) {
    if (node.type === 'rule') {
      const key = JSON.stringify(node.children);

      if (seen.has(key)) {
        // Merge selectors
        const existing = seen.get(key)!;
        existing.selector = `${existing.selector}, ${node.selector}`;
      } else {
        seen.set(key, node);
        result.push(node);
      }
    } else {
      result.push(node);
    }
  }

  return stringifyCSS(result);
}

/**
 * Atomic CSS deduplication - extract common declarations
 */
export function atomicDeduplication(css: string): {
  atomic: string;
  composed: string;
} {
  const nodes = parseCSS(css);
  const declarationUsage = new Map<string, string[]>();

  // Count declaration usage
  for (const node of nodes) {
    if (node.type === 'rule' && node.children) {
      for (const child of node.children) {
        if (child.type === 'declaration') {
          const key = `${child.property}:${child.value}`;
          if (!declarationUsage.has(key)) {
            declarationUsage.set(key, []);
          }
          declarationUsage.get(key)!.push(node.selector!);
        }
      }
    }
  }

  // Extract commonly used declarations to atomic classes
  const atomicRules: CSSNode[] = [];
  const atomicMap = new Map<string, string>();
  let atomicCounter = 0;

  for (const [key, selectors] of declarationUsage) {
    if (selectors.length >= 3) {
      // Used 3+ times, make atomic
      const [property, value] = key.split(':');
      const atomicClass = `_${atomicCounter++}`;
      atomicMap.set(key, atomicClass);

      const declaration: CSSNode = {
        type: 'declaration'
      };
      if (property !== undefined) declaration.property = property;
      if (value !== undefined) declaration.value = value;

      atomicRules.push({
        type: 'rule',
        selector: `.${atomicClass}`,
        children: [declaration]
      });
    }
  }

  // Rewrite original rules to use atomic classes (composition info)
  const composed: string[] = [];
  for (const node of nodes) {
    if (node.type === 'rule' && node.children) {
      const atomicClasses: string[] = [];
      const remainingDeclarations: CSSNode[] = [];

      for (const child of node.children) {
        if (child.type === 'declaration') {
          const key = `${child.property}:${child.value}`;
          if (atomicMap.has(key)) {
            atomicClasses.push(atomicMap.get(key)!);
          } else {
            remainingDeclarations.push(child);
          }
        }
      }

      if (atomicClasses.length > 0) {
        composed.push(`/* ${node.selector} -> ${atomicClasses.join(' ')} */`);
      }
    }
  }

  return {
    atomic: stringifyCSS(atomicRules),
    composed: composed.join('\n')
  };
}

// ============================================================================
// Critical CSS
// ============================================================================

/**
 * Extract above-the-fold critical CSS
 */
export function extractCriticalCSS(
  fullCSS: string,
  aboveFoldSelectors: string[]
): {
  critical: string;
  deferred: string;
} {
  const nodes = parseCSS(fullCSS);
  const critical: CSSNode[] = [];
  const deferred: CSSNode[] = [];

  const aboveFoldSet = new Set(aboveFoldSelectors);

  for (const node of nodes) {
    if (node.type === 'rule') {
      // Check if any selector is above fold
      const selectors = (node.selector || '').split(',').map(s => s.trim());
      let isCritical = false;

      for (const selector of selectors) {
        // Extract class from selector
        const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
        if (classMatch && aboveFoldSet.has(classMatch[1]!)) {
          isCritical = true;
          break;
        }
      }

      if (isCritical) {
        critical.push(node);
      } else {
        deferred.push(node);
      }
    } else if (node.type === 'atrule') {
      // Keep @font-face, @keyframes in critical, media queries in deferred
      if (node.name === 'font-face' || node.name === 'keyframes') {
        critical.push(node);
      } else {
        deferred.push(node);
      }
    }
  }

  // Always include :root variables in critical
  const themeCSS = getTheme() ? generateThemeCSS(getTheme()!) : '';

  return {
    critical: themeCSS + '\n' + stringifyCSS(critical),
    deferred: stringifyCSS(deferred)
  };
}

// ============================================================================
// Bundle Splitting
// ============================================================================

interface CSSChunk {
  name: string;
  css: string;
  selectors: string[];
}

/**
 * Split CSS into route-based chunks
 *
 * @example
 * ```ts
 * const chunks = splitCSSByRoute({
 *   '/': ['container', 'header', 'hero'],
 *   '/about': ['container', 'about-content'],
 *   '/products': ['container', 'product-grid', 'product-card']
 * });
 * ```
 */
export function splitCSSByRoute(
  routeSelectors: Record<string, string[]>
): CSSChunk[] {
  const fullCSS = styleRegistry.getStyles();
  const nodes = parseCSS(fullCSS);
  const chunks: CSSChunk[] = [];

  // Create shared chunk for common selectors
  const allSelectors = Object.values(routeSelectors).flat();
  const selectorCounts = new Map<string, number>();

  for (const selector of allSelectors) {
    selectorCounts.set(selector, (selectorCounts.get(selector) || 0) + 1);
  }

  const sharedSelectors = Array.from(selectorCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([selector]) => selector);

  // Extract shared CSS
  const sharedNodes: CSSNode[] = [];
  const sharedSet = new Set(sharedSelectors);

  for (const node of nodes) {
    if (node.type === 'rule') {
      const classMatch = (node.selector || '').match(/\.([a-zA-Z0-9_-]+)/);
      if (classMatch && sharedSet.has(classMatch[1]!)) {
        sharedNodes.push(node);
      }
    }
  }

  chunks.push({
    name: 'shared',
    css: stringifyCSS(sharedNodes),
    selectors: sharedSelectors
  });

  // Create route-specific chunks
  for (const [route, selectors] of Object.entries(routeSelectors)) {
    const routeNodes: CSSNode[] = [];
    // ES2024: Use Set.difference() for cleaner set operations
    const selectorsSet = new Set(selectors);
    const routeSet = selectorsSet.difference(sharedSet);

    for (const node of nodes) {
      if (node.type === 'rule') {
        const classMatch = (node.selector || '').match(/\.([a-zA-Z0-9_-]+)/);
        if (classMatch && routeSet.has(classMatch[1]!)) {
          routeNodes.push(node);
        }
      }
    }

    const routeName = route.replace(/\//g, '-').replace(/^-/, '') || 'index';

    chunks.push({
      name: routeName,
      css: stringifyCSS(routeNodes),
      selectors: Array.from(routeSet)
    });
  }

  return chunks;
}

// ============================================================================
// Source Map Generation
// ============================================================================

interface SourceMap {
  version: 3;
  file: string;
  sources: string[];
  sourcesContent: string[];
  mappings: string;
  names: string[];
}

/**
 * Generate source map for CSS
 */
export function generateSourceMap(
  css: string,
  sourceFile: string
): SourceMap {
  // Simplified source map - in production use a proper library
  return {
    version: 3,
    file: sourceFile.replace(/\.tsx?$/, '.css'),
    sources: [sourceFile],
    sourcesContent: [css],
    mappings: '',
    names: []
  };
}

// ============================================================================
// Compile-Time Optimization Report
// ============================================================================

interface OptimizationReport {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
  unusedRulesRemoved: number;
  duplicatesRemoved: number;
  atomicClassesCreated: number;
}

/**
 * Generate optimization report
 */
export function generateOptimizationReport(
  originalCSS: string,
  optimizedCSS: string,
  options: {
    unusedRules?: number;
    duplicates?: number;
    atomicClasses?: number;
  } = {}
): OptimizationReport {
  const originalSize = Buffer.from(originalCSS).length;
  const optimizedSize = Buffer.from(optimizedCSS).length;
  const savings = originalSize - optimizedSize;

  return {
    originalSize,
    optimizedSize,
    savings,
    savingsPercent: Math.round((savings / originalSize) * 100),
    unusedRulesRemoved: options.unusedRules || 0,
    duplicatesRemoved: options.duplicates || 0,
    atomicClassesCreated: options.atomicClasses || 0
  };
}

// ============================================================================
// Build Integration
// ============================================================================

/**
 * Full optimization pipeline
 *
 * @example
 * ```ts
 * const result = await optimizeCSS({
 *   input: extractCSS(),
 *   usage: await extractUsageFromFiles(['src/**\/*.tsx']),
 *   options: {
 *     purge: true,
 *     deduplicate: true,
 *     atomic: true,
 *     minify: true
 *   }
 * });
 * ```
 */
export function optimizeCSS(config: {
  input: string;
  usage?: UsageInfo;
  options?: {
    purge?: boolean;
    deduplicate?: boolean;
    atomic?: boolean;
    minify?: boolean;
    sourcemap?: boolean;
  };
}): {
  css: string;
  sourcemap?: SourceMap;
  report: OptimizationReport;
} {
  const { input, usage, options = {} } = config;
  let css = input;
  let unusedRules = 0;
  let duplicates = 0;
  let atomicClasses = 0;

  // Purge unused CSS
  if (options.purge && usage) {
    const before = parseCSS(css).length;
    css = purgeUnusedCSS(css, usage);
    unusedRules = before - parseCSS(css).length;
  }

  // Deduplicate CSS
  if (options.deduplicate) {
    const before = parseCSS(css).length;
    css = deduplicateCSS(css);
    duplicates = before - parseCSS(css).length;
  }

  // Create atomic classes
  if (options.atomic) {
    const result = atomicDeduplication(css);
    atomicClasses = (result.atomic.match(/\._[0-9]+/g) || []).length;
    css = result.atomic + '\n' + css;
  }

  // Minify
  if (options.minify) {
    css = stringifyCSS(parseCSS(css), true);
  }

  const report = generateOptimizationReport(input, css, {
    unusedRules,
    duplicates,
    atomicClasses
  });

  const result: {
    css: string;
    sourcemap?: SourceMap;
    report: OptimizationReport;
  } = { css, report };

  if (options.sourcemap) {
    result.sourcemap = generateSourceMap(css, 'styles.css');
  }

  return result;
}

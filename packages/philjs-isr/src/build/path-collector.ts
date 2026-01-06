/**
 * PhilJS ISR Path Collector
 *
 * Collects all paths to pre-render at build time by analyzing
 * page modules and their getStaticPaths exports.
 */

import type {
  FallbackMode,
  GetStaticPaths,
  ISRPageModule,
  PathParams,
  StaticPathsResult,
} from '../types.js';

/**
 * Collected path information
 */
export interface CollectedPath {
  /** Full path string */
  path: string;
  /** Route parameters */
  params: Record<string, string | string[]>;
  /** Source page file */
  sourcePath: string;
  /** Locale if applicable */
  locale?: string;
  /** Fallback mode from getStaticPaths */
  fallback: FallbackMode;
}

/**
 * Route pattern information
 */
export interface RoutePattern {
  /** Original pattern (e.g., /posts/[id]) */
  pattern: string;
  /** Regex to match paths */
  regex: RegExp;
  /** Parameter names in order */
  paramNames: string[];
  /** Source file path */
  sourcePath: string;
  /** Whether this is a catch-all route */
  isCatchAll: boolean;
  /** Whether this is an optional catch-all route */
  isOptionalCatchAll: boolean;
}

/**
 * Path collector options
 */
export interface PathCollectorOptions {
  /** Page directory to scan */
  pagesDir: string;
  /** File extensions to consider */
  extensions?: string[];
  /** Locales to generate paths for */
  locales?: string[];
  /** Default locale */
  defaultLocale?: string;
  /** Custom route patterns to ignore */
  ignore?: string[];
  /** Concurrency for path generation */
  concurrency?: number;
}

/**
 * Path collection result
 */
export interface PathCollectionResult {
  /** All collected paths */
  paths: CollectedPath[];
  /** Route patterns for dynamic routes */
  patterns: RoutePattern[];
  /** Pages with errors */
  errors: Array<{ sourcePath: string; error: Error }>;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Parse a file path into a route pattern
 */
export function parseRoutePattern(filePath: string): RoutePattern {
  // Remove extension and normalize path
  const normalized = filePath
    .replace(/\.(tsx?|jsx?|mdx?)$/, '')
    .replace(/\/index$/, '')
    .replace(/\\/g, '/');

  // Extract parameter patterns
  const paramNames: string[] = [];
  let isCatchAll = false;
  let isOptionalCatchAll = false;

  // Build regex pattern
  let regexPattern = normalized.replace(
    /\[{1,2}\.{0,3}([^\]]+)\]{1,2}/g,
    (match, paramName) => {
      if (match.startsWith('[[')) {
        // Optional catch-all: [[...slug]]
        isOptionalCatchAll = true;
        isCatchAll = true;
        paramNames.push(paramName.replace('...', ''));
        return '(?:/(.*))?';
      } else if (match.includes('...')) {
        // Catch-all: [...slug]
        isCatchAll = true;
        paramNames.push(paramName.replace('...', ''));
        return '/(.+)';
      } else {
        // Regular param: [id]
        paramNames.push(paramName);
        return '/([^/]+)';
      }
    }
  );

  // Ensure pattern starts with /
  if (!regexPattern.startsWith('/')) {
    regexPattern = '/' + regexPattern;
  }

  return {
    pattern: normalized.startsWith('/') ? normalized : '/' + normalized,
    regex: new RegExp(`^${regexPattern}$`),
    paramNames,
    sourcePath: filePath,
    isCatchAll,
    isOptionalCatchAll,
  };
}

/**
 * Check if a route pattern is dynamic (has parameters)
 */
export function isDynamicRoute(pattern: string): boolean {
  return /\[[^\]]+\]/.test(pattern);
}

/**
 * Expand a path template with parameters
 */
export function expandPathTemplate(
  pattern: string,
  params: Record<string, string | string[]>
): string {
  let path = pattern;

  for (const [key, value] of Object.entries(params)) {
    const paramPattern = new RegExp(`\\[{1,2}\\.{0,3}${key}\\]{1,2}`, 'g');

    if (Array.isArray(value)) {
      path = path.replace(paramPattern, value.join('/'));
    } else {
      path = path.replace(paramPattern, value);
    }
  }

  // Clean up path
  path = path.replace(/\/+/g, '/');
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return path;
}

/**
 * Normalize a path result from getStaticPaths
 */
function normalizePathResult(
  pathOrParams: string | PathParams,
  pattern: RoutePattern
): { path: string; params: Record<string, string | string[]>; locale?: string } {
  if (typeof pathOrParams === 'string') {
    // Extract params from path using regex
    const match = pattern.regex.exec(pathOrParams);
    const params: Record<string, string | string[]> = {};

    if (match) {
      pattern.paramNames.forEach((name, index) => {
        const value = match[index + 1];
        if (value) {
          params[name] = pattern.isCatchAll ? value.split('/') : value;
        }
      });
    }

    return { path: pathOrParams, params };
  }

  // PathParams object
  const path = expandPathTemplate(pattern.pattern, pathOrParams.params);
  return {
    path,
    params: pathOrParams.params,
    locale: pathOrParams.locale,
  };
}

/**
 * Path collector class
 */
export class PathCollector {
  private options: Required<PathCollectorOptions>;
  private patterns: Map<string, RoutePattern> = new Map();
  private pageModules: Map<string, ISRPageModule> = new Map();

  constructor(options: PathCollectorOptions) {
    this.options = {
      pagesDir: options.pagesDir,
      extensions: options.extensions ?? ['.tsx', '.ts', '.jsx', '.js', '.mdx'],
      locales: options.locales ?? [],
      defaultLocale: options.defaultLocale ?? 'en',
      ignore: options.ignore ?? ['_app', '_document', '_error', '404', '500', 'api/**'],
      concurrency: options.concurrency ?? 10,
    };
  }

  /**
   * Register a page module
   */
  registerPage(sourcePath: string, module: ISRPageModule): void {
    const pattern = parseRoutePattern(sourcePath);
    this.patterns.set(sourcePath, pattern);
    this.pageModules.set(sourcePath, module);
  }

  /**
   * Collect all paths from registered pages
   */
  async collect(): Promise<PathCollectionResult> {
    const startTime = Date.now();
    const paths: CollectedPath[] = [];
    const errors: Array<{ sourcePath: string; error: Error }> = [];

    for (const [sourcePath, module] of this.pageModules) {
      const pattern = this.patterns.get(sourcePath)!;

      try {
        const pagePaths = await this.collectPagePaths(sourcePath, module, pattern);
        paths.push(...pagePaths);
      } catch (error) {
        errors.push({
          sourcePath,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    return {
      paths,
      patterns: Array.from(this.patterns.values()),
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Collect paths for a single page
   */
  private async collectPagePaths(
    sourcePath: string,
    module: ISRPageModule,
    pattern: RoutePattern
  ): Promise<CollectedPath[]> {
    const paths: CollectedPath[] = [];

    // Check if route is dynamic
    if (!isDynamicRoute(pattern.pattern)) {
      // Static route - single path
      const basePaths = this.generateLocalizedPaths(pattern.pattern);

      for (const { path, locale } of basePaths) {
        paths.push({
          path,
          params: {},
          sourcePath,
          locale,
          fallback: false,
        });
      }

      return paths;
    }

    // Dynamic route - need getStaticPaths
    const getStaticPaths = module.staticPaths;
    if (!getStaticPaths) {
      // No getStaticPaths - fallback to blocking by default
      return [{
        path: pattern.pattern,
        params: {},
        sourcePath,
        fallback: 'blocking',
      }];
    }

    // Call getStaticPaths
    const result = await this.executeGetStaticPaths(getStaticPaths);

    for (const pathOrParams of result.paths) {
      const normalized = normalizePathResult(pathOrParams, pattern);
      const localizedPaths = this.generateLocalizedPaths(normalized.path, normalized.locale);

      for (const { path, locale } of localizedPaths) {
        paths.push({
          path,
          params: normalized.params,
          sourcePath,
          locale,
          fallback: result.fallback,
        });
      }
    }

    return paths;
  }

  /**
   * Execute getStaticPaths function
   */
  private async executeGetStaticPaths(fn: GetStaticPaths): Promise<StaticPathsResult> {
    const result = await fn();
    return result;
  }

  /**
   * Generate paths for all locales
   */
  private generateLocalizedPaths(
    basePath: string,
    specificLocale?: string
  ): Array<{ path: string; locale?: string }> {
    if (this.options.locales.length === 0) {
      return [{ path: basePath }];
    }

    const locales = specificLocale ? [specificLocale] : this.options.locales;
    const paths: Array<{ path: string; locale?: string }> = [];

    for (const locale of locales) {
      const localizedPath =
        locale === this.options.defaultLocale
          ? basePath
          : `/${locale}${basePath === '/' ? '' : basePath}`;

      paths.push({ path: localizedPath, locale });
    }

    return paths;
  }

  /**
   * Get all registered patterns
   */
  getPatterns(): RoutePattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Match a path against registered patterns
   */
  matchPath(path: string): { pattern: RoutePattern; params: Record<string, string | string[]> } | null {
    for (const pattern of this.patterns.values()) {
      const match = pattern.regex.exec(path);
      if (match) {
        const params: Record<string, string | string[]> = {};
        pattern.paramNames.forEach((name, index) => {
          const value = match[index + 1];
          if (value) {
            params[name] = pattern.isCatchAll ? value.split('/') : value;
          }
        });
        return { pattern, params };
      }
    }
    return null;
  }
}

/**
 * Create a new path collector
 */
export function createPathCollector(options: PathCollectorOptions): PathCollector {
  return new PathCollector(options);
}

/**
 * Helper to create getStaticPaths function
 */
export function getStaticPaths<T extends StaticPathsResult>(
  fn: () => Promise<T> | T
): GetStaticPaths {
  return fn;
}

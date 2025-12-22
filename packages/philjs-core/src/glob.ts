/**
 * @fileoverview Glob utilities for PhilJS applications (Astro-style)
 * Provides type-safe glob imports and content loading
 */

// Vite's import.meta.glob extension
declare global {
  interface ImportMeta {
    glob?: <T = unknown>(pattern: string | string[], options?: { eager?: boolean; as?: string }) => Record<string, T | (() => Promise<T>)>;
  }
}

/**
 * Glob import options
 */
export interface GlobOptions {
  /** Load modules eagerly (import all immediately) */
  eager?: boolean;
  /** Import as raw strings instead of modules */
  as?: 'raw' | 'url';
  /** Custom import function (for testing/SSR) */
  import?: (path: string) => Promise<any>;
}

/**
 * Glob result for lazy imports
 */
export type GlobLazy<T = any> = Record<string, () => Promise<T>>;

/**
 * Glob result for eager imports
 */
export type GlobEager<T = any> = Record<string, T>;

/**
 * Glob result (either lazy or eager)
 */
export type GlobResult<T = any, Eager extends boolean = false> = Eager extends true
  ? GlobEager<T>
  : GlobLazy<T>;

/**
 * Wrapper around import.meta.glob() with better typing
 * @param pattern - Glob pattern(s) to match
 * @param options - Glob options
 * @returns Object mapping file paths to imports
 */
export function glob<T = any>(
  pattern: string | string[],
  options?: GlobOptions & { eager: true }
): GlobEager<T>;
export function glob<T = any>(
  pattern: string | string[],
  options?: GlobOptions & { eager?: false }
): GlobLazy<T>;
export function glob<T = any>(
  pattern: string | string[],
  options: GlobOptions = {}
): GlobResult<T, any> {
  // This is a build-time helper - actual implementation is replaced by Vite
  if (typeof import.meta.glob === 'undefined') {
    throw new Error('import.meta.glob is not available. Are you using Vite?');
  }

  const patterns = Array.isArray(pattern) ? pattern : [pattern];

  // Vite's import.meta.glob will be used at build time
  // This is just a runtime fallback
  console.warn('glob() should be used at build time with Vite');
  return {} as any;
}

/**
 * Import all files matching a glob pattern eagerly
 */
export async function importGlob<T = any>(
  pattern: string | string[],
  options: GlobOptions = {}
): Promise<GlobEager<T>> {
  const modules = glob<T>(pattern, { ...options, eager: false });
  const result: GlobEager<T> = {};

  await Promise.all(
    Object.entries(modules).map(async ([path, importer]) => {
      result[path] = await importer();
    })
  );

  return result;
}

/**
 * Map glob results with a transform function
 */
export function mapGlob<T = any, R = any>(
  globResult: GlobResult<T, any>,
  mapper: (value: T, path: string) => R
): GlobResult<R, any> {
  const result: any = {};

  for (const [path, value] of Object.entries(globResult)) {
    if (typeof value === 'function') {
      // Lazy import
      result[path] = async () => {
        const loaded = await value();
        return mapper(loaded, path);
      };
    } else {
      // Eager import
      result[path] = mapper(value, path);
    }
  }

  return result;
}

/**
 * Filter glob results
 */
export function filterGlob<T = any>(
  globResult: GlobResult<T, any>,
  predicate: (value: T, path: string) => boolean
): GlobResult<T, any> {
  const result: any = {};

  for (const [path, value] of Object.entries(globResult)) {
    if (typeof value === 'function') {
      // Lazy import - can't filter without loading
      result[path] = async () => {
        const loaded = await value();
        if (predicate(loaded, path)) {
          return loaded;
        }
        throw new Error(`Filtered out: ${path}`);
      };
    } else {
      // Eager import
      if (predicate(value, path)) {
        result[path] = value;
      }
    }
  }

  return result;
}

/**
 * Extract path information from glob path
 */
export interface GlobPathInfo {
  /** Full path */
  path: string;
  /** Filename without extension */
  name: string;
  /** File extension */
  extension: string;
  /** Directory path */
  directory: string;
  /** Path segments */
  segments: string[];
}

/**
 * Parse glob path into components
 */
export function parseGlobPath(path: string): GlobPathInfo {
  const segments = path.split('/').filter(Boolean);
  const filename = segments[segments.length - 1] || '';
  const extensionMatch = filename.match(/\.([^.]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : '';
  const name = filename.replace(/\.[^.]+$/, '');
  const directory = segments.slice(0, -1).join('/');

  return {
    path,
    name,
    extension,
    directory,
    segments,
  };
}

/**
 * Content collection item
 */
export interface ContentItem<T = any> {
  /** File path */
  path: string;
  /** Parsed path info */
  pathInfo: GlobPathInfo;
  /** Module exports */
  module: T;
  /** Raw content (if imported as raw) */
  raw?: string;
}

/**
 * Load content from glob pattern
 */
export async function loadContent<T = any>(
  pattern: string | string[],
  options: GlobOptions = {}
): Promise<ContentItem<T>[]> {
  const modules = await importGlob<T>(pattern, options);

  return Object.entries(modules).map(([path, module]) => ({
    path,
    pathInfo: parseGlobPath(path),
    module,
  }));
}

/**
 * Sort content items
 */
export function sortContent<T = any>(
  items: ContentItem<T>[],
  compareFn: (a: ContentItem<T>, b: ContentItem<T>) => number
): ContentItem<T>[] {
  return [...items].sort(compareFn);
}

/**
 * Group content items by a key
 */
export function groupContent<T = any, K extends string = string>(
  items: ContentItem<T>[],
  keyFn: (item: ContentItem<T>) => K
): Record<K, ContentItem<T>[]> {
  const groups: Record<string, ContentItem<T>[]> = {};

  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }

  return groups as Record<K, ContentItem<T>[]>;
}

/**
 * Auto-register modules from glob
 * Useful for plugin systems, route registration, etc.
 */
export interface AutoRegisterOptions<T = any> {
  /** Glob pattern(s) */
  pattern: string | string[];
  /** Extract registration key from path */
  getKey?: (path: string, module: T) => string;
  /** Transform module before registration */
  transform?: (module: T, path: string) => any;
  /** Glob options */
  globOptions?: GlobOptions;
}

/**
 * Auto-register modules from glob pattern
 */
export async function autoRegister<T = any>(
  options: AutoRegisterOptions<T>
): Promise<Record<string, any>> {
  const { pattern, getKey, transform, globOptions = {} } = options;
  const content = await loadContent<T>(pattern, globOptions);
  const registry: Record<string, any> = {};

  for (const item of content) {
    const key = getKey
      ? getKey(item.path, item.module)
      : item.pathInfo.name;

    const value = transform
      ? transform(item.module, item.path)
      : item.module;

    registry[key] = value;
  }

  return registry;
}

/**
 * Route module from file
 */
export interface RouteModule {
  /** Route component */
  default?: any;
  /** Page metadata */
  meta?: Record<string, any>;
  /** Loader function */
  loader?: (...args: any[]) => any;
  /** Action function */
  action?: (...args: any[]) => any;
}

/**
 * Load routes from glob pattern
 */
export async function loadRoutes(
  pattern: string | string[] = './routes/**/*.{js,jsx,ts,tsx}'
): Promise<Record<string, RouteModule>> {
  return autoRegister<RouteModule>({
    pattern,
    getKey: (path) => {
      // Convert file path to route path
      // e.g., ./routes/users/[id].tsx -> /users/:id
      return filePathToRoute(path);
    },
  });
}

/**
 * Convert file path to route path
 */
export function filePathToRoute(filePath: string): string {
  let route = filePath
    // Remove ./routes/ prefix and file extension
    .replace(/^\.\/routes\//, '/')
    .replace(/\.(js|jsx|ts|tsx)$/, '')
    // Handle index files
    .replace(/\/index$/, '/')
    // Handle [param] -> :param
    .replace(/\[([^\]]+)\]/g, ':$1')
    // Handle [...param] -> *param (catch-all)
    .replace(/\[\.\.\.([^\]]+)\]/g, '*$1');

  // Ensure leading slash
  if (!route.startsWith('/')) {
    route = `/${route}`;
  }

  // Remove trailing slash (except for root)
  if (route !== '/' && route.endsWith('/')) {
    route = route.slice(0, -1);
  }

  return route;
}

/**
 * Content collection with frontmatter
 */
export interface ContentWithFrontmatter<F = any, C = any> {
  /** Frontmatter data */
  frontmatter: F;
  /** Content body */
  content: C;
  /** File path */
  path: string;
}

/**
 * Load content with frontmatter (markdown, MDX, etc.)
 */
export async function loadContentWithFrontmatter<F = any, C = any>(
  pattern: string | string[]
): Promise<ContentWithFrontmatter<F, C>[]> {
  const items = await loadContent<any>(pattern);

  return items.map(item => ({
    frontmatter: item.module.frontmatter || {},
    content: item.module.default || item.module,
    path: item.path,
  }));
}

/**
 * Filter content by frontmatter
 */
export function filterByFrontmatter<F = any, C = any>(
  items: ContentWithFrontmatter<F, C>[],
  predicate: (frontmatter: F) => boolean
): ContentWithFrontmatter<F, C>[] {
  return items.filter(item => predicate(item.frontmatter));
}

/**
 * Sort content by frontmatter field
 */
export function sortByFrontmatter<F = any, C = any>(
  items: ContentWithFrontmatter<F, C>[],
  field: keyof F,
  order: 'asc' | 'desc' = 'asc'
): ContentWithFrontmatter<F, C>[] {
  return [...items].sort((a, b) => {
    const aVal = a.frontmatter[field];
    const bVal = b.frontmatter[field];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Plugin definition
 */
export interface Plugin<T = any> {
  /** Plugin name */
  name: string;
  /** Plugin setup function */
  setup: (context: T) => void | Promise<void>;
}

/**
 * Load plugins from glob pattern
 */
export async function loadPlugins<T = any>(
  pattern: string | string[] = './plugins/**/*.{js,ts}'
): Promise<Plugin<T>[]> {
  const items = await loadContent<Plugin<T> | { default: Plugin<T> }>(pattern);

  return items.map(item => {
    const plugin = 'default' in item.module ? item.module.default : item.module;
    return plugin;
  });
}

/**
 * Initialize plugins
 */
export async function initializePlugins<T = any>(
  plugins: Plugin<T>[],
  context: T
): Promise<void> {
  for (const plugin of plugins) {
    await plugin.setup(context);
  }
}

/**
 * Create a content collection
 */
export interface ContentCollection<T = any> {
  /** Collection name */
  name: string;
  /** Load all items */
  all: () => Promise<ContentItem<T>[]>;
  /** Find item by path */
  find: (predicate: (item: ContentItem<T>) => boolean) => Promise<ContentItem<T> | undefined>;
  /** Filter items */
  filter: (predicate: (item: ContentItem<T>) => boolean) => Promise<ContentItem<T>[]>;
}

/**
 * Create a content collection from glob pattern
 */
export function createCollection<T = any>(
  name: string,
  pattern: string | string[]
): ContentCollection<T> {
  let cache: ContentItem<T>[] | null = null;

  const loadAll = async () => {
    if (!cache) {
      cache = await loadContent<T>(pattern);
    }
    return cache;
  };

  return {
    name,
    all: loadAll,
    find: async (predicate) => {
      const items = await loadAll();
      return items.find(predicate);
    },
    filter: async (predicate) => {
      const items = await loadAll();
      return items.filter(predicate);
    },
  };
}

// Export utilities
export const globUtils = {
  glob,
  importGlob,
  mapGlob,
  filterGlob,
  parseGlobPath,
  loadContent,
  sortContent,
  groupContent,
  autoRegister,
  loadRoutes,
  filePathToRoute,
  loadContentWithFrontmatter,
  filterByFrontmatter,
  sortByFrontmatter,
  loadPlugins,
  initializePlugins,
  createCollection,
};

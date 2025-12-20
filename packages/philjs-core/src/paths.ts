/**
 * @fileoverview Path utilities for PhilJS applications (SvelteKit-style)
 * Provides utilities for path resolution, route building, and URL manipulation
 */

/**
 * Configuration for path utilities
 */
export interface PathConfig {
  /** Base path of the application (e.g., '/app' for apps hosted at example.com/app) */
  base: string;
  /** CDN or asset path prefix (e.g., 'https://cdn.example.com/assets') */
  assets: string;
  /** Enable trailing slashes in URLs */
  trailingSlash: 'always' | 'never' | 'ignore';
}

/**
 * Global path configuration
 */
let pathConfig: PathConfig = {
  base: '',
  assets: '',
  trailingSlash: 'never',
};

/**
 * Configure path utilities
 */
export function configurePaths(config: Partial<PathConfig>): void {
  pathConfig = { ...pathConfig, ...config };
}

/**
 * Get the base path of the application
 */
export function base(): string {
  return pathConfig.base;
}

/**
 * Get the assets path
 */
export function assets(): string {
  return pathConfig.assets || pathConfig.base;
}

/**
 * Route parameter types
 */
export type RouteParams = Record<string, string | number | boolean>;

/**
 * Resolve a route path with the base path
 * @param path - The path to resolve
 * @returns The resolved path with base applied
 */
export function resolveRoute(path: string): string {
  // Handle absolute URLs
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Combine base and path
  const fullPath = pathConfig.base
    ? `${pathConfig.base}${normalizedPath}`
    : normalizedPath;

  // Apply trailing slash rules
  return applyTrailingSlash(fullPath);
}

/**
 * Build a URL path with parameters
 * @param pattern - Route pattern (e.g., '/users/:id')
 * @param params - Route parameters
 * @param query - Query parameters
 * @returns Built URL path
 */
export function buildPath(
  pattern: string,
  params?: RouteParams,
  query?: Record<string, string | number | boolean | string[]>
): string {
  let path = pattern;

  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, String(value));
      path = path.replace(`*${key}`, String(value)); // Wildcard params
    });
  }

  // Add query parameters
  if (query) {
    const queryString = buildQueryString(query);
    if (queryString) {
      path = `${path}?${queryString}`;
    }
  }

  return resolveRoute(path);
}

/**
 * Build query string from object
 */
function buildQueryString(
  query: Record<string, string | number | boolean | string[]>
): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  });

  return params.toString();
}

/**
 * Match a URL against a route pattern
 * @param pattern - Route pattern (e.g., '/users/:id')
 * @param url - URL to match
 * @returns Matched parameters or null
 */
export function matchPath(
  pattern: string,
  url: string
): Record<string, string> | null {
  // Remove base path from URL
  let normalizedUrl = url;
  if (pathConfig.base && url.startsWith(pathConfig.base)) {
    normalizedUrl = url.slice(pathConfig.base.length);
  }

  // Remove query string and hash
  normalizedUrl = normalizedUrl.split('?')[0].split('#')[0];

  // Remove trailing slash for matching
  const cleanPattern = pattern.replace(/\/$/, '');
  const cleanUrl = normalizedUrl.replace(/\/$/, '');

  // Convert pattern to regex
  const paramNames: string[] = [];
  const regexPattern = cleanPattern
    .replace(/\*/g, '.*') // Wildcard
    .replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

  const regex = new RegExp(`^${regexPattern}$`);
  const match = cleanUrl.match(regex);

  if (!match) {
    return null;
  }

  // Extract parameters
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });

  return params;
}

/**
 * Apply trailing slash rules
 */
function applyTrailingSlash(path: string): string {
  // Don't modify if it has a file extension
  if (/\.[^/]+$/.test(path)) {
    return path;
  }

  const hasTrailingSlash = path.endsWith('/');

  if (pathConfig.trailingSlash === 'always' && !hasTrailingSlash && path !== '/') {
    return `${path}/`;
  }

  if (pathConfig.trailingSlash === 'never' && hasTrailingSlash && path !== '/') {
    return path.slice(0, -1);
  }

  return path;
}

/**
 * Resolve an asset path
 * @param path - Asset path (e.g., '/images/logo.png')
 * @returns Full asset URL
 */
export function resolveAsset(path: string): string {
  // Handle absolute URLs
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const assetBase = pathConfig.assets || pathConfig.base;

  return assetBase ? `${assetBase}${normalizedPath}` : normalizedPath;
}

/**
 * Parse URL and extract parts
 */
export function parseUrl(url: string): {
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
} {
  const urlObj = new URL(url, 'http://dummy.com');

  const query: Record<string, string | string[]> = {};
  urlObj.searchParams.forEach((value, key) => {
    const existing = query[key];
    if (existing) {
      query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      query[key] = value;
    }
  });

  return {
    pathname: urlObj.pathname,
    search: urlObj.search,
    hash: urlObj.hash,
    params: {},
    query,
  };
}

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): string {
  return segments
    .map((segment, index) => {
      // Remove leading slash from all but first segment
      if (index > 0 && segment.startsWith('/')) {
        segment = segment.slice(1);
      }
      // Remove trailing slash from all but last segment
      if (index < segments.length - 1 && segment.endsWith('/')) {
        segment = segment.slice(0, -1);
      }
      return segment;
    })
    .filter(Boolean)
    .join('/');
}

/**
 * Normalize a path (remove .., ., etc.)
 */
export function normalizePath(path: string): string {
  const segments = path.split('/');
  const normalized: string[] = [];

  for (const segment of segments) {
    if (segment === '..') {
      normalized.pop();
    } else if (segment !== '.' && segment !== '') {
      normalized.push(segment);
    }
  }

  const result = normalized.join('/');
  return path.startsWith('/') ? `/${result}` : result;
}

/**
 * Check if a path is relative
 */
export function isRelativePath(path: string): boolean {
  return !path.startsWith('/') &&
         !path.startsWith('http://') &&
         !path.startsWith('https://') &&
         !path.startsWith('//');
}

/**
 * Make a path relative
 */
export function makeRelative(from: string, to: string): string {
  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);

  // Find common base
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  // Build relative path
  const upCount = fromParts.length - commonLength - 1;
  const upPath = '../'.repeat(upCount);
  const remainingPath = toParts.slice(commonLength).join('/');

  return upPath + remainingPath || './';
}

/**
 * Sanitize a path to prevent directory traversal
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\.\.+/g, '.')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '');
}

/**
 * Get file extension from path
 */
export function getExtension(path: string): string {
  const match = path.match(/\.([^./]+)$/);
  return match ? match[1] : '';
}

/**
 * Get filename from path
 */
export function getFilename(path: string, includeExtension = true): string {
  const parts = path.split('/');
  const filename = parts[parts.length - 1];

  if (!includeExtension) {
    return filename.replace(/\.[^.]+$/, '');
  }

  return filename;
}

/**
 * Get directory from path
 */
export function getDirectory(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

/**
 * Check if two paths match (ignoring trailing slashes, case-insensitive option)
 */
export function pathsMatch(
  path1: string,
  path2: string,
  options: { caseSensitive?: boolean } = {}
): boolean {
  const normalize = (p: string) => {
    p = p.replace(/\/$/, '');
    return options.caseSensitive ? p : p.toLowerCase();
  };

  return normalize(path1) === normalize(path2);
}

/**
 * Build breadcrumb trail from path
 */
export function buildBreadcrumbs(path: string): Array<{ name: string; path: string }> {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: 'Home', path: '/' }
  ];

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    breadcrumbs.push({
      name: part.charAt(0).toUpperCase() + part.slice(1),
      path: currentPath
    });
  }

  return breadcrumbs;
}

// Export default object for convenience
export const paths = {
  base,
  assets,
  resolveRoute,
  buildPath,
  matchPath,
  resolveAsset,
  parseUrl,
  joinPaths,
  normalizePath,
  isRelativePath,
  makeRelative,
  sanitizePath,
  getExtension,
  getFilename,
  getDirectory,
  pathsMatch,
  buildBreadcrumbs,
  configure: configurePaths,
};

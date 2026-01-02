/**
 * Type-Safe URL Builder
 *
 * Build URLs with type safety and validation:
 * - Parameter validation
 * - Query string building
 * - Path segment encoding
 * - URL pattern matching
 */

// =============================================================================
// Types
// =============================================================================

export type ParamValue = string | number | boolean | undefined;
export type QueryValue = string | number | boolean | string[] | number[] | undefined | null;

export interface RouteParams {
  [key: string]: ParamValue;
}

export interface QueryParams {
  [key: string]: QueryValue;
}

export interface URLBuilderOptions {
  base?: string;
  trailingSlash?: boolean;
  strict?: boolean;
  encode?: boolean;
}

export interface BuilderResult {
  path: string;
  fullUrl: string;
  params: RouteParams;
  query: QueryParams;
  hash: string;
}

// =============================================================================
// URL Builder Implementation
// =============================================================================

/**
 * Create a type-safe URL builder for a route pattern
 */
export function createURLBuilder<TParams extends RouteParams = RouteParams>(
  pattern: string,
  options: URLBuilderOptions = {}
): URLBuilder<TParams> {
  const { base = '', trailingSlash = false, strict = false, encode = true } = options;

  // Parse pattern to extract parameter names
  const paramNames = extractParamNames(pattern);

  return {
    build(params?: Partial<TParams>, query?: QueryParams, hash?: string): BuilderResult {
      let path = pattern;

      // Replace parameters in the path
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            const encodedValue = encode ? encodeURIComponent(String(value)) : String(value);
            path = path.replace(`:${key}`, encodedValue);
            path = path.replace(`[${key}]`, encodedValue);
          }
        }
      }

      // Check for missing required parameters
      if (strict) {
        const remainingParams = path.match(/[:[\]][a-zA-Z_]+/g);
        if (remainingParams) {
          throw new Error(`Missing required parameters: ${remainingParams.join(', ')}`);
        }
      }

      // Handle optional parameters
      path = path.replace(/\/[:[\]][a-zA-Z_]+\?/g, '');
      path = path.replace(/[:[\]][a-zA-Z_]+\?/g, '');

      // Normalize path
      path = normalizePath(path);

      // Handle trailing slash
      if (trailingSlash && !path.endsWith('/')) {
        path += '/';
      } else if (!trailingSlash && path.endsWith('/') && path !== '/') {
        path = path.slice(0, -1);
      }

      // Build query string
      let queryString = '';
      if (query && Object.keys(query).length > 0) {
        queryString = buildQueryString(query, encode);
      }

      // Build hash
      const hashString = hash ? `#${hash}` : '';

      // Construct full URL
      const fullUrl = `${base}${path}${queryString}${hashString}`;

      return {
        path,
        fullUrl,
        params: (params || {}) as RouteParams,
        query: query || {},
        hash: hash || '',
      };
    },

    pattern,
    paramNames,

    with(params: Partial<TParams>): URLBuilder<TParams> {
      return createURLBuilder(pattern, options).withParams(params);
    },

    withParams(params: Partial<TParams>): URLBuilder<TParams> {
      const boundParams = { ...params };
      const originalBuilder = this;

      return {
        ...originalBuilder,
        build(additionalParams?: Partial<TParams>, query?: QueryParams, hash?: string) {
          return originalBuilder.build(
            { ...boundParams, ...additionalParams } as Partial<TParams>,
            query,
            hash
          );
        },
      };
    },

    toString(params?: Partial<TParams>, query?: QueryParams, hash?: string): string {
      return this.build(params, query, hash).fullUrl;
    },
  };
}

export interface URLBuilder<TParams extends RouteParams = RouteParams> {
  build(params?: Partial<TParams>, query?: QueryParams, hash?: string): BuilderResult;
  pattern: string;
  paramNames: string[];
  with(params: Partial<TParams>): URLBuilder<TParams>;
  withParams(params: Partial<TParams>): URLBuilder<TParams>;
  toString(params?: Partial<TParams>, query?: QueryParams, hash?: string): string;
}

// =============================================================================
// Route Definition Helper
// =============================================================================

/**
 * Define routes with type-safe builders
 */
export function defineRoutes<T extends Record<string, string>>(
  routes: T,
  options?: URLBuilderOptions
): { [K in keyof T]: URLBuilder<ExtractParams<T[K]>> } {
  const result = {} as { [K in keyof T]: URLBuilder<ExtractParams<T[K]>> };

  for (const [name, pattern] of Object.entries(routes)) {
    (result as any)[name] = createURLBuilder(pattern, options);
  }

  return result;
}

// Extract parameter names from a route pattern
type ExtractParams<T extends string> = T extends `${infer _Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractParams<Rest>]: string }
  : T extends `${infer _Start}:${infer Param}`
  ? { [K in Param]: string }
  : T extends `${infer _Start}[${infer Param}]/${infer Rest}`
  ? { [K in Param | keyof ExtractParams<Rest>]: string }
  : T extends `${infer _Start}[${infer Param}]`
  ? { [K in Param]: string }
  : {};

// =============================================================================
// Query String Utilities
// =============================================================================

/**
 * Build a query string from parameters
 */
export function buildQueryString(params: QueryParams, encode = true): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    const encodedKey = encode ? encodeURIComponent(key) : key;
    if (Array.isArray(value)) {
      for (const item of value) {
        const encodedValue = encode ? encodeURIComponent(String(item)) : String(item);
        parts.push(`${encodedKey}=${encodedValue}`);
      }
    } else {
      const encodedValue = encode ? encodeURIComponent(String(value)) : String(value);
      parts.push(`${encodedKey}=${encodedValue}`);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/**
 * Parse a query string into parameters
 */
export function parseQueryString(queryString: string): QueryParams {
  if (!queryString || queryString === '?') return {};

  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const params: QueryParams = {};

  for (const part of query.split('&')) {
    if (!part) continue;
    const eqIndex = part.indexOf('=');
    const rawKey = eqIndex === -1 ? part : part.slice(0, eqIndex);
    const rawValue = eqIndex === -1 ? '' : part.slice(eqIndex + 1);
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue);

    if (!key) continue;

    if (Object.hasOwn(params, key)) {
      // Convert to array if multiple values
      const existing = params[key];
      if (Array.isArray(existing)) {
        (existing as string[]).push(value);
      } else {
        params[key] = [existing as string, value];
      }
    } else {
      params[key] = value;
    }
  }

  return params;
}

/**
 * Merge query parameters
 */
export function mergeQueryParams(...paramSets: QueryParams[]): QueryParams {
  const result: QueryParams = {};

  for (const params of paramSets) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (key in result) {
        const existing = result[key];
        if (Array.isArray(existing) && Array.isArray(value)) {
          result[key] = [...existing, ...value] as string[] | number[];
        } else if (Array.isArray(existing)) {
          result[key] = [...existing, value as string | number] as string[] | number[];
        } else if (Array.isArray(value)) {
          result[key] = [existing as string | number, ...value] as string[] | number[];
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

// =============================================================================
// Breadcrumb Generator
// =============================================================================

export interface Breadcrumb {
  label: string;
  path: string;
  isActive: boolean;
}

export interface BreadcrumbConfig {
  labels?: Record<string, string>;
  homeLabel?: string;
  homePath?: string;
  transform?: (segment: string) => string;
}

/**
 * Generate breadcrumbs from a path
 */
export function generateBreadcrumbs(
  path: string,
  config: BreadcrumbConfig = {}
): Breadcrumb[] {
  const {
    labels = {},
    homeLabel = 'Home',
    homePath = '/',
    transform = defaultTransform,
  } = config;

  const breadcrumbs: Breadcrumb[] = [];

  // Add home
  breadcrumbs.push({
    label: homeLabel,
    path: homePath,
    isActive: path === homePath,
  });

  // Split path into segments
  const segments = path.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    currentPath += '/' + segment;

    // Skip dynamic segments (params)
    if (segment.startsWith(':') || segment.startsWith('[')) {
      continue;
    }

    // Get label from config or transform segment
    const label = labels[currentPath] || labels[segment] || transform(segment);

    breadcrumbs.push({
      label,
      path: currentPath,
      isActive: i === segments.length - 1,
    });
  }

  return breadcrumbs;
}

function defaultTransform(segment: string): string {
  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// =============================================================================
// URL Utilities
// =============================================================================

/**
 * Extract parameter names from a route pattern
 */
export function extractParamNames(pattern: string): string[] {
  const names = new Set<string>();

  // Match :param and [param] patterns
  const matches = pattern.matchAll(/[:[\]]([a-zA-Z_][a-zA-Z0-9_]*)\??/g);

  for (const match of matches) {
    names.add(match[1]!);
  }

  return [...names];
}

/**
 * Normalize a path by removing duplicate slashes
 */
export function normalizePath(path: string): string {
  // Remove duplicate slashes
  let normalized = path.replace(/\/+/g, '/');

  // Ensure leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

/**
 * Join path segments
 */
export function joinPaths(...paths: string[]): string {
  const joined = paths
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

  return '/' + joined;
}

/**
 * Parse a URL into its components
 */
export function parseURL(url: string): {
  protocol: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
  params: RouteParams;
  query: QueryParams;
} {
  let protocol = '';
  let host = '';
  let pathname = url;
  let search = '';
  let hash = '';

  // Extract hash
  const hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.slice(hashIndex + 1);
    pathname = pathname.slice(0, hashIndex);
  }

  // Extract query string
  const queryIndex = pathname.indexOf('?');
  if (queryIndex !== -1) {
    search = pathname.slice(queryIndex);
    pathname = pathname.slice(0, queryIndex);
  }

  // Extract protocol and host
  const protocolMatch = pathname.match(/^([a-z]+):\/\/([^/]+)/i);
  if (protocolMatch) {
    protocol = protocolMatch[1]!;
    host = protocolMatch[2]!;
    pathname = pathname.slice(protocolMatch[0]!.length);
  }

  // Ensure leading slash
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname;
  }

  return {
    protocol,
    host,
    pathname,
    search,
    hash,
    params: {},
    query: parseQueryString(search),
  };
}

/**
 * Check if a URL matches a pattern
 */
export function matchPattern(
  url: string,
  pattern: string
): { match: boolean; params: RouteParams } {
  const urlParts = url.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (urlParts.length !== patternParts.length) {
    // Check for catch-all
    const lastPattern = patternParts[patternParts.length - 1];
    if (!lastPattern?.includes('*')) {
      return { match: false, params: {} };
    }
  }

  const params: RouteParams = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]!;
    const urlPart = urlParts[i];

    // Catch-all
    if (patternPart.includes('*')) {
      const paramName = patternPart.replace(/[:[\]*]/g, '');
      params[paramName] = urlParts.slice(i).join('/');
      return { match: true, params };
    }

    // Dynamic segment
    if (patternPart.startsWith(':') || patternPart.startsWith('[')) {
      const paramName = patternPart.replace(/[:[\]?]/g, '');
      const isOptional = patternPart.endsWith('?');

      if (urlPart) {
        params[paramName] = decodeURIComponent(urlPart);
      } else if (!isOptional) {
        return { match: false, params: {} };
      }
    } else if (patternPart !== urlPart) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

// =============================================================================
// Link Component Helpers
// =============================================================================

export interface LinkProps {
  to: string | BuilderResult;
  replace?: boolean;
  state?: unknown;
  preventScrollReset?: boolean;
}

/**
 * Resolve a link destination to a string path
 */
export function resolveLinkTo(to: string | BuilderResult): string {
  if (typeof to === 'string') {
    return to;
  }
  return to.fullUrl;
}

/**
 * Check if a path is active
 */
export function isActivePath(
  currentPath: string,
  targetPath: string,
  options: { exact?: boolean; caseSensitive?: boolean } = {}
): boolean {
  const { exact = false, caseSensitive = false } = options;

  let current = currentPath;
  let target = targetPath;

  if (!caseSensitive) {
    current = current.toLowerCase();
    target = target.toLowerCase();
  }

  // Remove trailing slashes for comparison
  current = current.replace(/\/$/, '') || '/';
  target = target.replace(/\/$/, '') || '/';

  if (exact) {
    return current === target;
  }

  return current === target || current.startsWith(target + '/');
}

// =============================================================================
// Route Serialization
// =============================================================================

/**
 * Serialize route state for navigation
 */
export function serializeRouteState(state: {
  params: RouteParams;
  query: QueryParams;
  hash?: string;
}): string {
  return JSON.stringify(state);
}

/**
 * Deserialize route state
 */
export function deserializeRouteState(serialized: string): {
  params: RouteParams;
  query: QueryParams;
  hash?: string;
} | null {
  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

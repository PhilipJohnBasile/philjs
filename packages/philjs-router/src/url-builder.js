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
// URL Builder Implementation
// =============================================================================
/**
 * Create a type-safe URL builder for a route pattern
 */
export function createURLBuilder(pattern, options = {}) {
    const { base = '', trailingSlash = false, strict = false, encode = true } = options;
    // Parse pattern to extract parameter names
    const paramNames = extractParamNames(pattern);
    return {
        build(params, query, hash) {
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
            }
            else if (!trailingSlash && path.endsWith('/') && path !== '/') {
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
                params: (params || {}),
                query: query || {},
                hash: hash || '',
            };
        },
        pattern,
        paramNames,
        with(params) {
            return createURLBuilder(pattern, options).withParams(params);
        },
        withParams(params) {
            const boundParams = { ...params };
            const originalBuilder = this;
            return {
                ...originalBuilder,
                build(additionalParams, query, hash) {
                    return originalBuilder.build({ ...boundParams, ...additionalParams }, query, hash);
                },
            };
        },
        toString(params, query, hash) {
            return this.build(params, query, hash).fullUrl;
        },
    };
}
// =============================================================================
// Route Definition Helper
// =============================================================================
/**
 * Define routes with type-safe builders
 */
export function defineRoutes(routes, options) {
    const result = {};
    for (const [name, pattern] of Object.entries(routes)) {
        result[name] = createURLBuilder(pattern, options);
    }
    return result;
}
// =============================================================================
// Query String Utilities
// =============================================================================
/**
 * Build a query string from parameters
 */
export function buildQueryString(params, encode = true) {
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null)
            continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                const encodedKey = encode ? encodeURIComponent(key) : key;
                const encodedValue = encode ? encodeURIComponent(String(item)) : String(item);
                parts.push(`${encodedKey}=${encodedValue}`);
            }
        }
        else {
            const encodedKey = encode ? encodeURIComponent(key) : key;
            const encodedValue = encode ? encodeURIComponent(String(value)) : String(value);
            parts.push(`${encodedKey}=${encodedValue}`);
        }
    }
    return parts.length > 0 ? `?${parts.join('&')}` : '';
}
/**
 * Parse a query string into parameters
 */
export function parseQueryString(queryString) {
    if (!queryString || queryString === '?')
        return {};
    const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
    const params = {};
    for (const part of query.split('&')) {
        const [key, value] = part.split('=').map(decodeURIComponent);
        if (!key)
            continue;
        if (key in params) {
            // Convert to array if multiple values
            const existing = params[key];
            if (Array.isArray(existing)) {
                existing.push(value);
            }
            else {
                params[key] = [existing, value];
            }
        }
        else {
            params[key] = value;
        }
    }
    return params;
}
/**
 * Merge query parameters
 */
export function mergeQueryParams(...paramSets) {
    const result = {};
    for (const params of paramSets) {
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null)
                continue;
            if (key in result) {
                const existing = result[key];
                if (Array.isArray(existing) && Array.isArray(value)) {
                    result[key] = [...existing, ...value];
                }
                else if (Array.isArray(existing)) {
                    result[key] = [...existing, value];
                }
                else if (Array.isArray(value)) {
                    result[key] = [existing, ...value];
                }
                else {
                    result[key] = value;
                }
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
/**
 * Generate breadcrumbs from a path
 */
export function generateBreadcrumbs(path, config = {}) {
    const { labels = {}, homeLabel = 'Home', homePath = '/', transform = defaultTransform, } = config;
    const breadcrumbs = [];
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
        const segment = segments[i];
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
function defaultTransform(segment) {
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
export function extractParamNames(pattern) {
    const names = [];
    // Match :param and [param] patterns
    const matches = pattern.matchAll(/[:[\]]([a-zA-Z_][a-zA-Z0-9_]*)\??/g);
    for (const match of matches) {
        names.push(match[1]);
    }
    return [...new Set(names)];
}
/**
 * Normalize a path by removing duplicate slashes
 */
export function normalizePath(path) {
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
export function joinPaths(...paths) {
    const joined = paths
        .map((p) => p.replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/');
    return '/' + joined;
}
/**
 * Parse a URL into its components
 */
export function parseURL(url) {
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
        protocol = protocolMatch[1];
        host = protocolMatch[2];
        pathname = pathname.slice(protocolMatch[0].length);
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
export function matchPattern(url, pattern) {
    const urlParts = url.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);
    if (urlParts.length !== patternParts.length) {
        // Check for catch-all
        const lastPattern = patternParts[patternParts.length - 1];
        if (!lastPattern?.includes('*')) {
            return { match: false, params: {} };
        }
    }
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
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
            }
            else if (!isOptional) {
                return { match: false, params: {} };
            }
        }
        else if (patternPart !== urlPart) {
            return { match: false, params: {} };
        }
    }
    return { match: true, params };
}
/**
 * Resolve a link destination to a string path
 */
export function resolveLinkTo(to) {
    if (typeof to === 'string') {
        return to;
    }
    return to.fullUrl;
}
/**
 * Check if a path is active
 */
export function isActivePath(currentPath, targetPath, options = {}) {
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
export function serializeRouteState(state) {
    return JSON.stringify(state);
}
/**
 * Deserialize route state
 */
export function deserializeRouteState(serialized) {
    try {
        return JSON.parse(serialized);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=url-builder.js.map
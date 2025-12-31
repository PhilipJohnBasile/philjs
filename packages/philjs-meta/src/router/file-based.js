/**
 * PhilJS Meta - File-Based Routing System
 *
 * Implements Next.js/SvelteKit-style file-based routing with support for:
 * - Dynamic routes [param].tsx
 * - Catch-all routes [...slug].tsx
 * - Optional catch-all routes [[...slug]].tsx
 * - Route groups (folder)
 * - Parallel routes @folder
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Default file extensions for routes
 */
const DEFAULT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
/**
 * Default ignore patterns
 */
const DEFAULT_IGNORE = [
    '**/_*.tsx', // Private files
    '**/components/**',
    '**/hooks/**',
    '**/utils/**',
    '**/lib/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/__tests__/**',
];
/**
 * Parse a file path segment into a route segment
 */
function parseSegment(segment) {
    // Optional catch-all: [[...slug]]
    const optionalCatchAllMatch = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
    if (optionalCatchAllMatch) {
        const result = {
            type: 'optional-catch-all',
            value: segment,
        };
        if (optionalCatchAllMatch[1] !== undefined) {
            result.paramName = optionalCatchAllMatch[1];
        }
        return result;
    }
    // Catch-all: [...slug]
    const catchAllMatch = segment.match(/^\[\.\.\.(\w+)\]$/);
    if (catchAllMatch) {
        const result = {
            type: 'catch-all',
            value: segment,
        };
        if (catchAllMatch[1] !== undefined) {
            result.paramName = catchAllMatch[1];
        }
        return result;
    }
    // Dynamic: [param]
    const dynamicMatch = segment.match(/^\[(\w+)\]$/);
    if (dynamicMatch) {
        const result = {
            type: 'dynamic',
            value: segment,
        };
        if (dynamicMatch[1] !== undefined) {
            result.paramName = dynamicMatch[1];
        }
        return result;
    }
    // Static segment
    return {
        type: 'static',
        value: segment,
    };
}
/**
 * Check if a directory is a route group (wrapped in parentheses)
 */
function isRouteGroup(segment) {
    return /^\(.+\)$/.test(segment);
}
/**
 * Check if a directory is a parallel route (prefixed with @)
 */
function isParallelRoute(segment) {
    return segment.startsWith('@');
}
/**
 * Convert file path to URL pattern
 */
function filePathToPattern(filePath, pagesDir, basePath = '') {
    // Get relative path from pages directory
    let relativePath = path.relative(pagesDir, filePath);
    // Remove file extension
    relativePath = relativePath.replace(/\.(tsx?|jsx?)$/, '');
    // Handle index files
    if (relativePath.endsWith('/index') || relativePath === 'index') {
        relativePath = relativePath.replace(/\/?index$/, '');
    }
    // Split into segments
    const segments = relativePath.split(path.sep).filter(Boolean);
    // Filter out route groups and parallel routes from URL
    const urlSegments = segments.filter(seg => !isRouteGroup(seg) && !isParallelRoute(seg));
    // Build URL pattern
    let pattern = '/' + urlSegments.join('/');
    // Add base path
    if (basePath) {
        pattern = basePath + pattern;
    }
    // Normalize slashes
    pattern = pattern.replace(/\/+/g, '/');
    if (pattern !== '/' && pattern.endsWith('/')) {
        pattern = pattern.slice(0, -1);
    }
    return pattern || '/';
}
/**
 * Generate regex pattern for route matching
 */
function patternToRegex(pattern) {
    let regexStr = pattern
        // Escape special regex chars except our patterns
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        // Optional catch-all: [[...slug]]
        .replace(/\\\[\\\[\\\.\\\.\\\.(\w+)\\\]\\\]/g, '(?:/(.*))?')
        // Catch-all: [...slug]
        .replace(/\\\[\\\.\\\.\\\.(\w+)\\\]/g, '(?:/(.+))?')
        // Dynamic: [param]
        .replace(/\\\[(\w+)\\\]/g, '/([^/]+)');
    // Ensure we match the full path
    return new RegExp(`^${regexStr}/?$`);
}
/**
 * Extract parameter names from a route pattern
 */
function extractParamNames(pattern) {
    const params = [];
    // Match [[...param]], [...param], and [param]
    const regex = /\[\[?\.{0,3}(\w+)\]?\]/g;
    let match;
    while ((match = regex.exec(pattern)) !== null) {
        params.push(match[1]);
    }
    return params;
}
/**
 * Find associated layout files for a route
 */
function findLayouts(filePath, pagesDir) {
    const layouts = [];
    let currentDir = path.dirname(filePath);
    while (currentDir.startsWith(pagesDir) || currentDir === pagesDir) {
        // Check for layout file
        for (const ext of DEFAULT_EXTENSIONS) {
            const layoutPath = path.join(currentDir, `_layout${ext}`);
            if (fs.existsSync(layoutPath)) {
                layouts.unshift(layoutPath);
                break;
            }
        }
        if (currentDir === pagesDir)
            break;
        currentDir = path.dirname(currentDir);
    }
    return layouts;
}
/**
 * Find associated loading component for a route
 */
function findLoading(filePath, pagesDir) {
    let currentDir = path.dirname(filePath);
    while (currentDir.startsWith(pagesDir) || currentDir === pagesDir) {
        for (const ext of DEFAULT_EXTENSIONS) {
            const loadingPath = path.join(currentDir, `_loading${ext}`);
            if (fs.existsSync(loadingPath)) {
                return loadingPath;
            }
        }
        if (currentDir === pagesDir)
            break;
        currentDir = path.dirname(currentDir);
    }
    return undefined;
}
/**
 * Find associated error boundary for a route
 */
function findError(filePath, pagesDir) {
    let currentDir = path.dirname(filePath);
    while (currentDir.startsWith(pagesDir) || currentDir === pagesDir) {
        for (const ext of DEFAULT_EXTENSIONS) {
            const errorPath = path.join(currentDir, `_error${ext}`);
            if (fs.existsSync(errorPath)) {
                return errorPath;
            }
        }
        if (currentDir === pagesDir)
            break;
        currentDir = path.dirname(currentDir);
    }
    return undefined;
}
/**
 * Recursively scan directory for route files
 */
function scanDirectory(dir, pagesDir, options, routes = []) {
    const extensions = options.extensions || DEFAULT_EXTENSIONS;
    if (!fs.existsSync(dir)) {
        return routes;
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip ignored directories
            if (entry.name.startsWith('_') && entry.name !== '_layout' && entry.name !== '_error' && entry.name !== '_loading') {
                continue;
            }
            // Skip node_modules and hidden directories
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                continue;
            }
            // Recurse into subdirectory
            scanDirectory(fullPath, pagesDir, options, routes);
        }
        else if (entry.isFile()) {
            // Check if file has valid extension
            const ext = path.extname(entry.name);
            if (!extensions.includes(ext)) {
                continue;
            }
            // Skip special files
            const baseName = path.basename(entry.name, ext);
            if (baseName.startsWith('_') || baseName.startsWith('.')) {
                continue;
            }
            // Skip test files
            if (baseName.includes('.test') || baseName.includes('.spec')) {
                continue;
            }
            // Create route definition
            const isApiRoute = fullPath.includes(path.join(pagesDir, 'api'));
            const pattern = filePathToPattern(fullPath, pagesDir, options.basePath);
            // Apply custom transformation if provided
            const finalPattern = options.transformRoute
                ? options.transformRoute(pattern)
                : pattern;
            // Parse segments
            const segments = finalPattern
                .split('/')
                .filter(Boolean)
                .map(parseSegment);
            const route = {
                pattern: finalPattern,
                regex: patternToRegex(finalPattern),
                filePath: fullPath,
                segments,
                paramNames: extractParamNames(finalPattern),
                layouts: isApiRoute ? [] : findLayouts(fullPath, pagesDir),
                isApiRoute,
                meta: {},
            };
            if (!isApiRoute) {
                const loadingPath = findLoading(fullPath, pagesDir);
                if (loadingPath !== undefined) {
                    route.loading = loadingPath;
                }
                const errorPath = findError(fullPath, pagesDir);
                if (errorPath !== undefined) {
                    route.error = errorPath;
                }
            }
            routes.push(route);
        }
    }
    return routes;
}
/**
 * Sort routes by specificity (most specific first)
 */
function sortRoutes(routes) {
    return routes.sort((a, b) => {
        // Count segment types for priority
        const getScore = (route) => {
            let score = 0;
            for (const segment of route.segments) {
                switch (segment.type) {
                    case 'static':
                        score += 1000;
                        break;
                    case 'dynamic':
                        score += 100;
                        break;
                    case 'catch-all':
                        score += 10;
                        break;
                    case 'optional-catch-all':
                        score += 1;
                        break;
                }
            }
            // Longer paths are more specific
            score += route.segments.length * 10000;
            return score;
        };
        return getScore(b) - getScore(a);
    });
}
/**
 * Generate route manifest from pages directory
 */
export function generateRouteManifest(options) {
    const pagesDir = path.resolve(options.pagesDir);
    if (!fs.existsSync(pagesDir)) {
        throw new Error(`Pages directory not found: ${pagesDir}`);
    }
    // Scan for routes
    const allRoutes = scanDirectory(pagesDir, pagesDir, options);
    // Separate page routes and API routes
    const routes = sortRoutes(allRoutes.filter(r => !r.isApiRoute));
    const apiRoutes = sortRoutes(allRoutes.filter(r => r.isApiRoute));
    // Find special files
    let rootLayout;
    let notFound;
    let globalError;
    for (const ext of options.extensions || DEFAULT_EXTENSIONS) {
        if (!rootLayout) {
            const layoutPath = path.join(pagesDir, `_layout${ext}`);
            if (fs.existsSync(layoutPath)) {
                rootLayout = layoutPath;
            }
        }
        if (!notFound) {
            const notFoundPath = path.join(pagesDir, `_404${ext}`);
            if (fs.existsSync(notFoundPath)) {
                notFound = notFoundPath;
            }
        }
        if (!globalError) {
            const errorPath = path.join(pagesDir, `_error${ext}`);
            if (fs.existsSync(errorPath)) {
                globalError = errorPath;
            }
        }
    }
    const manifest = {
        routes,
        apiRoutes,
        generatedAt: Date.now(),
        pagesDir,
    };
    if (rootLayout !== undefined) {
        manifest.rootLayout = rootLayout;
    }
    if (notFound !== undefined) {
        manifest.notFound = notFound;
    }
    if (globalError !== undefined) {
        manifest.globalError = globalError;
    }
    return manifest;
}
/**
 * Match a URL path against the route manifest
 */
export function matchRoute(pathname, manifest) {
    // Normalize pathname
    const normalizedPath = pathname === '' ? '/' : pathname;
    // Try to match against each route
    for (const route of manifest.routes) {
        const match = route.regex.exec(normalizedPath);
        if (match) {
            const params = {};
            // Extract parameters from match groups
            for (let i = 0; i < route.paramNames.length; i++) {
                const paramName = route.paramNames[i];
                const value = match[i + 1];
                if (value !== undefined) {
                    // Check if this is a catch-all parameter
                    const segment = route.segments.find(s => s.paramName === paramName);
                    if (segment && (segment.type === 'catch-all' || segment.type === 'optional-catch-all')) {
                        params[paramName] = value.split('/').filter(Boolean);
                    }
                    else {
                        params[paramName] = value;
                    }
                }
            }
            return { route, params };
        }
    }
    return null;
}
/**
 * Match an API route
 */
export function matchApiRoute(pathname, manifest) {
    const normalizedPath = pathname === '' ? '/' : pathname;
    for (const route of manifest.apiRoutes) {
        const match = route.regex.exec(normalizedPath);
        if (match) {
            const params = {};
            for (let i = 0; i < route.paramNames.length; i++) {
                const paramName = route.paramNames[i];
                const value = match[i + 1];
                if (value !== undefined) {
                    const segment = route.segments.find(s => s.paramName === paramName);
                    if (segment && (segment.type === 'catch-all' || segment.type === 'optional-catch-all')) {
                        params[paramName] = value.split('/').filter(Boolean);
                    }
                    else {
                        params[paramName] = value;
                    }
                }
            }
            return { route, params };
        }
    }
    return null;
}
/**
 * Create a file router instance
 */
export function createFileRouter(options) {
    let manifest = generateRouteManifest(options);
    return {
        /** Get the current route manifest */
        getManifest() {
            return manifest;
        },
        /** Regenerate the route manifest */
        regenerate() {
            manifest = generateRouteManifest(options);
            return manifest;
        },
        /** Match a URL to a route */
        match(pathname) {
            return matchRoute(pathname, manifest);
        },
        /** Match an API route */
        matchApi(pathname) {
            return matchApiRoute(pathname, manifest);
        },
        /** Get all routes */
        getRoutes() {
            return manifest.routes;
        },
        /** Get all API routes */
        getApiRoutes() {
            return manifest.apiRoutes;
        },
        /** Generate URL from route pattern and params */
        generateUrl(pattern, params = {}) {
            let url = pattern;
            for (const [key, value] of Object.entries(params)) {
                const arrayValue = Array.isArray(value) ? value.join('/') : value;
                url = url
                    .replace(`[[...${key}]]`, arrayValue ? `/${arrayValue}` : '')
                    .replace(`[...${key}]`, arrayValue)
                    .replace(`[${key}]`, arrayValue);
            }
            return url.replace(/\/+/g, '/');
        },
    };
}
//# sourceMappingURL=file-based.js.map
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
 * Configure path utilities
 */
export declare function configurePaths(config: Partial<PathConfig>): void;
/**
 * Get the base path of the application
 */
export declare function base(): string;
/**
 * Get the assets path
 */
export declare function assets(): string;
/**
 * Route parameter types
 */
export type RouteParams = Record<string, string | number | boolean>;
/**
 * Resolve a route path with the base path
 * @param path - The path to resolve
 * @returns The resolved path with base applied
 */
export declare function resolveRoute(path: string): string;
/**
 * Build a URL path with parameters
 * @param pattern - Route pattern (e.g., '/users/:id')
 * @param params - Route parameters
 * @param query - Query parameters
 * @returns Built URL path
 */
export declare function buildPath(pattern: string, params?: RouteParams, query?: Record<string, string | number | boolean | string[]>): string;
/**
 * Match a URL against a route pattern
 * @param pattern - Route pattern (e.g., '/users/:id')
 * @param url - URL to match
 * @returns Matched parameters or null
 */
export declare function matchPath(pattern: string, url: string): Record<string, string> | null;
/**
 * Resolve an asset path
 * @param path - Asset path (e.g., '/images/logo.png')
 * @returns Full asset URL
 */
export declare function resolveAsset(path: string): string;
/**
 * Parse URL and extract parts
 */
export declare function parseUrl(url: string): {
    pathname: string;
    search: string;
    hash: string;
    params: Record<string, string>;
    query: Record<string, string | string[]>;
};
/**
 * Join path segments
 */
export declare function joinPaths(...segments: string[]): string;
/**
 * Normalize a path (remove .., ., etc.)
 */
export declare function normalizePath(path: string): string;
/**
 * Check if a path is relative
 */
export declare function isRelativePath(path: string): boolean;
/**
 * Make a path relative
 */
export declare function makeRelative(from: string, to: string): string;
/**
 * Sanitize a path to prevent directory traversal
 */
export declare function sanitizePath(path: string): string;
/**
 * Get file extension from path
 */
export declare function getExtension(path: string): string;
/**
 * Get filename from path
 */
export declare function getFilename(path: string, includeExtension?: boolean): string;
/**
 * Get directory from path
 */
export declare function getDirectory(path: string): string;
/**
 * Check if two paths match (ignoring trailing slashes, case-insensitive option)
 */
export declare function pathsMatch(path1: string, path2: string, options?: {
    caseSensitive?: boolean;
}): boolean;
/**
 * Build breadcrumb trail from path
 */
export declare function buildBreadcrumbs(path: string): Array<{
    name: string;
    path: string;
}>;
export declare const paths: {
    base: typeof base;
    assets: typeof assets;
    resolveRoute: typeof resolveRoute;
    buildPath: typeof buildPath;
    matchPath: typeof matchPath;
    resolveAsset: typeof resolveAsset;
    parseUrl: typeof parseUrl;
    joinPaths: typeof joinPaths;
    normalizePath: typeof normalizePath;
    isRelativePath: typeof isRelativePath;
    makeRelative: typeof makeRelative;
    sanitizePath: typeof sanitizePath;
    getExtension: typeof getExtension;
    getFilename: typeof getFilename;
    getDirectory: typeof getDirectory;
    pathsMatch: typeof pathsMatch;
    buildBreadcrumbs: typeof buildBreadcrumbs;
    configure: typeof configurePaths;
};
//# sourceMappingURL=paths.d.ts.map
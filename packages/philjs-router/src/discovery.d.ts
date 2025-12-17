/**
 * File-based route discovery.
 * Scans a routes directory and generates route patterns.
 */
export type RoutePattern = {
    /** File path pattern (e.g., "/products/[id]") */
    pattern: string;
    /** Regex for matching URLs */
    regex: RegExp;
    /** Parameter names in order */
    params: string[];
    /** File path relative to routes dir */
    filePath: string;
    /** Priority for matching (more specific = higher) */
    priority: number;
};
/**
 * Discover routes from a directory.
 * @param routesDir - Absolute path to routes directory
 * @returns Array of route patterns sorted by priority
 */
export declare function discoverRoutes(routesDir: string): RoutePattern[];
/**
 * Match a URL against route patterns.
 * @param url - URL pathname to match
 * @param routes - Available route patterns
 * @returns Matched route with extracted params, or null
 */
export declare function matchRoute(url: string, routes: RoutePattern[]): {
    route: RoutePattern;
    params: Record<string, string>;
} | null;
//# sourceMappingURL=discovery.d.ts.map
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
/**
 * Route segment types
 */
export type RouteSegmentType = 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all';
/**
 * Route segment definition
 */
export interface RouteSegment {
    type: RouteSegmentType;
    value: string;
    paramName?: string;
}
/**
 * Route definition in the manifest
 */
export interface RouteDefinition {
    /** The URL pattern (e.g., /users/[id]) */
    pattern: string;
    /** Regex pattern for matching URLs */
    regex: RegExp;
    /** Path to the page component file */
    filePath: string;
    /** Route segments parsed from the pattern */
    segments: RouteSegment[];
    /** Parameter names extracted from dynamic segments */
    paramNames: string[];
    /** Associated layout files (from root to current) */
    layouts: string[];
    /** Associated loading component */
    loading?: string;
    /** Associated error boundary component */
    error?: string;
    /** Whether this is an API route */
    isApiRoute: boolean;
    /** Route metadata */
    meta: RouteMetadata;
}
/**
 * Route metadata for SSR/SSG configuration
 */
export interface RouteMetadata {
    /** Enable/disable SSR for this route */
    ssr?: boolean;
    /** Enable static generation */
    ssg?: boolean;
    /** Revalidation interval in seconds (ISR) */
    revalidate?: number | false;
    /** Dynamic params for static generation */
    dynamicParams?: boolean;
    /** Force dynamic rendering */
    dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static';
    /** Custom headers */
    headers?: Record<string, string>;
}
/**
 * Route manifest containing all routes
 */
export interface RouteManifest {
    /** All page routes */
    routes: RouteDefinition[];
    /** API routes */
    apiRoutes: RouteDefinition[];
    /** Root layout path */
    rootLayout?: string;
    /** Not found page path */
    notFound?: string;
    /** Global error boundary path */
    globalError?: string;
    /** Generation timestamp */
    generatedAt: number;
    /** Source directory */
    pagesDir: string;
}
/**
 * File-based router options
 */
export interface FileRouterOptions {
    /** Directory containing page files */
    pagesDir: string;
    /** File extensions to scan */
    extensions?: string[];
    /** Ignore patterns */
    ignore?: string[];
    /** Base path for all routes */
    basePath?: string;
    /** Custom route transformation */
    transformRoute?: (route: string) => string;
}
/**
 * Generate route manifest from pages directory
 */
export declare function generateRouteManifest(options: FileRouterOptions): RouteManifest;
/**
 * Match a URL path against the route manifest
 */
export declare function matchRoute(pathname: string, manifest: RouteManifest): {
    route: RouteDefinition;
    params: Record<string, string | string[]>;
} | null;
/**
 * Match an API route
 */
export declare function matchApiRoute(pathname: string, manifest: RouteManifest): {
    route: RouteDefinition;
    params: Record<string, string | string[]>;
} | null;
/**
 * Create a file router instance
 */
export declare function createFileRouter(options: FileRouterOptions): {
    /** Get the current route manifest */
    getManifest(): RouteManifest;
    /** Regenerate the route manifest */
    regenerate(): RouteManifest;
    /** Match a URL to a route */
    match(pathname: string): {
        route: RouteDefinition;
        params: Record<string, string | string[]>;
    } | null;
    /** Match an API route */
    matchApi(pathname: string): {
        route: RouteDefinition;
        params: Record<string, string | string[]>;
    } | null;
    /** Get all routes */
    getRoutes(): RouteDefinition[];
    /** Get all API routes */
    getApiRoutes(): RouteDefinition[];
    /** Generate URL from route pattern and params */
    generateUrl(pattern: string, params?: Record<string, string | string[]>): string;
};
export type FileRouter = ReturnType<typeof createFileRouter>;
//# sourceMappingURL=file-based.d.ts.map
/**
 * Type-Safe URL Builder
 *
 * Build URLs with type safety and validation:
 * - Parameter validation
 * - Query string building
 * - Path segment encoding
 * - URL pattern matching
 */
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
/**
 * Create a type-safe URL builder for a route pattern
 */
export declare function createURLBuilder<TParams extends RouteParams = RouteParams>(pattern: string, options?: URLBuilderOptions): URLBuilder<TParams>;
export interface URLBuilder<TParams extends RouteParams = RouteParams> {
    build(params?: Partial<TParams>, query?: QueryParams, hash?: string): BuilderResult;
    pattern: string;
    paramNames: string[];
    with(params: Partial<TParams>): URLBuilder<TParams>;
    withParams(params: Partial<TParams>): URLBuilder<TParams>;
    toString(params?: Partial<TParams>, query?: QueryParams, hash?: string): string;
}
/**
 * Define routes with type-safe builders
 */
export declare function defineRoutes<T extends Record<string, string>>(routes: T, options?: URLBuilderOptions): {
    [K in keyof T]: URLBuilder<ExtractParams<T[K]>>;
};
type ExtractParams<T extends string> = T extends `${infer _Start}:${infer Param}/${infer Rest}` ? {
    [K in Param | keyof ExtractParams<Rest>]: string;
} : T extends `${infer _Start}:${infer Param}` ? {
    [K in Param]: string;
} : T extends `${infer _Start}[${infer Param}]/${infer Rest}` ? {
    [K in Param | keyof ExtractParams<Rest>]: string;
} : T extends `${infer _Start}[${infer Param}]` ? {
    [K in Param]: string;
} : {};
/**
 * Build a query string from parameters
 */
export declare function buildQueryString(params: QueryParams, encode?: boolean): string;
/**
 * Parse a query string into parameters
 */
export declare function parseQueryString(queryString: string): QueryParams;
/**
 * Merge query parameters
 */
export declare function mergeQueryParams(...paramSets: QueryParams[]): QueryParams;
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
export declare function generateBreadcrumbs(path: string, config?: BreadcrumbConfig): Breadcrumb[];
/**
 * Extract parameter names from a route pattern
 */
export declare function extractParamNames(pattern: string): string[];
/**
 * Normalize a path by removing duplicate slashes
 */
export declare function normalizePath(path: string): string;
/**
 * Join path segments
 */
export declare function joinPaths(...paths: string[]): string;
/**
 * Parse a URL into its components
 */
export declare function parseURL(url: string): {
    protocol: string;
    host: string;
    pathname: string;
    search: string;
    hash: string;
    params: RouteParams;
    query: QueryParams;
};
/**
 * Check if a URL matches a pattern
 */
export declare function matchPattern(url: string, pattern: string): {
    match: boolean;
    params: RouteParams;
};
export interface LinkProps {
    to: string | BuilderResult;
    replace?: boolean;
    state?: unknown;
    preventScrollReset?: boolean;
}
/**
 * Resolve a link destination to a string path
 */
export declare function resolveLinkTo(to: string | BuilderResult): string;
/**
 * Check if a path is active
 */
export declare function isActivePath(currentPath: string, targetPath: string, options?: {
    exact?: boolean;
    caseSensitive?: boolean;
}): boolean;
/**
 * Serialize route state for navigation
 */
export declare function serializeRouteState(state: {
    params: RouteParams;
    query: QueryParams;
    hash?: string;
}): string;
/**
 * Deserialize route state
 */
export declare function deserializeRouteState(serialized: string): {
    params: RouteParams;
    query: QueryParams;
    hash?: string;
} | null;
export {};
//# sourceMappingURL=url-builder.d.ts.map
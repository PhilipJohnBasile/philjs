/**
 * @fileoverview Glob utilities for PhilJS applications (Astro-style)
 * Provides type-safe glob imports and content loading
 */
declare global {
    interface ImportMeta {
        glob?: <T = unknown>(pattern: string | string[], options?: {
            eager?: boolean;
            as?: string;
        }) => Record<string, T | (() => Promise<T>)>;
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
export type GlobResult<T = any, Eager extends boolean = false> = Eager extends true ? GlobEager<T> : GlobLazy<T>;
/**
 * Wrapper around import.meta.glob() with better typing
 * @param pattern - Glob pattern(s) to match
 * @param options - Glob options
 * @returns Object mapping file paths to imports
 */
export declare function glob<T = any>(pattern: string | string[], options?: GlobOptions & {
    eager: true;
}): GlobEager<T>;
export declare function glob<T = any>(pattern: string | string[], options?: GlobOptions & {
    eager?: false;
}): GlobLazy<T>;
/**
 * Import all files matching a glob pattern eagerly
 */
export declare function importGlob<T = any>(pattern: string | string[], options?: GlobOptions): Promise<GlobEager<T>>;
/**
 * Map glob results with a transform function
 */
export declare function mapGlob<T = any, R = any>(globResult: GlobResult<T, any>, mapper: (value: T, path: string) => R): GlobResult<R, any>;
/**
 * Filter glob results
 */
export declare function filterGlob<T = any>(globResult: GlobResult<T, any>, predicate: (value: T, path: string) => boolean): GlobResult<T, any>;
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
export declare function parseGlobPath(path: string): GlobPathInfo;
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
export declare function loadContent<T = any>(pattern: string | string[], options?: GlobOptions): Promise<ContentItem<T>[]>;
/**
 * Sort content items
 */
export declare function sortContent<T = any>(items: ContentItem<T>[], compareFn: (a: ContentItem<T>, b: ContentItem<T>) => number): ContentItem<T>[];
/**
 * Group content items by a key
 */
export declare function groupContent<T = any, K extends string = string>(items: ContentItem<T>[], keyFn: (item: ContentItem<T>) => K): Record<K, ContentItem<T>[]>;
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
export declare function autoRegister<T = any>(options: AutoRegisterOptions<T>): Promise<Record<string, any>>;
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
export declare function loadRoutes(pattern?: string | string[]): Promise<Record<string, RouteModule>>;
/**
 * Convert file path to route path
 */
export declare function filePathToRoute(filePath: string): string;
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
export declare function loadContentWithFrontmatter<F = any, C = any>(pattern: string | string[]): Promise<ContentWithFrontmatter<F, C>[]>;
/**
 * Filter content by frontmatter
 */
export declare function filterByFrontmatter<F = any, C = any>(items: ContentWithFrontmatter<F, C>[], predicate: (frontmatter: F) => boolean): ContentWithFrontmatter<F, C>[];
/**
 * Sort content by frontmatter field
 */
export declare function sortByFrontmatter<F = any, C = any>(items: ContentWithFrontmatter<F, C>[], field: keyof F, order?: 'asc' | 'desc'): ContentWithFrontmatter<F, C>[];
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
export declare function loadPlugins<T = any>(pattern?: string | string[]): Promise<Plugin<T>[]>;
/**
 * Initialize plugins
 */
export declare function initializePlugins<T = any>(plugins: Plugin<T>[], context: T): Promise<void>;
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
export declare function createCollection<T = any>(name: string, pattern: string | string[]): ContentCollection<T>;
export declare const globUtils: {
    glob: typeof glob;
    importGlob: typeof importGlob;
    mapGlob: typeof mapGlob;
    filterGlob: typeof filterGlob;
    parseGlobPath: typeof parseGlobPath;
    loadContent: typeof loadContent;
    sortContent: typeof sortContent;
    groupContent: typeof groupContent;
    autoRegister: typeof autoRegister;
    loadRoutes: typeof loadRoutes;
    filePathToRoute: typeof filePathToRoute;
    loadContentWithFrontmatter: typeof loadContentWithFrontmatter;
    filterByFrontmatter: typeof filterByFrontmatter;
    sortByFrontmatter: typeof sortByFrontmatter;
    loadPlugins: typeof loadPlugins;
    initializePlugins: typeof initializePlugins;
    createCollection: typeof createCollection;
};
//# sourceMappingURL=glob.d.ts.map
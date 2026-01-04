/**
 * PhilJS Adapters - Build Utilities
 *
 * Provides utilities for building and deploying PhilJS applications:
 * - Output directory structure management
 * - Asset optimization
 * - Manifest generation
 * - Static file handling
 *
 * @module philjs-adapters/utils/build
 */
/**
 * MIME types for static file serving
 */
export declare const MIME_TYPES: Record<string, string>;
/**
 * Build manifest interface
 */
export interface BuildManifest {
    /** Adapter name */
    adapter: string;
    /** Build timestamp */
    timestamp: string;
    /** Build version */
    version: string;
    /** Output directory */
    outputDir: string;
    /** Routes */
    routes: RouteManifestEntry[];
    /** Static assets */
    assets: AssetManifestEntry[];
    /** Prerendered pages */
    prerendered: string[];
    /** Environment */
    environment: 'development' | 'production';
    /** Build metadata */
    metadata: Record<string, unknown>;
}
/**
 * Route manifest entry
 */
export interface RouteManifestEntry {
    /** Route pattern */
    pattern: string;
    /** Handler file */
    handler: string;
    /** HTTP methods */
    methods: string[];
    /** Is prerendered */
    prerender: boolean;
    /** Route parameters */
    params: string[];
}
/**
 * Asset manifest entry
 */
export interface AssetManifestEntry {
    /** Original path */
    src: string;
    /** Output path */
    dest: string;
    /** Content hash */
    hash: string;
    /** File size in bytes */
    size: number;
    /** MIME type */
    type: string;
    /** Is immutable (can be cached forever) */
    immutable: boolean;
}
/**
 * Build manifest options
 */
export interface BuildManifestOptions {
    /** Adapter name */
    adapter: string;
    /** Output directory */
    outputDir: string;
    /** Routes */
    routes: RouteManifestEntry[];
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Create a build manifest
 *
 * @example
 * ```typescript
 * const manifest = await createBuildManifest({
 *   adapter: 'vercel',
 *   outputDir: '.vercel/output',
 *   routes: [...],
 * });
 * ```
 */
export declare function createBuildManifest(options: BuildManifestOptions): Promise<BuildManifest>;
/**
 * Copy static assets to output directory
 *
 * @example
 * ```typescript
 * await copyStaticAssets('public', '.vercel/output/static');
 * ```
 */
export declare function copyStaticAssets(source: string, destination: string, options?: {
    /** Patterns to exclude */
    exclude?: string[];
    /** Transform file content */
    transform?: (content: Buffer, path: string) => Buffer;
}): Promise<void>;
/**
 * Asset optimization options
 */
export interface OptimizeAssetsOptions {
    /** Minify HTML */
    minifyHtml?: boolean;
    /** Minify CSS */
    minifyCss?: boolean;
    /** Minify JavaScript */
    minifyJs?: boolean;
    /** Compress images */
    compressImages?: boolean;
    /** Generate hashed filenames */
    hashFilenames?: boolean;
    /** Inline small assets */
    inlineAssets?: boolean;
    /** Asset size threshold for inlining (bytes) */
    inlineThreshold?: number;
    /** Generate source maps */
    sourceMaps?: boolean;
}
/**
 * Optimize assets in a directory
 *
 * @example
 * ```typescript
 * await optimizeAssets('.vercel/output/static', {
 *   minifyHtml: true,
 *   minifyCss: true,
 *   compressImages: true,
 * });
 * ```
 */
export declare function optimizeAssets(dir: string, options?: OptimizeAssetsOptions): Promise<{
    optimized: number;
    savedBytes: number;
}>;
/**
 * Generate hashed filename for cache busting
 */
export declare function generateHashedFilename(filename: string, content: Buffer | string): string;
/**
 * Create output directory structure
 */
export declare function createOutputStructure(baseDir: string, structure?: {
    functions?: boolean;
    static?: boolean;
    prerendered?: boolean;
    edge?: boolean;
}): void;
/**
 * Get file hash for cache busting
 */
export declare function getFileHash(filePath: string): string;
/**
 * Check if a file should be cached immutably
 */
export declare function isImmutableAsset(filePath: string): boolean;
/**
 * Generate cache control header for an asset
 */
export declare function getCacheControl(filePath: string, options?: {
    development?: boolean;
    maxAge?: number;
}): string;
declare const _default: {
    MIME_TYPES: Record<string, string>;
    createBuildManifest: typeof createBuildManifest;
    copyStaticAssets: typeof copyStaticAssets;
    optimizeAssets: typeof optimizeAssets;
    generateHashedFilename: typeof generateHashedFilename;
    createOutputStructure: typeof createOutputStructure;
    getFileHash: typeof getFileHash;
    isImmutableAsset: typeof isImmutableAsset;
    getCacheControl: typeof getCacheControl;
};
export default _default;
//# sourceMappingURL=build.d.ts.map
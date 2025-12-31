/**
 * PPR Build-Time Prerendering
 *
 * Handles the generation of static shells at build time, including:
 * - Parallel route processing
 * - Manifest generation
 * - Asset extraction and optimization
 * - Cache warming
 */
import type { VNode } from "philjs-core";
import type { PPRBuildConfig, PPRBuildResult, PPRManifest, PPRRouteEntry, StaticShell, PPRCache } from "./ppr-types.js";
export declare const PPR_VERSION = "1.0.0";
/**
 * Builder for PPR static shells
 */
export declare class PPRBuilder {
    private config;
    private shells;
    private errors;
    private startTime;
    constructor(config: PPRBuildConfig);
    /**
     * Build all PPR routes
     */
    build(): Promise<PPRBuildResult>;
    /**
     * Expand dynamic routes (e.g., /blog/[slug]) to concrete paths
     */
    private expandDynamicRoutes;
    /**
     * Process routes with controlled concurrency
     */
    private processRoutesConcurrently;
    /**
     * Process a single route
     */
    private processRoute;
    /**
     * Render a component to VNode
     */
    private renderComponent;
    /**
     * Extract params from path
     */
    private extractParams;
    /**
     * Generate build manifest
     */
    private generateManifest;
    /**
     * Get output file path for a shell
     */
    private getShellFilePath;
    /**
     * Write output files to disk
     */
    private writeOutput;
}
/**
 * Simple in-memory cache for development
 */
export declare class MemoryPPRCache implements PPRCache {
    private cache;
    private hits;
    private misses;
    get(path: string): Promise<StaticShell | null>;
    set(path: string, shell: StaticShell): Promise<void>;
    has(path: string): Promise<boolean>;
    invalidate(path: string): Promise<void>;
    invalidateAll(): Promise<void>;
    stats(): Promise<{
        size: number;
        bytes: number;
        hitRatio: number;
        lastCleared?: number;
    }>;
}
/**
 * File-system based cache for production
 */
export declare class FileSystemPPRCache implements PPRCache {
    private cacheDir;
    private hits;
    private misses;
    constructor(cacheDir: string);
    private getFilePath;
    get(path: string): Promise<StaticShell | null>;
    set(path: string, shell: StaticShell): Promise<void>;
    has(path: string): Promise<boolean>;
    invalidate(path: string): Promise<void>;
    invalidateAll(): Promise<void>;
    stats(): Promise<{
        size: number;
        bytes: number;
        hitRatio: number;
        lastCleared?: number;
    }>;
}
/**
 * Build PPR static shells for all routes
 */
export declare function buildPPR(config: PPRBuildConfig): Promise<PPRBuildResult>;
/**
 * Build a single PPR route
 */
export declare function buildPPRRoute(entry: PPRRouteEntry, outDir: string, cache?: PPRCache): Promise<StaticShell | null>;
/**
 * Load PPR manifest from build output
 */
export declare function loadPPRManifest(outDir: string): Promise<PPRManifest | null>;
/**
 * Load a static shell from build output
 */
export declare function loadStaticShell(outDir: string, path: string): Promise<StaticShell | null>;
/**
 * Vite plugin for PPR build integration
 */
export declare function pprVitePlugin(config?: Partial<PPRBuildConfig>): {
    name: string;
    buildStart(): Promise<void>;
    generateBundle(): Promise<void>;
    writeBundle(options: {
        dir?: string;
    }): Promise<void>;
};
/**
 * Create a PPR dev server with hot reload
 */
export declare function createPPRDevServer(config: {
    routes: PPRRouteEntry[];
    renderFn: (path: string) => Promise<VNode>;
}): {
    /**
     * Get or generate a shell for a path
     */
    getShell(path: string): Promise<StaticShell | null>;
    /**
     * Invalidate a cached shell
     */
    invalidate(path: string): Promise<void>;
    /**
     * Invalidate all cached shells
     */
    invalidateAll(): Promise<void>;
    /**
     * Get cache stats
     */
    stats(): Promise<{
        size: number;
        bytes: number;
        hitRatio: number;
        lastCleared?: number;
    }>;
};
export type { PPRBuildConfig, PPRBuildResult, PPRBuildError, PPRManifest, PPRRouteEntry, } from "./ppr-types.js";
//# sourceMappingURL=ppr-build.d.ts.map
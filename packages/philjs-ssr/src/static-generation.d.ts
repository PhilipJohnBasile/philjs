/**
 * Static Site Generation (SSG) and Incremental Static Regeneration (ISR)
 *
 * Provides:
 * - SSG: Pre-render pages at build time
 * - ISR: Regenerate pages on-demand with revalidation
 * - Mixed rendering: Different modes per route
 */
import type { RouteModule } from "philjs-router";
export type RenderMode = "ssr" | "ssg" | "isr" | "csr";
export type RouteConfig = {
    mode?: RenderMode;
    revalidate?: number;
    fallback?: "blocking" | "static" | false;
    getStaticPaths?: () => Promise<string[]> | string[];
};
export type StaticPage = {
    path: string;
    html: string;
    data?: any;
    timestamp: number;
    revalidate?: number;
};
export type ISRCache = {
    get(path: string): StaticPage | null;
    set(path: string, page: StaticPage): Promise<void>;
    has(path: string): boolean;
    invalidate(path: string): Promise<void>;
    invalidateAll(): Promise<void>;
};
export declare class RedisISRCache implements ISRCache {
    private redisClient;
    private keyPrefix;
    constructor(redisClient: any, keyPrefix?: string);
    get(path: string): StaticPage | null;
    set(path: string, page: StaticPage): Promise<void>;
    has(path: string): boolean;
    invalidate(path: string): Promise<void>;
    invalidateAll(): Promise<void>;
}
export declare class StaticGenerator {
    private cache;
    private renderFn;
    constructor(renderFn: (path: string) => Promise<string>, cache?: ISRCache);
    /**
     * Generate static pages for all routes
     */
    generateAll(routes: Map<string, RouteModule & {
        config?: RouteConfig;
    }>): Promise<Map<string, StaticPage>>;
    /**
     * Generate a single static page
     */
    generatePage(path: string, config?: RouteConfig): Promise<StaticPage>;
    /**
     * Handle ISR request
     */
    handleISR(path: string, config: RouteConfig): Promise<{
        html: string;
        stale: boolean;
    }>;
    private regenerateInBackground;
    private getStaticFallback;
    /**
     * Invalidate cached page
     */
    invalidate(path: string): Promise<void>;
    /**
     * Invalidate all cached pages
     */
    invalidateAll(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        type: string;
        size: number;
    } | {
        type: string;
        size?: undefined;
    };
}
export type BuildConfig = {
    outDir: string;
    routes: Map<string, RouteModule & {
        config?: RouteConfig;
    }>;
    renderFn: (path: string) => Promise<string>;
};
/**
 * Generate static files at build time
 */
export declare function buildStaticSite(config: BuildConfig): Promise<void>;
export declare function configureRoute(config: RouteConfig): RouteConfig;
export declare function ssg(config?: Omit<RouteConfig, "mode">): RouteConfig;
export declare function isr(revalidate: number, config?: Omit<RouteConfig, "mode" | "revalidate">): RouteConfig;
export declare function ssr(): RouteConfig;
export declare function csr(): RouteConfig;
export type RevalidationOptions = {
    secret?: string;
    paths?: string[];
    tags?: string[];
};
/**
 * Handle on-demand revalidation request
 */
export declare function handleRevalidation(request: Request, generator: StaticGenerator, options?: RevalidationOptions): Promise<Response>;
export declare function createRenderingMiddleware(routes: Map<string, RouteModule & {
    config?: RouteConfig;
}>, generator: StaticGenerator): (request: Request) => Promise<Response | null>;
//# sourceMappingURL=static-generation.d.ts.map
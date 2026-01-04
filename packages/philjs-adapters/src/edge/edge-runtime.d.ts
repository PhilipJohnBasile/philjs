/**
 * PhilJS Edge Runtime - Universal Edge Runtime Abstraction
 *
 * Provides a unified interface for edge runtimes across:
 * - Cloudflare Workers
 * - Deno Deploy
 * - Vercel Edge
 * - Netlify Edge
 */
export type EdgePlatform = 'cloudflare' | 'deno' | 'vercel' | 'netlify' | 'unknown';
export interface EdgeContext {
    /** The edge platform detected */
    platform: EdgePlatform;
    /** Request object */
    request: Request;
    /** Platform-specific environment bindings */
    env: EdgeEnv;
    /** Execution context for background tasks */
    executionContext: EdgeExecutionContext;
    /** Region information */
    region?: EdgeRegion;
    /** Timing information for cold start tracking */
    timing: EdgeTiming;
}
export interface EdgeEnv {
    /** Get an environment variable */
    get(key: string): string | undefined;
    /** Get all environment variables */
    getAll(): Record<string, string>;
    /** Get a KV namespace binding (Cloudflare/Deno) */
    getKV?(namespace: string): EdgeKVNamespace | undefined;
    /** Platform-specific raw environment */
    raw: unknown;
}
export interface EdgeExecutionContext {
    /** Wait for a promise without blocking the response */
    waitUntil(promise: Promise<unknown>): void;
    /** Pass through on exception (Cloudflare Pages) */
    passThroughOnException?(): void;
}
export interface EdgeRegion {
    /** Region code (e.g., 'iad1', 'sfo1') */
    code: string;
    /** Region name */
    name: string;
    /** Continent code */
    continent?: string;
    /** Country code */
    country?: string;
    /** City */
    city?: string;
    /** Latitude */
    latitude?: number;
    /** Longitude */
    longitude?: number;
}
export interface EdgeTiming {
    /** Timestamp when the request started */
    requestStart: number;
    /** Whether this is a cold start */
    isColdStart: boolean;
    /** Cold start duration in ms (if applicable) */
    coldStartDuration?: number;
}
export interface EdgeKVNamespace {
    get(key: string, options?: {
        type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
    }): Promise<unknown>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: EdgeKVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: EdgeKVListOptions): Promise<EdgeKVListResult>;
}
export interface EdgeKVPutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: Record<string, unknown>;
}
export interface EdgeKVListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
export interface EdgeKVListResult {
    keys: Array<{
        name: string;
        expiration?: number;
        metadata?: unknown;
    }>;
    list_complete: boolean;
    cursor?: string;
}
export interface EdgeRuntimeConfig {
    /** Enable cold start optimizations */
    coldStartOptimization?: boolean;
    /** Enable request coalescing */
    requestCoalescing?: boolean;
    /** Regions to deploy to */
    regions?: string[];
    /** Custom environment variable prefix */
    envPrefix?: string;
}
/**
 * Reset cold start tracking (useful for testing)
 */
export declare function resetColdStartTracking(): void;
/**
 * Check if current request is a cold start
 */
export declare function isColdStart(): boolean;
/**
 * Mark that the first request has been processed
 */
export declare function markWarm(): void;
/**
 * Get cold start duration if this is a cold start
 */
export declare function getColdStartDuration(): number | undefined;
/**
 * Detect the current edge platform
 */
export declare function detectEdgePlatform(): EdgePlatform;
/**
 * Get platform-specific information
 */
export declare function getPlatformInfo(): {
    platform: EdgePlatform;
    version: string;
    features: string[];
};
/**
 * Create a unified environment interface
 */
export declare function createEdgeEnv(platformEnv: unknown): EdgeEnv;
/**
 * Create a unified execution context
 */
export declare function createExecutionContext(platformContext: unknown): EdgeExecutionContext;
/**
 * Get region information from request headers or context
 */
export declare function getRegion(request: Request, platformContext?: unknown): EdgeRegion | undefined;
/**
 * Coalesce identical requests within a time window
 */
export declare function coalesceRequest(request: Request, handler: () => Promise<Response>): Promise<Response>;
export interface EdgeHandlerOptions {
    /** Enable request coalescing */
    coalescing?: boolean;
    /** Handler function */
    handler: (context: EdgeContext) => Promise<Response>;
    /** Error handler */
    onError?: (error: Error, context: EdgeContext) => Response | Promise<Response>;
    /** Before request hook */
    beforeRequest?: (context: EdgeContext) => void | Promise<void>;
    /** After response hook */
    afterResponse?: (response: Response, context: EdgeContext) => void | Promise<void>;
}
/**
 * Create an edge-optimized request handler
 */
export declare function createEdgeHandler(options: EdgeHandlerOptions): (request: Request, platformEnv?: unknown, platformContext?: unknown) => Promise<Response>;
/**
 * Preload a module to reduce cold start time
 */
export declare function preloadModule<T>(name: string, loader: () => Promise<T>): Promise<T>;
/**
 * Get a preloaded module
 */
export declare function getPreloadedModule<T>(name: string): T | undefined;
/**
 * Initialize critical resources for faster subsequent requests
 */
export interface ColdStartConfig {
    /** Modules to preload */
    modules?: Array<{
        name: string;
        loader: () => Promise<unknown>;
    }>;
    /** Connections to warm up */
    warmConnections?: Array<() => Promise<void>>;
    /** Custom initialization */
    onInit?: () => Promise<void>;
}
/**
 * Run cold start optimizations
 */
export declare function initializeColdStart(config: ColdStartConfig): Promise<void>;
declare const _default: {
    detectEdgePlatform: typeof detectEdgePlatform;
    getPlatformInfo: typeof getPlatformInfo;
    createEdgeEnv: typeof createEdgeEnv;
    createExecutionContext: typeof createExecutionContext;
    getRegion: typeof getRegion;
    createEdgeHandler: typeof createEdgeHandler;
    coalesceRequest: typeof coalesceRequest;
    isColdStart: typeof isColdStart;
    markWarm: typeof markWarm;
    getColdStartDuration: typeof getColdStartDuration;
    resetColdStartTracking: typeof resetColdStartTracking;
    preloadModule: typeof preloadModule;
    getPreloadedModule: typeof getPreloadedModule;
    initializeColdStart: typeof initializeColdStart;
};
export default _default;
//# sourceMappingURL=edge-runtime.d.ts.map
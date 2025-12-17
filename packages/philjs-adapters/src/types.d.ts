/**
 * PhilJS Adapters - Type Definitions
 */
export interface AdapterConfig {
    /** Output directory for build artifacts */
    outDir?: string;
    /** Enable edge runtime (if supported) */
    edge?: boolean;
    /** Static file handling */
    static?: {
        /** Directory containing static assets */
        assets?: string;
        /** Cache control headers */
        cacheControl?: string;
    };
    /** Environment variables to include */
    env?: Record<string, string>;
    /** Routes to prerender */
    prerender?: string[];
    /** Split routes for serverless functions */
    split?: boolean;
    /** Include source maps */
    sourceMaps?: boolean;
}
export interface BuildOutput {
    /** Server handler function */
    handler: string;
    /** Static assets directory */
    assets: string;
    /** Prerendered pages */
    prerendered: Map<string, string>;
    /** Server routes */
    routes: RouteManifest;
}
export interface RouteManifest {
    routes: RouteEntry[];
    fallback?: string;
}
export interface RouteEntry {
    /** Route pattern (e.g., /users/[id]) */
    pattern: string;
    /** Regex for matching */
    regex: RegExp;
    /** Parameter names */
    params: string[];
    /** Handler module path */
    handler: string;
    /** Is this a static route? */
    static: boolean;
    /** Prerender this route */
    prerender: boolean;
}
export interface RequestContext {
    /** Request URL */
    url: URL;
    /** HTTP method */
    method: string;
    /** Request headers */
    headers: Headers;
    /** Request body (if any) */
    body?: ReadableStream | null;
    /** Route parameters */
    params: Record<string, string>;
    /** Platform-specific context */
    platform?: unknown;
}
export interface ResponseContext {
    /** Response status code */
    status: number;
    /** Response headers */
    headers: Headers;
    /** Response body */
    body: ReadableStream | string | null;
}
export interface Adapter {
    /** Adapter name */
    name: string;
    /** Build the application for this platform */
    adapt(config: AdapterConfig): Promise<void>;
    /** Get platform-specific request handler */
    getHandler(): (request: Request, context?: unknown) => Promise<Response>;
}
export interface EdgeAdapter extends Adapter {
    /** Supports edge runtime */
    edge: true;
    /** Edge-specific configuration */
    edgeConfig?: {
        regions?: string[];
        memory?: number;
        maxDuration?: number;
    };
}
export interface ServerlessAdapter extends Adapter {
    /** Supports serverless functions */
    serverless: true;
    /** Function configuration */
    functionConfig?: {
        memory?: number;
        timeout?: number;
        runtime?: string;
    };
}
//# sourceMappingURL=types.d.ts.map
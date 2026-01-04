/**
 * PhilJS Rocket Server
 *
 * RocketServer class for SSR integration with PhilJS.
 * Provides a unified interface for configuring and running
 * a Rocket server with PhilJS components.
 */
import type { RocketConfig, RocketSSRConfig, RocketLiveViewConfig } from './types.js';
/**
 * Rocket server configuration
 */
export interface RocketServerConfig {
    /** Server host */
    host?: string;
    /** Server port */
    port?: number;
    /** Number of workers */
    workers?: number;
    /** Keep-alive timeout in seconds */
    keepAlive?: number;
    /** Request timeout in seconds */
    timeout?: number;
    /** Enable TLS */
    tls?: {
        cert: string;
        key: string;
    };
    /** Log level */
    logLevel?: 'off' | 'critical' | 'normal' | 'debug';
    /** Secret key for cookies (32 bytes) */
    secretKey?: string;
    /** Static files directory */
    staticDir?: string;
    /** Template directory */
    templateDir?: string;
    /** PhilJS configuration */
    philjs?: RocketConfig;
}
/**
 * Default server configuration
 */
export declare const DEFAULT_SERVER_CONFIG: Required<Omit<RocketServerConfig, 'tls' | 'secretKey' | 'philjs'>>;
/**
 * RocketServer class for PhilJS SSR integration
 */
export declare class RocketServer {
    private config;
    private fairings;
    private routes;
    private catchers;
    private state;
    constructor(config?: RocketServerConfig);
    /**
     * Configure the server
     */
    configure(config: Partial<RocketServerConfig>): this;
    /**
     * Set server host
     */
    host(host: string): this;
    /**
     * Set server port
     */
    port(port: number): this;
    /**
     * Set number of workers
     */
    workers(count: number): this;
    /**
     * Enable TLS
     */
    withTLS(cert: string, key: string): this;
    /**
     * Set secret key for cookies
     */
    secretKey(key: string): this;
    /**
     * Set log level
     */
    logLevel(level: 'off' | 'critical' | 'normal' | 'debug'): this;
    /**
     * Add a fairing
     */
    attach<F extends {
        name: string;
    }>(fairing: F): this;
    /**
     * Enable SSR with configuration
     */
    withSSR(config?: Partial<RocketSSRConfig>): this;
    /**
     * Enable LiveView with configuration
     */
    withLiveView(config?: Partial<RocketLiveViewConfig>): this;
    /**
     * Enable metrics collection
     */
    withMetrics(path?: string): this;
    /**
     * Enable CORS
     */
    withCORS(config?: {
        origins?: string[];
        methods?: string[];
        credentials?: boolean;
    }): this;
    /**
     * Register managed state
     */
    manage<T>(key: string, value: T): this;
    /**
     * Get managed state
     */
    getState<T>(key: string): T | undefined;
    /**
     * Mount routes at a base path
     */
    mount(base: string, routes: RouteDefinition[]): this;
    /**
     * Register a GET route
     */
    get(path: string, handler: RouteHandler): this;
    /**
     * Register a POST route
     */
    post(path: string, handler: RouteHandler): this;
    /**
     * Register a PUT route
     */
    put(path: string, handler: RouteHandler): this;
    /**
     * Register a DELETE route
     */
    delete(path: string, handler: RouteHandler): this;
    /**
     * Register a PATCH route
     */
    patch(path: string, handler: RouteHandler): this;
    /**
     * Register error catchers
     */
    register(base: string, catchers: CatcherDefinition[]): this;
    /**
     * Register a 404 catcher
     */
    catch404(handler: CatcherHandler): this;
    /**
     * Register a 500 catcher
     */
    catch500(handler: CatcherHandler): this;
    /**
     * Register a default catcher
     */
    catchDefault(handler: CatcherHandler): this;
    /**
     * Build the server configuration (ignite)
     */
    build(): RocketServerBuild;
    /**
     * Generate Rust code for the server
     */
    toRustCode(): string;
    /**
     * Get configuration
     */
    getConfig(): RocketServerConfig;
}
/**
 * Route definition
 */
export interface RouteDefinition {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    path: string;
    handler: RouteHandler;
    name?: string;
    rank?: number;
    format?: string;
}
/**
 * Route handler type
 */
export type RouteHandler = (ctx: RouteContext) => Promise<RouteResponse> | RouteResponse;
/**
 * Route context
 */
export interface RouteContext {
    params: Record<string, string>;
    query: Record<string, string>;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    body?: unknown;
    state: Map<string, unknown>;
}
/**
 * Route response
 */
export interface RouteResponse {
    status?: number;
    headers?: Record<string, string>;
    body: string | Uint8Array | ReadableStream<Uint8Array>;
}
/**
 * Catcher definition
 */
export interface CatcherDefinition {
    status?: number;
    handler: CatcherHandler;
    base?: string;
}
/**
 * Catcher handler type
 */
export type CatcherHandler = (status: number, request: CatcherRequest) => Promise<RouteResponse> | RouteResponse;
/**
 * Catcher request
 */
export interface CatcherRequest {
    uri: string;
    method: string;
    headers: Record<string, string>;
}
/**
 * Server build result
 */
export interface RocketServerBuild {
    config: RocketServerConfig;
    fairings: unknown[];
    routes: RouteDefinition[];
    catchers: CatcherDefinition[];
    state: Map<string, unknown>;
}
/**
 * Create a new Rocket server
 */
export declare function createRocketServer(config?: RocketServerConfig): RocketServer;
/**
 * Create a development server
 */
export declare function createDevServer(port?: number): RocketServer;
/**
 * Create a production server
 */
export declare function createProdServer(config: RocketServerConfig): RocketServer;
//# sourceMappingURL=server.d.ts.map
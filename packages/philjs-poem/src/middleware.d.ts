/**
 * PhilJS Poem Middleware
 *
 * Middleware components for Poem framework integration.
 * Poem uses a powerful middleware system based on tower-like layers.
 */
import type { PoemCORSConfig, PoemSecurityConfig, ExtractorContext } from './types.js';
/**
 * Middleware response action
 */
export interface MiddlewareAction {
    /** Continue to next middleware */
    continue?: boolean;
    /** Modified headers */
    headers?: Record<string, string>;
    /** Modified status code */
    status?: number;
    /** Abort with response body */
    abort?: string;
    /** Redirect URL */
    redirect?: string;
}
/**
 * Middleware handler
 */
export type MiddlewareHandler = (ctx: ExtractorContext) => MiddlewareAction | Promise<MiddlewareAction>;
/**
 * SSR middleware configuration
 */
export interface SSRMiddlewareConfig {
    /** Enable streaming SSR */
    streaming?: boolean;
    /** Inject hydration scripts */
    hydration?: boolean;
    /** Cache rendered pages */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
    /** Routes to apply SSR to */
    routes?: string[];
    /** Routes to exclude from SSR */
    excludeRoutes?: string[];
}
/**
 * Create SSR middleware
 */
export declare function createSSRMiddleware(config?: SSRMiddlewareConfig): SSRMiddleware;
/**
 * SSR Middleware class
 */
export declare class SSRMiddleware {
    private config;
    constructor(config: SSRMiddlewareConfig);
    /**
     * Check if a path should be SSR'd
     */
    shouldSSR(path: string): boolean;
    private matchPath;
    /**
     * Generate Rust middleware code
     */
    toRustCode(): string;
    getConfig(): SSRMiddlewareConfig;
}
/**
 * CORS middleware configuration
 */
export interface CORSMiddlewareConfig extends PoemCORSConfig {
}
/**
 * Create CORS middleware
 */
export declare function createCORSMiddleware(config?: CORSMiddlewareConfig): CORSMiddleware;
/**
 * CORS Middleware class
 */
export declare class CORSMiddleware {
    private config;
    constructor(config: CORSMiddlewareConfig);
    /**
     * Check if an origin is allowed
     */
    isOriginAllowed(origin: string): boolean;
    /**
     * Get CORS headers
     */
    getCORSHeaders(origin: string): Record<string, string>;
    /**
     * Generate Rust middleware code
     */
    toRustCode(): string;
    getConfig(): CORSMiddlewareConfig;
}
/**
 * Tracing middleware configuration
 */
export interface TracingMiddlewareConfig {
    /** Enable tracing */
    enabled?: boolean;
    /** Log level */
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    /** Include request body */
    logBody?: boolean;
    /** Include response body */
    logResponseBody?: boolean;
    /** Include headers */
    logHeaders?: boolean;
    /** Redact sensitive headers */
    redactHeaders?: string[];
}
/**
 * Create tracing middleware
 */
export declare function createTracingMiddleware(config?: TracingMiddlewareConfig): TracingMiddleware;
/**
 * Tracing Middleware class
 */
export declare class TracingMiddleware {
    private config;
    constructor(config: TracingMiddlewareConfig);
    /**
     * Redact sensitive headers
     */
    redactHeaders(headers: Record<string, string>): Record<string, string>;
    /**
     * Generate Rust middleware code
     */
    toRustCode(): string;
    getConfig(): TracingMiddlewareConfig;
}
/**
 * Compression middleware configuration
 */
export interface CompressionMiddlewareConfig {
    /** Enable compression */
    enabled?: boolean;
    /** Minimum size to compress (bytes) */
    minSize?: number;
    /** Compression level (1-9) */
    level?: number;
    /** Enable gzip */
    gzip?: boolean;
    /** Enable brotli */
    brotli?: boolean;
    /** Enable deflate */
    deflate?: boolean;
}
/**
 * Create compression middleware
 */
export declare function createCompressionMiddleware(config?: CompressionMiddlewareConfig): CompressionMiddleware;
/**
 * Compression Middleware class
 */
export declare class CompressionMiddleware {
    private config;
    constructor(config: CompressionMiddlewareConfig);
    /**
     * Generate Rust middleware code
     */
    toRustCode(): string;
    getConfig(): CompressionMiddlewareConfig;
}
/**
 * Rate limit middleware configuration
 */
export interface RateLimitMiddlewareConfig {
    /** Enable rate limiting */
    enabled?: boolean;
    /** Requests per window */
    limit?: number;
    /** Window size in seconds */
    window?: number;
    /** Key extractor */
    keyBy?: 'ip' | 'user' | 'apiKey';
    /** Custom key header */
    keyHeader?: string;
}
/**
 * Create rate limit middleware
 */
export declare function createRateLimitMiddleware(config?: RateLimitMiddlewareConfig): RateLimitMiddleware;
/**
 * Rate Limit Middleware class
 */
export declare class RateLimitMiddleware {
    private config;
    constructor(config: RateLimitMiddlewareConfig);
    /**
     * Generate Rust middleware code
     */
    toRustCode(): string;
    getConfig(): RateLimitMiddlewareConfig;
}
/**
 * Security headers middleware configuration
 */
export interface SecurityMiddlewareConfig extends PoemSecurityConfig {
}
/**
 * Create security headers middleware
 */
export declare function createSecurityMiddleware(config?: SecurityMiddlewareConfig): SecurityMiddleware;
/**
 * Security Middleware class
 */
export declare class SecurityMiddleware {
    private config;
    constructor(config: SecurityMiddlewareConfig);
    /**
     * Get security headers
     */
    getSecurityHeaders(): Record<string, string>;
    /**
     * Generate Rust middleware code
     */
    toRustCode(): string;
    getConfig(): SecurityMiddlewareConfig;
}
/**
 * Compose multiple middleware together
 */
export declare class MiddlewareComposer {
    private middleware;
    /**
     * Add SSR middleware
     */
    withSSR(config?: SSRMiddlewareConfig): this;
    /**
     * Add CORS middleware
     */
    withCORS(config?: CORSMiddlewareConfig): this;
    /**
     * Add tracing middleware
     */
    withTracing(config?: TracingMiddlewareConfig): this;
    /**
     * Add compression middleware
     */
    withCompression(config?: CompressionMiddlewareConfig): this;
    /**
     * Add rate limiting middleware
     */
    withRateLimit(config?: RateLimitMiddlewareConfig): this;
    /**
     * Add security headers middleware
     */
    withSecurity(config?: SecurityMiddlewareConfig): this;
    /**
     * Generate combined Rust code
     */
    toRustCode(): string;
}
/**
 * Create a middleware composer
 */
export declare function composeMiddleware(): MiddlewareComposer;
//# sourceMappingURL=middleware.d.ts.map
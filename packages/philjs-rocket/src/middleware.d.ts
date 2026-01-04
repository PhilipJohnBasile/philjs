/**
 * PhilJS Rocket Middleware
 *
 * Middleware components for Rocket framework integration.
 * These are implemented as fairings in Rocket but exposed as
 * middleware-like abstractions for TypeScript configuration.
 */
import type { RocketCORSConfig, RocketSecurityConfig, FairingContext, FairingResponse } from './types.js';
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
    /** Routes to apply SSR to (glob patterns) */
    routes?: string[];
    /** Routes to exclude from SSR */
    excludeRoutes?: string[];
}
/**
 * Create SSR middleware configuration
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
    /**
     * Simple glob pattern matching
     */
    private matchPath;
    /**
     * Get cache key for a request
     */
    getCacheKey(ctx: FairingContext): string;
    /**
     * Generate Rust fairing code
     */
    toRustCode(): string;
    getConfig(): SSRMiddlewareConfig;
}
/**
 * CORS middleware configuration
 */
export interface CORSMiddlewareConfig extends RocketCORSConfig {
}
/**
 * Create CORS middleware configuration
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
     * Get CORS headers for a request
     */
    getCORSHeaders(origin: string): Record<string, string>;
    /**
     * Handle preflight request
     */
    handlePreflight(ctx: FairingContext): FairingResponse;
    /**
     * Generate Rust fairing code
     */
    toRustCode(): string;
    getConfig(): CORSMiddlewareConfig;
}
/**
 * Security headers middleware configuration
 */
export interface SecurityMiddlewareConfig extends RocketSecurityConfig {
}
/**
 * Create security headers middleware
 */
export declare function createSecurityMiddleware(config?: SecurityMiddlewareConfig): SecurityMiddleware;
/**
 * Security Headers Middleware class
 */
export declare class SecurityMiddleware {
    private config;
    constructor(config: SecurityMiddlewareConfig);
    /**
     * Get security headers
     */
    getSecurityHeaders(): Record<string, string>;
    /**
     * Generate Rust fairing code
     */
    toRustCode(): string;
    getConfig(): SecurityMiddlewareConfig;
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
    /** Content types to compress */
    contentTypes?: string[];
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
     * Check if content type should be compressed
     */
    shouldCompress(contentType: string): boolean;
    /**
     * Get best compression algorithm based on Accept-Encoding
     */
    getBestEncoding(acceptEncoding: string): 'br' | 'gzip' | null;
    /**
     * Generate Rust fairing code
     */
    toRustCode(): string;
    getConfig(): CompressionMiddlewareConfig;
}
/**
 * Rate limiting middleware configuration
 */
export interface RateLimitMiddlewareConfig {
    /** Enable rate limiting */
    enabled?: boolean;
    /** Requests per window */
    limit?: number;
    /** Window size in seconds */
    window?: number;
    /** Key extractor: 'ip' | 'user' | 'apiKey' */
    keyBy?: 'ip' | 'user' | 'apiKey';
    /** Custom key header (for apiKey) */
    keyHeader?: string;
    /** Routes to apply rate limiting */
    routes?: string[];
    /** Routes to exclude */
    excludeRoutes?: string[];
}
/**
 * Create rate limiting middleware
 */
export declare function createRateLimitMiddleware(config?: RateLimitMiddlewareConfig): RateLimitMiddleware;
/**
 * Rate Limit Middleware class
 */
export declare class RateLimitMiddleware {
    private config;
    constructor(config: RateLimitMiddlewareConfig);
    /**
     * Get rate limit key from context
     */
    getKey(ctx: FairingContext): string;
    /**
     * Generate Rust fairing code
     */
    toRustCode(): string;
    getConfig(): RateLimitMiddlewareConfig;
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
     * Generate Rust fairing code
     */
    toRustCode(): string;
    getConfig(): TracingMiddlewareConfig;
}
//# sourceMappingURL=middleware.d.ts.map
/**
 * PhilJS Edge Middleware System
 *
 * Next.js-style edge middleware for PhilJS applications.
 * Works with Cloudflare Workers, Vercel Edge, Deno Deploy, and other edge runtimes.
 *
 * Features:
 * - Request/response rewriting at edge
 * - Middleware chaining
 * - Edge runtime compatible
 * - URL rewrites and redirects
 * - Header manipulation
 * - Geolocation support
 * - A/B testing at edge
 * - Edge caching
 */
export interface EdgeRequest {
    /** Request URL */
    url: URL;
    /** HTTP method */
    method: string;
    /** Request headers */
    headers: Headers;
    /** Original Request object */
    raw: Request;
    /** Geolocation data (if available) */
    geo?: GeolocationData;
    /** Client IP address */
    ip?: string;
    /** User agent */
    userAgent?: string;
    /** Cookies */
    cookies: Map<string, string>;
}
export interface EdgeContext {
    /** The request */
    request: EdgeRequest;
    /** Next middleware in chain */
    next: () => Promise<Response>;
    /** Rewrite URL without redirect */
    rewrite: (url: string | URL) => void;
    /** Redirect to URL */
    redirect: (url: string | URL, status?: 301 | 302 | 303 | 307 | 308) => Response;
    /** Get/set cookies */
    cookies: CookieStore;
    /** Geolocation data */
    geo: GeolocationData;
    /** Platform-specific context */
    platform?: unknown;
}
export interface CookieStore {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieOptions): void;
    delete(name: string): void;
    has(name: string): boolean;
    getAll(): Map<string, string>;
}
export interface CookieOptions {
    maxAge?: number;
    expires?: Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}
export interface GeolocationData {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    continent?: string;
    postalCode?: string;
}
export type EdgeMiddleware = (context: EdgeContext) => Response | Promise<Response> | void | Promise<void>;
export interface EdgeMiddlewareConfig {
    /** Middleware function */
    middleware: EdgeMiddleware;
    /** Matcher patterns (supports glob patterns) */
    matcher?: string | string[];
    /** Runtime (optional, for optimization hints) */
    runtime?: 'edge' | 'nodejs';
}
/**
 * Execute edge middleware
 */
export declare function executeEdgeMiddleware(request: Request, middlewares: EdgeMiddleware | EdgeMiddleware[], options?: {
    geo?: GeolocationData;
    platform?: unknown;
}): Promise<Response>;
/**
 * Compose multiple middlewares into a single middleware
 */
export declare function composeEdgeMiddleware(...middlewares: EdgeMiddleware[]): EdgeMiddleware;
/**
 * Create a middleware config
 */
export declare function defineEdgeMiddleware(config: EdgeMiddlewareConfig): EdgeMiddlewareConfig;
/**
 * Check if request matches middleware matcher
 */
export declare function matchesPattern(url: URL, pattern: string | string[]): boolean;
/**
 * Rewrite middleware - rewrite URLs without redirecting
 */
export declare function rewriteMiddleware(rules: Record<string, string>): EdgeMiddleware;
/**
 * Redirect middleware - redirect based on patterns
 */
export declare function redirectMiddleware(rules: Record<string, string | {
    destination: string;
    permanent?: boolean;
}>): EdgeMiddleware;
/**
 * Add headers middleware
 */
export declare function addHeadersMiddleware(headers: Record<string, string>): EdgeMiddleware;
/**
 * Remove headers middleware
 */
export declare function removeHeadersMiddleware(headers: string[]): EdgeMiddleware;
/**
 * Security headers middleware
 */
export declare function securityHeadersMiddleware(options?: {
    csp?: string;
    hsts?: boolean;
    nosniff?: boolean;
    xssProtection?: boolean;
    frameOptions?: 'DENY' | 'SAMEORIGIN';
}): EdgeMiddleware;
//# sourceMappingURL=edge-middleware.d.ts.map
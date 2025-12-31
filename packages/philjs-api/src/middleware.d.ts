/**
 * PhilJS API Middleware
 *
 * Advanced middleware for API routes including:
 * - Geolocation
 * - A/B Testing
 * - Rate Limiting
 * - CORS
 * - Compression
 * - Security Headers
 * - Request ID tracking
 */
import type { APIContext } from './server.js';
export type Middleware = (context: APIContext, next: () => Promise<Response>) => Promise<Response>;
export type MiddlewareOptions = {
    skip?: (context: APIContext) => boolean;
};
/**
 * Compose multiple middlewares into a single middleware
 */
export declare function composeMiddleware(...middlewares: Middleware[]): Middleware;
/**
 * Conditional middleware - only runs if condition is met
 */
export declare function conditionalMiddleware(condition: (context: APIContext) => boolean, middleware: Middleware): Middleware;
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
export interface GeolocationMiddlewareOptions {
    /**
     * Custom geolocation provider
     */
    provider?: (request: Request) => Promise<GeolocationData> | GeolocationData;
    /**
     * Fallback geolocation data
     */
    fallback?: GeolocationData;
    /**
     * Whether to add geolocation to response headers
     */
    addToHeaders?: boolean;
}
/**
 * Geolocation middleware - adds geolocation data to context
 *
 * Works with Cloudflare Workers, Vercel Edge, Deno Deploy, and custom providers.
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [geolocationMiddleware()],
 *   handler: async ({ request, geo }) => {
 *     return json({ country: geo.country });
 *   }
 * });
 * ```
 */
export declare function geolocationMiddleware(options?: GeolocationMiddlewareOptions): Middleware;
export interface ABTestVariant {
    name: string;
    weight: number;
}
export interface ABTest {
    name: string;
    variants: ABTestVariant[];
    cookieName?: string;
    cookieMaxAge?: number;
}
export interface ABTestMiddlewareOptions {
    tests: ABTest[];
    /**
     * Custom variant selector
     */
    selectVariant?: (test: ABTest, context: APIContext) => string;
}
/**
 * A/B Testing middleware - assigns users to test variants
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     abTestMiddleware({
 *       tests: [{
 *         name: 'checkout-flow',
 *         variants: [
 *           { name: 'control', weight: 50 },
 *           { name: 'new-design', weight: 50 }
 *         ]
 *       }]
 *     })
 *   ],
 *   handler: async ({ request, abTests }) => {
 *     const variant = abTests['checkout-flow'];
 *     return json({ variant });
 *   }
 * });
 * ```
 */
export declare function abTestMiddleware(options: ABTestMiddlewareOptions): Middleware;
export interface RateLimitOptions {
    /**
     * Maximum requests per window
     */
    limit: number;
    /**
     * Window duration in milliseconds
     */
    windowMs: number;
    /**
     * Key generator (default: IP address)
     */
    keyGenerator?: (context: APIContext) => string;
    /**
     * Storage adapter
     */
    store?: RateLimitStore;
    /**
     * Handler for when limit is exceeded
     */
    onLimitExceeded?: (context: APIContext) => Response;
    /**
     * Skip rate limiting for certain requests
     */
    skip?: (context: APIContext) => boolean;
}
export interface RateLimitStore {
    get(key: string): Promise<number | undefined>;
    increment(key: string, windowMs: number): Promise<number>;
    reset(key: string): Promise<void>;
}
/**
 * Rate limiting middleware
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     rateLimitMiddleware({
 *       limit: 100,
 *       windowMs: 60 * 1000, // 1 minute
 *     })
 *   ],
 *   handler: async ({ request }) => {
 *     return json({ message: 'OK' });
 *   }
 * });
 * ```
 */
export declare function rateLimitMiddleware(options: RateLimitOptions): Middleware;
export interface CORSOptions {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
/**
 * CORS middleware
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     corsMiddleware({
 *       origin: '*',
 *       methods: ['GET', 'POST'],
 *       credentials: true
 *     })
 *   ],
 *   handler: async ({ request }) => {
 *     return json({ message: 'OK' });
 *   }
 * });
 * ```
 */
export declare function corsMiddleware(options?: CORSOptions): Middleware;
export interface SecurityHeadersOptions {
    contentSecurityPolicy?: string | Record<string, string[]>;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
    xContentTypeOptions?: boolean;
    strictTransportSecurity?: string | {
        maxAge: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    };
    referrerPolicy?: string;
    permissionsPolicy?: Record<string, string[]>;
}
/**
 * Security headers middleware
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [
 *     securityHeadersMiddleware({
 *       xFrameOptions: 'DENY',
 *       strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true }
 *     })
 *   ],
 *   handler: async ({ request }) => {
 *     return json({ message: 'OK' });
 *   }
 * });
 * ```
 */
export declare function securityHeadersMiddleware(options?: SecurityHeadersOptions): Middleware;
export interface RequestIDOptions {
    /**
     * Header name to use/check for request ID
     */
    headerName?: string;
    /**
     * Custom ID generator
     */
    generator?: () => string;
    /**
     * Add request ID to response headers
     */
    addToResponse?: boolean;
}
/**
 * Request ID middleware - tracks requests with unique IDs
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [requestIDMiddleware()],
 *   handler: async ({ request, requestId }) => {
 *     console.log('Request ID:', requestId);
 *     return json({ requestId });
 *   }
 * });
 * ```
 */
export declare function requestIDMiddleware(options?: RequestIDOptions): Middleware;
export interface CompressionOptions {
    /**
     * Minimum response size to compress (in bytes)
     */
    threshold?: number;
    /**
     * Compression algorithms to support
     */
    algorithms?: ('gzip' | 'deflate' | 'br')[];
    /**
     * Skip compression for certain responses
     */
    skip?: (response: Response) => boolean;
}
/**
 * Compression middleware - compresses responses
 *
 * @example
 * ```ts
 * const handler = defineAPIRoute({
 *   middleware: [compressionMiddleware({ threshold: 1024 })],
 *   handler: async ({ request }) => {
 *     return json({ message: 'Large response data...' });
 *   }
 * });
 * ```
 */
export declare function compressionMiddleware(options?: CompressionOptions): Middleware;
//# sourceMappingURL=middleware.d.ts.map
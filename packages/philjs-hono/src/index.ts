/**
 * PhilJS Hono Middleware
 *
 * Comprehensive Hono integration for PhilJS SSR applications.
 * Designed for edge runtimes (Cloudflare Workers, Deno, Bun, Node.js).
 */

import type {
    MiddlewareHandler,
    Context,
    Hono,
    Next,
    Env,
    ValidationTargets,
    TypedResponse,
    ContextVariableMap,
} from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

// ============================================================================
// Types
// ============================================================================

export interface RenderContext {
    url: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    state: Record<string, any>;
    signals?: Record<string, any>;
    meta?: MetaInfo;
    env?: any;
}

export interface MetaInfo {
    title?: string;
    description?: string;
    keywords?: string[];
    openGraph?: Record<string, string>;
    twitter?: Record<string, string>;
    canonical?: string;
    robots?: string;
}

export interface SSRResult {
    html: string;
    head?: string;
    css?: string;
    state?: Record<string, any>;
    statusCode?: number;
    headers?: Record<string, string>;
    redirect?: string;
}

export interface PhilJSMiddlewareOptions {
    /** Enable SSR */
    ssr?: boolean;
    /** SSR render function */
    render?: (url: string, context: RenderContext) => Promise<string | SSRResult>;
    /** Streaming render function */
    streamRender?: (url: string, context: RenderContext) => Promise<ReadableStream<Uint8Array>>;
    /** Routes to exclude from SSR */
    excludeRoutes?: string[];
    /** Routes to include (if set, only these routes use SSR) */
    includeRoutes?: string[];
    /** Enable streaming SSR */
    streaming?: boolean;
    /** Custom error handler */
    onError?: (error: Error, c: Context) => Response | Promise<Response>;
    /** Pre-render hook */
    beforeRender?: (context: RenderContext, c: Context) => void | Promise<void>;
    /** Post-render hook */
    afterRender?: (result: string | SSRResult, context: RenderContext) => void | Promise<void>;
    /** HTML shell template */
    template?: string;
    /** Cache configuration */
    cache?: CacheOptions;
}

export interface CacheOptions {
    /** Enable caching */
    enabled: boolean;
    /** TTL in seconds */
    ttl?: number;
    /** Cache key generator */
    keyGenerator?: (url: string, context: RenderContext) => string;
    /** Use Cache API (Cloudflare Workers, Deno) */
    useCacheApi?: boolean;
    /** Routes to cache */
    routes?: string[];
    /** Routes to never cache */
    excludeRoutes?: string[];
    /** Stale-while-revalidate in seconds */
    swr?: number;
}

export interface RateLimitOptions {
    /** Maximum requests per window */
    max: number;
    /** Time window in milliseconds */
    window?: number;
    /** Key generator */
    keyGenerator?: (c: Context) => string;
    /** Skip function */
    skip?: (c: Context) => boolean;
    /** Rate limit exceeded handler */
    onExceeded?: (c: Context) => Response;
    /** Storage binding name (for Cloudflare Workers) */
    kvBinding?: string;
    /** Add rate limit headers */
    headers?: boolean;
}

export interface CorsOptions {
    /** Allowed origins */
    origin?: string | string[] | boolean | ((origin: string, c: Context) => boolean | string);
    /** Allowed methods */
    methods?: string[];
    /** Allowed headers */
    allowedHeaders?: string[];
    /** Exposed headers */
    exposedHeaders?: string[];
    /** Allow credentials */
    credentials?: boolean;
    /** Max age for preflight cache */
    maxAge?: number;
}

export interface SecurityOptions {
    /** Content Security Policy */
    csp?: ContentSecurityPolicy | false;
    /** X-Frame-Options */
    frameOptions?: 'DENY' | 'SAMEORIGIN' | string | false;
    /** X-Content-Type-Options */
    contentTypeOptions?: boolean;
    /** Referrer-Policy */
    referrerPolicy?: string | false;
    /** Strict-Transport-Security */
    hsts?: HSTSOptions | false;
    /** Permissions-Policy */
    permissionsPolicy?: Record<string, string[]> | false;
    /** Cross-Origin policies */
    crossOrigin?: CrossOriginOptions;
}

export interface ContentSecurityPolicy {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    fontSrc?: string[];
    connectSrc?: string[];
    mediaSrc?: string[];
    objectSrc?: string[];
    frameSrc?: string[];
    childSrc?: string[];
    workerSrc?: string[];
    frameAncestors?: string[];
    formAction?: string[];
    baseUri?: string[];
    upgradeInsecureRequests?: boolean;
    blockAllMixedContent?: boolean;
    reportUri?: string;
}

export interface HSTSOptions {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}

export interface CrossOriginOptions {
    embedderPolicy?: 'require-corp' | 'credentialless' | 'unsafe-none' | false;
    openerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' | false;
    resourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin' | false;
}

export interface SessionOptions {
    /** Session secret */
    secret: string;
    /** Cookie name */
    cookieName?: string;
    /** Cookie options */
    cookie?: SessionCookieOptions;
    /** KV binding name (for Cloudflare Workers) */
    kvBinding?: string;
    /** Generate session ID */
    generateId?: () => string;
}

export interface SessionCookieOptions {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface SessionData {
    [key: string]: any;
}

export interface ApiHandlerOptions {
    /** Response cache TTL */
    cache?: number;
    /** Rate limit for this handler */
    rateLimit?: RateLimitOptions;
    /** Require authentication */
    auth?: boolean;
}

export interface SSEEvent {
    id?: string;
    event?: string;
    data: any;
    retry?: number;
}

export interface SSEOptions {
    /** Retry interval for client */
    retry?: number;
    /** Keep-alive interval */
    keepAlive?: number;
    /** Event ID generator */
    idGenerator?: () => string;
}

// ============================================================================
// Error Classes
// ============================================================================

export class HttpError extends Error {
    statusCode: number;
    code?: string;
    details?: any;
    expose: boolean;

    constructor(statusCode: number, message: string, options?: { code?: string; details?: any; expose?: boolean }) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.code = options?.code;
        this.details = options?.details;
        this.expose = options?.expose ?? statusCode < 500;
    }
}

export class ValidationError extends HttpError {
    errors: Array<{ field: string; message: string; value?: any }>;

    constructor(errors: Array<{ field: string; message: string; value?: any }>) {
        super(400, 'Validation failed', { code: 'VALIDATION_ERROR' });
        this.name = 'ValidationError';
        this.errors = errors;
        this.details = { errors };
    }
}

export class AuthenticationError extends HttpError {
    constructor(message = 'Authentication required') {
        super(401, message, { code: 'AUTHENTICATION_REQUIRED' });
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends HttpError {
    constructor(message = 'Access denied') {
        super(403, message, { code: 'ACCESS_DENIED' });
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends HttpError {
    resource?: string;

    constructor(resource?: string) {
        super(404, resource ? `${resource} not found` : 'Resource not found', { code: 'NOT_FOUND' });
        this.name = 'NotFoundError';
        this.resource = resource;
    }
}

export class RateLimitError extends HttpError {
    retryAfter: number;

    constructor(retryAfter: number) {
        super(429, 'Too many requests', { code: 'RATE_LIMIT_EXCEEDED' });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/** HTTP error factory */
export const errors = {
    badRequest: (message: string, details?: any) => new HttpError(400, message, { code: 'BAD_REQUEST', details }),
    unauthorized: (message = 'Unauthorized') => new AuthenticationError(message),
    forbidden: (message = 'Forbidden') => new AuthorizationError(message),
    notFound: (resource?: string) => new NotFoundError(resource),
    methodNotAllowed: (method: string) => new HttpError(405, `Method ${method} not allowed`, { code: 'METHOD_NOT_ALLOWED' }),
    conflict: (message = 'Conflict') => new HttpError(409, message, { code: 'CONFLICT' }),
    unprocessable: (message: string, details?: any) => new HttpError(422, message, { code: 'UNPROCESSABLE_ENTITY', details }),
    tooManyRequests: (retryAfter: number) => new RateLimitError(retryAfter),
    internal: (message = 'Internal server error') => new HttpError(500, message, { code: 'INTERNAL_ERROR', expose: false }),
    serviceUnavailable: (message = 'Service unavailable') => new HttpError(503, message, { code: 'SERVICE_UNAVAILABLE', expose: false }),
};

// ============================================================================
// Utility Functions
// ============================================================================

/** Parse cookies from header */
function parseCookies(cookieHeader: string | null): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    for (const pair of cookieHeader.split(';')) {
        const [name, ...rest] = pair.trim().split('=');
        if (name) {
            cookies[name] = decodeURIComponent(rest.join('='));
        }
    }

    return cookies;
}

/** Parse query string */
function parseQuery(url: string): Record<string, string> {
    try {
        const urlObj = new URL(url);
        return Object.fromEntries(urlObj.searchParams);
    } catch {
        return {};
    }
}

/** Create HMAC signature using Web Crypto API (edge-compatible) */
async function createHash(secret: string, value: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(value);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/** Generate unique ID */
function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Serialize cookie */
function serializeCookie(name: string, value: string, options: SessionCookieOptions = {}): string {
    const parts = [`${name}=${encodeURIComponent(value)}`];

    if (options.path) parts.push(`Path=${options.path}`);
    if (options.domain) parts.push(`Domain=${options.domain}`);
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
    if (options.secure) parts.push('Secure');
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

    return parts.join('; ');
}

// ============================================================================
// Core Middleware
// ============================================================================

/**
 * PhilJS SSR middleware for Hono
 *
 * @example
 * ```ts
 * import { Hono } from 'hono';
 * import { philjs } from '@philjs/hono';
 * import { render } from './entry-server';
 *
 * const app = new Hono();
 *
 * app.use('*', philjs({
 *   ssr: true,
 *   render: async (url, ctx) => render(url, ctx),
 *   excludeRoutes: ['/api'],
 * }));
 *
 * export default app;
 * ```
 */
export function philjs(options: PhilJSMiddlewareOptions = {}): MiddlewareHandler {
    const {
        ssr = true,
        render,
        streamRender,
        excludeRoutes = ['/api', '/health', '/_'],
        includeRoutes,
        streaming = false,
        onError,
        beforeRender,
        afterRender,
        template,
        cache,
    } = options;

    // In-memory cache for non-edge environments
    const memoryCache = new Map<string, { html: string; expires: number }>();

    const shouldSSR = (path: string): boolean => {
        if (includeRoutes && includeRoutes.length > 0) {
            return includeRoutes.some(route =>
                path === route || path.startsWith(route + '/') || new RegExp(route).test(path)
            );
        }

        for (const route of excludeRoutes) {
            if (path.startsWith(route)) {
                return false;
            }
        }

        return true;
    };

    const shouldCache = (path: string): boolean => {
        if (!cache?.enabled) return false;

        if (cache.excludeRoutes?.some(route => path.startsWith(route))) {
            return false;
        }

        if (cache.routes && cache.routes.length > 0) {
            return cache.routes.some(route => path.startsWith(route) || new RegExp(route).test(path));
        }

        return true;
    };

    const getCacheKey = (url: string, context: RenderContext): string => {
        if (cache?.keyGenerator) {
            return cache.keyGenerator(url, context);
        }
        return `ssr:${url}`;
    };

    return async (c: Context, next: Next) => {
        const path = new URL(c.req.url).pathname;

        // Skip non-SSR routes
        if (!shouldSSR(path)) {
            return next();
        }

        // Skip non-HTML requests
        const accept = c.req.header('accept') || '';
        if (!accept.includes('text/html') && !accept.includes('*/*')) {
            return next();
        }

        if (!ssr || (!render && !streamRender)) {
            return next();
        }

        try {
            const context: RenderContext = {
                url: c.req.url,
                path,
                query: parseQuery(c.req.url),
                headers: Object.fromEntries(c.req.raw.headers),
                cookies: parseCookies(c.req.header('cookie')),
                state: {},
                signals: {},
                meta: {},
                env: (c as any).env,
            };

            // Store context for later access
            c.set('philjsContext', context);

            // Check cache
            if (shouldCache(path)) {
                const cacheKey = getCacheKey(c.req.url, context);

                // Try memory cache
                const cached = memoryCache.get(cacheKey);
                if (cached && Date.now() < cached.expires) {
                    return c.html(cached.html, 200, { 'X-Cache': 'HIT' });
                }

                // Try Cache API (edge)
                if (cache?.useCacheApi && typeof caches !== 'undefined') {
                    try {
                        const cacheStorage = await caches.open('philjs-ssr');
                        const cachedResponse = await cacheStorage.match(c.req.url);
                        if (cachedResponse) {
                            const newResponse = new Response(cachedResponse.body, cachedResponse);
                            newResponse.headers.set('X-Cache', 'HIT');
                            return newResponse;
                        }
                    } catch {
                        // Cache API not available
                    }
                }

                c.header('X-Cache', 'MISS');
            }

            // Streaming SSR
            if (streaming && streamRender) {
                if (beforeRender) {
                    await beforeRender(context, c);
                }

                const stream = await streamRender(c.req.url, context);

                return new Response(stream, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Transfer-Encoding': 'chunked',
                        'X-Content-Type-Options': 'nosniff',
                    },
                });
            }

            // Regular SSR
            if (render) {
                if (beforeRender) {
                    await beforeRender(context, c);
                }

                const result = await render(c.req.url, context);

                if (afterRender) {
                    await afterRender(result, context);
                }

                let html: string;
                let statusCode: StatusCode = 200;
                const headers: Record<string, string> = {};

                if (typeof result === 'string') {
                    html = result;
                } else {
                    if (result.redirect) {
                        return c.redirect(result.redirect, (result.statusCode as StatusCode) || 302);
                    }

                    if (result.headers) {
                        Object.assign(headers, result.headers);
                    }

                    html = result.html;
                    statusCode = (result.statusCode as StatusCode) || 200;
                }

                // Apply template
                if (template) {
                    html = template.replace('<!--ssr-outlet-->', html);
                }

                // Cache the response
                if (shouldCache(path) && statusCode === 200) {
                    const cacheKey = getCacheKey(c.req.url, context);
                    const ttl = cache?.ttl || 300;

                    memoryCache.set(cacheKey, {
                        html,
                        expires: Date.now() + ttl * 1000,
                    });

                    // Cache API
                    if (cache?.useCacheApi && typeof caches !== 'undefined') {
                        try {
                            const cacheStorage = await caches.open('philjs-ssr');
                            const response = new Response(html, {
                                status: 200,
                                headers: {
                                    'Content-Type': 'text/html; charset=utf-8',
                                    'Cache-Control': `public, max-age=${ttl}`,
                                },
                            });
                            await cacheStorage.put(c.req.url, response);
                        } catch {
                            // Cache API error
                        }
                    }

                    // Set cache headers
                    headers['Cache-Control'] = `public, max-age=${ttl}${cache?.swr ? `, stale-while-revalidate=${cache.swr}` : ''}`;
                }

                return c.html(html, statusCode, headers);
            }

            return next();
        } catch (error) {
            if (onError) {
                return onError(error as Error, c);
            }

            console.error('PhilJS SSR Error:', error);
            return c.html('Internal Server Error', 500);
        }
    };
}

// ============================================================================
// Security Middleware
// ============================================================================

/**
 * Security headers middleware
 */
export function security(options: SecurityOptions = {}): MiddlewareHandler {
    const {
        csp,
        frameOptions = 'SAMEORIGIN',
        contentTypeOptions = true,
        referrerPolicy = 'strict-origin-when-cross-origin',
        hsts,
        permissionsPolicy,
        crossOrigin = {},
    } = options;

    return async (c: Context, next: Next) => {
        await next();

        // Content Security Policy
        if (csp !== false && csp) {
            const directives: string[] = [];

            if (csp.defaultSrc) directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
            if (csp.scriptSrc) directives.push(`script-src ${csp.scriptSrc.join(' ')}`);
            if (csp.styleSrc) directives.push(`style-src ${csp.styleSrc.join(' ')}`);
            if (csp.imgSrc) directives.push(`img-src ${csp.imgSrc.join(' ')}`);
            if (csp.fontSrc) directives.push(`font-src ${csp.fontSrc.join(' ')}`);
            if (csp.connectSrc) directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
            if (csp.mediaSrc) directives.push(`media-src ${csp.mediaSrc.join(' ')}`);
            if (csp.objectSrc) directives.push(`object-src ${csp.objectSrc.join(' ')}`);
            if (csp.frameSrc) directives.push(`frame-src ${csp.frameSrc.join(' ')}`);
            if (csp.childSrc) directives.push(`child-src ${csp.childSrc.join(' ')}`);
            if (csp.workerSrc) directives.push(`worker-src ${csp.workerSrc.join(' ')}`);
            if (csp.frameAncestors) directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`);
            if (csp.formAction) directives.push(`form-action ${csp.formAction.join(' ')}`);
            if (csp.baseUri) directives.push(`base-uri ${csp.baseUri.join(' ')}`);
            if (csp.upgradeInsecureRequests) directives.push('upgrade-insecure-requests');
            if (csp.blockAllMixedContent) directives.push('block-all-mixed-content');
            if (csp.reportUri) directives.push(`report-uri ${csp.reportUri}`);

            if (directives.length > 0) {
                c.header('Content-Security-Policy', directives.join('; '));
            }
        }

        // X-Frame-Options
        if (frameOptions !== false) {
            c.header('X-Frame-Options', frameOptions);
        }

        // X-Content-Type-Options
        if (contentTypeOptions) {
            c.header('X-Content-Type-Options', 'nosniff');
        }

        // Referrer-Policy
        if (referrerPolicy !== false) {
            c.header('Referrer-Policy', referrerPolicy);
        }

        // HSTS
        if (hsts !== false && hsts) {
            let value = `max-age=${hsts.maxAge}`;
            if (hsts.includeSubDomains) value += '; includeSubDomains';
            if (hsts.preload) value += '; preload';
            c.header('Strict-Transport-Security', value);
        }

        // Permissions-Policy
        if (permissionsPolicy !== false && permissionsPolicy) {
            const directives = Object.entries(permissionsPolicy)
                .map(([key, values]) => `${key}=(${values.join(' ')})`)
                .join(', ');
            c.header('Permissions-Policy', directives);
        }

        // Cross-Origin policies
        if (crossOrigin.embedderPolicy !== false && crossOrigin.embedderPolicy) {
            c.header('Cross-Origin-Embedder-Policy', crossOrigin.embedderPolicy);
        }
        if (crossOrigin.openerPolicy !== false && crossOrigin.openerPolicy) {
            c.header('Cross-Origin-Opener-Policy', crossOrigin.openerPolicy);
        }
        if (crossOrigin.resourcePolicy !== false && crossOrigin.resourcePolicy) {
            c.header('Cross-Origin-Resource-Policy', crossOrigin.resourcePolicy);
        }
    };
}

// ============================================================================
// CORS Middleware
// ============================================================================

/**
 * CORS middleware
 */
export function cors(options: CorsOptions = {}): MiddlewareHandler {
    const {
        origin = '*',
        methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders,
        exposedHeaders,
        credentials = false,
        maxAge = 86400,
    } = options;

    const resolveOrigin = (requestOrigin: string | undefined, c: Context): string | null => {
        if (!requestOrigin) return null;

        if (origin === true) {
            return requestOrigin;
        }

        if (origin === '*') {
            return credentials ? requestOrigin : '*';
        }

        if (typeof origin === 'string') {
            return origin === requestOrigin ? requestOrigin : null;
        }

        if (Array.isArray(origin)) {
            return origin.includes(requestOrigin) ? requestOrigin : null;
        }

        if (typeof origin === 'function') {
            const result = origin(requestOrigin, c);
            if (typeof result === 'boolean') {
                return result ? requestOrigin : null;
            }
            return result;
        }

        return null;
    };

    return async (c: Context, next: Next) => {
        const requestOrigin = c.req.header('origin');
        const resolvedOrigin = resolveOrigin(requestOrigin, c);

        // Handle preflight
        if (c.req.method === 'OPTIONS') {
            if (resolvedOrigin) {
                c.header('Access-Control-Allow-Origin', resolvedOrigin);
            }

            c.header('Access-Control-Allow-Methods', methods.join(', '));

            if (allowedHeaders) {
                c.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            } else {
                const requestHeaders = c.req.header('access-control-request-headers');
                if (requestHeaders) {
                    c.header('Access-Control-Allow-Headers', requestHeaders);
                }
            }

            if (credentials) {
                c.header('Access-Control-Allow-Credentials', 'true');
            }

            if (maxAge) {
                c.header('Access-Control-Max-Age', String(maxAge));
            }

            return c.text('', 204);
        }

        await next();

        if (resolvedOrigin) {
            c.header('Access-Control-Allow-Origin', resolvedOrigin);

            if (credentials) {
                c.header('Access-Control-Allow-Credentials', 'true');
            }

            if (exposedHeaders && exposedHeaders.length > 0) {
                c.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
            }

            if (resolvedOrigin !== '*') {
                c.header('Vary', 'Origin');
            }
        }
    };
}

// ============================================================================
// Rate Limiting Middleware
// ============================================================================

/**
 * Rate limiting middleware (with edge runtime support)
 */
export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
    const {
        max = 100,
        window = 60000,
        keyGenerator = (c) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
        skip,
        onExceeded,
        kvBinding,
        headers = true,
    } = options;

    // In-memory store for non-edge environments
    const memoryStore = new Map<string, { count: number; expires: number }>();

    return async (c: Context, next: Next) => {
        if (skip && skip(c)) {
            return next();
        }

        const key = `ratelimit:${keyGenerator(c)}`;
        const now = Date.now();

        let current = 0;
        let ttl = window;

        // Try KV storage for edge (Cloudflare Workers)
        if (kvBinding && (c as any).env?.[kvBinding]) {
            const kv = (c as any).env[kvBinding];
            const stored = await kv.get(key, 'json');

            if (stored && now < stored.expires) {
                current = stored.count + 1;
                ttl = stored.expires - now;
                await kv.put(key, JSON.stringify({ count: current, expires: stored.expires }), {
                    expirationTtl: Math.ceil(ttl / 1000),
                });
            } else {
                current = 1;
                await kv.put(key, JSON.stringify({ count: 1, expires: now + window }), {
                    expirationTtl: Math.ceil(window / 1000),
                });
            }
        } else {
            // Memory store
            const entry = memoryStore.get(key);

            if (entry && now < entry.expires) {
                entry.count++;
                current = entry.count;
                ttl = entry.expires - now;
            } else {
                memoryStore.set(key, { count: 1, expires: now + window });
                current = 1;
            }
        }

        if (headers) {
            c.header('X-RateLimit-Limit', String(max));
            c.header('X-RateLimit-Remaining', String(Math.max(0, max - current)));
            c.header('X-RateLimit-Reset', String(Math.ceil((now + ttl) / 1000)));
        }

        if (current > max) {
            const retryAfter = Math.ceil(ttl / 1000);
            c.header('Retry-After', String(retryAfter));

            if (onExceeded) {
                return onExceeded(c);
            }

            return c.json(
                { error: 'Too Many Requests', message: 'Rate limit exceeded', retryAfter },
                429
            );
        }

        return next();
    };
}

// ============================================================================
// Session Middleware
// ============================================================================

/**
 * Session middleware (with edge runtime support)
 */
export function session(options: SessionOptions): MiddlewareHandler {
    const {
        secret,
        cookieName = 'session',
        cookie = {},
        kvBinding,
        generateId: customGenerateId = generateId,
    } = options;

    const cookieOptions: SessionCookieOptions = {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 86400,
        ...cookie,
    };

    // Memory store for non-edge environments
    const memoryStore = new Map<string, { data: SessionData; expires: number }>();

    const sign = async (value: string): Promise<string> => {
        const hash = await createHash(secret, value);
        return `${value}.${hash}`;
    };

    const unsign = async (signedValue: string): Promise<string | null> => {
        const parts = signedValue.split('.');
        if (parts.length !== 2) return null;

        const [value, signature] = parts;
        const expectedSignature = await createHash(secret, value);
        if (signature !== expectedSignature) return null;
        return value;
    };

    return async (c: Context, next: Next) => {
        const cookies = parseCookies(c.req.header('cookie'));
        const signedSessionId = cookies[cookieName];

        let sessionId: string | null = null;
        let sessionData: SessionData = {};

        // Try to restore session
        if (signedSessionId) {
            sessionId = await unsign(signedSessionId);

            if (sessionId) {
                // KV storage
                if (kvBinding && (c as any).env?.[kvBinding]) {
                    const kv = (c as any).env[kvBinding];
                    const stored = await kv.get(`session:${sessionId}`, 'json');
                    if (stored) {
                        sessionData = stored;
                    } else {
                        sessionId = null;
                    }
                } else {
                    // Memory store
                    const entry = memoryStore.get(sessionId);
                    if (entry && Date.now() < entry.expires) {
                        sessionData = entry.data;
                    } else {
                        memoryStore.delete(sessionId);
                        sessionId = null;
                    }
                }
            }
        }

        // Create new session if needed
        if (!sessionId) {
            sessionId = customGenerateId();
            sessionData = {};
        }

        // Attach to context
        c.set('sessionId', sessionId);
        c.set('session', sessionData);

        await next();

        // Save session after response
        const updatedSession = c.get('session') as SessionData;
        const currentSessionId = c.get('sessionId') as string;

        if (currentSessionId && updatedSession) {
            // KV storage
            if (kvBinding && (c as any).env?.[kvBinding]) {
                const kv = (c as any).env[kvBinding];
                await kv.put(`session:${currentSessionId}`, JSON.stringify(updatedSession), {
                    expirationTtl: cookieOptions.maxAge,
                });
            } else {
                // Memory store
                memoryStore.set(currentSessionId, {
                    data: updatedSession,
                    expires: Date.now() + (cookieOptions.maxAge || 86400) * 1000,
                });
            }

            // Set cookie
            c.header('Set-Cookie', serializeCookie(cookieName, await sign(currentSessionId), cookieOptions));
        }
    };
}

// ============================================================================
// Error Handler
// ============================================================================

export interface ErrorHandlerOptions {
    /** Log errors */
    log?: boolean;
    /** Include stack trace in development */
    stack?: boolean;
    /** Custom error transformer */
    transform?: (error: Error, c: Context) => any;
}

/**
 * Error handler middleware
 */
export function errorHandler(options: ErrorHandlerOptions = {}): MiddlewareHandler {
    const {
        log = true,
        stack = false,
        transform,
    } = options;

    return async (c: Context, next: Next) => {
        try {
            await next();
        } catch (error) {
            if (log) {
                console.error('Error:', error);
            }

            let statusCode: StatusCode = 500;
            let response: any = {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
            };

            if (error instanceof HttpError) {
                statusCode = error.statusCode as StatusCode;
                response = {
                    error: error.name,
                    message: error.expose ? error.message : 'An error occurred',
                    code: error.code,
                };

                if (error.expose && error.details) {
                    response.details = error.details;
                }

                if (error instanceof ValidationError) {
                    response.errors = error.errors;
                }

                if (error instanceof RateLimitError) {
                    c.header('Retry-After', String(error.retryAfter));
                }
            }

            if (stack && (error as Error).stack) {
                response.stack = (error as Error).stack;
            }

            if (transform) {
                response = transform(error as Error, c);
            }

            return c.json(response, statusCode);
        }
    };
}

// ============================================================================
// Request Logger
// ============================================================================

export interface LoggerOptions {
    /** Skip logging for certain paths */
    skip?: (c: Context) => boolean;
    /** Custom log format */
    format?: (c: Context, duration: number, status: number) => string;
    /** Log function */
    log?: (message: string) => void;
}

/**
 * Request logger middleware
 */
export function logger(options: LoggerOptions = {}): MiddlewareHandler {
    const {
        skip,
        format,
        log: logFn = console.log,
    } = options;

    return async (c: Context, next: Next) => {
        if (skip && skip(c)) {
            return next();
        }

        const start = Date.now();

        await next();

        const duration = Date.now() - start;
        const status = c.res.status;

        if (format) {
            logFn(format(c, duration, status));
        } else {
            const method = c.req.method;
            const path = new URL(c.req.url).pathname;
            logFn(`${method} ${path} ${status} ${duration}ms`);
        }
    };
}

// ============================================================================
// API Helpers
// ============================================================================

export interface ApiContext<TBody = any, TQuery = any, TParams = any> {
    body: TBody;
    query: TQuery;
    params: TParams;
    c: Context;
    session?: SessionData;
    user?: any;
}

export type ApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any> =
    (ctx: ApiContext<TBody, TQuery, TParams>) => Promise<TResponse>;

/**
 * Create typed API handler
 */
export function createHandler<TBody = any, TQuery = any, TParams = any, TResponse = any>(
    handler: ApiHandler<TBody, TQuery, TParams, TResponse>
): MiddlewareHandler {
    return async (c: Context) => {
        const ctx: ApiContext<TBody, TQuery, TParams> = {
            body: await c.req.json<TBody>().catch(() => ({} as TBody)),
            query: c.req.query() as TQuery,
            params: c.req.param() as TParams,
            c,
            session: c.get('session'),
            user: c.get('user'),
        };

        const result = await handler(ctx);
        return c.json(result);
    };
}

/**
 * Create API routes factory
 */
export function createApi<E extends Env = Env>(app: Hono<E>, prefix = '/api') {
    return {
        get: <TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<never, TQuery, TParams, TResponse>
        ) => {
            app.get(`${prefix}${path}`, createHandler(handler));
        },

        post: <TBody = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TBody, TQuery, TParams, TResponse>
        ) => {
            app.post(`${prefix}${path}`, createHandler(handler));
        },

        put: <TBody = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TBody, TQuery, TParams, TResponse>
        ) => {
            app.put(`${prefix}${path}`, createHandler(handler));
        },

        patch: <TBody = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TBody, TQuery, TParams, TResponse>
        ) => {
            app.patch(`${prefix}${path}`, createHandler(handler));
        },

        delete: <TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<never, TQuery, TParams, TResponse>
        ) => {
            app.delete(`${prefix}${path}`, createHandler(handler));
        },
    };
}

// ============================================================================
// Response Helpers
// ============================================================================

/** Standard success response */
export function success<T>(data: T, message?: string): { success: true; data: T; message?: string } {
    return message ? { success: true, data, message } : { success: true, data };
}

/** Paginated response */
export function paginated<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number
): { data: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } } {
    const totalPages = Math.ceil(total / pageSize);
    return {
        data: items,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/** Created response with location */
export function created<T>(data: T, location?: string): { success: true; data: T; location?: string } {
    return location ? { success: true, data, location } : { success: true, data };
}

// ============================================================================
// Request Helpers
// ============================================================================

/** Parse pagination from query */
export function parsePagination(
    query: Record<string, string>,
    defaults: { page?: number; pageSize?: number; maxPageSize?: number } = {}
): { page: number; pageSize: number; offset: number } {
    const { page: defaultPage = 1, pageSize: defaultPageSize = 20, maxPageSize = 100 } = defaults;

    const page = Math.max(1, parseInt(query.page as string, 10) || defaultPage);
    const pageSize = Math.min(
        maxPageSize,
        Math.max(1, parseInt(query.pageSize || query.limit, 10) || defaultPageSize)
    );
    const offset = (page - 1) * pageSize;

    return { page, pageSize, offset };
}

/** Parse sort from query */
export function parseSort(
    query: Record<string, string>,
    allowedFields: string[],
    defaultSort?: { field: string; order: 'asc' | 'desc' }
): { field: string; order: 'asc' | 'desc' } | null {
    const sortField = query.sortBy || query.sort;
    const sortOrder = (query.sortOrder || query.order || 'asc').toLowerCase();

    if (!sortField) {
        return defaultSort || null;
    }

    const field = sortField.startsWith('-') ? sortField.slice(1) : sortField;
    const order = sortField.startsWith('-') ? 'desc' : (sortOrder === 'desc' ? 'desc' : 'asc');

    if (!allowedFields.includes(field)) {
        return defaultSort || null;
    }

    return { field, order };
}

// ============================================================================
// SSE (Server-Sent Events)
// ============================================================================

/**
 * Create SSE response
 */
export function sse(
    c: Context,
    eventStream: AsyncIterable<SSEEvent>,
    options: SSEOptions = {}
): Response {
    const { retry = 3000, keepAlive = 30000 } = options;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Send retry interval
            controller.enqueue(encoder.encode(`retry: ${retry}\n\n`));

            // Heartbeat
            let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
            if (keepAlive > 0) {
                heartbeatTimer = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(':heartbeat\n\n'));
                    } catch {
                        if (heartbeatTimer) clearInterval(heartbeatTimer);
                    }
                }, keepAlive);
            }

            try {
                for await (const event of eventStream) {
                    let message = '';

                    if (event.id) {
                        message += `id: ${event.id}\n`;
                    }

                    if (event.event) {
                        message += `event: ${event.event}\n`;
                    }

                    if (event.retry !== undefined) {
                        message += `retry: ${event.retry}\n`;
                    }

                    const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
                    message += `data: ${data}\n\n`;

                    controller.enqueue(encoder.encode(message));
                }
            } catch (error) {
                console.error('SSE Error:', error);
            } finally {
                if (heartbeatTimer) clearInterval(heartbeatTimer);
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}

/**
 * Create SSE stream from signal polling
 */
export function createSignalStream(
    getSignalValue: () => any,
    options: { interval?: number; includeInitial?: boolean } = {}
): AsyncIterable<SSEEvent> {
    const { interval = 100, includeInitial = true } = options;

    return {
        async *[Symbol.asyncIterator]() {
            let lastValue = includeInitial ? undefined : getSignalValue();

            if (includeInitial) {
                yield { event: 'initial', data: getSignalValue() };
            }

            while (true) {
                await new Promise(resolve => setTimeout(resolve, interval));
                const currentValue = getSignalValue();

                if (JSON.stringify(currentValue) !== JSON.stringify(lastValue)) {
                    lastValue = currentValue;
                    yield { event: 'update', data: currentValue };
                }
            }
        },
    };
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckOptions {
    /** Health check path */
    path?: string;
    /** Readiness path */
    readinessPath?: string;
    /** Liveness path */
    livenessPath?: string;
    /** Custom checks */
    checks?: Record<string, () => Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; message?: string }>>;
}

/**
 * Register health check routes
 */
export function healthCheck<E extends Env = Env>(app: Hono<E>, options: HealthCheckOptions = {}): void {
    const {
        path = '/health',
        readinessPath = '/health/ready',
        livenessPath = '/health/live',
        checks = {},
    } = options;

    const runChecks = async () => {
        const results: Record<string, any> = {};
        let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

        for (const [name, check] of Object.entries(checks)) {
            const start = Date.now();
            try {
                const result = await check();
                results[name] = { ...result, latency: Date.now() - start };

                if (result.status === 'unhealthy') overallStatus = 'unhealthy';
                else if (result.status === 'degraded' && overallStatus !== 'unhealthy') overallStatus = 'degraded';
            } catch (error) {
                results[name] = {
                    status: 'unhealthy',
                    message: (error as Error).message,
                    latency: Date.now() - start,
                };
                overallStatus = 'unhealthy';
            }
        }

        return { status: overallStatus, checks: results };
    };

    // Main health endpoint
    app.get(path, async (c) => {
        const { status, checks: checkResults } = await runChecks();
        return c.json(
            { status, timestamp: new Date().toISOString(), checks: checkResults },
            status === 'unhealthy' ? 503 : 200
        );
    });

    // Liveness
    app.get(livenessPath, (c) => {
        return c.json({ status: 'alive', timestamp: new Date().toISOString() });
    });

    // Readiness
    app.get(readinessPath, async (c) => {
        const { status } = await runChecks();
        if (status === 'unhealthy') {
            return c.json({ status: 'not ready', timestamp: new Date().toISOString() }, 503);
        }
        return c.json({ status: 'ready', timestamp: new Date().toISOString() });
    });
}

// ============================================================================
// Validation Helpers
// ============================================================================

export interface ValidationSchema<T> {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties?: Record<string, ValidationSchema<any>>;
    items?: ValidationSchema<any>;
    required?: string[];
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: T[];
    default?: T;
}

/**
 * Validate data against schema
 */
export function validate<T>(
    data: any,
    schema: ValidationSchema<T>
): { valid: boolean; errors: string[]; value: T | null } {
    const validationErrors: string[] = [];

    const validateValue = (value: any, s: ValidationSchema<any>, path: string): any => {
        if (value === undefined || value === null) {
            if (s.default !== undefined) return s.default;
            return value;
        }

        switch (s.type) {
            case 'string':
                if (typeof value !== 'string') {
                    validationErrors.push(`${path}: expected string`);
                    return value;
                }
                if (s.minLength !== undefined && value.length < s.minLength) {
                    validationErrors.push(`${path}: minimum length is ${s.minLength}`);
                }
                if (s.maxLength !== undefined && value.length > s.maxLength) {
                    validationErrors.push(`${path}: maximum length is ${s.maxLength}`);
                }
                if (s.pattern && !new RegExp(s.pattern).test(value)) {
                    validationErrors.push(`${path}: does not match pattern`);
                }
                if (s.enum && !s.enum.includes(value)) {
                    validationErrors.push(`${path}: must be one of ${s.enum.join(', ')}`);
                }
                break;

            case 'number':
                const num = typeof value === 'string' ? parseFloat(value) : value;
                if (typeof num !== 'number' || isNaN(num)) {
                    validationErrors.push(`${path}: expected number`);
                    return value;
                }
                if (s.min !== undefined && num < s.min) {
                    validationErrors.push(`${path}: minimum is ${s.min}`);
                }
                if (s.max !== undefined && num > s.max) {
                    validationErrors.push(`${path}: maximum is ${s.max}`);
                }
                return num;

            case 'boolean':
                if (typeof value === 'string') {
                    return value === 'true' || value === '1';
                }
                if (typeof value !== 'boolean') {
                    validationErrors.push(`${path}: expected boolean`);
                }
                break;

            case 'array':
                if (!Array.isArray(value)) {
                    validationErrors.push(`${path}: expected array`);
                    return value;
                }
                if (s.items) {
                    return value.map((item, i) => validateValue(item, s.items!, `${path}[${i}]`));
                }
                break;

            case 'object':
                if (typeof value !== 'object' || value === null) {
                    validationErrors.push(`${path}: expected object`);
                    return value;
                }

                const result: any = {};

                if (s.required) {
                    for (const field of s.required) {
                        if (value[field] === undefined) {
                            validationErrors.push(`${path}.${field}: required`);
                        }
                    }
                }

                if (s.properties) {
                    for (const [key, propSchema] of Object.entries(s.properties)) {
                        result[key] = validateValue(value[key], propSchema, `${path}.${key}`);
                    }
                }

                return result;
        }

        return value;
    };

    const value = validateValue(data, schema, 'root');

    return {
        valid: validationErrors.length === 0,
        errors: validationErrors,
        value: validationErrors.length === 0 ? value : null,
    };
}

/**
 * Validation middleware
 */
export function validateBody<T>(schema: ValidationSchema<T>): MiddlewareHandler {
    return async (c: Context, next: Next) => {
        const body = await c.req.json().catch(() => ({}));
        const result = validate(body, schema);

        if (!result.valid) {
            throw new ValidationError(
                result.errors.map(e => {
                    const [field, ...message] = e.split(':');
                    return { field: field.replace('root.', ''), message: message.join(':').trim() };
                })
            );
        }

        c.set('validatedBody', result.value);
        return next();
    };
}

// ============================================================================
// Context Helpers
// ============================================================================

/** Create render context from Hono context */
export function createRenderContext(c: Context): RenderContext {
    const url = new URL(c.req.url);

    return {
        url: c.req.url,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        headers: Object.fromEntries(c.req.raw.headers),
        cookies: parseCookies(c.req.header('cookie')),
        state: {},
        signals: {},
        meta: {},
        env: (c as any).env,
    };
}

// ============================================================================
// Type Augmentation
// ============================================================================

declare module 'hono' {
    interface ContextVariableMap {
        philjsContext: RenderContext;
        session: SessionData;
        sessionId: string;
        validatedBody: any;
        user: any;
    }
}

// ============================================================================
// Exports
// ============================================================================

export default philjs;

// Re-export Hono types
export type { MiddlewareHandler, Context, Hono, Next, Env };

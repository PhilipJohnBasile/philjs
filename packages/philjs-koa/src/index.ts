/**
 * PhilJS Koa Middleware
 *
 * Comprehensive Koa integration for PhilJS SSR applications.
 * Provides SSR middleware, API helpers, security, session management, and more.
 */

import type { Context, Middleware, Next, ParameterizedContext, DefaultState, DefaultContext } from 'koa';
import type { Server } from 'http';
import type { Readable } from 'stream';
import { createHmac as cryptoCreateHmac } from 'crypto';

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
    /** SSR render function */
    render: (url: string, context: RenderContext) => Promise<string | SSRResult>;
    /** Streaming render function */
    streamRender?: (url: string, context: RenderContext) => Promise<Readable | ReadableStream<string>>;
    /** Routes to exclude from SSR */
    excludeRoutes?: string[];
    /** Routes to include (if set, only these routes use SSR) */
    includeRoutes?: string[];
    /** Enable streaming SSR */
    streaming?: boolean;
    /** Custom error handler */
    onError?: (error: Error, ctx: Context) => void | Promise<void>;
    /** Pre-render hook */
    beforeRender?: (context: RenderContext, ctx: Context) => void | Promise<void>;
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
    /** Cache store (defaults to in-memory) */
    store?: CacheStore;
    /** Routes to cache */
    routes?: string[];
    /** Routes to never cache */
    excludeRoutes?: string[];
}

export interface CacheStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

export interface RateLimitOptions {
    /** Maximum requests per window */
    max: number;
    /** Time window in milliseconds */
    window?: number;
    /** Key generator */
    keyGenerator?: (ctx: Context) => string;
    /** Skip function */
    skip?: (ctx: Context) => boolean;
    /** Rate limit exceeded handler */
    onExceeded?: (ctx: Context) => void;
    /** Store for rate limit data */
    store?: RateLimitStore;
    /** Add rate limit headers */
    headers?: boolean;
}

export interface RateLimitStore {
    increment(key: string, window: number): Promise<{ current: number; ttl: number }>;
    reset(key: string): Promise<void>;
}

export interface CorsOptions {
    /** Allowed origins */
    origin?: string | string[] | boolean | ((origin: string, ctx: Context) => boolean | string);
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
    /** X-XSS-Protection */
    xssProtection?: boolean;
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
    /** Session store */
    store?: SessionStore;
    /** Generate session ID */
    generateId?: () => string;
    /** Rolling sessions (reset expiry on each request) */
    rolling?: boolean;
}

export interface SessionCookieOptions {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    signed?: boolean;
}

export interface SessionStore {
    get(id: string): Promise<SessionData | null>;
    set(id: string, data: SessionData, ttl?: number): Promise<void>;
    destroy(id: string): Promise<void>;
    touch(id: string, ttl?: number): Promise<void>;
}

export interface SessionData {
    [key: string]: any;
}

export interface HealthCheckOptions {
    /** Health check path */
    path?: string;
    /** Readiness check path */
    readinessPath?: string;
    /** Liveness check path */
    livenessPath?: string;
    /** Custom health checks */
    checks?: Record<string, () => Promise<HealthCheckResult>>;
    /** Include system info */
    includeSystemInfo?: boolean;
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    details?: Record<string, any>;
    latency?: number;
}

export interface GracefulShutdownOptions {
    /** Timeout before forceful shutdown */
    timeout?: number;
    /** Signals to listen for */
    signals?: NodeJS.Signals[];
    /** Pre-shutdown hook */
    beforeShutdown?: () => Promise<void>;
    /** On shutdown complete */
    onShutdown?: () => void;
}

export interface LoggerOptions {
    /** Log level */
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    /** Skip logging for certain routes */
    skip?: (ctx: Context) => boolean;
    /** Custom log format */
    format?: (ctx: Context, duration: number) => string;
    /** Log function */
    log?: (message: string) => void;
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
    /** Heartbeat message */
    heartbeat?: string;
}

// ============================================================================
// Error Classes
// ============================================================================

export class HttpError extends Error {
    status: number;
    statusCode: number;
    code?: string;
    details?: any;
    expose: boolean;

    constructor(status: number, message: string, options?: { code?: string; details?: any; expose?: boolean }) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.statusCode = status;
        this.code = options?.code;
        this.details = options?.details;
        this.expose = options?.expose ?? status < 500;
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

export class ConflictError extends HttpError {
    constructor(message = 'Resource conflict') {
        super(409, message, { code: 'CONFLICT' });
        this.name = 'ConflictError';
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
    conflict: (message = 'Conflict') => new ConflictError(message),
    gone: (message = 'Resource no longer available') => new HttpError(410, message, { code: 'GONE' }),
    unprocessable: (message: string, details?: any) => new HttpError(422, message, { code: 'UNPROCESSABLE_ENTITY', details }),
    tooManyRequests: (retryAfter: number) => new RateLimitError(retryAfter),
    internal: (message = 'Internal server error') => new HttpError(500, message, { code: 'INTERNAL_ERROR', expose: false }),
    notImplemented: (feature?: string) => new HttpError(501, feature ? `${feature} not implemented` : 'Not implemented', { code: 'NOT_IMPLEMENTED' }),
    badGateway: (message = 'Bad gateway') => new HttpError(502, message, { code: 'BAD_GATEWAY', expose: false }),
    serviceUnavailable: (message = 'Service unavailable') => new HttpError(503, message, { code: 'SERVICE_UNAVAILABLE', expose: false }),
    gatewayTimeout: (message = 'Gateway timeout') => new HttpError(504, message, { code: 'GATEWAY_TIMEOUT', expose: false }),
};

// ============================================================================
// In-Memory Stores
// ============================================================================

class InMemoryCacheStore implements CacheStore {
    private cache = new Map<string, { value: string; expires: number }>();

    async get(key: string): Promise<string | null> {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key: string, value: string, ttl = 3600): Promise<void> {
        this.cache.set(key, { value, expires: Date.now() + ttl * 1000 });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }
}

class InMemoryRateLimitStore implements RateLimitStore {
    private data = new Map<string, { count: number; expires: number }>();

    async increment(key: string, window: number): Promise<{ current: number; ttl: number }> {
        const now = Date.now();
        const entry = this.data.get(key);

        if (!entry || now > entry.expires) {
            this.data.set(key, { count: 1, expires: now + window });
            return { current: 1, ttl: window };
        }

        entry.count++;
        return { current: entry.count, ttl: entry.expires - now };
    }

    async reset(key: string): Promise<void> {
        this.data.delete(key);
    }
}

class InMemorySessionStore implements SessionStore {
    private sessions = new Map<string, { data: SessionData; expires: number }>();

    async get(id: string): Promise<SessionData | null> {
        const entry = this.sessions.get(id);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            this.sessions.delete(id);
            return null;
        }
        return entry.data;
    }

    async set(id: string, data: SessionData, ttl = 86400): Promise<void> {
        this.sessions.set(id, { data, expires: Date.now() + ttl * 1000 });
    }

    async destroy(id: string): Promise<void> {
        this.sessions.delete(id);
    }

    async touch(id: string, ttl = 86400): Promise<void> {
        const entry = this.sessions.get(id);
        if (entry) {
            entry.expires = Date.now() + ttl * 1000;
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Parse cookies from header */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
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

/** Create HMAC signature using Node.js crypto */
function createHmac(secret: string, value: string): string {
    return cryptoCreateHmac('sha256', secret).update(value).digest('hex');
}

/** Generate unique ID */
function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================================
// Core Middleware
// ============================================================================

/**
 * PhilJS SSR middleware for Koa
 *
 * @example
 * ```ts
 * import Koa from 'koa';
 * import { philjsMiddleware } from '@philjs/koa';
 * import { render } from './entry-server';
 *
 * const app = new Koa();
 *
 * app.use(philjsMiddleware({
 *   render: async (url, ctx) => render(url, ctx),
 *   excludeRoutes: ['/api', '/assets'],
 * }));
 *
 * app.listen(3000);
 * ```
 */
export function philjsMiddleware(options: PhilJSMiddlewareOptions): Middleware {
    const {
        render,
        streamRender,
        excludeRoutes = ['/api', '/assets', '/health', '/_'],
        includeRoutes,
        streaming = false,
        onError,
        beforeRender,
        afterRender,
        template,
        cache,
    } = options;

    // Initialize cache
    const cacheStore = cache?.enabled ? (cache.store || new InMemoryCacheStore()) : null;

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

    return async (ctx: Context, next: Next) => {
        // Skip non-SSR routes
        if (!shouldSSR(ctx.path)) {
            return next();
        }

        // Skip non-GET requests
        if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
            return next();
        }

        // Skip non-HTML requests
        const accept = ctx.get('accept') || '';
        if (!accept.includes('text/html') && !accept.includes('*/*')) {
            return next();
        }

        try {
            const renderContext: RenderContext = {
                url: ctx.url,
                path: ctx.path,
                query: ctx.query as Record<string, string>,
                headers: ctx.headers as Record<string, string>,
                cookies: parseCookies(ctx.get('cookie')),
                state: ctx.state || {},
                signals: {},
                meta: {},
            };

            // Store context for later access
            ctx.state.philjsContext = renderContext;

            // Check cache
            if (shouldCache(ctx.path) && cacheStore) {
                const cacheKey = getCacheKey(ctx.url, renderContext);
                const cached = await cacheStore.get(cacheKey);
                if (cached) {
                    ctx.set('X-Cache', 'HIT');
                    ctx.type = 'text/html';
                    ctx.body = cached;
                    return;
                }
                ctx.set('X-Cache', 'MISS');
            }

            // Streaming SSR
            if (streaming && streamRender) {
                if (beforeRender) {
                    await beforeRender(renderContext, ctx);
                }

                const stream = await streamRender(ctx.url, renderContext);

                ctx.type = 'text/html';
                ctx.set('Transfer-Encoding', 'chunked');
                ctx.set('X-Content-Type-Options', 'nosniff');

                if ('getReader' in stream) {
                    // Web Streams API
                    const reader = (stream as ReadableStream<string>).getReader();
                    const { Readable } = await import('stream');

                    ctx.body = new Readable({
                        async read() {
                            const { done, value } = await reader.read();
                            if (done) {
                                this.push(null);
                            } else {
                                this.push(value);
                            }
                        },
                    });
                } else {
                    ctx.body = stream;
                }
                return;
            }

            // Regular SSR
            if (beforeRender) {
                await beforeRender(renderContext, ctx);
            }

            const result = await render(ctx.url, renderContext);

            if (afterRender) {
                await afterRender(result, renderContext);
            }

            let html: string;
            let statusCode = 200;

            if (typeof result === 'string') {
                html = result;
            } else {
                if (result.redirect) {
                    ctx.redirect(result.redirect);
                    ctx.status = result.statusCode || 302;
                    return;
                }

                if (result.headers) {
                    for (const [key, value] of Object.entries(result.headers)) {
                        ctx.set(key, value);
                    }
                }

                html = result.html;
                statusCode = result.statusCode || 200;
            }

            // Apply template
            if (template) {
                html = template.replace('<!--ssr-outlet-->', html);
            }

            // Cache the response
            if (shouldCache(ctx.path) && cacheStore && statusCode === 200) {
                const cacheKey = getCacheKey(ctx.url, renderContext);
                await cacheStore.set(cacheKey, html, cache?.ttl || 300);
            }

            ctx.status = statusCode;
            ctx.type = 'text/html';
            ctx.body = html;
        } catch (error) {
            if (onError) {
                await onError(error as Error, ctx);
            } else {
                console.error('PhilJS SSR Error:', error);
                ctx.status = 500;
                ctx.body = 'Internal Server Error';
            }
        }
    };
}

// ============================================================================
// Security Middleware
// ============================================================================

/**
 * Security headers middleware
 */
export function security(options: SecurityOptions = {}): Middleware {
    const {
        csp,
        frameOptions = 'SAMEORIGIN',
        contentTypeOptions = true,
        xssProtection = true,
        referrerPolicy = 'strict-origin-when-cross-origin',
        hsts,
        permissionsPolicy,
        crossOrigin = {},
    } = options;

    return async (ctx: Context, next: Next) => {
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
                ctx.set('Content-Security-Policy', directives.join('; '));
            }
        }

        // X-Frame-Options
        if (frameOptions !== false) {
            ctx.set('X-Frame-Options', frameOptions);
        }

        // X-Content-Type-Options
        if (contentTypeOptions) {
            ctx.set('X-Content-Type-Options', 'nosniff');
        }

        // X-XSS-Protection
        if (xssProtection) {
            ctx.set('X-XSS-Protection', '1; mode=block');
        }

        // Referrer-Policy
        if (referrerPolicy !== false) {
            ctx.set('Referrer-Policy', referrerPolicy);
        }

        // HSTS
        if (hsts !== false && hsts) {
            let value = `max-age=${hsts.maxAge}`;
            if (hsts.includeSubDomains) value += '; includeSubDomains';
            if (hsts.preload) value += '; preload';
            ctx.set('Strict-Transport-Security', value);
        }

        // Permissions-Policy
        if (permissionsPolicy !== false && permissionsPolicy) {
            const directives = Object.entries(permissionsPolicy)
                .map(([key, values]) => `${key}=(${values.join(' ')})`)
                .join(', ');
            ctx.set('Permissions-Policy', directives);
        }

        // Cross-Origin policies
        if (crossOrigin.embedderPolicy !== false && crossOrigin.embedderPolicy) {
            ctx.set('Cross-Origin-Embedder-Policy', crossOrigin.embedderPolicy);
        }
        if (crossOrigin.openerPolicy !== false && crossOrigin.openerPolicy) {
            ctx.set('Cross-Origin-Opener-Policy', crossOrigin.openerPolicy);
        }
        if (crossOrigin.resourcePolicy !== false && crossOrigin.resourcePolicy) {
            ctx.set('Cross-Origin-Resource-Policy', crossOrigin.resourcePolicy);
        }
    };
}

// ============================================================================
// CORS Middleware
// ============================================================================

/**
 * CORS middleware
 */
export function cors(options: CorsOptions = {}): Middleware {
    const {
        origin = '*',
        methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders,
        exposedHeaders,
        credentials = false,
        maxAge = 86400,
    } = options;

    const resolveOrigin = (requestOrigin: string | undefined, ctx: Context): string | null => {
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
            const result = origin(requestOrigin, ctx);
            if (typeof result === 'boolean') {
                return result ? requestOrigin : null;
            }
            return result;
        }

        return null;
    };

    return async (ctx: Context, next: Next) => {
        const requestOrigin = ctx.get('origin');
        const resolvedOrigin = resolveOrigin(requestOrigin, ctx);

        // Handle preflight
        if (ctx.method === 'OPTIONS') {
            if (!resolvedOrigin) {
                ctx.status = 403;
                ctx.body = { error: 'Origin not allowed' };
                return;
            }

            ctx.set('Access-Control-Allow-Origin', resolvedOrigin);
            ctx.set('Access-Control-Allow-Methods', methods.join(', '));

            if (allowedHeaders) {
                ctx.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            } else {
                const requestHeaders = ctx.get('access-control-request-headers');
                if (requestHeaders) {
                    ctx.set('Access-Control-Allow-Headers', requestHeaders);
                }
            }

            if (credentials) {
                ctx.set('Access-Control-Allow-Credentials', 'true');
            }

            if (maxAge) {
                ctx.set('Access-Control-Max-Age', String(maxAge));
            }

            ctx.status = 204;
            return;
        }

        await next();

        if (resolvedOrigin) {
            ctx.set('Access-Control-Allow-Origin', resolvedOrigin);

            if (credentials) {
                ctx.set('Access-Control-Allow-Credentials', 'true');
            }

            if (exposedHeaders && exposedHeaders.length > 0) {
                ctx.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
            }

            if (resolvedOrigin !== '*') {
                ctx.set('Vary', 'Origin');
            }
        }
    };
}

// ============================================================================
// Rate Limiting Middleware
// ============================================================================

/**
 * Rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions): Middleware {
    const {
        max = 100,
        window = 60000,
        keyGenerator = (ctx) => ctx.ip,
        skip,
        onExceeded,
        store = new InMemoryRateLimitStore(),
        headers = true,
    } = options;

    return async (ctx: Context, next: Next) => {
        if (skip && skip(ctx)) {
            return next();
        }

        const key = `ratelimit:${keyGenerator(ctx)}`;
        const result = await store.increment(key, window);

        if (headers) {
            ctx.set('X-RateLimit-Limit', String(max));
            ctx.set('X-RateLimit-Remaining', String(Math.max(0, max - result.current)));
            ctx.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + result.ttl) / 1000)));
        }

        if (result.current > max) {
            const retryAfter = Math.ceil(result.ttl / 1000);
            ctx.set('Retry-After', String(retryAfter));

            if (onExceeded) {
                onExceeded(ctx);
            } else {
                throw new RateLimitError(retryAfter);
            }
            return;
        }

        return next();
    };
}

// ============================================================================
// Session Middleware
// ============================================================================

/**
 * Session middleware
 */
export function session(options: SessionOptions): Middleware {
    const {
        secret,
        cookieName = 'session',
        cookie = {},
        store = new InMemorySessionStore(),
        generateId: customGenerateId = generateId,
        rolling = false,
    } = options;

    const cookieOptions: SessionCookieOptions = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400,
        ...cookie,
    };

    const sign = (value: string): string => `${value}.${createHmac(secret, value)}`;

    const unsign = (signedValue: string): string | null => {
        const parts = signedValue.split('.');
        if (parts.length !== 2) return null;

        const [value, signature] = parts;
        if (signature !== createHmac(secret, value)) return null;
        return value;
    };

    return async (ctx: Context, next: Next) => {
        const cookies = parseCookies(ctx.get('cookie'));
        const signedSessionId = cookies[cookieName];

        let sessionId: string | null = null;
        let sessionData: SessionData = {};

        if (signedSessionId) {
            sessionId = unsign(signedSessionId);

            if (sessionId) {
                const data = await store.get(sessionId);
                if (data) {
                    sessionData = data;
                } else {
                    sessionId = null;
                }
            }
        }

        if (!sessionId) {
            sessionId = customGenerateId();
            sessionData = {};
        }

        ctx.state.sessionId = sessionId;
        ctx.state.session = sessionData;

        await next();

        // Save session
        const currentSessionId = ctx.state.sessionId;
        const currentSession = ctx.state.session;

        if (currentSessionId && currentSession) {
            await store.set(currentSessionId, currentSession, cookieOptions.maxAge);

            // Set cookie
            const signedId = sign(currentSessionId);
            const cookieParts = [`${cookieName}=${signedId}`];

            if (cookieOptions.path) cookieParts.push(`Path=${cookieOptions.path}`);
            if (cookieOptions.domain) cookieParts.push(`Domain=${cookieOptions.domain}`);
            if (cookieOptions.maxAge) cookieParts.push(`Max-Age=${cookieOptions.maxAge}`);
            if (cookieOptions.expires) cookieParts.push(`Expires=${cookieOptions.expires.toUTCString()}`);
            if (cookieOptions.secure) cookieParts.push('Secure');
            if (cookieOptions.httpOnly) cookieParts.push('HttpOnly');
            if (cookieOptions.sameSite) cookieParts.push(`SameSite=${cookieOptions.sameSite}`);

            ctx.set('Set-Cookie', cookieParts.join('; '));
        }
    };
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

export interface ErrorHandlerOptions {
    /** Log errors */
    log?: boolean;
    /** Include stack trace in development */
    stack?: boolean;
    /** Custom error transformer */
    transform?: (error: Error, ctx: Context) => any;
    /** Handle specific error types */
    handlers?: Record<string, (error: Error, ctx: Context) => void | Promise<void>>;
}

/**
 * Error handler middleware
 */
export function errorHandler(options: ErrorHandlerOptions = {}): Middleware {
    const {
        log = true,
        stack = process.env.NODE_ENV !== 'production',
        transform,
        handlers = {},
    } = options;

    return async (ctx: Context, next: Next) => {
        try {
            await next();
        } catch (error: any) {
            // Check for custom handler
            if (handlers[error.name]) {
                await handlers[error.name](error, ctx);
                return;
            }

            if (log) {
                if (error.status && error.status < 500) {
                    console.warn('Client Error:', error.message);
                } else {
                    console.error('Server Error:', error);
                }
            }

            let statusCode = 500;
            let response: any = {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
            };

            if (error instanceof HttpError) {
                statusCode = error.status;
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
                    ctx.set('Retry-After', String(error.retryAfter));
                }
            } else if (error.status) {
                statusCode = error.status;
                response = {
                    error: error.name || 'Error',
                    message: error.message,
                };
            }

            if (stack && statusCode >= 500) {
                response.stack = error.stack;
            }

            if (transform) {
                response = transform(error, ctx);
            }

            ctx.status = statusCode;
            ctx.body = response;
        }
    };
}

// ============================================================================
// Logger Middleware
// ============================================================================

/**
 * Request logger middleware
 */
export function logger(options: LoggerOptions = {}): Middleware {
    const {
        skip,
        format,
        log: logFn = console.log,
    } = options;

    return async (ctx: Context, next: Next) => {
        if (skip && skip(ctx)) {
            return next();
        }

        const start = Date.now();

        await next();

        const duration = Date.now() - start;

        if (format) {
            logFn(format(ctx, duration));
        } else {
            const status = ctx.status;
            const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
            logFn(`${ctx.method} ${ctx.path} ${statusColor}${status}\x1b[0m ${duration}ms`);
        }
    };
}

// ============================================================================
// Health Check Middleware
// ============================================================================

/**
 * Health check middleware
 */
export function healthCheck(options: HealthCheckOptions = {}): Middleware {
    const {
        path = '/health',
        readinessPath = '/health/ready',
        livenessPath = '/health/live',
        checks = {},
        includeSystemInfo = false,
    } = options;

    const runChecks = async (): Promise<{ status: 'healthy' | 'unhealthy' | 'degraded'; checks: Record<string, HealthCheckResult> }> => {
        const results: Record<string, HealthCheckResult> = {};
        let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

        for (const [name, check] of Object.entries(checks)) {
            const start = Date.now();
            try {
                const result = await check();
                results[name] = { ...result, latency: Date.now() - start };

                if (result.status === 'unhealthy') {
                    overallStatus = 'unhealthy';
                } else if (result.status === 'degraded' && overallStatus !== 'unhealthy') {
                    overallStatus = 'degraded';
                }
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

    return async (ctx: Context, next: Next) => {
        if (ctx.path === path) {
            const { status, checks: checkResults } = await runChecks();

            const response: any = {
                status,
                timestamp: new Date().toISOString(),
                checks: checkResults,
            };

            if (includeSystemInfo) {
                response.system = {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                    version: process.version,
                };
            }

            ctx.status = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
            ctx.body = response;
            return;
        }

        if (ctx.path === livenessPath) {
            ctx.body = { status: 'alive', timestamp: new Date().toISOString() };
            return;
        }

        if (ctx.path === readinessPath) {
            const { status } = await runChecks();

            if (status === 'unhealthy') {
                ctx.status = 503;
                ctx.body = { status: 'not ready', timestamp: new Date().toISOString() };
            } else {
                ctx.body = { status: 'ready', timestamp: new Date().toISOString() };
            }
            return;
        }

        return next();
    };
}

// ============================================================================
// API Helpers
// ============================================================================

export interface ApiHandlerContext<TBody = any, TQuery = any, TParams = any> {
    body: TBody;
    query: TQuery;
    params: TParams;
    ctx: Context;
    session?: SessionData;
    user?: any;
}

export type ApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any> =
    (context: ApiHandlerContext<TBody, TQuery, TParams>) => Promise<TResponse>;

/**
 * Create typed API handler middleware
 */
export function createApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any>(
    handler: ApiHandler<TBody, TQuery, TParams, TResponse>
): Middleware {
    return async (ctx: Context) => {
        const context: ApiHandlerContext<TBody, TQuery, TParams> = {
            body: ctx.request.body as TBody,
            query: ctx.query as TQuery,
            params: ctx.params as TParams,
            ctx,
            session: ctx.state.session,
            user: ctx.state.user,
        };

        const result = await handler(context);
        ctx.body = result;
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

/** Created response */
export function created<T>(ctx: Context, data: T, location?: string): void {
    ctx.status = 201;
    ctx.body = { success: true, data };
    if (location) {
        ctx.set('Location', location);
    }
}

/** No content response */
export function noContent(ctx: Context): void {
    ctx.status = 204;
    ctx.body = null;
}

// ============================================================================
// Request Helpers
// ============================================================================

/** Parse pagination from query */
export function parsePagination(
    query: Record<string, any>,
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
    query: Record<string, any>,
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

/** Create render context from Koa context */
export function createRenderContext(ctx: Context): RenderContext {
    return {
        url: ctx.url,
        path: ctx.path,
        query: ctx.query as Record<string, string>,
        headers: ctx.headers as Record<string, string>,
        cookies: parseCookies(ctx.get('cookie')),
        state: ctx.state || {},
        signals: {},
        meta: {},
    };
}

// ============================================================================
// SSE (Server-Sent Events)
// ============================================================================

/**
 * Send Server-Sent Events
 */
export async function sendSSE(
    ctx: Context,
    eventStream: AsyncIterable<SSEEvent>,
    options: SSEOptions = {}
): Promise<void> {
    const { retry = 3000, keepAlive = 30000, heartbeat = ':heartbeat\n\n' } = options;

    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');
    ctx.set('X-Accel-Buffering', 'no');

    ctx.status = 200;

    const { PassThrough } = await import('stream');
    const stream = new PassThrough();
    ctx.body = stream;

    // Send retry interval
    stream.write(`retry: ${retry}\n\n`);

    // Heartbeat
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    if (keepAlive > 0) {
        heartbeatTimer = setInterval(() => {
            stream.write(heartbeat);
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

            stream.write(message);
        }
    } finally {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
        }
        stream.end();
    }
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
// Stream SSR Helper
// ============================================================================

/**
 * Stream SSR response
 */
export async function streamSSR(ctx: Context, stream: ReadableStream<string> | Readable): Promise<void> {
    ctx.type = 'text/html';
    ctx.set('Transfer-Encoding', 'chunked');
    ctx.set('X-Content-Type-Options', 'nosniff');

    if ('getReader' in stream) {
        const reader = stream.getReader();
        const { PassThrough } = await import('stream');
        const passThrough = new PassThrough();
        ctx.body = passThrough;

        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    passThrough.write(value);
                }
            } finally {
                reader.releaseLock();
                passThrough.end();
            }
        };

        pump();
    } else {
        ctx.body = stream;
    }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Enable graceful shutdown
 */
export function gracefulShutdown(
    server: Server,
    options: GracefulShutdownOptions = {}
): void {
    const {
        timeout = 30000,
        signals = ['SIGTERM', 'SIGINT'],
        beforeShutdown,
        onShutdown,
    } = options;

    let isShuttingDown = false;

    const shutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`Received ${signal}, starting graceful shutdown...`);

        try {
            if (beforeShutdown) {
                await beforeShutdown();
            }

            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error('Shutdown timeout'));
                }, timeout);

                server.close((err) => {
                    clearTimeout(timer);
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log('Graceful shutdown completed');

            if (onShutdown) {
                onShutdown();
            }

            process.exit(0);
        } catch (error) {
            console.error('Error during graceful shutdown:', error);
            process.exit(1);
        }
    };

    for (const signal of signals) {
        process.on(signal, () => shutdown(signal));
    }
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
export function validateBody<T>(schema: ValidationSchema<T>): Middleware {
    return async (ctx: Context, next: Next) => {
        const result = validate(ctx.request.body, schema);

        if (!result.valid) {
            throw new ValidationError(
                result.errors.map(e => {
                    const [field, ...message] = e.split(':');
                    return { field: field.replace('root.', ''), message: message.join(':').trim() };
                })
            );
        }

        ctx.state.validatedBody = result.value;
        return next();
    };
}

// ============================================================================
// Type Augmentation
// ============================================================================

declare module 'koa' {
    interface DefaultState {
        philjsContext?: RenderContext;
        session?: SessionData;
        sessionId?: string;
        validatedBody?: any;
        user?: any;
    }
}

// ============================================================================
// Exports
// ============================================================================

export { philjsMiddleware as philjs };
export default philjsMiddleware;

// Re-export Koa types
export type { Context, Middleware, Next };

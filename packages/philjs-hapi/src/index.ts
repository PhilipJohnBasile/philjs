/**
 * PhilJS Hapi Plugin
 *
 * Comprehensive Hapi.js integration for PhilJS SSR applications.
 * Provides SSR plugin, API helpers, security, authentication, and more.
 */

import type {
    Server,
    Plugin,
    Request,
    ResponseToolkit,
    Lifecycle,
    ServerRoute,
    RouteOptions,
    ServerAuthScheme,
    AuthCredentials,
} from '@hapi/hapi';
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
    auth?: AuthInfo;
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

export interface AuthInfo {
    isAuthenticated: boolean;
    credentials?: any;
    artifacts?: any;
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

export interface PhilJSPluginOptions {
    /** Enable SSR */
    ssr?: boolean;
    /** SSR render function */
    render?: (url: string, context: RenderContext) => Promise<string | SSRResult>;
    /** Streaming render function */
    streamRender?: (url: string, context: RenderContext) => Promise<Readable | ReadableStream<string>>;
    /** Routes to exclude from SSR */
    excludeRoutes?: string[];
    /** Routes to include (if set, only these routes use SSR) */
    includeRoutes?: string[];
    /** Enable streaming SSR */
    streaming?: boolean;
    /** Custom error handler */
    onError?: (error: Error, request: Request, h: ResponseToolkit) => Lifecycle.ReturnValue;
    /** Pre-render hook */
    beforeRender?: (context: RenderContext, request: Request) => void | Promise<void>;
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
    /** TTL in milliseconds */
    ttl?: number;
    /** Cache key generator */
    keyGenerator?: (url: string, context: RenderContext) => string;
    /** Use Hapi's server cache */
    useServerCache?: boolean;
    /** Cache segment name */
    segment?: string;
    /** Routes to cache */
    routes?: string[];
    /** Routes to never cache */
    excludeRoutes?: string[];
}

export interface RateLimitOptions {
    /** Maximum requests per window */
    max: number;
    /** Time window in milliseconds */
    window?: number;
    /** Key generator */
    keyGenerator?: (request: Request) => string;
    /** Skip function */
    skip?: (request: Request) => boolean;
    /** Rate limit exceeded handler */
    onExceeded?: (request: Request, h: ResponseToolkit) => Lifecycle.ReturnValue;
    /** Use Hapi's server cache for storage */
    useServerCache?: boolean;
    /** Cache segment name */
    segment?: string;
    /** Add rate limit headers */
    headers?: boolean;
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

export interface CorsOptions {
    /** Allowed origins */
    origin?: string[];
    /** Allowed methods */
    methods?: string[];
    /** Allowed headers */
    headers?: string[];
    /** Exposed headers */
    exposedHeaders?: string[];
    /** Allow credentials */
    credentials?: boolean;
    /** Max age for preflight cache */
    maxAge?: number;
}

export interface SessionOptions {
    /** Session secret */
    secret: string;
    /** Cookie name */
    cookieName?: string;
    /** Cookie options */
    cookie?: SessionCookieOptions;
    /** Use Hapi's server cache for session storage */
    useServerCache?: boolean;
    /** Cache segment name */
    segment?: string;
    /** Generate session ID */
    generateId?: () => string;
}

export interface SessionCookieOptions {
    path?: string;
    domain?: string;
    ttl?: number;
    isSecure?: boolean;
    isHttpOnly?: boolean;
    isSameSite?: 'Strict' | 'Lax' | 'None' | false;
    clearInvalid?: boolean;
    strictHeader?: boolean;
    encoding?: 'none' | 'base64' | 'base64json' | 'form' | 'iron';
    password?: string;
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
    /** Auth strategy (null for no auth) */
    auth?: string | false;
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    details?: Record<string, any>;
    latency?: number;
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

class InMemoryCache {
    private cache = new Map<string, { value: any; expires: number }>();

    async get(key: string): Promise<any | null> {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key: string, value: any, ttl: number): Promise<void> {
        this.cache.set(key, { value, expires: Date.now() + ttl });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Parse cookies from request state */
function getCookies(request: Request): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (request.state) {
        for (const [key, value] of Object.entries(request.state)) {
            cookies[key] = typeof value === 'string' ? value : JSON.stringify(value);
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
// Core Plugin
// ============================================================================

/**
 * PhilJS Hapi plugin for SSR
 *
 * @example
 * ```ts
 * import Hapi from '@hapi/hapi';
 * import { philjsPlugin } from '@philjs/hapi';
 * import { render } from './entry-server';
 *
 * const server = Hapi.server({ port: 3000 });
 *
 * await server.register({
 *   plugin: philjsPlugin,
 *   options: {
 *     ssr: true,
 *     render: async (url, ctx) => render(url, ctx),
 *     excludeRoutes: ['/api'],
 *   },
 * });
 *
 * await server.start();
 * ```
 */
export const philjsPlugin: Plugin<PhilJSPluginOptions> = {
    name: 'philjs',
    version: '1.0.0',
    register: async (server: Server, options: PhilJSPluginOptions) => {
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

        // Initialize cache
        const ssrCache = cache?.enabled ? new InMemoryCache() : null;

        // Add request decoration
        server.decorate('request', 'philjsContext', null);

        // Helper functions
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

        // Build render context
        const buildRenderContext = (request: Request): RenderContext => {
            return {
                url: request.url.href,
                path: request.path,
                query: request.query as Record<string, string>,
                headers: request.headers as Record<string, string>,
                cookies: getCookies(request),
                state: {},
                signals: {},
                meta: {},
                auth: {
                    isAuthenticated: request.auth.isAuthenticated,
                    credentials: request.auth.credentials,
                    artifacts: request.auth.artifacts,
                },
            };
        };

        // Catch-all SSR route
        if (ssr && (render || streamRender)) {
            server.route({
                method: 'GET',
                path: '/{param*}',
                options: {
                    auth: false,
                },
                handler: async (request: Request, h: ResponseToolkit) => {
                    // Skip non-SSR routes
                    if (!shouldSSR(request.path)) {
                        return h.continue;
                    }

                    // Skip non-HTML requests
                    const accept = request.headers.accept || '';
                    if (!accept.includes('text/html') && !accept.includes('*/*')) {
                        return h.continue;
                    }

                    try {
                        const context = buildRenderContext(request);
                        (request as any).philjsContext = context;

                        // Check cache
                        if (shouldCache(request.path) && ssrCache) {
                            const cacheKey = getCacheKey(request.url.href, context);
                            const cached = await ssrCache.get(cacheKey);
                            if (cached) {
                                return h.response(cached)
                                    .type('text/html')
                                    .header('X-Cache', 'HIT');
                            }
                        }

                        // Streaming SSR
                        if (streaming && streamRender) {
                            if (beforeRender) {
                                await beforeRender(context, request);
                            }

                            const stream = await streamRender(request.url.href, context);

                            if ('getReader' in stream) {
                                // Convert Web Stream to Node Stream
                                const { Readable } = await import('stream');
                                const reader = (stream as ReadableStream<string>).getReader();
                                const nodeStream = new Readable({
                                    async read() {
                                        const { done, value } = await reader.read();
                                        if (done) {
                                            this.push(null);
                                        } else {
                                            this.push(value);
                                        }
                                    },
                                });

                                return h.response(nodeStream)
                                    .type('text/html')
                                    .header('Transfer-Encoding', 'chunked')
                                    .header('X-Content-Type-Options', 'nosniff');
                            }

                            return h.response(stream as Readable)
                                .type('text/html')
                                .header('Transfer-Encoding', 'chunked')
                                .header('X-Content-Type-Options', 'nosniff');
                        }

                        // Regular SSR
                        if (render) {
                            if (beforeRender) {
                                await beforeRender(context, request);
                            }

                            const result = await render(request.url.href, context);

                            if (afterRender) {
                                await afterRender(result, context);
                            }

                            let html: string;
                            let statusCode = 200;
                            const headers: Record<string, string> = {};

                            if (typeof result === 'string') {
                                html = result;
                            } else {
                                if (result.redirect) {
                                    return h.redirect(result.redirect).code(result.statusCode || 302);
                                }

                                if (result.headers) {
                                    Object.assign(headers, result.headers);
                                }

                                html = result.html;
                                statusCode = result.statusCode || 200;
                            }

                            // Apply template
                            if (template) {
                                html = template.replace('<!--ssr-outlet-->', html);
                            }

                            // Cache the response
                            if (shouldCache(request.path) && ssrCache && statusCode === 200) {
                                const cacheKey = getCacheKey(request.url.href, context);
                                await ssrCache.set(cacheKey, html, cache?.ttl || 300000);
                            }

                            let response = h.response(html).code(statusCode).type('text/html');

                            for (const [key, value] of Object.entries(headers)) {
                                response = response.header(key, value);
                            }

                            if (shouldCache(request.path)) {
                                response = response.header('X-Cache', 'MISS');
                            }

                            return response;
                        }

                        return h.continue;
                    } catch (error) {
                        if (onError) {
                            return onError(error as Error, request, h);
                        }

                        server.log(['error', 'ssr'], error);
                        return h.response('Internal Server Error').code(500);
                    }
                },
            });
        }

        // Add server methods
        server.method('philjs.renderContext', buildRenderContext);
    },
};

// ============================================================================
// Security Plugin
// ============================================================================

/**
 * Security headers plugin
 */
export const securityPlugin: Plugin<SecurityOptions> = {
    name: 'philjs-security',
    version: '1.0.0',
    register: async (server: Server, options: SecurityOptions) => {
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

        server.ext('onPreResponse', (request, h) => {
            const response = request.response;
            if ('isBoom' in response && response.isBoom) {
                return h.continue;
            }

            const res = response as any;

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
                    res.header('Content-Security-Policy', directives.join('; '));
                }
            }

            // X-Frame-Options
            if (frameOptions !== false) {
                res.header('X-Frame-Options', frameOptions);
            }

            // X-Content-Type-Options
            if (contentTypeOptions) {
                res.header('X-Content-Type-Options', 'nosniff');
            }

            // X-XSS-Protection
            if (xssProtection) {
                res.header('X-XSS-Protection', '1; mode=block');
            }

            // Referrer-Policy
            if (referrerPolicy !== false) {
                res.header('Referrer-Policy', referrerPolicy);
            }

            // HSTS
            if (hsts !== false && hsts) {
                let value = `max-age=${hsts.maxAge}`;
                if (hsts.includeSubDomains) value += '; includeSubDomains';
                if (hsts.preload) value += '; preload';
                res.header('Strict-Transport-Security', value);
            }

            // Permissions-Policy
            if (permissionsPolicy !== false && permissionsPolicy) {
                const directives = Object.entries(permissionsPolicy)
                    .map(([key, values]) => `${key}=(${values.join(' ')})`)
                    .join(', ');
                res.header('Permissions-Policy', directives);
            }

            // Cross-Origin policies
            if (crossOrigin.embedderPolicy !== false && crossOrigin.embedderPolicy) {
                res.header('Cross-Origin-Embedder-Policy', crossOrigin.embedderPolicy);
            }
            if (crossOrigin.openerPolicy !== false && crossOrigin.openerPolicy) {
                res.header('Cross-Origin-Opener-Policy', crossOrigin.openerPolicy);
            }
            if (crossOrigin.resourcePolicy !== false && crossOrigin.resourcePolicy) {
                res.header('Cross-Origin-Resource-Policy', crossOrigin.resourcePolicy);
            }

            return h.continue;
        });
    },
};

// ============================================================================
// Rate Limiting Plugin
// ============================================================================

/**
 * Rate limiting plugin
 */
export const rateLimitPlugin: Plugin<RateLimitOptions> = {
    name: 'philjs-rate-limit',
    version: '1.0.0',
    register: async (server: Server, options: RateLimitOptions) => {
        const {
            max = 100,
            window = 60000,
            keyGenerator = (request) => request.info.remoteAddress,
            skip,
            onExceeded,
            headers = true,
        } = options;

        const store = new InMemoryCache();

        server.ext('onPreHandler', async (request, h) => {
            if (skip && skip(request)) {
                return h.continue;
            }

            const key = `ratelimit:${keyGenerator(request)}`;
            const now = Date.now();

            let entry = await store.get(key);

            if (!entry || now > entry.expires) {
                entry = { count: 1, expires: now + window };
            } else {
                entry.count++;
            }

            await store.set(key, entry, window);

            const remaining = Math.max(0, max - entry.count);
            const reset = Math.ceil(entry.expires / 1000);
            const ttl = entry.expires - now;

            if (headers) {
                request.app.rateLimitHeaders = {
                    'X-RateLimit-Limit': String(max),
                    'X-RateLimit-Remaining': String(remaining),
                    'X-RateLimit-Reset': String(reset),
                };
            }

            if (entry.count > max) {
                const retryAfter = Math.ceil(ttl / 1000);

                if (onExceeded) {
                    return onExceeded(request, h);
                }

                const response = h.response({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded',
                    retryAfter,
                }).code(429);

                if (headers) {
                    response.header('Retry-After', String(retryAfter));
                    response.header('X-RateLimit-Limit', String(max));
                    response.header('X-RateLimit-Remaining', '0');
                    response.header('X-RateLimit-Reset', String(reset));
                }

                return response.takeover();
            }

            return h.continue;
        });

        // Add rate limit headers to responses
        server.ext('onPreResponse', (request, h) => {
            const response = request.response;
            const rateLimitHeaders = request.app.rateLimitHeaders;

            if (rateLimitHeaders && !('isBoom' in response && response.isBoom)) {
                const res = response as any;
                for (const [key, value] of Object.entries(rateLimitHeaders)) {
                    res.header(key, value);
                }
            }

            return h.continue;
        });
    },
};

// ============================================================================
// Session Plugin
// ============================================================================

/**
 * Session plugin
 */
export const sessionPlugin: Plugin<SessionOptions> = {
    name: 'philjs-session',
    version: '1.0.0',
    register: async (server: Server, options: SessionOptions) => {
        const {
            secret,
            cookieName = 'session',
            cookie = {},
            generateId: customGenerateId = generateId,
        } = options;

        const cookieOptions: SessionCookieOptions = {
            path: '/',
            isHttpOnly: true,
            isSecure: process.env.NODE_ENV === 'production',
            isSameSite: 'Lax',
            ttl: 86400000, // 24 hours
            clearInvalid: true,
            strictHeader: true,
            ...cookie,
        };

        const sessionStore = new InMemoryCache();

        const sign = (value: string): string => `${value}.${createHmac(secret, value)}`;

        const unsign = (signedValue: string): string | null => {
            const parts = signedValue.split('.');
            if (parts.length !== 2) return null;

            const [value, signature] = parts;
            if (signature !== createHmac(secret, value)) return null;
            return value;
        };

        // Register cookie
        server.state(cookieName, {
            ...cookieOptions,
            encoding: 'none',
        });

        // Add session to request
        server.ext('onPreHandler', async (request, h) => {
            const signedSessionId = request.state[cookieName];
            let sessionId: string | null = null;
            let sessionData: SessionData = {};

            if (signedSessionId) {
                sessionId = unsign(signedSessionId);

                if (sessionId) {
                    const data = await sessionStore.get(`session:${sessionId}`);
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

            request.app.sessionId = sessionId;
            request.app.session = sessionData;

            return h.continue;
        });

        // Save session after response
        server.ext('onPreResponse', async (request, h) => {
            const response = request.response;
            const sessionId = request.app.sessionId;
            const session = request.app.session;

            if (sessionId && session && !('isBoom' in response && response.isBoom)) {
                await sessionStore.set(`session:${sessionId}`, session, cookieOptions.ttl || 86400000);
                (response as any).state(cookieName, sign(sessionId));
            }

            return h.continue;
        });

        // Add session methods
        server.decorate('request', 'session', function (this: Request) {
            return this.app.session;
        });

        server.decorate('request', 'sessionId', function (this: Request) {
            return this.app.sessionId;
        });
    },
};

// ============================================================================
// Health Check Plugin
// ============================================================================

/**
 * Health check plugin
 */
export const healthPlugin: Plugin<HealthCheckOptions> = {
    name: 'philjs-health',
    version: '1.0.0',
    register: async (server: Server, options: HealthCheckOptions) => {
        const {
            path = '/health',
            readinessPath = '/health/ready',
            livenessPath = '/health/live',
            checks = {},
            includeSystemInfo = false,
            auth = false,
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

        // Main health endpoint
        server.route({
            method: 'GET',
            path,
            options: {
                auth: auth || false,
                tags: ['api', 'health'],
            },
            handler: async (request, h) => {
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

                return h.response(response)
                    .code(status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503);
            },
        });

        // Liveness endpoint
        server.route({
            method: 'GET',
            path: livenessPath,
            options: {
                auth: auth || false,
                tags: ['api', 'health'],
            },
            handler: (request, h) => {
                return h.response({
                    status: 'alive',
                    timestamp: new Date().toISOString(),
                });
            },
        });

        // Readiness endpoint
        server.route({
            method: 'GET',
            path: readinessPath,
            options: {
                auth: auth || false,
                tags: ['api', 'health'],
            },
            handler: async (request, h) => {
                const { status } = await runChecks();

                if (status === 'unhealthy') {
                    return h.response({
                        status: 'not ready',
                        timestamp: new Date().toISOString(),
                    }).code(503);
                }

                return h.response({
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                });
            },
        });
    },
};

// ============================================================================
// Error Handler Plugin
// ============================================================================

export interface ErrorHandlerOptions {
    /** Log errors */
    log?: boolean;
    /** Include stack trace in development */
    stack?: boolean;
    /** Custom error transformer */
    transform?: (error: Error, request: Request) => any;
}

/**
 * Error handler plugin
 */
export const errorHandlerPlugin: Plugin<ErrorHandlerOptions> = {
    name: 'philjs-error-handler',
    version: '1.0.0',
    register: async (server: Server, options: ErrorHandlerOptions) => {
        const {
            log = true,
            stack = process.env.NODE_ENV !== 'production',
            transform,
        } = options;

        server.ext('onPreResponse', (request, h) => {
            const response = request.response;

            if (!('isBoom' in response) || !response.isBoom) {
                return h.continue;
            }

            const error = response;

            if (log) {
                if (error.output.statusCode < 500) {
                    server.log(['warn', 'error'], { message: error.message, statusCode: error.output.statusCode });
                } else {
                    server.log(['error'], { message: error.message, stack: error.stack });
                }
            }

            let payload: any = {
                error: error.output.payload.error,
                message: error.message,
                statusCode: error.output.statusCode,
            };

            if (error.data) {
                payload.details = error.data;
            }

            if (stack && error.output.statusCode >= 500) {
                payload.stack = error.stack;
            }

            if (transform) {
                payload = transform(error, request);
            }

            return h.response(payload).code(error.output.statusCode);
        });
    },
};

// ============================================================================
// API Helpers
// ============================================================================

export interface ApiHandlerContext<TPayload = any, TQuery = any, TParams = any> {
    payload: TPayload;
    query: TQuery;
    params: TParams;
    request: Request;
    h: ResponseToolkit;
    session?: SessionData;
    auth?: AuthInfo;
}

export type ApiHandler<TPayload = any, TQuery = any, TParams = any, TResponse = any> =
    (ctx: ApiHandlerContext<TPayload, TQuery, TParams>) => Promise<TResponse>;

/**
 * Create typed API handler
 */
export function createHandler<TPayload = any, TQuery = any, TParams = any, TResponse = any>(
    handler: ApiHandler<TPayload, TQuery, TParams, TResponse>
): Lifecycle.Method {
    return async (request: Request, h: ResponseToolkit) => {
        const ctx: ApiHandlerContext<TPayload, TQuery, TParams> = {
            payload: request.payload as TPayload,
            query: request.query as TQuery,
            params: request.params as TParams,
            request,
            h,
            session: request.app.session,
            auth: {
                isAuthenticated: request.auth.isAuthenticated,
                credentials: request.auth.credentials,
                artifacts: request.auth.artifacts,
            },
        };

        const result = await handler(ctx);
        return h.response(result);
    };
}

/**
 * Create API routes helper
 */
export function createApiRoutes(server: Server, prefix = '/api') {
    return {
        get: <TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<never, TQuery, TParams, TResponse>,
            options?: Partial<RouteOptions>
        ) => {
            server.route({
                method: 'GET',
                path: `${prefix}${path}`,
                options: {
                    ...options,
                },
                handler: createHandler(handler),
            });
        },

        post: <TPayload = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TPayload, TQuery, TParams, TResponse>,
            options?: Partial<RouteOptions>
        ) => {
            server.route({
                method: 'POST',
                path: `${prefix}${path}`,
                options: {
                    ...options,
                },
                handler: createHandler(handler),
            });
        },

        put: <TPayload = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TPayload, TQuery, TParams, TResponse>,
            options?: Partial<RouteOptions>
        ) => {
            server.route({
                method: 'PUT',
                path: `${prefix}${path}`,
                options: {
                    ...options,
                },
                handler: createHandler(handler),
            });
        },

        patch: <TPayload = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TPayload, TQuery, TParams, TResponse>,
            options?: Partial<RouteOptions>
        ) => {
            server.route({
                method: 'PATCH',
                path: `${prefix}${path}`,
                options: {
                    ...options,
                },
                handler: createHandler(handler),
            });
        },

        delete: <TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<never, TQuery, TParams, TResponse>,
            options?: Partial<RouteOptions>
        ) => {
            server.route({
                method: 'DELETE',
                path: `${prefix}${path}`,
                options: {
                    ...options,
                },
                handler: createHandler(handler),
            });
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

/** Created response */
export function created<T>(h: ResponseToolkit, data: T, location?: string) {
    let response = h.response({ success: true, data }).code(201);
    if (location) {
        response = response.header('Location', location);
    }
    return response;
}

/** No content response */
export function noContent(h: ResponseToolkit) {
    return h.response().code(204);
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

/** Create render context from request */
export function createRenderContext(request: Request): RenderContext {
    return {
        url: request.url.href,
        path: request.path,
        query: request.query as Record<string, string>,
        headers: request.headers as Record<string, string>,
        cookies: getCookies(request),
        state: {},
        signals: {},
        meta: {},
        auth: {
            isAuthenticated: request.auth.isAuthenticated,
            credentials: request.auth.credentials,
            artifacts: request.auth.artifacts,
        },
    };
}

// ============================================================================
// SSE (Server-Sent Events)
// ============================================================================

/**
 * Create SSE response
 */
export async function sendSSE(
    h: ResponseToolkit,
    eventStream: AsyncIterable<SSEEvent>,
    options: SSEOptions = {}
): Promise<any> {
    const { retry = 3000, keepAlive = 30000, heartbeat = ':heartbeat\n\n' } = options;

    const { PassThrough } = await import('stream');
    const stream = new PassThrough();

    // Send retry interval
    stream.write(`retry: ${retry}\n\n`);

    // Heartbeat
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    if (keepAlive > 0) {
        heartbeatTimer = setInterval(() => {
            stream.write(heartbeat);
        }, keepAlive);
    }

    // Process events
    (async () => {
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
    })();

    return h.response(stream)
        .type('text/event-stream')
        .header('Cache-Control', 'no-cache')
        .header('Connection', 'keep-alive')
        .header('X-Accel-Buffering', 'no');
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
// Graceful Shutdown
// ============================================================================

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

        server.log(['info'], `Received ${signal}, starting graceful shutdown...`);

        try {
            if (beforeShutdown) {
                await beforeShutdown();
            }

            await Promise.race([
                server.stop({ timeout }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Shutdown timeout')), timeout)
                ),
            ]);

            server.log(['info'], 'Graceful shutdown completed');

            if (onShutdown) {
                onShutdown();
            }

            process.exit(0);
        } catch (error) {
            server.log(['error'], `Error during graceful shutdown: ${error}`);
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

// ============================================================================
// Type Augmentation
// ============================================================================

declare module '@hapi/hapi' {
    interface Request {
        philjsContext: RenderContext | null;
        session: () => SessionData;
        sessionId: () => string;
    }

    interface ApplicationState {
        session?: SessionData;
        sessionId?: string;
        rateLimitHeaders?: Record<string, string>;
    }
}

// ============================================================================
// Exports
// ============================================================================

export const plugin = philjsPlugin;
export default philjsPlugin;

// Re-export commonly used Hapi types
export type { Server, Plugin, Request, ResponseToolkit, Lifecycle, ServerRoute, RouteOptions };

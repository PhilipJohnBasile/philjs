/**
 * PhilJS Fastify Plugin
 *
 * Comprehensive Fastify integration for PhilJS SSR applications.
 * Provides SSR middleware, API helpers, validation, security, and more.
 */

import type {
    FastifyPluginAsync,
    FastifyRequest,
    FastifyReply,
    FastifyInstance,
    FastifyPluginOptions,
    FastifySchema,
    RouteHandlerMethod,
    FastifyError,
    HookHandlerDoneFunction,
    preHandlerHookHandler,
    onRequestHookHandler,
    onResponseHookHandler,
    FastifyBaseLogger
} from 'fastify';
import type { Server, IncomingMessage, ServerResponse } from 'http';
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

export interface PhilJSPluginOptions extends FastifyPluginOptions {
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
    /** Custom error handler for SSR errors */
    onError?: (error: Error, request: FastifyRequest, reply: FastifyReply) => void | Promise<void>;
    /** Pre-render hook */
    beforeRender?: (context: RenderContext, request: FastifyRequest) => void | Promise<void>;
    /** Post-render hook */
    afterRender?: (result: string | SSRResult, context: RenderContext) => void | Promise<void>;
    /** HTML shell template */
    template?: string;
    /** Cache SSR responses */
    cache?: SSRCacheOptions;
}

export interface SSRCacheOptions {
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

export interface ApiRouteOptions<TBody = any, TQuery = any, TParams = any> {
    /** Route schema for validation */
    schema?: FastifySchema;
    /** Require authentication */
    auth?: boolean | string[];
    /** Rate limit for this route */
    rateLimit?: RateLimitOptions;
    /** Cache response */
    cache?: number | CacheOptions;
    /** Allowed HTTP methods */
    methods?: string[];
    /** Pre-handler hooks */
    preHandler?: preHandlerHookHandler | preHandlerHookHandler[];
    /** Response serializer */
    serializer?: (data: any) => string;
}

export interface CacheOptions {
    /** TTL in seconds */
    ttl: number;
    /** Cache control header */
    control?: string;
    /** Vary header */
    vary?: string[];
    /** Stale-while-revalidate */
    swr?: number;
}

export interface RateLimitOptions {
    /** Maximum requests per window */
    max: number;
    /** Time window in milliseconds */
    window?: number;
    /** Key generator */
    keyGenerator?: (request: FastifyRequest) => string;
    /** Skip function */
    skip?: (request: FastifyRequest) => boolean;
    /** Rate limit exceeded handler */
    onExceeded?: (request: FastifyRequest, reply: FastifyReply) => void;
    /** Store for rate limit data */
    store?: RateLimitStore;
    /** Add rate limit headers */
    headers?: boolean;
}

export interface RateLimitStore {
    increment(key: string, window: number): Promise<{ current: number; ttl: number }>;
    reset(key: string): Promise<void>;
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
    /** Cross-Origin-Embedder-Policy */
    coep?: 'require-corp' | 'credentialless' | 'unsafe-none' | false;
    /** Cross-Origin-Opener-Policy */
    coop?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' | false;
    /** Cross-Origin-Resource-Policy */
    corp?: 'same-origin' | 'same-site' | 'cross-origin' | false;
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
    reportTo?: string;
}

export interface HSTSOptions {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}

export interface CorsOptions {
    /** Allowed origins */
    origin?: string | string[] | boolean | ((origin: string, request: FastifyRequest) => boolean | string);
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
    /** Handle preflight */
    preflight?: boolean;
    /** Strict preflight */
    strictPreflight?: boolean;
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
    /** Rolling sessions */
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
    /** Health check during shutdown */
    healthCheck?: () => Promise<boolean>;
}

export interface LoggerOptions {
    /** Log level */
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    /** Include request ID */
    requestId?: boolean;
    /** Include timing */
    timing?: boolean;
    /** Custom serializers */
    serializers?: Record<string, (value: any) => any>;
    /** Redact sensitive fields */
    redact?: string[];
    /** Skip logging for certain routes */
    skip?: (request: FastifyRequest, reply: FastifyReply) => boolean;
}

export interface SSEOptions {
    /** Retry interval for client */
    retry?: number;
    /** Keep-alive interval */
    keepAlive?: number;
    /** Event ID generator */
    idGenerator?: () => string;
    /** Heartbeat message */
    heartbeat?: string;
}

export interface SSEEvent {
    id?: string;
    event?: string;
    data: any;
    retry?: number;
}

export interface WebSocketOptions {
    /** WebSocket path */
    path?: string;
    /** Max payload size */
    maxPayload?: number;
    /** Ping interval */
    pingInterval?: number;
    /** Connection handler */
    onConnection?: (socket: WebSocketConnection) => void;
    /** Message handler */
    onMessage?: (socket: WebSocketConnection, message: any) => void;
    /** Close handler */
    onClose?: (socket: WebSocketConnection, code: number, reason: string) => void;
    /** Error handler */
    onError?: (socket: WebSocketConnection, error: Error) => void;
}

export interface WebSocketConnection {
    id: string;
    send(data: any): void;
    close(code?: number, reason?: string): void;
    on(event: string, handler: (...args: any[]) => void): void;
    isAlive: boolean;
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
// Core Plugin
// ============================================================================

/**
 * PhilJS Fastify plugin for SSR
 *
 * @example
 * ```ts
 * import Fastify from 'fastify';
 * import { philjsPlugin } from '@philjs/fastify';
 * import { render } from './entry-server';
 *
 * const app = Fastify();
 *
 * await app.register(philjsPlugin, {
 *   ssr: true,
 *   render: async (url, ctx) => render(url, ctx),
 *   excludeRoutes: ['/api', '/health'],
 *   cache: { enabled: true, ttl: 300 },
 * });
 *
 * app.listen({ port: 3000 });
 * ```
 */
export const philjsPlugin: FastifyPluginAsync<PhilJSPluginOptions> = async (fastify, options) => {
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

    // Initialize cache if enabled
    const cacheStore = cache?.enabled ? (cache.store || new InMemoryCacheStore()) : null;

    // Add decorators
    fastify.decorateRequest('philjsContext', null);
    fastify.decorateRequest('startTime', 0);
    fastify.decorateReply('renderPhilJS', null);
    fastify.decorateReply('streamPhilJS', null);

    // Track request timing
    fastify.addHook('onRequest', async (request) => {
        (request as any).startTime = Date.now();
    });

    // Pre-handler to build context
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

        const context: RenderContext = {
            url: request.url,
            path: url.pathname,
            query: Object.fromEntries(url.searchParams),
            headers: request.headers as Record<string, string>,
            cookies: (request as any).cookies || parseCookies(request.headers.cookie || ''),
            state: {},
            signals: {},
            meta: {},
        };

        (request as any).philjsContext = context;

        (reply as any).renderPhilJS = async (additionalState?: Record<string, any>) => {
            if (!render) {
                throw new Error('No render function provided');
            }

            if (additionalState) {
                Object.assign(context.state, additionalState);
            }

            if (beforeRender) {
                await beforeRender(context, request);
            }

            const result = await render(request.url, context);

            if (afterRender) {
                await afterRender(result, context);
            }

            if (typeof result === 'string') {
                reply.type('text/html').send(result);
            } else {
                if (result.redirect) {
                    reply.redirect(result.statusCode || 302, result.redirect);
                    return;
                }

                if (result.headers) {
                    for (const [key, value] of Object.entries(result.headers)) {
                        reply.header(key, value);
                    }
                }

                reply.status(result.statusCode || 200).type('text/html').send(result.html);
            }
        };

        (reply as any).streamPhilJS = async (additionalState?: Record<string, any>) => {
            if (!streamRender) {
                throw new Error('No stream render function provided');
            }

            if (additionalState) {
                Object.assign(context.state, additionalState);
            }

            if (beforeRender) {
                await beforeRender(context, request);
            }

            const stream = await streamRender(request.url, context);

            reply.raw.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Content-Type-Options': 'nosniff',
            });

            if ('getReader' in stream) {
                // ReadableStream (Web Streams API)
                const reader = (stream as ReadableStream<string>).getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        reply.raw.write(value);
                    }
                } finally {
                    reader.releaseLock();
                    reply.raw.end();
                }
            } else {
                // Node.js Readable stream
                (stream as Readable).pipe(reply.raw);
            }
        };
    });

    // Helper to check if route should use SSR
    const shouldSSR = (url: string): boolean => {
        // Check include routes first
        if (includeRoutes && includeRoutes.length > 0) {
            return includeRoutes.some(route =>
                url === route || url.startsWith(route + '/') || new RegExp(route).test(url)
            );
        }

        // Check exclude routes
        for (const route of excludeRoutes) {
            if (url.startsWith(route)) {
                return false;
            }
        }

        return true;
    };

    // Generate cache key
    const getCacheKey = (url: string, context: RenderContext): string => {
        if (cache?.keyGenerator) {
            return cache.keyGenerator(url, context);
        }
        return `ssr:${url}`;
    };

    // Should cache this route
    const shouldCache = (url: string): boolean => {
        if (!cache?.enabled) return false;

        if (cache.excludeRoutes?.some(route => url.startsWith(route))) {
            return false;
        }

        if (cache.routes && cache.routes.length > 0) {
            return cache.routes.some(route => url.startsWith(route) || new RegExp(route).test(url));
        }

        return true;
    };

    // Catch-all route for SSR
    if (ssr && (render || streamRender)) {
        fastify.get('*', async (request: FastifyRequest, reply: FastifyReply) => {
            // Skip non-SSR routes
            if (!shouldSSR(request.url)) {
                return reply.callNotFound();
            }

            // Skip non-HTML requests
            const accept = request.headers.accept || '';
            if (!accept.includes('text/html') && !accept.includes('*/*')) {
                return reply.callNotFound();
            }

            try {
                const context: RenderContext = (request as any).philjsContext;

                // Check cache
                if (shouldCache(request.url) && cacheStore) {
                    const cacheKey = getCacheKey(request.url, context);
                    const cached = await cacheStore.get(cacheKey);
                    if (cached) {
                        reply.header('X-Cache', 'HIT');
                        return reply.type('text/html').send(cached);
                    }
                    reply.header('X-Cache', 'MISS');
                }

                // Use streaming if enabled
                if (streaming && streamRender) {
                    await (reply as any).streamPhilJS();
                    return;
                }

                // Regular SSR
                if (render) {
                    if (beforeRender) {
                        await beforeRender(context, request);
                    }

                    const result = await render(request.url, context);

                    if (afterRender) {
                        await afterRender(result, context);
                    }

                    let html: string;
                    let statusCode = 200;

                    if (typeof result === 'string') {
                        html = result;
                    } else {
                        if (result.redirect) {
                            return reply.redirect(result.statusCode || 302, result.redirect);
                        }

                        if (result.headers) {
                            for (const [key, value] of Object.entries(result.headers)) {
                                reply.header(key, value);
                            }
                        }

                        html = result.html;
                        statusCode = result.statusCode || 200;
                    }

                    // Apply template if provided
                    if (template) {
                        html = template.replace('<!--ssr-outlet-->', html);
                    }

                    // Cache the response
                    if (shouldCache(request.url) && cacheStore && statusCode === 200) {
                        const cacheKey = getCacheKey(request.url, context);
                        await cacheStore.set(cacheKey, html, cache?.ttl || 300);
                    }

                    reply.status(statusCode).type('text/html').send(html);
                }
            } catch (error) {
                if (onError) {
                    await onError(error as Error, request, reply);
                } else {
                    fastify.log.error(error);
                    reply.status(500).send('Internal Server Error');
                }
            }
        });
    }
};

// ============================================================================
// Security Plugin
// ============================================================================

/**
 * Security headers plugin
 */
export const securityPlugin: FastifyPluginAsync<SecurityOptions> = async (fastify, options) => {
    const {
        csp,
        frameOptions = 'SAMEORIGIN',
        contentTypeOptions = true,
        xssProtection = true,
        referrerPolicy = 'strict-origin-when-cross-origin',
        hsts,
        permissionsPolicy,
        coep,
        coop,
        corp,
    } = options;

    fastify.addHook('onSend', async (_request, reply) => {
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
            if (csp.reportTo) directives.push(`report-to ${csp.reportTo}`);

            if (directives.length > 0) {
                reply.header('Content-Security-Policy', directives.join('; '));
            }
        }

        // X-Frame-Options
        if (frameOptions !== false) {
            reply.header('X-Frame-Options', frameOptions);
        }

        // X-Content-Type-Options
        if (contentTypeOptions) {
            reply.header('X-Content-Type-Options', 'nosniff');
        }

        // X-XSS-Protection
        if (xssProtection) {
            reply.header('X-XSS-Protection', '1; mode=block');
        }

        // Referrer-Policy
        if (referrerPolicy !== false) {
            reply.header('Referrer-Policy', referrerPolicy);
        }

        // HSTS
        if (hsts !== false && hsts) {
            let value = `max-age=${hsts.maxAge}`;
            if (hsts.includeSubDomains) value += '; includeSubDomains';
            if (hsts.preload) value += '; preload';
            reply.header('Strict-Transport-Security', value);
        }

        // Permissions-Policy
        if (permissionsPolicy !== false && permissionsPolicy) {
            const directives = Object.entries(permissionsPolicy)
                .map(([key, values]) => `${key}=(${values.join(' ')})`)
                .join(', ');
            reply.header('Permissions-Policy', directives);
        }

        // Cross-Origin-Embedder-Policy
        if (coep !== false && coep) {
            reply.header('Cross-Origin-Embedder-Policy', coep);
        }

        // Cross-Origin-Opener-Policy
        if (coop !== false && coop) {
            reply.header('Cross-Origin-Opener-Policy', coop);
        }

        // Cross-Origin-Resource-Policy
        if (corp !== false && corp) {
            reply.header('Cross-Origin-Resource-Policy', corp);
        }
    });
};

// ============================================================================
// CORS Plugin
// ============================================================================

/**
 * CORS plugin
 */
export const corsPlugin: FastifyPluginAsync<CorsOptions> = async (fastify, options) => {
    const {
        origin = '*',
        methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders,
        exposedHeaders,
        credentials = false,
        maxAge = 86400,
        preflight = true,
        strictPreflight = true,
    } = options;

    const resolveOrigin = (requestOrigin: string | undefined, request: FastifyRequest): string | null => {
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
            const result = origin(requestOrigin, request);
            if (typeof result === 'boolean') {
                return result ? requestOrigin : null;
            }
            return result;
        }

        return null;
    };

    // Handle preflight requests
    if (preflight) {
        fastify.options('*', async (request, reply) => {
            const requestOrigin = request.headers.origin;
            const resolvedOrigin = resolveOrigin(requestOrigin, request);

            if (strictPreflight && !resolvedOrigin) {
                return reply.status(403).send({ error: 'Origin not allowed' });
            }

            if (resolvedOrigin) {
                reply.header('Access-Control-Allow-Origin', resolvedOrigin);
            }

            reply.header('Access-Control-Allow-Methods', methods.join(', '));

            if (allowedHeaders) {
                reply.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            } else if (request.headers['access-control-request-headers']) {
                reply.header('Access-Control-Allow-Headers', request.headers['access-control-request-headers']);
            }

            if (credentials) {
                reply.header('Access-Control-Allow-Credentials', 'true');
            }

            if (maxAge) {
                reply.header('Access-Control-Max-Age', String(maxAge));
            }

            reply.status(204).send();
        });
    }

    // Add CORS headers to all responses
    fastify.addHook('onSend', async (request, reply) => {
        const requestOrigin = request.headers.origin;
        const resolvedOrigin = resolveOrigin(requestOrigin, request);

        if (resolvedOrigin) {
            reply.header('Access-Control-Allow-Origin', resolvedOrigin);

            if (credentials) {
                reply.header('Access-Control-Allow-Credentials', 'true');
            }

            if (exposedHeaders && exposedHeaders.length > 0) {
                reply.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
            }

            if (resolvedOrigin !== '*') {
                reply.header('Vary', 'Origin');
            }
        }
    });
};

// ============================================================================
// Rate Limiting Plugin
// ============================================================================

/**
 * Rate limiting plugin
 */
export const rateLimitPlugin: FastifyPluginAsync<RateLimitOptions> = async (fastify, options) => {
    const {
        max = 100,
        window = 60000,
        keyGenerator = (request) => request.ip,
        skip,
        onExceeded,
        store = new InMemoryRateLimitStore(),
        headers = true,
    } = options;

    fastify.addHook('onRequest', async (request, reply) => {
        if (skip && skip(request)) {
            return;
        }

        const key = `ratelimit:${keyGenerator(request)}`;
        const result = await store.increment(key, window);

        if (headers) {
            reply.header('X-RateLimit-Limit', String(max));
            reply.header('X-RateLimit-Remaining', String(Math.max(0, max - result.current)));
            reply.header('X-RateLimit-Reset', String(Math.ceil((Date.now() + result.ttl) / 1000)));
        }

        if (result.current > max) {
            const retryAfter = Math.ceil(result.ttl / 1000);
            reply.header('Retry-After', String(retryAfter));

            if (onExceeded) {
                onExceeded(request, reply);
            } else {
                throw new RateLimitError(retryAfter);
            }
        }
    });
};

// ============================================================================
// Session Plugin
// ============================================================================

/**
 * Session management plugin
 */
export const sessionPlugin: FastifyPluginAsync<SessionOptions> = async (fastify, options) => {
    const {
        secret,
        cookieName = 'session',
        cookie = {},
        store = new InMemorySessionStore(),
        generateId = () => crypto.randomUUID(),
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

    // Sign session ID
    const sign = (value: string): string => {
        const signature = createHmac(secret, value);
        return `${value}.${signature}`;
    };

    // Unsign and verify session ID
    const unsign = (signedValue: string): string | null => {
        const parts = signedValue.split('.');
        if (parts.length !== 2) return null;

        const [value, signature] = parts;
        const expectedSignature = createHmac(secret, value);

        if (signature !== expectedSignature) return null;
        return value;
    };

    fastify.decorateRequest('session', null);
    fastify.decorateRequest('sessionId', null);

    fastify.addHook('preHandler', async (request) => {
        const cookies = parseCookies(request.headers.cookie || '');
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
            sessionId = generateId();
            sessionData = {};
        }

        (request as any).sessionId = sessionId;
        (request as any).session = sessionData;
    });

    fastify.addHook('onSend', async (request, reply) => {
        const sessionId = (request as any).sessionId;
        const session = (request as any).session;

        if (!sessionId || !session) return;

        // Save session
        await store.set(sessionId, session, cookieOptions.maxAge);

        // Set cookie
        const signedId = sign(sessionId);
        const cookieParts = [`${cookieName}=${signedId}`];

        if (cookieOptions.path) cookieParts.push(`Path=${cookieOptions.path}`);
        if (cookieOptions.domain) cookieParts.push(`Domain=${cookieOptions.domain}`);
        if (cookieOptions.maxAge) cookieParts.push(`Max-Age=${cookieOptions.maxAge}`);
        if (cookieOptions.expires) cookieParts.push(`Expires=${cookieOptions.expires.toUTCString()}`);
        if (cookieOptions.secure) cookieParts.push('Secure');
        if (cookieOptions.httpOnly) cookieParts.push('HttpOnly');
        if (cookieOptions.sameSite) cookieParts.push(`SameSite=${cookieOptions.sameSite}`);

        reply.header('Set-Cookie', cookieParts.join('; '));
    });
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
    transform?: (error: Error, request: FastifyRequest) => any;
    /** Handle specific error types */
    handlers?: Record<string, (error: Error, request: FastifyRequest, reply: FastifyReply) => void | Promise<void>>;
}

/**
 * Error handler plugin
 */
export const errorHandlerPlugin: FastifyPluginAsync<ErrorHandlerOptions> = async (fastify, options) => {
    const {
        log = true,
        stack = process.env.NODE_ENV !== 'production',
        transform,
        handlers = {},
    } = options;

    fastify.setErrorHandler(async (error: FastifyError | HttpError | Error, request, reply) => {
        // Check for custom handler
        if (handlers[error.name]) {
            return handlers[error.name](error, request, reply);
        }

        if (log) {
            if ((error as HttpError).statusCode && (error as HttpError).statusCode < 500) {
                request.log.warn(error);
            } else {
                request.log.error(error);
            }
        }

        let statusCode = 500;
        let response: any = {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
        };

        if (error instanceof HttpError) {
            statusCode = error.statusCode;
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
                reply.header('Retry-After', String(error.retryAfter));
            }
        } else if ((error as FastifyError).statusCode) {
            statusCode = (error as FastifyError).statusCode!;
            response = {
                error: error.name,
                message: error.message,
                code: (error as FastifyError).code,
            };
        }

        if (stack && statusCode >= 500) {
            response.stack = error.stack;
        }

        if (transform) {
            response = transform(error, request);
        }

        reply.status(statusCode).send(response);
    });

    // 404 handler
    fastify.setNotFoundHandler(async (request, reply) => {
        reply.status(404).send({
            error: 'Not Found',
            message: `Route ${request.method} ${request.url} not found`,
            code: 'NOT_FOUND',
        });
    });
};

// ============================================================================
// Health Check Plugin
// ============================================================================

/**
 * Health check plugin
 */
export const healthPlugin: FastifyPluginAsync<HealthCheckOptions> = async (fastify, options) => {
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

    // Main health endpoint
    fastify.get(path, async (_request, reply) => {
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

        reply.status(status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503).send(response);
    });

    // Liveness endpoint (is the process running?)
    fastify.get(livenessPath, async (_request, reply) => {
        reply.send({ status: 'alive', timestamp: new Date().toISOString() });
    });

    // Readiness endpoint (is the service ready to accept traffic?)
    fastify.get(readinessPath, async (_request, reply) => {
        const { status } = await runChecks();

        if (status === 'unhealthy') {
            reply.status(503).send({ status: 'not ready', timestamp: new Date().toISOString() });
        } else {
            reply.send({ status: 'ready', timestamp: new Date().toISOString() });
        }
    });
};

// ============================================================================
// API Route Helpers
// ============================================================================

export interface ApiHandlerContext<TBody = any, TQuery = any, TParams = any> {
    body: TBody;
    query: TQuery;
    params: TParams;
    request: FastifyRequest;
    reply: FastifyReply;
    session?: SessionData;
    user?: any;
}

export type ApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any> =
    (ctx: ApiHandlerContext<TBody, TQuery, TParams>) => Promise<TResponse>;

/**
 * Create a typed API route handler
 */
export function createApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any>(
    handler: ApiHandler<TBody, TQuery, TParams, TResponse>,
    options?: ApiRouteOptions<TBody, TQuery, TParams>
): RouteHandlerMethod {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ctx: ApiHandlerContext<TBody, TQuery, TParams> = {
            body: request.body as TBody,
            query: request.query as TQuery,
            params: request.params as TParams,
            request,
            reply,
            session: (request as any).session,
            user: (request as any).user,
        };

        const result = await handler(ctx);

        if (result !== undefined && !reply.sent) {
            reply.send(result);
        }
    };
}

/**
 * Create an API router with common utilities
 */
export function createApiRouter(fastify: FastifyInstance, prefix = '/api') {
    const router = {
        get: <TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<never, TQuery, TParams, TResponse>,
            options?: ApiRouteOptions
        ) => {
            fastify.get(`${prefix}${path}`, options?.schema ? { schema: options.schema } : {}, createApiHandler(handler, options));
            return router;
        },

        post: <TBody = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TBody, TQuery, TParams, TResponse>,
            options?: ApiRouteOptions
        ) => {
            fastify.post(`${prefix}${path}`, options?.schema ? { schema: options.schema } : {}, createApiHandler(handler, options));
            return router;
        },

        put: <TBody = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TBody, TQuery, TParams, TResponse>,
            options?: ApiRouteOptions
        ) => {
            fastify.put(`${prefix}${path}`, options?.schema ? { schema: options.schema } : {}, createApiHandler(handler, options));
            return router;
        },

        patch: <TBody = any, TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<TBody, TQuery, TParams, TResponse>,
            options?: ApiRouteOptions
        ) => {
            fastify.patch(`${prefix}${path}`, options?.schema ? { schema: options.schema } : {}, createApiHandler(handler, options));
            return router;
        },

        delete: <TQuery = any, TParams = any, TResponse = any>(
            path: string,
            handler: ApiHandler<never, TQuery, TParams, TResponse>,
            options?: ApiRouteOptions
        ) => {
            fastify.delete(`${prefix}${path}`, options?.schema ? { schema: options.schema } : {}, createApiHandler(handler, options));
            return router;
        },
    };

    return router;
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
export function created<T>(data: T, location?: string): { success: true; data: T; location?: string } {
    return location ? { success: true, data, location } : { success: true, data };
}

/** No content response */
export function noContent(reply: FastifyReply): void {
    reply.status(204).send();
}

// ============================================================================
// SSE (Server-Sent Events) Helper
// ============================================================================

/**
 * Send Server-Sent Events
 */
export async function sendSSE(
    reply: FastifyReply,
    eventStream: AsyncIterable<SSEEvent>,
    options: SSEOptions = {}
): Promise<void> {
    const { retry = 3000, keepAlive = 30000, heartbeat = ':heartbeat\n\n' } = options;

    reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });

    // Send retry interval
    reply.raw.write(`retry: ${retry}\n\n`);

    // Heartbeat interval
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    if (keepAlive > 0) {
        heartbeatTimer = setInterval(() => {
            reply.raw.write(heartbeat);
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

            reply.raw.write(message);
        }
    } finally {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
        }
        reply.raw.end();
    }
}

/**
 * Create an SSE event stream from a signal
 */
export function createSignalSSEStream(
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
// Streaming SSR Helper
// ============================================================================

/**
 * Stream SSR response
 */
export function streamSSR(reply: FastifyReply, stream: ReadableStream<string> | Readable): void {
    reply.raw.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
    });

    if ('getReader' in stream) {
        const reader = stream.getReader();

        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    reply.raw.write(value);
                }
            } finally {
                reader.releaseLock();
                reply.raw.end();
            }
        };

        pump();
    } else {
        stream.pipe(reply.raw);
    }
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
    const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(query.pageSize as string || query.limit as string, 10) || defaultPageSize));
    const offset = (page - 1) * pageSize;

    return { page, pageSize, offset };
}

/** Parse sort from query */
export function parseSort(
    query: Record<string, any>,
    allowedFields: string[],
    defaultSort?: { field: string; order: 'asc' | 'desc' }
): { field: string; order: 'asc' | 'desc' } | null {
    const sortField = query.sortBy as string || query.sort as string;
    const sortOrder = (query.sortOrder as string || query.order as string || 'asc').toLowerCase();

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
export function createRenderContext(request: FastifyRequest): RenderContext {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    return {
        url: request.url,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        headers: request.headers as Record<string, string>,
        cookies: parseCookies(request.headers.cookie || ''),
        state: {},
        signals: {},
        meta: {},
    };
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Enable graceful shutdown
 */
export function gracefulShutdown(
    fastify: FastifyInstance,
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

        fastify.log.info(`Received ${signal}, starting graceful shutdown...`);

        try {
            if (beforeShutdown) {
                await beforeShutdown();
            }

            // Close server with timeout
            await Promise.race([
                fastify.close(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Shutdown timeout')), timeout)
                ),
            ]);

            fastify.log.info('Graceful shutdown completed');

            if (onShutdown) {
                onShutdown();
            }

            process.exit(0);
        } catch (error) {
            fastify.log.error(error, 'Error during graceful shutdown');
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
 * Simple validation function
 */
export function validate<T>(
    data: any,
    schema: ValidationSchema<T>
): { valid: boolean; errors: string[]; value: T | null } {
    const errors: string[] = [];

    const validateValue = (value: any, schema: ValidationSchema<any>, path: string): any => {
        if (value === undefined || value === null) {
            if (schema.default !== undefined) {
                return schema.default;
            }
            return value;
        }

        switch (schema.type) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(`${path}: expected string`);
                    return value;
                }
                if (schema.minLength !== undefined && value.length < schema.minLength) {
                    errors.push(`${path}: minimum length is ${schema.minLength}`);
                }
                if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                    errors.push(`${path}: maximum length is ${schema.maxLength}`);
                }
                if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                    errors.push(`${path}: does not match pattern`);
                }
                if (schema.enum && !schema.enum.includes(value)) {
                    errors.push(`${path}: must be one of ${schema.enum.join(', ')}`);
                }
                break;

            case 'number':
                const num = typeof value === 'string' ? parseFloat(value) : value;
                if (typeof num !== 'number' || isNaN(num)) {
                    errors.push(`${path}: expected number`);
                    return value;
                }
                if (schema.min !== undefined && num < schema.min) {
                    errors.push(`${path}: minimum is ${schema.min}`);
                }
                if (schema.max !== undefined && num > schema.max) {
                    errors.push(`${path}: maximum is ${schema.max}`);
                }
                return num;

            case 'boolean':
                if (typeof value === 'string') {
                    return value === 'true' || value === '1';
                }
                if (typeof value !== 'boolean') {
                    errors.push(`${path}: expected boolean`);
                }
                break;

            case 'array':
                if (!Array.isArray(value)) {
                    errors.push(`${path}: expected array`);
                    return value;
                }
                if (schema.items) {
                    return value.map((item, i) => validateValue(item, schema.items!, `${path}[${i}]`));
                }
                break;

            case 'object':
                if (typeof value !== 'object' || value === null) {
                    errors.push(`${path}: expected object`);
                    return value;
                }

                const result: any = {};

                if (schema.required) {
                    for (const field of schema.required) {
                        if (value[field] === undefined) {
                            errors.push(`${path}.${field}: required`);
                        }
                    }
                }

                if (schema.properties) {
                    for (const [key, propSchema] of Object.entries(schema.properties)) {
                        result[key] = validateValue(value[key], propSchema, `${path}.${key}`);
                    }
                }

                return result;
        }

        return value;
    };

    const value = validateValue(data, schema, 'root');

    return {
        valid: errors.length === 0,
        errors,
        value: errors.length === 0 ? value : null,
    };
}

/**
 * Validation pre-handler factory
 */
export function validateBody<T>(
    schema: ValidationSchema<T>
): preHandlerHookHandler {
    return async (request, reply) => {
        const result = validate(request.body, schema);
        if (!result.valid) {
            throw new ValidationError(
                result.errors.map(e => {
                    const [field, ...message] = e.split(':');
                    return { field: field.replace('root.', ''), message: message.join(':').trim() };
                })
            );
        }
        (request as any).validatedBody = result.value;
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Parse cookies from header */
function parseCookies(cookieHeader: string): Record<string, string> {
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

/** Request ID generator */
export function generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================================
// Decorators Augmentation
// ============================================================================

declare module 'fastify' {
    interface FastifyRequest {
        philjsContext: RenderContext;
        startTime: number;
        session?: SessionData;
        sessionId?: string;
        validatedBody?: any;
        user?: any;
    }

    interface FastifyReply {
        renderPhilJS: (additionalState?: Record<string, any>) => Promise<void>;
        streamPhilJS: (additionalState?: Record<string, any>) => Promise<void>;
    }
}

// ============================================================================
// Exports
// ============================================================================

export default philjsPlugin;

// Re-export commonly used types
export type {
    FastifyPluginAsync,
    FastifyRequest,
    FastifyReply,
    FastifyInstance,
    FastifySchema,
    RouteHandlerMethod,
};

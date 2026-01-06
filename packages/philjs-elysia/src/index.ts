/**
 * @philjs/elysia
 * High-performance Elysia plugin for PhilJS SSR on Bun
 *
 * Features:
 * - SSR middleware with streaming support
 * - TypeBox schema validation integration
 * - Security plugins (CSP, CORS, HSTS, rate limiting)
 * - Session management with signed cookies
 * - Error handling with typed errors
 * - Server-Sent Events with signal streaming
 * - Health check endpoints
 * - Graceful shutdown
 * - WebSocket support
 */

import { Elysia, type Context, type Handler } from 'elysia';
import { signal, computed, effect, batch } from '@philjs/core';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

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
    canonical?: string;
    openGraph?: OpenGraphInfo;
    twitter?: TwitterCardInfo;
    jsonLd?: Record<string, any>[];
}

export interface OpenGraphInfo {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
}

export interface TwitterCardInfo {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
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

export type RenderFunction = (context: RenderContext) => SSRResult | Promise<SSRResult>;
export type StreamRenderFunction = (context: RenderContext) => AsyncGenerator<string, void, unknown>;

export interface PhilJSPluginOptions {
    render: RenderFunction;
    streamRender?: StreamRenderFunction;
    template?: string;
    templatePath?: string;
    basePath?: string;
    excludePaths?: string[];
    cacheControl?: string;
    enableStreaming?: boolean;
    onError?: (error: Error, context: RenderContext) => SSRResult | Promise<SSRResult>;
}

export interface SecurityOptions {
    contentSecurityPolicy?: CSPOptions | false;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN' | false;
    xContentTypeOptions?: boolean;
    xXssProtection?: boolean;
    strictTransportSecurity?: HSTSOptions | false;
    referrerPolicy?: ReferrerPolicy | false;
    permissionsPolicy?: Record<string, string[]> | false;
    crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless' | false;
    crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' | false;
    crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin' | false;
}

export interface CSPOptions {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    fontSrc?: string[];
    connectSrc?: string[];
    mediaSrc?: string[];
    objectSrc?: string[];
    frameSrc?: string[];
    frameAncestors?: string[];
    workerSrc?: string[];
    childSrc?: string[];
    formAction?: string[];
    baseUri?: string[];
    sandbox?: string[];
    reportUri?: string;
    reportTo?: string;
    upgradeInsecureRequests?: boolean;
    blockAllMixedContent?: boolean;
}

export interface HSTSOptions {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}

export type ReferrerPolicy =
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';

export interface CORSOptions {
    origin?: string | string[] | ((origin: string) => boolean | string);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
    preflight?: boolean;
}

export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    keyGenerator?: (ctx: Context) => string;
    skip?: (ctx: Context) => boolean | Promise<boolean>;
    store?: RateLimitStore;
    headers?: boolean;
}

export interface RateLimitStore {
    increment(key: string): Promise<{ count: number; resetTime: number }>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
}

export interface SessionOptions {
    secret: string;
    name?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    domain?: string;
    store?: SessionStore;
    rolling?: boolean;
    renew?: boolean;
}

export interface SessionStore {
    get(id: string): Promise<SessionData | null>;
    set(id: string, data: SessionData, maxAge: number): Promise<void>;
    destroy(id: string): Promise<void>;
    touch?(id: string, maxAge: number): Promise<void>;
}

export interface SessionData {
    id: string;
    data: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
}

export interface HealthCheckOptions {
    path?: string;
    livenessPath?: string;
    readinessPath?: string;
    checks?: HealthCheck[];
}

export interface HealthCheck {
    name: string;
    check: () => Promise<HealthCheckResult>;
    critical?: boolean;
}

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    latency?: number;
    details?: Record<string, any>;
}

export interface ErrorHandlerOptions {
    includeStackTrace?: boolean;
    logErrors?: boolean;
    onError?: (error: Error, ctx: Context) => void;
}

export interface LoggerOptions {
    level?: 'debug' | 'info' | 'warn' | 'error';
    format?: 'json' | 'pretty' | 'combined';
    skip?: (ctx: Context) => boolean;
    customFields?: (ctx: Context) => Record<string, any>;
}

export interface WebSocketOptions {
    path?: string;
    heartbeat?: number;
    maxPayload?: number;
    onConnect?: (ws: WebSocket, ctx: Context) => void | Promise<void>;
    onMessage?: (ws: WebSocket, message: string | Buffer, ctx: Context) => void | Promise<void>;
    onClose?: (ws: WebSocket, code: number, reason: string, ctx: Context) => void | Promise<void>;
    onError?: (ws: WebSocket, error: Error, ctx: Context) => void | Promise<void>;
}

// ============================================================================
// Error Classes
// ============================================================================

export class HttpError extends Error {
    public readonly statusCode: number;
    public readonly code?: string;
    public readonly details?: any;
    public readonly expose: boolean;

    constructor(
        statusCode: number,
        message: string,
        options: { code?: string; details?: any; expose?: boolean } = {}
    ) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.code = options.code;
        this.details = options.details;
        this.expose = options.expose ?? statusCode < 500;
    }
}

export class ValidationError extends HttpError {
    public readonly errors: Array<{ field: string; message: string; value?: any }>;

    constructor(errors: Array<{ field: string; message: string; value?: any }>) {
        super(400, 'Validation failed', { code: 'VALIDATION_ERROR', details: errors });
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

export class AuthenticationError extends HttpError {
    constructor(message = 'Authentication required') {
        super(401, message, { code: 'AUTHENTICATION_ERROR' });
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends HttpError {
    constructor(message = 'Access denied') {
        super(403, message, { code: 'AUTHORIZATION_ERROR' });
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends HttpError {
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`, { code: 'NOT_FOUND' });
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends HttpError {
    constructor(message = 'Resource conflict') {
        super(409, message, { code: 'CONFLICT' });
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends HttpError {
    public readonly retryAfter: number;

    constructor(retryAfter: number, message = 'Too many requests') {
        super(429, message, { code: 'RATE_LIMIT_EXCEEDED' });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export class ServiceUnavailableError extends HttpError {
    constructor(message = 'Service temporarily unavailable') {
        super(503, message, { code: 'SERVICE_UNAVAILABLE' });
        this.name = 'ServiceUnavailableError';
    }
}

export const errors = {
    badRequest: (message: string, details?: any) =>
        new HttpError(400, message, { code: 'BAD_REQUEST', details }),
    unauthorized: (message = 'Unauthorized') =>
        new AuthenticationError(message),
    forbidden: (message = 'Forbidden') =>
        new AuthorizationError(message),
    notFound: (resource?: string) =>
        new NotFoundError(resource),
    methodNotAllowed: (message = 'Method not allowed') =>
        new HttpError(405, message, { code: 'METHOD_NOT_ALLOWED' }),
    conflict: (message?: string) =>
        new ConflictError(message),
    gone: (message = 'Resource no longer available') =>
        new HttpError(410, message, { code: 'GONE' }),
    unprocessable: (message: string, details?: any) =>
        new HttpError(422, message, { code: 'UNPROCESSABLE_ENTITY', details }),
    tooManyRequests: (retryAfter = 60) =>
        new RateLimitError(retryAfter),
    internal: (message = 'Internal server error') =>
        new HttpError(500, message, { code: 'INTERNAL_ERROR', expose: false }),
    notImplemented: (message = 'Not implemented') =>
        new HttpError(501, message, { code: 'NOT_IMPLEMENTED' }),
    serviceUnavailable: (message?: string) =>
        new ServiceUnavailableError(message),
    gatewayTimeout: (message = 'Gateway timeout') =>
        new HttpError(504, message, { code: 'GATEWAY_TIMEOUT' }),
};

// ============================================================================
// In-Memory Stores
// ============================================================================

class InMemoryRateLimitStore implements RateLimitStore {
    private store = new Map<string, { count: number; resetTime: number }>();
    private cleanupInterval: Timer;

    constructor(private windowMs: number = 60000) {
        this.cleanupInterval = setInterval(() => this.cleanup(), windowMs);
    }

    async increment(key: string): Promise<{ count: number; resetTime: number }> {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now >= entry.resetTime) {
            const newEntry = { count: 1, resetTime: now + this.windowMs };
            this.store.set(key, newEntry);
            return newEntry;
        }

        entry.count++;
        return entry;
    }

    async decrement(key: string): Promise<void> {
        const entry = this.store.get(key);
        if (entry && entry.count > 0) {
            entry.count--;
        }
    }

    async reset(key: string): Promise<void> {
        this.store.delete(key);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now >= entry.resetTime) {
                this.store.delete(key);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

class InMemorySessionStore implements SessionStore {
    private store = new Map<string, SessionData>();
    private cleanupInterval: Timer;

    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    async get(id: string): Promise<SessionData | null> {
        const session = this.store.get(id);
        if (!session) return null;

        if (Date.now() >= session.expiresAt) {
            this.store.delete(id);
            return null;
        }

        return session;
    }

    async set(id: string, data: SessionData, maxAge: number): Promise<void> {
        data.expiresAt = Date.now() + maxAge;
        this.store.set(id, data);
    }

    async destroy(id: string): Promise<void> {
        this.store.delete(id);
    }

    async touch(id: string, maxAge: number): Promise<void> {
        const session = this.store.get(id);
        if (session) {
            session.expiresAt = Date.now() + maxAge;
            session.updatedAt = Date.now();
        }
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [id, session] of this.store.entries()) {
            if (now >= session.expiresAt) {
                this.store.delete(id);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

// ============================================================================
// Cache Store
// ============================================================================

class InMemoryCache {
    private store = new Map<string, { value: any; expiresAt: number }>();
    private cleanupInterval: Timer;

    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    get<T>(key: string): T | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;

        if (Date.now() >= entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlMs: number): void {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }

    delete(key: string): boolean {
        return this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now >= entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

const globalCache = new InMemoryCache();

// ============================================================================
// Utility Functions
// ============================================================================

function signValue(value: string, secret: string): string {
    const signature = createHmac('sha256', secret).update(value).digest('base64url');
    return `${value}.${signature}`;
}

function unsignValue(signedValue: string, secret: string): string | null {
    const lastDotIndex = signedValue.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const value = signedValue.slice(0, lastDotIndex);
    const signature = signedValue.slice(lastDotIndex + 1);

    const expectedSignature = createHmac('sha256', secret).update(value).digest('base64url');

    try {
        if (timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return value;
        }
    } catch {
        return null;
    }

    return null;
}

function generateSessionId(): string {
    return randomBytes(32).toString('base64url');
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
    if (!cookieHeader) return {};

    const cookies: Record<string, string> = {};
    const pairs = cookieHeader.split(';');

    for (const pair of pairs) {
        const [name, ...valueParts] = pair.trim().split('=');
        if (name) {
            cookies[name] = valueParts.join('=');
        }
    }

    return cookies;
}

function buildCSPHeader(options: CSPOptions): string {
    const directives: string[] = [];

    if (options.defaultSrc) directives.push(`default-src ${options.defaultSrc.join(' ')}`);
    if (options.scriptSrc) directives.push(`script-src ${options.scriptSrc.join(' ')}`);
    if (options.styleSrc) directives.push(`style-src ${options.styleSrc.join(' ')}`);
    if (options.imgSrc) directives.push(`img-src ${options.imgSrc.join(' ')}`);
    if (options.fontSrc) directives.push(`font-src ${options.fontSrc.join(' ')}`);
    if (options.connectSrc) directives.push(`connect-src ${options.connectSrc.join(' ')}`);
    if (options.mediaSrc) directives.push(`media-src ${options.mediaSrc.join(' ')}`);
    if (options.objectSrc) directives.push(`object-src ${options.objectSrc.join(' ')}`);
    if (options.frameSrc) directives.push(`frame-src ${options.frameSrc.join(' ')}`);
    if (options.frameAncestors) directives.push(`frame-ancestors ${options.frameAncestors.join(' ')}`);
    if (options.workerSrc) directives.push(`worker-src ${options.workerSrc.join(' ')}`);
    if (options.childSrc) directives.push(`child-src ${options.childSrc.join(' ')}`);
    if (options.formAction) directives.push(`form-action ${options.formAction.join(' ')}`);
    if (options.baseUri) directives.push(`base-uri ${options.baseUri.join(' ')}`);
    if (options.sandbox) directives.push(`sandbox ${options.sandbox.join(' ')}`);
    if (options.reportUri) directives.push(`report-uri ${options.reportUri}`);
    if (options.reportTo) directives.push(`report-to ${options.reportTo}`);
    if (options.upgradeInsecureRequests) directives.push('upgrade-insecure-requests');
    if (options.blockAllMixedContent) directives.push('block-all-mixed-content');

    return directives.join('; ');
}

function buildMetaTags(meta?: MetaInfo): string {
    if (!meta) return '';

    const tags: string[] = [];

    if (meta.title) {
        tags.push(`<title>${escapeHtml(meta.title)}</title>`);
    }
    if (meta.description) {
        tags.push(`<meta name="description" content="${escapeHtml(meta.description)}">`);
    }
    if (meta.keywords?.length) {
        tags.push(`<meta name="keywords" content="${escapeHtml(meta.keywords.join(', '))}">`);
    }
    if (meta.canonical) {
        tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}">`);
    }

    if (meta.openGraph) {
        const og = meta.openGraph;
        if (og.title) tags.push(`<meta property="og:title" content="${escapeHtml(og.title)}">`);
        if (og.description) tags.push(`<meta property="og:description" content="${escapeHtml(og.description)}">`);
        if (og.image) tags.push(`<meta property="og:image" content="${escapeHtml(og.image)}">`);
        if (og.url) tags.push(`<meta property="og:url" content="${escapeHtml(og.url)}">`);
        if (og.type) tags.push(`<meta property="og:type" content="${escapeHtml(og.type)}">`);
        if (og.siteName) tags.push(`<meta property="og:site_name" content="${escapeHtml(og.siteName)}">`);
    }

    if (meta.twitter) {
        const tw = meta.twitter;
        if (tw.card) tags.push(`<meta name="twitter:card" content="${escapeHtml(tw.card)}">`);
        if (tw.site) tags.push(`<meta name="twitter:site" content="${escapeHtml(tw.site)}">`);
        if (tw.creator) tags.push(`<meta name="twitter:creator" content="${escapeHtml(tw.creator)}">`);
        if (tw.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(tw.title)}">`);
        if (tw.description) tags.push(`<meta name="twitter:description" content="${escapeHtml(tw.description)}">`);
        if (tw.image) tags.push(`<meta name="twitter:image" content="${escapeHtml(tw.image)}">`);
    }

    if (meta.jsonLd?.length) {
        for (const ld of meta.jsonLd) {
            tags.push(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
        }
    }

    return tags.join('\n');
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// PhilJS Elysia Plugin
// ============================================================================

export function philjs(options: PhilJSPluginOptions) {
    const {
        render,
        streamRender,
        template = defaultTemplate,
        basePath = '',
        excludePaths = ['/api', '/static', '/_health', '/favicon.ico'],
        cacheControl = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
        enableStreaming = false,
    } = options;

    return new Elysia({ name: 'philjs' })
        .derive(({ request, set }) => {
            const url = new URL(request.url);
            const cookies = parseCookies(request.headers.get('cookie'));

            return {
                renderContext: {
                    url: request.url,
                    path: url.pathname,
                    query: Object.fromEntries(url.searchParams),
                    headers: Object.fromEntries(request.headers),
                    cookies,
                    state: {},
                    signals: {},
                    meta: undefined,
                } as RenderContext,
            };
        })
        .get(`${basePath}/*`, async ({ renderContext, set, request }) => {
            const url = new URL(request.url);
            const path = url.pathname;

            // Check if path should be excluded
            for (const excluded of excludePaths) {
                if (path.startsWith(excluded)) {
                    set.status = 404;
                    return 'Not Found';
                }
            }

            // Check cache
            const cacheKey = `ssr:${path}:${url.search}`;
            const cached = globalCache.get<SSRResult>(cacheKey);
            if (cached) {
                set.headers['X-Cache'] = 'HIT';
                set.headers['Cache-Control'] = cacheControl;
                set.headers['Content-Type'] = 'text/html; charset=utf-8';
                return cached.html;
            }

            try {
                // Use streaming if enabled and available
                if (enableStreaming && streamRender) {
                    return new Response(
                        new ReadableStream({
                            async start(controller) {
                                try {
                                    const encoder = new TextEncoder();
                                    for await (const chunk of streamRender(renderContext)) {
                                        controller.enqueue(encoder.encode(chunk));
                                    }
                                    controller.close();
                                } catch (error) {
                                    controller.error(error);
                                }
                            },
                        }),
                        {
                            headers: {
                                'Content-Type': 'text/html; charset=utf-8',
                                'Transfer-Encoding': 'chunked',
                                'Cache-Control': cacheControl,
                            },
                        }
                    );
                }

                // Standard render
                const result = await render(renderContext);

                // Handle redirects
                if (result.redirect) {
                    set.status = result.statusCode || 302;
                    set.redirect = result.redirect;
                    return;
                }

                // Apply custom headers
                if (result.headers) {
                    for (const [key, value] of Object.entries(result.headers)) {
                        set.headers[key] = value;
                    }
                }

                // Build full HTML
                const html = buildHtml(template, result, renderContext);

                // Cache successful responses
                if (!result.statusCode || result.statusCode < 400) {
                    globalCache.set(cacheKey, { ...result, html }, 300000); // 5 minutes
                }

                set.status = result.statusCode || 200;
                set.headers['Content-Type'] = 'text/html; charset=utf-8';
                set.headers['Cache-Control'] = cacheControl;
                set.headers['X-Cache'] = 'MISS';

                return html;
            } catch (error) {
                if (options.onError) {
                    const errorResult = await options.onError(error as Error, renderContext);
                    const html = buildHtml(template, errorResult, renderContext);
                    set.status = errorResult.statusCode || 500;
                    set.headers['Content-Type'] = 'text/html; charset=utf-8';
                    return html;
                }

                throw error;
            }
        });
}

function buildHtml(template: string, result: SSRResult, context: RenderContext): string {
    const metaTags = buildMetaTags(context.meta);
    const stateScript = result.state
        ? `<script>window.__PHILJS_STATE__=${JSON.stringify(result.state)}</script>`
        : '';

    return template
        .replace('<!--philjs-head-->', `${metaTags}${result.head || ''}`)
        .replace('<!--philjs-css-->', result.css || '')
        .replace('<!--philjs-html-->', result.html)
        .replace('<!--philjs-state-->', stateScript);
}

const defaultTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!--philjs-head-->
    <style><!--philjs-css--></style>
</head>
<body>
    <div id="app"><!--philjs-html--></div>
    <!--philjs-state-->
    <script type="module" src="/src/main.ts"></script>
</body>
</html>`;

// ============================================================================
// Security Plugin
// ============================================================================

export function security(options: SecurityOptions = {}) {
    const defaultOptions: SecurityOptions = {
        contentSecurityPolicy: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'https:', 'data:'],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
        },
        xFrameOptions: 'DENY',
        xContentTypeOptions: true,
        xXssProtection: true,
        strictTransportSecurity: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false,
        },
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
            camera: [],
            microphone: [],
            geolocation: [],
            'payment': ['self'],
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'same-origin',
    };

    const config = { ...defaultOptions, ...options };

    return new Elysia({ name: 'security' })
        .onBeforeHandle(({ set }) => {
            // Content Security Policy
            if (config.contentSecurityPolicy) {
                set.headers['Content-Security-Policy'] = buildCSPHeader(config.contentSecurityPolicy);
            }

            // X-Frame-Options
            if (config.xFrameOptions) {
                set.headers['X-Frame-Options'] = config.xFrameOptions;
            }

            // X-Content-Type-Options
            if (config.xContentTypeOptions) {
                set.headers['X-Content-Type-Options'] = 'nosniff';
            }

            // X-XSS-Protection
            if (config.xXssProtection) {
                set.headers['X-XSS-Protection'] = '1; mode=block';
            }

            // Strict-Transport-Security
            if (config.strictTransportSecurity) {
                const hsts = config.strictTransportSecurity;
                let value = `max-age=${hsts.maxAge || 31536000}`;
                if (hsts.includeSubDomains) value += '; includeSubDomains';
                if (hsts.preload) value += '; preload';
                set.headers['Strict-Transport-Security'] = value;
            }

            // Referrer-Policy
            if (config.referrerPolicy) {
                set.headers['Referrer-Policy'] = config.referrerPolicy;
            }

            // Permissions-Policy
            if (config.permissionsPolicy) {
                const policies = Object.entries(config.permissionsPolicy)
                    .map(([key, values]) => `${key}=(${values.join(' ')})`)
                    .join(', ');
                set.headers['Permissions-Policy'] = policies;
            }

            // Cross-Origin-Embedder-Policy
            if (config.crossOriginEmbedderPolicy) {
                set.headers['Cross-Origin-Embedder-Policy'] = config.crossOriginEmbedderPolicy;
            }

            // Cross-Origin-Opener-Policy
            if (config.crossOriginOpenerPolicy) {
                set.headers['Cross-Origin-Opener-Policy'] = config.crossOriginOpenerPolicy;
            }

            // Cross-Origin-Resource-Policy
            if (config.crossOriginResourcePolicy) {
                set.headers['Cross-Origin-Resource-Policy'] = config.crossOriginResourcePolicy;
            }
        });
}

// ============================================================================
// CORS Plugin
// ============================================================================

export function cors(options: CORSOptions = {}) {
    const {
        origin = '*',
        methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders = ['Content-Type', 'Authorization'],
        exposedHeaders = [],
        credentials = false,
        maxAge = 86400,
        preflight = true,
    } = options;

    function getOrigin(requestOrigin: string | null): string | null {
        if (typeof origin === 'string') {
            return origin === '*' ? '*' : origin;
        }
        if (Array.isArray(origin)) {
            return requestOrigin && origin.includes(requestOrigin) ? requestOrigin : null;
        }
        if (typeof origin === 'function' && requestOrigin) {
            const result = origin(requestOrigin);
            return typeof result === 'string' ? result : result ? requestOrigin : null;
        }
        return null;
    }

    return new Elysia({ name: 'cors' })
        .onBeforeHandle(({ request, set }) => {
            const requestOrigin = request.headers.get('origin');
            const allowedOrigin = getOrigin(requestOrigin);

            if (allowedOrigin) {
                set.headers['Access-Control-Allow-Origin'] = allowedOrigin;
            }

            if (credentials) {
                set.headers['Access-Control-Allow-Credentials'] = 'true';
            }

            if (exposedHeaders.length > 0) {
                set.headers['Access-Control-Expose-Headers'] = exposedHeaders.join(', ');
            }

            // Handle preflight
            if (preflight && request.method === 'OPTIONS') {
                set.headers['Access-Control-Allow-Methods'] = methods.join(', ');
                set.headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');
                set.headers['Access-Control-Max-Age'] = String(maxAge);

                set.status = 204;
                return '';
            }
        });
}

// ============================================================================
// Rate Limit Plugin
// ============================================================================

export function rateLimit(options: RateLimitOptions = {}) {
    const {
        windowMs = 60000,
        max = 100,
        message = 'Too many requests, please try again later.',
        statusCode = 429,
        keyGenerator = (ctx) => ctx.request.headers.get('x-forwarded-for') || 'unknown',
        skip,
        headers = true,
    } = options;

    const store = options.store || new InMemoryRateLimitStore(windowMs);

    return new Elysia({ name: 'rate-limit' })
        .onBeforeHandle(async ({ request, set }) => {
            if (skip) {
                const shouldSkip = await skip({ request, set } as any);
                if (shouldSkip) return;
            }

            const key = keyGenerator({ request, set } as any);
            const result = await store.increment(key);

            if (headers) {
                set.headers['X-RateLimit-Limit'] = String(max);
                set.headers['X-RateLimit-Remaining'] = String(Math.max(0, max - result.count));
                set.headers['X-RateLimit-Reset'] = String(Math.ceil(result.resetTime / 1000));
            }

            if (result.count > max) {
                const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
                set.headers['Retry-After'] = String(retryAfter);
                set.status = statusCode;
                return {
                    error: message,
                    retryAfter,
                };
            }
        });
}

// ============================================================================
// Session Plugin
// ============================================================================

export function session(options: SessionOptions) {
    const {
        secret,
        name = 'philjs.sid',
        maxAge = 86400000, // 24 hours
        httpOnly = true,
        secure = process.env.NODE_ENV === 'production',
        sameSite = 'lax',
        path = '/',
        domain,
        rolling = false,
        renew = false,
    } = options;

    const store = options.store || new InMemorySessionStore();

    return new Elysia({ name: 'session' })
        .derive(async ({ request, set }) => {
            const cookies = parseCookies(request.headers.get('cookie'));
            const signedSessionId = cookies[name];
            let sessionId: string | null = null;
            let sessionData: SessionData | null = null;

            if (signedSessionId) {
                sessionId = unsignValue(signedSessionId, secret);
                if (sessionId) {
                    sessionData = await store.get(sessionId);
                }
            }

            // Create new session if needed
            if (!sessionData) {
                sessionId = generateSessionId();
                sessionData = {
                    id: sessionId,
                    data: {},
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    expiresAt: Date.now() + maxAge,
                };
            }

            // Renew session if needed
            if (renew && sessionData.updatedAt < Date.now() - maxAge / 2) {
                const newSessionId = generateSessionId();
                await store.destroy(sessionData.id);
                sessionData.id = newSessionId;
                sessionId = newSessionId;
            }

            const sessionManager = {
                id: sessionId!,
                data: sessionData.data,

                get<T>(key: string): T | undefined {
                    return sessionData!.data[key];
                },

                set(key: string, value: any): void {
                    sessionData!.data[key] = value;
                    sessionData!.updatedAt = Date.now();
                },

                delete(key: string): void {
                    delete sessionData!.data[key];
                    sessionData!.updatedAt = Date.now();
                },

                async save(): Promise<void> {
                    await store.set(sessionId!, sessionData!, maxAge);
                    const signedId = signValue(sessionId!, secret);
                    const cookieParts = [
                        `${name}=${signedId}`,
                        `Max-Age=${Math.floor(maxAge / 1000)}`,
                        `Path=${path}`,
                    ];
                    if (domain) cookieParts.push(`Domain=${domain}`);
                    if (httpOnly) cookieParts.push('HttpOnly');
                    if (secure) cookieParts.push('Secure');
                    cookieParts.push(`SameSite=${sameSite}`);
                    set.headers['Set-Cookie'] = cookieParts.join('; ');
                },

                async destroy(): Promise<void> {
                    await store.destroy(sessionId!);
                    set.headers['Set-Cookie'] = `${name}=; Max-Age=0; Path=${path}`;
                },

                async regenerate(): Promise<void> {
                    await store.destroy(sessionId!);
                    sessionId = generateSessionId();
                    sessionData!.id = sessionId;
                    sessionData!.createdAt = Date.now();
                    sessionData!.updatedAt = Date.now();
                    await this.save();
                },

                async touch(): Promise<void> {
                    if (store.touch) {
                        await store.touch(sessionId!, maxAge);
                    }
                    if (rolling) {
                        await this.save();
                    }
                },
            };

            return { session: sessionManager };
        });
}

// ============================================================================
// Error Handler Plugin
// ============================================================================

export function errorHandler(options: ErrorHandlerOptions = {}) {
    const {
        includeStackTrace = process.env.NODE_ENV !== 'production',
        logErrors = true,
        onError,
    } = options;

    return new Elysia({ name: 'error-handler' })
        .onError(({ error, set, request }) => {
            if (logErrors) {
                console.error(`[${new Date().toISOString()}] Error:`, error);
            }

            if (onError) {
                onError(error, { request, set } as any);
            }

            if (error instanceof HttpError) {
                set.status = error.statusCode;
                return {
                    error: {
                        message: error.expose ? error.message : 'An error occurred',
                        code: error.code,
                        ...(error.details && error.expose ? { details: error.details } : {}),
                        ...(includeStackTrace && error.stack ? { stack: error.stack } : {}),
                    },
                };
            }

            if (error instanceof ValidationError) {
                set.status = 400;
                return {
                    error: {
                        message: 'Validation failed',
                        code: 'VALIDATION_ERROR',
                        errors: error.errors,
                    },
                };
            }

            set.status = 500;
            return {
                error: {
                    message: 'Internal server error',
                    code: 'INTERNAL_ERROR',
                    ...(includeStackTrace && error instanceof Error && error.stack
                        ? { stack: error.stack }
                        : {}),
                },
            };
        });
}

// ============================================================================
// Logger Plugin
// ============================================================================

export function logger(options: LoggerOptions = {}) {
    const {
        level = 'info',
        format = 'pretty',
        skip,
        customFields,
    } = options;

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[level];

    function log(logLevel: keyof typeof levels, message: string, data?: any) {
        if (levels[logLevel] < currentLevel) return;

        const timestamp = new Date().toISOString();
        const extra = customFields ? customFields({ request: data?.request, set: data?.set } as any) : {};

        if (format === 'json') {
            console.log(JSON.stringify({
                timestamp,
                level: logLevel,
                message,
                ...extra,
                ...data,
            }));
        } else if (format === 'combined') {
            // Apache combined log format
            console.log(`${data?.ip || '-'} - - [${timestamp}] "${data?.method} ${data?.path} HTTP/1.1" ${data?.status || '-'} ${data?.responseSize || '-'} "${data?.referer || '-'}" "${data?.userAgent || '-'}"`);
        } else {
            // Pretty format
            const statusColor = (data?.status || 200) < 400 ? '\x1b[32m' : '\x1b[31m';
            const reset = '\x1b[0m';
            console.log(`${timestamp} ${statusColor}${data?.method || 'GET'}${reset} ${data?.path || '/'} ${data?.status || '-'} ${data?.duration || '-'}ms`);
        }
    }

    return new Elysia({ name: 'logger' })
        .derive(({ request }) => {
            const startTime = Date.now();
            return { startTime };
        })
        .onAfterHandle(({ request, set, startTime }) => {
            if (skip && skip({ request, set } as any)) return;

            const url = new URL(request.url);
            const duration = Date.now() - startTime;

            log('info', 'Request completed', {
                method: request.method,
                path: url.pathname,
                status: set.status || 200,
                duration,
                ip: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent'),
                referer: request.headers.get('referer'),
                request,
                set,
            });
        });
}

// ============================================================================
// Health Check Plugin
// ============================================================================

export function healthCheck(options: HealthCheckOptions = {}) {
    const {
        path = '/_health',
        livenessPath = '/_health/live',
        readinessPath = '/_health/ready',
        checks = [],
    } = options;

    return new Elysia({ name: 'health-check' })
        .get(path, async ({ set }) => {
            const results = await runHealthChecks(checks);
            const overall = results.every(r => r.status === 'healthy') ? 'healthy' :
                           results.some(r => r.status === 'unhealthy' && r.critical) ? 'unhealthy' : 'degraded';

            set.status = overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503;

            return {
                status: overall,
                timestamp: new Date().toISOString(),
                checks: results,
            };
        })
        .get(livenessPath, () => {
            return {
                status: 'alive',
                timestamp: new Date().toISOString(),
            };
        })
        .get(readinessPath, async ({ set }) => {
            const criticalChecks = checks.filter(c => c.critical !== false);
            const results = await runHealthChecks(criticalChecks);
            const ready = results.every(r => r.status === 'healthy');

            set.status = ready ? 200 : 503;

            return {
                status: ready ? 'ready' : 'not_ready',
                timestamp: new Date().toISOString(),
                checks: results,
            };
        });
}

async function runHealthChecks(checks: HealthCheck[]): Promise<Array<HealthCheckResult & { name: string; critical?: boolean }>> {
    const results = await Promise.allSettled(
        checks.map(async (check) => {
            const startTime = Date.now();
            try {
                const result = await check.check();
                return {
                    name: check.name,
                    critical: check.critical,
                    ...result,
                    latency: result.latency ?? Date.now() - startTime,
                };
            } catch (error) {
                return {
                    name: check.name,
                    critical: check.critical,
                    status: 'unhealthy' as const,
                    message: error instanceof Error ? error.message : 'Check failed',
                    latency: Date.now() - startTime,
                };
            }
        })
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return {
            name: checks[index].name,
            critical: checks[index].critical,
            status: 'unhealthy' as const,
            message: 'Check failed unexpectedly',
        };
    });
}

// ============================================================================
// API Handler Helpers
// ============================================================================

export interface ApiContext<TBody = unknown, TParams = unknown, TQuery = unknown> {
    body: TBody;
    params: TParams;
    query: TQuery;
    headers: Record<string, string>;
    request: Request;
    set: any;
    session?: any;
}

export type ApiHandler<TBody = unknown, TParams = unknown, TQuery = unknown, TResponse = unknown> = (
    ctx: ApiContext<TBody, TParams, TQuery>
) => TResponse | Promise<TResponse>;

export function createHandler<TBody = unknown, TParams = unknown, TQuery = unknown, TResponse = unknown>(
    handler: ApiHandler<TBody, TParams, TQuery, TResponse>
): Handler {
    return async (ctx: any) => {
        const url = new URL(ctx.request.url);
        const apiContext: ApiContext<TBody, TParams, TQuery> = {
            body: ctx.body as TBody,
            params: ctx.params as TParams,
            query: Object.fromEntries(url.searchParams) as TQuery,
            headers: Object.fromEntries(ctx.request.headers),
            request: ctx.request,
            set: ctx.set,
            session: ctx.session,
        };
        return handler(apiContext);
    };
}

// Response helpers
export const response = {
    success<T>(data: T, meta?: { message?: string }) {
        return {
            success: true,
            data,
            ...(meta?.message && { message: meta.message }),
        };
    },

    created<T>(data: T, message = 'Created successfully') {
        return {
            success: true,
            data,
            message,
        };
    },

    paginated<T>(
        data: T[],
        pagination: { page: number; limit: number; total: number }
    ) {
        const { page, limit, total } = pagination;
        const totalPages = Math.ceil(total / limit);
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    },

    noContent() {
        return new Response(null, { status: 204 });
    },
};

// Request helpers
export const request = {
    parsePagination(query: Record<string, string | undefined>, defaults = { page: 1, limit: 20 }) {
        const page = Math.max(1, parseInt(query.page || String(defaults.page), 10) || defaults.page);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || String(defaults.limit), 10) || defaults.limit));
        const offset = (page - 1) * limit;
        return { page, limit, offset };
    },

    parseSort(query: Record<string, string | undefined>, allowedFields: string[], defaultField = 'createdAt') {
        const sortBy = query.sortBy && allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
        const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
        return { sortBy, sortOrder };
    },
};

// ============================================================================
// Server-Sent Events
// ============================================================================

export interface SSEOptions {
    retry?: number;
    headers?: Record<string, string>;
}

export function sse(options: SSEOptions = {}) {
    const { retry = 3000, headers = {} } = options;

    return {
        stream(generator: AsyncGenerator<SSEEvent, void, unknown>): Response {
            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();

                    try {
                        for await (const event of generator) {
                            let message = '';
                            if (event.id) message += `id: ${event.id}\n`;
                            if (event.event) message += `event: ${event.event}\n`;
                            if (event.retry) message += `retry: ${event.retry}\n`;
                            message += `data: ${JSON.stringify(event.data)}\n\n`;
                            controller.enqueue(encoder.encode(message));
                        }
                    } catch (error) {
                        console.error('SSE stream error:', error);
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    ...headers,
                },
            });
        },

        send(events: SSEEvent[]): Response {
            const encoder = new TextEncoder();
            let message = '';

            for (const event of events) {
                if (event.id) message += `id: ${event.id}\n`;
                if (event.event) message += `event: ${event.event}\n`;
                if (event.retry) message += `retry: ${event.retry}\n`;
                message += `data: ${JSON.stringify(event.data)}\n\n`;
            }

            return new Response(encoder.encode(message), {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    ...headers,
                },
            });
        },
    };
}

export interface SSEEvent {
    id?: string;
    event?: string;
    data: any;
    retry?: number;
}

export async function* createSignalStream<T>(
    signalFn: () => T,
    options: { interval?: number; signal?: AbortSignal } = {}
): AsyncGenerator<SSEEvent, void, unknown> {
    const { interval = 100, signal: abortSignal } = options;
    let lastValue: T | undefined;
    let eventId = 0;

    while (!abortSignal?.aborted) {
        const currentValue = signalFn();

        if (currentValue !== lastValue) {
            lastValue = currentValue;
            yield {
                id: String(++eventId),
                event: 'signal-update',
                data: currentValue,
            };
        }

        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

// ============================================================================
// WebSocket Support
// ============================================================================

export function websocket(options: WebSocketOptions = {}) {
    const {
        path = '/ws',
        heartbeat = 30000,
        onConnect,
        onMessage,
        onClose,
        onError,
    } = options;

    return new Elysia({ name: 'websocket' })
        .ws(path, {
            open(ws) {
                // Setup heartbeat
                if (heartbeat > 0) {
                    const interval = setInterval(() => {
                        try {
                            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                        } catch {
                            clearInterval(interval);
                        }
                    }, heartbeat);
                    (ws as any).__heartbeat = interval;
                }

                if (onConnect) {
                    onConnect(ws as any, {} as any);
                }
            },
            message(ws, message) {
                if (onMessage) {
                    onMessage(ws as any, message as any, {} as any);
                }
            },
            close(ws, code, reason) {
                // Cleanup heartbeat
                if ((ws as any).__heartbeat) {
                    clearInterval((ws as any).__heartbeat);
                }

                if (onClose) {
                    onClose(ws as any, code, reason as any, {} as any);
                }
            },
            error(ws, error) {
                if (onError) {
                    onError(ws as any, error, {} as any);
                }
            },
        });
}

// ============================================================================
// Validation Helpers
// ============================================================================

export interface ValidationSchema {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    properties?: Record<string, ValidationSchema>;
    items?: ValidationSchema;
    custom?: (value: any) => boolean | string;
}

export function validate<T>(
    data: unknown,
    schema: Record<string, ValidationSchema>
): { valid: true; data: T } | { valid: false; errors: Array<{ field: string; message: string; value?: any }> } {
    const errors: Array<{ field: string; message: string; value?: any }> = [];

    function validateField(value: any, fieldSchema: ValidationSchema, path: string): void {
        // Check required
        if (fieldSchema.required && (value === undefined || value === null)) {
            errors.push({ field: path, message: 'Field is required' });
            return;
        }

        if (value === undefined || value === null) return;

        // Type check
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldSchema.type) {
            errors.push({ field: path, message: `Expected ${fieldSchema.type}, got ${actualType}`, value });
            return;
        }

        // String validations
        if (fieldSchema.type === 'string') {
            if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
                errors.push({ field: path, message: `Minimum length is ${fieldSchema.minLength}`, value });
            }
            if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
                errors.push({ field: path, message: `Maximum length is ${fieldSchema.maxLength}`, value });
            }
            if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
                errors.push({ field: path, message: 'Invalid format', value });
            }
        }

        // Number validations
        if (fieldSchema.type === 'number') {
            if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                errors.push({ field: path, message: `Minimum value is ${fieldSchema.min}`, value });
            }
            if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                errors.push({ field: path, message: `Maximum value is ${fieldSchema.max}`, value });
            }
        }

        // Enum validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
            errors.push({ field: path, message: `Must be one of: ${fieldSchema.enum.join(', ')}`, value });
        }

        // Object validation
        if (fieldSchema.type === 'object' && fieldSchema.properties) {
            for (const [key, propSchema] of Object.entries(fieldSchema.properties)) {
                validateField(value[key], propSchema, `${path}.${key}`);
            }
        }

        // Array validation
        if (fieldSchema.type === 'array' && fieldSchema.items) {
            for (let i = 0; i < value.length; i++) {
                validateField(value[i], fieldSchema.items, `${path}[${i}]`);
            }
        }

        // Custom validation
        if (fieldSchema.custom) {
            const result = fieldSchema.custom(value);
            if (result !== true) {
                errors.push({ field: path, message: typeof result === 'string' ? result : 'Custom validation failed', value });
            }
        }
    }

    const dataObj = data as Record<string, any>;
    for (const [field, fieldSchema] of Object.entries(schema)) {
        validateField(dataObj[field], fieldSchema, field);
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true, data: data as T };
}

export function validateBody<T>(schema: Record<string, ValidationSchema>) {
    return (ctx: any) => {
        const result = validate<T>(ctx.body, schema);
        if (!result.valid) {
            throw new ValidationError(result.errors);
        }
        return result.data;
    };
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

export function gracefulShutdown(
    server: any,
    options: { timeout?: number; onShutdown?: () => Promise<void> } = {}
) {
    const { timeout = 30000, onShutdown } = options;
    let isShuttingDown = false;

    async function shutdown(signal: string) {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n[${signal}] Graceful shutdown initiated...`);

        const shutdownTimer = setTimeout(() => {
            console.error('Shutdown timeout - forcing exit');
            process.exit(1);
        }, timeout);

        try {
            if (onShutdown) {
                await onShutdown();
            }

            if (server?.stop) {
                await server.stop();
            }

            console.log('Graceful shutdown completed');
            clearTimeout(shutdownTimer);
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            clearTimeout(shutdownTimer);
            process.exit(1);
        }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return { shutdown };
}

// ============================================================================
// Create PhilJS Elysia App
// ============================================================================

export interface CreateAppOptions extends PhilJSPluginOptions {
    security?: SecurityOptions | false;
    cors?: CORSOptions | false;
    rateLimit?: RateLimitOptions | false;
    session?: Omit<SessionOptions, 'secret'> & { secret: string };
    logger?: LoggerOptions | false;
    healthCheck?: HealthCheckOptions | false;
    errorHandler?: ErrorHandlerOptions | false;
}

export function createApp(options: CreateAppOptions) {
    let app = new Elysia();

    // Error handler first
    if (options.errorHandler !== false) {
        app = app.use(errorHandler(options.errorHandler || {}));
    }

    // Logger
    if (options.logger !== false) {
        app = app.use(logger(options.logger || {}));
    }

    // Security
    if (options.security !== false) {
        app = app.use(security(options.security || {}));
    }

    // CORS
    if (options.cors !== false) {
        app = app.use(cors(options.cors || {}));
    }

    // Rate limiting
    if (options.rateLimit !== false) {
        app = app.use(rateLimit(options.rateLimit || {}));
    }

    // Session
    if (options.session) {
        app = app.use(session(options.session));
    }

    // Health check
    if (options.healthCheck !== false) {
        app = app.use(healthCheck(options.healthCheck || {}));
    }

    // PhilJS SSR
    app = app.use(philjs({
        render: options.render,
        streamRender: options.streamRender,
        template: options.template,
        templatePath: options.templatePath,
        basePath: options.basePath,
        excludePaths: options.excludePaths,
        cacheControl: options.cacheControl,
        enableStreaming: options.enableStreaming,
        onError: options.onError,
    }));

    return app;
}

// ============================================================================
// Exports
// ============================================================================

export {
    InMemoryRateLimitStore,
    InMemorySessionStore,
    InMemoryCache,
    globalCache,
};

/**
 * @philjs/adonis
 * Full AdonisJS integration for PhilJS SSR
 *
 * Features:
 * - Service Provider for IoC container
 * - SSR middleware with Edge templates
 * - API resource controllers
 * - Model integration with Lucid ORM
 * - Validator integration
 * - Event listeners and emitters
 * - Health check provider
 * - Cache integration
 * - Session management
 * - CSRF protection
 * - Rate limiting
 */

import { signal, computed, effect, batch } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export interface IoCContainer {
    bind<T>(key: string, callback: () => T): void;
    singleton<T>(key: string, callback: () => T): void;
    use<T>(key: string): T;
    make<T>(key: string): T;
    alias(alias: string, key: string): void;
}

export interface ServiceProvider {
    register(): void | Promise<void>;
    boot(): void | Promise<void>;
    shutdown?(): void | Promise<void>;
    ready?(): void | Promise<void>;
}

export interface HttpContext {
    request: HttpRequest;
    response: HttpResponse;
    params: Record<string, string>;
    session?: SessionManager;
    auth?: AuthManager;
    view?: ViewRenderer;
    bouncer?: BouncerAuthorization;
    logger: Logger;
}

export interface HttpRequest {
    url(): string;
    method(): string;
    param(key: string, defaultValue?: string): string;
    params(): Record<string, string>;
    input<T = any>(key: string, defaultValue?: T): T;
    all(): Record<string, any>;
    body(): Record<string, any>;
    headers(): Record<string, string | string[] | undefined>;
    header(key: string, defaultValue?: string): string | undefined;
    cookie(key: string, defaultValue?: string): string | undefined;
    cookies(): Record<string, string>;
    ip(): string;
    ips(): string[];
    accepts(types: string[]): string | null;
    is(types: string[]): string | null;
    hasBody(): boolean;
    ajax(): boolean;
    pjax(): boolean;
    secure(): boolean;
    hostname(): string;
    protocol(): string;
    intended(): string;
    completeUrl(): string;
}

export interface HttpResponse {
    status(code: number): this;
    header(key: string, value: string): this;
    type(contentType: string): this;
    send(body: any): void;
    json(body: any): void;
    html(body: string): void;
    redirect(url: string, sendParams?: boolean, status?: number): void;
    cookie(name: string, value: string, options?: CookieOptions): this;
    clearCookie(name: string): this;
    download(filePath: string, fileName?: string): Promise<void>;
    stream(stream: NodeJS.ReadableStream): void;
    abort(body: any, status?: number): never;
    safeStatus(status: number): this;
    getStatus(): number;
    getBody(): any;
}

export interface CookieOptions {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none' | boolean;
    secure?: boolean;
}

export interface SessionManager {
    get<T>(key: string, defaultValue?: T): T;
    put(key: string, value: any): void;
    all(): Record<string, any>;
    forget(key: string): void;
    clear(): void;
    pull<T>(key: string, defaultValue?: T): T;
    increment(key: string, amount?: number): void;
    decrement(key: string, amount?: number): void;
    has(key: string): boolean;
    flash(key: string, value: any): void;
    flashAll(): void;
    flashExcept(keys: string[]): void;
    flashOnly(keys: string[]): void;
    reflash(): void;
    reflashExcept(keys: string[]): void;
    regenerate(): Promise<void>;
}

export interface AuthManager {
    use(guard?: string): AuthGuard;
    check(): Promise<boolean>;
    authenticate(): Promise<any>;
    user?: any;
    isLoggedIn: boolean;
    isGuest: boolean;
    login(user: any, remember?: boolean): Promise<void>;
    logout(logoutAllDevices?: boolean): Promise<void>;
    loginViaId(id: string | number, remember?: boolean): Promise<void>;
    attempt(uid: string, password: string, remember?: boolean): Promise<any>;
}

export interface AuthGuard {
    check(): Promise<boolean>;
    authenticate(): Promise<any>;
    login(user: any, remember?: boolean): Promise<void>;
    logout(): Promise<void>;
    attempt(uid: string, password: string, remember?: boolean): Promise<any>;
    loginViaId(id: string | number, remember?: boolean): Promise<void>;
}

export interface ViewRenderer {
    render(template: string, data?: Record<string, any>): Promise<string>;
    renderSync(template: string, data?: Record<string, any>): string;
    share(data: Record<string, any>): this;
    registerTemplate(name: string, contents: string): void;
    registerTag(tag: TagDefinition): void;
}

export interface TagDefinition {
    tagName: string;
    seekable: boolean;
    block: boolean;
    compile(parser: any, buffer: any, token: any): void;
}

export interface BouncerAuthorization {
    allows(action: string, ...args: any[]): Promise<boolean>;
    denies(action: string, ...args: any[]): Promise<boolean>;
    authorize(action: string, ...args: any[]): Promise<void>;
    forUser(user: any): this;
    with(policy: string): this;
}

export interface Logger {
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    fatal(message: string, ...args: any[]): void;
    child(bindings: Record<string, any>): Logger;
}

export interface RenderContext {
    url: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    state: Record<string, any>;
    signals?: Record<string, any>;
    meta?: MetaInfo;
    auth?: {
        user?: any;
        isLoggedIn: boolean;
    };
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

// ============================================================================
// Error Classes
// ============================================================================

export class HttpError extends Error {
    public readonly status: number;
    public readonly code?: string;
    public readonly details?: any;
    public readonly expose: boolean;

    constructor(
        status: number,
        message: string,
        options: { code?: string; details?: any; expose?: boolean } = {}
    ) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = options.code;
        this.details = options.details;
        this.expose = options.expose ?? status < 500;
    }
}

export class ValidationException extends HttpError {
    public readonly flashToSession: boolean;
    public readonly messages: Record<string, string[]>;

    constructor(flashToSession: boolean, messages: Record<string, string[]>) {
        super(422, 'Validation failed', { code: 'E_VALIDATION_FAILURE' });
        this.name = 'ValidationException';
        this.flashToSession = flashToSession;
        this.messages = messages;
    }

    static fromMessages(messages: Record<string, string[]>): ValidationException {
        return new ValidationException(true, messages);
    }
}

export class AuthenticationException extends HttpError {
    public readonly guard: string;
    public readonly redirectTo?: string;

    constructor(message = 'Unauthenticated', guard = 'web', redirectTo?: string) {
        super(401, message, { code: 'E_UNAUTHORIZED_ACCESS' });
        this.name = 'AuthenticationException';
        this.guard = guard;
        this.redirectTo = redirectTo;
    }
}

export class AuthorizationException extends HttpError {
    constructor(message = 'Not authorized to perform this action') {
        super(403, message, { code: 'E_AUTHORIZATION_FAILURE' });
        this.name = 'AuthorizationException';
    }
}

export class NotFoundException extends HttpError {
    constructor(message = 'Resource not found') {
        super(404, message, { code: 'E_ROW_NOT_FOUND' });
        this.name = 'NotFoundException';
    }
}

export class RateLimitException extends HttpError {
    public readonly retryAfter: number;

    constructor(retryAfter: number, message = 'Too many requests') {
        super(429, message, { code: 'E_TOO_MANY_REQUESTS' });
        this.name = 'RateLimitException';
        this.retryAfter = retryAfter;
    }
}

export const E = {
    unauthorized: (message?: string, guard?: string, redirectTo?: string) =>
        new AuthenticationException(message, guard, redirectTo),
    forbidden: (message?: string) =>
        new AuthorizationException(message),
    notFound: (message?: string) =>
        new NotFoundException(message),
    badRequest: (message: string, details?: any) =>
        new HttpError(400, message, { code: 'E_BAD_REQUEST', details }),
    conflict: (message: string, details?: any) =>
        new HttpError(409, message, { code: 'E_CONFLICT', details }),
    validation: (messages: Record<string, string[]>) =>
        ValidationException.fromMessages(messages),
    tooManyRequests: (retryAfter = 60) =>
        new RateLimitException(retryAfter),
    internal: (message = 'Internal server error') =>
        new HttpError(500, message, { code: 'E_INTERNAL_ERROR', expose: false }),
};

// ============================================================================
// PhilJS Adonis Adapter
// ============================================================================

export class PhilAdonisAdapter {
    private services = new Map<string, any>();

    constructor(private container: IoCContainer) {}

    registerService<T>(name: string, service: T): void {
        this.container.bind(`Phil/${name}`, () => service);
        this.services.set(name, service);
    }

    registerSingleton<T>(name: string, factory: () => T): void {
        this.container.singleton(`Phil/${name}`, factory);
    }

    getService<T>(name: string): T {
        return this.container.use(`Phil/${name}`);
    }

    hasService(name: string): boolean {
        return this.services.has(name);
    }

    getAllServices(): Map<string, any> {
        return new Map(this.services);
    }
}

// ============================================================================
// Service Provider
// ============================================================================

export interface PhilJSProviderConfig {
    render: RenderFunction;
    streamRender?: StreamRenderFunction;
    template?: string;
    basePath?: string;
    excludePaths?: string[];
    cacheEnabled?: boolean;
    cacheTTL?: number;
}

export abstract class PhilJSProvider implements ServiceProvider {
    protected container: IoCContainer;
    protected config: PhilJSProviderConfig;
    protected adapter: PhilAdonisAdapter;

    constructor(container: IoCContainer, config: PhilJSProviderConfig) {
        this.container = container;
        this.config = config;
        this.adapter = new PhilAdonisAdapter(container);
    }

    register(): void {
        // Register PhilJS adapter
        this.container.singleton('Phil/Adapter', () => this.adapter);

        // Register SSR renderer
        this.container.singleton('Phil/SSR', () => ({
            render: this.config.render,
            streamRender: this.config.streamRender,
        }));

        // Register signal factory
        this.container.singleton('Phil/Signals', () => ({
            signal,
            computed,
            effect,
            batch,
        }));

        // Register cache if enabled
        if (this.config.cacheEnabled) {
            this.container.singleton('Phil/Cache', () => new SSRCache(this.config.cacheTTL));
        }
    }

    async boot(): Promise<void> {
        // Register view globals if view service is available
        try {
            const view = this.container.use<ViewRenderer>('Adonis/Core/View');
            if (view) {
                view.share({
                    philjs: {
                        signal,
                        computed,
                    },
                });
            }
        } catch {
            // View service not available
        }
    }

    async shutdown(): Promise<void> {
        // Cleanup cache
        try {
            const cache = this.container.use<SSRCache>('Phil/Cache');
            if (cache) {
                cache.clear();
            }
        } catch {
            // Cache not registered
        }
    }
}

// ============================================================================
// SSR Cache
// ============================================================================

export class SSRCache {
    private store = new Map<string, { value: SSRResult; expiresAt: number }>();
    private cleanupInterval: NodeJS.Timeout;

    constructor(private ttl: number = 300000) {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    get(key: string): SSRResult | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;

        if (Date.now() >= entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }

        return entry.value;
    }

    set(key: string, value: SSRResult, customTtl?: number): void {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (customTtl ?? this.ttl),
        });
    }

    delete(key: string): boolean {
        return this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    has(key: string): boolean {
        const entry = this.store.get(key);
        if (!entry) return false;
        if (Date.now() >= entry.expiresAt) {
            this.store.delete(key);
            return false;
        }
        return true;
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

// ============================================================================
// SSR Middleware
// ============================================================================

export interface SSRMiddlewareOptions {
    render: RenderFunction;
    streamRender?: StreamRenderFunction;
    template?: string;
    basePath?: string;
    excludePaths?: string[];
    cacheEnabled?: boolean;
    cache?: SSRCache;
    enableStreaming?: boolean;
    onError?: (error: Error, ctx: HttpContext) => SSRResult | Promise<SSRResult>;
}

export function createSSRMiddleware(options: SSRMiddlewareOptions) {
    const {
        render,
        streamRender,
        template = defaultTemplate,
        basePath = '',
        excludePaths = ['/api', '/_health', '/favicon.ico'],
        cacheEnabled = true,
        cache = new SSRCache(),
        enableStreaming = false,
        onError,
    } = options;

    return async function ssrMiddleware(ctx: HttpContext, next: () => Promise<void>): Promise<void> {
        const path = ctx.request.url();

        // Skip excluded paths
        for (const excluded of excludePaths) {
            if (path.startsWith(excluded)) {
                return next();
            }
        }

        // Skip non-GET requests
        if (ctx.request.method() !== 'GET') {
            return next();
        }

        // Build render context
        const renderContext = buildRenderContext(ctx);

        // Check cache
        if (cacheEnabled) {
            const cacheKey = `ssr:${path}`;
            const cached = cache.get(cacheKey);
            if (cached) {
                ctx.response.header('X-Cache', 'HIT');
                sendSSRResponse(ctx, cached, template, renderContext);
                return;
            }
        }

        try {
            // Streaming SSR
            if (enableStreaming && streamRender) {
                const stream = streamRender(renderContext);
                ctx.response.type('text/html');
                ctx.response.header('Transfer-Encoding', 'chunked');

                // Use Node.js stream
                const { Readable } = require('stream');
                const readable = Readable.from(stream);
                ctx.response.stream(readable);
                return;
            }

            // Standard SSR
            const result = await render(renderContext);

            // Handle redirects
            if (result.redirect) {
                ctx.response.redirect(result.redirect, false, result.statusCode || 302);
                return;
            }

            // Cache successful responses
            if (cacheEnabled && (!result.statusCode || result.statusCode < 400)) {
                const cacheKey = `ssr:${path}`;
                cache.set(cacheKey, result);
            }

            ctx.response.header('X-Cache', 'MISS');
            sendSSRResponse(ctx, result, template, renderContext);
        } catch (error) {
            if (onError) {
                const errorResult = await onError(error as Error, ctx);
                sendSSRResponse(ctx, errorResult, template, renderContext);
                return;
            }
            throw error;
        }
    };
}

function buildRenderContext(ctx: HttpContext): RenderContext {
    const request = ctx.request;
    const url = request.completeUrl();
    const parsedUrl = new URL(url);

    return {
        url,
        path: parsedUrl.pathname,
        query: Object.fromEntries(parsedUrl.searchParams),
        headers: request.headers() as Record<string, string>,
        cookies: request.cookies(),
        state: {},
        signals: {},
        meta: undefined,
        auth: ctx.auth
            ? {
                  user: ctx.auth.user,
                  isLoggedIn: ctx.auth.isLoggedIn,
              }
            : undefined,
    };
}

function sendSSRResponse(
    ctx: HttpContext,
    result: SSRResult,
    template: string,
    renderContext: RenderContext
): void {
    const html = buildHtml(template, result, renderContext);

    if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
            ctx.response.header(key, value);
        }
    }

    ctx.response.status(result.statusCode || 200);
    ctx.response.type('text/html');
    ctx.response.send(html);
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
        if (og.description)
            tags.push(`<meta property="og:description" content="${escapeHtml(og.description)}">`);
        if (og.image) tags.push(`<meta property="og:image" content="${escapeHtml(og.image)}">`);
        if (og.url) tags.push(`<meta property="og:url" content="${escapeHtml(og.url)}">`);
        if (og.type) tags.push(`<meta property="og:type" content="${escapeHtml(og.type)}">`);
        if (og.siteName)
            tags.push(`<meta property="og:site_name" content="${escapeHtml(og.siteName)}">`);
    }

    if (meta.twitter) {
        const tw = meta.twitter;
        if (tw.card) tags.push(`<meta name="twitter:card" content="${escapeHtml(tw.card)}">`);
        if (tw.site) tags.push(`<meta name="twitter:site" content="${escapeHtml(tw.site)}">`);
        if (tw.creator)
            tags.push(`<meta name="twitter:creator" content="${escapeHtml(tw.creator)}">`);
        if (tw.title) tags.push(`<meta name="twitter:title" content="${escapeHtml(tw.title)}">`);
        if (tw.description)
            tags.push(`<meta name="twitter:description" content="${escapeHtml(tw.description)}">`);
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
    <script type="module" src="/resources/js/app.js"></script>
</body>
</html>`;

// ============================================================================
// API Resource Controller
// ============================================================================

export interface ResourceConfig<T = any> {
    model?: new () => T;
    validator?: {
        store?: new () => any;
        update?: new () => any;
    };
    serializer?: (item: T) => any;
    authorize?: boolean;
    softDeletes?: boolean;
    perPage?: number;
}

export abstract class ResourceController<T = any> {
    protected config: ResourceConfig<T>;
    protected model: any;

    constructor(config: ResourceConfig<T> = {}) {
        this.config = {
            authorize: true,
            softDeletes: false,
            perPage: 20,
            ...config,
        };
    }

    async index(ctx: HttpContext): Promise<void> {
        if (this.config.authorize) {
            await this.authorize(ctx, 'viewAny');
        }

        const page = parseInt(ctx.request.input('page', '1'), 10);
        const perPage = parseInt(
            ctx.request.input('per_page', String(this.config.perPage)),
            10
        );

        const query = this.buildIndexQuery(ctx);
        const items = await query.paginate(page, perPage);

        const serialized = items.all().map((item: T) =>
            this.config.serializer ? this.config.serializer(item) : item
        );

        ctx.response.json({
            data: serialized,
            meta: {
                total: items.total,
                perPage: items.perPage,
                currentPage: items.currentPage,
                lastPage: items.lastPage,
                firstPage: items.firstPage,
                hasMorePages: items.hasMorePages,
            },
        });
    }

    async show(ctx: HttpContext): Promise<void> {
        const id = ctx.params.id;
        const item = await this.findOrFail(id);

        if (this.config.authorize) {
            await this.authorize(ctx, 'view', item);
        }

        const serialized = this.config.serializer ? this.config.serializer(item) : item;

        ctx.response.json({
            data: serialized,
        });
    }

    async store(ctx: HttpContext): Promise<void> {
        if (this.config.authorize) {
            await this.authorize(ctx, 'create');
        }

        const data = await this.validate(ctx, 'store');
        const item = await this.createItem(data, ctx);

        const serialized = this.config.serializer ? this.config.serializer(item) : item;

        ctx.response.status(201).json({
            data: serialized,
            message: 'Created successfully',
        });
    }

    async update(ctx: HttpContext): Promise<void> {
        const id = ctx.params.id;
        const item = await this.findOrFail(id);

        if (this.config.authorize) {
            await this.authorize(ctx, 'update', item);
        }

        const data = await this.validate(ctx, 'update');
        const updated = await this.updateItem(item, data, ctx);

        const serialized = this.config.serializer ? this.config.serializer(updated) : updated;

        ctx.response.json({
            data: serialized,
            message: 'Updated successfully',
        });
    }

    async destroy(ctx: HttpContext): Promise<void> {
        const id = ctx.params.id;
        const item = await this.findOrFail(id);

        if (this.config.authorize) {
            await this.authorize(ctx, 'delete', item);
        }

        if (this.config.softDeletes) {
            await this.softDeleteItem(item, ctx);
        } else {
            await this.deleteItem(item, ctx);
        }

        ctx.response.status(204).send(null);
    }

    async restore(ctx: HttpContext): Promise<void> {
        if (!this.config.softDeletes) {
            throw new NotFoundException('Restore not supported');
        }

        const id = ctx.params.id;
        const item = await this.findTrashedOrFail(id);

        if (this.config.authorize) {
            await this.authorize(ctx, 'restore', item);
        }

        await this.restoreItem(item, ctx);

        const serialized = this.config.serializer ? this.config.serializer(item) : item;

        ctx.response.json({
            data: serialized,
            message: 'Restored successfully',
        });
    }

    async forceDestroy(ctx: HttpContext): Promise<void> {
        if (!this.config.softDeletes) {
            throw new NotFoundException('Force delete not supported');
        }

        const id = ctx.params.id;
        const item = await this.findTrashedOrFail(id);

        if (this.config.authorize) {
            await this.authorize(ctx, 'forceDelete', item);
        }

        await this.deleteItem(item, ctx);

        ctx.response.status(204).send(null);
    }

    // Abstract methods to be implemented
    protected abstract buildIndexQuery(ctx: HttpContext): any;
    protected abstract findOrFail(id: string): Promise<T>;
    protected abstract findTrashedOrFail(id: string): Promise<T>;
    protected abstract createItem(data: any, ctx: HttpContext): Promise<T>;
    protected abstract updateItem(item: T, data: any, ctx: HttpContext): Promise<T>;
    protected abstract deleteItem(item: T, ctx: HttpContext): Promise<void>;
    protected abstract softDeleteItem(item: T, ctx: HttpContext): Promise<void>;
    protected abstract restoreItem(item: T, ctx: HttpContext): Promise<void>;

    protected async authorize(ctx: HttpContext, action: string, item?: T): Promise<void> {
        if (!ctx.bouncer) return;

        const allowed = item
            ? await ctx.bouncer.allows(action, item)
            : await ctx.bouncer.allows(action);

        if (!allowed) {
            throw new AuthorizationException();
        }
    }

    protected async validate(ctx: HttpContext, type: 'store' | 'update'): Promise<any> {
        const validator = type === 'store'
            ? this.config.validator?.store
            : this.config.validator?.update;

        if (!validator) {
            return ctx.request.all();
        }

        // Assume validator is an AdonisJS validator class
        const validatorInstance = new validator();
        return validatorInstance.validate(ctx.request);
    }
}

// ============================================================================
// Rate Limiting Middleware
// ============================================================================

export interface RateLimitConfig {
    requests: number;
    duration: number; // in seconds
    key?: string | ((ctx: HttpContext) => string);
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onRateLimited?: (ctx: HttpContext, remaining: number) => void;
}

export class RateLimiter {
    private store = new Map<string, { count: number; resetAt: number }>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
        const now = Date.now();
        const entry = this.store.get(key);
        const windowMs = config.duration * 1000;

        if (!entry || now >= entry.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + windowMs });
            return { allowed: true, remaining: config.requests - 1, resetAt: now + windowMs };
        }

        if (entry.count >= config.requests) {
            return { allowed: false, remaining: 0, resetAt: entry.resetAt };
        }

        entry.count++;
        return { allowed: true, remaining: config.requests - entry.count, resetAt: entry.resetAt };
    }

    increment(key: string, config: RateLimitConfig): void {
        const now = Date.now();
        const entry = this.store.get(key);
        const windowMs = config.duration * 1000;

        if (!entry || now >= entry.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + windowMs });
        } else {
            entry.count++;
        }
    }

    decrement(key: string): void {
        const entry = this.store.get(key);
        if (entry && entry.count > 0) {
            entry.count--;
        }
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now >= entry.resetAt) {
                this.store.delete(key);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

const globalRateLimiter = new RateLimiter();

export function createRateLimitMiddleware(config: RateLimitConfig) {
    const {
        requests,
        duration,
        key = (ctx) => ctx.request.ip(),
        message = 'Too many requests. Please try again later.',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        onRateLimited,
    } = config;

    return async function rateLimitMiddleware(
        ctx: HttpContext,
        next: () => Promise<void>
    ): Promise<void> {
        const rateLimitKey = typeof key === 'function' ? key(ctx) : key;
        const result = globalRateLimiter.check(rateLimitKey, config);

        ctx.response.header('X-RateLimit-Limit', String(requests));
        ctx.response.header('X-RateLimit-Remaining', String(result.remaining));
        ctx.response.header('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

        if (!result.allowed) {
            const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
            ctx.response.header('Retry-After', String(retryAfter));

            if (onRateLimited) {
                onRateLimited(ctx, result.remaining);
            }

            throw new RateLimitException(retryAfter, message);
        }

        try {
            await next();

            if (skipSuccessfulRequests && ctx.response.getStatus() < 400) {
                globalRateLimiter.decrement(rateLimitKey);
            }
        } catch (error) {
            if (skipFailedRequests) {
                globalRateLimiter.decrement(rateLimitKey);
            }
            throw error;
        }
    };
}

// ============================================================================
// Security Middleware
// ============================================================================

export interface SecurityConfig {
    xFrameOptions?: 'DENY' | 'SAMEORIGIN' | false;
    xContentTypeOptions?: boolean;
    xXssProtection?: boolean;
    strictTransportSecurity?: {
        maxAge: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    } | false;
    contentSecurityPolicy?: Record<string, string[]> | false;
    referrerPolicy?: string | false;
    permissionsPolicy?: Record<string, string[]> | false;
}

export function createSecurityMiddleware(config: SecurityConfig = {}) {
    const defaults: SecurityConfig = {
        xFrameOptions: 'DENY',
        xContentTypeOptions: true,
        xXssProtection: true,
        strictTransportSecurity: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: false,
        },
        contentSecurityPolicy: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'", 'https:', 'data:'],
        },
        referrerPolicy: 'strict-origin-when-cross-origin',
    };

    const settings = { ...defaults, ...config };

    return async function securityMiddleware(
        ctx: HttpContext,
        next: () => Promise<void>
    ): Promise<void> {
        if (settings.xFrameOptions) {
            ctx.response.header('X-Frame-Options', settings.xFrameOptions);
        }

        if (settings.xContentTypeOptions) {
            ctx.response.header('X-Content-Type-Options', 'nosniff');
        }

        if (settings.xXssProtection) {
            ctx.response.header('X-XSS-Protection', '1; mode=block');
        }

        if (settings.strictTransportSecurity) {
            const hsts = settings.strictTransportSecurity;
            let value = `max-age=${hsts.maxAge}`;
            if (hsts.includeSubDomains) value += '; includeSubDomains';
            if (hsts.preload) value += '; preload';
            ctx.response.header('Strict-Transport-Security', value);
        }

        if (settings.contentSecurityPolicy) {
            const csp = Object.entries(settings.contentSecurityPolicy)
                .map(([key, values]) => `${key} ${values.join(' ')}`)
                .join('; ');
            ctx.response.header('Content-Security-Policy', csp);
        }

        if (settings.referrerPolicy) {
            ctx.response.header('Referrer-Policy', settings.referrerPolicy);
        }

        if (settings.permissionsPolicy) {
            const pp = Object.entries(settings.permissionsPolicy)
                .map(([key, values]) => `${key}=(${values.join(' ')})`)
                .join(', ');
            ctx.response.header('Permissions-Policy', pp);
        }

        await next();
    };
}

// ============================================================================
// CORS Middleware
// ============================================================================

export interface CorsConfig {
    origin?: string | string[] | ((origin: string) => boolean | string);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

export function createCorsMiddleware(config: CorsConfig = {}) {
    const {
        origin = '*',
        methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders = ['Content-Type', 'Authorization'],
        exposedHeaders = [],
        credentials = false,
        maxAge = 86400,
    } = config;

    function getOrigin(requestOrigin: string | undefined): string | null {
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

    return async function corsMiddleware(
        ctx: HttpContext,
        next: () => Promise<void>
    ): Promise<void> {
        const requestOrigin = ctx.request.header('origin');
        const allowedOrigin = getOrigin(requestOrigin);

        if (allowedOrigin) {
            ctx.response.header('Access-Control-Allow-Origin', allowedOrigin);
        }

        if (credentials) {
            ctx.response.header('Access-Control-Allow-Credentials', 'true');
        }

        if (exposedHeaders.length > 0) {
            ctx.response.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
        }

        // Handle preflight
        if (ctx.request.method() === 'OPTIONS') {
            ctx.response.header('Access-Control-Allow-Methods', methods.join(', '));
            ctx.response.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
            ctx.response.header('Access-Control-Max-Age', String(maxAge));
            ctx.response.status(204).send('');
            return;
        }

        await next();
    };
}

// ============================================================================
// Health Check Provider
// ============================================================================

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

export class HealthCheckService {
    private checks: HealthCheck[] = [];

    register(check: HealthCheck): void {
        this.checks.push(check);
    }

    async run(): Promise<{
        status: 'healthy' | 'unhealthy' | 'degraded';
        checks: Array<HealthCheckResult & { name: string }>;
    }> {
        const results = await Promise.allSettled(
            this.checks.map(async (check) => {
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

        const checkResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            return {
                name: this.checks[index].name,
                status: 'unhealthy' as const,
                message: 'Check failed unexpectedly',
            };
        });

        const overall = checkResults.every((r) => r.status === 'healthy')
            ? 'healthy'
            : checkResults.some((r) => r.status === 'unhealthy' && r.critical)
            ? 'unhealthy'
            : 'degraded';

        return { status: overall, checks: checkResults };
    }

    async isReady(): Promise<boolean> {
        const criticalChecks = this.checks.filter((c) => c.critical !== false);
        const results = await Promise.allSettled(
            criticalChecks.map((check) => check.check())
        );
        return results.every(
            (r) => r.status === 'fulfilled' && r.value.status === 'healthy'
        );
    }

    isAlive(): boolean {
        return true;
    }
}

export function createHealthCheckController(healthService: HealthCheckService) {
    return {
        async index(ctx: HttpContext): Promise<void> {
            const result = await healthService.run();
            const status = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

            ctx.response.status(status).json({
                status: result.status,
                timestamp: new Date().toISOString(),
                checks: result.checks,
            });
        },

        async liveness(ctx: HttpContext): Promise<void> {
            ctx.response.json({
                status: healthService.isAlive() ? 'alive' : 'dead',
                timestamp: new Date().toISOString(),
            });
        },

        async readiness(ctx: HttpContext): Promise<void> {
            const ready = await healthService.isReady();
            ctx.response.status(ready ? 200 : 503).json({
                status: ready ? 'ready' : 'not_ready',
                timestamp: new Date().toISOString(),
            });
        },
    };
}

// ============================================================================
// Event Emitter Integration
// ============================================================================

export interface PhilJSEvent {
    name: string;
    data: any;
    timestamp: number;
}

export class PhilJSEventEmitter {
    private listeners = new Map<string, Array<(event: PhilJSEvent) => void | Promise<void>>>();

    on(eventName: string, listener: (event: PhilJSEvent) => void | Promise<void>): () => void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)!.push(listener);

        return () => {
            const listeners = this.listeners.get(eventName);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    async emit(eventName: string, data: any): Promise<void> {
        const event: PhilJSEvent = {
            name: eventName,
            data,
            timestamp: Date.now(),
        };

        const listeners = this.listeners.get(eventName);
        if (listeners) {
            await Promise.all(listeners.map((listener) => listener(event)));
        }

        // Emit wildcard event
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
            await Promise.all(wildcardListeners.map((listener) => listener(event)));
        }
    }

    off(eventName: string, listener?: (event: PhilJSEvent) => void | Promise<void>): void {
        if (!listener) {
            this.listeners.delete(eventName);
            return;
        }

        const listeners = this.listeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    once(eventName: string, listener: (event: PhilJSEvent) => void | Promise<void>): () => void {
        const wrappedListener = async (event: PhilJSEvent) => {
            this.off(eventName, wrappedListener);
            await listener(event);
        };
        return this.on(eventName, wrappedListener);
    }

    removeAllListeners(): void {
        this.listeners.clear();
    }
}

// ============================================================================
// Signal Store for SSR State
// ============================================================================

export class SignalStore {
    private signals = new Map<string, ReturnType<typeof signal>>();
    private computeds = new Map<string, ReturnType<typeof computed>>();

    createSignal<T>(key: string, initialValue: T): ReturnType<typeof signal<T>> {
        if (this.signals.has(key)) {
            return this.signals.get(key) as ReturnType<typeof signal<T>>;
        }
        const s = signal(initialValue);
        this.signals.set(key, s as any);
        return s;
    }

    createComputed<T>(key: string, fn: () => T): ReturnType<typeof computed<T>> {
        if (this.computeds.has(key)) {
            return this.computeds.get(key) as ReturnType<typeof computed<T>>;
        }
        const c = computed(fn);
        this.computeds.set(key, c as any);
        return c;
    }

    getSignal<T>(key: string): ReturnType<typeof signal<T>> | undefined {
        return this.signals.get(key) as ReturnType<typeof signal<T>> | undefined;
    }

    getComputed<T>(key: string): ReturnType<typeof computed<T>> | undefined {
        return this.computeds.get(key) as ReturnType<typeof computed<T>> | undefined;
    }

    serialize(): Record<string, any> {
        const state: Record<string, any> = {};
        for (const [key, s] of this.signals.entries()) {
            state[key] = (s as any)();
        }
        return state;
    }

    hydrate(state: Record<string, any>): void {
        for (const [key, value] of Object.entries(state)) {
            const s = this.signals.get(key);
            if (s) {
                (s as any)(value);
            }
        }
    }

    clear(): void {
        this.signals.clear();
        this.computeds.clear();
    }
}

// ============================================================================
// Server-Sent Events
// ============================================================================

export interface SSEEvent {
    id?: string;
    event?: string;
    data: any;
    retry?: number;
}

export function createSSEStream(ctx: HttpContext) {
    ctx.response.type('text/event-stream');
    ctx.response.header('Cache-Control', 'no-cache');
    ctx.response.header('Connection', 'keep-alive');

    const { Readable } = require('stream');
    let controller: any;

    const stream = new Readable({
        read() {},
    });

    return {
        send(event: SSEEvent): void {
            let message = '';
            if (event.id) message += `id: ${event.id}\n`;
            if (event.event) message += `event: ${event.event}\n`;
            if (event.retry) message += `retry: ${event.retry}\n`;
            message += `data: ${JSON.stringify(event.data)}\n\n`;
            stream.push(message);
        },

        close(): void {
            stream.push(null);
        },

        get readable(): NodeJS.ReadableStream {
            return stream;
        },

        start(): void {
            ctx.response.stream(stream);
        },
    };
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

        await new Promise((resolve) => setTimeout(resolve, interval));
    }
}

// ============================================================================
// Validation Helpers
// ============================================================================

export interface ValidationRule {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url' | 'uuid';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
}

export function validate(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
): { valid: true; data: Record<string, any> } | { valid: false; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};

    for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];
        const fieldErrors: string[] = [];

        // Required check
        if (rule.required && (value === undefined || value === null || value === '')) {
            fieldErrors.push('This field is required');
            errors[field] = fieldErrors;
            continue;
        }

        if (value === undefined || value === null) continue;

        // Type checks
        switch (rule.type) {
            case 'string':
                if (typeof value !== 'string') {
                    fieldErrors.push('Must be a string');
                }
                break;
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) {
                    fieldErrors.push('Must be a number');
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    fieldErrors.push('Must be a boolean');
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    fieldErrors.push('Must be an array');
                }
                break;
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value)) {
                    fieldErrors.push('Must be an object');
                }
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    fieldErrors.push('Must be a valid email');
                }
                break;
            case 'url':
                try {
                    new URL(value);
                } catch {
                    fieldErrors.push('Must be a valid URL');
                }
                break;
            case 'uuid':
                if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
                    fieldErrors.push('Must be a valid UUID');
                }
                break;
        }

        // String length validations
        if (typeof value === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
                fieldErrors.push(`Minimum length is ${rule.minLength}`);
            }
            if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                fieldErrors.push(`Maximum length is ${rule.maxLength}`);
            }
            if (rule.pattern && !rule.pattern.test(value)) {
                fieldErrors.push('Invalid format');
            }
        }

        // Number range validations
        if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                fieldErrors.push(`Minimum value is ${rule.min}`);
            }
            if (rule.max !== undefined && value > rule.max) {
                fieldErrors.push(`Maximum value is ${rule.max}`);
            }
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
            fieldErrors.push(`Must be one of: ${rule.enum.join(', ')}`);
        }

        // Custom validation
        if (rule.custom) {
            const result = rule.custom(value);
            if (result !== true) {
                fieldErrors.push(typeof result === 'string' ? result : 'Validation failed');
            }
        }

        if (fieldErrors.length > 0) {
            errors[field] = fieldErrors;
        }
    }

    if (Object.keys(errors).length > 0) {
        return { valid: false, errors };
    }

    return { valid: true, data };
}

export function validateOrThrow(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
): Record<string, any> {
    const result = validate(data, rules);
    if (!result.valid) {
        throw ValidationException.fromMessages(result.errors);
    }
    return result.data;
}

// ============================================================================
// Response Helpers
// ============================================================================

export const response = {
    success<T>(ctx: HttpContext, data: T, meta?: { message?: string }): void {
        ctx.response.json({
            success: true,
            data,
            ...(meta?.message && { message: meta.message }),
        });
    },

    created<T>(ctx: HttpContext, data: T, message = 'Created successfully'): void {
        ctx.response.status(201).json({
            success: true,
            data,
            message,
        });
    },

    paginated<T>(
        ctx: HttpContext,
        data: T[],
        meta: { page: number; perPage: number; total: number }
    ): void {
        const totalPages = Math.ceil(meta.total / meta.perPage);
        ctx.response.json({
            success: true,
            data,
            meta: {
                ...meta,
                totalPages,
                hasNext: meta.page < totalPages,
                hasPrev: meta.page > 1,
            },
        });
    },

    noContent(ctx: HttpContext): void {
        ctx.response.status(204).send(null);
    },

    error(ctx: HttpContext, status: number, message: string, code?: string): void {
        ctx.response.status(status).json({
            success: false,
            error: {
                message,
                code,
            },
        });
    },
};

// ============================================================================
// Request Helpers
// ============================================================================

export const request = {
    pagination(ctx: HttpContext, defaults = { page: 1, perPage: 20 }) {
        const page = Math.max(1, parseInt(ctx.request.input('page', String(defaults.page)), 10));
        const perPage = Math.min(
            100,
            Math.max(1, parseInt(ctx.request.input('per_page', String(defaults.perPage)), 10))
        );
        const offset = (page - 1) * perPage;
        return { page, perPage, offset };
    },

    sorting(ctx: HttpContext, allowedFields: string[], defaultField = 'created_at') {
        const sortBy = ctx.request.input('sort_by', defaultField);
        const sortOrder = ctx.request.input('sort_order', 'desc');
        return {
            sortBy: allowedFields.includes(sortBy) ? sortBy : defaultField,
            sortOrder: sortOrder === 'asc' ? 'asc' : ('desc' as 'asc' | 'desc'),
        };
    },

    filters(ctx: HttpContext, allowedFilters: string[]): Record<string, any> {
        const filters: Record<string, any> = {};
        for (const filter of allowedFilters) {
            const value = ctx.request.input(filter);
            if (value !== undefined && value !== null && value !== '') {
                filters[filter] = value;
            }
        }
        return filters;
    },
};

// ============================================================================
// Exports
// ============================================================================

export {
    signal,
    computed,
    effect,
    batch,
    globalRateLimiter,
};

/**
 * PhilJS Meta - Server Middleware
 *
 * Implements middleware system with:
 * - Request/response manipulation
 * - Auth middleware
 * - CORS middleware
 * - Rate limiting
 * - Compression
 */
/**
 * Middleware context
 */
export interface MiddlewareContext {
    /** Original request */
    request: Request;
    /** URL parsed from request */
    url: URL;
    /** Route parameters */
    params: Record<string, string | string[]>;
    /** Response headers to modify */
    responseHeaders: Headers;
    /** Server environment */
    env: Record<string, string>;
    /** Request ID for tracing */
    requestId: string;
    /** IP address of the client */
    ip: string;
    /** Geo information (if available) */
    geo?: GeoInfo;
    /** Request timing */
    timing: RequestTiming;
    /** Local storage for middleware data */
    locals: Map<string, unknown>;
}
/**
 * Geo information
 */
export interface GeoInfo {
    city?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
}
/**
 * Request timing information
 */
export interface RequestTiming {
    /** Request start time */
    start: number;
    /** Get elapsed time in milliseconds */
    elapsed(): number;
}
/**
 * Middleware function type
 */
export type MiddlewareFunction = (context: MiddlewareContext, next: () => Promise<Response>) => Promise<Response>;
/**
 * Middleware result
 */
export type MiddlewareResult = Response | NextResponse | void | undefined;
/**
 * Next response for middleware chaining
 */
export declare class NextResponse extends Response {
    private _cookies;
    private _rewrite?;
    private _redirect?;
    /**
     * Create a next response (continue to next middleware/handler)
     */
    static next(init?: ResponseInit): NextResponse;
    /**
     * Create a redirect response
     */
    static redirect(url: string | URL, status?: number): NextResponse;
    /**
     * Create a rewrite response (internal redirect without URL change)
     */
    static rewrite(url: string | URL): NextResponse;
    /**
     * Create a JSON response
     */
    static json<T>(data: T, init?: ResponseInit): NextResponse;
    /**
     * Set a cookie
     */
    cookie(name: string, value: string, options?: CookieOptions): this;
    /**
     * Delete a cookie
     */
    deleteCookie(name: string): this;
    /**
     * Get the rewrite URL if set
     */
    get rewriteUrl(): URL | undefined;
    /**
     * Get the redirect info if set
     */
    get redirectInfo(): {
        url: URL;
        status: number;
    } | undefined;
    /**
     * Get all cookies to set
     */
    get cookies(): Map<string, CookieValue>;
}
interface CookieValue {
    value: string;
    options?: CookieOptions | undefined;
}
interface CookieOptions {
    domain?: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}
/**
 * Middleware chain executor
 */
export declare class MiddlewareChain {
    private middlewares;
    /**
     * Add middleware to the chain
     */
    use(middleware: MiddlewareFunction): this;
    /**
     * Execute the middleware chain
     */
    execute(context: MiddlewareContext, handler: () => Promise<Response>): Promise<Response>;
}
/**
 * Create middleware context from request
 */
export declare function createMiddlewareContext(request: Request, params?: Record<string, string | string[]>, env?: Record<string, string>): MiddlewareContext;
/**
 * CORS middleware configuration
 */
export interface CORSOptions {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
/**
 * Create CORS middleware
 */
export declare function cors(options?: CORSOptions): MiddlewareFunction;
/**
 * Auth middleware configuration
 */
export interface AuthOptions {
    /** Check if request is authenticated */
    isAuthenticated: (context: MiddlewareContext) => boolean | Promise<boolean>;
    /** Get user from request */
    getUser?: (context: MiddlewareContext) => unknown | Promise<unknown>;
    /** Redirect URL for unauthenticated requests */
    loginUrl?: string;
    /** Paths that don't require authentication */
    publicPaths?: (string | RegExp)[];
    /** Response for unauthorized API requests */
    unauthorizedResponse?: Response;
}
/**
 * Create auth middleware
 */
export declare function auth(options: AuthOptions): MiddlewareFunction;
/**
 * Rate limit configuration
 */
export interface RateLimitOptions {
    /** Maximum requests per window */
    limit: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Key generator (defaults to IP) */
    keyGenerator?: (context: MiddlewareContext) => string;
    /** Response when rate limit is exceeded */
    onRateLimit?: (context: MiddlewareContext) => Response;
    /** Skip rate limiting for certain requests */
    skip?: (context: MiddlewareContext) => boolean;
    /** Store for rate limit data */
    store?: RateLimitStore;
}
/**
 * Rate limit store interface
 */
export interface RateLimitStore {
    get(key: string): Promise<RateLimitInfo | undefined>;
    set(key: string, info: RateLimitInfo): Promise<void>;
    reset(key: string): Promise<void>;
}
/**
 * Rate limit info
 */
export interface RateLimitInfo {
    count: number;
    resetAt: number;
}
/**
 * Create rate limit middleware
 */
export declare function rateLimit(options: RateLimitOptions): MiddlewareFunction;
/**
 * Security headers middleware
 */
export declare function securityHeaders(options?: SecurityHeadersOptions): MiddlewareFunction;
export interface SecurityHeadersOptions {
    contentSecurityPolicy?: string;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN' | false;
    xContentTypeOptions?: 'nosniff' | false;
    referrerPolicy?: string;
    permissionsPolicy?: string;
    strictTransportSecurity?: string;
}
/**
 * Request logging middleware
 */
export declare function logger(options?: LoggerOptions): MiddlewareFunction;
export interface LoggerOptions {
    log?: (...args: unknown[]) => void;
    format?: 'combined' | 'json' | 'short';
}
/**
 * Compression middleware
 */
export declare function compression(options?: CompressionOptions): MiddlewareFunction;
export interface CompressionOptions {
    threshold?: number;
    level?: number;
    encodings?: ('gzip' | 'deflate' | 'br')[];
}
/**
 * Request body parser middleware
 */
export declare function bodyParser(options?: BodyParserOptions): MiddlewareFunction;
export interface BodyParserOptions {
    limit?: string;
    types?: string[];
}
export {};
//# sourceMappingURL=middleware.d.ts.map
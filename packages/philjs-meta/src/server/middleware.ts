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
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * Middleware result
 */
export type MiddlewareResult =
  | Response
  | NextResponse
  | void
  | undefined;

/**
 * Next response for middleware chaining
 */
export class NextResponse extends Response {
  private _cookies: Map<string, CookieValue> = new Map();
  private _rewrite?: URL;
  private _redirect?: { url: URL; status: number };

  /**
   * Create a next response (continue to next middleware/handler)
   */
  static next(init?: ResponseInit): NextResponse {
    return new NextResponse(null, init);
  }

  /**
   * Create a redirect response
   */
  static override redirect(url: string | URL, status: number = 307): NextResponse {
    const response = new NextResponse(null, { status });
    response._redirect = {
      url: typeof url === 'string' ? new URL(url) : url,
      status,
    };
    return response;
  }

  /**
   * Create a rewrite response (internal redirect without URL change)
   */
  static rewrite(url: string | URL): NextResponse {
    const response = new NextResponse(null, { status: 200 });
    response._rewrite = typeof url === 'string' ? new URL(url) : url;
    return response;
  }

  /**
   * Create a JSON response
   */
  static override json<T>(data: T, init?: ResponseInit): NextResponse {
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }

  /**
   * Set a cookie
   */
  cookie(name: string, value: string, options?: CookieOptions): this {
    this._cookies.set(name, { value, options });
    return this;
  }

  /**
   * Delete a cookie
   */
  deleteCookie(name: string): this {
    this._cookies.set(name, {
      value: '',
      options: { expires: new Date(0) },
    });
    return this;
  }

  /**
   * Get the rewrite URL if set
   */
  get rewriteUrl(): URL | undefined {
    return this._rewrite;
  }

  /**
   * Get the redirect info if set
   */
  get redirectInfo(): { url: URL; status: number } | undefined {
    return this._redirect;
  }

  /**
   * Get all cookies to set
   */
  get cookies(): Map<string, CookieValue> {
    return this._cookies;
  }
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
export class MiddlewareChain {
  private middlewares: MiddlewareFunction[] = [];

  /**
   * Add middleware to the chain
   */
  use(middleware: MiddlewareFunction): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Execute the middleware chain
   */
  async execute(
    context: MiddlewareContext,
    handler: () => Promise<Response>
  ): Promise<Response> {
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++]!;
        return middleware(context, next);
      }
      return handler();
    };

    return next();
  }
}

/**
 * Create middleware context from request
 */
export function createMiddlewareContext(
  request: Request,
  params: Record<string, string | string[]> = {},
  env: Record<string, string> = {}
): MiddlewareContext {
  const url = new URL(request.url);
  const startTime = Date.now();

  return {
    request,
    url,
    params,
    responseHeaders: new Headers(),
    env,
    requestId: generateRequestId(),
    ip: getClientIP(request),
    timing: {
      start: startTime,
      elapsed: () => Date.now() - startTime,
    },
    locals: new Map(),
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  // Check common headers for proxied requests
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]!.trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

// ==========================================
// Built-in Middleware Functions
// ==========================================

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
export function cors(options: CORSOptions = {}): MiddlewareFunction {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = [],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  return async (context, next) => {
    const requestOrigin = context.request.headers.get('origin') || '';

    // Check if origin is allowed
    let allowedOrigin: string | null = null;

    if (typeof origin === 'string') {
      allowedOrigin = origin;
    } else if (Array.isArray(origin)) {
      if (origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    } else if (typeof origin === 'function') {
      if (origin(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }

    // Handle preflight request
    if (context.request.method === 'OPTIONS') {
      const headers = new Headers();

      if (allowedOrigin) {
        headers.set('Access-Control-Allow-Origin', allowedOrigin);
      }

      headers.set('Access-Control-Allow-Methods', methods.join(', '));

      if (allowedHeaders.length > 0) {
        headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      } else {
        const requestHeaders = context.request.headers.get('access-control-request-headers');
        if (requestHeaders) {
          headers.set('Access-Control-Allow-Headers', requestHeaders);
        }
      }

      if (credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }

      headers.set('Access-Control-Max-Age', maxAge.toString());

      return new Response(null, { status: 204, headers });
    }

    // Regular request
    const response = await next();

    // Add CORS headers to response
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    }

    if (exposedHeaders.length > 0) {
      response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

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
export function auth(options: AuthOptions): MiddlewareFunction {
  const {
    isAuthenticated,
    getUser,
    loginUrl = '/login',
    publicPaths = [],
    unauthorizedResponse,
  } = options;

  return async (context, next) => {
    // Check if path is public
    const pathname = context.url.pathname;
    const isPublic = publicPaths.some((path) => {
      if (typeof path === 'string') {
        return pathname === path || pathname.startsWith(path + '/');
      }
      return path.test(pathname);
    });

    if (isPublic) {
      return next();
    }

    // Check authentication
    const authenticated = await isAuthenticated(context);

    if (!authenticated) {
      // Check if this is an API request
      const isApi = pathname.startsWith('/api');

      if (isApi) {
        return (
          unauthorizedResponse ||
          new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      // Redirect to login
      const redirectUrl = new URL(loginUrl, context.url.origin);
      redirectUrl.searchParams.set('redirect', pathname);

      return Response.redirect(redirectUrl.toString(), 302);
    }

    // Get user and store in locals
    if (getUser) {
      const user = await getUser(context);
      context.locals.set('user', user);
    }

    return next();
  };
}

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
 * In-memory rate limit store
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitInfo> = new Map();

  async get(key: string): Promise<RateLimitInfo | undefined> {
    const info = this.store.get(key);
    if (info && Date.now() > info.resetAt) {
      this.store.delete(key);
      return undefined;
    }
    return info;
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    this.store.set(key, info);
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Create rate limit middleware
 */
export function rateLimit(options: RateLimitOptions): MiddlewareFunction {
  const {
    limit,
    windowMs,
    keyGenerator = (ctx) => ctx.ip,
    onRateLimit,
    skip,
    store = new MemoryRateLimitStore(),
  } = options;

  return async (context, next) => {
    // Check if should skip
    if (skip && skip(context)) {
      return next();
    }

    const key = keyGenerator(context);
    const now = Date.now();

    let info = await store.get(key);

    if (!info) {
      info = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    // Check if window has passed
    if (now > info.resetAt) {
      info = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    // Increment count
    info.count++;
    await store.set(key, info);

    // Set rate limit headers
    context.responseHeaders.set('X-RateLimit-Limit', limit.toString());
    context.responseHeaders.set('X-RateLimit-Remaining', Math.max(0, limit - info.count).toString());
    context.responseHeaders.set('X-RateLimit-Reset', info.resetAt.toString());

    // Check if over limit
    if (info.count > limit) {
      if (onRateLimit) {
        return onRateLimit(context);
      }

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          retryAfter: Math.ceil((info.resetAt - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((info.resetAt - now) / 1000).toString(),
          },
        }
      );
    }

    const response = await next();

    // Add rate limit headers to response
    for (const [key, value] of context.responseHeaders) {
      response.headers.set(key, value);
    }

    return response;
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders(options: SecurityHeadersOptions = {}): MiddlewareFunction {
  const {
    contentSecurityPolicy,
    xFrameOptions = 'DENY',
    xContentTypeOptions = 'nosniff',
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy,
    strictTransportSecurity,
  } = options;

  return async (context, next) => {
    const response = await next();

    if (contentSecurityPolicy) {
      response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    }

    if (xFrameOptions) {
      response.headers.set('X-Frame-Options', xFrameOptions);
    }

    if (xContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', xContentTypeOptions);
    }

    if (referrerPolicy) {
      response.headers.set('Referrer-Policy', referrerPolicy);
    }

    if (permissionsPolicy) {
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    if (strictTransportSecurity) {
      response.headers.set('Strict-Transport-Security', strictTransportSecurity);
    }

    return response;
  };
}

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
export function logger(options: LoggerOptions = {}): MiddlewareFunction {
  const { log = console.log, format = 'combined' } = options;

  return async (context, next) => {
    const start = Date.now();

    const response = await next();

    const duration = Date.now() - start;
    const { method } = context.request;
    const { pathname } = context.url;
    const { status } = response;

    if (format === 'combined') {
      log(
        `${context.ip} - "${method} ${pathname}" ${status} ${duration}ms`
      );
    } else if (format === 'json') {
      log(
        JSON.stringify({
          requestId: context.requestId,
          method,
          path: pathname,
          status,
          duration,
          ip: context.ip,
          userAgent: context.request.headers.get('user-agent'),
        })
      );
    } else {
      log(`${method} ${pathname} - ${status} (${duration}ms)`);
    }

    return response;
  };
}

export interface LoggerOptions {
  log?: (...args: unknown[]) => void;
  format?: 'combined' | 'json' | 'short';
}

/**
 * Compression middleware
 */
export function compression(options: CompressionOptions = {}): MiddlewareFunction {
  const {
    threshold = 1024,
    level = 6,
    encodings = ['gzip', 'deflate'],
  } = options;

  return async (context, next) => {
    const response = await next();

    // Check if response should be compressed
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < threshold) {
      return response;
    }

    // Check accepted encodings
    const acceptEncoding = context.request.headers.get('accept-encoding') || '';
    const encoding = encodings.find((enc) => acceptEncoding.includes(enc));

    if (!encoding) {
      return response;
    }

    // In a real implementation, you would use a compression library here
    // For now, we just add the header indicating compression should be applied
    response.headers.set('Content-Encoding', encoding);
    response.headers.set('Vary', 'Accept-Encoding');

    return response;
  };
}

export interface CompressionOptions {
  threshold?: number;
  level?: number;
  encodings?: ('gzip' | 'deflate' | 'br')[];
}

/**
 * Request body parser middleware
 */
export function bodyParser(options: BodyParserOptions = {}): MiddlewareFunction {
  const { limit = '1mb', types = ['application/json', 'application/x-www-form-urlencoded'] } = options;

  const limitBytes = parseSize(limit);

  return async (context, next) => {
    const contentType = context.request.headers.get('content-type') || '';

    // Check if content type should be parsed
    const shouldParse = types.some((type) => contentType.includes(type));
    if (!shouldParse) {
      return next();
    }

    // Check content length
    const contentLength = context.request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > limitBytes) {
      return new Response(JSON.stringify({ error: 'Request body too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse body based on content type
    try {
      if (contentType.includes('application/json')) {
        const body = await context.request.json();
        context.locals.set('body', body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await context.request.text();
        const params = new URLSearchParams(text);
        const body: Record<string, string> = {};
        params.forEach((value, key) => {
          body[key] = value;
        });
        context.locals.set('body', body);
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  };
}

export interface BodyParserOptions {
  limit?: string;
  types?: string[];
}

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 1024 * 1024; // Default 1mb

  const value = parseFloat(match[1]!);
  const unit = match[2] || 'b';

  return value * units[unit]!;
}

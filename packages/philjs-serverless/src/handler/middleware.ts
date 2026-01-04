/**
 * PhilJS Serverless Middleware
 *
 * Common middleware implementations following Koa/Hono patterns.
 */

import type {
  Middleware,
  ServerlessContext,
  Next,
  CorsOptions,
  LoggerOptions,
} from '../types.js';

/**
 * Compose multiple middleware into a single middleware
 *
 * @example
 * ```typescript
 * const combined = compose(cors(), logger(), auth());
 * ```
 */
export function compose<State = Record<string, unknown>>(
  ...middlewares: Middleware<State>[]
): Middleware<State> {
  if (middlewares.length === 0) {
    return async (ctx, next) => next();
  }

  if (middlewares.length === 1) {
    return middlewares[0]!;
  }

  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    let index = -1;

    const dispatch = async (i: number): Promise<Response> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];

      if (!middleware) {
        return next();
      }

      return middleware(ctx, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
}

/**
 * Default CORS options
 */
const defaultCorsOptions: Required<CorsOptions> = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
};

/**
 * CORS middleware
 *
 * @example
 * ```typescript
 * // Allow all origins
 * cors()
 *
 * // Specific origin
 * cors({ origin: 'https://example.com' })
 *
 * // Multiple origins
 * cors({ origin: ['https://example.com', 'https://app.example.com'] })
 *
 * // Dynamic origin
 * cors({
 *   origin: (origin) => origin.endsWith('.example.com') ? origin : false,
 * })
 * ```
 */
export function cors<State = Record<string, unknown>>(
  options: CorsOptions = {}
): Middleware<State> {
  const opts = { ...defaultCorsOptions, ...options };

  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    const requestOrigin = ctx.getHeader('Origin');

    // Determine allowed origin
    let allowOrigin: string = '';

    if (typeof opts.origin === 'string') {
      allowOrigin = opts.origin;
    } else if (Array.isArray(opts.origin)) {
      if (requestOrigin && opts.origin.includes(requestOrigin)) {
        allowOrigin = requestOrigin;
      }
    } else if (typeof opts.origin === 'function' && requestOrigin) {
      const result = opts.origin(requestOrigin);
      if (typeof result === 'string') {
        allowOrigin = result;
      } else if (result === true) {
        allowOrigin = requestOrigin;
      }
    }

    // Handle preflight requests
    if (ctx.method === 'OPTIONS') {
      const headers = new Headers();

      if (allowOrigin) {
        headers.set('Access-Control-Allow-Origin', allowOrigin);
      }

      headers.set('Access-Control-Allow-Methods', opts.methods.join(', '));
      headers.set('Access-Control-Allow-Headers', opts.allowHeaders.join(', '));

      if (opts.exposeHeaders.length > 0) {
        headers.set('Access-Control-Expose-Headers', opts.exposeHeaders.join(', '));
      }

      if (opts.credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }

      headers.set('Access-Control-Max-Age', opts.maxAge.toString());
      headers.set('Content-Length', '0');

      return new Response(null, {
        status: 204,
        headers,
      });
    }

    // Set CORS headers on response
    if (allowOrigin) {
      ctx.setHeader('Access-Control-Allow-Origin', allowOrigin);
    }

    if (opts.credentials) {
      ctx.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (opts.exposeHeaders.length > 0) {
      ctx.setHeader('Access-Control-Expose-Headers', opts.exposeHeaders.join(', '));
    }

    // Vary header for caching
    ctx.setHeader('Vary', 'Origin');

    return next();
  };
}

/**
 * Logger middleware
 *
 * @example
 * ```typescript
 * // Default JSON format
 * logger()
 *
 * // Development format
 * logger({ format: 'dev' })
 *
 * // Skip health checks
 * logger({ skip: (ctx) => ctx.path === '/health' })
 * ```
 */
export function logger<State = Record<string, unknown>>(
  options: LoggerOptions = {}
): Middleware<State> {
  const { format = 'json', skip, log = console.log } = options;

  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    // Check if we should skip logging
    if (skip && skip(ctx as ServerlessContext)) {
      return next();
    }

    const start = Date.now();

    try {
      const response = await next();
      const duration = Date.now() - start;

      logRequest(ctx as ServerlessContext, response, duration, format, log);

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      logRequest(ctx as ServerlessContext, null, duration, format, log, error as Error);

      throw error;
    }
  };
}

/**
 * Format and log a request
 */
function logRequest(
  ctx: ServerlessContext,
  response: Response | null,
  duration: number,
  format: LoggerOptions['format'],
  log: (message: string) => void,
  error?: Error
): void {
  const status = response?.status ?? 500;
  const statusText = error ? 'ERROR' : (response?.statusText ?? 'OK');

  switch (format) {
    case 'json':
      log(
        JSON.stringify({
          method: ctx.method,
          path: ctx.path,
          status,
          duration: `${duration}ms`,
          requestId: ctx.platform.requestId,
          platform: ctx.platform.platform,
          coldStart: ctx.platform.isColdStart,
          ...(error && { error: error.message }),
        })
      );
      break;

    case 'combined':
      // Apache Combined Log Format
      log(
        `${ctx.getHeader('x-forwarded-for') ?? '-'} - - [${new Date().toISOString()}] ` +
          `"${ctx.method} ${ctx.path} HTTP/1.1" ${status} - ` +
          `"${ctx.getHeader('referer') ?? '-'}" "${ctx.getHeader('user-agent') ?? '-'}"`
      );
      break;

    case 'common':
      // Apache Common Log Format
      log(
        `${ctx.getHeader('x-forwarded-for') ?? '-'} - - [${new Date().toISOString()}] ` +
          `"${ctx.method} ${ctx.path} HTTP/1.1" ${status} -`
      );
      break;

    case 'short':
      log(`${ctx.method} ${ctx.path} ${status} ${duration}ms`);
      break;

    case 'dev':
    default:
      const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      log(`${color}${ctx.method}${reset} ${ctx.path} ${color}${status}${reset} ${duration}ms`);
      break;
  }
}

/**
 * Request timeout middleware
 *
 * @example
 * ```typescript
 * timeout(5000) // 5 second timeout
 * ```
 */
export function timeout<State = Record<string, unknown>>(
  ms: number,
  message = 'Request timeout'
): Middleware<State> {
  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(message));
      }, ms);
    });

    return Promise.race([next(), timeoutPromise]);
  };
}

/**
 * Request ID middleware
 * Ensures every request has a unique ID
 */
export function requestId<State = Record<string, unknown>>(
  headerName = 'X-Request-Id'
): Middleware<State> {
  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    // Get existing request ID or use the one from platform context
    const existingId = ctx.getHeader(headerName) ?? ctx.platform.requestId;

    if (existingId) {
      ctx.setHeader(headerName, existingId);
    }

    return next();
  };
}

/**
 * Security headers middleware
 */
export function securityHeaders<State = Record<string, unknown>>(
  options: {
    contentSecurityPolicy?: string;
    xFrameOptions?: 'DENY' | 'SAMEORIGIN';
    xContentTypeOptions?: boolean;
    referrerPolicy?: string;
    strictTransportSecurity?: string;
  } = {}
): Middleware<State> {
  const {
    contentSecurityPolicy,
    xFrameOptions = 'SAMEORIGIN',
    xContentTypeOptions = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    strictTransportSecurity = 'max-age=31536000; includeSubDomains',
  } = options;

  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    if (contentSecurityPolicy) {
      ctx.setHeader('Content-Security-Policy', contentSecurityPolicy);
    }

    ctx.setHeader('X-Frame-Options', xFrameOptions);

    if (xContentTypeOptions) {
      ctx.setHeader('X-Content-Type-Options', 'nosniff');
    }

    ctx.setHeader('Referrer-Policy', referrerPolicy);
    ctx.setHeader('Strict-Transport-Security', strictTransportSecurity);

    return next();
  };
}

/**
 * Compression hint middleware
 * Sets Accept-Encoding based response headers
 */
export function compress<State = Record<string, unknown>>(): Middleware<State> {
  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    const acceptEncoding = ctx.getHeader('Accept-Encoding') ?? '';

    // Set Vary header for proper caching
    ctx.setHeader('Vary', 'Accept-Encoding');

    return next();
  };
}

/**
 * Cache control middleware
 */
export function cacheControl<State = Record<string, unknown>>(
  options: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    public?: boolean;
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
  }
): Middleware<State> {
  const directives: string[] = [];

  if (options.public) directives.push('public');
  if (options.private) directives.push('private');
  if (options.noCache) directives.push('no-cache');
  if (options.noStore) directives.push('no-store');
  if (options.mustRevalidate) directives.push('must-revalidate');
  if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
  if (options.sMaxAge !== undefined) directives.push(`s-maxage=${options.sMaxAge}`);
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  const cacheControlValue = directives.join(', ');

  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    ctx.setHeader('Cache-Control', cacheControlValue);
    return next();
  };
}

/**
 * Conditional GET middleware (ETag support)
 */
export function etag<State = Record<string, unknown>>(): Middleware<State> {
  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    const response = await next();

    // Only apply to successful GET/HEAD requests
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      return response;
    }

    if (response.status !== 200) {
      return response;
    }

    // Check if response already has ETag
    if (response.headers.has('ETag')) {
      const etag = response.headers.get('ETag');
      const ifNoneMatch = ctx.getHeader('If-None-Match');

      if (ifNoneMatch && etag && ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: response.headers,
        });
      }
    }

    return response;
  };
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use a distributed store like Redis
 */
export function rateLimit<State = Record<string, unknown>>(
  options: {
    windowMs?: number;
    max?: number;
    keyGenerator?: (ctx: ServerlessContext<State>) => string;
    message?: string;
  } = {}
): Middleware<State> {
  const {
    windowMs = 60000, // 1 minute
    max = 100,
    keyGenerator = (ctx) => ctx.getHeader('x-forwarded-for') ?? 'anonymous',
    message = 'Too many requests, please try again later',
  } = options;

  const store = new Map<string, { count: number; resetTime: number }>();

  return async (ctx: ServerlessContext<State>, next: Next): Promise<Response> => {
    const key = keyGenerator(ctx);
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      store.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    ctx.setHeader('X-RateLimit-Limit', max.toString());
    ctx.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
    ctx.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > max) {
      return new Response(JSON.stringify({ error: message }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
        },
      });
    }

    return next();
  };
}

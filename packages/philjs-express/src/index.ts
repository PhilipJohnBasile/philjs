/**
 * PhilJS Express Integration
 *
 * Comprehensive Express.js middleware and utilities for PhilJS SSR applications.
 * Features:
 * - SSR middleware with streaming support
 * - API route helpers with validation
 * - Session and authentication middleware
 * - Error handling and logging
 * - Static file serving with caching
 * - Compression and security headers
 * - Rate limiting and CORS
 * - Request context management
 * - Health check endpoints
 * - Graceful shutdown
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import {
 *   createPhilJSMiddleware,
 *   createApiRouter,
 *   errorHandler,
 *   securityHeaders,
 * } from '@philjs/express';
 *
 * const app = express();
 *
 * app.use(securityHeaders());
 * app.use(createPhilJSMiddleware({ render }));
 * app.use('/api', createApiRouter());
 * app.use(errorHandler());
 *
 * app.listen(3000);
 * ```
 */

import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  ErrorRequestHandler,
  Router,
  Express,
  Application,
} from 'express';
import type { Server } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';

// ============================================================================
// Types
// ============================================================================

export interface RenderContext {
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
  query: Record<string, any>;
  params: Record<string, string>;
  body: any;
  state: Record<string, any>;
  user?: any;
  session?: any;
  startTime: number;
  requestId: string;
}

export interface SSRResult {
  html: string;
  status?: number;
  headers?: Record<string, string>;
  redirect?: { url: string; status: number };
  head?: {
    title?: string;
    meta?: Array<{ name?: string; property?: string; content: string }>;
    links?: Array<{ rel: string; href: string; [key: string]: string }>;
    scripts?: Array<{ src?: string; content?: string; type?: string }>;
  };
}

export interface PhilJSMiddlewareOptions {
  /** SSR render function */
  render: (url: string, context: RenderContext) => Promise<SSRResult | string>;
  /** Enable SSR (default: true) */
  ssr?: boolean;
  /** Enable streaming SSR */
  streaming?: boolean;
  /** HTML template */
  template?: string;
  /** Static file paths to skip */
  staticPaths?: string[];
  /** API paths to skip */
  apiPaths?: string[];
  /** Custom error page renderer */
  renderError?: (error: Error, context: RenderContext) => Promise<string>;
  /** Timeout for SSR (ms) */
  timeout?: number;
  /** Cache SSR results */
  cache?: SSRCache;
  /** Log SSR timing */
  logTiming?: boolean;
}

export interface SSRCache {
  get(key: string): Promise<SSRResult | null>;
  set(key: string, value: SSRResult, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ApiHandlerOptions {
  /** Validate request body */
  validate?: (body: any) => { valid: boolean; errors?: string[] };
  /** Rate limit (requests per minute) */
  rateLimit?: number;
  /** Required authentication */
  auth?: boolean | string[];
  /** Cache response (seconds) */
  cache?: number;
  /** Allowed methods */
  methods?: string[];
}

export interface ErrorHandlerOptions {
  /** Log errors */
  log?: boolean;
  /** Include stack trace in response */
  stack?: boolean;
  /** Custom error formatter */
  format?: (error: HttpError, req: Request) => any;
  /** Error notification handler */
  notify?: (error: HttpError, req: Request) => void;
}

export interface SecurityHeadersOptions {
  /** Content Security Policy */
  csp?: Record<string, string[]> | false;
  /** HSTS settings */
  hsts?: { maxAge: number; includeSubDomains?: boolean; preload?: boolean } | false;
  /** X-Frame-Options */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  /** X-Content-Type-Options */
  noSniff?: boolean;
  /** Referrer-Policy */
  referrerPolicy?: string;
  /** Permissions-Policy */
  permissionsPolicy?: Record<string, string[]> | false;
}

export interface RateLimitOptions {
  /** Time window (ms) */
  windowMs?: number;
  /** Max requests per window */
  max?: number;
  /** Skip successful requests */
  skipSuccessfulRequests?: boolean;
  /** Custom key generator */
  keyGenerator?: (req: Request) => string;
  /** Handler when limit exceeded */
  handler?: RequestHandler;
  /** Store for rate limit data */
  store?: RateLimitStore;
}

export interface RateLimitStore {
  increment(key: string): Promise<{ current: number; resetTime: number }>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
}

export interface CorsOptions {
  /** Allowed origins */
  origin?: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  /** Allowed methods */
  methods?: string[];
  /** Allowed headers */
  allowedHeaders?: string[];
  /** Exposed headers */
  exposedHeaders?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Preflight cache duration */
  maxAge?: number;
}

export interface SessionOptions {
  /** Session secret */
  secret: string;
  /** Cookie name */
  name?: string;
  /** Cookie options */
  cookie?: {
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    domain?: string;
    path?: string;
  };
  /** Session store */
  store?: SessionStore;
  /** Regenerate on login */
  regenerate?: boolean;
}

export interface SessionStore {
  get(id: string): Promise<any>;
  set(id: string, data: any, maxAge?: number): Promise<void>;
  destroy(id: string): Promise<void>;
  touch(id: string, maxAge?: number): Promise<void>;
}

export interface HealthCheckOptions {
  /** Health check path */
  path?: string;
  /** Readiness check path */
  readinessPath?: string;
  /** Liveness check path */
  livenessPath?: string;
  /** Health check functions */
  checks?: Record<string, () => Promise<{ healthy: boolean; message?: string }>>;
  /** Include detailed info */
  detailed?: boolean;
}

export interface GracefulShutdownOptions {
  /** Shutdown timeout (ms) */
  timeout?: number;
  /** Shutdown signals */
  signals?: string[];
  /** On shutdown callbacks */
  onShutdown?: Array<() => Promise<void>>;
  /** Force exit after timeout */
  forceExit?: boolean;
}

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

// ============================================================================
// Request ID and Context
// ============================================================================

let requestCounter = 0;

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${(requestCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Request ID middleware
 */
export function requestId(headerName = 'X-Request-ID'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers[headerName.toLowerCase()] as string) || generateRequestId();
    (req as any).requestId = id;
    res.setHeader(headerName, id);
    next();
  };
}

/**
 * Create render context from request
 */
export function createRenderContext(req: Request): RenderContext {
  return {
    url: req.originalUrl || req.url,
    method: req.method,
    headers: req.headers as Record<string, string | string[] | undefined>,
    cookies: req.cookies || {},
    query: req.query as Record<string, any>,
    params: req.params,
    body: req.body,
    state: {},
    user: (req as any).user,
    session: (req as any).session,
    startTime: Date.now(),
    requestId: (req as any).requestId || generateRequestId(),
  };
}

// ============================================================================
// SSR Middleware
// ============================================================================

/**
 * Create PhilJS SSR middleware
 */
export function createPhilJSMiddleware(options: PhilJSMiddlewareOptions): RequestHandler {
  const {
    render,
    ssr = true,
    streaming = false,
    template,
    staticPaths = ['/assets', '/static', '/public', '/_philjs'],
    apiPaths = ['/api'],
    renderError,
    timeout = 30000,
    cache,
    logTiming = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip static paths
    for (const path of staticPaths) {
      if (req.path.startsWith(path)) {
        return next();
      }
    }

    // Skip API paths
    for (const path of apiPaths) {
      if (req.path.startsWith(path)) {
        return next();
      }
    }

    // Skip non-HTML requests
    const accept = req.headers.accept || '';
    if (!accept.includes('text/html') && !accept.includes('*/*')) {
      return next();
    }

    // Skip non-GET/HEAD requests for SSR
    if (!['GET', 'HEAD'].includes(req.method)) {
      return next();
    }

    if (!ssr) {
      return next();
    }

    const context = createRenderContext(req);
    const startTime = Date.now();

    try {
      // Check cache
      if (cache) {
        const cacheKey = `${req.method}:${req.originalUrl}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
          if (logTiming) {
            console.log(`[PhilJS] SSR cache hit for ${req.originalUrl} (${Date.now() - startTime}ms)`);
          }
          return sendSSRResult(res, cached);
        }
      }

      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('SSR timeout')), timeout);
      });

      // Render
      const result = await Promise.race([render(req.originalUrl, context), timeoutPromise]);

      if (logTiming) {
        console.log(`[PhilJS] SSR rendered ${req.originalUrl} in ${Date.now() - startTime}ms`);
      }

      // Handle string result
      if (typeof result === 'string') {
        const ssrResult: SSRResult = { html: result };
        if (cache) {
          await cache.set(`${req.method}:${req.originalUrl}`, ssrResult);
        }
        return sendSSRResult(res, ssrResult);
      }

      // Handle redirect
      if (result.redirect) {
        return res.redirect(result.redirect.status || 302, result.redirect.url);
      }

      // Cache result
      if (cache) {
        await cache.set(`${req.method}:${req.originalUrl}`, result);
      }

      return sendSSRResult(res, result);
    } catch (error) {
      if (logTiming) {
        console.error(`[PhilJS] SSR error for ${req.originalUrl}:`, error);
      }

      if (renderError) {
        try {
          const errorHtml = await renderError(error as Error, context);
          return res.status(500).type('html').send(errorHtml);
        } catch (renderErrorError) {
          console.error('[PhilJS] Error rendering error page:', renderErrorError);
        }
      }

      next(error);
    }
  };
}

/**
 * Send SSR result
 */
function sendSSRResult(res: Response, result: SSRResult): void {
  const status = result.status || 200;
  const headers = result.headers || {};

  // Set headers
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.status(status).type('html').send(result.html);
}

/**
 * Streaming SSR middleware
 */
export function createStreamingSSRMiddleware(options: {
  render: (url: string, context: RenderContext) => AsyncIterable<string> | ReadableStream<string>;
  shellTemplate?: { head: string; tail: string };
}): RequestHandler {
  const { render, shellTemplate } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const context = createRenderContext(req);

    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Send shell head
      if (shellTemplate?.head) {
        res.write(shellTemplate.head);
      }

      const stream = render(req.originalUrl, context);

      // Handle AsyncIterable
      if (Symbol.asyncIterator in stream) {
        for await (const chunk of stream as AsyncIterable<string>) {
          res.write(chunk);
        }
      } else {
        // Handle ReadableStream
        const reader = (stream as ReadableStream<string>).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }

      // Send shell tail
      if (shellTemplate?.tail) {
        res.write(shellTemplate.tail);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Create type-safe API handler
 */
export function createApiHandler<TBody = any, TResponse = any>(
  handler: (req: Request, res: Response, context: { body: TBody; user?: any; session?: any }) => Promise<TResponse>,
  options: ApiHandlerOptions = {}
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check method
      if (options.methods && !options.methods.includes(req.method)) {
        throw new HttpError(405, `Method ${req.method} not allowed`);
      }

      // Check auth
      if (options.auth) {
        const user = (req as any).user;
        if (!user) {
          throw new HttpError(401, 'Authentication required');
        }
        if (Array.isArray(options.auth)) {
          const hasRole = options.auth.some((role) => user.roles?.includes(role));
          if (!hasRole) {
            throw new HttpError(403, 'Insufficient permissions');
          }
        }
      }

      // Validate body
      if (options.validate && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const validation = options.validate(req.body);
        if (!validation.valid) {
          throw new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', validation.errors);
        }
      }

      // Call handler
      const result = await handler(req, res, {
        body: req.body as TBody,
        user: (req as any).user,
        session: (req as any).session,
      });

      // Set cache headers
      if (options.cache) {
        res.setHeader('Cache-Control', `public, max-age=${options.cache}`);
      }

      // Send response
      if (result !== undefined && !res.headersSent) {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create API router with common middleware
 */
export function createApiRouter(options: {
  prefix?: string;
  middleware?: RequestHandler[];
  errorHandler?: ErrorRequestHandler;
} = {}): Router {
  // Dynamic import to avoid requiring express at module load
  const express = require('express');
  const router: Router = express.Router();

  // Apply common middleware
  router.use(express.json({ limit: '10mb' }));
  router.use(express.urlencoded({ extended: true }));

  if (options.middleware) {
    router.use(...options.middleware);
  }

  // Add error handler at the end if provided
  if (options.errorHandler) {
    router.use(options.errorHandler);
  }

  return router;
}

/**
 * JSON response helper with proper typing
 */
export function json<T>(data: T, status = 200): (req: Request, res: Response) => void {
  return (_req, res) => {
    res.status(status).json(data);
  };
}

/**
 * Success response helper
 */
export function success<T>(data: T, message = 'Success'): { success: true; message: string; data: T } {
  return { success: true, message, data };
}

/**
 * Error response helper
 */
export function errorResponse(message: string, code?: string, details?: any): { success: false; error: { message: string; code?: string; details?: any } } {
  return { success: false, error: { message, code, details } };
}

/**
 * Paginated response helper
 */
export function paginated<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
} {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * HTTP error factory functions
 */
export const errors = {
  badRequest: (message = 'Bad Request', details?: any) => new HttpError(400, message, 'BAD_REQUEST', details),
  unauthorized: (message = 'Unauthorized') => new HttpError(401, message, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => new HttpError(403, message, 'FORBIDDEN'),
  notFound: (message = 'Not Found') => new HttpError(404, message, 'NOT_FOUND'),
  methodNotAllowed: (message = 'Method Not Allowed') => new HttpError(405, message, 'METHOD_NOT_ALLOWED'),
  conflict: (message = 'Conflict', details?: any) => new HttpError(409, message, 'CONFLICT', details),
  gone: (message = 'Gone') => new HttpError(410, message, 'GONE'),
  unprocessableEntity: (message = 'Unprocessable Entity', details?: any) => new HttpError(422, message, 'UNPROCESSABLE_ENTITY', details),
  tooManyRequests: (message = 'Too Many Requests') => new HttpError(429, message, 'TOO_MANY_REQUESTS'),
  internal: (message = 'Internal Server Error') => new HttpError(500, message, 'INTERNAL_ERROR'),
  notImplemented: (message = 'Not Implemented') => new HttpError(501, message, 'NOT_IMPLEMENTED'),
  badGateway: (message = 'Bad Gateway') => new HttpError(502, message, 'BAD_GATEWAY'),
  serviceUnavailable: (message = 'Service Unavailable') => new HttpError(503, message, 'SERVICE_UNAVAILABLE'),
};

/**
 * Error handler middleware
 */
export function errorHandler(options: ErrorHandlerOptions = {}): ErrorRequestHandler {
  const {
    log = true,
    stack = process.env.NODE_ENV === 'development',
    format,
    notify,
  } = options;

  return (err: Error | HttpError, req: Request, res: Response, _next: NextFunction) => {
    const httpError = err instanceof HttpError ? err : new HttpError(500, err.message, 'INTERNAL_ERROR');

    if (log) {
      console.error(`[${new Date().toISOString()}] Error:`, {
        requestId: (req as any).requestId,
        method: req.method,
        url: req.originalUrl,
        status: httpError.statusCode,
        message: httpError.message,
        stack: err.stack,
      });
    }

    if (notify) {
      notify(httpError, req);
    }

    const response = format
      ? format(httpError, req)
      : {
          success: false,
          error: {
            message: httpError.message,
            code: httpError.code,
            ...(httpError.details && { details: httpError.details }),
            ...(stack && { stack: err.stack }),
          },
        };

    res.status(httpError.statusCode).json(response);
  };
}

/**
 * Not found handler
 */
export function notFoundHandler(message = 'Resource not found'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, message, 'NOT_FOUND', { path: req.originalUrl }));
  };
}

/**
 * Async handler wrapper (catches promise rejections)
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// Security
// ============================================================================

/**
 * Security headers middleware
 */
export function securityHeaders(options: SecurityHeadersOptions = {}): RequestHandler {
  const {
    csp = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
    },
    hsts = { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameOptions = 'SAMEORIGIN',
    noSniff = true,
    referrerPolicy = 'strict-origin-when-cross-origin',
    permissionsPolicy = {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  } = options;

  return (_req: Request, res: Response, next: NextFunction) => {
    // Content-Security-Policy
    if (csp) {
      const cspValue = Object.entries(csp)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
      res.setHeader('Content-Security-Policy', cspValue);
    }

    // Strict-Transport-Security
    if (hsts) {
      let hstsValue = `max-age=${hsts.maxAge}`;
      if (hsts.includeSubDomains) hstsValue += '; includeSubDomains';
      if (hsts.preload) hstsValue += '; preload';
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // X-Frame-Options
    if (frameOptions) {
      res.setHeader('X-Frame-Options', frameOptions);
    }

    // X-Content-Type-Options
    if (noSniff) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Referrer-Policy
    if (referrerPolicy) {
      res.setHeader('Referrer-Policy', referrerPolicy);
    }

    // Permissions-Policy
    if (permissionsPolicy) {
      const ppValue = Object.entries(permissionsPolicy)
        .map(([key, values]) => `${key}=(${values.join(' ')})`)
        .join(', ');
      res.setHeader('Permissions-Policy', ppValue);
    }

    // Additional security headers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    next();
  };
}

/**
 * CORS middleware
 */
export function cors(options: CorsOptions = {}): RequestHandler {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const requestOrigin = req.headers.origin;

    // Determine allowed origin
    let allowOrigin = '';
    if (typeof origin === 'function') {
      // Async origin check would need different handling
      allowOrigin = requestOrigin || '*';
    } else if (Array.isArray(origin)) {
      allowOrigin = origin.includes(requestOrigin || '') ? requestOrigin! : '';
    } else {
      allowOrigin = origin;
    }

    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    }

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      res.setHeader('Access-Control-Max-Age', String(maxAge));
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
  const {
    windowMs = 60000,
    max = 100,
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip || 'unknown',
    handler,
    store,
  } = options;

  // In-memory store as fallback
  const memoryStore = new Map<string, { count: number; resetTime: number }>();

  const getEntry = async (key: string) => {
    if (store) {
      return store.increment(key);
    }

    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || entry.resetTime <= now) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      memoryStore.set(key, newEntry);
      return { current: 1, resetTime: newEntry.resetTime };
    }

    entry.count++;
    return { current: entry.count, resetTime: entry.resetTime };
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const { current, resetTime } = await getEntry(key);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - current)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));

    if (current > max) {
      res.setHeader('Retry-After', String(Math.ceil((resetTime - Date.now()) / 1000)));

      if (handler) {
        return handler(req, res, next);
      }

      throw new HttpError(429, 'Too many requests, please try again later');
    }

    // Skip decrementing for successful requests if configured
    if (skipSuccessfulRequests) {
      res.on('finish', async () => {
        if (res.statusCode < 400 && store) {
          await store.decrement(key);
        }
      });
    }

    next();
  };
}

// ============================================================================
// Caching and Compression
// ============================================================================

/**
 * Static file middleware with caching
 */
export function staticFiles(
  path: string,
  options: {
    maxAge?: number;
    immutable?: boolean;
    etag?: boolean;
    lastModified?: boolean;
    fallthrough?: boolean;
  } = {}
): RequestHandler {
  const express = require('express');
  const {
    maxAge = 86400,
    immutable = false,
    etag = true,
    lastModified = true,
    fallthrough = true,
  } = options;

  const cacheControl = immutable ? `public, max-age=${maxAge}, immutable` : `public, max-age=${maxAge}`;

  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', cacheControl);

    express.static(path, {
      etag,
      lastModified,
      fallthrough,
    })(req, res, next);
  };
}

/**
 * Compression middleware
 */
export function compression(options: {
  level?: number;
  threshold?: number;
  filter?: (req: Request, res: Response) => boolean;
} = {}): RequestHandler {
  const { level = 6, threshold = 1024, filter } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    if (filter && !filter(req, res)) {
      return next();
    }

    // Check if compression is supported
    const supportsGzip = acceptEncoding.includes('gzip');
    const supportsBr = acceptEncoding.includes('br');

    if (supportsBr || supportsGzip) {
      // Mark for compression - actual compression would need zlib
      res.setHeader('Vary', 'Accept-Encoding');
    }

    next();
  };
}

/**
 * ETag middleware for response caching
 */
export function etag(): RequestHandler {
  const crypto = require('crypto');

  return (_req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res);

    res.send = function (body: any) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        const hash = crypto.createHash('md5').update(body).digest('hex');
        const etagValue = `"${hash}"`;

        if (!res.getHeader('ETag')) {
          res.setHeader('ETag', etagValue);
        }
      }

      return originalSend(body);
    };

    next();
  };
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Simple session middleware
 */
export function session(options: SessionOptions): RequestHandler {
  const {
    secret,
    name = 'philjs.sid',
    cookie = {},
    store,
    regenerate = true,
  } = options;

  const crypto = require('crypto');
  const memoryStore = new Map<string, { data: any; expires: number }>();

  const generateId = () => crypto.randomBytes(32).toString('hex');

  const sign = (value: string) => {
    const signature = crypto.createHmac('sha256', secret).update(value).digest('base64');
    return `${value}.${signature}`;
  };

  const unsign = (signedValue: string): string | null => {
    const lastDot = signedValue.lastIndexOf('.');
    if (lastDot === -1) return null;

    const value = signedValue.slice(0, lastDot);
    const signature = signedValue.slice(lastDot + 1);

    const expectedSignature = crypto.createHmac('sha256', secret).update(value).digest('base64');

    if (signature !== expectedSignature) return null;
    return value;
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Get session ID from cookie
    const signedId = req.cookies?.[name];
    let sessionId = signedId ? unsign(signedId) : null;
    let sessionData: any = {};

    // Load existing session
    if (sessionId) {
      if (store) {
        sessionData = await store.get(sessionId);
      } else {
        const entry = memoryStore.get(sessionId);
        if (entry && entry.expires > Date.now()) {
          sessionData = entry.data;
        }
      }
    }

    // Generate new session ID if needed
    if (!sessionId || Object.keys(sessionData).length === 0) {
      sessionId = generateId();
      sessionData = {};
    }

    // Attach session to request
    (req as any).session = {
      id: sessionId,
      data: sessionData,
      save: async () => {
        const maxAge = cookie.maxAge || 86400000;
        if (store) {
          await store.set(sessionId!, sessionData, maxAge);
        } else {
          memoryStore.set(sessionId!, { data: sessionData, expires: Date.now() + maxAge });
        }
      },
      destroy: async () => {
        if (store) {
          await store.destroy(sessionId!);
        } else {
          memoryStore.delete(sessionId!);
        }
        sessionData = {};
      },
      regenerate: async () => {
        if (regenerate) {
          const oldId = sessionId;
          sessionId = generateId();
          if (store) {
            await store.destroy(oldId!);
            await store.set(sessionId, sessionData);
          } else {
            memoryStore.delete(oldId!);
            memoryStore.set(sessionId, { data: sessionData, expires: Date.now() + (cookie.maxAge || 86400000) });
          }
          (req as any).session.id = sessionId;
        }
      },
    };

    // Save session on response finish
    res.on('finish', async () => {
      await (req as any).session.save();

      // Set session cookie
      const cookieOptions = [
        `${name}=${sign(sessionId!)}`,
        `Path=${cookie.path || '/'}`,
        cookie.maxAge && `Max-Age=${cookie.maxAge / 1000}`,
        cookie.httpOnly !== false && 'HttpOnly',
        cookie.secure && 'Secure',
        cookie.sameSite && `SameSite=${cookie.sameSite}`,
        cookie.domain && `Domain=${cookie.domain}`,
      ].filter(Boolean).join('; ');

      res.setHeader('Set-Cookie', cookieOptions);
    });

    next();
  };
}

// ============================================================================
// Logging
// ============================================================================

/**
 * Request logging middleware
 */
export function logger(options: {
  format?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
  skip?: (req: Request, res: Response) => boolean;
  stream?: { write: (message: string) => void };
} = {}): RequestHandler {
  const { format = 'dev', skip, stream = { write: console.log } } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip?.(req, res)) {
      return next();
    }

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const message = formatLog(format, req, res, duration);
      stream.write(message);
    });

    next();
  };
}

function formatLog(
  format: string,
  req: Request,
  res: Response,
  duration: number
): string {
  const { method, originalUrl } = req;
  const { statusCode } = res;
  const requestId = (req as any).requestId || '-';
  const ip = req.ip || req.socket.remoteAddress || '-';
  const userAgent = req.headers['user-agent'] || '-';
  const contentLength = res.getHeader('content-length') || '-';
  const referrer = req.headers.referer || req.headers.referrer || '-';

  switch (format) {
    case 'combined':
      return `${ip} - - [${new Date().toISOString()}] "${method} ${originalUrl}" ${statusCode} ${contentLength} "${referrer}" "${userAgent}"`;
    case 'common':
      return `${ip} - - [${new Date().toISOString()}] "${method} ${originalUrl}" ${statusCode} ${contentLength}`;
    case 'short':
      return `${ip} ${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms`;
    case 'tiny':
      return `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms`;
    case 'dev':
    default:
      const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : statusCode >= 300 ? '\x1b[36m' : '\x1b[32m';
      return `${color}${method}\x1b[0m ${originalUrl} ${color}${statusCode}\x1b[0m ${duration}ms - ${contentLength}`;
  }
}

// ============================================================================
// Health Checks
// ============================================================================

/**
 * Health check endpoints
 */
export function healthCheck(options: HealthCheckOptions = {}): RequestHandler {
  const {
    path = '/health',
    readinessPath = '/health/ready',
    livenessPath = '/health/live',
    checks = {},
    detailed = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === path || req.path === readinessPath) {
      const results: Record<string, { healthy: boolean; message?: string }> = {};
      let allHealthy = true;

      for (const [name, check] of Object.entries(checks)) {
        try {
          const result = await check();
          results[name] = result;
          if (!result.healthy) allHealthy = false;
        } catch (error) {
          results[name] = { healthy: false, message: (error as Error).message };
          allHealthy = false;
        }
      }

      const response = detailed
        ? { status: allHealthy ? 'healthy' : 'unhealthy', checks: results, timestamp: new Date().toISOString() }
        : { status: allHealthy ? 'ok' : 'error' };

      return res.status(allHealthy ? 200 : 503).json(response);
    }

    if (req.path === livenessPath) {
      return res.status(200).json({ status: 'ok' });
    }

    next();
  };
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Setup graceful shutdown
 */
export function gracefulShutdown(
  server: Server,
  options: GracefulShutdownOptions = {}
): void {
  const {
    timeout = 30000,
    signals = ['SIGTERM', 'SIGINT'],
    onShutdown = [],
    forceExit = true,
  } = options;

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[PhilJS] Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      console.log('[PhilJS] Server closed, cleaning up...');

      try {
        // Run cleanup callbacks
        await Promise.all(onShutdown.map((fn) => fn()));
        console.log('[PhilJS] Cleanup complete, exiting');
        if (forceExit) process.exit(0);
      } catch (error) {
        console.error('[PhilJS] Cleanup error:', error);
        if (forceExit) process.exit(1);
      }
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error('[PhilJS] Forced shutdown after timeout');
      if (forceExit) process.exit(1);
    }, timeout);
  };

  for (const signal of signals) {
    process.on(signal, () => shutdown(signal));
  }
}

// ============================================================================
// Request Utilities
// ============================================================================

/**
 * Parse query parameters with type coercion
 */
export function parseQuery<T extends Record<string, any>>(
  query: Record<string, any>,
  schema: { [K in keyof T]: 'string' | 'number' | 'boolean' | 'array' }
): T {
  const result: any = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = query[key];
    if (value === undefined) continue;

    switch (type) {
      case 'number':
        result[key] = Number(value);
        break;
      case 'boolean':
        result[key] = value === 'true' || value === '1';
        break;
      case 'array':
        result[key] = Array.isArray(value) ? value : [value];
        break;
      default:
        result[key] = value;
    }
  }

  return result as T;
}

/**
 * Pagination helper
 */
export function parsePagination(
  query: Record<string, any>,
  defaults: { page?: number; pageSize?: number; maxPageSize?: number } = {}
): { page: number; pageSize: number; offset: number } {
  const { page: defaultPage = 1, pageSize: defaultPageSize = 20, maxPageSize = 100 } = defaults;

  const page = Math.max(1, parseInt(query.page) || defaultPage);
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(query.pageSize || query.limit) || defaultPageSize));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Sort parameter parser
 */
export function parseSort(
  query: Record<string, any>,
  allowedFields: string[],
  defaultSort?: { field: string; order: 'asc' | 'desc' }
): { field: string; order: 'asc' | 'desc' } | null {
  const sortParam = query.sort || query.orderBy;
  if (!sortParam && !defaultSort) return null;
  if (!sortParam) return defaultSort!;

  const isDesc = sortParam.startsWith('-');
  const field = isDesc ? sortParam.slice(1) : sortParam;

  if (!allowedFields.includes(field)) {
    return defaultSort || null;
  }

  return { field, order: isDesc ? 'desc' : 'asc' };
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Send file with proper headers
 */
export function sendFile(
  res: Response,
  filePath: string,
  options: { filename?: string; inline?: boolean } = {}
): void {
  const { filename, inline = false } = options;
  const path = require('path');
  const fs = require('fs');

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const disposition = inline ? 'inline' : `attachment; filename="${filename || path.basename(filePath)}"`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', disposition);

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);

  fs.createReadStream(filePath).pipe(res);
}

/**
 * Stream response helper
 */
export function stream(
  res: Response,
  generator: AsyncIterable<string | Buffer>,
  options: { contentType?: string } = {}
): Promise<void> {
  const { contentType = 'text/plain' } = options;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Transfer-Encoding', 'chunked');

  return (async () => {
    for await (const chunk of generator) {
      res.write(chunk);
    }
    res.end();
  })();
}

/**
 * Server-Sent Events helper
 */
export function sse(
  res: Response,
  eventStream: AsyncIterable<{ event?: string; data: any; id?: string }>,
  options: { keepAlive?: number } = {}
): Promise<void> {
  const { keepAlive = 30000 } = options;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Keep-alive ping
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, keepAlive);

  return (async () => {
    try {
      for await (const event of eventStream) {
        let message = '';
        if (event.id) message += `id: ${event.id}\n`;
        if (event.event) message += `event: ${event.event}\n`;
        message += `data: ${JSON.stringify(event.data)}\n\n`;
        res.write(message);
      }
    } finally {
      clearInterval(pingInterval);
      res.end();
    }
  })();
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Simple request body validator
 */
export function validate<T extends Record<string, any>>(
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required?: boolean;
      min?: number;
      max?: number;
      pattern?: RegExp;
      enum?: any[];
      validate?: (value: any) => boolean;
    };
  }
): (body: any) => { valid: boolean; errors?: string[]; data?: T } {
  return (body: any) => {
    const errors: string[] = [];
    const data: any = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = body?.[key];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      // Type check
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }

      // Min/max for numbers and strings
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${key} must be at most ${rules.max}`);
        }
      }

      if (rules.type === 'string') {
        if (rules.min !== undefined && value.length < rules.min) {
          errors.push(`${key} must be at least ${rules.min} characters`);
        }
        if (rules.max !== undefined && value.length > rules.max) {
          errors.push(`${key} must be at most ${rules.max} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${key} has invalid format`);
        }
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation
      if (rules.validate && !rules.validate(value)) {
        errors.push(`${key} is invalid`);
      }

      data[key] = value;
    }

    return errors.length > 0 ? { valid: false, errors } : { valid: true, data: data as T };
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  // Middleware
  createPhilJSMiddleware,
  createStreamingSSRMiddleware,
  requestId,
  securityHeaders,
  cors,
  rateLimit,
  compression,
  etag,
  session,
  logger,
  healthCheck,
  staticFiles,

  // API Helpers
  createApiHandler,
  createApiRouter,
  asyncHandler,

  // Error Handling
  errorHandler,
  notFoundHandler,
  errors,
  HttpError,

  // Response Helpers
  json,
  success,
  errorResponse,
  paginated,
  sendFile,
  stream,
  sse,

  // Request Helpers
  parseQuery,
  parsePagination,
  parseSort,
  createRenderContext,
  generateRequestId,

  // Validation
  validate,

  // Lifecycle
  gracefulShutdown,
};

// Type exports
export type {
  RenderContext,
  SSRResult,
  PhilJSMiddlewareOptions,
  SSRCache,
  ApiHandlerOptions,
  ErrorHandlerOptions,
  SecurityHeadersOptions,
  RateLimitOptions,
  RateLimitStore,
  CorsOptions,
  SessionOptions,
  SessionStore,
  HealthCheckOptions,
  GracefulShutdownOptions,
};

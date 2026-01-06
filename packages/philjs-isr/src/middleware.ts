/**
 * PhilJS ISR Middleware
 *
 * HTTP middleware for serving cached pages and triggering background revalidation.
 * Implements stale-while-revalidate pattern.
 */

import type { CacheManager } from './cache.js';
import { generateCacheControl, generateETag, isStale, isWithinSWRWindow } from './cache.js';
import type { ISRConfig, ISREvent, ISRLogger, StaticPropsContext } from './config.js';
import type { RevalidationManager } from './revalidate.js';
import type { TagManager } from './tags.js';

/**
 * Middleware context
 */
export interface MiddlewareContext {
  /** Request object */
  request: Request;
  /** URL path */
  path: string;
  /** URL search params */
  searchParams: URLSearchParams;
  /** Route parameters */
  params: Record<string, string>;
  /** Custom context data */
  data: Record<string, unknown>;
}

/**
 * Middleware result
 */
export interface MiddlewareResult {
  /** Response to return */
  response?: Response;
  /** Continue to next handler */
  next?: boolean;
  /** Modified context */
  context?: Partial<MiddlewareContext>;
}

/**
 * Middleware function type
 */
export type ISRMiddlewareFn = (
  context: MiddlewareContext
) => Promise<MiddlewareResult | Response | void>;

/**
 * Middleware options
 */
export interface MiddlewareOptions {
  /** Paths to handle (regex or function) */
  include?: RegExp | ((path: string) => boolean);
  /** Paths to exclude */
  exclude?: RegExp | ((path: string) => boolean);
  /** Custom cache key generator */
  cacheKey?: (context: MiddlewareContext) => string;
  /** Whether to add debug headers */
  debugHeaders?: boolean;
  /** Custom 404 response */
  notFoundResponse?: () => Response;
  /** Custom error response */
  errorResponse?: (error: Error) => Response;
  /** Transform response before caching */
  transformResponse?: (response: Response, path: string) => Promise<Response>;
}

/**
 * Debug headers added to responses
 */
const DEBUG_HEADERS = {
  CACHE_STATUS: 'X-ISR-Cache',
  REVALIDATED_AT: 'X-ISR-Revalidated-At',
  REGENERATION_COUNT: 'X-ISR-Regeneration-Count',
  CONTENT_HASH: 'X-ISR-Content-Hash',
  TAGS: 'X-ISR-Tags',
};

/**
 * ISR middleware class
 */
export class ISRMiddleware {
  private cache: CacheManager;
  private revalidator: RevalidationManager;
  private tagManager: TagManager;
  private config: ISRConfig;
  private options: MiddlewareOptions;
  private logger: ISRLogger;
  private eventHandler: ((event: ISREvent) => void | Promise<void>) | undefined;

  constructor(
    cache: CacheManager,
    revalidator: RevalidationManager,
    tagManager: TagManager,
    config: ISRConfig,
    options: MiddlewareOptions = {},
    eventHandler?: (event: ISREvent) => void | Promise<void>
  ) {
    this.cache = cache;
    this.revalidator = revalidator;
    this.tagManager = tagManager;
    this.config = config;
    this.options = options;
    this.logger = config.logger ?? this.createDefaultLogger();
    this.eventHandler = eventHandler;
  }

  /**
   * Get the middleware handler function
   */
  handler(): ISRMiddlewareFn {
    return async (context: MiddlewareContext): Promise<MiddlewareResult | Response | void> => {
      const { request, path } = context;

      // Check if we should handle this path
      if (!this.shouldHandle(path)) {
        return { next: true };
      }

      // Generate cache key
      const cacheKey = this.options.cacheKey
        ? this.options.cacheKey(context)
        : path;

      try {
        // Try to get from cache
        const { entry, isStale: entryIsStale } = await this.cache.getWithStale(cacheKey);

        if (entry) {
          const swrSeconds = this.config.staleWhileRevalidate ?? 60;

          // Check if we can serve this entry
          if (!entryIsStale) {
            // Fresh content
            this.logger.debug(`Cache HIT (fresh): ${path}`);
            await this.emitEvent({ type: 'cache:hit', path, timestamp: Date.now() });

            return this.createResponse(entry.html, entry.headers, {
              cacheStatus: 'HIT',
              entry,
              debugHeaders: !!(this.options.debugHeaders ?? this.config.dev?.debugHeaders),
            });
          }

          // Check if within stale-while-revalidate window
          if (isWithinSWRWindow(entry, swrSeconds)) {
            this.logger.debug(`Cache HIT (stale, SWR): ${path}`);
            await this.emitEvent({ type: 'cache:hit', path, timestamp: Date.now() });

            // Trigger background revalidation
            this.revalidator.revalidate({ path: cacheKey, priority: 1 });

            return this.createResponse(entry.html, entry.headers, {
              cacheStatus: 'STALE',
              entry,
              debugHeaders: !!(this.options.debugHeaders ?? this.config.dev?.debugHeaders),
            });
          }

          // Stale and outside SWR window - need to revalidate
          this.logger.debug(`Cache STALE (expired): ${path}`);
        } else {
          this.logger.debug(`Cache MISS: ${path}`);
          await this.emitEvent({ type: 'cache:miss', path, timestamp: Date.now() });
        }

        // No cache or expired - generate new content
        const result = await this.generateAndCache(cacheKey, context);

        if (result.notFound) {
          return this.options.notFoundResponse?.() ?? new Response('Not Found', { status: 404 });
        }

        if (result.redirect) {
          return Response.redirect(result.redirect.destination, result.redirect.permanent ? 308 : 307);
        }

        const responseOptions: { cacheStatus: string; entry?: import('./config.js').CacheEntry; debugHeaders?: boolean } = {
          cacheStatus: 'MISS',
          debugHeaders: !!(this.options.debugHeaders ?? this.config.dev?.debugHeaders),
        };
        if (result.entry) responseOptions.entry = result.entry;
        return this.createResponse(result.html!, result.headers, responseOptions);
      } catch (error) {
        this.logger.error(`Middleware error: ${path}`, { error });

        if (this.options.errorResponse) {
          return this.options.errorResponse(error instanceof Error ? error : new Error(String(error)));
        }

        return new Response('Internal Server Error', { status: 500 });
      }
    };
  }

  /**
   * Create an Express-compatible middleware
   */
  express(): (
    req: { path: string; url: string; method: string; headers: Record<string, string> },
    res: { setHeader: (key: string, value: string) => void; status: (code: number) => { send: (body: string) => void } },
    next: () => void
  ) => Promise<void> {
    const handler = this.handler();

    return async (req, res, next) => {
      // Only handle GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const url = new URL(req.url, 'http://localhost');
      const context: MiddlewareContext = {
        request: new Request(url),
        path: req.path,
        searchParams: url.searchParams,
        params: {},
        data: {},
      };

      const result = await handler(context);

      if (!result) {
        return next();
      }

      if (result instanceof Response) {
        // Send response
        res.status(result.status);
        result.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        const body = await result.text();
        res.status(result.status).send(body);
        return;
      }

      if ('next' in result && result.next) {
        return next();
      }

      if ('response' in result && result.response) {
        res.status(result.response.status);
        result.response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        const body = await result.response.text();
        res.status(result.response.status).send(body);
      }
    };
  }

  /**
   * Create a Hono-compatible middleware
   */
  hono(): (c: { req: { path: string; url: string; raw: Request }; next: () => Promise<void>; html: (body: string, init?: ResponseInit) => Response }) => Promise<Response | void> {
    const handler = this.handler();

    return async (c) => {
      const url = new URL(c.req.url);
      const context: MiddlewareContext = {
        request: c.req.raw,
        path: c.req.path,
        searchParams: url.searchParams,
        params: {},
        data: {},
      };

      const result = await handler(context);

      if (!result) {
        return c.next();
      }

      if (result instanceof Response) {
        return result;
      }

      if ('next' in result && result.next) {
        return c.next();
      }

      if ('response' in result && result.response) {
        return result.response;
      }
    };
  }

  /**
   * Check if path should be handled
   */
  private shouldHandle(path: string): boolean {
    // Check exclude first
    if (this.options.exclude) {
      if (typeof this.options.exclude === 'function') {
        if (this.options.exclude(path)) return false;
      } else if (this.options.exclude.test(path)) {
        return false;
      }
    }

    // Check include
    if (this.options.include) {
      if (typeof this.options.include === 'function') {
        return this.options.include(path);
      }
      return this.options.include.test(path);
    }

    // Default: handle all paths that look like pages
    return !path.includes('.') || path.endsWith('.html');
  }

  /**
   * Generate content and store in cache
   */
  private async generateAndCache(
    cacheKey: string,
    context: MiddlewareContext
  ): Promise<{
    html?: string;
    headers?: Record<string, string>;
    entry?: import('./config.js').CacheEntry;
    notFound?: boolean;
    redirect?: { destination: string; permanent?: boolean };
  }> {
    const renderFn = this.config.render;
    if (!renderFn) {
      throw new Error('Render function not configured');
    }

    const staticContext: StaticPropsContext = {
      params: context.params,
    };

    const html = await renderFn(context.path, staticContext);

    // Create and store cache entry
    const entry = {
      html,
      meta: {
        path: cacheKey,
        createdAt: Date.now(),
        revalidatedAt: Date.now(),
        revalidateInterval: this.config.defaultRevalidate ?? 3600,
        tags: [],
        status: 'fresh' as const,
        regenerationCount: 0,
        contentHash: this.hashContent(html),
      },
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    };

    await this.cache.set(cacheKey, entry);
    await this.emitEvent({ type: 'cache:set', path: cacheKey, timestamp: Date.now() });

    return { html, headers: entry.headers, entry };
  }

  /**
   * Create HTTP response
   */
  private createResponse(
    html: string,
    headers?: Record<string, string>,
    options?: {
      cacheStatus: string;
      entry?: import('./config.js').CacheEntry;
      debugHeaders?: boolean;
    }
  ): Response {
    const responseHeaders = new Headers(headers ?? {});

    // Set content type
    if (!responseHeaders.has('Content-Type')) {
      responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    }

    // Set cache control
    if (options?.entry) {
      const cacheControl = generateCacheControl(
        options.entry,
        this.config.staleWhileRevalidate ?? 60
      );
      responseHeaders.set('Cache-Control', cacheControl);

      // Set ETag
      const etag = generateETag(options.entry);
      responseHeaders.set('ETag', etag);
    }

    // Add debug headers
    if (options?.debugHeaders && options?.entry) {
      responseHeaders.set(DEBUG_HEADERS.CACHE_STATUS, options.cacheStatus);
      responseHeaders.set(
        DEBUG_HEADERS.REVALIDATED_AT,
        new Date(options.entry.meta.revalidatedAt).toISOString()
      );
      responseHeaders.set(
        DEBUG_HEADERS.REGENERATION_COUNT,
        String(options.entry.meta.regenerationCount)
      );
      if (options.entry.meta.contentHash) {
        responseHeaders.set(DEBUG_HEADERS.CONTENT_HASH, options.entry.meta.contentHash);
      }
      if (options.entry.meta.tags.length > 0) {
        responseHeaders.set(DEBUG_HEADERS.TAGS, options.entry.meta.tags.join(', '));
      }
    }

    return new Response(html, {
      status: 200,
      headers: responseHeaders,
    });
  }

  /**
   * Hash content for change detection
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Emit an ISR event
   */
  private async emitEvent(event: ISREvent): Promise<void> {
    if (this.eventHandler) {
      try {
        await this.eventHandler(event);
      } catch (error) {
        this.logger.error('Event handler error', { error });
      }
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): ISRLogger {
    const level = this.config.logLevel ?? 'info';
    const levels = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevel = levels.indexOf(level);
    const shouldLog = (msgLevel: string) => levels.indexOf(msgLevel) >= currentLevel;

    return {
      debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:Middleware] ${msg}`, meta || ''),
      info: (msg, meta) => shouldLog('info') && console.info(`[ISR:Middleware] ${msg}`, meta || ''),
      warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:Middleware] ${msg}`, meta || ''),
      error: (msg, meta) => shouldLog('error') && console.error(`[ISR:Middleware] ${msg}`, meta || ''),
    };
  }
}

/**
 * Create ISR middleware
 */
export function createMiddleware(
  cache: CacheManager,
  revalidator: RevalidationManager,
  tagManager: TagManager,
  config: ISRConfig,
  options?: MiddlewareOptions,
  eventHandler?: (event: ISREvent) => void | Promise<void>
): ISRMiddleware {
  return new ISRMiddleware(cache, revalidator, tagManager, config, options, eventHandler);
}

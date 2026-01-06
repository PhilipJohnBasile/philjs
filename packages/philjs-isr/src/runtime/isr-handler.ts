/**
 * PhilJS ISR Request Handler
 *
 * Main request handler for serving ISR pages with stale-while-revalidate support.
 * Handles cache lookups, fallback behavior, and background revalidation.
 */

import type {
  CacheEntry,
  FallbackMode,
  ISRConfig,
  ISREvent,
  ISRHandlerContext,
  ISRHandlerResult,
  ISRLogger,
  StaticPropsContext,
} from '../types.js';
import { RuntimeCache } from './cache.js';
import { RuntimeRevalidator } from './revalidate.js';
import { FallbackHandler } from './fallback.js';

/**
 * ISR handler options
 */
export interface ISRHandlerOptions {
  /** ISR configuration */
  config: ISRConfig;
  /** Cache instance */
  cache: RuntimeCache;
  /** Revalidator instance */
  revalidator: RuntimeRevalidator;
  /** Fallback handler */
  fallbackHandler: FallbackHandler;
  /** Render function */
  render: (path: string, context?: StaticPropsContext) => Promise<string>;
  /** Get fallback mode for a path */
  getFallbackMode?: (path: string) => FallbackMode;
  /** Get route params for a path */
  getRouteParams?: (path: string) => Record<string, string> | null;
  /** Paths to include */
  include?: RegExp | ((path: string) => boolean);
  /** Paths to exclude */
  exclude?: RegExp | ((path: string) => boolean);
  /** Event handler */
  onEvent?: (event: ISREvent) => void | Promise<void>;
  /** Logger */
  logger?: ISRLogger;
}

/**
 * Debug headers
 */
const DEBUG_HEADERS = {
  CACHE_STATUS: 'X-ISR-Cache',
  REVALIDATED_AT: 'X-ISR-Revalidated-At',
  REGENERATION_COUNT: 'X-ISR-Regeneration-Count',
  CONTENT_HASH: 'X-ISR-Content-Hash',
  FALLBACK: 'X-ISR-Fallback',
};

/**
 * ISR handler class
 */
export class ISRHandler {
  private config: ISRConfig;
  private cache: RuntimeCache;
  private revalidator: RuntimeRevalidator;
  private fallbackHandler: FallbackHandler;
  private render: (path: string, context?: StaticPropsContext) => Promise<string>;
  private getFallbackMode: (path: string) => FallbackMode;
  private getRouteParams: (path: string) => Record<string, string> | null;
  private include?: RegExp | ((path: string) => boolean);
  private exclude?: RegExp | ((path: string) => boolean);
  private onEvent?: (event: ISREvent) => void | Promise<void>;
  private logger: ISRLogger;

  constructor(options: ISRHandlerOptions) {
    this.config = options.config;
    this.cache = options.cache;
    this.revalidator = options.revalidator;
    this.fallbackHandler = options.fallbackHandler;
    this.render = options.render;
    this.getFallbackMode = options.getFallbackMode ?? (() => 'blocking');
    this.getRouteParams = options.getRouteParams ?? (() => ({}));
    this.include = options.include;
    this.exclude = options.exclude;
    this.onEvent = options.onEvent;
    this.logger = options.logger ?? this.createDefaultLogger();
  }

  /**
   * Handle a request
   */
  async handle(context: ISRHandlerContext): Promise<ISRHandlerResult | Response> {
    const { path } = context;

    // Check if we should handle this path
    if (!this.shouldHandle(path)) {
      return { next: true };
    }

    try {
      // Check cache
      const cacheResult = await this.cache.lookup(path);

      if (cacheResult.found && cacheResult.canServe) {
        // Serve from cache
        const response = this.createCacheResponse(cacheResult.entry!, cacheResult.status);

        // Trigger background revalidation if stale
        if (cacheResult.isStale) {
          this.revalidator.queueRevalidation(path);
        }

        await this.emitEvent({
          type: 'cache:hit',
          path,
          timestamp: Date.now(),
          meta: { status: cacheResult.status },
        });

        return { response, cacheStatus: cacheResult.status };
      }

      // Cache miss or expired
      await this.emitEvent({
        type: 'cache:miss',
        path,
        timestamp: Date.now(),
      });

      // Get route params
      const params = this.getRouteParams(path);
      if (params === null) {
        // Path doesn't match any route
        return this.handleNotFound(path);
      }

      // Handle fallback
      const fallbackMode = this.getFallbackMode(path);
      const staticContext: StaticPropsContext = {
        params,
        locale: context.data.locale as string | undefined,
      };

      const fallbackResult = await this.fallbackHandler.handle(
        path,
        fallbackMode,
        staticContext
      );

      return this.createFallbackResponse(fallbackResult);
    } catch (error) {
      this.logger.error(`Handler error: ${path}`, { error });
      return this.createErrorResponse(error);
    }
  }

  /**
   * Check if path should be handled
   */
  private shouldHandle(path: string): boolean {
    // Check exclude first
    if (this.exclude) {
      if (typeof this.exclude === 'function') {
        if (this.exclude(path)) return false;
      } else if (this.exclude.test(path)) {
        return false;
      }
    }

    // Check include
    if (this.include) {
      if (typeof this.include === 'function') {
        return this.include(path);
      }
      return this.include.test(path);
    }

    // Default: handle paths that look like pages
    return !path.includes('.') || path.endsWith('.html');
  }

  /**
   * Create response from cache entry
   */
  private createCacheResponse(entry: CacheEntry, status: string): Response {
    const headers = new Headers(entry.headers ?? {});

    // Set content type
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'text/html; charset=utf-8');
    }

    // Set cache control
    headers.set('Cache-Control', this.cache.getCacheControl(entry));

    // Set ETag
    headers.set('ETag', this.cache.getETag(entry));

    // Add debug headers if enabled
    if (this.config.dev?.debugHeaders) {
      headers.set(DEBUG_HEADERS.CACHE_STATUS, status);
      headers.set(DEBUG_HEADERS.REVALIDATED_AT, new Date(entry.meta.revalidatedAt).toISOString());
      headers.set(DEBUG_HEADERS.REGENERATION_COUNT, String(entry.meta.regenerationCount));
      if (entry.meta.contentHash) {
        headers.set(DEBUG_HEADERS.CONTENT_HASH, entry.meta.contentHash);
      }
    }

    return new Response(entry.html, {
      status: 200,
      headers,
    });
  }

  /**
   * Create response from fallback result
   */
  private createFallbackResponse(result: import('./fallback.js').FallbackResult): Response {
    if (result.type === 'redirect' && result.redirect) {
      return Response.redirect(result.redirect, 307);
    }

    const headers = new Headers(result.headers);

    return new Response(result.html ?? '', {
      status: result.status,
      headers,
    });
  }

  /**
   * Handle not found
   */
  private handleNotFound(path: string): Response {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'X-ISR-Cache': 'NOT_FOUND',
      },
    });
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: unknown): Response {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const isDev = this.config.dev?.debugHeaders;

    return new Response(isDev ? message : 'Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'X-ISR-Cache': 'ERROR',
      },
    });
  }

  /**
   * Emit an event
   */
  private async emitEvent(event: ISREvent): Promise<void> {
    if (this.onEvent) {
      try {
        await this.onEvent(event);
      } catch (error) {
        this.logger.error('Event handler error', { error });
      }
    }
  }

  private createDefaultLogger(): ISRLogger {
    return {
      debug: () => {},
      info: () => {},
      warn: (msg) => console.warn(`[ISR:Handler] ${msg}`),
      error: (msg) => console.error(`[ISR:Handler] ${msg}`),
    };
  }
}

/**
 * Create an ISR handler
 */
export function createISRHandler(options: ISRHandlerOptions): ISRHandler {
  return new ISRHandler(options);
}

/**
 * Create a fetch-compatible handler
 */
export function createFetchHandler(
  handler: ISRHandler
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const context: ISRHandlerContext = {
      request,
      path: url.pathname,
      searchParams: url.searchParams,
      params: {},
      data: {},
    };

    const result = await handler.handle(context);

    if (result instanceof Response) {
      return result;
    }

    if ('response' in result && result.response) {
      return result.response;
    }

    // Return 404 for unhandled requests
    return new Response('Not Found', { status: 404 });
  };
}

/**
 * Create middleware for Express-like frameworks
 */
export function createExpressMiddleware(handler: ISRHandler) {
  return async (
    req: { path: string; url: string; method: string; headers: Record<string, string> },
    res: {
      setHeader: (key: string, value: string) => void;
      status: (code: number) => { send: (body: string) => void };
      end: (body?: string) => void;
    },
    next: () => void
  ): Promise<void> => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const url = new URL(req.url, 'http://localhost');
    const context: ISRHandlerContext = {
      request: new Request(url),
      path: req.path,
      searchParams: url.searchParams,
      params: {},
      data: {},
    };

    const result = await handler.handle(context);

    if (result instanceof Response) {
      res.status(result.status);
      result.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const body = await result.text();
      res.end(body);
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
      res.end(body);
      return;
    }

    next();
  };
}

/**
 * PhilJS ISR API Routes
 *
 * HTTP endpoints for on-demand revalidation.
 * Provides secure endpoints for triggering cache invalidation.
 */

import type { CacheManager } from './cache.js';
import type { ISRConfig, ISREvent, ISRLogger, ISRMetrics } from './config.js';
import type { RevalidationManager, RevalidationResult } from './revalidate.js';
import type { TagManager, TagInvalidationResult } from './tags.js';

/**
 * API handler request context
 */
export interface APIContext {
  /** Request object */
  request: Request;
  /** URL path */
  path: string;
  /** URL search params */
  searchParams: URLSearchParams;
  /** Request body (if applicable) */
  body?: unknown;
}

/**
 * API response
 */
export interface APIResponse {
  /** Status code */
  status: number;
  /** Response body */
  body: unknown;
  /** Response headers */
  headers?: Record<string, string>;
}

/**
 * Revalidation request body
 */
export interface RevalidateRequestBody {
  /** Path to revalidate */
  path?: string;
  /** Paths to revalidate (batch) */
  paths?: string[];
  /** Tag to invalidate */
  tag?: string;
  /** Tags to invalidate (batch) */
  tags?: string[];
  /** Force revalidation even if not stale */
  force?: boolean;
}

/**
 * API handler options
 */
export interface APIHandlerOptions {
  /** Custom authentication function */
  authenticate?: (request: Request) => Promise<boolean> | boolean;
  /** Rate limiting (requests per minute) */
  rateLimit?: number;
  /** Enable CORS */
  cors?: boolean | { origins: string[] };
  /** Custom error handler */
  onError?: (error: Error, context: APIContext) => APIResponse;
}

/**
 * Rate limiter state
 */
interface RateLimiterState {
  requests: Map<string, number[]>;
  windowMs: number;
  maxRequests: number;
}

/**
 * ISR API handler
 */
export class ISRApiHandler {
  private cache: CacheManager;
  private revalidator: RevalidationManager;
  private tagManager: TagManager;
  private config: ISRConfig;
  private options: APIHandlerOptions;
  private logger: ISRLogger;
  private eventHandler: ((event: ISREvent) => void | Promise<void>) | undefined;

  // Rate limiting
  private rateLimiter?: RateLimiterState;

  // Metrics
  private metrics: ISRMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    revalidations: 0,
    revalidationErrors: 0,
    avgRegenerationTime: 0,
    cacheSize: 0,
    entryCount: 0,
  };
  private regenerationTimes: number[] = [];

  constructor(
    cache: CacheManager,
    revalidator: RevalidationManager,
    tagManager: TagManager,
    config: ISRConfig,
    options: APIHandlerOptions = {},
    eventHandler?: (event: ISREvent) => void | Promise<void>
  ) {
    this.cache = cache;
    this.revalidator = revalidator;
    this.tagManager = tagManager;
    this.config = config;
    this.options = options;
    this.logger = config.logger ?? this.createDefaultLogger();
    this.eventHandler = eventHandler;

    // Setup rate limiter
    if (options.rateLimit) {
      this.rateLimiter = {
        requests: new Map(),
        windowMs: 60000, // 1 minute
        maxRequests: options.rateLimit,
      };
    }
  }

  /**
   * Get the main handler function
   */
  handler(): (request: Request) => Promise<Response> {
    return async (request: Request): Promise<Response> => {
      const url = new URL(request.url);
      const context: APIContext = {
        request,
        path: url.pathname,
        searchParams: url.searchParams,
      };

      // Handle CORS preflight
      if (request.method === 'OPTIONS' && this.options.cors) {
        return this.corsResponse();
      }

      // Parse body if applicable
      if (request.method === 'POST' || request.method === 'PUT') {
        try {
          context.body = await request.json();
        } catch {
          return this.createResponse({
            status: 400,
            body: { error: 'Invalid JSON body' },
          });
        }
      }

      try {
        // Check authentication
        if (!await this.authenticate(request)) {
          return this.createResponse({
            status: 401,
            body: { error: 'Unauthorized' },
          });
        }

        // Check rate limit
        if (this.rateLimiter && !this.checkRateLimit(request)) {
          return this.createResponse({
            status: 429,
            body: { error: 'Too many requests' },
          });
        }

        // Route to handler
        return this.routeRequest(context);
      } catch (error) {
        this.logger.error('API error', { error });

        if (this.options.onError) {
          const response = this.options.onError(
            error instanceof Error ? error : new Error(String(error)),
            context
          );
          return this.createResponse(response);
        }

        return this.createResponse({
          status: 500,
          body: { error: 'Internal server error' },
        });
      }
    };
  }

  /**
   * Route request to appropriate handler
   */
  private async routeRequest(context: APIContext): Promise<Response> {
    const { request, path } = context;
    const method = request.method;

    // Normalize path (remove trailing slash)
    const normalizedPath = path.replace(/\/$/, '');

    // POST /api/revalidate - On-demand revalidation
    if (normalizedPath.endsWith('/revalidate') && method === 'POST') {
      return this.handleRevalidate(context);
    }

    // POST /api/invalidate-tag - Tag-based invalidation
    if (normalizedPath.endsWith('/invalidate-tag') && method === 'POST') {
      return this.handleInvalidateTag(context);
    }

    // GET /api/cache/stats - Cache statistics
    if (normalizedPath.endsWith('/cache/stats') && method === 'GET') {
      return this.handleCacheStats();
    }

    // GET /api/cache/entry - Get cache entry info
    if (normalizedPath.endsWith('/cache/entry') && method === 'GET') {
      return this.handleCacheEntry(context);
    }

    // DELETE /api/cache/entry - Delete cache entry
    if (normalizedPath.endsWith('/cache/entry') && method === 'DELETE') {
      return this.handleDeleteEntry(context);
    }

    // DELETE /api/cache - Clear entire cache
    if (normalizedPath.endsWith('/cache') && method === 'DELETE') {
      return this.handleClearCache();
    }

    // GET /api/tags - List all tags
    if (normalizedPath.endsWith('/tags') && method === 'GET') {
      return this.handleListTags();
    }

    // GET /api/metrics - Get ISR metrics
    if (normalizedPath.endsWith('/metrics') && method === 'GET') {
      return this.handleMetrics();
    }

    // GET /api/health - Health check
    if (normalizedPath.endsWith('/health') && method === 'GET') {
      return this.handleHealthCheck();
    }

    return this.createResponse({
      status: 404,
      body: { error: 'Not found' },
    });
  }

  /**
   * Handle revalidation request
   */
  private async handleRevalidate(context: APIContext): Promise<Response> {
    const body = context.body as RevalidateRequestBody | undefined;

    if (!body) {
      return this.createResponse({
        status: 400,
        body: { error: 'Request body required' },
      });
    }

    const results: RevalidationResult[] = [];

    // Handle single path
    if (body.path) {
      const result = await this.revalidator.revalidatePath(body.path);
      results.push(result);
      this.updateMetrics(result);
    }

    // Handle multiple paths
    if (body.paths && body.paths.length > 0) {
      for (const path of body.paths) {
        const result = await this.revalidator.revalidatePath(path);
        results.push(result);
        this.updateMetrics(result);
      }
    }

    // Handle tag
    if (body.tag) {
      const tagResults = await this.revalidator.revalidateTag(body.tag);
      results.push(...tagResults);
      tagResults.forEach(r => this.updateMetrics(r));
    }

    // Handle multiple tags
    if (body.tags && body.tags.length > 0) {
      for (const tag of body.tags) {
        const tagResults = await this.revalidator.revalidateTag(tag);
        results.push(...tagResults);
        tagResults.forEach(r => this.updateMetrics(r));
      }
    }

    if (results.length === 0) {
      return this.createResponse({
        status: 400,
        body: { error: 'No paths or tags specified' },
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return this.createResponse({
      status: 200,
      body: {
        revalidated: results.length,
        successful,
        failed,
        results,
      },
    });
  }

  /**
   * Handle tag invalidation request
   */
  private async handleInvalidateTag(context: APIContext): Promise<Response> {
    const body = context.body as { tag?: string; tags?: string[] } | undefined;

    if (!body || (!body.tag && !body.tags)) {
      return this.createResponse({
        status: 400,
        body: { error: 'Tag or tags required' },
      });
    }

    const results: TagInvalidationResult[] = [];

    if (body.tag) {
      const result = await this.tagManager.invalidateTag(body.tag);
      results.push(result);
    }

    if (body.tags) {
      const tagResults = await this.tagManager.invalidateTags(body.tags);
      results.push(...tagResults);
    }

    const totalPaths = results.reduce((acc, r) => acc + r.paths.length, 0);
    const allSuccessful = results.every(r => r.success);

    return this.createResponse({
      status: 200,
      body: {
        invalidated: results.length,
        totalPaths,
        success: allSuccessful,
        results,
      },
    });
  }

  /**
   * Handle cache stats request
   */
  private async handleCacheStats(): Promise<Response> {
    const stats = await this.cache.getStats();

    return this.createResponse({
      status: 200,
      body: stats,
    });
  }

  /**
   * Handle get cache entry request
   */
  private async handleCacheEntry(context: APIContext): Promise<Response> {
    const path = context.searchParams.get('path');

    if (!path) {
      return this.createResponse({
        status: 400,
        body: { error: 'Path query parameter required' },
      });
    }

    const entry = await this.cache.get(path, { includeStale: true });

    if (!entry) {
      return this.createResponse({
        status: 404,
        body: { error: 'Entry not found' },
      });
    }

    return this.createResponse({
      status: 200,
      body: {
        path,
        meta: entry.meta,
        htmlLength: entry.html.length,
        hasProps: !!entry.props,
      },
    });
  }

  /**
   * Handle delete cache entry request
   */
  private async handleDeleteEntry(context: APIContext): Promise<Response> {
    const path = context.searchParams.get('path');

    if (!path) {
      return this.createResponse({
        status: 400,
        body: { error: 'Path query parameter required' },
      });
    }

    const deleted = await this.cache.delete(path);

    return this.createResponse({
      status: 200,
      body: { deleted, path },
    });
  }

  /**
   * Handle clear cache request
   */
  private async handleClearCache(): Promise<Response> {
    await this.cache.clear();

    return this.createResponse({
      status: 200,
      body: { cleared: true },
    });
  }

  /**
   * Handle list tags request
   */
  private async handleListTags(): Promise<Response> {
    const tags = this.tagManager.getAllTags();
    const stats = this.tagManager.getTagStats();

    const tagDetails = tags.map(tag => ({
      name: tag,
      ...stats.get(tag),
    }));

    return this.createResponse({
      status: 200,
      body: { tags: tagDetails },
    });
  }

  /**
   * Handle metrics request
   */
  private async handleMetrics(): Promise<Response> {
    const cacheStats = await this.cache.getStats();

    const metrics: ISRMetrics = {
      ...this.metrics,
      cacheSize: cacheStats.sizeBytes,
      entryCount: cacheStats.entryCount,
    };

    return this.createResponse({
      status: 200,
      body: metrics,
    });
  }

  /**
   * Handle health check request
   */
  private async handleHealthCheck(): Promise<Response> {
    try {
      // Try to access cache
      await this.cache.keys();

      return this.createResponse({
        status: 200,
        body: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cache: this.cache.getAdapter().name,
        },
      });
    } catch (error) {
      return this.createResponse({
        status: 503,
        body: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Authenticate request
   */
  private async authenticate(request: Request): Promise<boolean> {
    // Custom authentication
    if (this.options.authenticate) {
      return this.options.authenticate(request);
    }

    // Default: check secret token
    const secret = this.config.revalidateSecret;
    if (!secret) {
      // No secret configured - allow in development
      if (this.config.dev?.disableCache) {
        return true;
      }
      this.logger.warn('No revalidate secret configured');
      return false;
    }

    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return token === secret;
    }

    // Check query parameter
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('secret');
    if (queryToken) {
      return queryToken === secret;
    }

    // Check X-Revalidate-Token header
    const tokenHeader = request.headers.get('X-Revalidate-Token');
    if (tokenHeader) {
      return tokenHeader === secret;
    }

    return false;
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(request: Request): boolean {
    if (!this.rateLimiter) {
      return true;
    }

    // Get client identifier (IP or auth token)
    const clientId = request.headers.get('X-Forwarded-For') ||
      request.headers.get('Authorization') ||
      'anonymous';

    const now = Date.now();
    const { requests, windowMs, maxRequests } = this.rateLimiter;

    // Get request times for this client
    let times = requests.get(clientId) || [];

    // Remove old requests
    times = times.filter(t => now - t < windowMs);

    // Check if over limit
    if (times.length >= maxRequests) {
      return false;
    }

    // Add this request
    times.push(now);
    requests.set(clientId, times);

    return true;
  }

  /**
   * Update metrics
   */
  private updateMetrics(result: RevalidationResult): void {
    this.metrics.revalidations++;

    if (result.success) {
      this.regenerationTimes.push(result.duration);
      if (this.regenerationTimes.length > 100) {
        this.regenerationTimes.shift();
      }
      this.metrics.avgRegenerationTime =
        this.regenerationTimes.reduce((a, b) => a + b, 0) / this.regenerationTimes.length;
    } else {
      this.metrics.revalidationErrors++;
    }
  }

  /**
   * Create HTTP response
   */
  private createResponse(apiResponse: APIResponse): Response {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...apiResponse.headers,
    });

    // Add CORS headers if enabled
    if (this.options.cors) {
      this.addCorsHeaders(headers);
    }

    return new Response(JSON.stringify(apiResponse.body), {
      status: apiResponse.status,
      headers,
    });
  }

  /**
   * Create CORS preflight response
   */
  private corsResponse(): Response {
    const headers = new Headers();
    this.addCorsHeaders(headers);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 204, headers });
  }

  /**
   * Add CORS headers
   */
  private addCorsHeaders(headers: Headers): void {
    if (!this.options.cors) return;

    if (typeof this.options.cors === 'boolean') {
      headers.set('Access-Control-Allow-Origin', '*');
    } else {
      headers.set('Access-Control-Allow-Origin', this.options.cors.origins.join(', '));
    }

    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Revalidate-Token');
    headers.set('Access-Control-Max-Age', '86400');
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
      debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:API] ${msg}`, meta || ''),
      info: (msg, meta) => shouldLog('info') && console.info(`[ISR:API] ${msg}`, meta || ''),
      warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:API] ${msg}`, meta || ''),
      error: (msg, meta) => shouldLog('error') && console.error(`[ISR:API] ${msg}`, meta || ''),
    };
  }
}

/**
 * Create API handler
 */
export function createAPIHandler(
  cache: CacheManager,
  revalidator: RevalidationManager,
  tagManager: TagManager,
  config: ISRConfig,
  options?: APIHandlerOptions
): ISRApiHandler {
  return new ISRApiHandler(cache, revalidator, tagManager, config, options);
}

/**
 * Quick helper to create revalidation endpoint
 */
export function createRevalidateEndpoint(
  revalidator: RevalidationManager,
  config: ISRConfig
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    // Check secret
    const secret = config.revalidateSecret;
    if (secret) {
      const url = new URL(request.url);
      const providedSecret = url.searchParams.get('secret') ||
        request.headers.get('Authorization')?.replace('Bearer ', '') ||
        request.headers.get('X-Revalidate-Token');

      if (providedSecret !== secret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Get path to revalidate
    const url = new URL(request.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return new Response(JSON.stringify({ error: 'Path required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await revalidator.revalidatePath(path);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * PhilJS ISR On-Demand Revalidation API
 *
 * Provides an API endpoint for triggering on-demand revalidation of cached pages.
 * Supports both path-based and tag-based revalidation.
 */

import type { ISRLogger, RevalidateRequest, RevalidateResult } from '../types.js';
import type { RuntimeRevalidator } from '../runtime/revalidate.js';
import type { RuntimeCache } from '../runtime/cache.js';

/**
 * Revalidation endpoint options
 */
export interface RevalidateEndpointOptions {
  /** Secret for authenticating requests */
  secret: string;
  /** Revalidator instance */
  revalidator: RuntimeRevalidator;
  /** Cache instance */
  cache: RuntimeCache;
  /** Logger */
  logger?: ISRLogger;
  /** Rate limiting options */
  rateLimit?: {
    /** Maximum requests per window */
    maxRequests?: number;
    /** Window size in milliseconds */
    windowMs?: number;
  };
}

/**
 * Rate limiter state
 */
interface RateLimiterState {
  requests: number;
  windowStart: number;
}

/**
 * Revalidation endpoint handler
 */
export class RevalidateEndpoint {
  private secret: string;
  private revalidator: RuntimeRevalidator;
  private cache: RuntimeCache;
  private logger: ISRLogger;
  private rateLimit: { maxRequests: number; windowMs: number };
  private rateLimiterState: RateLimiterState = { requests: 0, windowStart: Date.now() };

  constructor(options: RevalidateEndpointOptions) {
    this.secret = options.secret;
    this.revalidator = options.revalidator;
    this.cache = options.cache;
    this.logger = options.logger ?? this.createDefaultLogger();
    this.rateLimit = {
      maxRequests: options.rateLimit?.maxRequests ?? 100,
      windowMs: options.rateLimit?.windowMs ?? 60000,
    };
  }

  /**
   * Handle a revalidation request
   */
  async handle(request: Request): Promise<Response> {
    // Check method
    if (request.method !== 'POST') {
      return this.errorResponse('Method not allowed', 405);
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      return this.errorResponse('Rate limit exceeded', 429);
    }

    try {
      // Parse body
      const body = await this.parseBody(request);
      if (!body) {
        return this.errorResponse('Invalid request body', 400);
      }

      // Validate secret
      if (!this.validateSecret(body.secret)) {
        this.logger.warn('Invalid revalidation secret');
        return this.errorResponse('Invalid secret', 401);
      }

      // Validate request
      if (!body.path && !body.tag) {
        return this.errorResponse('Either path or tag is required', 400);
      }

      if (body.path && body.tag) {
        return this.errorResponse('Cannot specify both path and tag', 400);
      }

      // Perform revalidation
      const result = await this.revalidate(body);

      return this.successResponse(result);
    } catch (error) {
      this.logger.error('Revalidation error', { error });
      return this.errorResponse('Internal server error', 500);
    }
  }

  /**
   * Parse request body
   */
  private async parseBody(request: Request): Promise<RevalidateRequest | null> {
    try {
      const contentType = request.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        return await request.json();
      }

      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        return {
          path: params.get('path') ?? undefined,
          tag: params.get('tag') ?? undefined,
          secret: params.get('secret') ?? '',
        };
      }

      // Try JSON anyway
      return await request.json();
    } catch {
      return null;
    }
  }

  /**
   * Validate the secret
   */
  private validateSecret(provided: string): boolean {
    if (!provided || !this.secret) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (provided.length !== this.secret.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < provided.length; i++) {
      result |= provided.charCodeAt(i) ^ this.secret.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset window if expired
    if (now - this.rateLimiterState.windowStart > this.rateLimit.windowMs) {
      this.rateLimiterState = { requests: 0, windowStart: now };
    }

    // Check limit
    if (this.rateLimiterState.requests >= this.rateLimit.maxRequests) {
      return false;
    }

    this.rateLimiterState.requests++;
    return true;
  }

  /**
   * Perform revalidation
   */
  private async revalidate(body: RevalidateRequest): Promise<RevalidateResult> {
    const startTime = Date.now();
    const paths: string[] = [];
    let success = true;
    let error: string | undefined;

    try {
      if (body.path) {
        // Path-based revalidation
        this.logger.info(`Revalidating path: ${body.path}`);
        const result = await this.revalidator.revalidate(body.path, { force: true });
        paths.push(body.path);
        success = result.success;
        error = result.error;
      } else if (body.tag) {
        // Tag-based revalidation
        this.logger.info(`Revalidating tag: ${body.tag}`);
        const results = await this.revalidator.revalidateTag(body.tag, { force: true });
        paths.push(...results.map((r) => r.path));
        success = results.every((r) => r.success);
        const errors = results.filter((r) => !r.success).map((r) => r.error);
        if (errors.length > 0) {
          error = errors.join('; ');
        }
      }
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : String(e);
    }

    return {
      revalidated: success,
      paths,
      error,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Create success response
   */
  private successResponse(result: RevalidateResult): Response {
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  /**
   * Create error response
   */
  private errorResponse(message: string, status: number): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  private createDefaultLogger(): ISRLogger {
    return {
      debug: () => {},
      info: (msg) => console.info(`[ISR:Revalidate] ${msg}`),
      warn: (msg) => console.warn(`[ISR:Revalidate] ${msg}`),
      error: (msg) => console.error(`[ISR:Revalidate] ${msg}`),
    };
  }
}

/**
 * Create a revalidation endpoint handler
 */
export function createRevalidateEndpoint(options: RevalidateEndpointOptions): RevalidateEndpoint {
  return new RevalidateEndpoint(options);
}

/**
 * Create a fetch-compatible handler
 */
export function createRevalidateHandler(
  options: RevalidateEndpointOptions
): (request: Request) => Promise<Response> {
  const endpoint = createRevalidateEndpoint(options);
  return (request: Request) => endpoint.handle(request);
}

/**
 * Helper to create revalidation function for use in API routes
 */
export function revalidatePath(
  revalidator: RuntimeRevalidator
): (path: string) => Promise<{ revalidated: boolean; error?: string }> {
  return async (path: string) => {
    const result = await revalidator.revalidate(path, { force: true });
    return {
      revalidated: result.success,
      error: result.error,
    };
  };
}

/**
 * Helper to create tag revalidation function for use in API routes
 */
export function revalidateTag(
  revalidator: RuntimeRevalidator
): (tag: string) => Promise<{ revalidated: boolean; paths: string[]; error?: string }> {
  return async (tag: string) => {
    const results = await revalidator.revalidateTag(tag, { force: true });
    const paths = results.map((r) => r.path);
    const success = results.every((r) => r.success);
    const errors = results.filter((r) => !r.success).map((r) => r.error);

    return {
      revalidated: success,
      paths,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  };
}

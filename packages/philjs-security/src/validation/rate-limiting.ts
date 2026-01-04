/**
 * PhilJS Security - Rate Limiting
 *
 * Protect APIs from abuse with rate limiting.
 */

import type { RateLimitConfig, RateLimitStore, RateLimitInfo, SecurityMiddleware } from '../types.js';

/**
 * In-memory rate limit store
 *
 * Simple store for single-server deployments.
 * For distributed systems, use Redis or another shared store.
 */
export class MemoryStore implements RateLimitStore {
  private hits: Map<string, { count: number; resetTime: Date }> = new Map();
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;

    // Cleanup expired entries periodically
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), windowMs);
    }
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = new Date();
    const existing = this.hits.get(key);

    if (existing && existing.resetTime > now) {
      existing.count++;
      return {
        totalHits: existing.count,
        resetTime: existing.resetTime,
      };
    }

    // New window
    const resetTime = new Date(now.getTime() + this.windowMs);
    this.hits.set(key, { count: 1, resetTime });

    return {
      totalHits: 1,
      resetTime,
    };
  }

  async decrement(key: string): Promise<void> {
    const existing = this.hits.get(key);
    if (existing && existing.count > 0) {
      existing.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key);
  }

  async resetAll(): Promise<void> {
    this.hits.clear();
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, value] of this.hits.entries()) {
      if (value.resetTime <= now) {
        this.hits.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Sliding window rate limit store
 *
 * More accurate rate limiting using sliding window algorithm.
 */
export class SlidingWindowStore implements RateLimitStore {
  private windows: Map<string, number[]> = new Map();
  private windowMs: number;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create timestamps array
    let timestamps = this.windows.get(key) || [];

    // Remove expired timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Add current timestamp
    timestamps.push(now);
    this.windows.set(key, timestamps);

    return {
      totalHits: timestamps.length,
      resetTime: new Date(now + this.windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    const timestamps = this.windows.get(key);
    if (timestamps && timestamps.length > 0) {
      timestamps.pop();
    }
  }

  async resetKey(key: string): Promise<void> {
    this.windows.delete(key);
  }

  async resetAll(): Promise<void> {
    this.windows.clear();
  }
}

/**
 * Default rate limit configuration
 */
const defaultConfig: Required<RateLimitConfig> = {
  max: 100,
  windowMs: 60000, // 1 minute
  keyGenerator: (request: Request) => {
    // Try to get IP from common headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    // Fallback to URL origin
    return new URL(request.url).origin;
  },
  skip: () => false,
  handler: (_request: Request, retryAfter: number) => {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
        retryAfter: Math.ceil(retryAfter / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(retryAfter / 1000)),
        },
      }
    );
  },
  store: new MemoryStore(),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests, please try again later.',
  statusCode: 429,
};

/**
 * Create rate limiting middleware
 *
 * Limits the number of requests from each client within a time window.
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * // Basic rate limiting: 100 requests per minute
 * const limiter = rateLimit({
 *   max: 100,
 *   windowMs: 60 * 1000,
 * });
 *
 * // Strict API rate limiting
 * const apiLimiter = rateLimit({
 *   max: 20,
 *   windowMs: 60 * 1000,
 *   keyGenerator: (req) => req.headers.get('Authorization') || 'anonymous',
 * });
 *
 * // Different limits per endpoint
 * const loginLimiter = rateLimit({
 *   max: 5,
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   message: 'Too many login attempts',
 * });
 * ```
 */
export function rateLimit(config: RateLimitConfig = {}): SecurityMiddleware {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    store: config.store || new MemoryStore(config.windowMs || defaultConfig.windowMs),
  };

  const {
    max,
    windowMs,
    keyGenerator,
    skip,
    handler,
    store,
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    message,
    statusCode,
  } = mergedConfig;

  return async (request: Request, next: () => Promise<Response>) => {
    // Check if request should be skipped
    if (skip(request)) {
      return next();
    }

    // Generate key for this client
    const key = keyGenerator(request);

    // Increment counter
    const info = await store.increment(key);
    const remaining = Math.max(0, max - info.totalHits);
    const resetTime = info.resetTime;
    const retryAfter = Math.max(0, resetTime.getTime() - Date.now());

    // Check if rate limited
    if (info.totalHits > max) {
      return handler(request, retryAfter);
    }

    // Proceed with request
    const response = await next();

    // Skip counting based on response
    const isSuccess = response.status >= 200 && response.status < 300;
    if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && !isSuccess)) {
      await store.decrement(key);
    }

    // Add rate limit headers
    const headers = new Headers(response.headers);

    if (standardHeaders) {
      headers.set('RateLimit-Limit', String(max));
      headers.set('RateLimit-Remaining', String(remaining));
      headers.set('RateLimit-Reset', String(Math.ceil(resetTime.getTime() / 1000)));
    }

    if (legacyHeaders) {
      headers.set('X-RateLimit-Limit', String(max));
      headers.set('X-RateLimit-Remaining', String(remaining));
      headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime.getTime() / 1000)));
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Create a rate limiter for specific routes/methods
 *
 * @param routes - Route patterns to limit
 * @param config - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * const limiter = routeRateLimit([
 *   { path: '/api/auth/login', method: 'POST', max: 5, windowMs: 15 * 60 * 1000 },
 *   { path: '/api/auth/register', method: 'POST', max: 3, windowMs: 60 * 60 * 1000 },
 *   { path: '/api/*', max: 100, windowMs: 60 * 1000 },
 * ]);
 * ```
 */
export function routeRateLimit(
  routes: Array<{
    path: string;
    method?: string;
    max?: number;
    windowMs?: number;
    keyGenerator?: (request: Request) => string;
  }>
): SecurityMiddleware {
  // Create rate limiters for each route
  const limiters = routes.map((route) => {
    const config: RateLimitConfig = {};
    if (route.max !== undefined) config.max = route.max;
    if (route.windowMs !== undefined) config.windowMs = route.windowMs;
    if (route.keyGenerator !== undefined) config.keyGenerator = route.keyGenerator;

    return {
      pattern: new RegExp('^' + route.path.replace(/\*/g, '.*') + '$'),
      method: route.method?.toUpperCase(),
      limiter: rateLimit(config),
    };
  });

  return async (request: Request, next: () => Promise<Response>) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    // Find matching route
    for (const { pattern, method: routeMethod, limiter } of limiters) {
      if (pattern.test(path)) {
        if (!routeMethod || routeMethod === method) {
          return limiter(request, next);
        }
      }
    }

    // No matching route, proceed without rate limiting
    return next();
  };
}

/**
 * Rate limit presets for common use cases
 */
export const rateLimitPresets = {
  /**
   * Default API rate limit: 100 requests per minute
   */
  api: {
    max: 100,
    windowMs: 60 * 1000,
    standardHeaders: true,
  } satisfies RateLimitConfig,

  /**
   * Strict rate limit: 20 requests per minute
   */
  strict: {
    max: 20,
    windowMs: 60 * 1000,
    standardHeaders: true,
  } satisfies RateLimitConfig,

  /**
   * Login rate limit: 5 attempts per 15 minutes
   */
  login: {
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many login attempts. Please try again later.',
    standardHeaders: true,
  } satisfies RateLimitConfig,

  /**
   * Registration rate limit: 3 per hour
   */
  registration: {
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many registration attempts. Please try again later.',
    standardHeaders: true,
  } satisfies RateLimitConfig,

  /**
   * Password reset rate limit: 3 per hour
   */
  passwordReset: {
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many password reset attempts. Please try again later.',
    standardHeaders: true,
  } satisfies RateLimitConfig,

  /**
   * Upload rate limit: 10 per hour
   */
  upload: {
    max: 10,
    windowMs: 60 * 60 * 1000,
    standardHeaders: true,
  } satisfies RateLimitConfig,

  /**
   * Expensive operations: 5 per minute
   */
  expensive: {
    max: 5,
    windowMs: 60 * 1000,
    standardHeaders: true,
  } satisfies RateLimitConfig,
};

/**
 * Create a rate limit key generator based on user ID
 *
 * @param getUser - Function to extract user ID from request
 * @param fallback - Fallback key generator for unauthenticated requests
 * @returns Key generator function
 */
export function userBasedKeyGenerator(
  getUser: (request: Request) => string | null,
  fallback?: (request: Request) => string
): (request: Request) => string {
  return (request: Request) => {
    const userId = getUser(request);
    if (userId) {
      return `user:${userId}`;
    }

    if (fallback) {
      return fallback(request);
    }

    // Default to IP-based
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return `ip:${forwarded.split(',')[0]?.trim()}`;
    }

    return 'ip:unknown';
  };
}

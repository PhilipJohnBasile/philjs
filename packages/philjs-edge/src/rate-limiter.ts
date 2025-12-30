/**
 * Edge Rate Limiter
 *
 * Distributed rate limiting for edge deployments:
 * - Token bucket algorithm
 * - Sliding window
 * - Fixed window
 * - Leaky bucket
 * - Distributed coordination via KV/Durable Objects
 */

import type { KVStore } from './index.js';

export interface RateLimitConfig {
  /** Maximum requests allowed */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Rate limiting algorithm */
  algorithm: 'token-bucket' | 'sliding-window' | 'fixed-window' | 'leaky-bucket';
  /** Key generator function */
  keyGenerator?: (request: Request) => string;
  /** Skip rate limiting for certain requests */
  skip?: (request: Request) => boolean;
  /** Custom response when rate limited */
  onRateLimited?: (info: RateLimitInfo) => Response;
  /** Headers to include in response */
  headers?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
  requestCount: number;
  windowStart: number;
  requests: number[];
}

/**
 * Edge Rate Limiter
 */
export class EdgeRateLimiter {
  private config: Required<RateLimitConfig>;
  private store: KVStore;
  private localCache: Map<string, RateLimitState> = new Map();

  constructor(store: KVStore, config: Partial<RateLimitConfig> = {}) {
    this.store = store;
    this.config = {
      limit: config.limit ?? 100,
      window: config.window ?? 60,
      algorithm: config.algorithm ?? 'sliding-window',
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator,
      skip: config.skip ?? (() => false),
      onRateLimited: config.onRateLimited ?? this.defaultRateLimitedResponse,
      headers: config.headers ?? true,
    };
  }

  /**
   * Check if request is allowed
   */
  async check(request: Request): Promise<RateLimitResult> {
    if (this.config.skip(request)) {
      return {
        allowed: true,
        info: { limit: this.config.limit, remaining: this.config.limit, reset: 0 },
      };
    }

    const key = this.config.keyGenerator(request);

    switch (this.config.algorithm) {
      case 'token-bucket':
        return this.tokenBucket(key);
      case 'sliding-window':
        return this.slidingWindow(key);
      case 'fixed-window':
        return this.fixedWindow(key);
      case 'leaky-bucket':
        return this.leakyBucket(key);
      default:
        return this.slidingWindow(key);
    }
  }

  /**
   * Rate limit middleware
   */
  async middleware(request: Request): Promise<Response | null> {
    const result = await this.check(request);

    if (!result.allowed) {
      const response = this.config.onRateLimited(result.info);
      if (this.config.headers) {
        return this.addRateLimitHeaders(response, result.info);
      }
      return response;
    }

    return null; // Request allowed, continue
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(info: RateLimitInfo): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(info.limit),
      'X-RateLimit-Remaining': String(info.remaining),
      'X-RateLimit-Reset': String(info.reset),
      ...(info.retryAfter !== undefined && {
        'Retry-After': String(info.retryAfter),
      }),
    };
  }

  /**
   * Token bucket algorithm
   */
  private async tokenBucket(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const stateKey = `ratelimit:tb:${key}`;

    // Get or initialize state
    let state = await this.getState(stateKey);
    if (!state) {
      state = {
        tokens: this.config.limit,
        lastRefill: now,
        requestCount: 0,
        windowStart: now,
        requests: [],
      };
    }

    // Refill tokens
    const timePassed = (now - state.lastRefill) / 1000;
    const refillRate = this.config.limit / this.config.window;
    const tokensToAdd = timePassed * refillRate;
    state.tokens = Math.min(this.config.limit, state.tokens + tokensToAdd);
    state.lastRefill = now;

    // Check and consume token
    if (state.tokens >= 1) {
      state.tokens -= 1;
      await this.setState(stateKey, state);

      return {
        allowed: true,
        info: {
          limit: this.config.limit,
          remaining: Math.floor(state.tokens),
          reset: Math.ceil(now / 1000 + this.config.window),
        },
      };
    }

    // Calculate retry after
    const retryAfter = Math.ceil((1 - state.tokens) / refillRate);
    await this.setState(stateKey, state);

    return {
      allowed: false,
      info: {
        limit: this.config.limit,
        remaining: 0,
        reset: Math.ceil(now / 1000 + this.config.window),
        retryAfter,
      },
    };
  }

  /**
   * Sliding window algorithm
   */
  private async slidingWindow(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = this.config.window * 1000;
    const windowStart = now - windowMs;
    const stateKey = `ratelimit:sw:${key}`;

    // Get or initialize state
    let state = await this.getState(stateKey);
    if (!state) {
      state = {
        tokens: 0,
        lastRefill: now,
        requestCount: 0,
        windowStart: now,
        requests: [],
      };
    }

    // Remove old requests outside window
    state.requests = state.requests.filter(t => t > windowStart);

    // Check limit
    if (state.requests.length >= this.config.limit) {
      const oldestRequest = state.requests[0]!;
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

      return {
        allowed: false,
        info: {
          limit: this.config.limit,
          remaining: 0,
          reset: Math.ceil((oldestRequest + windowMs) / 1000),
          retryAfter,
        },
      };
    }

    // Add request
    state.requests.push(now);
    await this.setState(stateKey, state);

    return {
      allowed: true,
      info: {
        limit: this.config.limit,
        remaining: this.config.limit - state.requests.length,
        reset: Math.ceil((now + windowMs) / 1000),
      },
    };
  }

  /**
   * Fixed window algorithm
   */
  private async fixedWindow(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = this.config.window * 1000;
    const currentWindow = Math.floor(now / windowMs);
    const stateKey = `ratelimit:fw:${key}:${currentWindow}`;

    // Get or initialize state
    let state = await this.getState(stateKey);
    if (!state) {
      state = {
        tokens: 0,
        lastRefill: now,
        requestCount: 0,
        windowStart: currentWindow * windowMs,
        requests: [],
      };
    }

    // Check limit
    if (state.requestCount >= this.config.limit) {
      const windowEnd = (currentWindow + 1) * windowMs;
      const retryAfter = Math.ceil((windowEnd - now) / 1000);

      return {
        allowed: false,
        info: {
          limit: this.config.limit,
          remaining: 0,
          reset: Math.ceil(windowEnd / 1000),
          retryAfter,
        },
      };
    }

    // Increment count
    state.requestCount += 1;
    await this.setState(stateKey, state, this.config.window + 60); // TTL: window + buffer

    const windowEnd = (currentWindow + 1) * windowMs;
    return {
      allowed: true,
      info: {
        limit: this.config.limit,
        remaining: this.config.limit - state.requestCount,
        reset: Math.ceil(windowEnd / 1000),
      },
    };
  }

  /**
   * Leaky bucket algorithm
   */
  private async leakyBucket(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const stateKey = `ratelimit:lb:${key}`;
    const leakRate = this.config.limit / this.config.window; // requests per second

    // Get or initialize state
    let state = await this.getState(stateKey);
    if (!state) {
      state = {
        tokens: 0,
        lastRefill: now,
        requestCount: 0,
        windowStart: now,
        requests: [],
      };
    }

    // Leak tokens since last request
    const timePassed = (now - state.lastRefill) / 1000;
    const leaked = timePassed * leakRate;
    state.requestCount = Math.max(0, state.requestCount - leaked);
    state.lastRefill = now;

    // Check if bucket is full
    if (state.requestCount >= this.config.limit) {
      const waitTime = (state.requestCount - this.config.limit + 1) / leakRate;
      const retryAfter = Math.ceil(waitTime);

      await this.setState(stateKey, state);

      return {
        allowed: false,
        info: {
          limit: this.config.limit,
          remaining: 0,
          reset: Math.ceil(now / 1000 + waitTime),
          retryAfter,
        },
      };
    }

    // Add to bucket
    state.requestCount += 1;
    await this.setState(stateKey, state);

    return {
      allowed: true,
      info: {
        limit: this.config.limit,
        remaining: Math.floor(this.config.limit - state.requestCount),
        reset: Math.ceil(now / 1000 + this.config.window),
      },
    };
  }

  /**
   * Get state from store
   */
  private async getState(key: string): Promise<RateLimitState | null> {
    // Check local cache first
    const cached = this.localCache.get(key);
    if (cached) return cached;

    try {
      const data = await this.store.get<string>(key);
      if (data) {
        const state = JSON.parse(data);
        this.localCache.set(key, state);
        return state;
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Set state in store
   */
  private async setState(key: string, state: RateLimitState, ttl?: number): Promise<void> {
    this.localCache.set(key, state);
    try {
      await this.store.put(key, JSON.stringify(state), {
        expirationTtl: ttl ?? this.config.window * 2,
      });
    } catch {
      // Ignore errors
    }
  }

  /**
   * Default key generator
   */
  private defaultKeyGenerator(request: Request): string {
    // Use IP address from headers or URL
    const ip = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]
      || request.headers.get('x-real-ip')
      || 'unknown';
    return ip.trim();
  }

  /**
   * Default rate limited response
   */
  private defaultRateLimitedResponse(info: RateLimitInfo): Response {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${info.retryAfter} seconds.`,
        limit: info.limit,
        remaining: info.remaining,
        reset: info.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Add rate limit headers to response
   */
  private addRateLimitHeaders(response: Response, info: RateLimitInfo): Response {
    const newResponse = new Response(response.body, response);
    const headers = this.getHeaders(info);
    for (const [key, value] of Object.entries(headers)) {
      newResponse.headers.set(key, value);
    }
    return newResponse;
  }
}

/**
 * Create rate limiter instance
 */
export function createRateLimiter(
  store: KVStore,
  config?: Partial<RateLimitConfig>
): EdgeRateLimiter {
  return new EdgeRateLimiter(store, config);
}

/**
 * Rate limit middleware factory
 */
export function rateLimit(
  store: KVStore,
  config?: Partial<RateLimitConfig>
): (request: Request) => Promise<Response | null> {
  const limiter = new EdgeRateLimiter(store, config);
  return (request: Request) => limiter.middleware(request);
}

/**
 * Tiered rate limiting
 */
export class TieredRateLimiter {
  private limiters: Map<string, EdgeRateLimiter> = new Map();
  private store: KVStore;
  private tiers: Map<string, RateLimitConfig> = new Map();
  private getTier: (request: Request) => string;

  constructor(
    store: KVStore,
    tiers: Record<string, Partial<RateLimitConfig>>,
    getTier: (request: Request) => string
  ) {
    this.store = store;
    this.getTier = getTier;

    for (const [name, config] of Object.entries(tiers)) {
      this.tiers.set(name, {
        limit: config.limit ?? 100,
        window: config.window ?? 60,
        algorithm: config.algorithm ?? 'sliding-window',
        ...(config.keyGenerator !== undefined ? { keyGenerator: config.keyGenerator } : {}),
        ...(config.skip !== undefined ? { skip: config.skip } : {}),
        ...(config.onRateLimited !== undefined ? { onRateLimited: config.onRateLimited } : {}),
        headers: config.headers ?? true,
      });
    }
  }

  /**
   * Check rate limit for request
   */
  async check(request: Request): Promise<RateLimitResult> {
    const tier = this.getTier(request);
    const config = this.tiers.get(tier);

    if (!config) {
      return {
        allowed: true,
        info: { limit: Infinity, remaining: Infinity, reset: 0 },
      };
    }

    let limiter = this.limiters.get(tier);
    if (!limiter) {
      limiter = new EdgeRateLimiter(this.store, config);
      this.limiters.set(tier, limiter);
    }

    return limiter.check(request);
  }

  /**
   * Middleware
   */
  async middleware(request: Request): Promise<Response | null> {
    const result = await this.check(request);
    if (!result.allowed) {
      const tier = this.getTier(request);
      const config = this.tiers.get(tier);
      if (config?.onRateLimited) {
        return config.onRateLimited(result.info);
      }
      return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 });
    }
    return null;
  }
}

/**
 * Create tiered rate limiter
 */
export function createTieredRateLimiter(
  store: KVStore,
  tiers: Record<string, Partial<RateLimitConfig>>,
  getTier: (request: Request) => string
): TieredRateLimiter {
  return new TieredRateLimiter(store, tiers, getTier);
}

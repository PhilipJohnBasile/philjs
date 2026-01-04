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
/**
 * Edge Rate Limiter
 */
export declare class EdgeRateLimiter {
    private config;
    private store;
    private localCache;
    constructor(store: KVStore, config?: Partial<RateLimitConfig>);
    /**
     * Check if request is allowed
     */
    check(request: Request): Promise<RateLimitResult>;
    /**
     * Rate limit middleware
     */
    middleware(request: Request): Promise<Response | null>;
    /**
     * Get rate limit headers for response
     */
    getHeaders(info: RateLimitInfo): Record<string, string>;
    /**
     * Token bucket algorithm
     */
    private tokenBucket;
    /**
     * Sliding window algorithm
     */
    private slidingWindow;
    /**
     * Fixed window algorithm
     */
    private fixedWindow;
    /**
     * Leaky bucket algorithm
     */
    private leakyBucket;
    /**
     * Get state from store
     */
    private getState;
    /**
     * Set state in store
     */
    private setState;
    /**
     * Default key generator
     */
    private defaultKeyGenerator;
    /**
     * Default rate limited response
     */
    private defaultRateLimitedResponse;
    /**
     * Add rate limit headers to response
     */
    private addRateLimitHeaders;
}
/**
 * Create rate limiter instance
 */
export declare function createRateLimiter(store: KVStore, config?: Partial<RateLimitConfig>): EdgeRateLimiter;
/**
 * Rate limit middleware factory
 */
export declare function rateLimit(store: KVStore, config?: Partial<RateLimitConfig>): (request: Request) => Promise<Response | null>;
/**
 * Tiered rate limiting
 */
export declare class TieredRateLimiter {
    private limiters;
    private store;
    private tiers;
    private getTier;
    constructor(store: KVStore, tiers: Record<string, Partial<RateLimitConfig>>, getTier: (request: Request) => string);
    /**
     * Check rate limit for request
     */
    check(request: Request): Promise<RateLimitResult>;
    /**
     * Middleware
     */
    middleware(request: Request): Promise<Response | null>;
}
/**
 * Create tiered rate limiter
 */
export declare function createTieredRateLimiter(store: KVStore, tiers: Record<string, Partial<RateLimitConfig>>, getTier: (request: Request) => string): TieredRateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map
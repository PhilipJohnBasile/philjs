/**
 * Rate Limiting for API Routes and Actions
 *
 * Provides:
 * - Token bucket algorithm for rate limiting
 * - Multiple storage backends (memory, Redis)
 * - Per-route and global limits
 * - Custom key extractors (IP, user ID, API key)
 * - Automatic 429 responses
 */
export type RateLimitConfig = {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (request: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    handler?: (request: Request) => Response;
    message?: string;
};
export type RateLimitInfo = {
    limit: number;
    remaining: number;
    reset: number;
};
export type RateLimitStore = {
    increment(key: string): Promise<{
        count: number;
        resetAt: number;
    }>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
    get(key: string): Promise<{
        count: number;
        resetAt: number;
    } | null>;
};
export declare class MemoryRateLimitStore implements RateLimitStore {
    private store;
    increment(key: string): Promise<{
        count: number;
        resetAt: number;
    }>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
    get(key: string): Promise<{
        count: number;
        resetAt: number;
    } | null>;
    size(): number;
}
export declare class RedisRateLimitStore implements RateLimitStore {
    private redisClient;
    private keyPrefix;
    constructor(redisClient: any, keyPrefix?: string);
    increment(key: string): Promise<{
        count: number;
        resetAt: number;
    }>;
    decrement(key: string): Promise<void>;
    reset(key: string): Promise<void>;
    get(key: string): Promise<{
        count: number;
        resetAt: number;
    } | null>;
}
export declare class RateLimiter {
    private store;
    private config;
    constructor(config: RateLimitConfig, store?: RateLimitStore);
    private defaultKeyGenerator;
    check(request: Request): Promise<Response | null>;
    consume(request: Request, success: boolean): Promise<void>;
    reset(request: Request): Promise<void>;
    getRateLimitInfo(request: Request): Promise<RateLimitInfo | null>;
}
export declare function rateLimit(config: RateLimitConfig, store?: RateLimitStore): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Create a rate limiter for API routes
 */
export declare function apiRateLimit(requestsPerMinute?: number, store?: RateLimitStore): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Create a rate limiter for authentication routes
 */
export declare function authRateLimit(attemptsPerMinute?: number, store?: RateLimitStore): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Create a rate limiter based on API key
 */
export declare function apiKeyRateLimit(requestsPerMinute?: number, store?: RateLimitStore): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Create a rate limiter based on user ID
 */
export declare function userRateLimit(requestsPerMinute: number | undefined, getUserId: (request: Request) => string | null, store?: RateLimitStore): (request: Request, next: () => Promise<Response>) => Promise<Response>;
export declare class SlidingWindowRateLimiter {
    private config;
    private store;
    constructor(config: RateLimitConfig);
    check(request: Request): Promise<Response | null>;
    private defaultKeyGenerator;
}
export type AdaptiveConfig = {
    baseLimit: number;
    windowMs: number;
    errorThreshold?: number;
    adaptationFactor?: number;
};
export declare class AdaptiveRateLimiter {
    private config;
    private limiter;
    private errorCount;
    private totalRequests;
    private currentLimit;
    constructor(config: AdaptiveConfig, store?: RateLimitStore);
    check(request: Request): Promise<Response | null>;
    recordResult(success: boolean): Promise<void>;
    private adapt;
    getCurrentLimit(): number;
}
//# sourceMappingURL=rate-limit.d.ts.map
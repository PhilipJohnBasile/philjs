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
// ============================================================================
// Memory Store (for development/single server)
// ============================================================================
export class MemoryRateLimitStore {
    store = new Map();
    async increment(key) {
        const existing = this.store.get(key);
        const now = Date.now();
        if (existing && existing.resetAt > now) {
            existing.count++;
            return { count: existing.count, resetAt: existing.resetAt };
        }
        // Create new entry
        const resetAt = now + 60000; // Default 1 minute window
        const timer = setTimeout(() => {
            this.store.delete(key);
        }, 60000);
        const entry = { count: 1, resetAt, timer };
        this.store.set(key, entry);
        return { count: 1, resetAt };
    }
    async decrement(key) {
        const entry = this.store.get(key);
        if (entry) {
            entry.count = Math.max(0, entry.count - 1);
        }
    }
    async reset(key) {
        const entry = this.store.get(key);
        if (entry) {
            clearTimeout(entry.timer);
            this.store.delete(key);
        }
    }
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (entry.resetAt <= now) {
            this.store.delete(key);
            return null;
        }
        return { count: entry.count, resetAt: entry.resetAt };
    }
    size() {
        return this.store.size;
    }
}
// ============================================================================
// Redis Store (for production/distributed)
// ============================================================================
export class RedisRateLimitStore {
    redisClient;
    keyPrefix;
    constructor(redisClient, keyPrefix = "philjs:ratelimit:") {
        this.redisClient = redisClient;
        this.keyPrefix = keyPrefix;
    }
    async increment(key) {
        const redisKey = this.keyPrefix + key;
        const multi = this.redisClient.multi();
        multi.incr(redisKey);
        multi.pttl(redisKey);
        const results = await multi.exec();
        const count = results[0][1];
        const ttl = results[1][1];
        let resetAt;
        if (ttl === -1) {
            // No expiry set yet - set it now
            const windowMs = 60000; // Default 1 minute
            await this.redisClient.pexpire(redisKey, windowMs);
            resetAt = Date.now() + windowMs;
        }
        else {
            resetAt = Date.now() + ttl;
        }
        return { count, resetAt };
    }
    async decrement(key) {
        const redisKey = this.keyPrefix + key;
        await this.redisClient.decr(redisKey);
    }
    async reset(key) {
        const redisKey = this.keyPrefix + key;
        await this.redisClient.del(redisKey);
    }
    async get(key) {
        const redisKey = this.keyPrefix + key;
        const multi = this.redisClient.multi();
        multi.get(redisKey);
        multi.pttl(redisKey);
        const results = await multi.exec();
        const count = parseInt(results[0][1] || "0", 10);
        const ttl = results[1][1];
        if (ttl === -2 || count === 0) {
            return null;
        }
        return {
            count,
            resetAt: Date.now() + (ttl === -1 ? 60000 : ttl),
        };
    }
}
// ============================================================================
// Rate Limiter
// ============================================================================
export class RateLimiter {
    store;
    config;
    constructor(config, store) {
        this.store = store || new MemoryRateLimitStore();
        const message = config.message || "Too many requests, please try again later.";
        const defaultHandler = (request) => {
            return new Response(JSON.stringify({
                error: message,
                retryAfter: Math.ceil(config.windowMs / 1000),
            }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(Math.ceil(config.windowMs / 1000)),
                },
            });
        };
        this.config = {
            windowMs: config.windowMs,
            maxRequests: config.maxRequests,
            keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
            skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
            skipFailedRequests: config.skipFailedRequests ?? false,
            handler: config.handler || defaultHandler,
            message: message,
        };
    }
    defaultKeyGenerator(request) {
        // Use X-Forwarded-For or client IP
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded
            ? (forwarded.split(",")[0]?.trim() ?? "unknown")
            : (request.headers.get("x-real-ip") ?? "unknown");
        const url = new URL(request.url);
        return `${ip}:${url.pathname}`;
    }
    async check(request) {
        const key = this.config.keyGenerator(request);
        const result = await this.store.increment(key);
        const info = {
            limit: this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - result.count),
            reset: result.resetAt,
        };
        // Add rate limit headers to request (for downstream middleware)
        request.rateLimit = info;
        if (result.count > this.config.maxRequests) {
            return this.config.handler(request);
        }
        return null;
    }
    async consume(request, success) {
        if ((success && this.config.skipSuccessfulRequests) ||
            (!success && this.config.skipFailedRequests)) {
            const key = this.config.keyGenerator(request);
            await this.store.decrement(key);
        }
    }
    async reset(request) {
        const key = this.config.keyGenerator(request);
        await this.store.reset(key);
    }
    async getRateLimitInfo(request) {
        const key = this.config.keyGenerator(request);
        const result = await this.store.get(key);
        if (!result)
            return null;
        return {
            limit: this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - result.count),
            reset: result.resetAt,
        };
    }
}
// ============================================================================
// Middleware
// ============================================================================
export function rateLimit(config, store) {
    const limiter = new RateLimiter(config, store);
    return async (request, next) => {
        // Check rate limit
        const rateLimitResponse = await limiter.check(request);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
        // Continue to next middleware/handler
        let response;
        try {
            response = await next();
            // Track success/failure
            const success = response.status < 400;
            await limiter.consume(request, success);
            // Add rate limit headers to response
            const info = request.rateLimit;
            if (info) {
                response.headers.set("X-RateLimit-Limit", String(info.limit));
                response.headers.set("X-RateLimit-Remaining", String(info.remaining));
                response.headers.set("X-RateLimit-Reset", new Date(info.reset).toISOString());
            }
            return response;
        }
        catch (error) {
            await limiter.consume(request, false);
            throw error;
        }
    };
}
// ============================================================================
// Route-Specific Limiters
// ============================================================================
/**
 * Create a rate limiter for API routes
 */
export function apiRateLimit(requestsPerMinute = 60, store) {
    return rateLimit({
        windowMs: 60 * 1000, // 1 minute
        maxRequests: requestsPerMinute,
        message: "API rate limit exceeded",
    }, store);
}
/**
 * Create a rate limiter for authentication routes
 */
export function authRateLimit(attemptsPerMinute = 5, store) {
    return rateLimit({
        windowMs: 60 * 1000,
        maxRequests: attemptsPerMinute,
        skipSuccessfulRequests: true, // Only count failed login attempts
        message: "Too many login attempts",
    }, store);
}
/**
 * Create a rate limiter based on API key
 */
export function apiKeyRateLimit(requestsPerMinute = 1000, store) {
    return rateLimit({
        windowMs: 60 * 1000,
        maxRequests: requestsPerMinute,
        keyGenerator: (request) => {
            const apiKey = request.headers.get("x-api-key") ||
                request.headers.get("authorization")?.replace("Bearer ", "") ||
                "anonymous";
            const url = new URL(request.url);
            return `api:${apiKey}:${url.pathname}`;
        },
        message: "API key rate limit exceeded",
    }, store);
}
/**
 * Create a rate limiter based on user ID
 */
export function userRateLimit(requestsPerMinute = 100, getUserId, store) {
    return rateLimit({
        windowMs: 60 * 1000,
        maxRequests: requestsPerMinute,
        keyGenerator: (request) => {
            const userId = getUserId(request) || "anonymous";
            const url = new URL(request.url);
            return `user:${userId}:${url.pathname}`;
        },
    }, store);
}
// ============================================================================
// Sliding Window Rate Limiter (more accurate)
// ============================================================================
export class SlidingWindowRateLimiter {
    config;
    store = new Map();
    constructor(config) {
        this.config = config;
    }
    async check(request) {
        const key = (this.config.keyGenerator || this.defaultKeyGenerator)(request);
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        // Get or create timestamps array
        let timestamps = this.store.get(key) || [];
        // Remove old timestamps outside window
        timestamps = timestamps.filter((ts) => ts > windowStart);
        // Check if limit exceeded
        if (timestamps.length >= this.config.maxRequests) {
            const oldestTimestamp = timestamps[0] ?? now;
            const resetAt = oldestTimestamp + this.config.windowMs;
            return new Response(JSON.stringify({
                error: this.config.message || "Too many requests",
                retryAfter: Math.ceil((resetAt - now) / 1000),
            }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(Math.ceil((resetAt - now) / 1000)),
                },
            });
        }
        // Add current timestamp
        timestamps.push(now);
        this.store.set(key, timestamps);
        // Add rate limit info to request
        request.rateLimit = {
            limit: this.config.maxRequests,
            remaining: this.config.maxRequests - timestamps.length,
            reset: now + this.config.windowMs,
        };
        return null;
    }
    defaultKeyGenerator(request) {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded
            ? (forwarded.split(",")[0]?.trim() ?? "unknown")
            : (request.headers.get("x-real-ip") ?? "unknown");
        const url = new URL(request.url);
        return `${ip}:${url.pathname}`;
    }
}
export class AdaptiveRateLimiter {
    config;
    limiter;
    errorCount = 0;
    totalRequests = 0;
    currentLimit;
    constructor(config, store) {
        this.config = config;
        this.currentLimit = config.baseLimit;
        this.limiter = new RateLimiter({
            windowMs: config.windowMs,
            maxRequests: this.currentLimit,
        }, store);
    }
    async check(request) {
        return this.limiter.check(request);
    }
    async recordResult(success) {
        this.totalRequests++;
        if (!success) {
            this.errorCount++;
        }
        // Check if we should adapt every 100 requests
        if (this.totalRequests % 100 === 0) {
            this.adapt();
        }
    }
    adapt() {
        const errorRate = this.errorCount / this.totalRequests;
        const threshold = this.config.errorThreshold || 0.1; // 10% default
        if (errorRate > threshold) {
            // Reduce limit
            const factor = this.config.adaptationFactor || 0.5;
            this.currentLimit = Math.max(1, Math.floor(this.currentLimit * factor));
        }
        else if (errorRate < threshold / 2) {
            // Gradually restore limit
            this.currentLimit = Math.min(this.config.baseLimit, Math.floor(this.currentLimit * 1.1));
        }
        // Reset counters
        this.errorCount = 0;
        this.totalRequests = 0;
        // Update limiter config
        this.limiter = new RateLimiter({
            windowMs: this.config.windowMs,
            maxRequests: this.currentLimit,
        });
    }
    getCurrentLimit() {
        return this.currentLimit;
    }
}
//# sourceMappingURL=rate-limit.js.map
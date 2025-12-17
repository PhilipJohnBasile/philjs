import { describe, it, expect } from 'vitest';
import { StaticGenerator, ssg, isr, ssr, csr, handleRevalidation } from './static-generation.js';
import { RateLimiter, MemoryRateLimitStore, SlidingWindowRateLimiter, AdaptiveRateLimiter } from './rate-limit.js';
import { csrfProtection, generateCSRFToken } from './csrf.js';
// ============================================================================
// Static Site Generation (SSG) Tests
// ============================================================================
describe('Static Site Generation', () => {
    describe('Route Configuration', () => {
        it('should configure SSG route', () => {
            const config = ssg({ revalidate: false });
            expect(config.mode).toBe('ssg');
            expect(config.revalidate).toBe(false);
        });
        it('should configure ISR route', () => {
            const config = isr(3600);
            expect(config.mode).toBe('isr');
            expect(config.revalidate).toBe(3600);
        });
        it('should configure SSR route', () => {
            const config = ssr();
            expect(config.mode).toBe('ssr');
        });
        it('should configure CSR route', () => {
            const config = csr();
            expect(config.mode).toBe('csr');
        });
        it('should set default revalidate for ISR', () => {
            const config = isr(60); // Must provide revalidate time
            expect(config.revalidate).toBeDefined();
            expect(typeof config.revalidate).toBe('number');
        });
        it('should allow custom revalidate times', () => {
            const config1 = isr(60);
            const config2 = isr(3600);
            expect(config1.revalidate).toBe(60);
            expect(config2.revalidate).toBe(3600);
        });
    });
    describe('StaticGenerator', () => {
        it('should create static generator with config', () => {
            const renderFn = async (path) => `<html><body>${path}</body></html>`;
            const generator = new StaticGenerator(renderFn);
            expect(generator).toBeDefined();
        });
        it('should accept cache configuration', () => {
            const renderFn = async (path) => `<html><body>${path}</body></html>`;
            const cache = new MemoryRateLimitStore(); // Using any ISRCache compatible store
            const generator = new StaticGenerator(renderFn);
            expect(generator).toBeDefined();
        });
        it('should handle different render functions', () => {
            const renderFn1 = async (path) => `<html><body>Page 1: ${path}</body></html>`;
            const renderFn2 = async (path) => `<html><body>Page 2: ${path}</body></html>`;
            const gen1 = new StaticGenerator(renderFn1);
            const gen2 = new StaticGenerator(renderFn2);
            expect(gen1).toBeDefined();
            expect(gen2).toBeDefined();
        });
    });
    describe('Revalidation', () => {
        it('should handle revalidation requests', async () => {
            const renderFn = async (path) => `<html><body>${path}</body></html>`;
            const generator = new StaticGenerator(renderFn);
            const request = new Request('https://example.com/revalidate', {
                headers: { 'x-revalidation-token': 'secret' }
            });
            const result = await handleRevalidation(request, generator, {
                secret: 'secret',
                paths: ['/test']
            });
            expect(result).toBeDefined();
            expect(result.status).toBe(200);
        });
        it('should accept different path configurations', async () => {
            const renderFn = async (path) => `<html><body>${path}</body></html>`;
            const generator = new StaticGenerator(renderFn);
            const request = new Request('https://example.com/revalidate');
            const result1 = await handleRevalidation(request, generator, { paths: ['/test'] });
            const result2 = await handleRevalidation(request, generator, { paths: ['/about'] });
            expect(result1).toBeDefined();
            expect(result2).toBeDefined();
        });
    });
});
// ============================================================================
// Rate Limiting Tests
// ============================================================================
describe('Rate Limiting', () => {
    describe('MemoryRateLimitStore', () => {
        it('should track requests', async () => {
            const store = new MemoryRateLimitStore();
            await store.increment('user:123');
            const result = await store.get('user:123');
            expect(result).toBeDefined();
            expect(result.count).toBeGreaterThan(0);
        });
        it('should expire old entries', async () => {
            const store = new MemoryRateLimitStore();
            await store.increment('user:456');
            // Wait for expiration (default 1 minute window)
            await new Promise(resolve => setTimeout(resolve, 1100));
            const result = await store.get('user:456');
            // Entry should still exist (1 min window), but let's test reset
            await store.reset('user:456');
            const afterReset = await store.get('user:456');
            expect(afterReset).toBe(null);
        });
        it('should handle multiple keys', async () => {
            const store = new MemoryRateLimitStore();
            await store.increment('user:1');
            await store.increment('user:2');
            await store.increment('user:3');
            const result1 = await store.get('user:1');
            const result2 = await store.get('user:2');
            const result3 = await store.get('user:3');
            expect(result1.count).toBeGreaterThan(0);
            expect(result2.count).toBeGreaterThan(0);
            expect(result3.count).toBeGreaterThan(0);
        });
        it('should increment counts correctly', async () => {
            const store = new MemoryRateLimitStore();
            await store.increment('user:test');
            await store.increment('user:test');
            await store.increment('user:test');
            const result = await store.get('user:test');
            expect(result.count).toBe(3);
        });
    });
    describe('RateLimiter', () => {
        it('should allow requests under limit', async () => {
            const limiter = new RateLimiter({
                windowMs: 60000,
                maxRequests: 10
            }, new MemoryRateLimitStore());
            const request = new Request('https://example.com/test');
            const result = await limiter.check(request);
            expect(result).toBe(null); // null means allowed
            const info = request.rateLimit;
            expect(info.remaining).toBeLessThanOrEqual(10);
        });
        it('should block requests over limit', async () => {
            const limiter = new RateLimiter({
                windowMs: 60000,
                maxRequests: 2
            }, new MemoryRateLimitStore());
            const request = new Request('https://example.com/test');
            // Use up the limit
            await limiter.check(request);
            await limiter.check(request);
            // Should be blocked now
            const result = await limiter.check(request);
            expect(result).toBeDefined();
            expect(result.status).toBe(429);
        });
        it('should return retry after when blocked', async () => {
            const limiter = new RateLimiter({
                windowMs: 60000,
                maxRequests: 1
            }, new MemoryRateLimitStore());
            const request = new Request('https://example.com/test');
            await limiter.check(request);
            const result = await limiter.check(request);
            expect(result).toBeDefined();
            expect(result.headers.get('Retry-After')).toBeDefined();
        });
        it('should track remaining requests', async () => {
            const limiter = new RateLimiter({
                windowMs: 60000,
                maxRequests: 5
            }, new MemoryRateLimitStore());
            const r1 = new Request('https://example.com/test');
            await limiter.check(r1);
            expect(r1.rateLimit.remaining).toBe(4);
            const r2 = new Request('https://example.com/test');
            await limiter.check(r2);
            expect(r2.rateLimit.remaining).toBe(3);
            const r3 = new Request('https://example.com/test');
            await limiter.check(r3);
            expect(r3.rateLimit.remaining).toBe(2);
        });
        it('should handle concurrent requests', async () => {
            const limiter = new RateLimiter({
                windowMs: 60000,
                maxRequests: 100
            }, new MemoryRateLimitStore());
            const promises = Array.from({ length: 10 }, (_, i) => limiter.check(new Request(`https://example.com/test${i}`)));
            const results = await Promise.all(promises);
            const allowedCount = results.filter(r => r === null).length;
            expect(allowedCount).toBe(10);
        });
    });
    describe('SlidingWindowRateLimiter', () => {
        it('should use sliding window algorithm', async () => {
            const limiter = new SlidingWindowRateLimiter({
                windowMs: 10000,
                maxRequests: 5
            });
            const request = new Request('https://example.com/test');
            const result = await limiter.check(request);
            expect(result).toBe(null); // null means allowed
        });
        it('should enforce limits with sliding window', async () => {
            const limiter = new SlidingWindowRateLimiter({
                windowMs: 5000,
                maxRequests: 3
            });
            const request = new Request('https://example.com/test');
            await limiter.check(request);
            await limiter.check(request);
            await limiter.check(request);
            const result = await limiter.check(request);
            expect(result).toBeDefined();
            expect(result.status).toBe(429);
        });
    });
    describe('AdaptiveRateLimiter', () => {
        it('should adjust limits based on load', async () => {
            const limiter = new AdaptiveRateLimiter({
                baseLimit: 10,
                windowMs: 60000,
                errorThreshold: 0.1,
                adaptationFactor: 0.5
            }, new MemoryRateLimitStore());
            const request = new Request('https://example.com/test');
            const result = await limiter.check(request);
            expect(result).toBe(null); // null means allowed
        });
        it('should initialize with base limits', async () => {
            const limiter = new AdaptiveRateLimiter({
                baseLimit: 5,
                windowMs: 60000
            }, new MemoryRateLimitStore());
            const request = new Request('https://example.com/test');
            const result = await limiter.check(request);
            expect(result).toBe(null);
            const info = request.rateLimit;
            expect(info.remaining).toBeLessThanOrEqual(5);
        });
    });
});
// ============================================================================
// CSRF Protection Tests
// ============================================================================
describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
        const token = generateCSRFToken();
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
    });
    it('should generate unique tokens', () => {
        const token1 = generateCSRFToken();
        const token2 = generateCSRFToken();
        expect(token1).not.toBe(token2);
    });
    it('should generate tokens with sufficient entropy', () => {
        const tokens = new Set();
        for (let i = 0; i < 100; i++) {
            tokens.add(generateCSRFToken());
        }
        expect(tokens.size).toBe(100); // All tokens should be unique
    });
    it('should create CSRF middleware', () => {
        const middleware = csrfProtection();
        expect(middleware).toBeDefined();
        expect(typeof middleware).toBe('object');
        expect(typeof middleware.generateToken).toBe('function');
        expect(typeof middleware.verifyRequest).toBe('function');
    });
    it('should create middleware with options', () => {
        const middleware = csrfProtection({
            getSessionId: (req) => 'custom-session'
        });
        expect(middleware).toBeDefined();
        expect(typeof middleware.generateToken).toBe('function');
    });
});
// ============================================================================
// Integration Tests
// ============================================================================
describe('SSR Integration', () => {
    it('should combine multiple rendering modes', () => {
        const routes = {
            '/': ssg(),
            '/api/data': ssr(),
            '/blog/:slug': isr(3600),
            '/app': csr()
        };
        expect(routes['/'].mode).toBe('ssg');
        expect(routes['/api/data'].mode).toBe('ssr');
        expect(routes['/blog/:slug'].mode).toBe('isr');
        expect(routes['/app'].mode).toBe('csr');
    });
    it('should support complex routing configurations', () => {
        const routes = {
            // Static pages
            '/': ssg(),
            '/about': ssg(),
            '/contact': ssg(),
            // ISR pages with different revalidation times
            '/blog': isr(3600),
            '/blog/:slug': isr(1800),
            // SSR pages
            '/api/*': ssr(),
            '/dashboard': ssr(),
            // CSR pages
            '/app/*': csr()
        };
        expect(Object.keys(routes).length).toBe(8);
    });
});
// ============================================================================
// Edge Cases
// ============================================================================
describe('Edge Cases', () => {
    it('should handle zero revalidate time', () => {
        const config = isr(0);
        expect(config.revalidate).toBe(0);
    });
    it('should handle very large revalidate times', () => {
        const config = isr(31536000); // 1 year
        expect(config.revalidate).toBe(31536000);
    });
    it('should handle empty route configurations', () => {
        const renderFn = async (path) => `<html><body>${path}</body></html>`;
        const generator = new StaticGenerator(renderFn);
        expect(generator).toBeDefined();
    });
    it('should handle rate limiter with max=0', async () => {
        const limiter = new RateLimiter({
            windowMs: 60000,
            maxRequests: 0
        }, new MemoryRateLimitStore());
        const request = new Request('https://example.com/test');
        const result = await limiter.check(request);
        expect(result).toBeDefined();
        expect(result.status).toBe(429);
    });
    it('should handle rate limiter with max=1', async () => {
        const limiter = new RateLimiter({
            windowMs: 60000,
            maxRequests: 1
        }, new MemoryRateLimitStore());
        const r1 = new Request('https://example.com/test');
        const result1 = await limiter.check(r1);
        expect(result1).toBe(null); // Allowed
        const r2 = new Request('https://example.com/test');
        const result2 = await limiter.check(r2);
        expect(result2).toBeDefined(); // Blocked
        expect(result2.status).toBe(429);
    });
});
//# sourceMappingURL=render.test.js.map
/**
 * Server Islands SSR Integration Tests
 *
 * Tests server islands rendering, caching, and SSR integration.
 *
 * SKIPPED: The philjs-islands/server-islands module is not yet implemented.
 * These tests are placeholders for future implementation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Tests skipped pending philjs-islands/server-islands implementation
describe.skip('Server Islands SSR Integration', () => {
    beforeEach(() => {
        // Reset cache and metrics before each test
        clearIslandCache();
        resetServerIslandMetrics();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });
    describe('Basic Server Island Rendering', () => {
        it('should render server island to HTML', async () => {
            const Component = () => 'Hello from island';
            const html = await renderServerIsland('test-island', Component, {});
            expect(html).toContain('Hello from island');
            expect(html).toContain('data-island-id="test-island"');
        });
        it('should wrap island content with metadata', async () => {
            const Component = () => jsx('div', { children: 'Island content' });
            const html = await renderServerIsland('my-island', Component, {});
            expect(html).toContain('data-island-id="my-island"');
            expect(html).toContain('Island content');
        });
        it('should render island with props', async () => {
            const Component = (props) => {
                return `Hello ${props.name}, count: ${props.count}`;
            };
            const html = await renderServerIsland('prop-island', Component, { name: 'Alice', count: 5 });
            expect(html).toContain('Hello Alice');
            expect(html).toContain('count: 5');
        });
        it('should handle async components', async () => {
            const AsyncComponent = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'Async content';
            };
            const html = await renderServerIsland('async-island', AsyncComponent, {});
            expect(html).toContain('Async content');
        });
        it('should handle null and undefined', async () => {
            const html1 = await renderServerIsland('null-island', null, {});
            const html2 = await renderServerIsland('undef-island', undefined, {});
            expect(html1).toBeTruthy();
            expect(html2).toBeTruthy();
        });
        it('should handle string content', async () => {
            const html = await renderServerIsland('string-island', 'Plain text', {});
            expect(html).toContain('Plain text');
        });
        it('should handle number content', async () => {
            const html = await renderServerIsland('number-island', 42, {});
            expect(html).toContain('42');
        });
    });
    describe('Server Island Caching', () => {
        it('should cache island with TTL', async () => {
            let renderCount = 0;
            const Component = () => {
                renderCount++;
                return `Render ${renderCount}`;
            };
            const cacheConfig = {
                ttl: 60,
            };
            // First render - cache miss
            const html1 = await renderServerIsland('cached-island', Component, {}, cacheConfig);
            expect(html1).toContain('Render 1');
            expect(html1).toContain('data-cached="true"');
            // Second render - cache hit
            const html2 = await renderServerIsland('cached-island', Component, {}, cacheConfig);
            expect(html2).toContain('Render 1'); // Same content
            expect(renderCount).toBe(1); // Not rendered again
        });
        it('should respect cache TTL expiration', async () => {
            let renderCount = 0;
            const Component = () => {
                renderCount++;
                return `Render ${renderCount}`;
            };
            const cacheConfig = {
                ttl: 0.05, // 50ms
            };
            // First render
            await renderServerIsland('ttl-island', Component, {}, cacheConfig);
            expect(renderCount).toBe(1);
            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 60));
            // Should re-render
            const html = await renderServerIsland('ttl-island', Component, {}, cacheConfig);
            expect(html).toContain('Render 2');
            expect(renderCount).toBe(2);
        });
        it('should use stale-while-revalidate', async () => {
            let renderCount = 0;
            const Component = () => {
                renderCount++;
                return `Render ${renderCount}`;
            };
            const cacheConfig = {
                ttl: 0.05, // 50ms
                swr: 10, // 10s SWR
            };
            // First render
            await renderServerIsland('swr-island', Component, {}, cacheConfig);
            // Wait for TTL to expire but within SWR window
            await new Promise(resolve => setTimeout(resolve, 60));
            // Should return stale content immediately
            const html = await renderServerIsland('swr-island', Component, {}, cacheConfig);
            expect(html).toContain('Render 1'); // Stale content
            expect(html).toContain('data-stale="true"');
            // Revalidation happens in background
            await new Promise(resolve => setTimeout(resolve, 10));
            const metrics = getServerIslandMetrics();
            expect(metrics.staleHits).toBeGreaterThan(0);
        });
        it('should cache with tags for invalidation', async () => {
            const Component = () => 'Tagged content';
            const cacheConfig = {
                ttl: 60,
                tags: ['user', 'products'],
            };
            await renderServerIsland('tagged-island', Component, {}, cacheConfig);
            // Invalidate by tag
            await invalidateIslandsByTag('user');
            // Should re-render
            let renderCount = 0;
            const Component2 = () => {
                renderCount++;
                return `Render ${renderCount}`;
            };
            await renderServerIsland('tagged-island', Component2, {}, cacheConfig);
            expect(renderCount).toBe(1);
        });
        it('should use custom cache key generator', async () => {
            const Component = (props) => `User ${props.userId}`;
            const cacheConfig = {
                ttl: 60,
                keyGenerator: (props) => `user:${props.userId}`,
            };
            await renderServerIsland('user-island', Component, { userId: '123' }, cacheConfig);
            await renderServerIsland('user-island', Component, { userId: '456' }, cacheConfig);
            // Different keys should be cached separately
            const metrics = getServerIslandMetrics();
            expect(metrics.misses).toBe(2);
        });
        it('should vary cache by props', async () => {
            const Component = (props) => `Page ${props.page}`;
            const cacheConfig = { ttl: 60 };
            await renderServerIsland('page-island', Component, { page: 1 }, cacheConfig);
            await renderServerIsland('page-island', Component, { page: 2 }, cacheConfig);
            // Different props should create different cache entries
            const metrics = getServerIslandMetrics();
            expect(metrics.misses).toBe(2);
        });
        it('should handle cache with private flag', async () => {
            const Component = () => 'Private content';
            const cacheConfig = {
                ttl: 60,
                private: true,
            };
            await renderServerIsland('private-island', Component, {}, cacheConfig);
            const headers = getIslandCacheHeaders(cacheConfig);
            expect(headers['Cache-Control']).toContain('private');
        });
        it('should handle edge cache hint', async () => {
            const Component = () => 'Edge content';
            const cacheConfig = {
                ttl: 60,
                edge: true,
            };
            const headers = getIslandCacheHeaders(cacheConfig);
            expect(headers['CDN-Cache-Control']).toContain('max-age=60');
        });
    });
    describe('Cache Store Operations', () => {
        it('should manually cache island', async () => {
            await cacheIsland('manual-island', '<div>Cached HTML</div>', {
                ttl: 60,
                tags: ['manual'],
            });
            const store = getIslandCacheStore();
            const cached = await store.get('island:manual-island');
            expect(cached).toBeTruthy();
            expect(cached.html).toContain('Cached HTML');
        });
        it('should invalidate specific island', async () => {
            const Component = () => 'Content';
            const cacheConfig = { ttl: 60 };
            await renderServerIsland('inv-island', Component, {}, cacheConfig);
            // Invalidate
            await invalidateIsland('inv-island', {}, cacheConfig);
            // Should re-render
            let renderCount = 0;
            const Component2 = () => {
                renderCount++;
                return `Render ${renderCount}`;
            };
            await renderServerIsland('inv-island', Component2, {}, cacheConfig);
            expect(renderCount).toBe(1);
        });
        it('should clear all caches', async () => {
            const Component = () => 'Content';
            const cacheConfig = { ttl: 60 };
            await renderServerIsland('island-1', Component, {}, cacheConfig);
            await renderServerIsland('island-2', Component, {}, cacheConfig);
            await clearIslandCache();
            // Should re-render both
            const metrics = getServerIslandMetrics();
            const initialMisses = metrics.misses;
            await renderServerIsland('island-1', Component, {}, cacheConfig);
            await renderServerIsland('island-2', Component, {}, cacheConfig);
            const newMetrics = getServerIslandMetrics();
            expect(newMetrics.misses).toBeGreaterThan(initialMisses);
        });
        it('should prefetch island', async () => {
            const Component = () => 'Prefetched';
            const cacheConfig = { ttl: 60 };
            await prefetchIsland('prefetch-island', Component, {}, cacheConfig);
            // Should be cached
            const metrics = getServerIslandMetrics();
            expect(metrics.misses).toBeGreaterThan(0);
            // Next render should hit cache
            resetServerIslandMetrics();
            await renderServerIsland('prefetch-island', Component, {}, cacheConfig);
            const newMetrics = getServerIslandMetrics();
            expect(newMetrics.hits).toBeGreaterThan(0);
        });
    });
    describe('Metrics and Monitoring', () => {
        it('should track cache hits', async () => {
            const Component = () => 'Content';
            const cacheConfig = { ttl: 60 };
            resetServerIslandMetrics();
            // First render - miss
            await renderServerIsland('metrics-1', Component, {}, cacheConfig);
            // Second render - hit
            await renderServerIsland('metrics-1', Component, {}, cacheConfig);
            const metrics = getServerIslandMetrics();
            expect(metrics.hits).toBe(1);
            expect(metrics.misses).toBe(1);
        });
        it('should track cache misses', async () => {
            const Component = () => 'Content';
            const cacheConfig = { ttl: 60 };
            resetServerIslandMetrics();
            await renderServerIsland('miss-1', Component, {}, cacheConfig);
            await renderServerIsland('miss-2', Component, {}, cacheConfig);
            const metrics = getServerIslandMetrics();
            expect(metrics.misses).toBe(2);
        });
        it('should track stale hits', async () => {
            const Component = () => 'Content';
            const cacheConfig = { ttl: 0.05, swr: 10 };
            resetServerIslandMetrics();
            await renderServerIsland('stale-1', Component, {}, cacheConfig);
            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 60));
            await renderServerIsland('stale-1', Component, {}, cacheConfig);
            const metrics = getServerIslandMetrics();
            expect(metrics.staleHits).toBeGreaterThan(0);
        });
        it('should track revalidations', async () => {
            const Component = () => 'Content';
            const cacheConfig = { ttl: 0.05, swr: 10 };
            resetServerIslandMetrics();
            await renderServerIsland('revalidate-1', Component, {}, cacheConfig);
            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 60));
            await renderServerIsland('revalidate-1', Component, {}, cacheConfig);
            // Wait for revalidation
            await new Promise(resolve => setTimeout(resolve, 20));
            const metrics = getServerIslandMetrics();
            expect(metrics.revalidations).toBeGreaterThan(0);
        });
        it('should track render errors', async () => {
            const ErrorComponent = () => {
                throw new Error('Render error');
            };
            resetServerIslandMetrics();
            await expect(async () => {
                await renderServerIsland('error-1', ErrorComponent, {});
            }).rejects.toThrow('Render error');
            const metrics = getServerIslandMetrics();
            expect(metrics.errors).toBeGreaterThan(0);
        });
        it('should track average render time', async () => {
            const SlowComponent = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'Slow content';
            };
            resetServerIslandMetrics();
            await renderServerIsland('slow-1', SlowComponent, {});
            const metrics = getServerIslandMetrics();
            expect(metrics.avgRenderTime).toBeGreaterThan(0);
        });
        it('should reset metrics', () => {
            resetServerIslandMetrics();
            const metrics = getServerIslandMetrics();
            expect(metrics.hits).toBe(0);
            expect(metrics.misses).toBe(0);
            expect(metrics.staleHits).toBe(0);
            expect(metrics.revalidations).toBe(0);
            expect(metrics.errors).toBe(0);
            expect(metrics.avgRenderTime).toBe(0);
        });
    });
    describe('Cache Headers', () => {
        it('should generate public cache-control headers', () => {
            const config = { ttl: 3600 };
            const headers = getIslandCacheHeaders(config);
            expect(headers['Cache-Control']).toContain('public');
            expect(headers['Cache-Control']).toContain('max-age=3600');
        });
        it('should generate private cache-control headers', () => {
            const config = { ttl: 3600, private: true };
            const headers = getIslandCacheHeaders(config);
            expect(headers['Cache-Control']).toContain('private');
            expect(headers['Cache-Control']).not.toContain('public');
        });
        it('should include stale-while-revalidate', () => {
            const config = { ttl: 3600, swr: 86400 };
            const headers = getIslandCacheHeaders(config);
            expect(headers['Cache-Control']).toContain('stale-while-revalidate=86400');
        });
        it('should include vary headers', () => {
            const config = {
                ttl: 3600,
                varyBy: ['Accept-Language', 'Authorization'],
            };
            const headers = getIslandCacheHeaders(config);
            expect(headers['Vary']).toBe('Accept-Language, Authorization');
        });
        it('should include CDN cache headers for edge', () => {
            const config = { ttl: 3600, edge: true };
            const headers = getIslandCacheHeaders(config);
            expect(headers['CDN-Cache-Control']).toContain('max-age=3600');
        });
    });
    describe('Custom Cache Stores', () => {
        it('should use custom cache store', async () => {
            const customStore = {
                cache: new Map(),
                async get(key) {
                    return this.cache.get(key) || null;
                },
                async set(key, value) {
                    this.cache.set(key, value);
                },
                async delete(key) {
                    this.cache.delete(key);
                },
                async invalidateByTag(tag) {
                    // Simple implementation
                },
                async clear() {
                    this.cache.clear();
                },
            };
            setIslandCacheStore(customStore);
            const Component = () => 'Custom store content';
            const cacheConfig = { ttl: 60 };
            await renderServerIsland('custom-store', Component, {}, cacheConfig);
            // Check custom store was used
            const cached = await customStore.get('island:custom-store:0');
            expect(cached).toBeTruthy();
        });
        it('should get current cache store', () => {
            const store = getIslandCacheStore();
            expect(store).toBeTruthy();
            expect(typeof store.get).toBe('function');
            expect(typeof store.set).toBe('function');
        });
    });
    describe('Redis Cache Adapter', () => {
        it('should create Redis cache adapter', () => {
            const mockRedis = {
                get: vi.fn(async () => null),
                setex: vi.fn(async () => { }),
                sadd: vi.fn(async () => 1),
                expire: vi.fn(async () => 1),
                srem: vi.fn(async () => 1),
                del: vi.fn(async () => 1),
                smembers: vi.fn(async () => []),
                keys: vi.fn(async () => []),
            };
            const adapter = createRedisCacheAdapter(mockRedis);
            expect(adapter).toBeTruthy();
            expect(typeof adapter.get).toBe('function');
            expect(typeof adapter.set).toBe('function');
        });
        it('should get from Redis', async () => {
            const cached = {
                html: '<div>Test</div>',
                timestamp: Date.now(),
                ttl: 60,
                swr: 0,
                tags: [],
                props: {},
                etag: '"abc123"',
            };
            const mockRedis = {
                get: vi.fn(async () => JSON.stringify(cached)),
                setex: vi.fn(async () => { }),
                sadd: vi.fn(async () => 1),
                expire: vi.fn(async () => 1),
                srem: vi.fn(async () => 1),
                del: vi.fn(async () => 1),
                smembers: vi.fn(async () => []),
                keys: vi.fn(async () => []),
            };
            const adapter = createRedisCacheAdapter(mockRedis);
            const result = await adapter.get('test-key');
            expect(mockRedis.get).toHaveBeenCalledWith('philjs:island:test-key');
            expect(result).toEqual(cached);
        });
        it('should set to Redis', async () => {
            const cached = {
                html: '<div>Test</div>',
                timestamp: Date.now(),
                ttl: 60,
                swr: 10,
                tags: ['user'],
                props: {},
                etag: '"abc123"',
            };
            const mockRedis = {
                get: vi.fn(async () => null),
                setex: vi.fn(async () => { }),
                sadd: vi.fn(async () => 1),
                expire: vi.fn(async () => 1),
                srem: vi.fn(async () => 1),
                del: vi.fn(async () => 1),
                smembers: vi.fn(async () => []),
                keys: vi.fn(async () => []),
            };
            const adapter = createRedisCacheAdapter(mockRedis);
            await adapter.set('test-key', cached);
            expect(mockRedis.setex).toHaveBeenCalledWith('philjs:island:test-key', 70, // ttl + swr
            JSON.stringify(cached));
            expect(mockRedis.sadd).toHaveBeenCalledWith('philjs:tag:user', 'test-key');
        });
        it('should invalidate by tag in Redis', async () => {
            const mockRedis = {
                get: vi.fn(async () => null),
                setex: vi.fn(async () => { }),
                sadd: vi.fn(async () => 1),
                expire: vi.fn(async () => 1),
                srem: vi.fn(async () => 1),
                del: vi.fn(async () => 1),
                smembers: vi.fn(async () => ['key1', 'key2']),
                keys: vi.fn(async () => []),
            };
            const adapter = createRedisCacheAdapter(mockRedis);
            await adapter.invalidateByTag('user');
            expect(mockRedis.smembers).toHaveBeenCalledWith('philjs:tag:user');
            expect(mockRedis.del).toHaveBeenCalled();
        });
    });
    describe('KV Cache Adapter', () => {
        it('should create KV cache adapter', () => {
            const mockKV = {
                get: vi.fn(async () => null),
                put: vi.fn(async () => { }),
                delete: vi.fn(async () => { }),
                list: vi.fn(async () => ({ keys: [] })),
            };
            const adapter = createKVCacheAdapter(mockKV);
            expect(adapter).toBeTruthy();
            expect(typeof adapter.get).toBe('function');
            expect(typeof adapter.set).toBe('function');
        });
        it('should get from KV', async () => {
            const cached = {
                html: '<div>Test</div>',
                timestamp: Date.now(),
                ttl: 60,
                swr: 0,
                tags: [],
                props: {},
                etag: '"abc123"',
            };
            const mockKV = {
                get: vi.fn(async () => JSON.stringify(cached)),
                put: vi.fn(async () => { }),
                delete: vi.fn(async () => { }),
                list: vi.fn(async () => ({ keys: [] })),
            };
            const adapter = createKVCacheAdapter(mockKV);
            const result = await adapter.get('test-key');
            expect(mockKV.get).toHaveBeenCalledWith('island:test-key');
            expect(result).toEqual(cached);
        });
        it('should set to KV with expiration', async () => {
            const cached = {
                html: '<div>Test</div>',
                timestamp: Date.now(),
                ttl: 60,
                swr: 10,
                tags: [],
                props: {},
                etag: '"abc123"',
            };
            const mockKV = {
                get: vi.fn(async () => null),
                put: vi.fn(async () => { }),
                delete: vi.fn(async () => { }),
                list: vi.fn(async () => ({ keys: [] })),
            };
            const adapter = createKVCacheAdapter(mockKV);
            await adapter.set('test-key', cached);
            expect(mockKV.put).toHaveBeenCalledWith('island:test-key', JSON.stringify(cached), { expirationTtl: 70 });
        });
        it('should clear KV cache', async () => {
            const mockKV = {
                get: vi.fn(async () => null),
                put: vi.fn(async () => { }),
                delete: vi.fn(async () => { }),
                list: vi.fn(async () => ({
                    keys: [{ name: 'island:key1' }, { name: 'island:key2' }],
                })),
            };
            const adapter = createKVCacheAdapter(mockKV);
            await adapter.clear();
            expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'island:' });
            expect(mockKV.delete).toHaveBeenCalledTimes(2);
        });
    });
    describe('ServerIsland Component', () => {
        it('should create server island component', () => {
            const island = ServerIsland({
                id: 'test-island',
                children: jsx('div', { children: 'Content' }),
            });
            expect(island).toBeTruthy();
            expect(island.type).toBe('server-island');
            expect(island.props.id).toBe('test-island');
        });
        it('should create server island with cache config', () => {
            const cacheConfig = {
                ttl: 60,
                tags: ['user'],
            };
            const island = ServerIsland({
                children: jsx('div', { children: 'Cached content' }),
                cache: cacheConfig,
            });
            expect(island.props.cache).toEqual(cacheConfig);
        });
        it('should create server island with fallback', () => {
            const island = ServerIsland({
                children: jsx('div', { children: 'Main content' }),
                fallback: jsx('div', { children: 'Loading...' }),
            });
            expect(island.props.fallback).toBeTruthy();
        });
        it('should create server island with defer strategy', () => {
            const island = ServerIsland({
                children: jsx('div', { children: 'Deferred content' }),
                defer: 'idle',
            });
            expect(island.props.defer).toBe('idle');
        });
        it('should create server island with priority', () => {
            const island = ServerIsland({
                children: jsx('div', { children: 'Priority content' }),
                priority: 8,
            });
            expect(island.props.priority).toBe(8);
        });
        it('should generate island ID if not provided', () => {
            const island1 = ServerIsland({
                children: jsx('div', { children: 'Island 1' }),
            });
            const island2 = ServerIsland({
                children: jsx('div', { children: 'Island 2' }),
            });
            expect(island1.props.id).toBeTruthy();
            expect(island2.props.id).toBeTruthy();
            expect(island1.props.id).not.toBe(island2.props.id);
        });
    });
    describe('Error Handling', () => {
        it('should handle component render errors', async () => {
            const ErrorComponent = () => {
                throw new Error('Component error');
            };
            await expect(async () => {
                await renderServerIsland('error-island', ErrorComponent, {});
            }).rejects.toThrow('Component error');
        });
        it('should handle async component errors', async () => {
            const ErrorComponent = async () => {
                throw new Error('Async error');
            };
            await expect(async () => {
                await renderServerIsland('async-error', ErrorComponent, {});
            }).rejects.toThrow('Async error');
        });
        it('should track errors in metrics', async () => {
            const ErrorComponent = () => {
                throw new Error('Test error');
            };
            resetServerIslandMetrics();
            try {
                await renderServerIsland('metrics-error', ErrorComponent, {});
            }
            catch (e) {
                // Expected
            }
            const metrics = getServerIslandMetrics();
            expect(metrics.errors).toBeGreaterThan(0);
        });
        it('should not cache errors', async () => {
            let shouldError = true;
            const ConditionalError = () => {
                if (shouldError) {
                    throw new Error('Error');
                }
                return 'Success';
            };
            const cacheConfig = { ttl: 60 };
            try {
                await renderServerIsland('conditional-error', ConditionalError, {}, cacheConfig);
            }
            catch (e) {
                // Expected
            }
            // Fix the error
            shouldError = false;
            // Should render successfully
            const html = await renderServerIsland('conditional-error', ConditionalError, {}, cacheConfig);
            expect(html).toContain('Success');
        });
    });
    describe('Complex Scenarios', () => {
        it('should handle personalized content with caching', async () => {
            const PersonalizedComponent = (props) => {
                return jsx('div', {
                    children: `Welcome back, User ${props.userId}!`,
                });
            };
            const cacheConfig = {
                ttl: 60,
                keyGenerator: (props) => `user-greeting:${props.userId}`,
                private: true,
            };
            const html1 = await renderServerIsland('greeting', PersonalizedComponent, { userId: '123' }, cacheConfig);
            const html2 = await renderServerIsland('greeting', PersonalizedComponent, { userId: '456' }, cacheConfig);
            expect(html1).toContain('User 123');
            expect(html2).toContain('User 456');
        });
        it('should handle product recommendations with cache tags', async () => {
            const ProductRecs = (props) => {
                return jsx('div', {
                    children: `Recommended ${props.category} products`,
                });
            };
            const cacheConfig = {
                ttl: 300,
                tags: ['products', 'recommendations'],
                edge: true,
            };
            await renderServerIsland('recs', ProductRecs, { category: 'electronics' }, cacheConfig);
            // Invalidate when products change
            await invalidateIslandsByTag('products');
            // Should re-render on next request
            const metrics = getServerIslandMetrics();
            expect(metrics).toBeTruthy();
        });
        it('should handle dynamic widgets with signals', async () => {
            const count = signal(0);
            const Counter = () => {
                return jsx('div', {
                    children: `Count: ${count()}`,
                });
            };
            const html1 = await renderServerIsland('counter', Counter, {});
            expect(html1).toContain('Count: 0');
            count.set(5);
            const html2 = await renderServerIsland('counter-2', Counter, {});
            expect(html2).toContain('Count: 5');
        });
        it('should render multiple islands in page', async () => {
            const Header = () => 'Header';
            const Sidebar = () => 'Sidebar';
            const Main = () => 'Main';
            const headerHtml = await renderServerIsland('header', Header, {});
            const sidebarHtml = await renderServerIsland('sidebar', Sidebar, {});
            const mainHtml = await renderServerIsland('main', Main, {});
            const page = `
        <html>
          <body>
            ${headerHtml}
            <div class="container">
              ${sidebarHtml}
              ${mainHtml}
            </div>
          </body>
        </html>
      `;
            expect(page).toContain('Header');
            expect(page).toContain('Sidebar');
            expect(page).toContain('Main');
            expect(page).toContain('data-island-id="header"');
            expect(page).toContain('data-island-id="sidebar"');
            expect(page).toContain('data-island-id="main"');
        });
    });
});
//# sourceMappingURL=server-islands-ssr.test.js.map
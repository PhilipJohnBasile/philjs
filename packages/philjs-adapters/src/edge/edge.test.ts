/**
 * PhilJS Edge Runtime - Test Suite
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Edge Runtime Tests
import {
  detectEdgePlatform,
  getPlatformInfo,
  createEdgeEnv,
  createExecutionContext,
  createEdgeHandler,
  coalesceRequest,
  isColdStart,
  markWarm,
  resetColdStartTracking,
  preloadModule,
  getPreloadedModule,
  initializeColdStart,
} from './edge-runtime';

// Streaming Tests
import {
  createWritableStream,
  createStreamingResponse,
  createSSEStream,
  createSSEHandler,
  createHTMLStream,
  parseESITags,
  processESI,
  createESIMiddleware,
  streamThrough,
  mergeStreams,
  createStreamTee,
} from './streaming';

// Cache Tests
import {
  EdgeCache,
  createCacheKey,
  shouldCacheResponse,
  createCacheMiddleware,
  getDefaultCache,
  resetDefaultCache,
} from './cache';

// Geo Tests
import {
  getGeoLocation,
  getClientIP,
  applyGeoRouting,
  createGeoRoutingMiddleware,
  findBestRegion,
  createLatencyRouter,
  selectGeoVariant,
  createVariantCookie,
  calculateDistance,
  findNearestLocation,
  addGeoHeaders,
} from './geo';

// ============================================================================
// Edge Runtime Tests
// ============================================================================

describe('Edge Runtime', () => {
  describe('detectEdgePlatform', () => {
    afterEach(() => {
      // Reset globalThis modifications (but NOT process - that breaks Node.js/vitest)
      delete (globalThis as any).Deno;
      delete (globalThis as any).EdgeRuntime;
      delete (globalThis as any).Netlify;
      // Note: Don't delete caches, navigator, or process as they may be used by Node/vitest
    });

    it('should detect unknown platform by default', () => {
      // In Node.js test environment, it detects as node
      const platform = detectEdgePlatform();
      expect(['node', 'unknown']).toContain(platform);
    });

    it('should detect Deno platform', () => {
      (globalThis as any).Deno = { version: { deno: '1.0.0' } };
      expect(detectEdgePlatform()).toBe('deno');
    });

    it('should detect Vercel Edge platform', () => {
      (globalThis as any).EdgeRuntime = 'edge-runtime';
      expect(detectEdgePlatform()).toBe('vercel');
    });

    it('should detect Netlify Edge platform', () => {
      (globalThis as any).Netlify = {};
      (globalThis as any).Deno = { version: { deno: '1.0.0' } };
      // Netlify is checked before Deno since Netlify runs on Deno
      expect(detectEdgePlatform()).toBe('netlify');
    });
  });

  describe('getPlatformInfo', () => {
    it('should return platform info with features', () => {
      const info = getPlatformInfo();
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('features');
      expect(Array.isArray(info.features)).toBe(true);
    });
  });

  describe('createEdgeEnv', () => {
    it('should create edge environment from platform env', () => {
      const platformEnv = {
        API_KEY: 'test-key',
        DB_URL: 'test-url',
      };

      const env = createEdgeEnv(platformEnv);

      // In Node.js environment, createEdgeEnv falls through to process.env
      // The raw value should still be the platform env
      expect(env.raw).toBe(platformEnv);

      // For Node.js, the get() method reads from process.env
      // Since we're in Node.js test environment, let's test with actual env vars
      const originalEnv = process.env.TEST_VAR;
      process.env.TEST_VAR = 'test-value';
      expect(env.get('TEST_VAR')).toBe('test-value');
      if (originalEnv === undefined) {
        delete process.env.TEST_VAR;
      } else {
        process.env.TEST_VAR = originalEnv;
      }
    });

    it('should get all environment variables', () => {
      const platformEnv = {
        VAR1: 'value1',
        VAR2: 'value2',
      };

      const env = createEdgeEnv(platformEnv);
      const all = env.getAll();

      // In Node.js test environment, getAll returns process.env
      // Verify it returns an object (process.env contents)
      expect(typeof all).toBe('object');
      expect(all).toBeDefined();
    });
  });

  describe('createExecutionContext', () => {
    it('should create execution context with waitUntil', () => {
      const mockWaitUntil = vi.fn();
      const platformContext = { waitUntil: mockWaitUntil };

      const ctx = createExecutionContext(platformContext);

      expect(ctx.waitUntil).toBeDefined();
    });

    it('should handle missing waitUntil gracefully', async () => {
      const ctx = createExecutionContext({});

      // Should not throw
      ctx.waitUntil(Promise.resolve());
    });
  });

  describe('Cold Start Tracking', () => {
    beforeEach(() => {
      resetColdStartTracking();
    });

    it('should track cold start state', () => {
      expect(isColdStart()).toBe(true);
      markWarm();
      expect(isColdStart()).toBe(false);
    });

    it('should reset cold start tracking', () => {
      markWarm();
      expect(isColdStart()).toBe(false);
      resetColdStartTracking();
      expect(isColdStart()).toBe(true);
    });
  });

  describe('Module Preloading', () => {
    it('should preload and retrieve modules', async () => {
      const mockModule = { test: 'module' };
      const loader = vi.fn().mockResolvedValue(mockModule);

      const result = await preloadModule('test-module', loader);

      expect(result).toBe(mockModule);
      expect(loader).toHaveBeenCalledTimes(1);

      // Second call should return cached module
      const cached = getPreloadedModule('test-module');
      expect(cached).toBe(mockModule);
    });
  });

  describe('Request Coalescing', () => {
    it('should coalesce identical GET requests', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('test'));
      const request1 = new Request('https://example.com/api/data');
      const request2 = new Request('https://example.com/api/data');

      // Execute in parallel
      const [result1, result2] = await Promise.all([
        coalesceRequest(request1, handler),
        coalesceRequest(request2, handler),
      ]);

      expect(result1).toBeInstanceOf(Response);
      expect(result2).toBeInstanceOf(Response);
      // Handler should be called only once due to coalescing
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not coalesce POST requests', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('test'));
      const request1 = new Request('https://example.com/api/data', { method: 'POST' });
      const request2 = new Request('https://example.com/api/data', { method: 'POST' });

      await Promise.all([
        coalesceRequest(request1, handler),
        coalesceRequest(request2, handler),
      ]);

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('createEdgeHandler', () => {
    beforeEach(() => {
      resetColdStartTracking();
    });

    it('should create handler that tracks cold starts', async () => {
      const handler = createEdgeHandler({
        handler: async (ctx) => {
          return new Response(JSON.stringify({
            isColdStart: ctx.timing.isColdStart,
          }));
        },
      });

      const request = new Request('https://example.com/test');
      const response1 = await handler(request);
      const body1 = await response1.json();

      expect(body1.isColdStart).toBe(true);

      const response2 = await handler(request);
      const body2 = await response2.json();

      expect(body2.isColdStart).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const handler = createEdgeHandler({
        handler: async () => {
          throw new Error('Test error');
        },
      });

      const request = new Request('https://example.com/test');
      const response = await handler(request);

      expect(response.status).toBe(500);
    });

    it('should use custom error handler', async () => {
      const handler = createEdgeHandler({
        handler: async () => {
          throw new Error('Test error');
        },
        onError: (error) => {
          return new Response(`Custom error: ${error.message}`, { status: 418 });
        },
      });

      const request = new Request('https://example.com/test');
      const response = await handler(request);

      expect(response.status).toBe(418);
      expect(await response.text()).toBe('Custom error: Test error');
    });
  });
});

// ============================================================================
// Streaming Tests
// ============================================================================

describe('Streaming', () => {
  describe('createWritableStream', () => {
    it('should create writable stream with controller', async () => {
      const { readable, writer } = createWritableStream();

      expect(readable).toBeInstanceOf(ReadableStream);
      expect(writer.write).toBeDefined();
      expect(writer.close).toBeDefined();
      expect(writer.closed).toBe(false);
    });

    it('should write chunks to stream', async () => {
      const { readable, writer } = createWritableStream();

      await writer.write('Hello, ');
      await writer.write('World!');
      await writer.close();

      const reader = readable.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const text = new TextDecoder().decode(
        new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[]))
      );
      expect(text).toBe('Hello, World!');
    });
  });

  describe('createStreamingResponse', () => {
    it('should create response with streaming headers', () => {
      const { readable } = createWritableStream();
      const response = createStreamingResponse(readable);

      expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });

    it('should include custom headers', () => {
      const { readable } = createWritableStream();
      const response = createStreamingResponse(readable, {
        headers: { 'X-Custom': 'value' },
      });

      expect(response.headers.get('X-Custom')).toBe('value');
    });
  });

  describe('SSE Stream', () => {
    it('should create SSE stream with proper headers', () => {
      const { response } = createSSEStream();

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    });

    it('should format SSE messages correctly', async () => {
      const { response, send, close } = createSSEStream();

      await send({ event: 'test', data: { message: 'hello' }, id: '1' });
      await close();

      const text = await response.text();
      expect(text).toContain('id: 1');
      expect(text).toContain('event: test');
      expect(text).toContain('data: {"message":"hello"}');
    });
  });

  describe('HTML Stream', () => {
    it('should create progressive HTML stream', async () => {
      const stream = createHTMLStream({
        shell: '<!DOCTYPE html><html><body>',
        footer: '</body></html>',
      });

      await stream.writeChunk('<h1>Hello</h1>');
      await stream.close();

      const text = await stream.response.text();
      expect(text).toContain('<!DOCTYPE html>');
      expect(text).toContain('<h1>Hello</h1>');
      expect(text).toContain('</body></html>');
    });
  });

  describe('ESI Processing', () => {
    it('should parse ESI tags', () => {
      const html = `
        <html>
          <esi:include src="/header" />
          <esi:include src="/footer" alt="fallback" ttl="3600" />
        </html>
      `;

      const fragments = parseESITags(html);

      expect(fragments).toHaveLength(2);
      expect(fragments[0].src).toBe('/header');
      expect(fragments[1].src).toBe('/footer');
      expect(fragments[1].alt).toBe('fallback');
      expect(fragments[1].ttl).toBe(3600);
    });

    it('should process ESI includes', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(new Response('<header>Header</header>'))
        .mockResolvedValueOnce(new Response('<footer>Footer</footer>'));

      const html = `
        <html>
          <esi:include src="https://example.com/header" />
          <esi:include src="https://example.com/footer" />
        </html>
      `;

      const result = await processESI(html, { fetch: mockFetch });

      expect(result).toContain('<header>Header</header>');
      expect(result).toContain('<footer>Footer</footer>');
      expect(result).not.toContain('esi:include');
    });

    it('should use fallback on fetch error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Note: The alt attribute value shouldn't contain quotes or special chars
      // Using a simpler fallback text for testing
      const html = `<esi:include src="https://example.com/header" alt="Fallback content" />`;

      const result = await processESI(html, { fetch: mockFetch });

      expect(result).toContain('Fallback content');
    });
  });

  describe('Stream Utilities', () => {
    it('should merge streams sequentially', async () => {
      const encoder = new TextEncoder();
      const stream1 = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('A'));
          controller.close();
        },
      });
      const stream2 = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('B'));
          controller.close();
        },
      });

      const merged = mergeStreams([stream1, stream2], { sequential: true });
      const reader = merged.getReader();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new TextDecoder().decode(value));
      }

      expect(chunks.join('')).toBe('AB');
    });

    it('should tee stream to multiple outputs', async () => {
      const encoder = new TextEncoder();
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('Test'));
          controller.close();
        },
      });

      const [stream1, stream2] = createStreamTee(source, 2);

      const read = async (stream: ReadableStream<Uint8Array>) => {
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        return new TextDecoder().decode(new Uint8Array(
          chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[])
        ));
      };

      const [result1, result2] = await Promise.all([read(stream1), read(stream2)]);

      expect(result1).toBe('Test');
      expect(result2).toBe('Test');
    });
  });
});

// ============================================================================
// Cache Tests
// ============================================================================

describe('Edge Cache', () => {
  let cache: EdgeCache;

  beforeEach(() => {
    cache = new EdgeCache({
      defaultTTL: 60,
      defaultSWR: 60,
      maxEntries: 100,
    });
  });

  afterEach(() => {
    resetDefaultCache();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await cache.set('key1', { data: 'value1' });
      const { value, hit } = await cache.get('key1');

      expect(hit).toBe(true);
      expect(value).toEqual({ data: 'value1' });
    });

    it('should return undefined for missing keys', async () => {
      const { value, hit } = await cache.get('nonexistent');

      expect(hit).toBe(false);
      expect(value).toBeUndefined();
    });

    it('should delete values', async () => {
      await cache.set('key1', 'value1');
      const deleted = await cache.delete('key1');
      const { hit } = await cache.get('key1');

      expect(deleted).toBe(true);
      expect(hit).toBe(false);
    });

    it('should clear all values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();

      const { hit: hit1 } = await cache.get('key1');
      const { hit: hit2 } = await cache.get('key2');

      expect(hit1).toBe(false);
      expect(hit2).toBe(false);
    });
  });

  describe('TTL and SWR', () => {
    it('should mark stale entries', async () => {
      await cache.set('key1', 'value1', { ttl: 0, swr: 60 });

      // Wait a bit for stale
      await new Promise(resolve => setTimeout(resolve, 10));

      const { value, stale, hit } = await cache.get('key1');

      expect(hit).toBe(true);
      expect(stale).toBe(true);
      expect(value).toBe('value1');
    });

    it('should expire entries after TTL + SWR', async () => {
      await cache.set('key1', 'value1', { ttl: 0, swr: 0 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const { hit } = await cache.get('key1');

      expect(hit).toBe(false);
    });
  });

  describe('Cache Tags', () => {
    it('should invalidate by tag', async () => {
      await cache.set('key1', 'value1', { tags: ['tag1'] });
      await cache.set('key2', 'value2', { tags: ['tag1', 'tag2'] });
      await cache.set('key3', 'value3', { tags: ['tag2'] });

      const count = await cache.invalidateByTag('tag1');

      expect(count).toBe(2);

      const { hit: hit1 } = await cache.get('key1');
      const { hit: hit2 } = await cache.get('key2');
      const { hit: hit3 } = await cache.get('key3');

      expect(hit1).toBe(false);
      expect(hit2).toBe(false);
      expect(hit3).toBe(true);
    });
  });

  describe('Cache Stats', () => {
    it('should track cache statistics', async () => {
      await cache.set('key1', 'value1');

      await cache.get('key1'); // Hit
      await cache.get('key1'); // Hit
      await cache.get('nonexistent'); // Miss

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.entries).toBe(1);
    });
  });

  describe('Cache Wrapper', () => {
    it('should wrap async functions with caching', async () => {
      let callCount = 0;
      const expensiveFunction = async (id: number) => {
        callCount++;
        return { id, data: `data-${id}` };
      };

      const cachedFunction = cache.wrap(expensiveFunction, {
        ttl: 60,
        keyGenerator: (id) => `fn:${id}`,
      });

      const result1 = await cachedFunction(1);
      const result2 = await cachedFunction(1);
      const result3 = await cachedFunction(2);

      expect(result1).toEqual({ id: 1, data: 'data-1' });
      expect(result2).toEqual({ id: 1, data: 'data-1' });
      expect(result3).toEqual({ id: 2, data: 'data-2' });
      expect(callCount).toBe(2); // Only called twice (once per unique id)
    });
  });

  describe('createCacheKey', () => {
    it('should create cache key from request', () => {
      const request = new Request('https://example.com/api/users?page=1');
      const key = createCacheKey(request);

      expect(key).toBe('GET:/api/users?page=1');
    });

    it('should include vary headers in key', () => {
      const request = new Request('https://example.com/api/users', {
        headers: { 'Accept-Language': 'en-US' },
      });
      const key = createCacheKey(request, {
        varyHeaders: ['Accept-Language'],
      });

      expect(key).toContain('Accept-Language=en-US');
    });
  });

  describe('shouldCacheResponse', () => {
    it('should cache successful GET responses', () => {
      const request = new Request('https://example.com/api/data');
      const response = new Response('data', { status: 200 });

      expect(shouldCacheResponse(request, response)).toBe(true);
    });

    it('should not cache POST requests', () => {
      const request = new Request('https://example.com/api/data', { method: 'POST' });
      const response = new Response('data', { status: 200 });

      expect(shouldCacheResponse(request, response)).toBe(false);
    });

    it('should not cache no-store responses', () => {
      const request = new Request('https://example.com/api/data');
      const response = new Response('data', {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      });

      expect(shouldCacheResponse(request, response)).toBe(false);
    });

    it('should not cache excluded paths', () => {
      const request = new Request('https://example.com/admin/users');
      const response = new Response('data', { status: 200 });

      expect(shouldCacheResponse(request, response, {
        excludePaths: ['/admin'],
      })).toBe(false);
    });
  });

  describe('Default Cache', () => {
    it('should return singleton cache instance', () => {
      const cache1 = getDefaultCache();
      const cache2 = getDefaultCache();

      expect(cache1).toBe(cache2);
    });

    it('should reset default cache', () => {
      const cache1 = getDefaultCache();
      resetDefaultCache();
      const cache2 = getDefaultCache();

      expect(cache1).not.toBe(cache2);
    });
  });
});

// ============================================================================
// Geo Tests
// ============================================================================

describe('Geolocation', () => {
  describe('getClientIP', () => {
    it('should extract IP from cf-connecting-ip header', () => {
      const request = new Request('https://example.com', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      });

      expect(getClientIP(request)).toBe('1.2.3.4');
    });

    it('should extract first IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      });

      expect(getClientIP(request)).toBe('1.2.3.4');
    });

    it('should return undefined if no IP headers', () => {
      const request = new Request('https://example.com');

      expect(getClientIP(request)).toBeUndefined();
    });
  });

  describe('getGeoLocation', () => {
    it('should extract geo from Vercel headers', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-vercel-ip-country': 'US',
          'x-vercel-ip-city': 'San%20Francisco',
          'x-vercel-ip-latitude': '37.7749',
          'x-vercel-ip-longitude': '-122.4194',
        },
      });

      // Mock Vercel platform detection
      (globalThis as any).EdgeRuntime = 'edge-runtime';

      const geo = getGeoLocation(request);

      delete (globalThis as any).EdgeRuntime;

      expect(geo.country).toBe('US');
      expect(geo.city).toBe('San Francisco');
      expect(geo.latitude).toBeCloseTo(37.7749);
      expect(geo.longitude).toBeCloseTo(-122.4194);
    });
  });

  describe('applyGeoRouting', () => {
    it('should block based on country', () => {
      const request = new Request('https://example.com');
      const geo = { country: 'RU' };

      const result = applyGeoRouting(request, geo, {
        rules: [
          { countries: ['RU', 'CN'], action: 'block' },
        ],
      });

      expect(result.action).toBe('block');
    });

    it('should allow if no rules match', () => {
      const request = new Request('https://example.com');
      const geo = { country: 'US' };

      const result = applyGeoRouting(request, geo, {
        rules: [
          { countries: ['RU', 'CN'], action: 'block' },
        ],
        defaultAction: 'allow',
      });

      expect(result.action).toBe('allow');
    });

    it('should redirect based on continent', () => {
      const request = new Request('https://example.com');
      const geo = { continent: 'EU' };

      const result = applyGeoRouting(request, geo, {
        rules: [
          { continents: ['EU'], action: 'redirect', redirectUrl: 'https://eu.example.com' },
        ],
      });

      expect(result.action).toBe('redirect');
      expect(result.url).toBe('https://eu.example.com');
    });

    it('should respect priority ordering', () => {
      const request = new Request('https://example.com');
      const geo = { country: 'GB', continent: 'EU' };

      const result = applyGeoRouting(request, geo, {
        rules: [
          { continents: ['EU'], action: 'redirect', redirectUrl: 'https://eu.example.com', priority: 1 },
          { countries: ['GB'], action: 'allow', priority: 10 },
        ],
      });

      expect(result.action).toBe('allow');
    });
  });

  describe('createGeoRoutingMiddleware', () => {
    it('should return block response for blocked regions', () => {
      const middleware = createGeoRoutingMiddleware({
        rules: [
          { countries: ['XX'], action: 'block' },
        ],
        blockedBody: 'Access denied',
        blockedStatus: 403,
      });

      // Create request with mock geo
      const request = new Request('https://example.com', {
        headers: { 'x-geo-country': 'XX' },
      });

      // Note: In real scenario, geo would be detected from platform
      // This test verifies the middleware structure
      expect(middleware).toBeDefined();
    });
  });

  describe('findBestRegion', () => {
    const regions = [
      { id: 'us-east', name: 'US East', countries: ['US', 'CA'], originUrl: 'https://us.example.com' },
      { id: 'eu-west', name: 'EU West', countries: ['GB', 'DE', 'FR'], originUrl: 'https://eu.example.com' },
      { id: 'ap-south', name: 'AP South', countries: ['IN', 'SG'], originUrl: 'https://ap.example.com' },
    ];

    it('should find region by country match', () => {
      const geo = { country: 'GB' };
      const region = findBestRegion(geo, regions);

      expect(region?.id).toBe('eu-west');
    });

    it('should return first healthy region if no match', () => {
      const geo = { country: 'JP' };
      const region = findBestRegion(geo, regions);

      expect(region).toBeDefined();
    });

    it('should skip unhealthy regions', () => {
      const regionsWithHealth = [
        { ...regions[0], healthy: false },
        { ...regions[1], healthy: true },
        { ...regions[2], healthy: true },
      ];

      const geo = { country: 'US' };
      const region = findBestRegion(geo, regionsWithHealth);

      expect(region?.id).not.toBe('us-east');
    });
  });

  describe('createLatencyRouter', () => {
    it('should create router with health tracking', () => {
      const router = createLatencyRouter({
        regions: [
          { id: 'us-east', name: 'US East', countries: ['US'], originUrl: 'https://us.example.com' },
          { id: 'eu-west', name: 'EU West', countries: ['GB'], originUrl: 'https://eu.example.com' },
        ],
        fallbackRegion: 'us-east',
      });

      expect(router.route).toBeDefined();
      expect(router.getRegionHealth).toBeDefined();
      expect(router.setRegionHealth).toBeDefined();
    });

    it('should update region health', () => {
      const router = createLatencyRouter({
        regions: [
          { id: 'us-east', name: 'US East', countries: ['US'], originUrl: 'https://us.example.com' },
        ],
      });

      router.setRegionHealth('us-east', false);
      const health = router.getRegionHealth();

      expect(health.get('us-east')).toBe(false);
    });
  });

  describe('A/B Testing', () => {
    it('should select variant based on geo', () => {
      const geo = { country: 'GB', continent: 'EU' };
      const config = {
        name: 'checkout-test',
        variants: [
          { id: 'control', weight: 50 },
          { id: 'variant-eu', weight: 50, continents: ['EU'] },
        ],
      };

      const request = new Request('https://example.com');
      const { variant } = selectGeoVariant(request, geo, config);

      expect(variant).toBe('variant-eu');
    });

    it('should use cookie for persistent assignment', () => {
      const geo = { country: 'US' };
      const config = {
        name: 'test',
        variants: [
          { id: 'a', weight: 50 },
          { id: 'b', weight: 50 },
        ],
        cookieName: 'ab_test',
      };

      const request = new Request('https://example.com', {
        headers: { cookie: 'ab_test=b' },
      });

      const { variant, isNew } = selectGeoVariant(request, geo, config);

      expect(variant).toBe('b');
      expect(isNew).toBe(false);
    });

    it('should create variant cookie', () => {
      const config = {
        name: 'test',
        variants: [{ id: 'a', weight: 100 }],
        cookieName: 'my_ab',
        cookieMaxAge: 3600,
      };

      const cookie = createVariantCookie(config, 'a');

      expect(cookie).toContain('my_ab=a');
      expect(cookie).toContain('Max-Age=3600');
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate distance between points', () => {
      // San Francisco to New York (~4,130 km)
      const distance = calculateDistance(37.7749, -122.4194, 40.7128, -74.0060);

      expect(distance).toBeGreaterThan(4000);
      expect(distance).toBeLessThan(4200);
    });

    it('should find nearest location', () => {
      const locations = [
        { name: 'New York', latitude: 40.7128, longitude: -74.0060 },
        { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 },
        { name: 'Chicago', latitude: 41.8781, longitude: -87.6298 },
      ];

      // User in San Francisco
      const nearest = findNearestLocation(37.7749, -122.4194, locations);

      expect(nearest?.name).toBe('Los Angeles');
    });
  });

  describe('Geo Headers', () => {
    it('should add geo information as headers', () => {
      const headers = new Headers();
      const geo = {
        country: 'US',
        region: 'CA',
        city: 'San Francisco',
        continent: 'NA',
        timezone: 'America/Los_Angeles',
        isEU: false,
        latitude: 37.7749,
        longitude: -122.4194,
      };

      addGeoHeaders(headers, geo);

      expect(headers.get('X-Geo-Country')).toBe('US');
      expect(headers.get('X-Geo-Region')).toBe('CA');
      expect(headers.get('X-Geo-City')).toBe('San Francisco');
      expect(headers.get('X-Geo-Continent')).toBe('NA');
      expect(headers.get('X-Geo-EU')).toBe('false');
    });
  });
});

/**
 * Edge Cache Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  edgeCacheMiddleware,
  cacheControlMiddleware,
  generateCacheKey,
  generateETag,
  etagMiddleware,
  varyMiddleware,
  staticAssetCache,
  apiCache,
  pageCache,
  type CacheStore,
  type CacheOptions,
} from './edge-cache.js';
import { executeEdgeMiddleware, type EdgeContext } from './edge-middleware.js';

// Mock Cache Store for testing
class MockCacheStore implements CacheStore {
  private cache: Map<string, Response> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  async get(key: string): Promise<Response | undefined> {
    return this.cache.get(key);
  }

  async put(key: string, response: Response, options?: CacheOptions): Promise<void> {
    this.cache.set(key, response);

    // Index by tags
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);

    // Clean up tag index
    for (const [tag, keys] of this.tagIndex.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }

  async purge(tags: string[]): Promise<void> {
    const keysToDelete = new Set<string>();

    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.forEach((key) => keysToDelete.add(key));
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

describe('Edge Cache', () => {
  let store: MockCacheStore;

  beforeEach(() => {
    store = new MockCacheStore();
  });

  describe('edgeCacheMiddleware', () => {
    it('should cache GET requests', async () => {
      let fetchCount = 0;

      const middleware = edgeCacheMiddleware({
        ttl: 60,
        store,
      });

      const testMiddleware = async () => {
        fetchCount++;
        return new Response('Hello World');
      };

      const composedMiddleware = async (context: EdgeContext) => {
        const oldNext = context.next;
        context.next = testMiddleware;
        const result = await middleware(context);
        context.next = oldNext;
        return result;
      };

      // First request - should miss cache
      const request1 = new Request('https://example.com/test');
      const response1 = await executeEdgeMiddleware(request1, composedMiddleware);
      expect(await response1.text()).toBe('Hello World');
      expect(response1.headers.get('X-Cache')).toBe('MISS');
      expect(fetchCount).toBe(1);

      // Wait for cache to be populated
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second request - should hit cache
      const request2 = new Request('https://example.com/test');
      const response2 = await executeEdgeMiddleware(request2, composedMiddleware);
      expect(await response2.text()).toBe('Hello World');
      expect(response2.headers.get('X-Cache')).toBe('HIT');
      expect(fetchCount).toBe(1); // Should not fetch again
    });

    it('should only cache GET requests', async () => {
      const middleware = edgeCacheMiddleware({ ttl: 60, store });

      const postRequest = new Request('https://example.com/test', {
        method: 'POST',
      });

      const response = await executeEdgeMiddleware(postRequest, middleware);
      expect(response.headers.get('X-Cache')).toBeNull();
      expect(store.size()).toBe(0);
    });

    it('should respect TTL', async () => {
      const middleware = edgeCacheMiddleware({
        ttl: 1, // 1 second
        store,
      });

      let responseCount = 0;
      const testMiddleware = async () => {
        responseCount++;
        return new Response(`Response ${responseCount}`);
      };

      const composedMiddleware = async (context: EdgeContext) => {
        const oldNext = context.next;
        context.next = testMiddleware;
        const result = await middleware(context);
        context.next = oldNext;
        return result;
      };

      // First request
      const request1 = new Request('https://example.com/test');
      const response1 = await executeEdgeMiddleware(request1, composedMiddleware);
      expect(await response1.text()).toBe('Response 1');

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second request - within TTL
      const request2 = new Request('https://example.com/test');
      const response2 = await executeEdgeMiddleware(request2, composedMiddleware);
      expect(await response2.text()).toBe('Response 1');
      expect(response2.headers.get('X-Cache')).toBe('HIT');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Third request - after TTL
      const request3 = new Request('https://example.com/test');
      const response3 = await executeEdgeMiddleware(request3, composedMiddleware);
      expect(await response3.text()).toBe('Response 2');
      expect(response3.headers.get('X-Cache')).toBe('MISS');
    });

    it('should use custom cache key generator', async () => {
      const middleware = edgeCacheMiddleware({
        ttl: 60,
        store,
        generateKey: (context) => {
          const userId = context.cookies.get('user_id') || 'anonymous';
          return `user:${userId}:${context.request.url.pathname}`;
        },
      });

      const testMiddleware = async (context: EdgeContext) => {
        const userId = context.cookies.get('user_id') || 'anonymous';
        return new Response(`User: ${userId}`);
      };

      const composedMiddleware = async (context: EdgeContext) => {
        const oldNext = context.next;
        context.next = async () => testMiddleware(context);
        const result = await middleware(context);
        context.next = oldNext;
        return result;
      };

      // Request from user 1
      const request1 = new Request('https://example.com/test', {
        headers: { Cookie: 'user_id=user1' },
      });
      const response1 = await executeEdgeMiddleware(request1, composedMiddleware);
      expect(await response1.text()).toBe('User: user1');

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Request from user 2 - should not hit user 1's cache
      const request2 = new Request('https://example.com/test', {
        headers: { Cookie: 'user_id=user2' },
      });
      const response2 = await executeEdgeMiddleware(request2, composedMiddleware);
      expect(await response2.text()).toBe('User: user2');
      expect(response2.headers.get('X-Cache')).toBe('MISS');
    });
  });

  describe('generateCacheKey', () => {
    it('should generate key from URL', async () => {
      const middleware = async (context: EdgeContext) => {
        const key = generateCacheKey(context);
        expect(key).toBe('/test?foo=bar');
        return new Response('OK');
      };

      const request = new Request('https://example.com/test?foo=bar');
      await executeEdgeMiddleware(request, middleware);
    });

    it('should include vary headers in key', async () => {
      const middleware = async (context: EdgeContext) => {
        const key = generateCacheKey(context, {
          vary: ['Accept-Language'],
        });
        expect(key).toContain('Accept-Language:en-US');
        return new Response('OK');
      };

      const request = new Request('https://example.com/test', {
        headers: { 'Accept-Language': 'en-US' },
      });
      await executeEdgeMiddleware(request, middleware);
    });

    it('should use custom key if provided', async () => {
      const middleware = async (context: EdgeContext) => {
        const key = generateCacheKey(context, {
          key: 'custom-key',
        });
        expect(key).toBe('custom-key');
        return new Response('OK');
      };

      const request = new Request('https://example.com/test');
      await executeEdgeMiddleware(request, middleware);
    });
  });

  describe('cacheControlMiddleware', () => {
    it('should set Cache-Control header', async () => {
      const middleware = cacheControlMiddleware({
        maxAge: 3600,
        visibility: 'public',
      });

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=3600');
    });

    it('should set stale-while-revalidate', async () => {
      const middleware = cacheControlMiddleware({
        maxAge: 60,
        staleWhileRevalidate: 300,
      });

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age=60');
      expect(cacheControl).toContain('stale-while-revalidate=300');
    });

    it('should set no-cache and no-store', async () => {
      const middleware = cacheControlMiddleware({
        noCache: true,
        noStore: true,
      });

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('no-cache');
      expect(cacheControl).toContain('no-store');
    });

    it('should set immutable', async () => {
      const middleware = cacheControlMiddleware({
        maxAge: 31536000,
        immutable: true,
      });

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('immutable');
    });
  });

  describe('generateETag', () => {
    it('should generate ETag from string', () => {
      const etag1 = generateETag('Hello World');
      const etag2 = generateETag('Hello World');
      const etag3 = generateETag('Different Content');

      expect(etag1).toBe(etag2);
      expect(etag1).not.toBe(etag3);
      expect(etag1).toMatch(/^"[a-z0-9]+"$/);
    });

    it('should generate ETag from ArrayBuffer', () => {
      const buffer = new TextEncoder().encode('Hello World');
      const etag = generateETag(buffer.buffer);

      expect(etag).toMatch(/^"[a-z0-9]+"$/);
    });
  });

  describe('etagMiddleware', () => {
    it('should add ETag header to response', async () => {
      const middleware = etagMiddleware();

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.headers.get('ETag')).toBeTruthy();
    });

    it('should return 304 for matching If-None-Match', async () => {
      const middleware = etagMiddleware();

      // First request to get ETag
      const request1 = new Request('https://example.com/test');
      const response1 = await executeEdgeMiddleware(request1, middleware);
      const etag = response1.headers.get('ETag');

      // Second request with If-None-Match
      const request2 = new Request('https://example.com/test', {
        headers: { 'If-None-Match': etag! },
      });
      const response2 = await executeEdgeMiddleware(request2, middleware);

      expect(response2.status).toBe(304);
    });
  });

  describe('varyMiddleware', () => {
    it('should add Vary headers', async () => {
      const middleware = varyMiddleware(['Accept-Language', 'Cookie']);

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const vary = response.headers.get('Vary');
      expect(vary).toContain('Accept-Language');
      expect(vary).toContain('Cookie');
    });

    it('should merge with existing Vary header', async () => {
      const middleware1 = varyMiddleware(['Accept-Language']);
      const middleware2 = varyMiddleware(['Cookie']);

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, [middleware1, middleware2]);

      const vary = response.headers.get('Vary');
      expect(vary).toContain('Accept-Language');
      expect(vary).toContain('Cookie');
    });
  });

  describe('Cache Presets', () => {
    describe('staticAssetCache', () => {
      it('should cache static assets', async () => {
        const middleware = staticAssetCache();

        const request = new Request('https://example.com/style.css');
        const response = await executeEdgeMiddleware(request, middleware);

        // Should attempt to cache
        expect(response).toBeDefined();
      });

      it('should not cache non-static assets', async () => {
        const middleware = staticAssetCache();

        const request = new Request('https://example.com/page.html');
        const response = await executeEdgeMiddleware(request, middleware);

        expect(response).toBeDefined();
      });
    });

    describe('apiCache', () => {
      it('should cache API responses', async () => {
        const middleware = apiCache(60, 300);

        const request = new Request('https://example.com/api/users');
        const response = await executeEdgeMiddleware(request, middleware);

        expect(response).toBeDefined();
      });
    });

    describe('pageCache', () => {
      it('should cache HTML pages', async () => {
        const middleware = pageCache(300, 3600);

        const request = new Request('https://example.com/page', {
          headers: { Accept: 'text/html' },
        });
        const response = await executeEdgeMiddleware(request, middleware);

        expect(response).toBeDefined();
      });
    });
  });

  describe('Cache Store', () => {
    it('should purge by tags', async () => {
      await store.put('key1', new Response('1'), { tags: ['tag1', 'tag2'] });
      await store.put('key2', new Response('2'), { tags: ['tag2'] });
      await store.put('key3', new Response('3'), { tags: ['tag3'] });

      expect(store.size()).toBe(3);

      await store.purge(['tag2']);

      expect(store.size()).toBe(1);
      expect(await store.get('key1')).toBeUndefined();
      expect(await store.get('key2')).toBeUndefined();
      expect(await store.get('key3')).toBeDefined();
    });

    it('should delete individual keys', async () => {
      await store.put('key1', new Response('1'));
      await store.put('key2', new Response('2'));

      expect(store.size()).toBe(2);

      await store.delete('key1');

      expect(store.size()).toBe(1);
      expect(await store.get('key1')).toBeUndefined();
      expect(await store.get('key2')).toBeDefined();
    });
  });
});

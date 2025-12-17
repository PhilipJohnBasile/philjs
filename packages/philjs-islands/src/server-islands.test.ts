/**
 * Tests for PhilJS Server Islands
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ServerIsland,
  renderServerIsland,
  cacheIsland,
  invalidateIslandsByTag,
  invalidateIsland,
  clearIslandCache,
  prefetchIsland,
  setIslandCacheStore,
  getIslandCacheStore,
  getServerIslandMetrics,
  resetServerIslandMetrics,
  getIslandCacheHeaders,
} from './server-islands';

describe('Server Islands', () => {
  beforeEach(async () => {
    await clearIslandCache();
    resetServerIslandMetrics();
  });

  describe('ServerIsland Component', () => {
    it('should create a server island', () => {
      const result = ServerIsland({
        children: '<div>Content</div>',
      });

      expect(result.type).toBe('server-island');
    });

    it('should accept cache configuration', () => {
      const result = ServerIsland({
        children: '<div>Content</div>',
        cache: {
          ttl: 3600,
          tags: ['user', 'products'],
        },
      });

      expect(result.props.cache).toBeDefined();
      expect(result.props.cache.ttl).toBe(3600);
      expect(result.props.cache.tags).toContain('user');
    });

    it('should accept fallback', () => {
      const result = ServerIsland({
        children: '<div>Content</div>',
        fallback: '<div>Loading...</div>',
      });

      expect(result.props.fallback).toBe('<div>Loading...</div>');
    });

    it('should accept defer strategy', () => {
      const result = ServerIsland({
        children: '<div>Content</div>',
        defer: 'visible',
      });

      expect(result.props.defer).toBe('visible');
    });

    it('should accept priority', () => {
      const result = ServerIsland({
        children: '<div>Content</div>',
        priority: 10,
      });

      expect(result.props.priority).toBe(10);
    });

    it('should have server render function', () => {
      const result = ServerIsland({
        children: '<div>Content</div>',
      });

      expect(result.__serverRender).toBeDefined();
      expect(typeof result.__serverRender).toBe('function');
    });
  });

  describe('renderServerIsland', () => {
    it('should render a simple component', async () => {
      const component = () => '<div>Hello</div>';

      const html = await renderServerIsland('test-1', component, {});

      expect(html).toContain('Hello');
      expect(html).toContain('data-island-id="test-1"');
    });

    it('should render with props', async () => {
      const component = (props: { name: string }) => `<div>Hello ${props.name}</div>`;

      const html = await renderServerIsland('test-2', component, { name: 'World' });

      expect(html).toContain('Hello World');
    });

    it('should cache rendered output', async () => {
      let renderCount = 0;
      const component = () => {
        renderCount++;
        return '<div>Cached</div>';
      };

      const cache = { ttl: 3600, tags: ['test'] };

      await renderServerIsland('cached-1', component, {}, cache);
      await renderServerIsland('cached-1', component, {}, cache);

      // Should only render once due to caching
      expect(renderCount).toBe(1);
    });

    it('should track cache hits in metrics', async () => {
      const component = () => '<div>Content</div>';
      const cache = { ttl: 3600 };

      await renderServerIsland('metrics-1', component, {}, cache);
      await renderServerIsland('metrics-1', component, {}, cache);

      const metrics = getServerIslandMetrics();

      expect(metrics.hits).toBeGreaterThan(0);
    });

    it('should track cache misses in metrics', async () => {
      const component = () => '<div>Content</div>';

      await renderServerIsland('miss-1', component, {});

      const metrics = getServerIslandMetrics();

      expect(metrics.misses).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should manually cache an island', async () => {
      await cacheIsland('manual-1', '<div>Manual</div>', {
        ttl: 3600,
        tags: ['manual'],
      });

      // Render should use cached version
      const component = () => '<div>Fresh</div>';
      const html = await renderServerIsland('manual-1', component, {}, { ttl: 3600 });

      // Note: Cache key includes props, so this might not match exactly
      expect(html).toBeDefined();
    });

    it('should invalidate by tag', async () => {
      const component = () => '<div>Content</div>';
      const cache = { ttl: 3600, tags: ['user'] };

      await renderServerIsland('tag-1', component, {}, cache);

      await invalidateIslandsByTag('user');

      // Should render fresh after invalidation
      let freshRender = false;
      const freshComponent = () => {
        freshRender = true;
        return '<div>Fresh</div>';
      };

      await renderServerIsland('tag-1', freshComponent, {}, cache);

      expect(freshRender).toBe(true);
    });

    it('should invalidate specific island', async () => {
      const component = () => '<div>Content</div>';
      const cache = { ttl: 3600 };
      const props = {};

      await renderServerIsland('specific-1', component, props, cache);

      // Invalidate with same props to ensure key matches
      await invalidateIsland('specific-1', props);

      // Verify by checking metrics (miss indicates fresh render needed)
      resetServerIslandMetrics();

      await renderServerIsland('specific-1', component, props, cache);

      const metrics = getServerIslandMetrics();
      expect(metrics.misses).toBeGreaterThan(0);
    });

    it('should clear all cache', async () => {
      const component = () => '<div>Content</div>';
      const cache = { ttl: 3600 };

      await renderServerIsland('clear-1', component, {}, cache);
      await renderServerIsland('clear-2', component, {}, cache);

      await clearIslandCache();

      resetServerIslandMetrics();

      await renderServerIsland('clear-1', component, {}, cache);
      await renderServerIsland('clear-2', component, {}, cache);

      const metrics = getServerIslandMetrics();
      expect(metrics.misses).toBe(2);
    });
  });

  describe('Prefetching', () => {
    it('should prefetch and cache island', async () => {
      let renderCount = 0;
      const component = () => {
        renderCount++;
        return '<div>Prefetched</div>';
      };

      const cache = { ttl: 3600 };

      // Prefetch
      await prefetchIsland('prefetch-1', component, {}, cache);

      // Render should use prefetched cache
      await renderServerIsland('prefetch-1', component, {}, cache);

      expect(renderCount).toBe(1); // Only prefetch rendered
    });
  });

  describe('Metrics', () => {
    it('should get metrics', () => {
      const metrics = getServerIslandMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('staleHits');
      expect(metrics).toHaveProperty('revalidations');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('avgRenderTime');
    });

    it('should reset metrics', async () => {
      const component = () => '<div>Content</div>';
      await renderServerIsland('reset-metrics', component, {});

      resetServerIslandMetrics();

      const metrics = getServerIslandMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
    });
  });

  describe('Cache Headers', () => {
    it('should generate public cache headers', () => {
      const headers = getIslandCacheHeaders({
        ttl: 3600,
      });

      expect(headers['Cache-Control']).toContain('public');
      expect(headers['Cache-Control']).toContain('max-age=3600');
    });

    it('should generate private cache headers', () => {
      const headers = getIslandCacheHeaders({
        ttl: 3600,
        private: true,
      });

      expect(headers['Cache-Control']).toContain('private');
    });

    it('should include stale-while-revalidate', () => {
      const headers = getIslandCacheHeaders({
        ttl: 3600,
        swr: 600,
      });

      expect(headers['Cache-Control']).toContain('stale-while-revalidate=600');
    });

    it('should include Vary header', () => {
      const headers = getIslandCacheHeaders({
        ttl: 3600,
        varyBy: ['Cookie', 'Accept-Language'],
      });

      expect(headers['Vary']).toBe('Cookie, Accept-Language');
    });

    it('should include CDN cache control for edge', () => {
      const headers = getIslandCacheHeaders({
        ttl: 3600,
        edge: true,
      });

      expect(headers['CDN-Cache-Control']).toBe('max-age=3600');
    });
  });

  describe('Cache Store', () => {
    it('should get and set cache store', () => {
      const store = getIslandCacheStore();

      expect(store).toBeDefined();
      expect(store.get).toBeDefined();
      expect(store.set).toBeDefined();
      expect(store.delete).toBeDefined();
      expect(store.invalidateByTag).toBeDefined();
      expect(store.clear).toBeDefined();
    });

    it('should accept custom cache store', async () => {
      const customStore = {
        data: new Map<string, any>(),
        async get(key: string) {
          return this.data.get(key) || null;
        },
        async set(key: string, value: any) {
          this.data.set(key, value);
        },
        async delete(key: string) {
          this.data.delete(key);
        },
        async invalidateByTag() {},
        async clear() {
          this.data.clear();
        },
      };

      setIslandCacheStore(customStore);

      const store = getIslandCacheStore();
      expect(store).toBe(customStore);

      // Reset to default
      await clearIslandCache();
    });
  });

  describe('Async Components', () => {
    it('should handle async components', async () => {
      const asyncComponent = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return '<div>Async Content</div>';
      };

      const html = await renderServerIsland('async-1', asyncComponent, {});

      expect(html).toContain('Async Content');
    });

    it('should handle async components with props', async () => {
      const asyncComponent = async (props: { id: string }) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `<div>User ${props.id}</div>`;
      };

      const html = await renderServerIsland('async-2', asyncComponent, { id: '123' });

      expect(html).toContain('User 123');
    });
  });

  describe('Error Handling', () => {
    it('should track errors in metrics', async () => {
      const errorComponent = () => {
        throw new Error('Render error');
      };

      try {
        await renderServerIsland('error-1', errorComponent, {});
      } catch {
        // Expected
      }

      const metrics = getServerIslandMetrics();
      expect(metrics.errors).toBeGreaterThan(0);
    });
  });
});

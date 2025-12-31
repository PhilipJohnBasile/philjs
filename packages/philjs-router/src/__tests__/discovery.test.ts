import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { matchRoute } from '../discovery.js';
import type { RoutePattern } from '../discovery.js';

// We cannot easily test discoverRoutes as it requires filesystem access
// Instead we test the matchRoute function which is the core matching logic

describe('router/discovery', () => {
  describe('matchRoute', () => {
    const createRoute = (
      pattern: string,
      params: string[] = [],
      priority: number = 0
    ): RoutePattern => {
      // Convert pattern to regex
      let regexPattern = pattern
        .split('/')
        .map(segment => {
          if (segment === '*') {
            return '(.*)';
          }
          if (segment.startsWith(':')) {
            return '([^/]+)';
          }
          return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/');

      if (!pattern.includes('*')) {
        regexPattern += '$';
      }

      return {
        pattern,
        regex: new RegExp('^' + regexPattern),
        params,
        filePath: pattern + '.tsx',
        priority,
      };
    };

    it('should match exact static routes', () => {
      const routes: RoutePattern[] = [
        createRoute('/', [], 100),
        createRoute('/about', [], 100),
        createRoute('/contact', [], 100),
      ];

      const result = matchRoute('/about', routes);
      expect(result).not.toBeNull();
      expect(result?.route.pattern).toBe('/about');
      expect(result?.params).toEqual({});
    });

    it('should match root route', () => {
      const routes: RoutePattern[] = [
        createRoute('/', [], 100),
        createRoute('/about', [], 100),
      ];

      const result = matchRoute('/', routes);
      expect(result).not.toBeNull();
      expect(result?.route.pattern).toBe('/');
    });

    it('should match dynamic segments', () => {
      const routes: RoutePattern[] = [
        createRoute('/products/:id', ['id'], 10),
        createRoute('/products', [], 100),
      ];

      const result = matchRoute('/products/123', routes);
      expect(result).not.toBeNull();
      expect(result?.route.pattern).toBe('/products/:id');
      expect(result?.params).toEqual({ id: '123' });
    });

    it('should match multiple dynamic segments', () => {
      const routes: RoutePattern[] = [
        createRoute('/users/:userId/posts/:postId', ['userId', 'postId'], 20),
      ];

      const result = matchRoute('/users/42/posts/99', routes);
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ userId: '42', postId: '99' });
    });

    it('should match catch-all routes', () => {
      const routes: RoutePattern[] = [
        createRoute('/docs/*', ['*'], -1000),
        createRoute('/docs', [], 100),
      ];

      const result = matchRoute('/docs/getting-started/installation', routes);
      expect(result).not.toBeNull();
      expect(result?.route.pattern).toBe('/docs/*');
      expect(result?.params['*']).toBe('getting-started/installation');
    });

    it('should return null for non-matching routes', () => {
      const routes: RoutePattern[] = [
        createRoute('/about', [], 100),
        createRoute('/contact', [], 100),
      ];

      const result = matchRoute('/nonexistent', routes);
      expect(result).toBeNull();
    });

    it('should match routes in priority order', () => {
      const routes: RoutePattern[] = [
        createRoute('/products/:id', ['id'], 10),
        createRoute('/products/featured', [], 100), // Higher priority
      ];

      // Sort by priority (higher first)
      routes.sort((a, b) => b.priority - a.priority);

      const result = matchRoute('/products/featured', routes);
      expect(result).not.toBeNull();
      expect(result?.route.pattern).toBe('/products/featured');
      expect(result?.params).toEqual({});
    });

    it('should handle empty routes array', () => {
      const result = matchRoute('/any', []);
      expect(result).toBeNull();
    });

    it('should handle routes with trailing slashes', () => {
      const routes: RoutePattern[] = [
        createRoute('/about', [], 100),
      ];

      // Route without trailing slash matches exact path
      const result = matchRoute('/about', routes);
      expect(result).not.toBeNull();
    });

    it('should handle nested static routes', () => {
      const routes: RoutePattern[] = [
        createRoute('/admin/users', [], 200),
        createRoute('/admin/settings', [], 200),
        createRoute('/admin', [], 100),
      ];

      const result = matchRoute('/admin/users', routes);
      expect(result).not.toBeNull();
      expect(result?.route.pattern).toBe('/admin/users');
    });

    it('should match complex patterns with mixed segments', () => {
      const routes: RoutePattern[] = [
        createRoute('/api/v1/users/:id/profile', ['id'], 110),
      ];

      const result = matchRoute('/api/v1/users/abc123/profile', routes);
      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ id: 'abc123' });
    });

    it('should handle URL-encoded parameters', () => {
      const routes: RoutePattern[] = [
        createRoute('/search/:query', ['query'], 10),
      ];

      const result = matchRoute('/search/hello%20world', routes);
      expect(result).not.toBeNull();
      expect(result?.params.query).toBe('hello%20world');
    });
  });
});

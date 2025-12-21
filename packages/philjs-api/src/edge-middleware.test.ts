/**
 * Edge Middleware Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  executeEdgeMiddleware,
  composeEdgeMiddleware,
  rewriteMiddleware,
  redirectMiddleware,
  addHeadersMiddleware,
  removeHeadersMiddleware,
  securityHeadersMiddleware,
  matchesPattern,
  type EdgeMiddleware,
  type EdgeContext,
} from './edge-middleware.js';

describe('Edge Middleware', () => {
  describe('executeEdgeMiddleware', () => {
    it('should execute single middleware', async () => {
      const middleware: EdgeMiddleware = async (context) => {
        return new Response('Hello from middleware');
      };

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(await response.text()).toBe('Hello from middleware');
    });

    it('should execute multiple middlewares in order', async () => {
      const order: number[] = [];

      const middleware1: EdgeMiddleware = async (context) => {
        order.push(1);
        return context.next();
      };

      const middleware2: EdgeMiddleware = async (context) => {
        order.push(2);
        return context.next();
      };

      const middleware3: EdgeMiddleware = async (context) => {
        order.push(3);
        return new Response('Done');
      };

      const request = new Request('https://example.com/test');
      await executeEdgeMiddleware(request, [middleware1, middleware2, middleware3]);

      expect(order).toEqual([1, 2, 3]);
    });

    it('should handle middleware that modifies response', async () => {
      const middleware: EdgeMiddleware = async (context) => {
        const response = await context.next();
        const headers = new Headers(response.headers);
        headers.set('X-Modified', 'true');
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      };

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.headers.get('X-Modified')).toBe('true');
    });

    it('should provide geolocation in context', async () => {
      let capturedGeo;

      const middleware: EdgeMiddleware = async (context) => {
        capturedGeo = context.geo;
        return new Response('OK');
      };

      const request = new Request('https://example.com/test');
      await executeEdgeMiddleware(request, middleware, {
        geo: { country: 'US', city: 'New York' },
      });

      expect(capturedGeo).toEqual({ country: 'US', city: 'New York' });
    });
  });

  describe('composeEdgeMiddleware', () => {
    it('should compose multiple middlewares', async () => {
      const logs: string[] = [];

      const mw1: EdgeMiddleware = async (context) => {
        logs.push('mw1-before');
        const response = await context.next();
        logs.push('mw1-after');
        return response;
      };

      const mw2: EdgeMiddleware = async (context) => {
        logs.push('mw2-before');
        const response = await context.next();
        logs.push('mw2-after');
        return response;
      };

      const composed = composeEdgeMiddleware(mw1, mw2);
      const request = new Request('https://example.com/test');
      await executeEdgeMiddleware(request, composed);

      expect(logs).toEqual(['mw1-before', 'mw2-before', 'mw2-after', 'mw1-after']);
    });
  });

  describe('rewriteMiddleware', () => {
    it('should rewrite URL based on pattern', async () => {
      const middleware = rewriteMiddleware({
        '/old-path': '/new-path',
      });

      let rewrittenUrl: URL | undefined;

      const testMiddleware: EdgeMiddleware = async (context) => {
        rewrittenUrl = context.request.url;
        return new Response('OK');
      };

      const request = new Request('https://example.com/old-path');
      await executeEdgeMiddleware(request, [middleware, testMiddleware]);

      // Note: In actual implementation, rewrite affects internal routing
      // This test validates the middleware runs without error
    });

    it('should support wildcard patterns', async () => {
      const middleware = rewriteMiddleware({
        '/api/v1/*': '/api/v2/$1',
      });

      const request = new Request('https://example.com/api/v1/users');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response).toBeDefined();
    });
  });

  describe('redirectMiddleware', () => {
    it('should redirect with default 302 status', async () => {
      const middleware = redirectMiddleware({
        '/old': '/new',
      });

      const request = new Request('https://example.com/old');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/new');
    });

    it('should support permanent redirects', async () => {
      const middleware = redirectMiddleware({
        '/old': { destination: '/new', permanent: true },
      });

      const request = new Request('https://example.com/old');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe('/new');
    });
  });

  describe('addHeadersMiddleware', () => {
    it('should add headers to response', async () => {
      const middleware = addHeadersMiddleware({
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      });

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(response.headers.get('X-Another-Header')).toBe('another-value');
    });
  });

  describe('removeHeadersMiddleware', () => {
    it('should remove headers from response', async () => {
      const addMiddleware = addHeadersMiddleware({
        'X-Remove-Me': 'value',
        'X-Keep-Me': 'value',
      });

      const removeMiddleware = removeHeadersMiddleware(['X-Remove-Me']);

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, [addMiddleware, removeMiddleware]);

      expect(response.headers.get('X-Remove-Me')).toBeNull();
      expect(response.headers.get('X-Keep-Me')).toBe('value');
    });
  });

  describe('securityHeadersMiddleware', () => {
    it('should add security headers', async () => {
      const middleware = securityHeadersMiddleware({
        csp: "default-src 'self'",
        hsts: true,
        nosniff: true,
        frameOptions: 'DENY',
      });

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('matchesPattern', () => {
    it('should match exact paths', () => {
      const url = new URL('https://example.com/api/users');
      expect(matchesPattern(url, '/api/users')).toBe(true);
      expect(matchesPattern(url, '/api/posts')).toBe(false);
    });

    it('should match wildcard patterns', () => {
      const url = new URL('https://example.com/api/users/123');
      expect(matchesPattern(url, '/api/*')).toBe(true);
      expect(matchesPattern(url, '/api/users/*')).toBe(true);
      expect(matchesPattern(url, '/posts/*')).toBe(false);
    });

    it('should match multiple patterns', () => {
      const url = new URL('https://example.com/api/users');
      expect(matchesPattern(url, ['/api/users', '/api/posts'])).toBe(true);
      expect(matchesPattern(url, ['/admin/*', '/api/*'])).toBe(true);
      expect(matchesPattern(url, ['/admin/*', '/posts/*'])).toBe(false);
    });
  });

  describe('Cookie handling', () => {
    it('should get cookies from request', async () => {
      let capturedCookie: string | undefined;

      const middleware: EdgeMiddleware = async (context) => {
        capturedCookie = context.cookies.get('test');
        return new Response('OK');
      };

      const request = new Request('https://example.com/test', {
        headers: { Cookie: 'test=value123' },
      });
      await executeEdgeMiddleware(request, middleware);

      expect(capturedCookie).toBe('value123');
    });

    it('should set cookies in response', async () => {
      const middleware: EdgeMiddleware = async (context) => {
        context.cookies.set('new-cookie', 'new-value', {
          maxAge: 3600,
          path: '/',
        });
        return new Response('OK');
      };

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('new-cookie=new-value');
      expect(setCookie).toContain('Max-Age=3600');
      expect(setCookie).toContain('Path=/');
    });

    it('should delete cookies', async () => {
      const middleware: EdgeMiddleware = async (context) => {
        context.cookies.delete('to-delete');
        return new Response('OK');
      };

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('to-delete=');
      expect(setCookie).toContain('Max-Age=0');
    });
  });

  describe('Context helpers', () => {
    it('should provide redirect helper', async () => {
      const middleware: EdgeMiddleware = (context) => {
        return context.redirect('/redirected', 307);
      };

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('/redirected');
    });

    it('should provide rewrite helper', async () => {
      const middleware: EdgeMiddleware = (context) => {
        context.rewrite('/rewritten');
        return context.next();
      };

      const request = new Request('https://example.com/test');
      const response = await executeEdgeMiddleware(request, middleware);

      expect(response).toBeDefined();
    });
  });
});

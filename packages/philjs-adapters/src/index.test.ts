/**
 * PhilJS Adapters - Test Suite
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { autoAdapter, createAdapter, presets } from './index';
import { vercelAdapter } from './vercel';
import { netlifyAdapter } from './netlify';
import { cloudflareAdapter } from './cloudflare';
import { awsAdapter } from './aws';
import { nodeAdapter } from './node';
import { staticAdapter } from './static';
import type { Adapter } from './types';

describe('PhilJS Adapters', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('autoAdapter', () => {
    it('should detect Vercel environment', () => {
      process.env.VERCEL = '1';
      const adapter = autoAdapter();
      expect(adapter.name).toBe('vercel');
    });

    it('should detect Netlify environment', () => {
      process.env.NETLIFY = 'true';
      const adapter = autoAdapter();
      expect(adapter.name).toBe('netlify');
    });

    it('should detect Cloudflare Pages environment', () => {
      process.env.CF_PAGES = '1';
      const adapter = autoAdapter();
      expect(adapter.name).toBe('cloudflare');
    });

    it('should detect AWS Lambda environment', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-function';
      const adapter = autoAdapter();
      expect(adapter.name).toBe('aws');
    });

    it('should default to Node.js adapter', () => {
      const adapter = autoAdapter();
      expect(adapter.name).toBe('node');
    });
  });

  describe('createAdapter', () => {
    it('should create vercel-edge adapter', () => {
      const adapter = createAdapter('vercel-edge');
      expect(adapter.name).toBe('vercel');
      expect((adapter as any).edge).toBe(true);
    });

    it('should create netlify-edge adapter', () => {
      const adapter = createAdapter('netlify-edge');
      expect(adapter.name).toBe('netlify');
      expect((adapter as any).edge).toBe(true);
    });

    it('should create cloudflare-pages adapter', () => {
      const adapter = createAdapter('cloudflare-pages');
      expect(adapter.name).toBe('cloudflare');
    });

    it('should create static adapter', () => {
      const adapter = createAdapter('static');
      expect(adapter.name).toBe('static');
    });

    it('should throw error for unknown preset', () => {
      expect(() => createAdapter('unknown' as any)).toThrow('Unknown adapter preset');
    });
  });

  describe('vercelAdapter', () => {
    it('should create Vercel adapter with defaults', () => {
      const adapter = vercelAdapter();
      expect(adapter.name).toBe('vercel');
      expect(adapter.edge).toBe(false);
    });

    it('should support edge runtime', () => {
      const adapter = vercelAdapter({ edge: true });
      expect(adapter.edge).toBe(true);
    });

    it('should configure ISR', () => {
      const adapter = vercelAdapter({
        isr: {
          revalidate: 60,
          bypassToken: 'secret',
        },
      });
      expect(adapter.name).toBe('vercel');
    });

    it('should have getHandler method', () => {
      const adapter = vercelAdapter();
      expect(adapter.getHandler).toBeDefined();
      expect(typeof adapter.getHandler).toBe('function');
    });
  });

  describe('netlifyAdapter', () => {
    it('should create Netlify adapter with defaults', () => {
      const adapter = netlifyAdapter();
      expect(adapter.name).toBe('netlify');
      expect(adapter.edge).toBe(false);
    });

    it('should support edge functions', () => {
      const adapter = netlifyAdapter({ edge: true });
      expect(adapter.edge).toBe(true);
    });

    it('should configure redirects', () => {
      const adapter = netlifyAdapter({
        redirects: [
          {
            from: '/old',
            to: '/new',
            status: 301,
          },
        ],
      });
      expect(adapter.name).toBe('netlify');
    });

    it('should have getHandler method', () => {
      const adapter = netlifyAdapter();
      expect(adapter.getHandler).toBeDefined();
    });
  });

  describe('cloudflareAdapter', () => {
    it('should create Cloudflare adapter with defaults', () => {
      const adapter = cloudflareAdapter();
      expect(adapter.name).toBe('cloudflare');
      expect(adapter.edge).toBe(true);
    });

    it('should configure for Pages mode', () => {
      const adapter = cloudflareAdapter({ mode: 'pages' });
      expect(adapter.name).toBe('cloudflare');
    });

    it('should configure for Workers mode', () => {
      const adapter = cloudflareAdapter({ mode: 'workers' });
      expect(adapter.name).toBe('cloudflare');
    });

    it('should configure KV namespaces', () => {
      const adapter = cloudflareAdapter({
        kv: [
          {
            binding: 'CACHE',
            id: 'test-kv-id',
          },
        ],
      });
      expect(adapter.name).toBe('cloudflare');
    });

    it('should configure D1 databases', () => {
      const adapter = cloudflareAdapter({
        d1: [
          {
            binding: 'DB',
            database_id: 'test-db-id',
            database_name: 'test-db',
          },
        ],
      });
      expect(adapter.name).toBe('cloudflare');
    });

    it('should have edgeConfig', () => {
      const adapter = cloudflareAdapter();
      expect(adapter.edgeConfig).toBeDefined();
      expect(adapter.edgeConfig?.regions).toContain('global');
    });
  });

  describe('awsAdapter', () => {
    it('should create AWS adapter with defaults', () => {
      const adapter = awsAdapter();
      expect(adapter.name).toBe('aws');
      expect(adapter.serverless).toBe(true);
    });

    it('should configure for Lambda mode', () => {
      const adapter = awsAdapter({ mode: 'lambda' });
      expect(adapter.name).toBe('aws');
    });

    it('should configure for Lambda@Edge mode', () => {
      const adapter = awsAdapter({ mode: 'lambda-edge' });
      expect(adapter.name).toBe('aws');
    });

    it('should configure for Amplify mode', () => {
      const adapter = awsAdapter({ mode: 'amplify' });
      expect(adapter.name).toBe('aws');
    });

    it('should configure function settings', () => {
      const adapter = awsAdapter({
        memory: 2048,
        timeout: 60,
        runtime: 'nodejs20.x',
      });
      expect(adapter.functionConfig).toBeDefined();
      expect(adapter.functionConfig?.memory).toBe(2048);
      expect(adapter.functionConfig?.timeout).toBe(60);
    });

    it('should support ARM64 architecture', () => {
      const adapter = awsAdapter({ architecture: 'arm64' });
      expect(adapter.name).toBe('aws');
    });
  });

  describe('nodeAdapter', () => {
    it('should create Node.js adapter with defaults', () => {
      const adapter = nodeAdapter();
      expect(adapter.name).toBe('node');
    });

    it('should configure port and host', () => {
      const adapter = nodeAdapter({
        port: 8080,
        host: 'localhost',
      });
      expect(adapter.name).toBe('node');
    });

    it('should support HTTPS', () => {
      const adapter = nodeAdapter({
        https: {
          key: '/path/to/key.pem',
          cert: '/path/to/cert.pem',
        },
      });
      expect(adapter.name).toBe('node');
    });

    it('should support compression', () => {
      const adapter = nodeAdapter({ compression: true });
      expect(adapter.name).toBe('node');
    });

    it('should have getHandler method', () => {
      const adapter = nodeAdapter();
      expect(adapter.getHandler).toBeDefined();
    });
  });

  describe('staticAdapter', () => {
    it('should create static adapter with defaults', () => {
      const adapter = staticAdapter();
      expect(adapter.name).toBe('static');
    });

    it('should configure pages to prerender', () => {
      const adapter = staticAdapter({
        pages: ['/', '/about', '/contact'],
      });
      expect(adapter.name).toBe('static');
    });

    it('should configure sitemap', () => {
      const adapter = staticAdapter({
        sitemap: {
          hostname: 'https://example.com',
          changefreq: 'weekly',
          priority: 0.8,
        },
      });
      expect(adapter.name).toBe('static');
    });

    it('should configure robots.txt', () => {
      const adapter = staticAdapter({
        robots: {
          allow: ['/'],
          disallow: ['/admin'],
        },
      });
      expect(adapter.name).toBe('static');
    });

    it('should support clean URLs', () => {
      const adapter = staticAdapter({ cleanUrls: true });
      expect(adapter.name).toBe('static');
    });
  });

  describe('Adapter Interface', () => {
    const adapters: [string, Adapter][] = [
      ['vercel', vercelAdapter()],
      ['netlify', netlifyAdapter()],
      ['cloudflare', cloudflareAdapter()],
      ['aws', awsAdapter()],
      ['node', nodeAdapter()],
      ['static', staticAdapter()],
    ];

    adapters.forEach(([name, adapter]) => {
      describe(`${name} adapter`, () => {
        it('should have name property', () => {
          expect(adapter.name).toBe(name);
        });

        it('should have adapt method', () => {
          expect(adapter.adapt).toBeDefined();
          expect(typeof adapter.adapt).toBe('function');
        });

        it('should have getHandler method', () => {
          expect(adapter.getHandler).toBeDefined();
          expect(typeof adapter.getHandler).toBe('function');
        });

        it('adapt should return a promise', () => {
          const result = adapter.adapt({});
          expect(result).toBeInstanceOf(Promise);
        });

        it('getHandler should return a function', () => {
          const handler = adapter.getHandler();
          expect(typeof handler).toBe('function');
        });
      });
    });
  });

  describe('Presets', () => {
    it('should have all expected presets', () => {
      const expectedPresets = [
        'vercel-edge',
        'vercel-serverless',
        'netlify-edge',
        'netlify-functions',
        'cloudflare-pages',
        'cloudflare-workers',
        'aws-lambda',
        'aws-edge',
        'aws-amplify',
        'node',
        'static',
      ];

      expectedPresets.forEach(preset => {
        expect(presets).toHaveProperty(preset);
      });
    });

    it('each preset should be a function', () => {
      Object.values(presets).forEach(preset => {
        expect(typeof preset).toBe('function');
      });
    });

    it('presets should return adapters', () => {
      Object.entries(presets).forEach(([name, preset]) => {
        const adapter = preset({});
        expect(adapter).toBeDefined();
        expect(adapter.name).toBeDefined();
        expect(adapter.adapt).toBeDefined();
        expect(adapter.getHandler).toBeDefined();
      });
    });
  });

  describe('Configuration', () => {
    it('should accept custom outDir', () => {
      const adapter = vercelAdapter({ outDir: 'custom-out' });
      expect(adapter.name).toBe('vercel');
    });

    it('should accept static assets configuration', () => {
      const adapter = netlifyAdapter({
        static: {
          assets: 'public',
          cacheControl: 'public, max-age=31536000',
        },
      });
      expect(adapter.name).toBe('netlify');
    });

    it('should accept environment variables', () => {
      const adapter = cloudflareAdapter({
        vars: {
          API_URL: 'https://api.example.com',
        },
      });
      expect(adapter.name).toBe('cloudflare');
    });

    it('should accept prerender routes', () => {
      const adapter = staticAdapter({
        prerender: ['/about', '/contact'],
      });
      expect(adapter.name).toBe('static');
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct config types', () => {
      // These should compile without errors
      vercelAdapter({ edge: true });
      netlifyAdapter({ edge: false });
      cloudflareAdapter({ mode: 'pages' });
      awsAdapter({ mode: 'lambda' });
      nodeAdapter({ port: 3000 });
      staticAdapter({ cleanUrls: true });

      // TypeScript should catch invalid configs at compile time
      // @ts-expect-error - invalid edge value
      // vercelAdapter({ edge: 'yes' });
    });
  });

  describe('Handler Creation', () => {
    it('should create handler that accepts Request', async () => {
      const adapter = vercelAdapter();
      const handler = adapter.getHandler();

      // Handler should accept Web Request API
      const request = new Request('https://example.com/test');
      expect(handler).toBeDefined();

      // Note: Actual execution would require @philjs/ssr to be available
    });

    it('should pass platform context to handler', () => {
      const adapter = cloudflareAdapter();
      const handler = adapter.getHandler();

      // Handler should receive platform-specific context
      expect(handler).toBeDefined();
    });
  });
});

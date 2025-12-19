/**
 * PhilJS Adapters - Basic Usage Examples
 *
 * This file demonstrates how to use PhilJS adapters in your application.
 */

// ========================================
// Example 1: Auto-Detection
// ========================================

import { autoAdapter } from 'philjs-adapters';

// Automatically detects deployment platform from environment
const adapter = autoAdapter();

// Use in Vite config
export default {
  plugins: [
    philjs({
      adapter,
    }),
  ],
};

// ========================================
// Example 2: Vercel with Edge Runtime
// ========================================

import { vercelAdapter } from 'philjs-adapters/vercel';

const vercelEdge = vercelAdapter({
  edge: true,
  regions: ['iad1', 'sfo1'], // Deploy to specific regions
  maxDuration: 30,
  isr: {
    revalidate: 60, // Revalidate every 60 seconds
  },
});

// ========================================
// Example 3: Netlify with Edge Functions
// ========================================

import { netlifyAdapter } from 'philjs-adapters/netlify';

const netlifyEdge = netlifyAdapter({
  edge: true,
  builders: true, // Enable On-Demand Builders
  headers: [
    {
      for: '/assets/*',
      values: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  ],
  redirects: [
    {
      from: '/old-blog/*',
      to: '/blog/:splat',
      status: 301,
    },
  ],
});

// ========================================
// Example 4: Cloudflare with Full Stack
// ========================================

import { cloudflareAdapter } from 'philjs-adapters/cloudflare';

const cloudflare = cloudflareAdapter({
  mode: 'pages',
  kv: [
    {
      binding: 'CACHE',
      id: 'your-kv-namespace-id',
    },
  ],
  d1: [
    {
      binding: 'DB',
      database_id: 'your-db-id',
      database_name: 'production',
    },
  ],
  r2: [
    {
      binding: 'UPLOADS',
      bucket_name: 'user-uploads',
    },
  ],
});

// Using Cloudflare bindings in your code
import { getCloudflareEnv } from 'philjs-adapters/cloudflare';

export async function loader() {
  const env = getCloudflareEnv();

  // Use KV
  const cached = await env.CACHE.get('key');

  // Use D1
  const result = await env.DB.prepare('SELECT * FROM users').all();

  // Use R2
  const file = await env.UPLOADS.get('photo.jpg');

  return { cached, result, file };
}

// ========================================
// Example 5: AWS Lambda with Streaming
// ========================================

import { awsAdapter } from 'philjs-adapters/aws';

const awsLambda = awsAdapter({
  mode: 'lambda',
  runtime: 'nodejs20.x',
  memory: 1024,
  timeout: 30,
  architecture: 'arm64', // Use Graviton2 for cost savings
  streaming: true, // Enable response streaming
  region: 'us-east-1',
  s3Bucket: 'my-app-assets',
});

// ========================================
// Example 6: Node.js Standalone Server
// ========================================

import { nodeAdapter, startServer } from 'philjs-adapters/node';

const node = nodeAdapter({
  port: 3000,
  host: '0.0.0.0',
  compression: true,
  trustProxy: true, // Behind Nginx/Apache
  cluster: true, // Use all CPU cores
});

// Start the server directly
startServer({
  port: process.env.PORT || 3000,
  compression: true,
});

// Or integrate with Express
import express from 'express';

const app = express();
const adapter = nodeAdapter();
const handler = adapter.getHandler();

app.all('*', async (req, res) => {
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers as any,
  });

  const response = await handler(request);

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.send(await response.text());
});

app.listen(3000);

// ========================================
// Example 7: Static Site Generation
// ========================================

import { staticAdapter } from 'philjs-adapters/static';

const staticSite = staticAdapter({
  pages: [
    '/',
    '/about',
    '/blog',
    '/contact',
  ],
  sitemap: {
    hostname: 'https://example.com',
    changefreq: 'weekly',
    priority: 0.8,
  },
  robots: {
    allow: ['/'],
    disallow: ['/admin'],
    sitemap: true,
  },
  cleanUrls: true,
  trailingSlash: false,
});

// ========================================
// Example 8: Using Presets
// ========================================

import { createAdapter } from 'philjs-adapters';

// Quickly create adapters with presets
const vercelEdgePreset = createAdapter('vercel-edge');
const netlifyFunctions = createAdapter('netlify-functions');
const cloudflarePages = createAdapter('cloudflare-pages');
const awsLambdaPreset = createAdapter('aws-lambda');

// ========================================
// Example 9: Dynamic Configuration
// ========================================

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const dynamicAdapter = isProd
  ? vercelAdapter({ edge: true })
  : nodeAdapter({ port: 3000 });

// ========================================
// Example 10: Platform-Specific Features
// ========================================

// Vercel ISR
import { revalidatePath, revalidateTag } from 'philjs-adapters/vercel';

export async function action() {
  // Revalidate specific path
  await revalidatePath('/blog/post-1');

  // Revalidate by tag
  await revalidateTag('blog-posts');
}

// Netlify Image CDN
import { netlifyImageCDN } from 'philjs-adapters/netlify';

const optimizedUrl = netlifyImageCDN('/photo.jpg', {
  width: 800,
  format: 'avif',
  fit: 'cover',
});

// Cloudflare KV Helper
import { createKVHelper } from 'philjs-adapters/cloudflare';

const kv = createKVHelper(env.CACHE);
await kv.put('session:123', JSON.stringify({ user: 'john' }), {
  expirationTtl: 3600,
});

// AWS Context
import { getRemainingTimeMs, getRequestId } from 'philjs-adapters/aws';

const timeLeft = getRemainingTimeMs();
const requestId = getRequestId();

// ========================================
// Example 11: Multiple Environments
// ========================================

const getAdapter = () => {
  const platform = process.env.DEPLOY_PLATFORM;

  switch (platform) {
    case 'vercel':
      return vercelAdapter({ edge: true });
    case 'netlify':
      return netlifyAdapter({ edge: true });
    case 'cloudflare':
      return cloudflareAdapter({ mode: 'pages' });
    case 'aws':
      return awsAdapter({ mode: 'lambda' });
    default:
      return autoAdapter();
  }
};

export const adapter = getAdapter();

// ========================================
// Example 12: Complete Vite Config
// ========================================

import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import { vercelAdapter } from 'philjs-adapters/vercel';

export default defineConfig({
  plugins: [
    philjs({
      adapter: vercelAdapter({
        edge: true,
        isr: { revalidate: 60 },
        regions: ['iad1', 'sfo1'],
      }),
      output: 'server',
      ssr: {
        streaming: true,
        target: 'vercel',
      },
    }),
  ],
  build: {
    minify: 'terser',
    sourcemap: true,
  },
});

// ========================================
// Example 13: Testing Adapters
// ========================================

import { describe, it, expect } from 'vitest';

describe('Adapter Integration', () => {
  it('should create handler that processes requests', async () => {
    const adapter = vercelAdapter();
    const handler = adapter.getHandler();

    const request = new Request('https://example.com/test');
    const response = await handler(request);

    expect(response).toBeInstanceOf(Response);
  });

  it('should adapt for deployment', async () => {
    const adapter = staticAdapter({ pages: ['/'] });
    await adapter.adapt({});

    // Check that files were generated
    // ...
  });
});

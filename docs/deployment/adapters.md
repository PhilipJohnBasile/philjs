# PhilJS Deployment Adapters

PhilJS provides official deployment adapters for seamless deployment to major cloud platforms. Each adapter handles platform-specific configuration, optimization, and best practices automatically.

## Overview

The `philjs-adapters` package includes production-ready adapters for:

- **Vercel** - Edge Functions, Serverless, ISR
- **Netlify** - Edge Functions, Serverless, Forms
- **Cloudflare** - Workers, Pages, KV, D1, R2
- **AWS** - Lambda, Lambda@Edge, Amplify
- **Node.js** - Standalone server (Express/Fastify)
- **Static** - Static site generation (SSG)

## Installation

```bash
npm install philjs-adapters
```

Or with pnpm:

```bash
pnpm add philjs-adapters
```

## Quick Start

### Auto-Detection

The easiest way to use adapters is with auto-detection:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';
import { autoAdapter } from 'philjs-adapters';

export default defineConfig({
  plugins: [
    philjs({
      adapter: autoAdapter(),
    }),
  ],
});
```

The auto-adapter detects your deployment platform from environment variables:
- `VERCEL` → Vercel adapter
- `NETLIFY` → Netlify adapter
- `CF_PAGES` or `CLOUDFLARE_WORKERS` → Cloudflare adapter
- `AWS_LAMBDA_FUNCTION_NAME` → AWS adapter
- Otherwise → Node.js adapter

### Specific Adapter

Or specify the adapter explicitly:

```typescript
import { vercelAdapter } from 'philjs-adapters/vercel';

export default defineConfig({
  plugins: [
    philjs({
      adapter: vercelAdapter({
        edge: true,
        isr: { revalidate: 60 },
      }),
    }),
  ],
});
```

## Vercel Adapter

Deploy to Vercel with Edge Runtime or Node.js Serverless functions.

### Configuration

```typescript
import { vercelAdapter } from 'philjs-adapters/vercel';

vercelAdapter({
  // Use Edge Runtime (default: false)
  edge: true,

  // Deployment regions
  regions: ['iad1', 'sfo1'],

  // Memory limit (MB)
  memory: 1024,

  // Max duration (seconds)
  maxDuration: 30,

  // Incremental Static Regeneration
  isr: {
    revalidate: 60, // Revalidate every 60 seconds
    bypassToken: 'secret',
  },

  // Image optimization
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Cron jobs
  crons: [
    {
      path: '/api/cron/daily',
      schedule: '0 0 * * *',
    },
  ],
});
```

### Features

- **Edge Functions** - Deploy to Vercel's edge network (0ms cold starts)
- **Serverless Functions** - Node.js runtime with 50-60s execution time
- **ISR** - Incremental Static Regeneration for hybrid static/dynamic
- **Image Optimization** - Automatic image optimization with `next/image`
- **Cron Jobs** - Scheduled function execution

### Usage

```typescript
// Revalidate a path on-demand
import { revalidatePath } from 'philjs-adapters/vercel';

await revalidatePath('/blog/post-1');

// Revalidate by cache tag
import { revalidateTag } from 'philjs-adapters/vercel';

await revalidateTag('blog-posts');
```

### Deploy

```bash
npm run build
vercel deploy
```

[Full Vercel deployment guide →](/docs/deployment/vercel)

## Netlify Adapter

Deploy to Netlify with Edge Functions or Netlify Functions.

### Configuration

```typescript
import { netlifyAdapter } from 'philjs-adapters/netlify';

netlifyAdapter({
  // Use Edge Functions (default: false)
  edge: true,

  // On-Demand Builders (ISR)
  builders: true,

  // Excluded paths
  excludedPaths: ['/admin/*'],

  // Custom headers
  headers: [
    {
      for: '/assets/*',
      values: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  ],

  // Redirects
  redirects: [
    {
      from: '/old-path',
      to: '/new-path',
      status: 301,
    },
  ],

  // Forms handling
  forms: true,

  // Identity (authentication)
  identity: true,
});
```

### Features

- **Edge Functions** - Deno-powered edge functions (0ms cold starts)
- **Netlify Functions** - Node.js serverless functions
- **On-Demand Builders** - Cache and regenerate on-demand (ISR)
- **Forms** - Built-in form handling
- **Split Testing** - A/B testing support
- **Identity** - Built-in authentication

### Usage

```typescript
// Access Netlify context in edge functions
import { getNetlifyContext } from 'philjs-adapters/netlify';

const { geo, ip } = getNetlifyContext();

// Use Netlify Image CDN
import { netlifyImageCDN } from 'philjs-adapters/netlify';

const optimizedUrl = netlifyImageCDN('/photo.jpg', {
  width: 800,
  format: 'avif',
});
```

### Deploy

```bash
npm run build
netlify deploy --prod
```

[Full Netlify deployment guide →](/docs/deployment/netlify)

## Cloudflare Adapter

Deploy to Cloudflare Workers or Pages with global edge network.

### Configuration

```typescript
import { cloudflareAdapter } from 'philjs-adapters/cloudflare';

cloudflareAdapter({
  // Deploy as Pages or Workers
  mode: 'pages', // or 'workers'

  // KV namespace bindings
  kv: [
    {
      binding: 'CACHE',
      id: 'your-kv-id',
      preview_id: 'preview-kv-id',
    },
  ],

  // Durable Objects
  durableObjects: [
    {
      binding: 'COUNTER',
      class_name: 'Counter',
    },
  ],

  // R2 bucket bindings
  r2: [
    {
      binding: 'UPLOADS',
      bucket_name: 'my-uploads',
    },
  ],

  // D1 database bindings
  d1: [
    {
      binding: 'DB',
      database_id: 'your-db-id',
      database_name: 'production',
    },
  ],

  // Environment variables
  vars: {
    ENVIRONMENT: 'production',
  },

  // Compatibility
  compatibilityDate: '2024-01-01',
  compatibilityFlags: ['nodejs_compat'],
});
```

### Features

- **Global Edge Network** - 275+ cities worldwide
- **Workers** - V8 isolates with 0ms cold starts
- **KV Storage** - Low-latency key-value storage
- **D1 Database** - Serverless SQL database
- **R2 Storage** - S3-compatible object storage
- **Durable Objects** - Stateful serverless objects

### Usage

```typescript
// Access Cloudflare environment
import { getCloudflareEnv } from 'philjs-adapters/cloudflare';

const env = getCloudflareEnv();
const data = await env.KV.get('key');

// Use execution context
import { waitUntil } from 'philjs-adapters/cloudflare';

waitUntil(logToAnalytics());

// KV helpers
import { createKVHelper } from 'philjs-adapters/cloudflare';

const kv = createKVHelper(env.CACHE);
await kv.put('key', 'value', { expirationTtl: 3600 });
```

### Deploy

```bash
npm run build
wrangler pages deploy dist
```

[Full Cloudflare deployment guide →](/docs/deployment/cloudflare)

## AWS Adapter

Deploy to AWS Lambda, Lambda@Edge, or AWS Amplify.

### Configuration

```typescript
import { awsAdapter } from 'philjs-adapters/aws';

awsAdapter({
  // Deployment mode
  mode: 'lambda', // or 'lambda-edge' or 'amplify'

  // Lambda runtime
  runtime: 'nodejs20.x',

  // Memory (MB)
  memory: 1024,

  // Timeout (seconds)
  timeout: 30,

  // AWS region
  region: 'us-east-1',

  // Architecture
  architecture: 'arm64', // or 'x86_64'

  // Response streaming
  streaming: false,

  // CloudFront configuration (Lambda@Edge)
  cloudfront: {
    priceClass: 'PriceClass_100',
    originShieldRegion: 'us-east-1',
  },

  // S3 bucket for static assets
  s3Bucket: 'my-app-assets',

  // API Gateway
  apiGateway: {
    type: 'HTTP',
    corsEnabled: true,
  },
});
```

### Features

- **Lambda** - Serverless functions with Node.js runtime
- **Lambda@Edge** - Run at CloudFront edge locations
- **Amplify** - Full-stack deployment with hosting
- **Response Streaming** - Stream responses for faster TTFB
- **ARM64** - Lower cost with Graviton2 processors
- **API Gateway** - REST or HTTP APIs

### Usage

```typescript
// Access AWS context
import { getAWSContext, getRemainingTimeMs } from 'philjs-adapters/aws';

const timeLeft = getRemainingTimeMs();

// Generate S3 asset URL
import { getS3AssetUrl } from 'philjs-adapters/aws';

const url = getS3AssetUrl('image.jpg', 'my-bucket', 'us-east-1');
```

### Deploy

```bash
npm run build

# Using SAM
sam deploy --guided

# Using Serverless Framework
serverless deploy

# Using AWS CDK
cdk deploy
```

## Node.js Adapter

Run as a standalone Node.js server with HTTP/HTTPS support.

### Configuration

```typescript
import { nodeAdapter, startServer } from 'philjs-adapters/node';

nodeAdapter({
  // Server port
  port: 3000,

  // Host to bind
  host: '0.0.0.0',

  // HTTPS configuration
  https: {
    key: '/path/to/key.pem',
    cert: '/path/to/cert.pem',
  },

  // Enable compression
  compression: true,

  // Request timeout (ms)
  timeout: 30000,

  // Trust proxy headers
  trustProxy: true,

  // Enable clustering
  cluster: true, // or number of workers

  // Serve static files
  serveStatic: true,
});
```

### Features

- **HTTP/HTTPS** - Standard web server
- **Compression** - Gzip/Brotli support
- **Static Files** - Built-in static file serving
- **Clustering** - Multi-core support
- **Reverse Proxy** - Works with Nginx/Apache

### Usage

```typescript
// Create and start server
import { startServer } from 'philjs-adapters/node';

startServer({
  port: process.env.PORT || 3000,
  compression: true,
});

// Or with Express/Fastify
import express from 'express';
import { nodeAdapter } from 'philjs-adapters/node';

const app = express();
const adapter = nodeAdapter();

app.use(adapter.middleware());
app.listen(3000);
```

### Deploy

```bash
npm run build
node server.js

# With PM2
pm2 start server.js -i max

# With Docker
docker build -t philjs-app .
docker run -p 3000:3000 philjs-app
```

[Full Docker deployment guide →](/docs/deployment/docker)

## Static Adapter

Generate a fully static site with pre-rendering.

### Configuration

```typescript
import { staticAdapter } from 'philjs-adapters/static';

staticAdapter({
  // Output directory
  outDir: 'dist',

  // Pages to prerender
  pages: [
    '/',
    '/about',
    '/blog',
    '/contact',
  ],

  // Fallback for dynamic routes
  fallback: 'index.html', // or '404.html' or false

  // Generate sitemap.xml
  sitemap: {
    hostname: 'https://example.com',
    changefreq: 'weekly',
    priority: 0.8,
  },

  // Generate robots.txt
  robots: {
    allow: ['/'],
    disallow: ['/admin'],
    sitemap: true,
  },

  // Trailing slashes
  trailingSlash: false,

  // Clean URLs (no .html)
  cleanUrls: true,
});
```

### Features

- **Static Generation** - Pre-render all pages at build time
- **Sitemap** - Automatic sitemap.xml generation
- **Robots.txt** - SEO-friendly robots.txt
- **Clean URLs** - Optional .html extension
- **Fallback Pages** - SPA fallback for dynamic routes

### Usage

```typescript
// Prerender specific routes
import { prerender, getStaticPaths } from 'philjs-adapters/static';

// In a route file
export async function getStaticPaths() {
  const posts = await fetchBlogPosts();

  return {
    paths: posts.map(post => `/blog/${post.slug}`),
    fallback: false,
  };
}
```

### Deploy

Deploy to any static host:

```bash
npm run build

# Netlify
netlify deploy --dir=dist --prod

# Vercel
vercel deploy --prod

# S3
aws s3 sync dist/ s3://my-bucket/

# GitHub Pages
npm run deploy
```

## Adapter Presets

Use pre-configured adapter presets:

```typescript
import { createAdapter } from 'philjs-adapters';

// Vercel Edge
createAdapter('vercel-edge', { maxDuration: 30 });

// Netlify Edge
createAdapter('netlify-edge');

// Cloudflare Pages
createAdapter('cloudflare-pages', {
  kv: [{ binding: 'CACHE', id: 'xxx' }],
});

// AWS Lambda
createAdapter('aws-lambda', { region: 'us-east-1' });

// Static site
createAdapter('static', { sitemap: { hostname: 'https://example.com' } });
```

Available presets:
- `vercel-edge`
- `vercel-serverless`
- `netlify-edge`
- `netlify-functions`
- `cloudflare-pages`
- `cloudflare-workers`
- `aws-lambda`
- `aws-edge`
- `aws-amplify`
- `node`
- `static`

## Custom Adapters

Create your own adapter for custom platforms:

```typescript
import type { Adapter } from 'philjs-adapters';

export function customAdapter(config = {}): Adapter {
  return {
    name: 'custom',

    async adapt() {
      console.log('Building for custom platform...');

      // Your build logic here
      // - Generate platform-specific files
      // - Copy assets
      // - Create configuration files
    },

    getHandler() {
      return async (request: Request) => {
        // Your request handler
        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest({
          url: new URL(request.url),
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: { name: 'custom' },
        });
      };
    },
  };
}
```

## Comparison

| Feature | Vercel | Netlify | Cloudflare | AWS | Node.js | Static |
|---------|--------|---------|------------|-----|---------|--------|
| **Cold Start** | 50-200ms | 100-500ms | 0ms | 100-500ms | N/A | N/A |
| **Edge Support** | ✅ | ✅ | ✅ | ✅ | ❌ | N/A |
| **Locations** | 100+ | Global | 275+ | Regions | 1 | N/A |
| **Max Duration** | 10-60s | 10s-26s | 30s | 15min | ∞ | N/A |
| **Free Tier** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Database** | External | External | D1 | RDS/DynamoDB | Any | N/A |
| **Storage** | External | External | R2/KV | S3 | Local | N/A |
| **WebSockets** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |

## Best Practices

### Choose the Right Adapter

- **Static sites** → Static adapter + CDN (Vercel/Netlify/Cloudflare)
- **Dynamic apps** → Vercel/Netlify Edge Functions
- **Global scale** → Cloudflare Workers (0ms cold starts)
- **Enterprise** → AWS Lambda (control & integration)
- **Custom infrastructure** → Node.js adapter

### Optimize for Platform

```typescript
// Vercel - use ISR for dynamic content
vercelAdapter({
  isr: { revalidate: 60 },
});

// Cloudflare - leverage KV for caching
cloudflareAdapter({
  kv: [{ binding: 'CACHE', id: 'xxx' }],
});

// AWS - use ARM64 for cost savings
awsAdapter({
  architecture: 'arm64',
});
```

### Test Locally

```bash
# Vercel
vercel dev

# Netlify
netlify dev

# Cloudflare
wrangler pages dev dist

# Node.js
npm run dev
```

## Troubleshooting

### Build Errors

```bash
# Clear build cache
rm -rf .vercel .netlify .cloudflare dist
npm run build
```

### Adapter Not Found

Make sure `philjs-adapters` is installed:

```bash
npm install philjs-adapters
```

### Environment Variables

Each platform handles environment variables differently:

```typescript
// Vercel/Netlify - use dashboard or CLI
vercel env add API_KEY

// Cloudflare - use wrangler
wrangler secret put API_KEY

// Node.js - use .env file
API_KEY=xxx node server.js
```

## Next Steps

- [Deploy to Vercel →](/docs/deployment/vercel)
- [Deploy to Netlify →](/docs/deployment/netlify)
- [Deploy to Cloudflare →](/docs/deployment/cloudflare)
- [Deploy to AWS →](/docs/deployment/aws)
- [Deploy with Docker →](/docs/deployment/docker)

---

**Tip:** Start with auto-detection for the easiest setup: `autoAdapter()`

**Note:** All adapters are production-ready and optimized for their respective platforms.

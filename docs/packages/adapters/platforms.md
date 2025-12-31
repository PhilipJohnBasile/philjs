# PhilJS Platform Adapters - Complete Implementation

This document provides a comprehensive overview of all platform adapters implemented for PhilJS.

## Overview

PhilJS now includes SvelteKit-style comprehensive platform adapters for major deployment targets:

1. **Cloudflare Pages** - Complete edge platform with KV, D1, R2, Durable Objects
2. **Vercel** - Enhanced Edge and Serverless with ISR, KV, Blob
3. **Netlify** - Edge Functions, Serverless, Blob storage
4. **AWS Lambda** - Full AWS integration with multiple IaC options
5. **Railway** - Docker and Nixpacks deployment

## Cloudflare Pages Adapter

**Location**: `src/cloudflare-pages/index.ts`

### Features

- **KV Namespace**: Global key-value storage with automatic replication
- **D1 Database**: SQLite at the edge with SQL query support
- **R2 Storage**: S3-compatible object storage without egress fees
- **Durable Objects**: Stateful serverless objects with coordination
- **Service Bindings**: Connect multiple Workers together
- **Queue Bindings**: Producer/consumer pattern support
- **Analytics Engine**: Real-time analytics data collection
- **TypeScript Bindings**: Auto-generated types for all bindings

### Usage

```typescript
import { cloudflarePagesAdapter } from '@philjs/adapters/cloudflare-pages';

export default cloudflarePagesAdapter({
  kv: [
    {
      binding: 'CACHE',
      id: 'production-kv-id',
      preview_id: 'preview-kv-id'
    }
  ],
  d1: [
    {
      binding: 'DB',
      database_id: 'xxxx',
      database_name: 'production'
    }
  ],
  r2: [
    {
      binding: 'UPLOADS',
      bucket_name: 'user-uploads'
    }
  ],
  durableObjects: [
    {
      binding: 'COUNTER',
      class_name: 'Counter'
    }
  ],
  queues: {
    producers: [
      { binding: 'TASKS', queue: 'background-tasks' }
    ]
  }
});
```

### Generated Files

- `_worker.js` - Main Worker script
- `_routes.json` - Route configuration for static assets
- `wrangler.toml` - Local development configuration
- `env.d.ts` - TypeScript type definitions

### Helper Functions

```typescript
// KV helpers
const kv = createKVNamespace(env.CACHE);
await kv.put('key', 'value', { expirationTtl: 3600 });

// D1 helpers
const db = createD1Database(env.DB);
const results = await db.prepare('SELECT * FROM users').all();

// R2 helpers
const bucket = createR2Bucket(env.UPLOADS);
await bucket.put('file.txt', 'content');
```

## Vercel Adapter

**Location**: `src/vercel/adapter.ts`

### Features

- **Edge Runtime**: Deploy to Vercel's global edge network
- **Serverless Functions**: Traditional Node.js functions
- **ISR**: Incremental Static Regeneration with on-demand revalidation
- **Vercel KV**: Redis-compatible key-value storage
- **Vercel Blob**: Object storage for files and media
- **Edge Config**: Ultra-low latency configuration
- **Image Optimization**: Automatic image format conversion and resizing
- **Cron Jobs**: Scheduled function execution

### Usage

```typescript
import { vercelAdapter } from '@philjs/adapters/vercel/adapter';

export default vercelAdapter({
  edge: true,
  regions: ['iad1', 'sfo1'],
  maxDuration: 30,
  isr: {
    expiration: 60,
    bypassToken: process.env.REVALIDATE_TOKEN
  },
  kv: {
    database: 'production'
  },
  blob: true,
  edgeConfig: {
    id: process.env.EDGE_CONFIG_ID
  },
  images: {
    domains: ['cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200]
  },
  crons: [
    {
      path: '/api/cron/daily',
      schedule: '0 0 * * *'
    }
  ]
});
```

### Generated Files

- `.vercel/output/config.json` - Build Output API v3 configuration
- `.vercel/output/functions/index.func/` - Function handler
- `.vercel/output/static/` - Static assets
- `types.d.ts` - TypeScript definitions

### Revalidation API

```typescript
import { revalidatePath, revalidateTag } from '@philjs/adapters/vercel/adapter';

// Revalidate specific path
await revalidatePath('/blog/post-1');

// Revalidate by tag
await revalidateTag('blog-posts');
```

## Netlify Adapter

**Location**: `src/netlify/adapter.ts`

### Features

- **Edge Functions**: Deploy to Netlify's edge network with Deno runtime
- **Netlify Functions**: Node.js serverless functions
- **Blob Storage**: Key-value blob storage
- **Form Handling**: Built-in form processing
- **Redirects & Rewrites**: Advanced routing with geo/role conditions
- **Split Testing**: A/B testing support
- **Image CDN**: Automatic image optimization

### Usage

```typescript
import { netlifyAdapter } from '@philjs/adapters/netlify/adapter';

export default netlifyAdapter({
  edge: true,
  blob: true,
  redirects: [
    {
      from: '/old-path',
      to: '/new-path',
      status: 301,
      conditions: {
        country: ['US', 'CA']
      }
    }
  ],
  headers: [
    {
      for: '/api/*',
      values: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    }
  ],
  splitTesting: [
    {
      path: '/landing',
      branches: [
        { branch: 'main', weight: 50 },
        { branch: 'variant-a', weight: 50 }
      ]
    }
  ]
});
```

### Generated Files

- `netlify.toml` - Build and deployment configuration
- `_redirects` - Redirect rules
- `_headers` - HTTP headers configuration
- `edge-functions/` or `functions/` - Function handlers

### Image Optimization

```typescript
import { netlifyImageCDN } from '@philjs/adapters/netlify/adapter';

const url = netlifyImageCDN('/image.jpg', {
  width: 800,
  height: 600,
  fit: 'cover',
  quality: 80
});
```

## AWS Lambda Adapter

**Location**: `src/aws-lambda/index.ts`

### Features

- **Lambda Functions**: Serverless compute on AWS
- **API Gateway**: REST and HTTP APIs
- **CloudFront**: Global CDN integration
- **S3 Static Assets**: Static file hosting with caching
- **Lambda@Edge**: Edge computing for CloudFront
- **ALB Support**: Application Load Balancer integration
- **Multiple IaC Options**: SAM, Serverless Framework, Terraform

### Usage

```typescript
import { awsLambdaAdapter } from '@philjs/adapters/aws-lambda';

export default awsLambdaAdapter({
  region: 'us-east-1',
  runtime: 'nodejs24.x',
  memorySize: 1024,
  timeout: 30,
  integration: 'http-api',
  s3: {
    bucket: 'my-static-assets',
    region: 'us-east-1',
    cacheControl: 'public, max-age=31536000'
  },
  cloudfront: {
    distributionId: 'E1234567890ABC'
  },
  vpc: {
    subnetIds: ['subnet-1', 'subnet-2'],
    securityGroupIds: ['sg-1']
  },
  generateSAM: true,
  generateServerless: true,
  generateTerraform: true
});
```

### Generated Files

- `lambda/index.js` - Lambda handler (API Gateway, HTTP API, ALB, or Lambda@Edge)
- `template.yaml` - AWS SAM template
- `serverless.yml` - Serverless Framework configuration
- `main.tf` - Terraform configuration
- `deploy.sh` - Deployment script

### Integration Types

1. **API Gateway REST API**: Full REST API with stage management
2. **HTTP API**: Simplified HTTP API with lower costs
3. **ALB**: Application Load Balancer integration
4. **Lambda@Edge**: CloudFront edge functions
5. **CloudFront Functions**: Lightweight edge functions

## Railway Adapter

**Location**: `src/railway/index.ts`

### Features

- **Docker Support**: Automated Dockerfile generation
- **Nixpacks**: Automatic buildpack detection
- **Railway.toml**: Configuration management
- **Health Checks**: Built-in health monitoring
- **Graceful Shutdown**: Clean process termination
- **Static Files**: Optimized static asset serving
- **Compression**: gzip compression support

### Usage

```typescript
import { railwayAdapter } from '@philjs/adapters/railway';

export default railwayAdapter({
  docker: {
    baseImage: 'node:24-alpine',
    nodeVersion: '24',
    packages: ['python3', 'make', 'g++'],
    buildArgs: {
      NODE_ENV: 'production'
    }
  },
  railway: {
    buildCommand: 'npm install && npm run build',
    startCommand: 'npm start',
    healthCheckPath: '/health',
    healthCheckInterval: 300,
    restartPolicy: 'on-failure',
    region: 'us-west1'
  },
  nixpacks: {
    packages: ['nodejs', 'npm'],
    buildCommand: 'npm run build'
  },
  gracefulShutdown: {
    timeout: 30000,
    signals: ['SIGTERM', 'SIGINT']
  }
});
```

### Generated Files

- `Dockerfile` - Docker configuration
- `.dockerignore` - Docker ignore patterns
- `railway.toml` - Railway configuration
- `nixpacks.toml` - Nixpacks configuration
- `server.js` - Node.js server with health checks
- `DEPLOY.md` - Deployment guide

## Common Features

All adapters include:

1. **TypeScript Support**: Full type definitions
2. **Build Output**: Optimized production builds
3. **Static Assets**: Efficient static file handling
4. **Environment Variables**: Secure configuration management
5. **Source Maps**: Optional source map generation
6. **Examples**: Working example projects
7. **Documentation**: Comprehensive README files

## Package Exports

All adapters are properly exported in `package.json`:

```json
{
  "exports": {
    "./cloudflare-pages": "./dist/cloudflare-pages/index.js",
    "./vercel/adapter": "./dist/vercel/adapter.js",
    "./netlify/adapter": "./dist/netlify/adapter.js",
    "./aws-lambda": "./dist/aws-lambda/index.js",
    "./railway": "./dist/railway/index.js"
  }
}
```

## Adapter Presets

New presets added to the main package:

```typescript
import { createAdapter } from '@philjs/adapters';

const adapter = createAdapter('railway');
const dockerAdapter = createAdapter('railway-docker');
```

## Examples

Each adapter includes complete example projects:

- `examples/cloudflare-pages/` - Cloudflare Pages with KV, D1, R2
- `examples/vercel/` - Vercel with Edge Functions and ISR
- `examples/netlify/` - Netlify with Edge Functions and Blob
- `examples/aws-lambda/` - AWS Lambda with SAM template
- `examples/railway/` - Railway with Docker configuration

## Testing

All adapters support local development:

```bash
# Cloudflare Pages
wrangler pages dev .cloudflare

# Vercel
vercel dev

# Netlify
netlify dev

# AWS Lambda
sam local start-api

# Railway
railway run npm start
```

## Migration Guide

### From Basic Cloudflare to Cloudflare Pages

```typescript
// Before
import { cloudflareAdapter } from '@philjs/adapters/cloudflare';

// After
import { cloudflarePagesAdapter } from '@philjs/adapters/cloudflare-pages';
```

### From Basic Vercel to Enhanced Vercel

```typescript
// Before
import { vercelAdapter } from '@philjs/adapters/vercel';

// After
import { vercelAdapter } from '@philjs/adapters/vercel/adapter';
```

## Performance Optimizations

Each adapter includes platform-specific optimizations:

1. **Cloudflare**: Global edge caching, KV for session storage
2. **Vercel**: Edge caching, ISR for dynamic content
3. **Netlify**: Edge Functions for low latency
4. **AWS Lambda**: Provisioned concurrency, Lambda layers
5. **Railway**: Docker multi-stage builds, compression

## Security Features

All adapters implement security best practices:

- HTTPS-only deployment
- Security headers (CSP, HSTS, etc.)
- Environment variable encryption
- VPC support (AWS)
- Authentication middleware hooks

## Monitoring & Logging

Built-in support for platform monitoring:

- **Cloudflare**: Analytics Engine, Workers Analytics
- **Vercel**: Analytics, Web Vitals
- **Netlify**: Analytics, Function logs
- **AWS**: CloudWatch, X-Ray tracing
- **Railway**: Built-in metrics and logs

## Cost Optimization

Each adapter optimizes for platform pricing:

- Efficient bundling to reduce cold starts
- Static asset caching to reduce function invocations
- Edge caching to minimize origin requests
- Resource sizing recommendations

## Next Steps

1. Review individual adapter documentation
2. Choose the appropriate adapter for your deployment target
3. Configure environment variables
4. Deploy your PhilJS application
5. Monitor performance and optimize as needed

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/philjs/issues
- Documentation: https://philjs.dev
- Discord: https://discord.gg/philjs

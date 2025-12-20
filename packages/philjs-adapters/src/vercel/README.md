# PhilJS Vercel Adapter

Deploy your PhilJS application to Vercel with full support for Edge Functions, Serverless Functions, ISR, KV, and Blob storage.

## Features

- **Edge Runtime**: Deploy to Vercel's global edge network
- **Serverless Functions**: Traditional Node.js serverless functions
- **ISR (Incremental Static Regeneration)**: Automatic cache revalidation
- **Vercel KV**: Redis-compatible key-value storage
- **Vercel Blob**: Object storage for files and media
- **Edge Config**: Ultra-low latency configuration
- **Image Optimization**: Automatic image optimization
- **Cron Jobs**: Scheduled function execution

## Installation

```bash
npm install philjs-adapters
```

## Basic Usage

### Edge Runtime

```typescript
import { vercelAdapter } from 'philjs-adapters/vercel/adapter';

export default vercelAdapter({
  edge: true,
  regions: ['iad1', 'sfo1'],
  maxDuration: 30
});
```

### Serverless Functions

```typescript
import { vercelAdapter } from 'philjs-adapters/vercel/adapter';

export default vercelAdapter({
  edge: false,
  memory: 1024,
  maxDuration: 60,
  nodeVersion: '20.x'
});
```

## Configuration

### ISR (Incremental Static Regeneration)

```typescript
vercelAdapter({
  isr: {
    expiration: 60, // Revalidate every 60 seconds
    allowQuery: true,
    bypassToken: process.env.REVALIDATE_TOKEN
  }
});

// Trigger revalidation
await revalidatePath('/blog/post-1');
await revalidateTag('blog-posts');
```

### Vercel KV

```typescript
vercelAdapter({
  kv: {
    database: 'production',
    env: 'production'
  }
});

// Usage in your app
const value = await kv.get('key');
await kv.set('key', 'value', { ex: 3600 });
```

### Vercel Blob

```typescript
vercelAdapter({
  blob: {
    token: process.env.BLOB_READ_WRITE_TOKEN
  }
});

// Usage in your app
const blob = await put('avatar.png', file, { access: 'public' });
await del(blob.url);
```

### Image Optimization

```typescript
vercelAdapter({
  images: {
    domains: ['example.com', 'cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96]
  }
});
```

### Cron Jobs

```typescript
vercelAdapter({
  crons: [
    {
      path: '/api/cron/daily',
      schedule: '0 0 * * *' // Daily at midnight
    },
    {
      path: '/api/cron/hourly',
      schedule: '0 * * * *' // Every hour
    }
  ]
});
```

### Redirects & Rewrites

```typescript
vercelAdapter({
  redirects: [
    {
      source: '/old-path',
      destination: '/new-path',
      permanent: true
    }
  ],
  rewrites: [
    {
      source: '/api/:path*',
      destination: 'https://api.example.com/:path*'
    }
  ],
  headers: [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' }
      ]
    }
  ]
});
```

## Deployment

### Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy

# Deploy to production
vercel --prod
```

### Using GitHub Integration

1. Connect your repository to Vercel
2. Push to your repository
3. Vercel automatically builds and deploys

## Environment Variables

Set in Vercel dashboard or `.env.local`:

```bash
# Vercel KV
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-token

# Edge Config
EDGE_CONFIG=your-edge-config-id
```

## Examples

### Edge Function with KV

```typescript
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const count = await kv.incr('page-views');
  return new Response(`Page views: ${count}`);
}
```

### Serverless with Blob

```typescript
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const file = req.body;
  const blob = await put('upload.jpg', file, {
    access: 'public',
  });

  res.json({ url: blob.url });
}
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

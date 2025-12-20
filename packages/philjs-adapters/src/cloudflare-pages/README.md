# PhilJS Cloudflare Pages Adapter

Deploy your PhilJS application to Cloudflare Pages with full support for KV, D1, R2, Durable Objects, and more.

## Features

- **KV Namespace**: Key-value storage with global replication
- **D1 Database**: SQLite databases at the edge
- **R2 Storage**: S3-compatible object storage
- **Durable Objects**: Stateful serverless objects
- **Service Bindings**: Connect to other Workers
- **Queue Bindings**: Producer and consumer support
- **Analytics Engine**: Real-time analytics data
- **Global Edge Network**: Deploy to 300+ cities worldwide

## Installation

```bash
npm install philjs-adapters
```

## Basic Usage

```typescript
import { cloudflarePagesAdapter } from 'philjs-adapters/cloudflare-pages';

export default cloudflarePagesAdapter({
  outDir: '.cloudflare',
  kv: [
    { binding: 'MY_KV', id: 'your-kv-id' }
  ],
  d1: [
    {
      binding: 'MY_DB',
      database_id: 'your-db-id',
      database_name: 'my-database'
    }
  ]
});
```

## Configuration

### KV Namespace

```typescript
cloudflarePagesAdapter({
  kv: [
    {
      binding: 'CACHE',
      id: 'production-id',
      preview_id: 'preview-id'
    }
  ]
});

// Usage in your app
const value = await env.CACHE.get('key');
await env.CACHE.put('key', 'value', { expirationTtl: 3600 });
```

### D1 Database

```typescript
cloudflarePagesAdapter({
  d1: [
    {
      binding: 'DB',
      database_id: 'your-database-id',
      database_name: 'production',
      preview_database_id: 'preview-database-id'
    }
  ]
});

// Usage in your app
const results = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
  .bind(userId)
  .all();
```

### R2 Storage

```typescript
cloudflarePagesAdapter({
  r2: [
    {
      binding: 'BUCKET',
      bucket_name: 'my-bucket',
      preview_bucket_name: 'preview-bucket'
    }
  ]
});

// Usage in your app
await env.BUCKET.put('file.txt', 'content');
const file = await env.BUCKET.get('file.txt');
```

### Durable Objects

```typescript
cloudflarePagesAdapter({
  durableObjects: [
    {
      binding: 'COUNTER',
      class_name: 'Counter',
      script_name: 'counter-worker'
    }
  ]
});
```

### Queues

```typescript
cloudflarePagesAdapter({
  queues: {
    producers: [
      { binding: 'MY_QUEUE', queue: 'my-queue' }
    ],
    consumers: [
      {
        queue: 'my-queue',
        max_batch_size: 10,
        max_batch_timeout: 30,
        max_retries: 3
      }
    ]
  }
});
```

## Deployment

### Using Wrangler CLI

1. Install Wrangler:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy:
```bash
wrangler pages deploy .cloudflare
```

### Using GitHub Integration

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `.cloudflare`
4. Deploy automatically on push

## Environment Variables

Set environment variables in wrangler.toml or Cloudflare dashboard:

```toml
[vars]
API_KEY = "your-api-key"
ENVIRONMENT = "production"
```

## Local Development

```bash
# Start local dev server
wrangler pages dev .cloudflare

# With KV and D1
wrangler pages dev .cloudflare --kv=MY_KV --d1=MY_DB
```

## TypeScript Support

The adapter generates TypeScript bindings automatically in `env.d.ts`:

```typescript
interface Env {
  MY_KV: KVNamespace;
  MY_DB: D1Database;
  BUCKET: R2Bucket;
}
```

## Examples

See the [examples directory](../examples/cloudflare-pages) for complete working examples.

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

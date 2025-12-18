# philjs-adapters

Deployment adapters for PhilJS - Deploy to Vercel, Netlify, Cloudflare, AWS, or any Node.js server.

## Features

- **Vercel** - Deploy to Vercel with Edge Functions and ISR
- **Netlify** - Deploy to Netlify with Edge Functions
- **Cloudflare Workers** - Deploy to Cloudflare Pages and Workers
- **AWS Lambda** - Deploy to AWS with Lambda and API Gateway
- **Node.js** - Deploy to any Node.js server (Express, Fastify, etc.)
- **Static** - Generate static sites (SSG)
- **SSR Support** - Full server-side rendering on all platforms
- **Edge Functions** - Deploy to the edge for low latency
- **Automatic Configuration** - Zero-config deployment

## Installation

```bash
pnpm add philjs-adapters
```

## Adapters

### Vercel

Deploy your PhilJS app to Vercel.

#### Setup

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import vercel from 'philjs-adapters/vercel';

export default defineConfig({
  plugins: [
    philjs(),
    vercel({
      edge: true, // Use Edge Functions
      isr: {
        expiration: 60 // ISR revalidation time in seconds
      }
    })
  ]
});
```

#### Deploy

```bash
pnpm build
vercel deploy
```

### Netlify

Deploy your PhilJS app to Netlify.

#### Setup

Create `netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[functions]
  directory = "dist/functions"
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import netlify from 'philjs-adapters/netlify';

export default defineConfig({
  plugins: [
    philjs(),
    netlify({
      edge: true // Use Edge Functions
    })
  ]
});
```

#### Deploy

```bash
pnpm build
netlify deploy --prod
```

### Cloudflare Workers

Deploy to Cloudflare Pages or Workers.

#### Setup

Create `wrangler.toml`:

```toml
name = "my-philjs-app"
main = "dist/worker.js"
compatibility_date = "2024-01-01"

[site]
bucket = "dist/client"
```

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import cloudflare from 'philjs-adapters/cloudflare';

export default defineConfig({
  plugins: [
    philjs(),
    cloudflare({
      routes: true, // Generate routes manifest
      kvNamespaces: ['MY_KV'] // KV namespace bindings
    })
  ]
});
```

#### Deploy

```bash
pnpm build
wrangler deploy
```

### AWS Lambda

Deploy to AWS Lambda with API Gateway.

#### Setup

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import aws from 'philjs-adapters/aws';

export default defineConfig({
  plugins: [
    philjs(),
    aws({
      region: 'us-east-1',
      runtime: 'nodejs20.x'
    })
  ]
});
```

Create `serverless.yml` or use AWS SAM:

```yaml
service: my-philjs-app

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1

functions:
  app:
    handler: dist/server/index.handler
    events:
      - httpApi: '*'

plugins:
  - serverless-s3-sync

custom:
  s3Sync:
    - bucketName: my-app-assets
      localDir: dist/client
```

#### Deploy

```bash
pnpm build
serverless deploy
```

### Node.js

Deploy to any Node.js server.

#### Setup

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import node from 'philjs-adapters/node';

export default defineConfig({
  plugins: [
    philjs(),
    node({
      port: 3000,
      compression: true
    })
  ]
});
```

Create `server.js`:

```javascript
import { createServer } from 'philjs-adapters/node';
import handler from './dist/server/index.js';

const server = createServer(handler, {
  port: process.env.PORT || 3000,
  static: './dist/client'
});

server.listen();
```

#### Deploy

```bash
pnpm build
node server.js
```

### Static (SSG)

Generate a fully static site.

#### Setup

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import staticAdapter from 'philjs-adapters/static';

export default defineConfig({
  plugins: [
    philjs(),
    staticAdapter({
      pages: [
        '/',
        '/about',
        '/blog',
        '/contact'
      ],
      // Or use dynamic route generation
      dynamicRoutes: async () => {
        const posts = await fetchPosts();
        return posts.map(post => `/blog/${post.slug}`);
      }
    })
  ]
});
```

#### Build

```bash
pnpm build
```

Output will be in `dist/` ready to deploy to any static host (GitHub Pages, S3, Netlify, etc.).

## Adapter Options

### Vercel

```typescript
{
  edge?: boolean;              // Use Edge Functions (default: false)
  isr?: {
    expiration?: number;       // ISR revalidation time in seconds
  };
  regions?: string[];          // Deployment regions
  memory?: number;             // Function memory in MB
  maxDuration?: number;        // Max execution time in seconds
}
```

### Netlify

```typescript
{
  edge?: boolean;              // Use Edge Functions (default: false)
  redirects?: Array<{
    from: string;
    to: string;
    status?: number;
  }>;
}
```

### Cloudflare

```typescript
{
  routes?: boolean;            // Generate routes manifest (default: true)
  kvNamespaces?: string[];     // KV namespace bindings
  d1Databases?: string[];      // D1 database bindings
  r2Buckets?: string[];        // R2 bucket bindings
}
```

### AWS

```typescript
{
  region?: string;             // AWS region (default: 'us-east-1')
  runtime?: string;            // Node.js runtime version
  memorySize?: number;         // Lambda memory in MB
  timeout?: number;            // Lambda timeout in seconds
}
```

### Node.js

```typescript
{
  port?: number;               // Server port (default: 3000)
  compression?: boolean;       // Enable gzip compression (default: true)
  static?: string;             // Static files directory
  middleware?: Function[];     // Custom middleware
}
```

### Static

```typescript
{
  pages?: string[];            // Static pages to generate
  dynamicRoutes?: () => Promise<string[]>; // Dynamic route generator
  trailingSlash?: boolean;     // Add trailing slashes (default: false)
  prerenderAll?: boolean;      // Prerender all routes (default: false)
}
```

## Environment Variables

Each adapter supports environment variables for configuration:

```bash
# Vercel
VERCEL_ENV=production

# Netlify
NETLIFY_ENV=production
CONTEXT=production

# Cloudflare
CF_PAGES=1
CF_PAGES_BRANCH=main

# AWS
AWS_REGION=us-east-1
AWS_LAMBDA_FUNCTION_NAME=my-app

# Node.js
NODE_ENV=production
PORT=3000
```

## Custom Adapters

Create your own adapter:

```typescript
import { defineAdapter } from 'philjs-adapters';

export default defineAdapter({
  name: 'my-adapter',

  async adapt({ outDir, config }) {
    // Custom build logic
    console.log('Building for my platform...');

    // Generate platform-specific files
    await generateFiles(outDir, config);

    return {
      success: true,
      files: ['server.js', 'client/']
    };
  }
});
```

## Documentation

For more information, see:
- [Deployment Guide](../../docs/deployment/overview.md)
- [Vercel Deployment](../../docs/deployment/vercel.md)
- [Netlify Deployment](../../docs/deployment/netlify.md)
- [Cloudflare Deployment](../../docs/deployment/cloudflare.md)

## Examples

See the [examples](../../examples) directory for deployment examples.

## License

MIT

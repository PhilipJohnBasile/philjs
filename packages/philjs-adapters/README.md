# philjs-adapters

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Deployment adapters for PhilJS - Deploy anywhere: Vercel, Netlify, Cloudflare, AWS, Bun, Deno, or any Node.js server.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Vercel** - Deploy to Vercel with Edge Functions and ISR
- **Netlify** - Deploy to Netlify with Edge Functions
- **Cloudflare Workers** - Deploy to Cloudflare Pages and Workers
- **AWS Lambda** - Deploy to AWS with Lambda and API Gateway
- **Node.js** - Deploy to any Node.js server (Express, Fastify, etc.)
- **Bun** - Native Bun.serve() with SQLite and WebSocket support
- **Deno** - Deno.serve() with KV storage and Deno Deploy ready
- **Static** - Generate static sites (SSG)
- **SSR Support** - Full server-side rendering on all platforms
- **Edge Functions** - Deploy to the edge for low latency
- **Automatic Configuration** - Zero-config deployment
- **Runtime Detection** - Automatically detect and use the best runtime

## Installation

```bash
pnpm add philjs-adapters
```

## Adapters

### Cloudflare Pages (Enhanced)

Deploy to Cloudflare Pages with full support for KV, D1, R2, Durable Objects, and more.

#### Features
- KV Namespace storage
- D1 SQLite databases
- R2 object storage
- Durable Objects
- Queue bindings
- Analytics Engine
- Service bindings

#### Setup

```typescript
import { cloudflarePagesAdapter } from 'philjs-adapters/cloudflare-pages';

export default cloudflarePagesAdapter({
  kv: [
    { binding: 'CACHE', id: 'your-kv-id' }
  ],
  d1: [
    { binding: 'DB', database_id: 'your-db-id', database_name: 'production' }
  ],
  r2: [
    { binding: 'UPLOADS', bucket_name: 'my-uploads' }
  ]
});
```

See [Cloudflare Pages documentation](./src/cloudflare-pages/README.md) for details.

### Vercel (Enhanced)

Deploy to Vercel with Edge Functions, Serverless, ISR, KV, and Blob storage.

#### Features
- Edge Runtime
- Serverless Functions
- ISR (Incremental Static Regeneration)
- Vercel KV (Redis)
- Vercel Blob
- Edge Config
- Image Optimization
- Cron Jobs

#### Setup

```typescript
import { vercelAdapter } from 'philjs-adapters/vercel/adapter';

export default vercelAdapter({
  edge: true,
  isr: { expiration: 60 },
  kv: { database: 'production' },
  blob: true,
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp']
  }
});
```

See [Vercel documentation](./src/vercel/README.md) for details.

### Netlify (Enhanced)

Deploy to Netlify with Edge Functions, Serverless Functions, and Blob storage.

#### Features
- Edge Functions
- Netlify Functions
- Blob Storage
- Form Handling
- Redirects & Rewrites
- Split Testing
- Image CDN

#### Setup

```typescript
import { netlifyAdapter } from 'philjs-adapters/netlify/adapter';

export default netlifyAdapter({
  edge: true,
  blob: true,
  redirects: [
    { from: '/old', to: '/new', status: 301 }
  ],
  headers: [
    { for: '/*', values: { 'X-Frame-Options': 'DENY' } }
  ]
});
```

See [Netlify documentation](./src/netlify/README.md) for details.

### AWS Lambda

Deploy to AWS Lambda with API Gateway, CloudFront, and S3 support.

#### Features
- Lambda Functions
- API Gateway (REST & HTTP)
- CloudFront CDN
- S3 Static Assets
- Lambda@Edge
- ALB Support
- SAM/Serverless/Terraform templates

#### Setup

```typescript
import { awsLambdaAdapter } from 'philjs-adapters/aws-lambda';

export default awsLambdaAdapter({
  region: 'us-east-1',
  runtime: 'nodejs20.x',
  integration: 'http-api',
  s3: {
    bucket: 'my-static-assets'
  },
  generateSAM: true
});
```

See [AWS Lambda documentation](./src/aws-lambda/README.md) for details.

### Railway

Deploy to Railway with Docker and Nixpacks support.

#### Features
- Docker configuration
- Nixpacks support
- Railway.toml generation
- Health checks
- Graceful shutdown
- Static file serving
- Auto-scaling

#### Setup

```typescript
import { railwayAdapter } from 'philjs-adapters/railway';

export default railwayAdapter({
  docker: {
    baseImage: 'node:20-alpine',
    packages: ['python3', 'make']
  },
  railway: {
    healthCheckPath: '/health',
    restartPolicy: 'on-failure'
  }
});
```

See [Railway documentation](./src/railway/README.md) for details.

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

### Bun

Deploy your PhilJS app using Bun's native server.

#### Setup

Create `server.ts`:

```typescript
import { createBunAdapter } from 'philjs-adapters/bun';

const handler = createBunAdapter({
  port: 3000,
  staticDir: 'public',
  compression: true,
  websocket: {
    enabled: true,
  },
});

// Export for Bun.serve
export default handler;

// Or start directly
// handler.start();
```

#### Run

```bash
# Development with hot reload
bun run --hot server.ts

# Production
bun run server.ts
```

#### Features

- **Native Bun.serve()** - Uses Bun's high-performance HTTP server
- **Fast File Serving** - Leverages Bun's native file API
- **SQLite Support** - Built-in SQLite via Bun's native bindings
- **WebSocket Support** - Full WebSocket server capabilities
- **Hot Reload** - Development mode with instant updates
- **Compression** - Built-in gzip compression

#### SQLite Example

```typescript
import { createBunSQLite } from 'philjs-adapters/bun';

const db = createBunSQLite('./data/app.db');

// Create table
db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)`);

// Query
const users = db.query('SELECT * FROM users');

// Insert
db.run('INSERT INTO users (name) VALUES (?)', ['John']);
```

#### WebSocket Example

```typescript
import { createBunAdapter, onWebSocketMessage, onWebSocketOpen } from 'philjs-adapters/bun';

const handler = createBunAdapter({
  port: 3000,
  websocket: { enabled: true },
});

onWebSocketOpen(handler, (ws) => {
  console.log('Client connected');
  ws.send('Welcome!');
});

onWebSocketMessage(handler, (ws, message) => {
  console.log('Received:', message);
  ws.send(`Echo: ${message}`);
});

handler.start();
```

### Deno

Deploy your PhilJS app using Deno's native server, with Deno Deploy support.

#### Setup

Create `server.ts`:

```typescript
import { createDenoAdapter } from 'philjs-adapters/deno';

const handler = createDenoAdapter({
  port: 8000,
  staticDir: 'public',
  compression: true,
  kv: true, // Enable Deno KV
});

// Use with Deno.serve
Deno.serve({ port: 8000 }, handler);
```

#### Run

```bash
# Development
deno run --allow-net --allow-read --watch server.ts

# With Deno KV
deno run --allow-net --allow-read --unstable-kv server.ts

# Production
deno run --allow-net --allow-read server.ts
```

#### Deploy to Deno Deploy

```bash
deployctl deploy --project=your-project server.ts
```

#### Features

- **Deno.serve()** - Uses Deno's native HTTP server
- **Deno KV** - Built-in key-value storage with TTL support
- **Deno Deploy Ready** - Zero-config deployment to the edge
- **Permission-Aware** - Respects Deno's security model
- **npm Compatibility** - Use npm packages with Deno

#### Deno KV Example

```typescript
import { createDenoKV } from 'philjs-adapters/deno';

const kv = await createDenoKV();

// Set value
await kv.set(['users', 'user-1'], { name: 'John' });

// Get value
const user = await kv.get(['users', 'user-1']);

// Set with TTL (expires in 60 seconds)
await kv.setWithTTL(['cache', 'data'], { value: 'cached' }, 60000);

// List by prefix
const allUsers = await kv.list(['users']);
```

#### Permission Checking

```typescript
import { checkPermissions, requestPermission } from 'philjs-adapters/deno';

const perms = await checkPermissions();

if (!perms.net) {
  const granted = await requestPermission('net');
  if (!granted) {
    console.error('Network permission required');
    Deno.exit(1);
  }
}
```

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

### Bun

```typescript
{
  port?: number;               // Server port (default: 3000)
  hostname?: string;           // Hostname to bind (default: '0.0.0.0')
  development?: boolean;       // Enable dev mode (default: NODE_ENV !== 'production')
  staticDir?: string;          // Static files directory (default: 'public')
  compression?: boolean;       // Enable gzip compression (default: true)
  sqlite?: string;             // SQLite database path
  websocket?: {
    enabled?: boolean;         // Enable WebSocket support
    maxPayloadLength?: number; // Max message size (default: 16MB)
    idleTimeout?: number;      // Connection idle timeout (default: 120s)
  };
  tls?: {
    key: string;               // Path to TLS key file
    cert: string;              // Path to TLS certificate file
  };
  maxRequestBodySize?: number; // Max request body size (default: 128MB)
  idleTimeout?: number;        // Request idle timeout (default: 10s)
}
```

### Deno

```typescript
{
  port?: number;               // Server port (default: 8000)
  hostname?: string;           // Hostname to bind (default: '0.0.0.0')
  kv?: boolean | string;       // Enable Deno KV (true or path to KV database)
  staticDir?: string;          // Static files directory (default: 'public')
  compression?: boolean;       // Enable compression (default: true)
  deploy?: {
    project?: string;          // Deno Deploy project name
    edgeCache?: boolean;       // Enable edge caching
    kvDatabase?: string;       // KV database name
  };
  tls?: {
    key: string;               // Path to TLS key file
    cert: string;              // Path to TLS certificate file
  };
  signal?: AbortSignal;        // Signal for graceful shutdown
  onListen?: (params: { hostname: string; port: number }) => void;
  onError?: (error: Error) => Response | Promise<Response>;
}
```

## Runtime Detection

Automatically detect the current JavaScript runtime:

```typescript
import {
  detectRuntime,
  getRuntimeInfo,
  isBun,
  isDeno,
  isNode,
  hasFeature,
} from 'philjs-adapters';

// Get current runtime
const runtime = detectRuntime(); // 'bun' | 'deno' | 'node' | 'edge' | 'browser'

// Check specific runtime
if (isBun()) {
  console.log('Running in Bun');
}

if (isDeno()) {
  console.log('Running in Deno');
}

// Get detailed runtime info
const info = getRuntimeInfo();
console.log(info.runtime);  // 'bun'
console.log(info.version);  // '1.0.0'
console.log(info.features); // { fetch: true, webSocket: true, sqlite: true, ... }

// Check feature support
if (hasFeature('sqlite')) {
  console.log('SQLite is available');
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

# Bun
NODE_ENV=production
PORT=3000

# Deno
DENO_ENV=production
PORT=8000
DENO_DEPLOYMENT_ID=xxx    # Set automatically on Deno Deploy
DENO_REGION=us-east-1     # Set automatically on Deno Deploy
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

See the [examples](./examples) directory for adapter-specific examples:

- [Bun Examples](./examples/bun) - Bun server with WebSocket and SQLite
- [Deno Examples](./examples/deno) - Deno server with KV storage

### Quick Start - Bun

```bash
cd examples/bun
bun install
bun run dev
```

### Quick Start - Deno

```bash
cd examples/deno
deno task dev
```

## Presets

Use presets for common configurations:

```typescript
import { createAdapter } from 'philjs-adapters';

// Bun presets
const bunAdapter = createAdapter('bun');
const bunWsAdapter = createAdapter('bun-websocket');

// Deno presets
const denoAdapter = createAdapter('deno');
const denoKvAdapter = createAdapter('deno-kv');
const denoDeployAdapter = createAdapter('deno-deploy');

// Other presets
const vercelEdge = createAdapter('vercel-edge');
const cloudflarePages = createAdapter('cloudflare-pages');
const awsLambda = createAdapter('aws-lambda');
```

## Auto-Detection

The `autoAdapter` function automatically detects the runtime and platform:

```typescript
import { autoAdapter } from 'philjs-adapters';

// Automatically uses the correct adapter based on environment
const adapter = autoAdapter();

// Detection order:
// 1. Bun (if Bun global is present)
// 2. Deno (if Deno global is present)
// 3. Vercel (if VERCEL env var is set)
// 4. Netlify (if NETLIFY env var is set)
// 5. Cloudflare (if CF_PAGES or CLOUDFLARE_WORKERS env var is set)
// 6. AWS (if AWS_LAMBDA_FUNCTION_NAME or AWS_EXECUTION_ENV env var is set)
// 7. Node.js (default)
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./vercel, ./netlify, ./cloudflare, ./aws, ./node, ./static, ./bun, ./deno, ./runtime-detect, ./cloudflare-pages, ./vercel/adapter, ./netlify/adapter, ./aws-lambda, ./railway, ./edge, ./adapters/vercel, ./adapters/cloudflare, ./adapters/deno-deploy, ./adapters/netlify, ./adapters/aws-lambda, ./adapters/node, ./adapters/bun, ./utils/build, ./utils/env
- Source files: packages/philjs-adapters/src/index.ts, packages/philjs-adapters/src/vercel/index.ts, packages/philjs-adapters/src/netlify/index.ts, packages/philjs-adapters/src/cloudflare/index.ts, packages/philjs-adapters/src/aws/index.ts, packages/philjs-adapters/src/node/index.ts, packages/philjs-adapters/src/static/index.ts, packages/philjs-adapters/src/bun/index.ts, packages/philjs-adapters/src/deno/index.ts, packages/philjs-adapters/src/runtime-detect.ts, packages/philjs-adapters/src/cloudflare-pages/index.ts, packages/philjs-adapters/src/vercel/adapter.ts, packages/philjs-adapters/src/netlify/adapter.ts, packages/philjs-adapters/src/aws-lambda/index.ts, packages/philjs-adapters/src/railway/index.ts, packages/philjs-adapters/src/edge/index.ts, packages/philjs-adapters/src/adapters/vercel.ts, packages/philjs-adapters/src/adapters/cloudflare.ts, packages/philjs-adapters/src/adapters/deno-deploy.ts, packages/philjs-adapters/src/adapters/netlify.ts, packages/philjs-adapters/src/adapters/aws-lambda.ts, packages/philjs-adapters/src/adapters/node.ts, packages/philjs-adapters/src/adapters/bun.ts, packages/philjs-adapters/src/utils/build.ts, packages/philjs-adapters/src/utils/env.ts

### Public API
- Direct exports: ${wrapper, APIGatewayConfig, AWSConfig, AWSLambdaAdapterConfig, AWSLambdaConfig, AWSLambdaContext, AdapterPreset, AnalyticsEngineBinding, AssetManifestEntry, AuthorizationConfig, BackgroundFunctionConfig, BlobListOptions, BlobListResult, BlobObject, BlobPutOptions, BuildConfig, BuildManifest, BuildManifestOptions, BunAdapterConfig, BunConfig, BunOptimizations, BunServer, BunServerHandler, BunWebSocket, BunWebSocketConfig, BunWebSocketHandlers, CORSConfig, CacheBehavior, CloudFrontConfig, CloudflareAdapterConfig, CloudflareConfig, CloudflarePagesConfig, ClusterConfig, CronConfig, CronTrigger, D1Database, D1DatabaseBinding, D1ExecResult, D1PreparedStatement, D1Result, DenoCompilerOptions, DenoConfig, DenoDeployAdapterConfig, DenoDeployConfig, DenoDeployRegion, DenoFmtConfig, DenoKVAtomicWrapper, DenoKVConfig, DenoKVWrapper, DenoKv, DenoKvAtomic, DenoLintConfig, DenoServeHandler, DenoServeHandlerInfo, DevConfig, DurableObjectBinding, EnhancedAdapterPreset, EnvConfig, EnvDefinition, ExecutionContext, FreshConfig, FunctionRouteConfig, FunctionUrlConfig, HeaderConfig, ISRConfig, ImageOptimizationConfig, ImportMapConfig, KVNamespace, KVNamespaceBinding, KVNamespaceListOptions, KVNamespaceListResult, KVNamespacePutOptions, LifecycleRule, LoadedEnv, LoggingConfig, MIME_TYPES, MiddlewareConfig, NetlifyAccount, NetlifyAdapterConfig, NetlifyBlob, NetlifyBuildConfig, NetlifyConfig, NetlifyContextConfig, NetlifyGeo, NetlifyHeaderConfig, NetlifyImageConfig, NetlifyPluginConfig, NetlifyRedirectConfig, NetlifyRegion, NetlifySite, NetlifyUser, NodeAdapterConfig, NodeConfig, OptimizeAssetsOptions, PhilJSStack, PlacementConfig, QueueBinding, R2Bucket, R2BucketBinding, R2Conditional, R2GetOptions, R2HTTPMetadata, R2ListOptions, R2Object, R2ObjectBody, R2Objects, R2PutOptions, R2Range, RailwayConfig, RedirectConfig, RewriteConfig, RouteConfig, RouteManifestEntry, Runtime, RuntimeFeatures, RuntimeInfo, S3Config, S3Helpers, SQLiteConfig, ScheduledFunctionConfig, SecretsManager, ServiceBinding, SiteConfig, StaticConfig, VPCConfig, VercelAdapterConfig, VercelBlob, VercelConfig, VercelEdgeConfig, VercelKV, VercelRegion, WebSocketConfig, assertRuntime, autoAdapter, awsAdapter, awsLambdaAdapter, bunAdapter, bunFile, bunHash, bunVerify, checkDenoPermissions, checkPermissions, cloudflareAdapter, cloudflarePagesAdapter, config, copyStaticAssets, createAdapter, createBuildManifest, createBunAdapter, createBunHandler, createBunSQLite, createD1Database, createD1Helper, createDenoAdapter, createDenoKV, createEnhancedAdapter, createEnvSecretsManager, createExpressMiddleware, createFastifyPlugin, createFormsHandler, createKVHelper, createKVNamespace, createMemorySecretsManager, createOutputStructure, createR2Bucket, createR2Helper, createVercelEdgeConfig, defineAdapter, denoAdapter, denoDeployAdapter, detectRuntime, enhancedPresets, generateEnvTypes, generateHashedFilename, getAWSContext, getAWSLambdaContext, getAWSRequestId, getCacheControl, getCloudflareEnv, getDenoDeployRegion, getDenoKV, getDurableObject, getEnv, getExecutionContext, getFileHash, getMode, getNetlifyContext, getNetlifyIdentityUser, getRemainingTimeMs, getRequestId, getRuntimeInfo, getS3AssetUrl, getStaticPaths, getVercelContext, handler, hasFeature, injectEnvVariables, isBrowser, isBun, isDeno, isDenoDeply, isDevelopment, isEdge, isImmutableAsset, isNode, isProduction, isServer, loadEnvFile, loadEnvironment, netlifyAdapter, netlifyImageCDN, nodeAdapter, onWebSocketClose, onWebSocketMessage, onWebSocketOpen, optimizeAssets, passThroughOnException, platformEnv, prerender, presets, railwayAdapter, requestDenoPermission, requestPermission, revalidatePath, revalidateTag, signCloudFrontUrl, startDenoServer, startServer, staticAdapter, validateEnv, vercelAdapter, vercelImageUrl, waitUntil
- Re-exported names: // A/B testing
  selectGeoVariant, // Asset caching
  createAssetCache, // Cache Types
  CacheEntry, // Cache class
  EdgeCache, // Caching
  EdgeCache, // Cold start
  isColdStart, // Default cache
  getDefaultCache, // Default exports
  edgeRuntime, // Distance
  calculateDistance, // ESI
  parseESITags, // Edge Runtime
  detectEdgePlatform, // Edge Runtime Types
  EdgePlatform, // Environment
  createEdgeEnv, // Geo Types
  GeoLocation, // Geo extraction
  getGeoLocation, // Geo routing
  applyGeoRouting, // Geolocation
  getGeoLocation, // HTML streaming
  createHTMLStream, // Handler
  createEdgeHandler, // Platform detection
  detectEdgePlatform, // Region routing
  findBestRegion, // Response caching
  createCacheKey, // SSE
  createSSEStream, // Stream creation
  createWritableStream, // Streaming
  createWritableStream, // Streaming Types
  StreamingConfig, // Types
  type CacheEntry, // Types
  type EdgePlatform, // Types
  type GeoLocation, // Types
  type StreamingConfig, // Utilities
  addGeoHeaders, // Utilities
  streamThrough, APIGatewayConfig, AWSConfig, AWSLambdaAdapterConfig, AWSLambdaConfig, AWSLambdaContext, Adapter, AdapterConfig, AssetCacheOptions, AssetManifestEntry, AuthorizationConfig, BackgroundFunctionConfig, BuildManifest, BuildManifestOptions, BuildOutput, BunAdapterConfig, BunConfig, BunOptimizations, BunServer, BunServerHandler, BunWebSocket, BunWebSocketConfig, CORSConfig, CacheBehavior, CacheOptions, CacheStats, CloudFrontConfig, CloudflareAdapterConfig, CloudflareConfig, CloudflarePagesConfig, CloudflareRouteConfig, ClusterConfig, ColdStartConfig, CronConfig, D1Database, D1DatabaseBinding, D1PreparedStatement, DenoCompilerOptions, DenoConfig, DenoDeployAdapterConfig, DenoDeployConfig, DenoDeployRegion, DenoKVAtomicWrapper, DenoKVConfig, DenoKVWrapper, DenoKv, DenoServeHandler, DurableObjectBinding, ESIFragment, EdgeAdapter, EdgeCacheConfig, EdgeContext, EdgeEnv, EdgeExecutionContext, EdgeHandlerOptions, EdgeKVListOptions, EdgeKVListResult, EdgeKVNamespace, EdgeKVPutOptions, EdgeKVStore, EdgeRegion, EdgeRuntimeConfig, EdgeTiming, EnvConfig, EnvDefinition, FreshConfig, FunctionRouteConfig, FunctionUrlConfig, GeoABTestConfig, GeoRoutingConfig, GeoRoutingRule, HTMLStreamOptions, HeaderConfig, ISRConfig, ImageOptimizationConfig, ImportMapConfig, KVNamespace, KVNamespaceBinding, LatencyRoutingConfig, LoadedEnv, LoggingConfig, MIME_TYPES, MiddlewareConfig, NetlifyAdapterConfig, NetlifyBuildConfig, NetlifyConfig, NetlifyConfigEnhanced, NetlifyContextConfig, NetlifyGeo, NetlifyHeaderConfig, NetlifyImageConfig, NetlifyPluginConfig, NetlifyRedirectConfig, NetlifyRegion, NetlifySite, NetlifyUser, NodeAdapterConfig, NodeConfig, OptimizeAssetsOptions, QueueBinding, R2Bucket, R2BucketBinding, RailwayConfig, RedirectConfig, RegionConfig, RequestContext, ResponseCacheOptions, ResponseContext, RewriteConfig, RouteEntry, RouteManifest, RouteManifestEntry, Runtime, RuntimeFeatures, RuntimeInfo, S3Config, SQLiteConfig, SSEMessage, ScheduledFunctionConfig, SecretsManager, ServerlessAdapter, ServiceBinding, StaticConfig, StaticConfigV2, StreamingWriter, VPCConfig, VercelAdapterConfig, VercelConfig, VercelConfigEnhanced, VercelRegion, WebSocketConfig, addGeoHeaders, applyGeoRouting, assertRuntime, awsAdapter, awsLambdaAdapter, awsLambdaAdapterV2, bunAdapter, bunAdapterV2, bunFile, bunHash, bunVerify, cache, calculateDistance, checkDenoPermissions, checkPermissions, cloudflareAdapter, cloudflareAdapterV2, cloudflarePagesAdapter, coalesceRequest, copyStaticAssets, createAssetCache, createBuildManifest, createBunAdapter, createBunHandler, createBunSQLite, createBunSQLiteV2, createCacheKey, createCacheMiddleware, createCachedResponse, createD1Database, createD1Helper, createDenoAdapter, createDenoKV, createESIMiddleware, createEdgeEnv, createEdgeHandler, createEnvSecretsManager, createExecutionContext, createExpressMiddleware, createFastifyPlugin, createFormsHandler, createGeoRoutingMiddleware, createHTMLStream, createKVHelper, createKVHelperV2, createKVNamespace, createLatencyRouter, createMemorySecretsManager, createOutputStructure, createR2Bucket, createR2Helper, createSSEHandler, createSSEStream, createStreamTee, createStreamingResponse, createVariantCookie, createVercelEdgeConfig, createVercelEdgeConfigV2, denoAdapter, denoDeployAdapter, detectRuntime, edgeRuntime, findBestRegion, findNearestLocation, generateEnvTypes, generateHashedFilename, geo, getAWSContext, getAWSLambdaContext, getAWSRequestId, getCacheControl, getClientIP, getCloudflareEnv, getCloudflareEnvV2, getColdStartDuration, getDefaultCache, getDenoDeployRegion, getDenoDeployRegionV2, getDenoKV, getDurableObject, getEnv, getExecutionContext, getExecutionContextV2, getFileHash, getMode, getNetlifyContext, getNetlifyContextV2, getNetlifyIdentityUser, getPlatformInfo, getPreloadedModule, getRegion, getRemainingTimeMs, getRemainingTimeMsV2, getRequestId, getRuntimeInfo, getS3AssetUrl, getS3AssetUrlV2, getStaticPaths, getVercelContext, hasFeature, initializeColdStart, injectEnvVariables, isBrowser, isBun, isBunV2, isColdStart, isDeno, isDenoDeployV2, isDenoDeply, isDevelopment, isEdge, isImmutableAsset, isNode, isProduction, isServer, loadEnvFile, loadEnvironment, markWarm, mergeStreams, netlifyAdapter, netlifyAdapterEnhanced, netlifyAdapterV2, netlifyImageCDN, netlifyImageCDNV2, nodeAdapter, nodeAdapterV2, onWebSocketClose, onWebSocketMessage, onWebSocketOpen, optimizeAssets, parseESITags, passThroughOnException, platformEnv, preloadModule, prerender, processESI, railwayAdapter, requestDenoPermission, requestPermission, resetColdStartTracking, resetDefaultCache, revalidatePath, revalidatePathV2, revalidateTag, revalidateTagV2, selectGeoVariant, shouldCacheResponse, startDenoServer, startServer, startServerV2, staticAdapter, streamThrough, streaming, validateEnv, vercelAdapter, vercelAdapterEnhanced, vercelAdapterV2, vercelImageUrl, waitUntil, waitUntilV2
- Re-exported modules: ./adapters/aws-lambda.js, ./adapters/bun.js, ./adapters/cloudflare.js, ./adapters/deno-deploy.js, ./adapters/netlify.js, ./adapters/node.js, ./adapters/vercel.js, ./aws-lambda/index.js, ./aws/index.js, ./bun/index.js, ./cache.js, ./cloudflare-pages/index.js, ./cloudflare/index.js, ./deno/index.js, ./edge-runtime.js, ./edge/index.js, ./geo.js, ./netlify/adapter.js, ./netlify/index.js, ./node/index.js, ./railway/index.js, ./runtime-detect.js, ./static/index.js, ./streaming.js, ./types.js, ./utils/build.js, ./utils/env.js, ./vercel/adapter.js, ./vercel/index.js
<!-- API_SNAPSHOT_END -->

## License

MIT

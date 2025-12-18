# Deploy to Cloudflare Pages

Deploy your PhilJS application to Cloudflare Pages for blazing-fast global edge network deployment with Workers integration.

## Quick Start

### Deploy from Git

1. Push your code to GitHub or GitLab
2. Visit [dash.cloudflare.com/pages](https://dash.cloudflare.com/pages)
3. Click **Create a project** and connect your repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Framework preset:** Vite
5. Click **Save and Deploy**
6. Your site is live on Cloudflare's global edge network!

### Deploy from CLI

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=philjs-app
```

## Configuration

### wrangler.toml

Create `wrangler.toml` in your project root for advanced configuration:

```toml
name = "philjs-app"
compatibility_date = "2024-01-01"

pages_build_output_dir = "dist"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.preview]
vars = { ENVIRONMENT = "preview" }

[[env.production.kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[[env.production.d1_databases]]
binding = "DB"
database_name = "philjs-db"
database_id = "your-db-id"
```

### Environment Variables

#### Via Dashboard

1. Go to **Pages** → Your project → **Settings** → **Environment variables**
2. Add variables for each environment:
   - **Production environment**
   - **Preview environment**

Example variables:
- `PUBLIC_API_URL` - Your API endpoint
- `API_KEY` - Secret API key (server-only)
- `DATABASE_URL` - Database connection string

#### Via Wrangler

```bash
# Set production variable
wrangler pages secret put API_KEY --project-name=philjs-app

# Set preview variable
wrangler pages secret put API_KEY --project-name=philjs-app --env=preview
```

#### In Code

```typescript
// Client-side (exposed)
const apiUrl = import.meta.env.PUBLIC_API_URL;

// Server-side only (Workers/Functions)
export async function onRequest(context) {
  const apiKey = context.env.API_KEY;
  // Use apiKey safely
}
```

## Deployment Modes

### Static Site Generation (SSG)

For fully static sites optimized for edge caching:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      output: 'static',
      prerender: {
        routes: [
          '/',
          '/about',
          '/blog',
          '/blog/*', // Prerender all blog posts
        ],
      },
    }),
  ],
});
```

**Build output:** Static HTML, CSS, JS files
**Hosting:** Cloudflare's global edge network (275+ cities)
**Cold start:** None - instant response
**Best for:** Blogs, documentation, marketing sites

### Server-Side Rendering (SSR) with Cloudflare Workers

For dynamic pages rendered at the edge:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      output: 'server',
      ssr: {
        target: 'cloudflare-workers',
        streaming: true,
      },
      adapter: 'cloudflare',
    }),
  ],
});
```

**Build output:** Worker script + static assets
**Hosting:** Cloudflare Workers (edge compute)
**Cold start:** ~0ms (V8 isolates, not containers)
**Best for:** Dynamic apps, personalized content, real-time data

### Hybrid Deployment

Mix static and dynamic pages for optimal performance:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      output: 'hybrid',
      prerender: {
        routes: ['/about', '/blog/*'], // Static
      },
      ssr: {
        target: 'cloudflare-workers', // Dynamic routes
      },
    }),
  ],
});
```

Static routes are cached at the edge, dynamic routes use Workers.

## Cloudflare Workers Functions

### Pages Functions

Create serverless functions in the `functions/` directory:

```typescript
// functions/api/hello.ts
export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    message: 'Hello from Cloudflare Workers!',
    location: context.request.cf?.city,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Access at: `/api/hello`

### Advanced Function Example

```typescript
// functions/api/users/[id].ts
export async function onRequestGet(context) {
  const { id } = context.params;
  const { env } = context;

  // Access KV storage
  const user = await env.KV.get(`user:${id}`, 'json');

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  return new Response(JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { id } = context.params;
  const { env } = context;

  const userData = await context.request.json();

  // Store in KV
  await env.KV.put(`user:${id}`, JSON.stringify(userData));

  return new Response('User created', { status: 201 });
}
```

### Middleware

Create middleware for all routes:

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  const start = Date.now();

  // Run next function/page
  const response = await context.next();

  // Add custom headers
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  return newResponse;
}
```

## Cloudflare Workers KV

Use KV for serverless key-value storage:

### Setup KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"

# Add to wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-namespace-id"
```

### Using KV in Functions

```typescript
// functions/api/cache.ts
export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');

  // Read from KV
  const value = await env.CACHE.get(key);

  return new Response(value || 'Not found', {
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function onRequestPut(context) {
  const { env } = context;
  const { key, value } = await context.request.json();

  // Write to KV with optional expiration
  await env.CACHE.put(key, value, { expirationTtl: 3600 });

  return new Response('Cached', { status: 201 });
}
```

### KV in PhilJS Server Functions

```typescript
// src/lib/server/cache.ts
import { serverFn } from 'philjs-core';

export const getCachedData = serverFn(async (key: string) => {
  // Access KV through context (requires adapter setup)
  const cache = globalThis.CACHE;
  return await cache.get(key, 'json');
});

export const setCachedData = serverFn(async (key: string, value: any) => {
  const cache = globalThis.CACHE;
  await cache.put(key, JSON.stringify(value), { expirationTtl: 3600 });
});
```

## Cloudflare D1 (SQL Database)

Use D1 for serverless SQL database:

### Setup D1 Database

```bash
# Create database
wrangler d1 create philjs-db

# Add to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "philjs-db"
database_id = "your-database-id"

# Create tables
wrangler d1 execute philjs-db --file=./schema.sql
```

### Database Schema

```sql
-- schema.sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Using D1 in Functions

```typescript
// functions/api/users.ts
export async function onRequestGet(context) {
  const { env } = context;

  // Query D1 database
  const { results } = await env.DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT 10'
  ).all();

  return Response.json(results);
}

export async function onRequestPost(context) {
  const { env } = context;
  const { email, name } = await context.request.json();

  // Insert into D1
  const result = await env.DB.prepare(
    'INSERT INTO users (email, name) VALUES (?, ?)'
  ).bind(email, name).run();

  return Response.json({
    id: result.meta.last_row_id,
    email,
    name,
  }, { status: 201 });
}
```

## Cloudflare R2 (Object Storage)

Use R2 for file storage (S3-compatible):

### Setup R2 Bucket

```bash
# Create bucket
wrangler r2 bucket create philjs-uploads

# Add to wrangler.toml
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "philjs-uploads"
```

### Using R2 in Functions

```typescript
// functions/api/upload.ts
export async function onRequestPost(context) {
  const { env } = context;
  const formData = await context.request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file provided', { status: 400 });
  }

  // Upload to R2
  await env.UPLOADS.put(file.name, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return Response.json({
    message: 'File uploaded',
    filename: file.name,
    size: file.size,
  });
}

// Download from R2
export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const filename = url.searchParams.get('file');

  const object = await env.UPLOADS.get(filename);

  if (!object) {
    return new Response('File not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'ETag': object.httpEtag,
    },
  });
}
```

## Custom Domains

### Add Custom Domain

1. Go to **Pages** → Your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `example.com`
4. If using Cloudflare DNS:
   - CNAME record created automatically
   - SSL provisions automatically
5. If using external DNS:
   - Add CNAME: `example.com` → `<project-name>.pages.dev`
   - Or add A records to Cloudflare IPs

### Multiple Domains & Redirects

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Redirect www to non-www
  if (url.hostname.startsWith('www.')) {
    const newUrl = new URL(url);
    newUrl.hostname = url.hostname.replace('www.', '');
    return Response.redirect(newUrl.toString(), 301);
  }

  return context.next();
}
```

## Preview Deployments

Every git branch and pull request gets a unique preview URL:

```bash
# Push to branch
git push origin feature-branch

# Cloudflare creates:
# https://<hash>.philjs-app.pages.dev
```

### Preview-Specific Configuration

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  const { env } = context;

  // Different behavior for preview vs production
  if (env.ENVIRONMENT === 'preview') {
    // Add preview banner, use test data, etc.
  }

  return context.next();
}
```

## Caching & Performance

### Cache Control Headers

```typescript
// functions/api/data.ts
export async function onRequestGet(context) {
  const data = await fetchData();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      // Cache at edge for 1 hour, browser for 5 minutes
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      // Revalidate stale content while serving cached
      'CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400',
    },
  });
}
```

### Cloudflare Cache API

```typescript
// functions/api/cached-data.ts
export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url);

  // Try cache first
  let response = await cache.match(cacheKey);

  if (!response) {
    // Cache miss - fetch fresh data
    const data = await fetchData();
    response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });

    // Store in cache
    context.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
```

### Image Optimization

```typescript
// functions/api/image.ts
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const imageUrl = url.searchParams.get('url');
  const width = url.searchParams.get('w') || '800';
  const quality = url.searchParams.get('q') || '85';

  // Fetch and transform image using Cloudflare Image Resizing
  const response = await fetch(imageUrl, {
    cf: {
      image: {
        width: parseInt(width),
        quality: parseInt(quality),
        format: 'auto', // WebP for supported browsers
      },
    },
  });

  return response;
}
```

## Analytics & Monitoring

### Web Analytics

Enable in Cloudflare Dashboard:
1. Go to **Pages** → Your project → **Analytics**
2. Enable **Web Analytics**
3. Automatic tracking (no client-side code needed)

### Custom Analytics with Workers Analytics Engine

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  const { env } = context;
  const start = Date.now();

  const response = await context.next();

  // Log analytics
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      indexes: [context.request.url],
      blobs: [context.request.method, response.status.toString()],
      doubles: [Date.now() - start],
    });
  }

  return response;
}
```

### Real-time Logs

```bash
# Tail logs
wrangler pages deployment tail --project-name=philjs-app

# Filter logs
wrangler pages deployment tail --project-name=philjs-app --status=error
```

## Security

### Headers

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  const response = await context.next();

  // Add security headers
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-XSS-Protection', '1; mode=block');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return newResponse;
}
```

### Rate Limiting

```typescript
// functions/_middleware.ts
const rateLimiter = new Map();

export async function onRequest(context) {
  const ip = context.request.headers.get('CF-Connecting-IP');
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const record = rateLimiter.get(ip);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;

      if (record.count > maxRequests) {
        return new Response('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
          },
        });
      }
    }
  }

  return context.next();
}
```

### Environment Variables Security

```typescript
// ❌ WRONG - exposed to client
const apiKey = import.meta.env.PUBLIC_API_KEY;

// ✅ CORRECT - server-only (Workers function)
export async function onRequest(context) {
  const apiKey = context.env.API_KEY;
  // Use apiKey safely
}
```

## Rollbacks

### Via Dashboard

1. Go to **Pages** → Your project → **Deployments**
2. Find previous successful deployment
3. Click **...** → **Rollback to this deployment**

### Via CLI

```bash
# List deployments
wrangler pages deployment list --project-name=philjs-app

# Promote specific deployment
wrangler pages deployment promote <deployment-id> --project-name=philjs-app
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: philjs-app
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## Troubleshooting

### Build Fails

```bash
# Test build locally
npm run build

# Check output directory
ls -la dist/

# Clear cache
wrangler pages deployment tail --project-name=philjs-app
```

### Function Errors

```typescript
// Add detailed error logging
export async function onRequest(context) {
  try {
    // Your code
    const result = await processRequest(context);
    return Response.json(result);
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

### Environment Variables Not Working

1. Check variable is set in correct environment (Production/Preview)
2. Redeploy after adding new variables
3. For secrets, use `wrangler pages secret put`
4. Client variables must start with `PUBLIC_`

### Worker Size Limits

Workers have a 1MB size limit (after compression):

```bash
# Check worker size
wrangler pages deployment list --project-name=philjs-app

# Optimize:
# - Use dynamic imports for code splitting
# - Remove unused dependencies
# - Enable tree-shaking
```

## Cost Optimization

### Free Tier

Cloudflare Pages Free tier includes:
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- 100,000 KV reads/day
- 1,000 KV writes/day
- 1GB KV storage

### Paid Plans

Workers Paid ($5/month):
- 10 million requests/month included
- $0.50 per additional million
- 10GB KV storage included
- D1 and R2 usage-based pricing

### Reduce Costs

1. Use static generation for unchanged content
2. Cache aggressively at the edge
3. Optimize images before upload
4. Use KV for frequently accessed data
5. Implement smart cache invalidation

## Best Practices

### Do

- Use Workers for edge compute (0ms cold starts)
- Leverage Cloudflare's global network (275+ cities)
- Cache static assets aggressively
- Use KV for session storage and caching
- Use D1 for relational data
- Use R2 for file storage
- Implement proper error handling
- Monitor analytics and logs

### Don't

- Store secrets in client code
- Ignore function size limits (1MB)
- Skip preview deployments
- Over-use Workers for simple static content
- Hardcode URLs (use environment variables)
- Forget to set cache headers
- Ignore rate limiting for public APIs

## Next Steps

- [Configure Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [Learn about Workers](https://developers.cloudflare.com/workers/)
- [Explore D1 Database](https://developers.cloudflare.com/d1/)
- [Use R2 Storage](https://developers.cloudflare.com/r2/)
- [Set up Analytics](https://developers.cloudflare.com/analytics/)

---

**Tip:** Use `wrangler pages dev` to test your Pages project locally with Workers, KV, D1, and R2.

**Warning:** Workers have a 1MB size limit after compression. Use code splitting and dynamic imports for large applications.

**Note:** PhilJS's resumability and fine-grained reactivity make it perfect for Cloudflare Workers - minimal runtime overhead and instant interactivity!

# Deploy to Netlify

Deploy your PhilJS application to Netlify for continuous deployment, serverless functions, and global CDN.

## Quick Start

### Deploy from Git

1. Push your code to GitHub, GitLab, or Bitbucket
2. Visit [app.netlify.com/start](https://app.netlify.com/start)
3. Connect your repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**
6. Done! Your site is live 🎉

### Deploy from CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy to draft URL
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Configuration

### netlify.toml

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

# Node.js version
[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Vite Configuration for SSR

For server-side rendering on Netlify:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      output: 'server', // Enable SSR
      ssr: {
        target: 'netlify',
        streaming: true,
      },
      adapter: 'netlify',
    }),
  ],
  build: {
    ssr: true,
    rollupOptions: {
      output: {
        // Optimize for Netlify Functions
        manualChunks: undefined,
      },
    },
  },
});
```

### Environment Variables

#### Via Dashboard

1. Go to **Site settings** → **Environment variables**
2. Add variables:
   - Key: `PUBLIC_API_URL`
   - Value: `https://api.example.com`
3. Deploy scopes: Production, Deploy previews, Branch deploys

#### Via CLI

```bash
# Set variable
netlify env:set PUBLIC_API_URL https://api.example.com

# List variables
netlify env:list

# Remove variable
netlify env:unset PUBLIC_API_URL
```

#### In Code

```typescript
const apiUrl = import.meta.env.PUBLIC_API_URL;
```

## Deployment Modes

### Static Export (SSG)

For fully static sites:

```typescript
// philjs.config.ts
export default {
  output: 'static',
  prerender: {
    routes: [
      '/',
      '/about',
      '/blog',
      '/blog/*',
    ],
  },
};
```

**Perfect for:** Marketing sites, blogs, documentation

### Server-Side Rendering (SSR)

Using Netlify Functions:

```typescript
// philjs.config.ts
export default {
  output: 'server',
  ssr: {
    target: 'netlify',
  },
  adapter: 'netlify',
};
```

**Perfect for:** Dynamic apps, personalized content

### Hybrid

Mix static and dynamic:

```typescript
// philjs.config.ts
export default {
  output: 'hybrid',
  prerender: {
    routes: ['/about', '/blog/*'],
  },
};
```

## Netlify Functions

### Create a Function

```typescript
// netlify/functions/hello.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Hello from Netlify!',
    }),
  };
};
```

Access at: `/.netlify/functions/hello`

### With PhilJS Server Functions

```typescript
// src/lib/server/api.ts
export const fetchData = serverFn(async (id: string) => {
  // Runs as Netlify Function
  const data = await fetch(`https://api.example.com/data/${id}`);
  return data.json();
});
```

### Background Functions

For long-running tasks:

```typescript
// netlify/functions/process-background.ts
import { Handler, schedule } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // Can run up to 15 minutes
  await processLongTask();

  return { statusCode: 200 };
};

// Or use scheduled functions
export const handler = schedule('0 0 * * *', async () => {
  // Runs daily at midnight
  await dailyTask();
});
```

## Edge Functions

Deploy to Netlify Edge for global low-latency compute (powered by Deno):

### Basic Edge Function

```typescript
// netlify/edge-functions/hello.ts
export default async (request: Request, context: Context) => {
  const geo = context.geo;

  return new Response(JSON.stringify({
    message: 'Hello from the edge!',
    location: {
      city: geo.city,
      country: geo.country.name,
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    timestamp: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
};

export const config = {
  path: '/edge-hello',
};
```

### Edge Middleware

Create middleware that runs on all requests:

```typescript
// netlify/edge-functions/auth.ts
import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const authHeader = request.headers.get('Authorization');

  // Check authentication
  if (!authHeader && request.url.includes('/protected/')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer',
      },
    });
  }

  // Continue to next handler
  return context.next();
};

export const config = {
  path: '/protected/*',
};
```

### Edge Function with KV Storage

```typescript
// netlify/edge-functions/cached-data.ts
import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response('Key required', { status: 400 });
  }

  // Try cache first
  const cached = await context.cookies.get(`cache_${key}`);
  if (cached) {
    return new Response(JSON.stringify({ data: cached, cached: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch fresh data
  const data = await fetchData(key);

  // Cache for 1 hour
  context.cookies.set({
    name: `cache_${key}`,
    value: JSON.stringify(data),
    maxAge: 3600,
  });

  return new Response(JSON.stringify({ data, cached: false }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

async function fetchData(key: string) {
  // Fetch from API or database
  return { key, value: 'some data' };
}

export const config = {
  path: '/api/cached-data',
};
```

### A/B Testing with Edge Functions

```typescript
// netlify/edge-functions/ab-test.ts
import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  // Get or set A/B test variant
  let variant = context.cookies.get('ab_variant');

  if (!variant) {
    // Randomly assign variant (50/50 split)
    variant = Math.random() < 0.5 ? 'A' : 'B';
    context.cookies.set({
      name: 'ab_variant',
      value: variant,
      maxAge: 2592000, // 30 days
    });
  }

  // Get the response
  const response = await context.next();

  // Modify response based on variant
  const html = await response.text();
  const modifiedHtml = html.replace(
    '</head>',
    `<script>window.AB_VARIANT = '${variant}';</script></head>`
  );

  return new Response(modifiedHtml, {
    headers: response.headers,
  });
};

export const config = {
  path: '/',
};
```

### Edge Function Context API

```typescript
// netlify/edge-functions/context-demo.ts
import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  return new Response(JSON.stringify({
    // Geolocation data
    geo: {
      city: context.geo.city,
      country: context.geo.country.name,
      timezone: context.geo.timezone,
    },
    // Request info
    request: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    },
    // Site info
    site: {
      id: context.site.id,
      name: context.site.name,
      url: context.site.url,
    },
    // Deploy context
    deploy: {
      id: context.deploy.id,
      context: context.deploy.context, // production, deploy-preview, branch-deploy
    },
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/api/context',
};
```

### Edge Functions vs Netlify Functions

| Feature | Edge Functions | Netlify Functions |
|---------|----------------|-------------------|
| **Runtime** | Deno (V8 isolates) | Node.js (AWS Lambda) |
| **Cold start** | ~0ms | 100-500ms |
| **Execution time** | 50ms | 10s (background: 15min) |
| **Bundle size** | 20MB | 50MB |
| **Locations** | Global (Cloudflare) | Regional (AWS) |
| **Use cases** | Auth, redirects, headers | Database, APIs, long tasks |

### When to Use Edge Functions

Use Edge Functions for:
- Authentication and authorization
- Request/response modification
- A/B testing and feature flags
- Geo-based redirects
- Simple data transformations
- Caching strategies
- Rate limiting

Use Netlify Functions for:
- Database operations
- Complex business logic
- Third-party API integrations
- Email sending
- Image processing
- Long-running tasks (background functions)

## Forms

### Netlify Forms

Add form handling without backend code:

```html
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>
```

Submissions appear in **Forms** tab in Netlify Dashboard.

### With Server Action

```typescript
// src/lib/actions.ts
export const submitForm = serverFn(async (data: FormData) => {
  const name = data.get('name');
  const email = data.get('email');

  // Custom processing
  await sendEmail({ name, email });

  return { success: true };
});
```

## Custom Domains

### Add Domain

1. Go to **Domain settings**
2. Click **Add custom domain**
3. Enter your domain: `example.com`
4. Follow DNS instructions:
   - **Netlify DNS:** Point nameservers to Netlify
   - **External DNS:** Add A record or CNAME

5. SSL provisions automatically

### Domain Aliases

```toml
# netlify.toml
[[redirects]]
  from = "https://www.example.com/*"
  to = "https://example.com/:splat"
  status = 301
  force = true
```

## Deploy Contexts

Different settings per environment:

```toml
# netlify.toml
[context.production]
  command = "npm run build"
  environment = { NODE_ENV = "production" }

[context.deploy-preview]
  command = "npm run build:preview"
  environment = { NODE_ENV = "preview" }

[context.branch-deploy]
  command = "npm run build:dev"
  environment = { NODE_ENV = "development" }

[context.staging]
  command = "npm run build:staging"
```

## Branch Deploys

Every branch gets its own URL:

```bash
# Push to branch
git push origin feature-branch

# Netlify creates:
# https://feature-branch--my-site.netlify.app
```

### Branch Deploy Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"

# Deploy all branches
[build.processing]
  skip_processing = false

# Or specific branches
[build]
  ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."
```

## Split Testing

A/B test different branches:

1. Go to **Split Testing**
2. Choose branches to test
3. Set traffic split (e.g., 50/50)
4. Monitor performance

```toml
# netlify.toml
[[branches]]
  name = "main"
  split = 80

[[branches]]
  name = "experiment"
  split = 20
```

## Redirects & Rewrites

### Simple Redirects

```toml
[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301

[[redirects]]
  from = "/blog/*"
  to = "/news/:splat"
  status = 301
```

### Proxying

```toml
[[redirects]]
  from = "/api/*"
  to = "https://api.example.com/:splat"
  status = 200
  force = true
```

### Country-based Redirects

```toml
[[redirects]]
  from = "/*"
  to = "/uk/:splat"
  status = 302
  conditions = { Country = ["GB"] }
```

## Analytics

### Netlify Analytics

Enable in **Site settings** → **Analytics**

- No client-side code needed
- Server-side tracking
- Accurate page views, unique visitors
- Bandwidth usage

### Custom Analytics

```typescript
// src/lib/analytics.ts
export function trackPageView(url: string) {
  fetch('/.netlify/functions/analytics', {
    method: 'POST',
    body: JSON.stringify({ url, timestamp: Date.now() }),
  });
}
```

## Build Plugins

Extend build process:

```toml
# netlify.toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"

[[plugins]]
  package = "netlify-plugin-cache"
  [plugins.inputs]
    paths = ["node_modules", ".cache"]

[[plugins]]
  package = "netlify-plugin-image-optim"
```

## Performance

### Caching

```toml
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### Image Optimization

```html
<!-- Automatic responsive images -->
<img src="/photo.jpg" loading="lazy" />

<!-- Netlify Large Media for large assets -->
```

### Asset Optimization

Enable in **Site settings** → **Build & deploy** → **Post processing**:
- Bundle CSS
- Minify CSS
- Minify JS
- Compress images

## Monitoring

### Build Logs

View in **Deploys** → **Deploy log**

### Function Logs

View in **Functions** → Select function → **Function log**

### Real-time Logs

```bash
# Stream logs
netlify logs:function hello

# Follow logs
netlify logs:function hello --follow
```

## Rollbacks

### Via Dashboard

1. Go to **Deploys**
2. Find previous deploy
3. Click **Publish deploy**

### Via CLI

```bash
# List deploys
netlify deploys:list

# Restore specific deploy
netlify deploy:restore <deploy-id>
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## Security

### Headers

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'"
```

### Environment Variables

Never expose secrets:

```typescript
// ✅ Server-only
const apiKey = process.env.API_KEY;

// ❌ Exposed to client
const apiKey = import.meta.env.PUBLIC_API_KEY;
```

## Troubleshooting

### Build Fails

```bash
# Test locally
npm run build

# Clear cache and retry
netlify build --clear-cache
```

### Function Errors

Check function logs in dashboard:

```typescript
// Add logging
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  try {
    // Your code
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: error.message };
  }
};
```

### Environment Variables Not Working

1. Check variable name conventions
2. Redeploy after adding variables
3. Verify in build logs

## Cost Optimization

### Free Tier

- 100 GB bandwidth/month
- 300 build minutes/month
- 125,000 serverless function requests

### Reduce Costs

1. Use static generation where possible
2. Enable caching
3. Optimize images
4. Use Edge Functions for simple logic

## Best Practices

### ✅ Do

- Use deploy previews for testing
- Set appropriate cache headers
- Use Netlify Forms for simple forms
- Enable asset optimization
- Monitor build times

### ❌ Don't

- Hardcode URLs (use env vars)
- Skip deploy previews
- Ignore function timeout limits (10s default, 26s background)
- Expose secrets in client code

## Next Steps

- [Configure custom domains](https://docs.netlify.com/domains-https/custom-domains/)
- [Set up Netlify Analytics](#analytics)
- [Learn about Edge Functions](https://docs.netlify.com/edge-functions/overview/)
- [Explore build plugins](#build-plugins)

---

💡 **Tip**: Use `netlify dev` to simulate the Netlify environment locally.

⚠️ **Warning**: Functions timeout after 10 seconds (26s for background functions).

ℹ️ **Note**: Netlify's global CDN serves your site from the closest location to your users.

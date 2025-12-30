# Deploy to Vercel

Deploy your PhilJS application to Vercel for zero-config, instant deployments with global edge network.

## Quick Start

### Deploy from Git

1. Push your code to GitHub, GitLab, or Bitbucket
2. Visit [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects PhilJS - click **Deploy**
5. Done! Your site is live 🎉

### Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Configuration

### vercel.json

Create `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Vite Configuration for SSR

For server-side rendering on Vercel:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-compiler/vite';

export default defineConfig({
  plugins: [
    philjs({
      output: 'server', // Enable SSR
      ssr: {
        target: 'vercel',
        streaming: true,
      },
      adapter: 'vercel',
    }),
  ],
  build: {
    ssr: true,
    rollupOptions: {
      output: {
        // Optimize for serverless
        manualChunks: undefined,
      },
    },
  },
});
```

### Environment Variables

Add environment variables in Vercel Dashboard or CLI:

#### Via Dashboard

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add variables for each environment:
   - `PUBLIC_API_URL`
   - `DATABASE_URL`
   - etc.

#### Via CLI

```bash
# Add production variable
vercel env add PUBLIC_API_URL production

# Add preview variable
vercel env add PUBLIC_API_URL preview

# Add development variable
vercel env add PUBLIC_API_URL development
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
      '/blog/*', // Prerender all blog posts
    ],
  },
};
```

**Build output:** Static HTML files
**Hosting:** Vercel Edge Network
**Cold start:** None (instant)

### Server-Side Rendering (SSR)

For dynamic pages:

```typescript
// philjs.config.ts
export default {
  output: 'server',
  ssr: {
    streaming: true,
    target: 'vercel',
  },
};
```

**Build output:** Serverless functions
**Hosting:** Vercel Serverless
**Cold start:** ~50-200ms

### Hybrid (Recommended)

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

Static routes are cached at edge, dynamic routes use serverless functions.

## Serverless Functions

### API Routes

Create API endpoints:

```typescript
// src/api/hello.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify({
    message: 'Hello from Vercel!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Access at: `https://your-domain.com/api/hello`

### Server Functions

Use PhilJS server functions:

```typescript
// src/lib/server/users.ts
export const getUser = serverFn(async (id: number) => {
  // Runs on Vercel serverless
  const user = await db.users.findById(id);
  return user;
});
```

### Function Configuration

Configure function memory, timeout, and regions:

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "regions": ["sfo1", "iad1"]
}
```

## Edge Functions

Deploy to Vercel Edge Network for ultra-low latency (faster than serverless):

### Edge Middleware

```typescript
// middleware.ts (in project root)
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  // Runs on Vercel Edge Network (100+ locations worldwide)
  const country = request.geo?.country || 'Unknown';
  const city = request.geo?.city || 'Unknown';

  // Add custom headers
  const response = NextResponse.next();
  response.headers.set('X-User-Country', country);
  response.headers.set('X-User-City', city);

  return response;
}
```

### Edge API Routes

```typescript
// api/edge-hello.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'World';

  return new Response(
    JSON.stringify({
      message: `Hello ${name} from the edge!`,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate',
      },
    }
  );
}
```

### Edge vs Serverless

| Feature | Edge Functions | Serverless Functions |
|---------|---------------|---------------------|
| **Cold start** | ~0ms | 50-200ms |
| **Runtime** | V8 isolates | Node.js |
| **Locations** | 100+ cities | Regional |
| **Size limit** | 1MB (compressed) | 50MB |
| **Max duration** | 30s | 10s (Hobby), 60s (Pro) |
| **Use cases** | Auth, redirects, A/B testing | Complex logic, database queries |

### When to Use Edge Functions

Use Edge Functions for:
- Authentication and authorization
- Geo-redirects and localization
- A/B testing and feature flags
- Request/response modification
- Rate limiting
- Simple API endpoints

Use Serverless Functions for:
- Database queries
- Complex business logic
- Third-party API calls
- File processing
- Heavy computations

## Domains

### Add Custom Domain

1. Go to project **Settings** → **Domains**
2. Add your domain: `example.com`
3. Update DNS records:
   - **A Record**: `76.76.21.21`
   - **CNAME**: `cname.vercel-dns.com`

4. Vercel provisions SSL automatically

### Multiple Domains

```json
// vercel.json
{
  "alias": [
    "example.com",
    "www.example.com",
    "app.example.com"
  ]
}
```

## Preview Deployments

Every git push gets a unique preview URL:

```bash
# Push to branch
git push origin feature-branch

# Vercel creates:
# https://my-app-git-feature-branch-username.vercel.app
```

### Preview Environment Variables

Set different values for preview:

```bash
vercel env add PUBLIC_API_URL preview
# Enter: https://api-staging.example.com
```

## Performance

### Edge Network

Vercel serves static assets from 100+ edge locations globally.

### Caching

```typescript
// Set cache headers
export async function GET() {
  return new Response(content, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

### Image Optimization

Use Vercel's Image Optimization:

```typescript
<img
  src="/api/image?url=/photo.jpg&w=800&q=75"
  alt="Optimized"
/>
```

Or with Next/Image component (compatible):

```typescript
import Image from 'next/image';

<Image
  src="/photo.jpg"
  width={800}
  height={600}
  alt="Optimized"
/>
```

## Analytics

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// src/App.tsx
import { inject } from '@vercel/analytics';

inject();
```

### Web Vitals

Vercel automatically tracks Core Web Vitals:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

View in **Analytics** tab of your project.

## Monitoring

### Deployment Logs

View logs in Vercel Dashboard:
- Build logs
- Function logs
- Edge logs

### Real-time Logs

```bash
# Stream function logs
vercel logs <deployment-url>

# Follow logs
vercel logs --follow
```

### Error Tracking

Integrate with Sentry:

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
});
```

## Rollbacks

### Via Dashboard

1. Go to **Deployments**
2. Find previous successful deployment
3. Click **...** → **Promote to Production**

### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
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
          node-version: 24

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Security

### Environment Variables

Never expose secrets in client code:

```typescript
// ❌ WRONG - exposed to client
const apiKey = import.meta.env.PUBLIC_API_KEY;

// ✅ CORRECT - server-only
const apiKey = process.env.API_KEY;
```

### Authentication

Use environment variables for API keys:

```typescript
// src/api/protected.ts
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.API_KEY;

  if (authHeader !== `Bearer ${apiKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Protected logic...
}
```

### Rate Limiting

```typescript
// Use Vercel Edge Config for rate limiting
import { getRateLimitStatus } from '@/lib/rate-limit';

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for');
  const allowed = await getRateLimitStatus(ip);

  if (!allowed) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

## Cost Optimization

### Free Tier Limits

Vercel Hobby (free):
- Unlimited deployments
- 100 GB bandwidth/month
- 100 hours serverless execution/month

### Reduce Costs

1. **Use static export** where possible
2. **Enable caching** aggressively
3. **Optimize images** before upload
4. **Use edge functions** instead of serverless for simple tasks

## Troubleshooting

### Build Fails

Check build logs in Vercel Dashboard:

```bash
# Local build test
npm run build

# Check output
ls -la dist/
```

### Function Timeout

Increase timeout (Pro plan):

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Environment Variables Not Working

1. Check variable name starts with `PUBLIC_` for client-side
2. Redeploy after adding variables
3. Verify in deployment logs

## Best Practices

### ✅ Do

- Use preview deployments for testing
- Set appropriate cache headers
- Enable ISR for dynamic content
- Monitor Web Vitals
- Use serverless functions for API routes

### ❌ Don't

- Hardcode API URLs (use env vars)
- Deploy without testing build locally
- Expose secrets in client code
- Ignore function timeout limits
- Skip preview deployments

## Next Steps

- [Configure custom domains](https://vercel.com/docs/custom-domains)
- [Set up Vercel Analytics](#analytics)
- [Learn about Edge Functions](https://vercel.com/docs/edge-functions)
- [Explore ISR (Incremental Static Regeneration)](/docs/advanced/isr)

---

💡 **Tip**: Use `vercel dev` to simulate the Vercel environment locally.

⚠️ **Warning**: Serverless functions have a 10-second timeout on Hobby plan, 60s on Pro.

ℹ️ **Note**: PhilJS's resumability makes it perfect for Vercel's edge network - zero hydration overhead!

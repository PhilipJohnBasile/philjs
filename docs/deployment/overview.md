# Deployment Overview

Learn how to deploy your PhilJS application to production on various platforms.


## Quick Start

PhilJS applications can be deployed to any platform that supports Node.js applications. The framework is optimized for:

- **Static hosting** (Netlify, Vercel, Cloudflare Pages)
- **Serverless platforms** (Vercel, Netlify Functions, AWS Lambda)
- **Container platforms** (Docker, Kubernetes)
- **Traditional servers** (VPS, dedicated servers)

## Build for Production

Before deploying, build your application:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview locally (optional)
npm run preview
```

The build output will be in the `dist/` directory.

## Deployment Options

### Platform-as-a-Service (PaaS)

These platforms handle infrastructure, scaling, and deployment automatically:

- **[Vercel](/docs/deployment/vercel)** - Zero-config, instant deployments, edge network
- **[Netlify](/docs/deployment/netlify)** - Continuous deployment, serverless functions
- **[Cloudflare Pages](/docs/deployment/cloudflare)** - Global edge network, Workers integration

### Cloud Providers

For more control over infrastructure:

- **[AWS](/docs/deployment/aws)** - ECS, Lambda, S3 + CloudFront
- **[Google Cloud](/docs/deployment/google-cloud)** - Cloud Run, App Engine
- **[Azure](/docs/deployment/azure)** - App Service, Static Web Apps

### Containers

Deploy using Docker and container orchestration:

- **[Docker](/docs/deployment/docker)** - Containerized deployment
- **[Kubernetes](/docs/deployment/kubernetes)** - Container orchestration

### Self-Hosted

Run on your own infrastructure:

- **[Node.js Server](/docs/deployment/node)** - Traditional VPS or dedicated server
- **[Nginx + PM2](/docs/deployment/nginx)** - Production-ready Node.js setup

## Deployment Features

PhilJS supports various deployment strategies:

### Static Site Generation (SSG)

Generate static HTML at build time for maximum performance:

```typescript
// philjs.config.ts
export default {
  output: 'static',
  prerender: {
    routes: ['/'],
  },
};
```

**Best for:**
- Blogs, documentation sites
- Marketing pages
- Sites with infrequent updates

**Platforms:** Vercel, Netlify, Cloudflare Pages, S3 + CloudFront

### Server-Side Rendering (SSR)

Render pages on-demand on the server:

```typescript
// philjs.config.ts
export default {
  output: 'server',
  ssr: {
    streaming: true,
  },
};
```

**Best for:**
- Dynamic applications
- Personalized content
- Real-time data

**Platforms:** Vercel, Netlify, AWS Lambda, Docker

### Hybrid (SSG + SSR)

Mix static and dynamic pages:

```typescript
// philjs.config.ts
export default {
  output: 'hybrid',
  prerender: {
    routes: ['/about', '/blog/*'],
  },
};
```

**Best for:**
- E-commerce sites
- SaaS applications
- Mixed content types

**Platforms:** Vercel, Netlify, self-hosted

## Environment Configuration

### Environment Variables

Configure environment-specific settings:

```bash
# .env.production
PUBLIC_API_URL=https://api.production.com
DATABASE_URL=postgresql://...
SECRET_KEY=xxx
```

### Server vs Client Variables

- **`PUBLIC_*`** - Exposed to client-side code
- **Other variables** - Server-only, never exposed to browsers

```typescript
// ✅ Safe - server only
const dbUrl = import.meta.env.DATABASE_URL;

// ✅ Safe - public
const apiUrl = import.meta.env.PUBLIC_API_URL;
```

## Performance Optimization

### Build Optimization

```typescript
// vite.config.ts
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['philjs-core', 'philjs-router'],
        },
      },
    },
  },
};
```

### Compression

Enable gzip/brotli compression:

```typescript
// server.ts
import compression from 'compression';

app.use(compression());
```

### Caching

Set appropriate cache headers:

```typescript
// Static assets - long cache
Cache-Control: public, max-age=31536000, immutable

// HTML pages - revalidate
Cache-Control: public, max-age=0, must-revalidate

// API responses - short cache
Cache-Control: public, max-age=60, s-maxage=3600
```

## Deployment Checklist

Before going to production:

### Security

- ✅ Remove debug logs and console statements
- ✅ Set secure environment variables
- ✅ Enable HTTPS/SSL
- ✅ Set CSP headers
- ✅ Configure CORS properly
- ✅ Review authentication/authorization

### Performance

- ✅ Enable compression (gzip/brotli)
- ✅ Optimize images
- ✅ Configure CDN
- ✅ Enable caching
- ✅ Minimize bundle size
- ✅ Test loading performance

### Monitoring

- ✅ Set up error tracking (Sentry, etc.)
- ✅ Configure analytics
- ✅ Monitor server health
- ✅ Set up logging
- ✅ Create alerts for errors

### Testing

- ✅ Test in production-like environment
- ✅ Verify all environment variables
- ✅ Test error pages (404, 500)
- ✅ Check mobile responsiveness
- ✅ Verify SEO meta tags
- ✅ Test on multiple browsers

## Continuous Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
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
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  script:
    - npm ci
    - npm run build
    - npm run deploy
  only:
    - main
```

## Rollback Strategy

Always have a rollback plan:

1. **Git-based**: Tag releases, revert commits
2. **Platform features**: Use Vercel/Netlify rollback UI
3. **Blue-Green**: Maintain two environments
4. **Canary**: Gradual rollout to users

## Monitoring Production

### Health Checks

```typescript
// /api/health
export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
  }));
}
```

### Error Tracking

```typescript
// Install Sentry
npm install @sentry/node

// Initialize in server
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Platform-Specific Guides

Choose your deployment platform:

- **[Vercel →](/docs/deployment/vercel)** - Recommended for most projects
- **[Netlify →](/docs/deployment/netlify)** - Great for static sites
- **[Cloudflare Pages →](/docs/deployment/cloudflare)** - Global edge network
- **[AWS →](/docs/deployment/aws)** - Full control, enterprise features
- **[Docker →](/docs/deployment/docker)** - Containerized deployment
- **[Self-Hosted →](/docs/deployment/node)** - Run on your own servers

## Common Issues

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

Make sure to prefix public variables with `PUBLIC_`:

```bash
# ❌ Won't work on client
API_URL=https://api.example.com

# ✅ Works on client
PUBLIC_API_URL=https://api.example.com
```

### Out of Memory

Increase Node.js memory limit:

```json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 philjs build"
  }
}
```

## Next Steps

- Choose your [deployment platform](/docs/deployment/vercel)
- Set up [monitoring and analytics](/docs/advanced/monitoring)
- Configure [CI/CD pipeline](/docs/deployment/ci-cd)

---

💡 **Tip**: Start with Vercel or Netlify for the simplest deployment experience.

⚠️ **Warning**: Always test your production build locally before deploying: `npm run build && npm run preview`

ℹ️ **Note**: PhilJS's resumability feature means zero hydration cost, making it perfect for edge deployment.

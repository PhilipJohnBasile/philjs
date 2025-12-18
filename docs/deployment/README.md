# PhilJS Deployment Guides

Comprehensive deployment guides for deploying PhilJS applications to all major platforms.

## Quick Links

### Platform-as-a-Service

- **[Vercel](./vercel.md)** - Zero-config deployments with edge network and serverless functions
- **[Netlify](./netlify.md)** - Continuous deployment with edge functions and forms
- **[Cloudflare Pages](./cloudflare.md)** - Global edge network with Workers, KV, D1, and R2

### Container Deployment

- **[Docker](./docker.md)** - Containerized deployment with Docker and Docker Compose

### Overview

- **[Deployment Overview](./overview.md)** - General deployment concepts and checklist

## What's Included

Each deployment guide includes:

### Core Topics

- Quick start guide (Git and CLI deployment)
- Configuration files (platform-specific)
- Environment variables setup
- Build commands and output directories
- Custom domains configuration
- SSL/HTTPS setup

### Server-Side Rendering (SSR)

- SSR configuration for each platform
- Vite config examples
- Build optimization
- Streaming support
- Runtime considerations

### Edge Functions

- Platform-specific edge function setup
- Middleware examples
- Authentication patterns
- Caching strategies
- A/B testing implementations

### Environment Variables

- Dashboard configuration
- CLI management
- Security best practices
- Client vs server variables
- Environment-specific configs

### Advanced Features

#### Vercel
- Edge Functions vs Serverless Functions
- ISR (Incremental Static Regeneration)
- Image optimization
- Web Vitals tracking
- Preview deployments

#### Netlify
- Edge Functions (Deno runtime)
- Netlify Functions (AWS Lambda)
- Background functions
- Forms integration
- Split testing
- Build plugins

#### Cloudflare Pages
- Cloudflare Workers (V8 isolates)
- KV (key-value storage)
- D1 (SQL database)
- R2 (object storage)
- Cache API
- Analytics Engine

#### Docker
- Multi-stage builds
- Docker Compose (development & production)
- Health checks
- Environment variable management
- Docker secrets
- Security best practices
- Kubernetes deployment
- Cloud provider deployment (AWS ECS, GCP Cloud Run, Azure ACI)

## Choosing a Platform

### Use Vercel if you want:
- Fastest time to deployment
- Excellent DX with zero config
- Preview deployments for every branch
- Built-in analytics and monitoring
- Strong Next.js ecosystem (compatible with PhilJS)

### Use Netlify if you want:
- Forms without backend code
- Split testing capabilities
- Edge Functions with Deno runtime
- Great plugin ecosystem
- Generous free tier

### Use Cloudflare Pages if you want:
- Maximum global edge coverage (275+ cities)
- Zero cold starts (V8 isolates)
- Built-in KV storage
- D1 SQL database
- R2 object storage
- Lowest latency worldwide

### Use Docker if you want:
- Complete control over environment
- Self-hosted deployment
- Multi-service orchestration
- Cloud-agnostic deployment
- Kubernetes integration

## Deployment Modes

All platforms support:

### Static Site Generation (SSG)
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      output: 'static',
      prerender: {
        routes: ['/', '/about', '/blog/*'],
      },
    }),
  ],
});
```

**Best for:** Blogs, documentation, marketing sites

### Server-Side Rendering (SSR)
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      output: 'server',
      ssr: {
        target: 'vercel', // or 'netlify', 'cloudflare-workers'
        streaming: true,
      },
    }),
  ],
});
```

**Best for:** Dynamic apps, personalized content, real-time data

### Hybrid (SSG + SSR)
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    philjs({
      output: 'hybrid',
      prerender: {
        routes: ['/about', '/blog/*'], // Static
      },
      // Other routes use SSR
    }),
  ],
});
```

**Best for:** E-commerce, SaaS, mixed content types

## Common Environment Variables

All platforms support these common patterns:

```bash
# Public variables (exposed to client)
PUBLIC_API_URL=https://api.example.com
PUBLIC_APP_NAME=MyApp
PUBLIC_ANALYTICS_ID=UA-XXXXX-Y

# Server-only variables (never exposed)
DATABASE_URL=postgresql://...
API_KEY=secret-key
JWT_SECRET=jwt-secret
SMTP_PASSWORD=smtp-pass

# App configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## Deployment Checklist

Before deploying to production:

### Security
- [ ] Remove debug logs and console statements
- [ ] Set secure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Configure CSP headers
- [ ] Set up CORS properly
- [ ] Review authentication/authorization

### Performance
- [ ] Enable compression (gzip/brotli)
- [ ] Optimize images
- [ ] Configure CDN
- [ ] Enable aggressive caching
- [ ] Minimize bundle size
- [ ] Test loading performance

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics
- [ ] Monitor server health
- [ ] Set up logging
- [ ] Create alerts for errors

### Testing
- [ ] Test in production-like environment
- [ ] Verify all environment variables
- [ ] Test error pages (404, 500)
- [ ] Check mobile responsiveness
- [ ] Verify SEO meta tags
- [ ] Test on multiple browsers

## CI/CD Examples

### GitHub Actions (Vercel)
```yaml
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
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### GitHub Actions (Netlify)
```yaml
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
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

### GitHub Actions (Cloudflare Pages)
```yaml
name: Deploy to Cloudflare Pages
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
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: philjs-app
          directory: dist
```

### GitHub Actions (Docker)
```yaml
name: Build and Push Docker
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: username/philjs-app:latest
```

## Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
- Client variables must start with `PUBLIC_`
- Server variables should NOT start with `PUBLIC_`
- Redeploy after adding new variables
- Check variable is set for correct environment

### Out of Memory
```json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
  }
}
```

### Function Timeouts
- Vercel: 10s (Hobby), 60s (Pro)
- Netlify: 10s (Functions), 50ms (Edge)
- Cloudflare: No timeout for Workers
- Optimize slow operations or use background jobs

## Performance Comparison

| Platform | Cold Start | Locations | Build Time | Free Tier |
|----------|-----------|-----------|------------|-----------|
| **Vercel** | 50-200ms | 100+ | Fast | 100GB bandwidth |
| **Netlify** | 100-500ms | Global | Fast | 100GB bandwidth |
| **Cloudflare** | ~0ms | 275+ | Fast | Unlimited |
| **Docker** | N/A | Custom | Medium | Self-hosted |

## Support & Resources

- [PhilJS Documentation](/)
- [Best Practices](/docs/best-practices/deployment.md)
- [Performance Optimization](/docs/performance/overview.md)
- [Security Guide](/docs/best-practices/security.md)

## Next Steps

1. Choose your deployment platform
2. Follow the platform-specific guide
3. Set up CI/CD pipeline
4. Configure monitoring and analytics
5. Set up custom domain
6. Deploy!

---

**Tip:** Start with Vercel or Netlify for the simplest deployment experience. Move to Cloudflare Pages for maximum performance and global reach. Use Docker for full control and self-hosting.

**Note:** PhilJS's resumability feature means zero hydration cost, making it perfect for edge deployment on any platform!

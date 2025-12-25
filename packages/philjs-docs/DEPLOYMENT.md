# PhilJS Documentation Deployment Guide

This guide covers deploying the PhilJS documentation site to various platforms.

## Quick Deploy

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/philjs/philjs&root-directory=packages/philjs-docs)

1. Click the button above or run:
```bash
cd packages/philjs-docs
npx vercel
```

2. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SITE_URL`: Your production URL

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command**: `pnpm run build`
   - **Build output directory**: `packages/philjs-docs/.next`
   - **Root directory**: `/`
3. Add environment variable:
   - `NEXT_PUBLIC_SITE_URL`: Your Pages URL

Or use Wrangler CLI:
```bash
cd packages/philjs-docs
npx wrangler pages deploy .next --project-name=philjs-docs
```

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/philjs/philjs)

1. Click the button above or connect your repository
2. Configure build settings:
   - **Base directory**: `packages/philjs-docs`
   - **Build command**: `pnpm run build`
   - **Publish directory**: `packages/philjs-docs/.next`

### GitHub Pages (Static Export)

1. Enable static export:
```bash
cd packages/philjs-docs
STATIC_EXPORT=true pnpm run build
```

2. Deploy the `out` directory to GitHub Pages:
```bash
npx gh-pages -d out
```

Or use the included GitHub Action workflow.

### Self-Hosted (Docker)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build --filter=philjs-docs

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/packages/philjs-docs/.next/standalone ./
COPY --from=builder /app/packages/philjs-docs/.next/static ./.next/static
COPY --from=builder /app/packages/philjs-docs/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t philjs-docs .
docker run -p 3000:3000 philjs-docs
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Production site URL | `https://philjs.dev` |
| `STATIC_EXPORT` | Enable static HTML export | `false` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | - |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia search app ID | - |
| `NEXT_PUBLIC_ALGOLIA_API_KEY` | Algolia search API key | - |

## Custom Domain Setup

### Vercel
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS with CNAME record pointing to `cname.vercel-dns.com`

### Cloudflare Pages
1. Go to Pages project > Custom domains
2. Add your domain
3. DNS is automatically configured if using Cloudflare DNS

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Configure DNS with CNAME record

## Build Optimizations

### Image Optimization
Images are automatically optimized via Next.js Image component. For static export, set `unoptimized: true` in next.config.mjs.

### Search Indexing
The docs support Algolia DocSearch. To enable:
1. Apply for DocSearch at https://docsearch.algolia.com/
2. Add your credentials to environment variables
3. The search UI will automatically activate

### Analytics
Google Analytics is supported. Add your GA4 measurement ID to `NEXT_PUBLIC_GA_ID`.

## Troubleshooting

### Build Failures
1. Ensure all workspace dependencies are built first:
   ```bash
   pnpm run build --filter=philjs-docs^...
   ```

2. Clear Next.js cache:
   ```bash
   rm -rf packages/philjs-docs/.next
   ```

### MDX Issues
Ensure rehype plugins are compatible with your Node version. If issues persist, try:
```bash
pnpm add -D @mdx-js/loader@latest
```

### Memory Issues
For large documentation sites, increase Node memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm run build
```

## Continuous Deployment

The included GitHub Actions workflow automatically:
1. Builds on push to main
2. Deploys previews for pull requests
3. Deploys to production on merge

Secrets required:
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

# PhilJS Documentation

The official documentation site for PhilJS, built with the PhilJS docs pipeline and TypeScript-first tooling.

## Features

- Comprehensive documentation for TypeScript and Rust APIs
- Interactive code playground with live preview
- Full-text search powered by Fuse.js
- Dark mode support
- Mobile-responsive design
- MDX support for documentation pages

## Getting Started

### Prerequisites

- Node.js 24+ (Node 25 supported)
- pnpm 9+

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:3000`.

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Deployment

### Quick Deploy

#### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/philjs/philjs&root-directory=packages/philjs-docs)

```bash
# Deploy to production
pnpm deploy:vercel

# Deploy preview
pnpm deploy:vercel:preview
```

#### Cloudflare Pages

```bash
# Deploy to Cloudflare Pages
pnpm deploy:cloudflare
```

Make sure you have the Wrangler CLI installed:
```bash
npm install -g wrangler
wrangler login
```

#### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/philjs/philjs)

```bash
# Deploy to production
pnpm deploy:netlify

# Deploy preview
pnpm deploy:netlify:preview
```

Make sure you have the Netlify CLI installed:
```bash
npm install -g netlify-cli
netlify login
```

### Configuration Files

- **vercel.json** - Vercel deployment configuration with caching, redirects, and region settings
- **wrangler.toml** - Cloudflare Pages configuration
- **netlify.toml** - Netlify deployment configuration with Next.js plugin

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SITE_URL` | Production site URL | No |
| `STATIC_EXPORT` | Enable static HTML export for Cloudflare | No |
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID | No |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia DocSearch app ID | No |
| `NEXT_PUBLIC_ALGOLIA_API_KEY` | Algolia DocSearch API key | No |

## Project Structure

```
packages/philjs-docs/
 src/
    app/                  # Next.js App Router pages
       docs/            # Documentation pages
          getting-started/
          core-concepts/
          guides/
          api/
          tutorials/
          rust-guide/
       examples/        # Example gallery
       playground/      # Interactive playground
    components/          # Shared components
        Header.tsx       # Site header with navigation
        Sidebar.tsx      # Documentation sidebar
        Search.tsx       # Search dialog
        CodeBlock.tsx    # Syntax-highlighted code blocks
        Playground.tsx   # Interactive code playground
        APIReference.tsx # API documentation component
 public/                  # Static assets
 vercel.json             # Vercel configuration
 wrangler.toml           # Cloudflare configuration
 netlify.toml            # Netlify configuration
 next.config.mjs         # Next.js configuration
 tailwind.config.ts      # Tailwind CSS configuration
```

## Documentation Sections

### Getting Started
- Installation guide
- Quick start tutorials (TypeScript and Rust)
- Project structure overview
- IDE setup

### Core Concepts
- Signals and reactivity
- Components
- Effects and memos
- Stores
- Server-side rendering

### Guides
- SSR & Hydration
- Islands Architecture
- LiveView
- Routing
- Forms
- Styling
- State Management
- Data Fetching
- Authentication
- Deployment

### API Reference
- philjs-core
- philjs-router
- philjs-ssr
- philjs-forms
- Component Library (philjs-ui)

### Rust Guide
- Rust quickstart
- cargo-philjs CLI
- View macro syntax
- Server functions
- Axum integration
- WASM deployment

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm build:static` | Build static export (for Cloudflare) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm deploy:vercel` | Deploy to Vercel (production) |
| `pnpm deploy:vercel:preview` | Deploy to Vercel (preview) |
| `pnpm deploy:cloudflare` | Deploy to Cloudflare Pages |
| `pnpm deploy:netlify` | Deploy to Netlify (production) |
| `pnpm deploy:netlify:preview` | Deploy to Netlify (preview) |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting: `pnpm lint && pnpm typecheck`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: (none detected)
- Source files: (none detected)

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT License - see [LICENSE](../../LICENSE) for details.

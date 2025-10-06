# PhilJS v0.1 - Quick Start Guide

## What Was Built

A complete monorepo for PhilJS, a modern frontend framework with:

- ✅ 7 core packages (philjs-core, philjs-ssr, philjs-router, philjs-islands, philjs-ai, philjs-devtools, create-philjs)
- ✅ ESLint config package with a11y and security plugins
- ✅ Storefront example with loaders, actions, signals, islands, View Transitions, and AI
- ✅ Docs site placeholder
- ✅ Full CI/CD with GitHub Actions
- ✅ Unit tests (Vitest) and E2E tests (Playwright)
- ✅ Performance budgets enforced in CI
- ✅ PWA support with service worker
- ✅ Real User Monitoring (RUM) for Core Web Vitals
- ✅ Developer tools overlay

## Getting Started

```bash
# 1. Verify installation (should already be done)
cd /Users/pjb/Git/philjs

# 2. Install dependencies (already completed)
pnpm install

# 3. Build all packages (already completed)
pnpm build

# 4. Run unit tests
pnpm test

# 5. Start the storefront example
pnpm dev
# Opens at http://localhost:3000

# 6. (Optional) Start the AI demo server in another terminal
node examples/storefront/server/ai.js
# Runs on http://localhost:8787
```

## Project Structure

```
philjs/
  packages/
    philjs-core/         # Signals, memos, resources
    philjs-router/       # File-based routing
    philjs-ssr/          # SSR streaming, loaders, actions
    philjs-islands/      # Islands architecture
    philjs-devtools/     # Developer tools
    philjs-ai/           # AI adapter with providers
    create-philjs/       # CLI scaffolding tool
    eslint-config-philjs/ # ESLint configuration
  examples/
    storefront/          # Full e-commerce demo
    docs-site/           # Documentation (placeholder)
  .github/workflows/     # CI/CD pipelines
```

## Key Files

- [README.md](README.md) - Main documentation
- [packages/philjs-core/README.md](packages/philjs-core/README.md) - Signals API
- [examples/storefront/README.md](examples/storefront/README.md) - Storefront guide
- [.github/workflows/ci.yml](.github/workflows/ci.yml) - CI configuration

## Available Commands

```bash
# Monorepo
pnpm build         # Build all packages
pnpm test          # Run all tests
pnpm lint          # Lint all packages
pnpm typecheck     # Type-check all packages
pnpm dev           # Start storefront dev server

# Individual packages
pnpm --filter philjs-core build
pnpm --filter philjs-core test
pnpm --filter storefront test:e2e
```

## Features Implemented

### Core Packages

1. **philjs-core**: Reactive signals with subscribe/set API
2. **philjs-ssr**: Loaders, actions, SSR streaming, resumability helpers
3. **philjs-router**: File-based routing manifest
4. **philjs-islands**: Selective hydration with IntersectionObserver
5. **philjs-ai**: Typed prompts, HTTP provider, echo provider for testing
6. **philjs-devtools**: Runtime overlay showing islands, hydration status, AI metrics

### Storefront Example

- Product listing page with featured products
- Product detail page with dynamic quantity/price calculation
- Islands architecture demo (Related products)
- AI integration placeholder
- View Transitions API wrapper
- Speculation Rules for prefetch/prerender
- RUM tracking (LCP, CLS, INP)
- PWA manifest and service worker

### Developer Experience

- **Build**: Rollup for production, Vite for dev
- **Tests**: Vitest for unit, Playwright for E2E
- **Linting**: ESLint with a11y and security plugins
- **Formatting**: Prettier
- **Versioning**: Changesets
- **CI**: GitHub Actions with perf budgets

## Next Steps

1. **Implement actual JSX/TSX rendering**: The current examples use JSX syntax but need a proper renderer
2. **Build the dev server**: Currently uses basic Vite, needs SSR integration
3. **Add file-based routing**: Implement actual route discovery and matching
4. **Enhance islands hydration**: Connect to actual component chunks
5. **Expand AI features**: Add more providers (OpenAI, Anthropic, etc.)
6. **Create documentation site**: Use the docs-site example
7. **Add security features**: CSP helpers, cookie utilities
8. **Performance optimizations**: HTTP 103 Early Hints, Priority Hints

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (after building packages)
pnpm build
pnpm --filter storefront test:e2e

# Watch mode
pnpm --filter philjs-core test -- --watch
```

## Troubleshooting

### Build fails

Make sure you have Node 18+ and pnpm 9+ installed:

```bash
node --version  # Should be v18+
pnpm --version  # Should be 9+
```

### Dev server won't start

Ensure all packages are built first:

```bash
pnpm build
pnpm dev
```

### Tests fail

Some tests may require packages to be built:

```bash
pnpm build
pnpm test
```

## Architecture Decisions

1. **TypeScript optional**: Source is JS/JSDoc, TS types generated on build
2. **No custom bundler**: Using Rollup/Vite for v0.1 (Rust bundler future milestone)
3. **Islands over SPA**: Minimize JavaScript, maximize performance
4. **Resumability**: Serialize state on server, resume on client
5. **AI-first**: Type-safe prompts with cost tracking built in

## License

MIT

## Contributing

See individual package READMEs for contribution guidelines.

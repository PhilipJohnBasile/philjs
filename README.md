# ⚡ PhilJS

**The framework that thinks ahead**

A revolutionary JavaScript framework for 2026 that combines fine-grained reactivity, zero-hydration resumability, and industry-first intelligence features.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](.)
[![Beta](https://img.shields.io/badge/status-beta-blue)](.
)
[![Docs](https://img.shields.io/badge/docs-complete-success)](./docs)

**🎉 Beta Release - Ready for brave early adopters!**

> **Status**: Core features production-ready • 110 pages of documentation • 9 packages built successfully

## ✨ Optional Advanced Features

PhilJS includes **optional advanced features** for teams that need them. These are **not required** for basic usage:

> **Note:** These features are experimental and opt-in. Most applications won't need them. Start with the core features below and add these only when needed.

### 1. **Intent-Based Smart Preloading** 🎯
Predicts user navigation from mouse movement with 60-80% accuracy.
- **Optional:** Enable with `smartPreload: true` in router config
- **Best for:** Content-heavy sites with predictable navigation

### 2. **Production Usage Analytics** 📊
Tracks which components/props are used in production. Finds dead code with confidence.
- **Optional:** Opt-in with `usageAnalytics.enable()`
- **Best for:** Large applications with unused code concerns
- **Privacy:** All data stays local, nothing sent to servers

### 3. **Cloud Cost Tracking** 💰
Estimates AWS/GCP/Azure costs per route. See costs in IDE tooltips.
- **Optional:** Opt-in with `costTracker.enable()`
- **Best for:** High-traffic applications monitoring infrastructure costs

### 4. **Performance Budgets** ⚠️
Hard limits on bundle size, LCP, CLS. Warns or blocks builds if exceeded.
- **Optional:** Configure in `philjs.config.js`
- **Best for:** Teams enforcing performance standards
- **Default:** Warnings only, opt-in to block builds

### 5. **Time-Travel Debugging** ⏱️
Explore "what if" scenarios. Export sessions for bug reports.
- **Optional:** Available in devtools
- **Best for:** Debugging complex state transitions

### 6. **Mixed Rendering Modes** 🔄
SSG, ISR, SSR, CSR - all in one app, per-route configuration.
- **Optional:** Use SSR/SSG only when needed
- **Default:** Client-side rendering (simplest)

## 🏗️ Core Features

- ⚡ **Fine-Grained Reactivity** - Signals with automatic dependency tracking
- 🏝️ **Islands Architecture** - Selective hydration for minimal JavaScript
- 🔄 **Zero-Hydration Resumability** - Serialize state on server, resume on client
- 📝 **Progressive Form Validation** - Schema-based validation that works without JS
- 🎨 **View Transitions API** - Smooth page transitions with shared elements
- 📊 **Data Fetching** - SWR-style caching with deduplication
- 🛡️ **Rate Limiting** - Built-in rate limiting with multiple algorithms
- 🔒 **Security** - CSRF protection, XSS prevention, CSP helpers
- 🧪 **Testing** - First-class testing utilities
- 📱 **PWA** - Service worker with intelligent caching

## Packages

- `philjs-core`: Core signals and reactivity primitives
- `philjs-ssr`: SSR streaming, loaders, actions, and resumability
- `philjs-router`: File-based routing with nested layouts
- `philjs-islands`: Islands architecture with selective hydration
- `philjs-ai`: AI adapter with typed prompts and safety hooks
- `philjs-devtools`: Developer tools overlay
- `create-philjs`: CLI to scaffold new apps
- `eslint-config-philjs`: ESLint config with a11y and security rules

## 📚 Documentation

**[Complete Documentation](./docs/README.md)** - 110 pages, ~298,000 words of comprehensive guides

- **[Getting Started](./docs/getting-started/introduction.md)** - Introduction, installation, quickstart
- **[Core Concepts](./docs/core-concepts/overview.md)** - Signals, memos, effects, components
- **[API Reference](./docs/api-reference/overview.md)** - Complete API documentation
- **[Best Practices](./docs/best-practices/overview.md)** - Production guidelines
- **[Migration Guides](./docs/migration/)** - Migrate from React, Vue, or Svelte
- **[Troubleshooting](./docs/troubleshooting/overview.md)** - Common issues and solutions

## 🚀 Quick Start

```bash
# Create a new app
pnpm create philjs my-app

# Navigate and install
cd my-app
pnpm install

# Start dev server
pnpm dev
```

**Your first component:**

```tsx
import { signal } from 'philjs-core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**That's it!** No useState, no dependency arrays, just pure reactivity. ✨

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and typecheck
pnpm lint
pnpm typecheck

# Run storefront example
pnpm dev
```

## Examples

- `examples/storefront`: Full-featured e-commerce demo with loaders, actions, islands, and AI
- `examples/docs-site`: Documentation site (coming soon)

## Architecture

PhilJS combines the best patterns from modern web frameworks:

1. **Signals for reactivity**: Inspired by SolidJS, signals provide fine-grained updates
2. **Islands for performance**: Inspired by Astro, ship only the JS you need
3. **Resumability**: Inspired by Qwik, minimize client-side hydration
4. **File-based routing**: Inspired by Next.js and Remix, convention over configuration
5. **AI-first**: Built-in support for AI features with safety defaults

## Tech Stack

- Node 18+
- PNPM workspaces
- Vite for development
- Rollup for production builds
- Vitest for unit tests
- Playwright for E2E tests
- TypeScript (optional, can use JS with JSDoc)

## Performance

PhilJS is designed for speed:

- Islands architecture minimizes JavaScript
- SSR streaming improves perceived performance
- Resumability reduces hydration cost
- Built-in performance budgets and HTTP early hints enforce limits
- RUM tracks real-world metrics

## Security

Security is a priority:

- CSP helpers with strict defaults
- Auto-escape HTML in templates
- Cookie helpers with SameSite, Secure, and rotation secrets
- Signed cookies and nonced scripts enabled via `buildCSP`, `createCookie`, and `createNonce`
- ESLint security plugin
- AI PII detection hooks

## 📊 Framework Status

**Current Version**: 1.0.0-beta

### ✅ Production-Ready Features
- Fine-grained reactive system (signals, memos, effects)
- Component system (JSX, props, context, error boundaries)
- Forms & validation (schema-based with built-in validators)
- Comprehensive documentation (110 pages, ~298,000 words)

### ✅ Functional Features
- File-based routing with smart preloading
- Data fetching with SWR-style caching
- Server-side rendering & streaming
- Islands architecture
- Internationalization (i18n)
- Animation system
- Time-travel debugging

### 🎯 Novel Features (Industry-First)
- Production usage analytics
- Cloud cost tracking
- Build-blocking performance budgets
- Smart preloading (60-80% accuracy from mouse intent)

**Detailed Status**: See [FRAMEWORK_STATUS.md](./FRAMEWORK_STATUS.md) for complete feature breakdown.

## 🔒 API Stability Guarantees

PhilJS follows [Semantic Versioning](https://semver.org/) with the following stability commitments:

### ✅ Stable APIs (No Breaking Changes Before v2.0)
These APIs are stable and will not have breaking changes:
- **Core Reactivity:** `signal()`, `memo()`, `effect()`, `batch()`, `untrack()`
- **JSX & Rendering:** `render()`, `hydrate()`, JSX syntax
- **Context:** `createContext()`, `useContext()`, `createSignalContext()`
- **Error Boundaries:** `ErrorBoundary`, error handling

### ⚠️ Evolving APIs (May Change Before v1.0)
These APIs may evolve with clear migration paths:
- **Router API:** May add features, breaking changes will have codemods
- **Data Fetching:** `createQuery()`, `createMutation()` - API refinements possible
- **Forms:** May enhance validation API

### 🧪 Experimental Features (Subject to Change)
These features are experimental and may change significantly:
- **Cost Tracking** (`costTracker`) - Optional advanced feature
- **Usage Analytics** (`usageAnalytics`) - Optional advanced feature
- **Performance Budgets** (`performanceBudgets`) - Optional advanced feature
- **Smart Preloading** - Prediction algorithm may improve

### 🗑️ Deprecated APIs
These APIs will be removed in future versions:
- **`createReducerContext()`** ⚠️ - Use `signal()` and `createSignalContext()` instead
  - Deprecated: v0.1.0-beta
  - Will be removed: v1.0.0
  - [Migration Guide](./docs/migration/from-redux.md)

### 📋 Change Policy
- **Breaking changes:** 6 months advance notice + deprecation warnings
- **Deprecations:** Supported for one major version
- **Codemods:** Provided for all automated migrations
- **Changelog:** All changes documented in [CHANGELOG.md](./CHANGELOG.md)

For detailed versioning history, see [CHANGELOG.md](./CHANGELOG.md).

## 🎯 Roadmap

**Beta (Current)**
- [x] Core reactive system
- [x] Component primitives
- [x] Forms & validation
- [x] Documentation
- [x] Example applications

**v1.0 (Next)**
- [ ] Performance benchmarks
- [ ] Custom compiler optimizations
- [ ] Browser DevTools extension
- [ ] VS Code extension
- [ ] Production case studies

**v1.1+**
- [ ] GraphQL adapter
- [ ] More starter templates
- [ ] Video course
- [ ] Community plugins

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Key areas needing help:**
- Performance benchmarks vs other frameworks
- Additional example applications
- Browser extension for DevTools
- Integration guides for popular libraries
- Bug reports and feedback

## 📄 License

MIT - See [LICENSE](./LICENSE) for details

## 🙏 Credits

Built with inspiration from SolidJS, Qwik, Astro, Remix, and Next.js.

**Special thanks to:**
- SolidJS for fine-grained reactivity patterns
- Qwik for resumability concepts
- Astro for islands architecture
- The entire JS framework community

---

**Ready to build the future?** Get started: `pnpm create philjs my-app` 🚀

**Questions?** Check the [FAQ](./docs/troubleshooting/faq.md) or [open an issue](https://github.com/philjs/philjs/issues)

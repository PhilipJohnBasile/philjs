# PhilJS Documentation

Welcome to the PhilJS documentation! PhilJS is a modern web framework designed for high performance and developer experience.

## Getting Started

- [Installation](./getting-started/installation.md)
- [Quick Start](./getting-started/quick-start.md)
- [PhilJS Standards](../PHILJS_STANDARDS.md)
- [Migration Guides](./migration/)

## Core Concepts

Core features and APIs that power PhilJS:

- **[Plugin System](./core/plugin-system.md)** - Comprehensive plugin architecture for extending PhilJS
- **[Plugin Quick Reference](./core/plugin-quick-reference.md)** - Fast reference guide for working with plugins
- **[Serialization](./core/serialization.md)** - SuperJSON integration for type-safe data serialization
- **[Serialization Quick Start](./core/serialization-quickstart.md)** - Quick start guide for SuperJSON
- **[Paths and Routing](./core/paths-and-routing.md)** - SvelteKit-style path utilities and glob imports

## Packages

### API & Middleware

- **[Edge Middleware](./packages/api/edge-middleware.md)** - Edge runtime middleware, caching, and geolocation
- **[Session Management](./packages/api/sessions.md)** - Flash messages and enhanced cookie sessions
- **[Session Migration Guide](./packages/api/session-migration.md)** - Migrating to enhanced sessions

### Authentication

- **[Auth Guide](./packages/auth/guide.md)** - Complete authentication guide with OAuth providers

### Database

- **[Database Migrations](./packages/database/migrations.md)** - Multi-database migration system for Prisma and Drizzle

### Islands Architecture

- **[Islands Quick Start](./packages/islands/quick-start.md)** - Get started with selective hydration
- **[Multi-Framework Islands](./packages/islands/multi-framework.md)** - Using React, Preact, Vue, and Svelte together

### Routing

- **[Advanced Features](./packages/router/advanced-features.md)** - Route groups, parallel routes, and more

### Deployment

- **[Platform Adapters](./packages/adapters/platforms.md)** - Deploy to Vercel, Netlify, Cloudflare, AWS, and more

## Guides

- [Rust Integration](./guides/RUST_INTEGRATION_GUIDE.md)
- [Authentication](./packages/auth/guide.md)
- [Deployment](./deployment/overview.md)
- [Performance](./performance/overview.md)
- [Testing](./best-practices/testing.md)

## API Reference

- [Auto-generated API docs](./api-reference/)

## Examples

Browse complete example applications:

- [Basic Examples](../examples/) _(See individual package examples)_

## Contributing

- [Contribution Guide](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)

## Architecture

- [Architecture Best Practices](./best-practices/architecture.md)
- [Design Principles](./best-practices/overview.md)

---

## Quick Links

- [Official Website](https://philjs.dev)
- [GitHub Repository](https://github.com/philjs/philjs)
- [Discord Community](https://discord.gg/philjs)
- [Twitter](https://twitter.com/philjsdev)

## Package Documentation

For package-specific documentation, see:

- \`packages/philjs-core/README.md\`
- \`packages/philjs-router/README.md\`
- \`packages/philjs-ssr/README.md\`
- \`packages/philjs-api/README.md\`
- \`packages/philjs-auth/README.md\`
- \`packages/philjs-db/README.md\`
- \`packages/philjs-image/README.md\`
- \`packages/philjs-islands/README.md\`
- \`packages/philjs-testing/README.md\`
- \`packages/philjs-adapters/README.md\`

## License

MIT

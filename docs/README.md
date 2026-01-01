# PhilJS Documentation

Welcome to the PhilJS documentation! PhilJS is a modern web framework designed for high performance and developer experience.

## PhilJS Book (Canonical)

- [Book Summary](./philjs-book/src/SUMMARY.md)
- [Book PDF](./philjs-book/dist/philjs-book.pdf)
- [Book EPUB](./philjs-book/dist/philjs-book.epub)
- [Publishing Workflow](./philjs-book/src/publishing/workflow.md)

## Start Here (Book)

- [Getting Started Overview](./philjs-book/src/getting-started/introduction.md)
- [Installation](./philjs-book/src/getting-started/installation.md)
- [Quick Start](./philjs-book/src/getting-started/quick-start.md)
- [Thinking in PhilJS](./philjs-book/src/getting-started/thinking-in-philjs.md)
- [PhilJS Standards](../PHILJS_STANDARDS.md)
- [Migration Guides](./philjs-book/src/migration/react.md)

## Core Chapters (Book)

- [Components](./philjs-book/src/core/components.md)
- [Signals and Reactivity](./philjs-book/src/core/signals.md)
- [Effects and Memos](./philjs-book/src/core/effects-memos.md)
- [JSX Basics](./philjs-book/src/rendering/jsx.md)
- [Routing Overview](./philjs-book/src/routing/overview.md)
- [Data Layer Overview](./philjs-book/src/data/overview.md)
- [SSR Overview](./philjs-book/src/ssr/overview.md)
- [Performance Overview](./philjs-book/src/performance/overview.md)
- [Security Overview](./philjs-book/src/security/overview.md)
- [Deployment Overview](./philjs-book/src/deployment/overview.md)

## Package and System Guides

- **[Plugin System](./core/plugin-system.md)** - Extending PhilJS with plugins
- **[Plugin Quick Reference](./core/plugin-quick-reference.md)** - Quick reference for plugin APIs
- **[Serialization](./core/serialization.md)** - SuperJSON integration for type-safe data
- **[Serialization Quick Start](./core/serialization-quickstart.md)** - Quick start for serialization
- **[Paths and Routing](./core/paths-and-routing.md)** - Path utilities and glob imports

## Packages

- **[Package Atlas (Book)](./philjs-book/src/packages/atlas.md)** - Full package reference with API snapshots (run `pnpm book:packages` to refresh)

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
- [Rust Quickstart (Book Appendix)](./philjs-book/src/appendix/rust-192.md)
- [TypeScript Deep Dive (Book Appendix)](./philjs-book/src/appendix/typescript-6-deep-dive.md)
- [Authentication](./packages/auth/guide.md)
- [Deployment](./philjs-book/src/deployment/overview.md)
- [Performance](./philjs-book/src/performance/overview.md)
- [Testing](./philjs-book/src/testing/overview.md)

## API Reference

- [Auto-generated API docs](./api-reference/)
- [Book Index](./philjs-book/src/appendix/index.md)

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

## Package Index

<!-- PACKAGE_INDEX_START -->
- [@philjs/3d](../packages/philjs-3d/README.md)
- [@philjs/3d-physics](../packages/philjs-3d-physics/README.md)
- [@philjs/a11y-ai](../packages/philjs-a11y-ai/README.md)
- [@philjs/ab-testing](../packages/philjs-ab-testing/README.md)
- [@philjs/adapters](../packages/philjs-adapters/README.md)
- [@philjs/ai](../packages/philjs-ai/README.md)
- [@philjs/ai-agents](../packages/philjs-ai-agents/README.md)
- [@philjs/ambient](../packages/philjs-ambient/README.md)
- [@philjs/analytics](../packages/philjs-analytics/README.md)
- [@philjs/api](../packages/philjs-api/README.md)
- [@philjs/atoms](../packages/philjs-atoms/README.md)
- [@philjs/auth](../packages/philjs-auth/README.md)
- [@philjs/benchmark](../packages/philjs-benchmark/README.md)
- [@philjs/biometric](../packages/philjs-biometric/README.md)
- [@philjs/build](../packages/philjs-build/README.md)
- [@philjs/builder](../packages/philjs-builder/README.md)
- [@philjs/carbon](../packages/philjs-carbon/README.md)
- [@philjs/cdn](../packages/philjs-cdn/README.md)
- [@philjs/cells](../packages/philjs-cells/README.md)
- [@philjs/charts](../packages/philjs-charts/README.md)
- [@philjs/cli](../packages/philjs-cli/README.md)
- [@philjs/collab](../packages/philjs-collab/README.md)
- [@philjs/compiler](../packages/philjs-compiler/README.md)
- [@philjs/content](../packages/philjs-content/README.md)
- [@philjs/core](../packages/philjs-core/README.md)
- [@philjs/crossdevice](../packages/philjs-crossdevice/README.md)
- [@philjs/css](../packages/philjs-css/README.md)
- [@philjs/dashboard](../packages/philjs-dashboard/README.md)
- [@philjs/db](../packages/philjs-db/README.md)
- [@philjs/desktop](../packages/philjs-desktop/README.md)
- [@philjs/devtools](../packages/philjs-devtools/README.md)
- [@philjs/devtools-extension](../packages/philjs-devtools-extension/README.md)
- [@philjs/digital-twin](../packages/philjs-digital-twin/README.md)
- [@philjs/dnd](../packages/philjs-dnd/README.md)
- [@philjs/docs](../packages/philjs-docs/README.md)
- [@philjs/edge](../packages/philjs-edge/README.md)
- [@philjs/edge-ai](../packages/philjs-edge-ai/README.md)
- [@philjs/edge-mesh](../packages/philjs-edge-mesh/README.md)
- [@philjs/editor](../packages/philjs-editor/README.md)
- [@philjs/email](../packages/philjs-email/README.md)
- [@philjs/enterprise](../packages/philjs-enterprise/README.md)
- [@philjs/errors](../packages/philjs-errors/README.md)
- [@philjs/event-sourcing](../packages/philjs-event-sourcing/README.md)
- [@philjs/export](../packages/philjs-export/README.md)
- [@philjs/eye-tracking](../packages/philjs-eye-tracking/README.md)
- [@philjs/forms](../packages/philjs-forms/README.md)
- [@philjs/genui](../packages/philjs-genui/README.md)
- [@philjs/gesture](../packages/philjs-gesture/README.md)
- [@philjs/go](../packages/philjs-go/README.md)
- [@philjs/graphql](../packages/philjs-graphql/README.md)
- [@philjs/haptic](../packages/philjs-haptic/README.md)
- [@philjs/hollow](../packages/philjs-hollow/README.md)
- [@philjs/html](../packages/philjs-html/README.md)
- [@philjs/hypermedia](../packages/philjs-htmx/README.md)
- [@philjs/i18n](../packages/philjs-i18n/README.md)
- [@philjs/image](../packages/philjs-image/README.md)
- [@philjs/inspector](../packages/philjs-inspector/README.md)
- [@philjs/intent](../packages/philjs-intent/README.md)
- [@philjs/islands](../packages/philjs-islands/README.md)
- [@philjs/jobs](../packages/philjs-jobs/README.md)
- [@philjs/kotlin](../packages/philjs-kotlin/README.md)
- [@philjs/liveview](../packages/philjs-liveview/README.md)
- [@philjs/llm-ui](../packages/philjs-llm-ui/README.md)
- [@philjs/maps](../packages/philjs-maps/README.md)
- [@philjs/media-stream](../packages/philjs-media-stream/README.md)
- [@philjs/meta](../packages/philjs-meta/README.md)
- [@philjs/migrate](../packages/philjs-migrate/README.md)
- [@philjs/motion](../packages/philjs-motion/README.md)
- [@philjs/native](../packages/philjs-native/README.md)
- [@philjs/neural](../packages/philjs-neural/README.md)
- [@philjs/observability](../packages/philjs-observability/README.md)
- [@philjs/offline](../packages/philjs-offline/README.md)
- [@philjs/openapi](../packages/philjs-openapi/README.md)
- [@philjs/optimizer](../packages/philjs-optimizer/README.md)
- [@philjs/payments](../packages/philjs-payments/README.md)
- [@philjs/pdf](../packages/philjs-pdf/README.md)
- [@philjs/perf](../packages/philjs-perf/README.md)
- [@philjs/perf-budget](../packages/philjs-perf-budget/README.md)
- [@philjs/playground](../packages/philjs-playground/README.md)
- [@philjs/plugin-analytics](../packages/philjs-plugin-analytics/README.md)
- [@philjs/plugin-i18n](../packages/philjs-plugin-i18n/README.md)
- [@philjs/plugin-pwa](../packages/philjs-plugin-pwa/README.md)
- [@philjs/plugin-seo](../packages/philjs-plugin-seo/README.md)
- [@philjs/plugin-tailwind](../packages/philjs-plugin-tailwind/README.md)
- [@philjs/plugins](../packages/philjs-plugins/README.md)
- [@philjs/poem](../packages/philjs-poem/README.md)
- [@philjs/pwa](../packages/philjs-pwa/README.md)
- [@philjs/python](../packages/philjs-python/README.md)
- [@philjs/qr](../packages/philjs-qr/README.md)
- [@philjs/quantum](../packages/philjs-quantum/README.md)
- [@philjs/realtime](../packages/philjs-realtime/README.md)
- [@philjs/resumable](../packages/philjs-resumable/README.md)
- [@philjs/rich-text](../packages/philjs-rich-text/README.md)
- [@philjs/rocket](../packages/philjs-rocket/README.md)
- [@philjs/router](../packages/philjs-router/README.md)
- [@philjs/router-typesafe](../packages/philjs-router-typesafe/README.md)
- [@philjs/rpc](../packages/philjs-rpc/README.md)
- [@philjs/runtime](../packages/philjs-runtime/README.md)
- [@philjs/scene](../packages/philjs-scene/README.md)
- [@philjs/screen-share](../packages/philjs-screen-share/README.md)
- [@philjs/security-scanner](../packages/philjs-security-scanner/README.md)
- [@philjs/spatial-audio](../packages/philjs-spatial-audio/README.md)
- [@philjs/sqlite](../packages/philjs-sqlite/README.md)
- [@philjs/ssr](../packages/philjs-ssr/README.md)
- [@philjs/storage](../packages/philjs-storage/README.md)
- [@philjs/storybook](../packages/philjs-storybook/README.md)
- [@philjs/studio](../packages/philjs-studio/README.md)
- [@philjs/styles](../packages/philjs-styles/README.md)
- [@philjs/swift](../packages/philjs-swift/README.md)
- [@philjs/table](../packages/philjs-table/README.md)
- [@philjs/tailwind](../packages/philjs-tailwind/README.md)
- [@philjs/templates](../packages/philjs-templates/README.md)
- [@philjs/testing](../packages/philjs-testing/README.md)
- [@philjs/time-travel](../packages/philjs-time-travel/README.md)
- [@philjs/trpc](../packages/philjs-trpc/README.md)
- [@philjs/ui](../packages/philjs-ui/README.md)
- [@philjs/vector](../packages/philjs-vector/README.md)
- [@philjs/vector-store](../packages/philjs-vector-store/README.md)
- [@philjs/video-chat](../packages/philjs-video-chat/README.md)
- [@philjs/virtual](../packages/philjs-virtual/README.md)
- [@philjs/voice](../packages/philjs-voice/README.md)
- [@philjs/vscode](../packages/philjs-vscode/README.md)
- [@philjs/wasm](../packages/philjs-wasm/README.md)
- [@philjs/webgpu](../packages/philjs-webgpu/README.md)
- [@philjs/webrtc](../packages/philjs-webrtc/README.md)
- [@philjs/workers](../packages/philjs-workers/README.md)
- [@philjs/workflow](../packages/philjs-workflow/README.md)
- [@philjs/xr](../packages/philjs-xr/README.md)
- [@philjs/xstate](../packages/philjs-xstate/README.md)
- [@philjs/zig](../packages/philjs-zig/README.md)
- [@philjs/zustand](../packages/philjs-zustand/README.md)
- [create-philjs](../packages/create-philjs/README.md)
- [create-philjs-plugin](../packages/create-philjs-plugin/README.md)
- [eslint-config-philjs](../packages/eslint-config-philjs/README.md)
- [eslint-plugin-philjs](../packages/philjs-eslint/README.md)
<!-- PACKAGE_INDEX_END -->


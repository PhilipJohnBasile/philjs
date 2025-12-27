# PhilJS

The framework that thinks ahead.

PhilJS is a modern JavaScript/TypeScript + Rust framework combining fine-grained reactivity, server-side rendering, and WebAssembly support. Build fast, accessible web applications with first-class Rust integration.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](.)
[![Status](https://img.shields.io/badge/status-alpha-orange)](.)
[![Docs](https://img.shields.io/badge/docs-in--progress-yellow)](./docs)
[![Packages](https://img.shields.io/badge/packages-90+-blue)](./packages)

Current release: v0.0.1 (Alpha)

## Why PhilJS

- Fine-grained reactivity with signals, memos, and effects.
- Zero-hydration resumability with server state serialization.
- Islands architecture for selective hydration.
- Auto-compiler for memoization, batching, and dead code elimination.
- First-party packages for GraphQL, auth, PWA, data, and tooling.
- Production features: security headers, adapters, and testing utilities.

## Quick Start

Prerequisites: Node.js 24+ and a package manager (npm, pnpm, yarn, or bun). See [SUPPORT.md](./SUPPORT.md) for version policy.

```bash
pnpm create philjs my-app
cd my-app
pnpm install
pnpm dev
```

Other package managers:

```bash
npm create philjs@latest my-app
# or
yarn create philjs my-app
# or
bun create philjs my-app
```

## First Component

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

## Documentation

- [Docs Home](./docs/README.md)
- [Getting Started](./docs/getting-started/introduction.md)
- [Learn](./docs/learn/)
- [API Reference](./docs/api-reference/)
- [Advanced Topics](./docs/advanced/)
- [Best Practices](./docs/best-practices/)
- [Migration Guides](./docs/migration/)

## Packages

PhilJS is a monorepo with 90+ packages covering JavaScript/TypeScript and Rust. The framework is in active development. See [packages](./packages) for the full list.

### JavaScript/TypeScript Core:

- `philjs-core` - Fine-grained reactivity with signals, memos, and effects
- `philjs-router` - Type-safe routing with nested layouts
- `philjs-ssr` - Server-side rendering with streaming support
- `philjs-compiler` - Build-time optimizations and transforms
- `philjs-islands` - Islands architecture for partial hydration

### Rust Integration:

- `philjs-rust` - Core Rust framework with reactive primitives
- `philjs-macros` - Procedural macros for component authoring
- `philjs-axum` - Axum web framework integration
- `philjs-actix` - Actix-web framework integration
- `philjs-tauri` - Desktop app support via Tauri

## Examples

- `examples/demo-app` - Feature showcase
- `examples/storefront` - E-commerce example with SSR and islands
- `examples/kitchen-sink` - Comprehensive feature coverage
- `examples/todo-app` - Compiler and reactivity basics
- `examples/docs-site` - Documentation site example

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Project Status

**Current Status: Alpha (v0.0.1)**

PhilJS is under active development. Core functionality is implemented but APIs may change.

- Audit report: [PHILJS_DEEP_AUDIT_DECEMBER_2025.md](./PHILJS_DEEP_AUDIT_DECEMBER_2025.md)
- Documentation: [docs/](./docs)

### What's Working:
- Fine-grained reactivity (signals, memos, effects)
- Server-side rendering with hydration
- Rust/WASM integration with Axum, Actix
- View macros and component system
- Basic routing and forms

### In Progress:
- Comprehensive test coverage
- Performance benchmarks vs other frameworks
- Production deployment guides
- DevTools extension

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and workflow details.

## License

MIT - see [LICENSE](./LICENSE).

# PhilJS

The framework that thinks ahead.

PhilJS is a production-ready JavaScript framework that combines fine-grained reactivity, zero-hydration resumability, and an integrated toolchain for building fast, accessible web apps.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](.)
[![Production Ready](https://img.shields.io/badge/status-production--ready-success)](.)
[![Docs](https://img.shields.io/badge/docs-complete-success)](./docs)
[![Packages](https://img.shields.io/badge/packages-88-blue)](./packages)

Current release: v1.0.0-beta

## Why PhilJS

- Fine-grained reactivity with signals, memos, and effects.
- Zero-hydration resumability with server state serialization.
- Islands architecture for selective hydration.
- Auto-compiler for memoization, batching, and dead code elimination.
- First-party packages for GraphQL, auth, PWA, data, and tooling.
- Production features: security headers, adapters, and testing utilities.

## Quick Start

Prerequisites: Node.js 18+ and a package manager (npm, pnpm, yarn, or bun).

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

PhilJS is a monorepo with 88 packages. Core packages are production-ready; integrations and experimental packages evolve more quickly. See [packages](./packages) for the full list.

Featured core packages:

- `philjs-core` - Reactivity, PPR, Activity, Accessibility, A/B testing
- `philjs-router` - File-based routing with nested layouts
- `philjs-ssr` - SSR streaming, loaders, actions, resumability
- `philjs-compiler` - Auto-memoization, batching, dead code elimination
- `philjs-islands` - Islands architecture and Server Islands

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

## Status and Roadmap

- Status report: [PHILJS_STATUS_DECEMBER_2025.md](./PHILJS_STATUS_DECEMBER_2025.md)
- Documentation status: [docs/DOCUMENTATION_PROJECT_STATUS.md](./docs/DOCUMENTATION_PROJECT_STATUS.md)

Planned updates (2026): performance benchmarks, tutorial series, DevTools improvements, and new templates.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and workflow details.

## License

MIT - see [LICENSE](./LICENSE).

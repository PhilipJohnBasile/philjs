# PhilJS

A TypeScript UI framework built around reactive signals, with packages for rendering, routing, and server-side applications. I built it to explore how much of an application can share one reactive model across the browser and server.

[![Core demo](https://github.com/PhilipJohnBasile/philjs/actions/workflows/core-demo.yml/badge.svg)](https://github.com/PhilipJohnBasile/philjs/actions/workflows/core-demo.yml) [![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Status: experimental, version 0.1.0.** Start with the core below. Packages in this monorepo have different levels of completeness; the small verified example is not a claim that every integration is ready for production.

## Try the reactive core

With **Node.js 24 or newer**, this example runs directly from a fresh checkout without installing dependencies:

```bash
git clone https://github.com/PhilipJohnBasile/philjs.git
cd philjs
node examples/signals-demo.mjs
```

It uses the actual [signals implementation](packages/philjs-core/src/signals.ts) to calculate an order total. Changing the quantity updates the total; batching a price and quantity change triggers one effect update; disposing the effect stops its subscription. The example checks those behaviors before printing:

```text
Initial total: $20
Three items: $60
Batched price + quantity update: $60
Effect disposed; derived total still updates: $40
Signals, memoization, batching, and disposal checks passed.
```

The [Core demo workflow](https://github.com/PhilipJohnBasile/philjs/actions/workflows/core-demo.yml) runs the same command. It covers this source-based example, not a full framework build or browser compatibility matrix.

## Where to look

| Area | Source | What it explores |
| --- | --- | --- |
| Reactivity | [Core](packages/philjs-core) | Signals, derived values, effects, batching, and cleanup |
| Rendering | [JSX runtime](packages/philjs-core/src/jsx-runtime.ts), [SSR](packages/philjs-ssr) | Browser rendering and HTML generation |
| Navigation | [Router](packages/philjs-router) | Application routing |
| Applications | [Todo example](examples/todo-app), [demo app](examples/demo-app) | Larger examples that require the workspace toolchain |
| Systems work | [Rust packages](packages/philjs-rust) | Rust-side framework experiments |

## Work on the framework

The monorepo uses **Node.js 24+ and pnpm 9.15.4**, as declared in [package.json](package.json).

```bash
pnpm install --frozen-lockfile
pnpm --filter @philjs/core test
pnpm --filter @philjs/core build
```

These are the package's development commands. The dependency-free demo above is the smallest entry point; see [CONTRIBUTING.md](CONTRIBUTING.md) for the wider development workflow and [verification notes](docs/VERIFICATION.md) for the checks exercised in the latest documentation refresh.

## Design notes

The core tracks which computations read each signal. Updates notify those computations, memos compute derived values lazily, and explicit cleanup controls subscription lifetime. That makes dependency tracking and update behavior visible in a relatively small implementation.

The surrounding packages are experiments in applying that model to more of an application. Their presence in the repository does not imply a shared maturity level. Check an individual package's code, tests, and example before depending on it.

[Documentation](docs) · [Examples](examples) · [Change log](CHANGELOG.md) · [Issues](https://github.com/PhilipJohnBasile/philjs/issues)

## License

[MIT](LICENSE).

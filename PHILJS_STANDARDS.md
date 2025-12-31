# PhilJS Standards (Canonical)

Version: v0.1.0

PhilJS standards are derived from the current codebase and documentation. This file is the source of truth for aligning docs, sites, examples, and packages.

## Platform + Tooling

- **Node.js**: >= 24 (Node 25 supported).
- **TypeScript**: 6.x, strict by default.
- **Package manager**: pnpm 9.15.4+ (workspace default).
- **Scripts**: use `tsx` for TypeScript scripts.

## Packages + Imports

- **Published packages are scoped**: `@philjs/core`, `@philjs/router`, `@philjs/ssr`, etc.
- **Deep imports use scoped paths**: `@philjs/core/jsx-runtime`, `@philjs/islands/server`, `@philjs/ssr/streaming`, etc.
- **Repo paths stay unscoped**: `packages/philjs-core`, `packages/philjs-router`, etc.

## TypeScript + JSX

- **All code is TypeScript** (`.ts`/`.tsx`). No JavaScript sources in product code or docs examples.
- **JSX runtime**: `jsxImportSource` must be `@philjs/core`.
- **Module resolution**: `bundler` where supported.

## Architecture Alignment (Nexus)

- **Signals-first** reactivity (no VDOM or `useEffect` patterns).
- **Local-first** data assumptions and offline-ready UX.
- **Interoperability** via Web Components + hollow wrappers.

## Documentation + Examples

- **Install commands** must use scoped packages: `pnpm add @philjs/core @philjs/router`.
- **Examples must run on PhilJS** (TS 6.x, Node 24+, JSX via `@philjs/core`).
- **No placeholders**: remove "coming soon", `TODO`, or stubbed APIs from user-facing docs.

## Tests

- **No skipped tests** in active suites.
- **Typecheck and tests must pass** for docs site and example apps.

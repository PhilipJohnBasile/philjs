# @philjs/zig

Zig bindings for PhilJS - Ultra-fast low-level performance tooling (Bun-level speed)

<!-- PACKAGE_GUIDE_START -->
## Overview

Zig bindings for PhilJS - Ultra-fast low-level performance tooling (Bun-level speed)

## Focus Areas

- philjs, zig, performance, wasm, simd, fast, low-level, bun, runtime

## Entry Points

- packages/philjs-zig/src/index.ts
- packages/philjs-zig/src/runtime.ts
- packages/philjs-zig/src/wasm.ts

## Quick Start

```ts
import { SIMDOps, ZigRuntime, buildZig } from '@philjs/zig';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- SIMDOps
- ZigRuntime
- buildZig
- checkZigInstalled
- createSIMDOps
- initZigProject
- loadWasmModule
- simdSupported
- streamWasmModule
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/zig
```
## Usage

```ts
import { SIMDOps, ZigRuntime, buildZig } from '@philjs/zig';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./runtime, ./wasm
- Source files: packages/philjs-zig/src/index.ts, packages/philjs-zig/src/runtime.ts, packages/philjs-zig/src/wasm.ts

### Public API
- Direct exports: SIMDOps, ZigRuntime, buildZig, checkZigInstalled, createSIMDOps, initZigProject, loadWasmModule, simdSupported, streamWasmModule
- Re-exported names: (none detected)
- Re-exported modules: ./runtime.js, ./types.js, ./wasm.js
<!-- API_SNAPSHOT_END -->

## License

MIT

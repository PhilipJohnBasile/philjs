# @philjs/go

Go server adapter and CLI tools for PhilJS - High-performance SSR and edge functions

<!-- PACKAGE_GUIDE_START -->
## Overview

Go server adapter and CLI tools for PhilJS - High-performance SSR and edge functions

## Focus Areas

- philjs, go, golang, server, ssr, edge, cli, fast, performance

## Entry Points

- packages/philjs-go/src/index.ts
- packages/philjs-go/src/cli.ts
- packages/philjs-go/src/codegen.ts
- packages/philjs-go/src/server.ts

## Quick Start

```ts
import { CodegenOptions, GoServer, buildGoServer } from '@philjs/go';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- CodegenOptions
- GoServer
- buildGoServer
- checkGoInstalled
- createGoServer
- generateGoCode
- initGoProject
- watchAndGenerate
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/go
```
## Usage

```ts
import { CodegenOptions, GoServer, buildGoServer } from '@philjs/go';
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
- Export keys: ., ./cli, ./codegen, ./server
- Source files: packages/philjs-go/src/index.ts, packages/philjs-go/src/cli.ts, packages/philjs-go/src/codegen.ts, packages/philjs-go/src/server.ts

### Public API
- Direct exports: CodegenOptions, GoServer, buildGoServer, checkGoInstalled, createGoServer, generateGoCode, initGoProject, watchAndGenerate
- Re-exported names: (none detected)
- Re-exported modules: ./codegen.js, ./server.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

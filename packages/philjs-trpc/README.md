# @philjs/trpc

Type-safe API layer for PhilJS - RPC client/server, middleware, platform adapters

<!-- PACKAGE_GUIDE_START -->
## Overview

Type-safe API layer for PhilJS - RPC client/server, middleware, platform adapters

## Focus Areas

- philjs, trpc, api, type-safe, rpc, server

## Entry Points

- packages/philjs-trpc/src/index.ts
- packages/philjs-trpc/src/client/index.ts
- packages/philjs-trpc/src/server/index.ts

## Quick Start

```ts
import { ErrorCodes, ProcedureDefinition, RPCError } from '@philjs/trpc';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- ErrorCodes
- ProcedureDefinition
- RPCError
- createAuthMiddleware
- createBatchedClient
- createCacheMiddleware
- createCachedQuery
- createClient
- createLoggingMiddleware
- createQueryCache
- createRateLimitMiddleware
- createRoleMiddleware
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/trpc
```
## Usage

```ts
import { ErrorCodes, ProcedureDefinition, RPCError } from '@philjs/trpc';
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
- Export keys: ., ./client, ./server
- Source files: packages/philjs-trpc/src/index.ts, packages/philjs-trpc/src/client/index.ts, packages/philjs-trpc/src/server/index.ts

### Public API
- Direct exports: ErrorCodes, ProcedureDefinition, RPCError, createAuthMiddleware, createBatchedClient, createCacheMiddleware, createCachedQuery, createClient, createLoggingMiddleware, createQueryCache, createRateLimitMiddleware, createRoleMiddleware, createRouter, validateInput
- Re-exported names: AdapterConfig, AdapterType, AuthContext, BaseContext, BatchConfig, ClientConfig, DataTransformer, ErrorCodes, ErrorHandler, LinkConfig, MiddlewareFunction, ProcedureConfig, RPCError, RouterConfig, Session, SubscriptionCallbacks, SubscriptionConfig, User, createAuthMiddleware, createBatchedClient, createCacheMiddleware, createCachedQuery, createClient, createCloudflareAdapter, createExpressAdapter, createFastifyAdapter, createHonoAdapter, createLambdaAdapter, createLoggingMiddleware, createQueryCache, createRateLimitMiddleware, createRoleMiddleware, createRouter, createStandaloneServer, validateInput
- Re-exported modules: ./adapters/index.js, ./client/index.js, ./server/index.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

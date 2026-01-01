# @philjs/offline

Offline-first architecture for PhilJS - IndexedDB, sync, caching strategies

<!-- PACKAGE_GUIDE_START -->
## Overview

Offline-first architecture for PhilJS - IndexedDB, sync, caching strategies

## Focus Areas

- philjs, offline, indexeddb, sync, cache, local-first, pwa

## Entry Points

- packages/philjs-offline/src/index.ts

## Quick Start

```ts
import { CacheManager, CacheStrategy, ConflictStrategy } from '@philjs/offline';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- CacheManager
- CacheStrategy
- ConflictStrategy
- NetworkMonitor
- NetworkStatus
- OfflineConfig
- OfflineDB
- OfflineStore
- SyncManager
- SyncOperation
- createOfflineStore
- useCache
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/offline
```
## Usage

```ts
import { CacheManager, CacheStrategy, ConflictStrategy } from '@philjs/offline';
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
- Export keys: .
- Source files: packages/philjs-offline/src/index.ts

### Public API
- Direct exports: CacheManager, CacheStrategy, ConflictStrategy, NetworkMonitor, NetworkStatus, OfflineConfig, OfflineDB, OfflineStore, SyncManager, SyncOperation, createOfflineStore, useCache, useNetworkStatus, useOfflineData, useSync
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

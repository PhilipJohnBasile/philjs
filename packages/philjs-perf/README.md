# @philjs/perf

High-performance runtime utilities for PhilJS - memoization, batching, pooling, lazy evaluation

<!-- PACKAGE_GUIDE_START -->
## Overview

High-performance runtime utilities for PhilJS - memoization, batching, pooling, lazy evaluation

## Focus Areas

- philjs, performance, memoization, batching, object-pooling, lazy-evaluation, optimization

## Entry Points

- packages/philjs-perf/src/index.ts
- packages/philjs-perf/src/memo.ts
- packages/philjs-perf/src/batch.ts
- packages/philjs-perf/src/pool.ts
- packages/philjs-perf/src/lazy.ts

## Quick Start

```ts
import { LazyValue, ObjectPool, Scheduler } from '@philjs/perf';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- LazyValue
- ObjectPool
- Scheduler
- arrayPool
- batch
- batchAsync
- clearMemoCache
- createBatcher
- createPool
- lazy
- lazyAsync
- lazyInit
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/perf
```
## Usage

```ts
import { LazyValue, ObjectPool, Scheduler } from '@philjs/perf';
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
- Export keys: ., ./memo, ./batch, ./pool, ./lazy
- Source files: packages/philjs-perf/src/index.ts, packages/philjs-perf/src/memo.ts, packages/philjs-perf/src/batch.ts, packages/philjs-perf/src/pool.ts, packages/philjs-perf/src/lazy.ts

### Public API
- Direct exports: LazyValue, ObjectPool, Scheduler, arrayPool, batch, batchAsync, clearMemoCache, createBatcher, createPool, lazy, lazyAsync, lazyInit, lazyProp, mapPool, memo, memoAsync, memoWeak, objectPool, setPool
- Re-exported names: BatchOptions, LRUCache, LazyOptions, LazyValue, MemoOptions, ObjectPool, PoolOptions, Scheduler, batch, batchAsync, clearMemoCache, createBatcher, createLRU, createPool, debounce, lazy, lazyAsync, memo, memoAsync, memoWeak, rafThrottle, throttle
- Re-exported modules: ./batch.js, ./cache.js, ./lazy.js, ./memo.js, ./pool.js, ./timing.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

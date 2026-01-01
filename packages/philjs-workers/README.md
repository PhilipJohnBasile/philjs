# @philjs/workers

Thread pool Web Workers for PhilJS - parallel computing, shared state, task queuing

<!-- PACKAGE_GUIDE_START -->
## Overview

Thread pool Web Workers for PhilJS - parallel computing, shared state, task queuing

## Focus Areas

- philjs, workers, web-workers, parallel, thread-pool, shared-memory

## Entry Points

- packages/philjs-workers/src/index.ts

## Quick Start

```ts
import { Channel, ParallelIterator, PoolStats } from '@philjs/workers';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- Channel
- ParallelIterator
- PoolStats
- PoolWorker
- SharedState
- Task
- TaskResult
- WorkerMessage
- WorkerPool
- WorkerPoolConfig
- useParallel
- useSharedState
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/workers
```
## Usage

```ts
import { Channel, ParallelIterator, PoolStats } from '@philjs/workers';
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
- Source files: packages/philjs-workers/src/index.ts

### Public API
- Direct exports: Channel, ParallelIterator, PoolStats, PoolWorker, SharedState, Task, TaskResult, WorkerMessage, WorkerPool, WorkerPoolConfig, useParallel, useSharedState, useWorkerPool
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

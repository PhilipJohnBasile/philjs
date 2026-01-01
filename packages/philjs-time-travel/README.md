# @philjs/time-travel

Time-travel debugging for PhilJS - Elm-style state history with visual debugger

<!-- PACKAGE_GUIDE_START -->
## Overview

Time-travel debugging for PhilJS - Elm-style state history with visual debugger

## Focus Areas

- philjs, time-travel, debugging, devtools, state-management, elm-style, replay

## Entry Points

- packages/philjs-time-travel/src/index.ts

## Quick Start

```ts
import { ActionInfo, ComponentSnapshot, ConsoleLog } from '@philjs/time-travel';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- ActionInfo
- ComponentSnapshot
- ConsoleLog
- NetworkRequest
- SnapshotMetadata
- StateDiff
- StateSnapshot
- TimeTravelConfig
- TimeTravelEngine
- TimeTravelState
- deepEqual
- diffStates
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/time-travel
```
## Usage

```ts
import { ActionInfo, ComponentSnapshot, ConsoleLog } from '@philjs/time-travel';
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
- Source files: packages/philjs-time-travel/src/index.ts

### Public API
- Direct exports: ActionInfo, ComponentSnapshot, ConsoleLog, NetworkRequest, SnapshotMetadata, StateDiff, StateSnapshot, TimeTravelConfig, TimeTravelEngine, TimeTravelState, deepEqual, diffStates, getTimeTravelEngine, initTimeTravel, useStateDiff, useTimeTravel, useTimeTravelState
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

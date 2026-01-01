# @philjs/event-sourcing

Event sourcing with CQRS for PhilJS - event store, aggregates, projections, sagas, time-travel

<!-- PACKAGE_GUIDE_START -->
## Overview

Event sourcing with CQRS for PhilJS - event store, aggregates, projections, sagas, time-travel

## Focus Areas

- philjs, event-sourcing, cqrs, ddd, saga, aggregate, projection

## Entry Points

- packages/philjs-event-sourcing/src/index.ts

## Quick Start

```ts
import { Command, CommandBus, CommandHandler } from '@philjs/event-sourcing';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- Command
- CommandBus
- CommandHandler
- CommandMetadata
- Event
- EventHandler
- EventMetadata
- EventStore
- Projection
- ProjectionHandler
- ReadModel
- Repository
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/event-sourcing
```
## Usage

```ts
import { Command, CommandBus, CommandHandler } from '@philjs/event-sourcing';
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
- Source files: packages/philjs-event-sourcing/src/index.ts

### Public API
- Direct exports: Command, CommandBus, CommandHandler, CommandMetadata, Event, EventHandler, EventMetadata, EventStore, Projection, ProjectionHandler, ReadModel, Repository, SagaDefinition, SagaManager, SagaState, SagaStep, Snapshot, TimeTravelDebugger, createCommand, createEvent, useAggregate, useEventStore, useReadModel, useTimeTravel
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

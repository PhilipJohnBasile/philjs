# @philjs/runtime

PhilJS Runtime with Self-Healing capabilities - automatic error recovery, circuit breakers, hot-patching

<!-- PACKAGE_GUIDE_START -->
## Overview

PhilJS Runtime with Self-Healing capabilities - automatic error recovery, circuit breakers, hot-patching

## Focus Areas

- philjs, runtime, self-healing, error-recovery, circuit-breaker, hot-patching, resilience, fault-tolerance

## Entry Points

- .
- packages/philjs-runtime/src/self-healing/index.ts

## Quick Start

```ts
import { Checkpoint, CircuitBreakerState, ErrorContext } from '@philjs/runtime';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- Checkpoint
- CircuitBreakerState
- ErrorContext
- ErrorSeverity
- FailurePrediction
- HealingConfig
- HealingEvent
- HealingEventHandler
- HealingEventType
- HealingResult
- HealingStrategy
- SelfHealingRuntime
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/runtime
```
## Usage

```ts
import { Checkpoint, CircuitBreakerState, ErrorContext } from '@philjs/runtime';
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
- Export keys: ., ./self-healing
- Source files: packages/philjs-runtime/src/self-healing/index.ts

### Public API
- Direct exports: Checkpoint, CircuitBreakerState, ErrorContext, ErrorSeverity, FailurePrediction, HealingConfig, HealingEvent, HealingEventHandler, HealingEventType, HealingResult, HealingStrategy, SelfHealingRuntime, createHealingErrorBoundary, getSelfHealingRuntime, initSelfHealing, resetSelfHealing, useSelfHealing, withSelfHealing
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

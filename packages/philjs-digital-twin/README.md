# @philjs/digital-twin

IoT device synchronization for PhilJS - device shadows, telemetry, predictive maintenance

<!-- PACKAGE_GUIDE_START -->
## Overview

IoT device synchronization for PhilJS - device shadows, telemetry, predictive maintenance

## Focus Areas

- philjs, digital-twin, iot, mqtt, telemetry, device-shadow

## Entry Points

- packages/philjs-digital-twin/src/index.ts

## Quick Start

```ts
import { Alert, ConnectionConfig, DeviceCommand } from '@philjs/digital-twin';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- Alert
- ConnectionConfig
- DeviceCommand
- DeviceConfig
- DeviceEvent
- DeviceEventCallback
- DeviceState
- DigitalTwin
- FleetManager
- MaintenancePrediction
- PredictiveMaintenance
- PropertyDefinition
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/digital-twin
```
## Usage

```ts
import { Alert, ConnectionConfig, DeviceCommand } from '@philjs/digital-twin';
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
- Source files: packages/philjs-digital-twin/src/index.ts

### Public API
- Direct exports: Alert, ConnectionConfig, DeviceCommand, DeviceConfig, DeviceEvent, DeviceEventCallback, DeviceState, DigitalTwin, FleetManager, MaintenancePrediction, PredictiveMaintenance, PropertyDefinition, PropertyMetadata, TelemetryData, TimeSeriesStore, useDigitalTwin, useFleet, usePredictiveMaintenance, useTelemetry
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

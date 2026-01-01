# @philjs/eye-tracking

Gaze-based interactions for PhilJS - eye tracking, dwell click, attention heatmaps

<!-- PACKAGE_GUIDE_START -->
## Overview

Gaze-based interactions for PhilJS - eye tracking, dwell click, attention heatmaps

## Focus Areas

- philjs, eye-tracking, gaze, dwell-click, accessibility, heatmap

## Entry Points

- packages/philjs-eye-tracking/src/index.ts

## Quick Start

```ts
import { AttentionHeatmap, CalibrationResult, DwellClick } from '@philjs/eye-tracking';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AttentionHeatmap
- CalibrationResult
- DwellClick
- EyeTracker
- EyeTrackingConfig
- Fixation
- GazeAwareElement
- GazeCallback
- GazeCursor
- GazeEvent
- GazeEventCallback
- GazePoint
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/eye-tracking
```
## Usage

```ts
import { AttentionHeatmap, CalibrationResult, DwellClick } from '@philjs/eye-tracking';
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
- Source files: packages/philjs-eye-tracking/src/index.ts

### Public API
- Direct exports: AttentionHeatmap, CalibrationResult, DwellClick, EyeTracker, EyeTrackingConfig, Fixation, GazeAwareElement, GazeCallback, GazeCursor, GazeEvent, GazeEventCallback, GazePoint, HeatmapConfig, ReadingAnalyzer, Saccade, useAttentionHeatmap, useDwellClick, useEyeTracking, useGazeAware, useGazePoint, useReadingAnalysis
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

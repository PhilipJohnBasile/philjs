# @philjs/gesture

Camera-based gesture recognition for PhilJS - hand tracking, air cursor, touchless UI

<!-- PACKAGE_GUIDE_START -->
## Overview

Camera-based gesture recognition for PhilJS - hand tracking, air cursor, touchless UI

## Focus Areas

- philjs, gesture, hand-tracking, mediapipe, touchless, air-cursor

## Entry Points

- packages/philjs-gesture/src/index.ts

## Quick Start

```ts
import { AirCursor, BoundingBox, FingerState } from '@philjs/gesture';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AirCursor
- BoundingBox
- FingerState
- GestureCallback
- GestureConfig
- GestureController
- GestureDefinition
- GesturePresets
- GestureRecognizer
- GestureSequence
- Hand
- HandCallback
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/gesture
```
## Usage

```ts
import { AirCursor, BoundingBox, FingerState } from '@philjs/gesture';
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
- Source files: packages/philjs-gesture/src/index.ts

### Public API
- Direct exports: AirCursor, BoundingBox, FingerState, GestureCallback, GestureConfig, GestureController, GestureDefinition, GesturePresets, GestureRecognizer, GestureSequence, Hand, HandCallback, HandLandmark, HandLandmarkName, HandTracker, MotionAnalyzer, MotionPattern, PalmOrientation, Point2D, Point3D, RecognizedGesture, useAirCursor, useGesture, useGestureController, useHandTracking
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

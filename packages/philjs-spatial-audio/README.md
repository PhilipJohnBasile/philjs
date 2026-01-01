# @philjs/spatial-audio

3D spatial audio for PhilJS - HRTF, room acoustics, ambisonics, VR/AR audio sync

<!-- PACKAGE_GUIDE_START -->
## Overview

3D spatial audio for PhilJS - HRTF, room acoustics, ambisonics, VR/AR audio sync

## Focus Areas

- philjs, spatial-audio, 3d-audio, hrtf, ambisonics, webxr, vr, ar

## Entry Points

- packages/philjs-spatial-audio/src/index.ts

## Quick Start

```ts
import { AmbisonicsDecoder, AmbisonicsOptions, AudioEntity } from '@philjs/spatial-audio';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AmbisonicsDecoder
- AmbisonicsOptions
- AudioEntity
- AudioPath
- AudioScene
- AudioSourceOptions
- MaterialType
- Orientation
- RoomAcousticsOptions
- RoomAcousticsProcessor
- RoomPresets
- SpatialAudioConfig
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/spatial-audio
```
## Usage

```ts
import { AmbisonicsDecoder, AmbisonicsOptions, AudioEntity } from '@philjs/spatial-audio';
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
- Source files: packages/philjs-spatial-audio/src/index.ts

### Public API
- Direct exports: AmbisonicsDecoder, AmbisonicsOptions, AudioEntity, AudioPath, AudioScene, AudioSourceOptions, MaterialType, Orientation, RoomAcousticsOptions, RoomAcousticsProcessor, RoomPresets, SpatialAudioConfig, SpatialAudioContext, SpatialAudioSource, Vector3, calculateDistance, crossProduct, lerp, lerpVector, normalizeVector, useAudioListener, useAudioPath, useAudioScene, useAudioSource, useSpatialAudio, useVRAudio
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

# @philjs/screen-share

Advanced screen sharing for PhilJS - annotations, presenter mode, region selection, recording

<!-- PACKAGE_GUIDE_START -->
## Overview

Advanced screen sharing for PhilJS - annotations, presenter mode, region selection, recording

## Focus Areas

- philjs, screen-share, webrtc, annotation, presenter, recording

## Entry Points

- packages/philjs-screen-share/src/index.ts

## Quick Start

```ts
import { // Core classes
  ScreenShareManager, // Hooks
  useScreenShare, // Types
  type ScreenShareConfig } from '@philjs/screen-share';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- // Core classes
  ScreenShareManager
- // Hooks
  useScreenShare
- // Types
  type ScreenShareConfig
- Annotation
- AnnotationLayer
- AnnotationTool
- CropRegion
- CursorHighlighter
- PresenterMode
- RegionSelector
- UseScreenShareResult
- useAnnotationTools
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/screen-share
```
## Usage

```ts
import { // Core classes
  ScreenShareManager, // Hooks
  useScreenShare, // Types
  type ScreenShareConfig } from '@philjs/screen-share';
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
- Source files: packages/philjs-screen-share/src/index.ts

### Public API
- Direct exports: // Core classes
  ScreenShareManager, // Hooks
  useScreenShare, // Types
  type ScreenShareConfig, Annotation, AnnotationLayer, AnnotationTool, CropRegion, CursorHighlighter, PresenterMode, RegionSelector, UseScreenShareResult, useAnnotationTools, usePresenterMode
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

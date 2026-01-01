# @philjs/media-stream

Advanced media stream processing for PhilJS - video filters, audio processing, face detection, recording, mixing

<!-- PACKAGE_GUIDE_START -->
## Overview

Advanced media stream processing for PhilJS - video filters, audio processing, face detection, recording, mixing

## Focus Areas

- philjs, media-stream, video-filter, audio-processing, chroma-key, face-detection, recording

## Entry Points

- packages/philjs-media-stream/src/index.ts

## Quick Start

```ts
import { // Core classes
  MediaStreamProcessor, // Hooks
  useMediaProcessor, // Types
  type VideoFilterConfig } from '@philjs/media-stream';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- // Core classes
  MediaStreamProcessor
- // Hooks
  useMediaProcessor
- // Types
  type VideoFilterConfig
- AudioProcessorConfig
- AudioStreamProcessor
- AudioVisualizer
- ChromaKeyConfig
- ChromaKeyProcessor
- FaceDetection
- FaceDetector
- MediaProcessorConfig
- MediaStreamRecorder
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/media-stream
```
## Usage

```ts
import { // Core classes
  MediaStreamProcessor, // Hooks
  useMediaProcessor, // Types
  type VideoFilterConfig } from '@philjs/media-stream';
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
- Source files: packages/philjs-media-stream/src/index.ts

### Public API
- Direct exports: // Core classes
  MediaStreamProcessor, // Hooks
  useMediaProcessor, // Types
  type VideoFilterConfig, AudioProcessorConfig, AudioStreamProcessor, AudioVisualizer, ChromaKeyConfig, ChromaKeyProcessor, FaceDetection, FaceDetector, MediaProcessorConfig, MediaStreamRecorder, MixerInput, RecorderConfig, StreamMixer, StreamQualityMetrics, StreamQualityMonitor, VideoFilterProcessor, VisualizerConfig, useAudioVisualizer, useStreamMixer, useStreamRecorder
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

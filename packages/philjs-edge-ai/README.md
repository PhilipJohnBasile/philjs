# @philjs/edge-ai

On-device ML inference for PhilJS - WebGPU/WebNN accelerated, ONNX/TFLite support

<!-- PACKAGE_GUIDE_START -->
## Overview

On-device ML inference for PhilJS - WebGPU/WebNN accelerated, ONNX/TFLite support

## Focus Areas

- philjs, edge-ai, ml, webgpu, webnn, onnx, tensorflow, inference

## Entry Points

- packages/philjs-edge-ai/src/index.ts

## Quick Start

```ts
import { DeviceCapabilities, DeviceDetector, ImageClassifier } from '@philjs/edge-ai';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- DeviceCapabilities
- DeviceDetector
- ImageClassifier
- InferenceCallback
- InferenceEngine
- InferenceOptions
- InferenceResult
- ModelCache
- ModelConfig
- ModelLoader
- ModelMetadata
- ObjectDetector
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/edge-ai
```
## Usage

```ts
import { DeviceCapabilities, DeviceDetector, ImageClassifier } from '@philjs/edge-ai';
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
- Source files: packages/philjs-edge-ai/src/index.ts

### Public API
- Direct exports: DeviceCapabilities, DeviceDetector, ImageClassifier, InferenceCallback, InferenceEngine, InferenceOptions, InferenceResult, ModelCache, ModelConfig, ModelLoader, ModelMetadata, ObjectDetector, ProgressCallback, SpeechRecognizer, StreamingResult, Tensor, TextEmbedder, useDeviceCapabilities, useEdgeAI, useImageClassifier, useObjectDetector, useTextEmbedder
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

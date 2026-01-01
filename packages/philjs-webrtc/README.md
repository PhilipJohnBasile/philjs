# @philjs/webrtc

Full-Featured WebRTC Framework for PhilJS

<!-- PACKAGE_GUIDE_START -->
## Overview

Full-Featured WebRTC Framework for PhilJS

## Focus Areas

- philjs, webrtc, peer-to-peer, real-time, video-chat

## Entry Points

- packages/philjs-webrtc/src/index.ts

## Quick Start

```ts
import { ChunkedDataChannel, DEFAULT_ICE_SERVERS, DataChannelConfig } from '@philjs/webrtc';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- ChunkedDataChannel
- DEFAULT_ICE_SERVERS
- DataChannelConfig
- DataChannelMessage
- NetworkQuality
- NetworkQualityMonitor
- PeerConnection
- PeerConnectionOptions
- PeerStats
- RTCConfig
- RTCRoom
- SignalMessage
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/webrtc
```
## Usage

```ts
import { ChunkedDataChannel, DEFAULT_ICE_SERVERS, DataChannelConfig } from '@philjs/webrtc';
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
- Source files: packages/philjs-webrtc/src/index.ts

### Public API
- Direct exports: ChunkedDataChannel, DEFAULT_ICE_SERVERS, DataChannelConfig, DataChannelMessage, NetworkQuality, NetworkQualityMonitor, PeerConnection, PeerConnectionOptions, PeerStats, RTCConfig, RTCRoom, SignalMessage, SignalingClient, SignalingConfig, SignalingHandlers, useDataChannel, useNetworkQuality, usePeerConnection, useWebRTC
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

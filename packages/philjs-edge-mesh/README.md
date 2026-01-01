# @philjs/edge-mesh

Distributed edge consensus for PhilJS - P2P mesh networking, Raft consensus, gossip protocol

<!-- PACKAGE_GUIDE_START -->
## Overview

Distributed edge consensus for PhilJS - P2P mesh networking, Raft consensus, gossip protocol

## Focus Areas

- philjs, edge, mesh, p2p, consensus, raft, gossip, distributed

## Entry Points

- packages/philjs-edge-mesh/src/index.ts

## Quick Start

```ts
import { AppendEntriesRequest, AppendEntriesResponse, ConsensusState } from '@philjs/edge-mesh';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AppendEntriesRequest
- AppendEntriesResponse
- ConsensusState
- EdgeMesh
- GossipMessage
- GossipProtocol
- LogEntry
- MeshConfig
- MeshNode
- NodeRole
- RaftConsensus
- VectorClock
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/edge-mesh
```
## Usage

```ts
import { AppendEntriesRequest, AppendEntriesResponse, ConsensusState } from '@philjs/edge-mesh';
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
- Source files: packages/philjs-edge-mesh/src/index.ts

### Public API
- Direct exports: AppendEntriesRequest, AppendEntriesResponse, ConsensusState, EdgeMesh, GossipMessage, GossipProtocol, LogEntry, MeshConfig, MeshNode, NodeRole, RaftConsensus, VectorClock, VoteRequest, VoteResponse, useEdgeMesh, useGossipState
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

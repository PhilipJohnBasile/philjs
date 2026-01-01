# @philjs/edge

Edge runtime adapters for deploying PhilJS applications to edge computing platforms. Enables low-latency, globally distributed application deployments.

## Installation

```bash
npm install @philjs/edge
# or
yarn add @philjs/edge
# or
pnpm add @philjs/edge
```

## Basic Usage

```typescript
import { createEdgeHandler, EdgeRequest, EdgeResponse } from '@philjs/edge';

export default createEdgeHandler(async (req: EdgeRequest) => {
  const data = await fetchData(req.geo.country);

  return EdgeResponse.json({
    message: 'Hello from the edge!',
    region: req.geo.region,
    data,
  });
});
```

## Features

- **Multi-Platform Support** - Deploy to Vercel, Cloudflare, Deno Deploy, and more
- **Geo-Location** - Access visitor location data at the edge
- **Low Latency** - Serve requests from the nearest edge location
- **Edge KV** - Key-value storage at the edge
- **Streaming** - Stream responses for large payloads
- **WebSocket Support** - Real-time connections at the edge
- **Middleware** - Composable edge middleware
- **Request Rewriting** - URL rewriting and redirects
- **A/B Testing** - Traffic splitting at the edge
- **Bot Detection** - Identify and filter bot traffic
- **Rate Limiting** - Edge-based rate limiting
- **Cache Control** - Fine-grained caching strategies

## Platform Adapters

| Adapter | Platform |
|---------|----------|
| `@philjs/edge/vercel` | Vercel Edge Functions |
| `@philjs/edge/cloudflare` | Cloudflare Workers |
| `@philjs/edge/deno` | Deno Deploy |
| `@philjs/edge/netlify` | Netlify Edge Functions |
| `@philjs/edge/fastly` | Fastly Compute@Edge |

## Edge Utilities

```typescript
import { geoip, edgeCache, rateLimit } from '@philjs/edge';

// Geo-location lookup
const location = geoip(request);

// Edge caching
const cached = await edgeCache.get('key');

// Rate limiting
const allowed = await rateLimit(request, { limit: 100 });
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./kv, ./durable, ./queue, ./d1, ./geo-routing, ./prefetch, ./streaming, ./state-replication, ./smart-cache
- Source files: packages/philjs-edge/src/index.ts, packages/philjs-edge/src/geo-routing.ts, packages/philjs-edge/src/prefetch.ts, packages/philjs-edge/src/streaming.ts, packages/philjs-edge/src/state-replication.ts, packages/philjs-edge/src/smart-cache.ts

### Public API
- Direct exports: AccessPattern, CacheConfig, CacheEntry, CacheStats, CronJob, CronScheduler, D1Database, D1ExecResult, D1PreparedStatement, D1Result, DurableObjectState, DurableStorage, EDGE_LOCATIONS, EdgeKVOptions, EdgeNode, EdgePrefetcher, EdgeQueue, GCounter, GeoLocation, GeoPattern, GeoRouter, KVGetOptions, KVListOptions, KVListResult, KVPutOptions, KVStore, LWWRegister, LWWSet, MemoryDurableStorage, MemoryKVStore, MemoryQueue, NavigationPattern, NodeId, PNCounter, PrefetchConfig, PrefetchItem, PrefetchPrediction, QueueMessage, QueueOptions, ReplicatedState, ReplicationConfig, RoutingConfig, RoutingDecision, SSEBroadcaster, SSEEvent, SSEStream, SmartCache, StateUpdate, StreamConfig, StreamingResponse, TimePattern, Timestamp, VectorClock, cached, createChunkedStream, createCloudflareKV, createEdgePrefetcher, createGeoRouter, createProgressiveHTML, createReplicatedState, createSmartCache, createStreamingHTML, createSyncHandler, generatePrefetchHints, generatePreloadHeaders, getClientLocation, pipeStreams, useEdgeKV
- Re-exported names: (none detected)
- Re-exported modules: ./edge-functions.js, ./geo-routing.js, ./prefetch.js, ./rate-limiter.js, ./smart-cache.js, ./state-replication.js, ./streaming.js
<!-- API_SNAPSHOT_END -->

## License

MIT

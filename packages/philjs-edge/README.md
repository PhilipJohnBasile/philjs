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

## License

MIT

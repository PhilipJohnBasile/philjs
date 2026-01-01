# Edge and Serverless Targets

PhilJS adapters let you run at the edge (Vercel/Netlify/Cloudflare) or serverless (AWS, Bun, Deno, Node). The goal: push logic closer to users while keeping SSR, data loaders, and caching predictable. For detailed recipes, see `docs/deployment` and `packages/philjs-adapters/README.md`; this chapter distills the essentials.

## Choosing a target

- **Edge (Vercel/Netlify/Cloudflare/Bun/Deno)**: lowest latency, great for SSR and streaming, but with tighter limits (CPU, memory, cold starts).
- **Serverless (AWS Lambda, Node)**: more flexibility, bigger timeouts/memory; good for heavy tasks and regional deployments.
- Choose per-route: marketing and dashboards at edge; exports/PDF/image tasks in regional Node/AWS.

## Adapters overview

- `philjs-adapters/vercel` - Edge/Serverless + ISR, KV, Blob.
- `philjs-adapters/netlify` - Edge Functions + Functions + blob/form support.
- `philjs-adapters/cloudflare-pages` - KV/D1/R2/DO bindings.
- `philjs-adapters/aws-lambda` - SAM template and bridge handler.
- `philjs-adapters/bun` / `philjs-adapters/deno` - native runtimes.
- `philjs-adapters/node` - generic Node server adapter for long-lived processes.
- `philjs-adapters/static` - prerender/SSG option for routes that can be fully static.
- `philjs-adapters/cdn` - helpers for cache headers and manifests.

## Server entry checklist

- Keep exports ESM; avoid CommonJS.
- Use `philjs build` to emit manifest and server bundle.
- In your adapter config, set:
  - `edge: true` where needed,
  - `isr`/`revalidate` for cached pages,
  - `kv`/`d1`/`r2` bindings for data.
- Keep environment access minimal; prefer passing config via adapter options.

## Caching and revalidation

- Use loader cache tags and `revalidate` hints to control freshness.
- On Vercel/Netlify, pair ISR/edge cache with router invalidation (`cache.invalidate(['entity', id])`).
- On Cloudflare, keep HTML small; stream responses to reduce TTFB.
- Avoid cache stampedes: dedupe loader fetches and use jittered revalidation.
- For authenticated pages, cache per-session or disable HTML caching; rely on data-layer caching instead.

## Env and secrets

- Read secrets from platform env; never bundle them.
- On Edge, avoid Node-only APIs; stick to Web APIs (fetch, crypto).
- Validate env at startup; fail fast with clear error messages.
- For AWS, keep `template.yaml` lean and avoid oversized Layers; for CF Workers, keep bundle small.
- For Bun/Deno, prefer Web APIs; avoid Node-only modules to keep edge compatibility.

## Deployment steps (example: Vercel Edge)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import philjs from 'philjs-cli/vite';
import vercel from 'philjs-adapters/vercel';

export default defineConfig({
  plugins: [philjs(), vercel({ edge: true, isr: { expiration: 60 } })]
});
```

```bash
pnpm build
vercel deploy --prod
```

## AWS/Lambda specifics

- Prefer HTTP API over REST for latency and cost.
- Keep cold starts low: small bundles, few dependencies, no large Layers.
- Use `packages/philjs-adapters/.aws/template.yaml` as a starting point.
- Set memory/timeouts per route; separate heavy functions from lightweight ones.

## Bun/Deno edge specifics

- Ship pure ESM; rely on built-in `fetch`, `crypto`, and Web Streams.
- Keep bundles tiny; Bun and Deno reward minimal polyfills.
- Use `philjs-adapters/bun` and `philjs-adapters/deno` to wire SSR without Node shims.

## Observability

- Emit logs per request and include trace ids.
- Export basic metrics (TTFB, render time, cache hits/misses).
- Capture unhandled errors and surface in platform logs (Vercel/Netlify dashboards, Cloudflare Workers logs).
- Forward platform request ids (e.g., `x-vercel-id`) into your logs for cross-correlation.

## Try it now: Cloudflare Pages with KV and ISR-like revalidate

1) Configure adapter:

```typescript
import cloudflarePages from 'philjs-adapters/cloudflare-pages';

cloudflarePages({
  kv: [{ binding: 'CACHE', id: 'my-kv' }],
  d1: [{ binding: 'DB', database_id: 'my-db' }],
  revalidate: 60
});
```

2) In a loader, tag caches and set revalidate hints:

```typescript
export const postLoader = loader(async ({ params, cache }) => {
  const post = await getPost(params.slug);
  cache.tag(['post', params.slug]);
  cache.revalidate(60);
  return { post };
});
```

3) Deploy with `wrangler pages deploy` and verify TTFB + cache headers via `curl -I`.

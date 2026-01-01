# SSR Overview

PhilJS SSR is streaming-first and designed for islands. You can render routes directly with the server adapters.

![SSR streaming pipeline](../../visuals/ssr-streaming-pipeline.svg "Streaming SSR from edge to hydration")

## Basic Node server

```ts
import { createServer } from "node:http";
import { createNodeHttpHandler } from "@philjs/ssr";
import { createAppRouter } from "@philjs/router";

const routes = [
  { path: "/", component: () => <main>Home</main> },
  { path: "/about", component: () => <main>About</main> },
];

const handler = createNodeHttpHandler({ routes });

createServer(handler).listen(3000, () => {
  console.log("PhilJS SSR running on http://localhost:3000");
});
```

## Render to string

```tsx
import { renderToString } from "@philjs/core";

const html = renderToString(<main>Server render</main>);
```

## Streaming SSR

```tsx
import { renderToStream } from "@philjs/ssr";

const stream = renderToStream(<App />);
```

## Architecture

- **Router-aware SSR**: loaders run server-side, data is serialized, and hydration picks up without refetching.
- **Streaming-first**: HTML flushes early while slower panels fill in later.
- **Islands**: hydrate only what needs to be interactive; keep static shells cheap.
- **Adapters**: Vercel/Netlify/Cloudflare/Bun/Deno/AWS/Node adapters handle platform specifics.

## Hydration and resumability

- Keep hydration targets small; split heavy widgets into islands.
- Avoid generating new object identities in render that break equality across server/client.
- Use stable keys in lists to align server and client DOM.
- Pass loader data via serialized payloads; avoid re-running fetches on the client unless needed.

## Caching and revalidate

- Use loader cache tags and `revalidate` hints to drive ISR/edge cache lifetimes.
- For HTML caching, pair adapter-level cache with per-route invalidation (see Loaders chapter).
- Keep HTML payloads small; stream large panels instead of blocking first paint.

## Edge vs regional SSR

- Edge (Vercel/Netlify/CF/Bun/Deno): lowest latency, but smaller CPU/memory/time budgets.
- Regional (Node/AWS): more headroom for heavy work (PDFs, image processing), but higher latency.
- Choose per-route: marketing pages at edge, heavy exports regionally.

## Rendering modes

- `renderToString` – full HTML string (useful for tests and small pages).
- `renderToStream` – streaming; best default for production.
- `renderToReadableStream` (edge-friendly) for platforms that expect Web Streams.

## Environment and secrets

- Do not bundle secrets; read from env at runtime (adapter passes through).
- Avoid Node-only APIs when targeting edge runtimes; stick to Web APIs where possible.

## Error handling

- Wrap root with an error boundary for SSR; render user-friendly errors.
- Log SSR failures with route info and request id to observability pipeline.
- Provide fallbacks for partial streams if downstream data fails.

## Testing SSR

- Use `renderToString` in unit tests to assert markup.
- Use Playwright against `philjs dev --ssr` or a preview build to validate hydration.
- Simulate slow loaders and verify streaming delivers shell + fallback content promptly.

## Try it now: edge-ready stream

```tsx
// edge-handler.ts
import { renderToReadableStream } from '@philjs/ssr';
import { App } from './App';

export default async function handle() {
  const body = await renderToReadableStream(<App />);
  return new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
```

Deploy this with the Cloudflare/Vercel adapter and measure TTFB + first paint with Playwright traces.


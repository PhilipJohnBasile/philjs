# Streaming and Progressive Rendering

Streaming reduces TTFB and keeps users engaged while data loads. PhilJS supports streaming both on the server (SSR) and client (resources + Suspense-like patterns). Use this with the performance and SSR chapters to build responsive dashboards and long-running flows.

## When to stream

- Above-the-fold content should ship immediately; stream secondary panels and dashboards.
- Long-running loaders (reports, analytics) should yield partial HTML and continue as data arrives.
- Use for chat feeds, logs, and incremental search results.
- Use for personalization: stream common shell, then personalized panels.

## Server-side streaming

```typescript
import { renderToStream } from '@philjs/ssr';

export default async function handler(req) {
  const stream = await renderToStream(<App />);
  return new Response(stream, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
```

Tips:

- Keep initial shell small; inline critical CSS or use streaming-friendly styles.
- Flush early with `renderToStream` to improve TTFB.
- Avoid blocking promises in root layout; push them into resources.
- Combine with edge adapters to reduce round-trip latency further.

## Client-side progressive data

Use resources to represent async data and show fallbacks:

```typescript
const user = resource(() => fetch('/api/me').then(r => r.json()));

<Show when={user()}>
  {(data) => <Profile user={data} />}
</Show>
<Show when={!user()}>
  <SkeletonProfile />
</Show>
```

## Error and retry

- Wrap streamed sections in error boundaries; render friendly fallbacks.
- Provide retry buttons for individual panels; avoid full page reloads.
- Log streaming errors to observability pipeline (see observability chapter).
- Consider backoff on repeated failures; avoid hot loops.

## Performance and SEO

- Streaming improves TTFB and FID; keep head tags stable to avoid cumulative layout shift.
- For SEO, ensure critical meta tags are present in the first chunk.
- Use `<link rel="preload">` for critical CSS/fonts in the first flush.

## Testing streaming

- Use integration tests (Playwright) to assert first paint speed and fallback presence.
- In Vitest + jsdom, simulate slow fetches to ensure fallbacks render before data arrives.
- Add smoke tests that capture HTML chunks to verify critical meta and shell render in chunk 1.

## Try it now: streamed dashboard panel

```typescript
import { resource } from '@philjs/core';
import { renderToStream } from '@philjs/ssr';

const slowStats = resource(() =>
  fetch('/api/stats?slow=1').then(r => r.json())
);

function Dashboard() {
  return (
    <Layout>
      <Hero />
      <Show when={slowStats()} fallback={<Skeleton />}>
        {(stats) => <StatsPanel stats={stats} />}
      </Show>
    </Layout>
  );
}

export default async function handler() {
  return new Response(await renderToStream(<Dashboard />), {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
```

Test with slow network throttling and confirm the hero renders immediately while stats fill in later.

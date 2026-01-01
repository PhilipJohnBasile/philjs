# SSR/Islands Playbook

Use this when enabling SSR, streaming, and islands in production.

## Before you start

- Decide targets: edge vs regional.
- Ensure `entry-server.tsx` exists and exports handler per adapter requirements.
- Keep HTML shell small; plan which components become islands.

## Streaming checklist

- Use `renderToStream` (Node) or `renderToReadableStream` (edge).
- Flush early: send head + shell ASAP; stream slower panels.
- Include critical CSS and meta tags in the first chunk.
- Keep serialized data minimal; avoid large blobs.

## Islands checklist

- Identify interactive components; register as islands.
- Choose hydration strategy (immediate/visible/idle/interaction) per island.
- Pass loader data as props; avoid duplicate fetches.
- Lazy-load heavy deps inside islands.

## Caching + revalidate

- Tag loader caches by entity; set `revalidate` per route.
- Pair adapter cache (ISR/edge cache) with router invalidation to stay consistent.
- Avoid over-invalidating; prefer targeted tags over wildcards.

## Env and secrets

- Use platform env for secrets; never serialize to the client.
- For edge runtimes, stay within Web APIs (no fs, no Node crypto without polyfills).

## Error handling

- Wrap root layouts with error boundaries; render friendly fallbacks.
- Log SSR errors with route/params/request id; surface in observability.
- Provide partial fallbacks for streamed sections; do not blank the whole page.

## Testing SSR

- Unit: `renderToString` to assert markup.
- Integration: run server locally (`philjs dev --ssr`) and use Playwright to navigate; assert no hydration warnings.
- Slow-path tests: throttle network, delay loaders, verify streaming shows shell quickly.

## Deployment steps (generic)

1) `pnpm build` to produce server/client bundles.
2) Run adapter-specific preview (e.g., `vercel dev`, `wrangler pages dev`, `netlify dev`).
3) Inspect bundle sizes and HTML payload.
4) Deploy and smoke with Playwright in CI; collect traces.

## Runbook: hydration errors

- Capture server HTML and client render; diff for mismatches.
- Ensure keys are stable; avoid non-deterministic values in render (Dates, random).
- Confirm loader data serializes safely (no functions, no bigint without stringification).

## Runbook: slow TTFB

- Profile loader latency; cache where possible.
- Stream earlier; move long work to background or edge cache.
- Trim HTML head and critical CSS; defer non-critical scripts.

## Runbook: large HTML

- Remove unused data from serialized state.
- Paginate or stream long lists.
- Inline only critical CSS; lazy-load the rest.

## Quick wins

- Stream by default; only use full string rendering for small pages/tests.
- Hydrate heavy widgets on visibility/interaction.
- Keep adapter configs lean; disable Node polyfills in edge builds.

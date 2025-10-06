# PhilJS Storefront Example

A streaming PhilJS demo that exercises loaders, actions, islands, view transitions, speculation rules, and the AI adapter.

## Highlights

- **Streaming SSR** via `src/server/entry-server.ts` with resumable state.
- **Loaders & Actions** power the product route with optimistic cart updates.
- **Signals on the client** keep totals reactive with near-zero runtime cost.
- **Islands** hydrate on visibility and broadcast hydration events for tooling.
- **Platform APIs**: View Transitions, Speculation Rules, HTTP 103-ready helpers.
- **AI summary**: Local HTTP adapter summarises product descriptions.
- **PWA defaults**: Route-aware caches, manifest, and service worker streaming.
- **Observability**: Core Web Vitals RUM posts back to `/api/metrics`.
- **Security defaults**: CSP builder & signed cookies via `buildCSP` and `createCookie`.
- **Early hints**: HTTP 103 and priority hints warm critical assets.

## Getting Started

```bash
# install dependencies from the repo root
pnpm install

# build packages and the storefront bundle
pnpm build

# start the dev server with Vite + PhilJS SSR
pnpm --filter examples/storefront dev
```

Visit <http://localhost:3000>.

### Optional AI echo server

```bash
node examples/storefront/server/ai.js
```

The loader falls back gracefully if the AI endpoint is not running.

## Production build

```bash
pnpm --filter examples/storefront build
pnpm --filter examples/storefront preview

## Performance budgets

```bash
pnpm --filter examples/storefront build
pnpm check:budgets
```

The budget script enforces a 70 KB ceiling for JavaScript required before first interaction.
```

The preview command uses `server/prod.js` to serve `dist/client` assets and the compiled SSR entry in `dist/server`.

## Key files

```
src/
  entry-client.ts         # Client runtime: signals, islands, view transitions, RUM
  ai/summarize.ts         # Typed prompt and helper for product summaries
  routes/index.tsx        # Featured products via loader
  routes/products/[id].tsx # Loader + action + AI summary + island demo
  server/entry-server.ts  # Streaming renderer + template helper usage
  server/template.ts      # HTML escaping tagged template helper
  server/router.ts        # Manifest + matcher for filesystem routes
  server/mock-db.ts       # In-memory data facade used by loaders/actions
server/
  dev.js                  # Vite middleware SSR for development
  prod.js                 # Production HTTP server for built output
  ai.js                   # Local echo AI endpoint
public/
  sw.js                   # Streaming service worker with route caches
  manifest.json           # PWA manifest
```

## Tests

```bash
pnpm --filter examples/storefront test
pnpm --filter examples/storefront test:e2e
```

Playwright exercises SSR navigation, and vitest covers unit pieces in individual packages.

## Notes

- RUM posts to `/api/metrics`; wire this up to your own endpoint in production.
- `window.__PHIL_STATE__` carries base64 payloads via `philjs-ssr` `serializeState`/`deserializeState` helpers.
- Signals keep the product total reactive without additional hydration payload.

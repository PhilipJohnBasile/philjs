# Deployment Playbook (Advanced)

Step-by-step guidance for shipping PhilJS to edge and serverless targets with confidence.

## Pre-deploy checklist

- `pnpm build` succeeds for client + server bundles.
- `pnpm size` and perf benches pass budgets.
- Env vars defined with fallbacks; secrets not bundled.
- SSR smoke test locally (preview) with Playwright traces.
- Cache tags and revalidate hints set on critical routes.

## Edge (Vercel/Netlify/Cloudflare)

- Prefer edge runtime for latency-sensitive routes.
- Keep bundles small; avoid Node-only APIs.
- Set ISR/edge cache lifetimes and pair with router invalidation.
- Bind KV/D1/R2 or platform equivalents for hot data.
- Stream SSR; hydrate islands lazily.

## AWS/Node

- Use HTTP API for lower latency; keep functions small.
- Separate heavy tasks (PDF/image) into dedicated functions.
- Optimize cold starts: minimal deps, small Layers.
- Set memory/timeouts per function; monitor with metrics.

## Static/SSG

- Use `philjs-adapters/static` for fully static routes.
- Pre-generate sitemap/robots; set cache headers.
- Combine static shell with client-side data fetching if needed.

## CI/CD template

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test -- --runInBand
pnpm size
pnpm build
pnpm exec playwright test --reporter=line
```

Upload Playwright traces on failure; cache pnpm store.

## Observability on deploy

- Emit build id/version into responses.
- Log cache hit/miss, TTFB, and loader timings.
- Alert on error rate, cold starts, and budget breaches post-deploy.

## Rollback strategy

- Keep previous build artifact; enable traffic flip/feature flags.
- Roll back quickly on TTFB/error spikes; invalidate caches to clear bad HTML/data.

## Security

- Lock CSP; avoid remote eval.
- Validate env presence at startup; fail fast.
- Strip `__proto__`/`constructor` keys from JSON input.

## Smoke tests post-deploy

- Hit top routes with Playwright; assert no console errors.
- Check cache headers and TTFB via `curl -I -w`.
- Validate SSR + hydration for dynamic routes.

## Checklist

- [ ] Budgets (size/perf) enforced in CI.
- [ ] Edge/ISR configs set; caches paired with invalidation.
- [ ] Env/secrets handled correctly per platform.
- [ ] Observability dashboards updated for release.
- [ ] Rollback plan in place.

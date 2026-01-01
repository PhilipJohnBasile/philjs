# Tooling and Dev Experience

Great DX keeps teams fast. PhilJS ships CLI scaffolding, a devtools extension, and build-time helpers so you can stay focused on product. Cross-reference `docs/tooling`, `docs/guides`, and `docs/packages/philjs-cli` for deeper command references; this chapter is the hands-on cheat sheet.

## philjs-cli

- `pnpm create philjs@latest` – scaffold apps, SSR targets, and adapters.
- `philjs dev` – launches Vite dev server with PhilJS plugins prewired.
- `philjs build` – SSR + client bundles with manifest output for adapters.
- `philjs inspect` – prints route tree, loaders/actions, and bundle splits.
- `philjs test` – convenience wrapper for unit/integration suites.
- `philjs check` – runs lint/typecheck/budget scripts together.

## DevTools extension

- **Signals graph**: visualize dependencies; spot over-rendering quickly.
- **Perf flamecharts**: record render/hydration timing.
- **Router panel**: inspect loaders/actions, cache state, and invalidations.
- **Accessibility checks**: ARIA annotations and contrast hints inline.

Install the extension locally, then enable the PhilJS tab in your browser devtools. For headless CI screenshots, use Playwright with the devtools inspector API.

Tips:
- Run devtools against production builds in a local preview to spot hydration gaps.
- Record timeline during route transitions and compare before/after code changes.

## Builder and plugins

- Use `@philjs/builder` to assemble adapters (Vercel, Netlify, CF, Node, Bun, Deno).
- Plugins can add:
  - environment validation,
  - SVG/MDX handling,
  - image optimization pipelines,
  - perf budgets checks.
- Keep plugin order deterministic; prefer pure transforms over runtime shims.
- Reuse plugin recipes from `docs/deployment` and `docs/performance` for edge builds.

## Migrate

`@philjs/migrate` helps move React/Solid/Svelte code:

- JSX runtime mapping (automatic).
- Signalizing state (replace `useState`/`useEffect` with signals/effects).
- Router migration cheatsheets (React Router → PhilJS Router).
- Style migration hints (CSS Modules/Emotion/Tailwind) with minimal churn.

## Linting and type safety

- ESLint config: `packages/philjs-eslint` and `eslint-config-philjs` enforce signals best practices (no async effects, dependency hygiene).
- TypeScript 6 baseline with strict settings; keep `tsconfig.base.json` synced across packages.
- Run `pnpm lint` and `pnpm typecheck` in CI to catch regressions early.
- Add `pnpm size` to CI for perf budgets.
- Use `tsc --noEmit` across packages before releases to catch drift.

## Recommended workflow

1) Scaffold with CLI.
2) Run `philjs dev` and keep DevTools open to watch signals graphs.
3) Add budgets (`size-limit`) early and gate PRs.
4) Add Playwright smoke tests per route; wire to CI.
5) Use `philjs inspect` before shipping to confirm route data contracts.
6) Automate `philjs inspect` + bundle snapshots in CI for visibility.

## Automation ideas

- Snapshot bundle sizes and route trees per PR; attach artifacts for review.
- Auto-run `philjs inspect` and diff results to catch unexpected route/config changes.
- Generate changelogs from route/config diffs to highlight potential breaking changes.

## Try it now: inspect + devtools profiling loop

1) `philjs inspect --json > .out/routes.json` to snapshot your route tree and caches.
2) Run `philjs dev` and open DevTools → PhilJS tab → record a route transition.
3) Identify slow components; inline memoization or split routes; rerun `inspect` to ensure bundles are still under budget.

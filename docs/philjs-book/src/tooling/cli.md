# PhilJS CLI Reference

Use the PhilJS CLI to scaffold, build, and inspect projects quickly.

## Commands

- `pnpm create philjs@latest my-app` — scaffold a new app.
- `philjs dev` — start Vite dev server with PhilJS plugins.
- `philjs build` — build client + server bundles with manifests for adapters.
- `philjs inspect` — print route tree, loaders/actions, bundle splits.
- `philjs test` — run configured tests (wrapper around workspace scripts).
- `philjs check` — run lint + typecheck + size budgets.

## Options (common)

- `--ssr` — ensure SSR build outputs are generated.
- `--analyze` — bundle analysis (when supported in config).
- `--config` — custom config path.
- `--filter` — limit to specific packages/routes.

## Workflow tips

- Run `philjs inspect --json > .out/routes.json` to snapshot route topology.
- Pair `philjs build` with platform adapters (Vercel/Netlify/CF) for previews.
- Add CLI commands to CI (`check`, `build`) to gate merges.

## Troubleshooting

- If CLI isn’t found, ensure `node_modules/.bin` is on PATH or use `pnpm philjs ...`.
- For Windows, prefer `pnpm philjs` to avoid PATH issues.
- Align CLI version with repo packages (`0.1.0`).

## Links

- See `publishing/workflow.md` for export commands.
- See `devops/ci-cd.md` for CI integration.

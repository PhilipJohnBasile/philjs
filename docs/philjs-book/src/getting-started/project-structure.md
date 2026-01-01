# Project Structure

PhilJS keeps the frontend predictable. This is the default layout used by the CLI and examples.

```
my-app/
├─ public/               # Static assets
├─ src/
│  ├─ App.tsx            # Root component
│  ├─ main.tsx           # Client entry
│  ├─ routes/            # Route modules (components + loaders/actions)
│  ├─ components/        # Reusable UI components
│  ├─ stores/            # Signals + stores
│  ├─ styles/            # Global styles and tokens
│  └─ entry-server.tsx   # SSR entry (optional)
├─ tests/                # Unit + integration tests
├─ philjs.config.ts      # PhilJS configuration
├─ tsconfig.json
└─ package.json
```

## Why this layout

- `components/` keeps UI primitives isolated and reusable.
- `routes/` pairs views with loaders/actions for local-first data access.
- `stores/` hosts shared state and domain signals.
- `entry-server.tsx` exists only when SSR is enabled.

## Files to add early

- `philjs.config.ts`: project-level config for adapters, aliases, and experimental flags.
- `tsconfig.json`: point `jsxImportSource` to `@philjs/core`.
- `vite.config.ts`: include PhilJS plugin + adapters (edge/node).
- `tests/setup.ts`: shared test setup (MSW, testing library, cleanup).
- `.env.example`: declare required env vars (API_URL, FEATURE_FLAGS).

## Multi-package workspace

In monorepos, keep `apps/` and `packages/` separate:

```
apps/web/        # PhilJS app
packages/ui/     # Shared components
packages/core/   # Domain logic
packages/adapters/
```

Use `workspace:*` for internal deps and align `tsconfig` paths across packages.

## Server entry (SSR)

Add `src/entry-server.tsx` when enabling SSR:

```tsx
import { renderToStream } from '@philjs/ssr';
import { routes } from './routes';

export function handle(request: Request) {
  return renderToStream(<App routes={routes} request={request} />);
}
```

Adapters import this entry to bind to their platforms.

## Checklist

- [ ] `src/` contains components, routes, stores, styles.
- [ ] `entry-server.tsx` exists if SSR is on.
- [ ] Shared configs (tsconfig.base, lint, prettier) at the repo root.
- [ ] Env vars declared and loaded via platform-safe mechanisms.
- [ ] Tests and scripts live under `tests/` or per-package `__tests__/`.


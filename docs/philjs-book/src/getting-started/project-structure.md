# Project Structure

PhilJS keeps the frontend predictable. This is the default layout used by the CLI and examples.

```
my-app/
├── public/               # Static assets
├── src/
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Client entry
│   ├── components/       # Reusable UI components
│   ├── routes/           # Route modules
│   ├── stores/           # Signals + stores
│   ├── styles/           # Global styles
│   └── entry-server.tsx  # SSR entry (optional)
├── tests/                # Unit + integration tests
├── philjs.config.ts      # PhilJS configuration
├── tsconfig.json
└── package.json
```

## Why this layout

- `components/` keeps UI primitives isolated and reusable.
- `routes/` pairs views with loaders/actions for local-first data access.
- `stores/` hosts shared state and domain signals.
- `entry-server.tsx` exists only when SSR is enabled.

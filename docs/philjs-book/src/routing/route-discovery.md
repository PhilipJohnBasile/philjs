# Route Discovery

PhilJS route discovery turns files and route metadata into a validated route manifest. This chapter explains how discovery works, how to control it, and how to keep it fast in large codebases.

## How discovery works

1. **Scan** route roots (usually `src/routes`) for route files and folders.
2. **Parse** route patterns from filenames and folder structure.
3. **Read metadata** (route config exports, loader/action signatures, and middleware hints).
4. **Build a manifest** for the router and the build pipeline.
5. **Validate** collisions, missing layouts, and invalid parameters early.

Discovery runs in dev (fast, incremental) and at build time (full, deterministic).

## Naming conventions

Common patterns:

- `index.tsx` maps to the folder path.
- `[id].tsx` or `[...path].tsx` express params and catch-alls.
- `_layout.tsx` or `layout.tsx` defines a layout boundary.
- `route.ts` or `+route.ts` can be used for metadata-only routes.

Use consistent naming so the manifest is predictable. Avoid mixing multiple param styles in a single tree.

## Controlling discovery

Use explicit config to scope or override discovery:

```ts
export default {
  routes: {
    rootDir: 'src/routes',
    ignore: ['**/*.test.tsx', '**/__fixtures__/**'],
    reservedFiles: ['_layout.tsx', 'route.ts'],
  },
};
```

Tips:

- Keep fixtures and stories out of the route tree.
- Avoid deep nesting unless layouts are required.
- Prefer fewer dynamic segments for better link predictability.

## Validation and diagnostics

Discovery should surface errors early:

- Duplicate routes (`/docs` defined in multiple files).
- Param conflicts (`[id]` vs `[slug]` under the same parent).
- Missing layout boundaries where a layout is required.
- Unreachable routes due to guard or group configuration.

Pair discovery with `philjs inspect` to audit the final manifest.

## Route discovery and preloading

Smart preloading relies on discovery output. For high-traffic routes:

- Mark routes with preload hints.
- Keep loader data small and cacheable.
- Avoid creating preloading chains that pull large graphs of routes.

## Checklist

- [ ] Route root is explicit and stable across environments.
- [ ] Reserved filenames are consistent across the app.
- [ ] Route collisions are detected in CI.
- [ ] Discovery output is checked with `philjs inspect`.

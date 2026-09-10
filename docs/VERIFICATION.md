# Verification notes

Documentation refresh: September 10, 2026.

## Reproduce the focused checks

```bash
node examples/signals-demo.mjs
```

## Local result

Passed on Node.js 24 from the fresh checkout without installing project dependencies. The example checks source-level signal updates, memoization, batching, and effect disposal.

## Hosted checks

[Workflow and current runs](https://github.com/PhilipJohnBasile/philjs/actions/workflows/core-demo.yml). Inspect the commit and individual jobs when using a run as evidence; a successful earlier run does not validate later source changes.

## Broader checks that remain unresolved

The [core demo passed on GitHub](https://github.com/PhilipJohnBasile/philjs/actions/runs/34513101993). The [full CI run](https://github.com/PhilipJohnBasile/philjs/actions/runs/34513102000) also exposed failures in lint, type checking, and package tests. The [release workflow](https://github.com/PhilipJohnBasile/philjs/actions/runs/34513102022) failed during tests, including unresolved `@philjs/core` imports in the Adonis adapter and a deprecated TypeScript module-resolution configuration in the enterprise package. These packages and configurations were unchanged by this documentation refresh.

The focused demo is a reproducible entry point. It does not clear those broader release blockers.

## Release and coverage scope

Source packages are version 0.1.0. No GitHub release was published at the start of this refresh. The small core demo does not validate the entire monorepo, JSX rendering, browser compatibility, or package publication.

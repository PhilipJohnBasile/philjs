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

## Release and coverage scope

Source packages are version 0.1.0. No GitHub release was published at the start of this refresh. The small core demo does not validate the entire monorepo, JSX rendering, browser compatibility, or package publication.

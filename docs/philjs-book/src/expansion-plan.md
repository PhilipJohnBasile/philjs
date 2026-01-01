# PhilJS Book Expansion Plan (550 pages target)

Goal: ~550 print pages ≈ 137,500 words (assume ~250 words/page). Current total: ~3,013 words (~12 pages). Below is the structure, word targets, and priorities to reach full coverage without filler.

## Part-level word targets

- Part 1 · Foundations (Getting Started + Core): 18k words
- Part 2 · Rendering (JSX, Control Flow, Data): 16k words
- Part 3 · Routing + Data Layer: 18k words
- Part 4 · Styling + Design Systems: 14k words
- Part 5 · Testing + Quality: 12k words
- Part 6 · Performance + Budgets: 16k words
- Part 7 · SSR/Islands/Edge: 16k words
- Part 8 · State, Stores, Signals Deep Dive: 18k words
- Part 9 · Integrations (API, GraphQL, WebSockets, Streaming): 18k words
- Part 10 · Tooling (CLI, DevTools, Builder, Migrate): 14k words
- Part 11 · Platforms (Mobile, Desktop, XR, WASM, WebGPU): 20k words
- Part 12 · Deployment + Observability + Security: 18k words
- Part 13 · Patterns + Recipes + Case Studies: 24k words
- Part 14 · Nexus Architecture + GenUI + AI: 18k words
- Part 15 · Appendices (TS6, Reference, Glossary): 11k words

## Chapter outline (high level)

- Foundations: philosophy, mental model, differences vs React/Solid/Svelte, project setup, CLI walkthrough, first app tutorial.
- Core primitives: signals, memos, effects, resources, context, error boundaries, forms, accessibility, animation.
- Rendering: JSX runtime, conditional rendering, lists/keys, hydration, resumability, view transitions, streaming.
- Routing/Data: router basics, loaders/actions, mutations, optimistic UI, caching policies, invalidation strategies, offline data.
- Styling: CSS modules, PhilJS styles package, Tailwind adapter, design tokens, theme switching, motion system.
- Testing: unit tests with Vitest, component testing, Playwright e2e, contract tests, fuzz/property tests for signals.
- Performance: profiling, flamecharts, budgets (`size-limit`), tree-shaking, code splitting, edge prefetch, perf checklists.
- SSR/Islands/Edge: SSR pipelines, island hydration, edge rendering, CDN caching, partial hydration strategies.
- State deep dive: stores vs signals, undo/redo, time travel, xstate integration, shared worker state, multi-tab sync.
- Integrations: REST/OpenAPI, GraphQL, TRPC, WebSockets, server-sent events, file uploads, background jobs.
- Tooling: `philjs-cli`, devtools extension, migrate tool, builder/plugins, linters/ESLint config.
- Platforms: Native/Capacitor, Tauri desktop, WASM, WebGPU rendering, XR/3D, offline/PWA, edge runtime constraints.
- Deployment/Observability/Security: adapters (Vercel/Netlify/CF/AWS/Bun/Deno/Node), logs/metrics/tracing, security model.
- Patterns/Recipes: forms, dashboards, streaming UIs, multi-tenant SaaS, a11y patterns, i18n, theming, feature flags.
- Nexus/GenUI/AI: local-first, CRDT-friendly patterns, AI agent UI, intent APIs, guardrails, safety, cost tracking.
- Appendices: TypeScript 6 refresher, migration cheatsheets, glossary, FAQ.

## Writing order (to lock in momentum)

1) Flesh out Getting Started + Core (Parts 1–3) to ~20% of total words (≈27k).
2) Expand Routing/Data + State + Integrations (Parts 3, 8, 9) to another ~30% (≈41k).
3) Add Tooling + Performance + SSR/Edge + Styling (Parts 4, 5, 6, 7, 10) for ~30% (≈41k).
4) Finish Platforms + Deployment/Observability/Security + Patterns + Nexus/AI + Appendices for remaining ~20% (≈28k).

## Mechanics and quality bar

- Each chapter should include: problem framing, minimal example, expanded example, performance notes, testing notes, deployment note, and a short checklist.
- Include diagrams as ASCII placeholders now; replace with proper figures later.
- Maintain API correctness against `0.1.0` and TypeScript 6 types; cross-check with `docs/api-reference` and package READMEs.
- Add “Try it now” snippets that can be copy/pasted into `examples/` or `playground`.

## Next immediate actions

- Add detailed subchapter stubs per part with ~500–800 words each, then iterate.
- Pull existing docs from `docs/**` into the relevant book sections to avoid duplication.
- Track word counts per chapter (simple script) to keep pacing toward 137k words.

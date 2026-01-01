# Introduction

PhilJS is a TypeScript-first, signals-first framework built for the Nexus era: local-first data, zero-latency UX, and adaptive UI. This book is the canonical guide for PhilJS v0.1.0.

## Who this book is for

- Teams shipping product UIs that must feel instant
- Library authors who want a stable, typed UI foundation
- Fullstack engineers who need SSR, islands, and streaming without runtime bloat

## What you will learn

1. Tooling setup for Node 24+ and TypeScript 6.x
2. Core primitives: signals, effects, memos, resources
3. Routing with loaders/actions and offline-first patterns
4. SSR + islands with selective hydration
5. Testing, performance, and deployment
6. Nexus architecture principles

## Conventions

- All code is TypeScript or TSX.
- Imports are scoped: `@philjs/core`, `@philjs/router`, `@philjs/ssr`.
- Versions are pinned to `^0.1.0`.
- Commands use pnpm 9+.

## Canonical standards

PhilJS standards are derived from the current codebase and documentation. When you see a pattern here, treat it as the canonical PhilJS way.

## Core ideas in one page

- **Signals-first**: fine-grained reactivity without diffing; memos/resources for derived/async data.
- **SSR + Islands + Streaming**: render on the server, hydrate only what matters, stream the rest.
- **Loaders/Actions**: data and mutations live at the route boundary, enabling cache tags, revalidate hints, and optimistic flows.
- **Adapters everywhere**: deploy to Edge (Vercel/Netlify/CF/Bun/Deno) or regional (Node/AWS) with the same primitives.
- **Nexus-ready**: local-first, collaborative, AI-assisted patterns built in.

## How to read this book

- Start with Getting Started to set up toolchain and build a counter.
- Jump to Core and Rendering to understand signals, memos, and JSX ergonomics.
- Route/Data/Forms for real apps; SSR/Islands to go production.
- Testing/Performance/Observability to keep quality high.
- Integrations/Platforms/Patterns to plug into your backend and targets.
- Nexus/GenUI when building AI and collaborative experiences.

## Compatibility and versions

- Node 24+ required; Node 25 supported.
- TypeScript 6.x; use `jsxImportSource: "@philjs/core"`.
- All examples use `@philjs/*@0.1.0`.
- pnpm is the package manager used throughout; adapt commands for npm/yarn if needed.

## What “Nexus era” means

Nexus combines:

- Local-first state and offline durability.
- Edge-rendered, latency-sensitive UX.
- AI-assisted intent handling with guardrails.
- Collaborative presence and conflict resolution.

PhilJS packages (`@philjs/core`, `@philjs/router`, `@philjs/ssr`, adapters, devtools) are designed to serve these requirements together.

## Next steps

Get your toolchain ready, scaffold a project, and follow the Getting Started chapters. Each later chapter includes “Try it now” snippets so you can apply concepts immediately.

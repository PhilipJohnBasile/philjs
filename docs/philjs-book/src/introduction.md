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

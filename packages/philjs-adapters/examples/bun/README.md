# @philjs/bun-example

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![PhilJS Version](https://img.shields.io/badge/philjs-0.1.0-ff69b4)](https://github.com/yourusername/philjs)

Reference Bun server showing how to run PhilJS SSR with Bun.serve(), SQLite, and WebSockets.

## Scripts

- `pnpm dev` (or `bun run --hot server.ts`) – basic server with HMR
- `pnpm advanced` – advanced server including SQLite + WebSocket example
- `pnpm start` – production start

## Quickstart

```bash
pnpm install
pnpm dev
# or bun install && bun run --hot server.ts
```

## Highlights

- Uses `@philjs/adapters` Bun adapter to serve SSR output.
- Demonstrates streaming responses and WebSocket hooks.
- Targets Node 24 / TypeScript 6 and PhilJS 0.1.0.

## Folder layout

- `server.ts` – minimal starter
- `server-advanced.ts` – sockets + SQLite
- `bunfig.toml` – Bun runtime configuration

For more deployment options, see `packages/philjs-adapters/README.md`.

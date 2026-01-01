# PhilJS Capacitor Template

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![PhilJS Version](https://img.shields.io/badge/philjs-0.1.0-ff69b4)](https://github.com/yourusername/philjs)

Starter mobile app template that wires PhilJS UI with Capacitor plugins for camera, geolocation, notifications, and offline-friendly storage.

## Scripts

- `pnpm dev` – Vite dev server for web preview
- `pnpm build` – TypeScript 6 typecheck + Vite build
- `pnpm cap:init` – initialize Capacitor project metadata
- `pnpm cap:add:ios` / `pnpm cap:add:android` – add native platforms
- `pnpm cap:sync` – sync web assets to native shells
- `pnpm cap:open:ios` / `pnpm cap:open:android` – open native IDEs
- `pnpm build:ios` / `pnpm build:android` – build + sync + open

## Quickstart

```bash
pnpm install
pnpm dev           # preview in browser
pnpm build         # ensure type-safe output
pnpm cap:init      # set app id/name once
pnpm cap:add:ios   # or cap:add:android
pnpm cap:sync
pnpm cap:open:ios  # launch Xcode / Android Studio
```

## Project layout

- `src/` – PhilJS app entry; add routes/components here
- `capacitor.config.ts` – app id/name, server settings, plugins
- `vite.config.ts` – Vite + PhilJS config for web build
- `tsconfig.json` – TypeScript 6 settings

## Requirements

- Node 24+, TypeScript 6, PhilJS 0.1.0
- Xcode (macOS) for iOS builds; Android Studio + SDK for Android

For native APIs and plugin usage, see the Capacitor docs plus `@philjs/native` examples in `packages/philjs-native`.

# @philjs/pwa

Zero-config PWA generation for PhilJS - service worker, manifest, push notifications

<!-- PACKAGE_GUIDE_START -->
## Overview

Zero-config PWA generation for PhilJS - service worker, manifest, push notifications

## Focus Areas

- philjs, pwa, service-worker, manifest, push-notifications, offline

## Entry Points

- packages/philjs-pwa/src/index.ts

## Quick Start

```ts
import { CacheStrategy, InstallPromptEvent, ManifestGenerator } from '@philjs/pwa';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- CacheStrategy
- InstallPromptEvent
- ManifestGenerator
- NotificationOptions
- PWAConfig
- PWAFileHandler
- PWAIcon
- PWAManager
- PWAScreenshot
- PWAShareTarget
- PWAShortcut
- PWAState
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/pwa
```
## Usage

```ts
import { CacheStrategy, InstallPromptEvent, ManifestGenerator } from '@philjs/pwa';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-pwa/src/index.ts

### Public API
- Direct exports: CacheStrategy, InstallPromptEvent, ManifestGenerator, NotificationOptions, PWAConfig, PWAFileHandler, PWAIcon, PWAManager, PWAScreenshot, PWAShareTarget, PWAShortcut, PWAState, ServiceWorkerGenerator, pwaPlugin, useInstallPrompt, useOnlineStatus, usePWA
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

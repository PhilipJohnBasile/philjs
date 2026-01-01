# @philjs/hypermedia

HTML-over-the-wire for PhilJS - server-driven UI updates with declarative attributes

<!-- PACKAGE_GUIDE_START -->
## Overview

HTML-over-the-wire for PhilJS - server-driven UI updates with declarative attributes

## Focus Areas

- philjs, hypermedia, html-over-the-wire, progressive-enhancement, server-driven, partial-updates

## Entry Points

- packages/philjs-htmx/src/index.ts

## Quick Start

```ts
import { AjaxOptions, HTMXConfig, HTMXError } from '@philjs/hypermedia';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AjaxOptions
- HTMXConfig
- HTMXError
- HTMXExtension
- HTMXRequestEvent
- HTMXResponseEvent
- HTMXSwapEvent
- SwapStyle
- TriggerEvent
- TriggerModifier
- TriggerSpec
- defineExtension
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/hypermedia
```
## Usage

```ts
import { AjaxOptions, HTMXConfig, HTMXError } from '@philjs/hypermedia';
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
- Source files: packages/philjs-htmx/src/index.ts

### Public API
- Direct exports: AjaxOptions, HTMXConfig, HTMXError, HTMXExtension, HTMXRequestEvent, HTMXResponseEvent, HTMXSwapEvent, SwapStyle, TriggerEvent, TriggerModifier, TriggerSpec, defineExtension, getHTMXInfo, htmx, htmxResponse, htmxStyles, initHTMX, injectStyles, isHTMXRequest, removeExtension
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

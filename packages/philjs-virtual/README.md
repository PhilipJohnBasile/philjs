# @philjs/virtual

High-performance list virtualization for PhilJS - render millions of items efficiently

<!-- PACKAGE_GUIDE_START -->
## Overview

High-performance list virtualization for PhilJS - render millions of items efficiently

## Focus Areas

- virtualization, virtual-list, virtual-scroll, windowing, philjs

## Entry Points

- packages/philjs-virtual/src/index.ts

## Quick Start

```ts
import { DEFAULT_OVERSCAN, DEFAULT_SCROLL_DEBOUNCE, ScrollToOptions } from '@philjs/virtual';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- DEFAULT_OVERSCAN
- DEFAULT_SCROLL_DEBOUNCE
- ScrollToOptions
- VirtualGrid
- VirtualGridProps
- VirtualItem
- VirtualList
- VirtualListProps
- Virtualizer
- VirtualizerOptions
- calculateVisibleRange
- createSmoothScroller
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/virtual
```
## Usage

```ts
import { DEFAULT_OVERSCAN, DEFAULT_SCROLL_DEBOUNCE, ScrollToOptions } from '@philjs/virtual';
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
- Source files: packages/philjs-virtual/src/index.ts

### Public API
- Direct exports: DEFAULT_OVERSCAN, DEFAULT_SCROLL_DEBOUNCE, ScrollToOptions, VirtualGrid, VirtualGridProps, VirtualItem, VirtualList, VirtualListProps, Virtualizer, VirtualizerOptions, calculateVisibleRange, createSmoothScroller, createVirtualizer, createWindowScroller, findIndexAtOffset, useVirtualizer, useWindowVirtualizer
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

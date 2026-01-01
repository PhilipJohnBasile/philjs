# @philjs/intent

Intent-based development for PhilJS - natural language to working components

<!-- PACKAGE_GUIDE_START -->
## Overview

Intent-based development for PhilJS - natural language to working components

## Focus Areas

- philjs, intent, ai, natural-language, code-generation, declarative, low-code

## Entry Points

- packages/philjs-intent/src/index.ts

## Quick Start

```ts
import { AlternativeImplementation, Constraint, Counter } from '@philjs/intent';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AlternativeImplementation
- Constraint
- Counter
- DataFetcher
- Intent
- IntentConfig
- IntentContext
- IntentResolver
- IntentTemplate
- Modal
- ResolvedIntent
- builtInTemplates
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/intent
```
## Usage

```ts
import { AlternativeImplementation, Constraint, Counter } from '@philjs/intent';
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
- Source files: packages/philjs-intent/src/index.ts

### Public API
- Direct exports: AlternativeImplementation, Constraint, Counter, DataFetcher, Intent, IntentConfig, IntentContext, IntentResolver, IntentTemplate, Modal, ResolvedIntent, builtInTemplates, getIntentResolver, initIntent, intent, useApiData, useIntent, useModal
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

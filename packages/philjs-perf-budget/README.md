# @philjs/perf-budget

Performance budget enforcement for PhilJS - Core Web Vitals, bundle size limits, build checks

<!-- PACKAGE_GUIDE_START -->
## Overview

Performance budget enforcement for PhilJS - Core Web Vitals, bundle size limits, build checks

## Focus Areas

- philjs, performance, budget, web-vitals, lcp, cls, fid, bundle-size

## Entry Points

- packages/philjs-perf-budget/src/index.ts

## Quick Start

```ts
import { BudgetChecker, BudgetConfig, BudgetViolation } from '@philjs/perf-budget';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- BudgetChecker
- BudgetConfig
- BudgetViolation
- BuildArtifact
- BuildBudgetChecker
- PerformanceBudget
- PerformanceMetrics
- PerformanceObserverManager
- PerformanceScore
- perfBudgetPlugin
- usePerformanceBudget
- usePerformanceMetric
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/perf-budget
```
## Usage

```ts
import { BudgetChecker, BudgetConfig, BudgetViolation } from '@philjs/perf-budget';
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
- Source files: packages/philjs-perf-budget/src/index.ts

### Public API
- Direct exports: BudgetChecker, BudgetConfig, BudgetViolation, BuildArtifact, BuildBudgetChecker, PerformanceBudget, PerformanceMetrics, PerformanceObserverManager, PerformanceScore, perfBudgetPlugin, usePerformanceBudget, usePerformanceMetric, useWebVitals
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

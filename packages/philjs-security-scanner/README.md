# @philjs/security-scanner

Automated vulnerability detection for PhilJS - static analysis, dependency scanning, runtime monitoring

<!-- PACKAGE_GUIDE_START -->
## Overview

Automated vulnerability detection for PhilJS - static analysis, dependency scanning, runtime monitoring

## Focus Areas

- philjs, security, scanner, vulnerability, xss, csrf, sast, dast

## Entry Points

- packages/philjs-security-scanner/src/index.ts

## Quick Start

```ts
import { CodeLocation, DependencyScanner, DependencyVulnerability } from '@philjs/security-scanner';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- CodeLocation
- DependencyScanner
- DependencyVulnerability
- HeadersValidator
- RuntimeAlert
- RuntimeMonitor
- ScanConfig
- ScanResult
- ScanSummary
- SecurityHeaders
- SecurityRule
- SecurityScanner
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/security-scanner
```
## Usage

```ts
import { CodeLocation, DependencyScanner, DependencyVulnerability } from '@philjs/security-scanner';
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
- Source files: packages/philjs-security-scanner/src/index.ts

### Public API
- Direct exports: CodeLocation, DependencyScanner, DependencyVulnerability, HeadersValidator, RuntimeAlert, RuntimeMonitor, ScanConfig, ScanResult, ScanSummary, SecurityHeaders, SecurityRule, SecurityScanner, Severity, StaticScanner, Vulnerability, VulnerabilityType, useRuntimeMonitor, useSecurityHeaders, useSecurityScanner
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

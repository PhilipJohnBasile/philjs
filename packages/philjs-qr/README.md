# @philjs/qr

QR code generation and scanning for PhilJS - customizable styles, logos, camera scanning

<!-- PACKAGE_GUIDE_START -->
## Overview

QR code generation and scanning for PhilJS - customizable styles, logos, camera scanning

## Focus Areas

- philjs, qr, qrcode, barcode, scanner, camera

## Entry Points

- packages/philjs-qr/src/index.ts

## Quick Start

```ts
import { batchGenerateQR, createEmailQR, createEventQR } from '@philjs/qr';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- batchGenerateQR
- createEmailQR
- createEventQR
- createGeoQR
- createSMSQR
- createVCardQR
- createWiFiQR
- generateQRCode
- generateQRCodeCanvas
- generateQRCodeDataURL
- validateQRData
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/qr
```
## Usage

```ts
import { batchGenerateQR, createEmailQR, createEventQR } from '@philjs/qr';
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
- Source files: packages/philjs-qr/src/index.ts

### Public API
- Direct exports: batchGenerateQR, createEmailQR, createEventQR, createGeoQR, createSMSQR, createVCardQR, createWiFiQR, generateQRCode, generateQRCodeCanvas, generateQRCodeDataURL, validateQRData
- Re-exported names: BarcodeFormat, BatchQROptions, BatchQRResult, DynamicQRConfig, ErrorCorrectionLevel, QRAnalytics, QRCode, QRCodeConfig, QRCodeOptions, QRExportOptions, QRGradient, QRLogo, QROutputFormat, QRScanner, QRScannerConfig, QRStyle, ScanResult, ScannerCallbacks, ScannerConfig, createQRCode, createQRScanner
- Re-exported modules: ./components/QRCode.js, ./components/QRScanner.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

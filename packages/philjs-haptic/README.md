# @philjs/haptic

Haptic feedback system for PhilJS - vibration patterns, gamepad haptics, XR haptics

<!-- PACKAGE_GUIDE_START -->
## Overview

Haptic feedback system for PhilJS - vibration patterns, gamepad haptics, XR haptics

## Focus Areas

- philjs, haptic, vibration, feedback, gamepad, xr, mobile

## Entry Points

- packages/philjs-haptic/src/index.ts

## Quick Start

```ts
import { GamepadHapticEffect, GamepadHaptics, HAPTIC_PATTERNS } from '@philjs/haptic';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- GamepadHapticEffect
- GamepadHaptics
- HAPTIC_PATTERNS
- HapticComposer
- HapticConfig
- HapticEngine
- HapticIntensity
- HapticPattern
- HapticType
- XRHapticPulse
- XRHaptics
- useGamepadHaptics
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/haptic
```
## Usage

```ts
import { GamepadHapticEffect, GamepadHaptics, HAPTIC_PATTERNS } from '@philjs/haptic';
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
- Source files: packages/philjs-haptic/src/index.ts

### Public API
- Direct exports: GamepadHapticEffect, GamepadHaptics, HAPTIC_PATTERNS, HapticComposer, HapticConfig, HapticEngine, HapticIntensity, HapticPattern, HapticType, XRHapticPulse, XRHaptics, useGamepadHaptics, useHaptic, useHapticPattern, useXRHaptics
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

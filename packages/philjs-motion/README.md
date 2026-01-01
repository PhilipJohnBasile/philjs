# @philjs/motion

Spring physics animation system for PhilJS - gesture-driven, FLIP, scroll-linked animations

<!-- PACKAGE_GUIDE_START -->
## Overview

Spring physics animation system for PhilJS - gesture-driven, FLIP, scroll-linked animations

## Focus Areas

- philjs, animation, spring, physics, flip, gesture, scroll

## Entry Points

- packages/philjs-motion/src/index.ts

## Quick Start

```ts
import { AnimatedTransform, AnimatedValue, AnimationCallback } from '@philjs/motion';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AnimatedTransform
- AnimatedValue
- AnimationCallback
- AnimationSequence
- AnimationState
- Easing
- EasingFunction
- FlipAnimation
- GestureAnimation
- GestureState
- LayoutRect
- ScrollAnimation
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/motion
```
## Usage

```ts
import { AnimatedTransform, AnimatedValue, AnimationCallback } from '@philjs/motion';
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
- Source files: packages/philjs-motion/src/index.ts

### Public API
- Direct exports: AnimatedTransform, AnimatedValue, AnimationCallback, AnimationSequence, AnimationState, Easing, EasingFunction, FlipAnimation, GestureAnimation, GestureState, LayoutRect, ScrollAnimation, ScrollInfo, Spring, SpringConfig, SpringPresets, SpringVector, TransformValues, useAnimatedTransform, useFlip, useGesture, useScrollAnimation, useSpring, useSpringVector
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT

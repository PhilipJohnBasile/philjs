# philjs-swift

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Swift bindings for PhilJS - iOS and macOS native app development.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported
- **Swift 5.9+** for Swift-side features
- **Xcode 15+** for iOS/macOS development

## Installation

```bash
pnpm add @philjs/swift
```

## Features

- **iOS Integration** - Build iOS apps with PhilJS
- **macOS Support** - Native macOS application development
- **SwiftUI** - Reactive UI with SwiftUI interop
- **UIKit Bridge** - Access UIKit APIs from TypeScript
- **AppKit Bridge** - Access AppKit APIs for macOS
- **Type Bridge** - Automatic TypeScript <-> Swift type conversion

## Quick Start

### iOS Setup

```typescript
import { createIOSApp } from '@philjs/swift/ios';

const app = createIOSApp({
  name: 'MyApp',
  bundleId: 'com.example.myapp',
  deploymentTarget: '17.0',
});

// Generate iOS project
await app.scaffold('./ios');
```

### macOS Setup

```typescript
import { createMacOSApp } from '@philjs/swift/macos';

const app = createMacOSApp({
  name: 'MyDesktopApp',
  bundleId: 'com.example.mydesktopapp',
  deploymentTarget: '14.0',
  category: 'public.app-category.developer-tools',
});

// Generate macOS project
await app.scaffold('./macos');
```

### SwiftUI Integration

```typescript
import { createSwiftUIBinding } from '@philjs/swift/ios';
import { signal } from '@philjs/core';

const count = signal(0);

// Create SwiftUI-compatible state
const swiftState = createSwiftUIBinding(count, {
  name: 'counter',
  type: 'Int',
});

// Generated Swift code:
// @State private var counter: Int = 0
```

### Swift Bridge

```typescript
import { createSwiftBridge } from '@philjs/swift';

const bridge = createSwiftBridge({
  module: './swift/Shared.swift',
  exports: ['calculateSum', 'formatDate', 'UserData'],
});

// Call Swift functions from TypeScript
const sum = await bridge.invoke('calculateSum', [1, 2, 3]);
console.log(sum); // 6

// Use Swift structs
const user = await bridge.create('UserData', {
  name: 'John',
  age: 30,
});
```

## ES2024 Features

### Promise.withResolvers() for iOS APIs

```typescript
import { createIOSBridge } from '@philjs/swift/ios';

const ios = createIOSBridge();

// Wrap completion handler-based iOS APIs with Promise.withResolvers()
function requestNotificationPermission() {
  const { promise, resolve, reject } = Promise.withResolvers<boolean>();

  ios.requestNotificationAuthorization({
    onGranted: () => resolve(true),
    onDenied: () => resolve(false),
    onError: (error) => reject(error),
  });

  return promise;
}

const granted = await requestNotificationPermission();
```

### Object.groupBy() for UI Components

```typescript
import { createSwiftUIBinding } from '@philjs/swift/ios';

interface View {
  id: string;
  type: 'Text' | 'Button' | 'TextField' | 'Image';
  props: Record<string, unknown>;
}

// Group views by type using ES2024 Object.groupBy()
function organizeViews(views: View[]) {
  const grouped = Object.groupBy(views, v => v.type);

  return {
    textViews: grouped.Text ?? [],
    buttonViews: grouped.Button ?? [],
    textFieldViews: grouped.TextField ?? [],
    imageViews: grouped.Image ?? [],
  };
}
```

### Resource Management with `using`

```typescript
import { createSwiftBridge } from '@philjs/swift';

// Automatic cleanup with TypeScript 6 explicit resource management
async function runSwiftCode() {
  await using bridge = await createSwiftBridge({
    module: './swift/Process.swift',
    [Symbol.asyncDispose]: async () => {
      await bridge.cleanup();
      console.log('Swift bridge disposed');
    }
  });

  // Bridge automatically cleaned up when scope exits
  return bridge.invoke('processData', { input: 'test' });
}
```

## CLI

```bash
# Initialize iOS project
philjs-swift init ios my-app

# Initialize macOS project
philjs-swift init macos my-app

# Build Swift module
philjs-swift build ./src/Shared.swift

# Generate TypeScript types from Swift
philjs-swift types ./swift/Models.swift

# Run iOS simulator
philjs-swift ios:run

# Run macOS app
philjs-swift macos:run
```

## API Reference

### iOS

| Function | Description |
|----------|-------------|
| `createIOSApp(config)` | Create iOS app config |
| `createIOSBridge()` | Bridge to iOS APIs |
| `scaffold(path)` | Generate iOS project |

### macOS

| Function | Description |
|----------|-------------|
| `createMacOSApp(config)` | Create macOS app config |
| `createMacOSBridge()` | Bridge to macOS APIs |
| `scaffold(path)` | Generate macOS project |

### SwiftUI

| Function | Description |
|----------|-------------|
| `createSwiftUIBinding(signal, options)` | Bind PhilJS signal to SwiftUI state |
| `generateSwiftUIView(component)` | Generate SwiftUI code |

### Swift Bridge

| Function | Description |
|----------|-------------|
| `createSwiftBridge(config)` | Create Swift bridge |
| `bridge.invoke(fn, args)` | Call Swift function |
| `bridge.create(struct, props)` | Instantiate Swift struct |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./ios, ./macos
- Source files: packages/philjs-swift/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: ./bridge.js, ./codegen.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

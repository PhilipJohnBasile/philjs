# philjs-kotlin

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Kotlin bindings for PhilJS - Android native and Kotlin/JS development.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported
- **Kotlin 2.0+** for Kotlin-side features
- **Android Studio** for Android development

## Installation

```bash
pnpm add @philjs/kotlin
```

## Features

- **Android Integration** - Build Android apps with PhilJS
- **Jetpack Compose** - Reactive UI with Compose interop
- **Kotlin/JS** - Share code between TypeScript and Kotlin
- **KMP Support** - Kotlin Multiplatform compatibility
- **Type Bridge** - Automatic TypeScript <-> Kotlin type conversion

## Quick Start

### Android Setup

```typescript
import { createAndroidApp } from '@philjs/kotlin/android';

const app = createAndroidApp({
  name: 'MyApp',
  packageName: 'com.example.myapp',
  minSdk: 24,
  targetSdk: 34,
});

// Generate Android project
await app.scaffold('./android');
```

### Compose Integration

```typescript
import { createComposeBinding } from '@philjs/kotlin/compose';
import { signal } from '@philjs/core';

const count = signal(0);

// Create Compose-compatible state
const composeState = createComposeBinding(count, {
  name: 'counter',
  type: 'Int',
});

// Generated Kotlin code:
// val counter by mutableStateOf(0)
```

### Kotlin/JS Bridge

```typescript
import { createKotlinBridge } from '@philjs/kotlin';

const bridge = createKotlinBridge({
  module: './kotlin/shared.kt',
  exports: ['calculateSum', 'formatDate', 'UserData'],
});

// Call Kotlin functions from TypeScript
const sum = await bridge.invoke('calculateSum', [1, 2, 3]);
console.log(sum); // 6

// Use Kotlin data classes
const user = await bridge.create('UserData', {
  name: 'John',
  age: 30,
});
```

## ES2024 Features

### Promise.withResolvers() for Android APIs

```typescript
import { createAndroidBridge } from '@philjs/kotlin/android';

const android = createAndroidBridge();

// Wrap callback-based Android APIs with Promise.withResolvers()
function requestPermission(permission: string) {
  const { promise, resolve, reject } = Promise.withResolvers<boolean>();

  android.requestPermission(permission, {
    onGranted: () => resolve(true),
    onDenied: () => resolve(false),
    onError: (error) => reject(error),
  });

  return promise;
}

const granted = await requestPermission('android.permission.CAMERA');
```

### Object.groupBy() for UI Components

```typescript
import { createComposeBinding } from '@philjs/kotlin/compose';

interface Component {
  id: string;
  type: 'text' | 'button' | 'input';
  props: Record<string, unknown>;
}

// Group components by type using ES2024 Object.groupBy()
function organizeComponents(components: Component[]) {
  const grouped = Object.groupBy(components, c => c.type);

  return {
    textComponents: grouped.text ?? [],
    buttonComponents: grouped.button ?? [],
    inputComponents: grouped.input ?? [],
  };
}
```

### Resource Management with `using`

```typescript
import { createKotlinBridge } from '@philjs/kotlin';

// Automatic cleanup with TypeScript 6 explicit resource management
async function runKotlinCode() {
  await using bridge = await createKotlinBridge({
    module: './kotlin/process.kt',
    [Symbol.asyncDispose]: async () => {
      await bridge.cleanup();
      console.log('Kotlin bridge disposed');
    }
  });

  // Bridge automatically cleaned up when scope exits
  return bridge.invoke('processData', { input: 'test' });
}
```

## CLI

```bash
# Initialize Android project
philjs-kotlin init android my-app

# Build Kotlin/JS module
philjs-kotlin build ./src/shared.kt

# Generate TypeScript types from Kotlin
philjs-kotlin types ./kotlin/models.kt

# Run Android emulator
philjs-kotlin android:run
```

## API Reference

### Android

| Function | Description |
|----------|-------------|
| `createAndroidApp(config)` | Create Android app config |
| `createAndroidBridge()` | Bridge to Android APIs |
| `scaffold(path)` | Generate Android project |

### Compose

| Function | Description |
|----------|-------------|
| `createComposeBinding(signal, options)` | Bind PhilJS signal to Compose state |
| `generateComposable(component)` | Generate Compose UI code |

### Kotlin/JS

| Function | Description |
|----------|-------------|
| `createKotlinBridge(config)` | Create Kotlin/JS bridge |
| `bridge.invoke(fn, args)` | Call Kotlin function |
| `bridge.create(class, props)` | Instantiate Kotlin class |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./android, ./compose
- Source files: packages/philjs-kotlin/src/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: ./bridge.js, ./codegen.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT

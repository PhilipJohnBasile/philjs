# Native App Development

**Building iOS and Android apps with PhilJS signals and components.**

While `@philjs/mobile` focuses on mobile-web experiences (PWA), the `@philjs/native` package allows you to build truly native applications using the same familiar signal-based architecture.

Under the hood, `@philjs/native` can leverage either **Capacitor** (for web-first native) or a **Custom Renderer** (similar to React Native) for purely native UI.

## The Universal Promise

With PhilJS, you can share **100% of your business logic** (Nexus, State, AI, Auth) between your Web, Desktop, and Mobile applications.

```typescript
// valid in Web, Desktop, and Mobile
const store = new NexusStore('todos');
const todos = store.query(t => !t.done);
```

## Strategy 1: The Hybrid Nexus (Recommended)

The most popular way to build mobile apps with PhilJS is using the **Hybrid Nexus** approach (powered by Capacitor or Tauri Mobile).

*   **UI**: Rendered via Web view (DOM/Canvas/WebGPU).
*   **Native Access**: Plugins for Camera, Geolocation, Haptics.
*   **Performance**: Uses PhilJS's resumbility to retain 60fps even in a WebView.

### Quick Start

```bash
pnpm add @philjs/native @capacitor/core
pnpm dlx cap init
```

```typescript
// src/mobile-entry.ts
import { App } from '@capacitor/app';
import { Camera } from '@capacitor/camera';
import { createSignal } from '@philjs/core';

export function MobileCamera() {
  const image = createSignal<string | null>(null);

  const takePhoto = async () => {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: 'base64'
    });
    image.set(photo.base64String);
  };

  return (
    <div className="mobile-view">
      <button onTap={takePhoto}>Open Camera</button>
      {image() && <img src={`data:image/jpeg;base64,${image()}`} />}
    </div>
  );
}
```

## Strategy 2: PhilJS Native (Experimental)

For performance-critical screens, PhilJS provides an experimental custom renderer that maps Signals directly to native UI widgets (SwiftUI / Jetpack Compose / UIKit), bypassing the DOM entirely.

> **Note**: This is significantly more complex and has limited CSS support.

```typescript
import { View, Text, StyleSheet } from '@philjs/native-ui';

export function NativeCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>True Native Text</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4
  }
});
```

## Native Navigation

Dealing with the "Back" button and native stack navigation is handled by `@philjs/router`'s native adapter.

```typescript
import { NativeRouter, Stack } from '@philjs/router/native';

export function App() {
  return (
    <NativeRouter>
      <Stack>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Details" component={Details} />
      </Stack>
    </NativeRouter>
  );
}
```

## Accessing Device Features

`@philjs/native` provides signal-wrapped hooks for common device sensors.

### Geolocation Signal

```typescript
import { useGeolocation } from '@philjs/native';

function Tracker() {
  // Automatically updates when position changes
  const { coords, error } = useGeolocation({ enableHighAccuracy: true });

  return (
    <Text>
      Lat: {coords()?.latitude}, Lng: {coords()?.longitude}
    </Text>
  );
}
```

### Haptics

```typescript
import { Haptics } from '@philjs/native';

function Button() {
  return (
    <button 
      onClick$={() => {
        Haptics.impact({ style: 'medium' });
        save();
      }}
    >
      Save
    </button>
  );
}
```

## Building & Deploying

PhilJS integrates with **EAS** (Expo Application Services) or standard Xcode/Android Studio builds.

```bash
# Build native bundles
pnpm philjs build:ios
pnpm philjs build:android

# Open in Xcode
pnpm philjs open ios
```

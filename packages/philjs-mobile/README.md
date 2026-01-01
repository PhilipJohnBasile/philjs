# @philjs/mobile

React Native and mobile support for PhilJS applications. Share components and logic between web and mobile with platform-specific adaptations.

## Installation

```bash
npm install @philjs/mobile
# or
yarn add @philjs/mobile
# or
pnpm add @philjs/mobile
```

## Basic Usage

```tsx
import { View, Text, Button, useResponsive } from '@philjs/mobile';

function App() {
  const { isMobile, isTablet } = useResponsive();

  return (
    <View style={{ padding: isMobile ? 16 : 32 }}>
      <Text variant="heading">Welcome</Text>
      <Button onPress={() => console.log('Pressed!')}>
        Get Started
      </Button>
    </View>
  );
}
```

## Features

- **Cross-Platform Components** - Write once, run on web and native
- **Platform Adapters** - Automatic platform-specific styling
- **Navigation** - Unified navigation for web and mobile
- **Gestures** - Touch gestures and animations
- **Device APIs** - Camera, location, notifications
- **Offline Storage** - AsyncStorage and SQLite support
- **Push Notifications** - FCM and APNs integration
- **Deep Linking** - Handle deep links and universal links
- **Responsive Design** - Adapt layouts for different screens
- **Native Modules** - Easy integration with native code
- **Hot Reloading** - Fast refresh during development
- **Over-the-Air Updates** - Deploy updates without app store

## Components

| Component | Description |
|-----------|-------------|
| `View` | Cross-platform container |
| `Text` | Typography component |
| `Button` | Touchable button |
| `Image` | Responsive images |
| `Input` | Text input field |
| `ScrollView` | Scrollable container |
| `FlatList` | Optimized list |
| `Modal` | Modal dialogs |

## Hooks

| Hook | Description |
|------|-------------|
| `useResponsive` | Screen size detection |
| `usePlatform` | Current platform info |
| `useKeyboard` | Keyboard visibility |
| `useAppState` | App foreground/background |
| `useDeviceInfo` | Device information |

## Platform Detection

```tsx
import { Platform } from '@philjs/mobile';

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
} else {
  // Web code
}
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Source files: packages/philjs-mobile/src/lib.rs

### Public API
- Public modules: android, animation, biometrics, camera, components, gestures, haptics, in_app_purchase, ios, location, navigation, notifications, permissions, platform, prelude, renderer, runtime, sensors, share, storage
- Public items: AppState, BLACK, BLUE, Color, Constraints, EdgeInsets, FontWeight, GREEN, IntoView, KeyboardType, NativeComponent, NativeView, Orientation, Point, RED, Rect, SafeArea, Size, TRANSPARENT, TextAlign, WHITE, all, fn, from_hex, from_origin_size, horizontal, loose, new, run, run_with_config, symmetric, tight, unbounded, vertical, zero
- Re-exports: animation::{AnimatedValue, SpringAnimation, TimingAnimation}, components::*, gestures::{GestureRecognizer, Gesture, GestureState}, haptics::{HapticFeedback, HapticStyle}, navigation::{Navigator, Route, NavigationStack}, notifications::{LocalNotification, PushNotification, NotificationHandler}, permissions::{Permission, PermissionStatus, request_permission}, platform::{Platform, PlatformInfo, DeviceInfo}, renderer::{NativeRenderer, RenderContext}, runtime::{MobileApp, MobileConfig, run, run_with_config}, storage::{SecureStorage, AsyncStorage, FileSystem}
<!-- API_SNAPSHOT_END -->

## License

MIT

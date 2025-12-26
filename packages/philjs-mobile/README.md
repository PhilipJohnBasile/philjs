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

## License

MIT

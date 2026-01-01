# PhilJS Native

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Cross-platform mobile development for PhilJS. Build native iOS, Android, and Web apps with one codebase.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add philjs-native philjs-core
```

## Quick Start

Create a new PhilJS Native project:

```bash
npx philjs-native init my-app
cd my-app
npm install
npm start
```

## Features

- **Cross-Platform**: Write once, run on iOS, Android, and Web
- **Native Performance**: Native components for each platform
- **Familiar API**: Similar to React Native for easy adoption
- **Type-Safe**: Full TypeScript support
- **Signal-Based**: Reactive primitives from philjs-core

## Core Concepts

### Creating an App

```tsx
import {
  createNativeApp,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'philjs-native';

function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Hello, PhilJS Native!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

const app = createNativeApp({
  root: App,
});

app.render();
```

## Components

### Core Components

- **View** - Basic container with flexbox layout
- **Text** - Text display with styling
- **Image** - Image display with native optimization
- **ScrollView** - Scrollable container
- **FlatList** - Virtualized list for large datasets
- **TouchableOpacity** - Touch feedback with opacity
- **Pressable** - Modern touch handling
- **TextInput** - Text input field
- **Button** - Native button

### Layout Components

- **SafeAreaView** - Safe area handling for notches
- **StatusBar** - Status bar control

### Example: Building a List

```tsx
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'philjs-native';

const data = [
  { id: '1', title: 'Item 1' },
  { id: '2', title: 'Item 2' },
  { id: '3', title: 'Item 3' },
];

function MyList() {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => console.log('Pressed', item.title)}
        >
          <Text>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
```

## Navigation

### Stack Navigator

```tsx
import { createNativeRouter, useNativeNavigation } from 'philjs-native';

const { Navigator, navigation } = createNativeRouter({
  screens: [
    { name: 'Home', component: HomeScreen },
    { name: 'Profile', component: ProfileScreen },
  ],
  options: {
    initialRouteName: 'Home',
  },
});

function HomeScreen() {
  return (
    <View>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile', { userId: 123 })}
      />
    </View>
  );
}
```

### Tab Navigator

```tsx
import { createNativeTabs } from 'philjs-native';

const Tabs = createNativeTabs({
  tabBarPosition: 'bottom',
  tabBarActiveTintColor: '#007AFF',
});

function App() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}
```

### Navigation Hooks

```tsx
import { useNativeNavigation, useRoute, useFocusEffect } from 'philjs-native';

function ProfileScreen() {
  const navigation = useNativeNavigation();
  const route = useRoute();

  useFocusEffect(() => {
    console.log('Screen focused');
    return () => console.log('Screen unfocused');
  });

  return (
    <View>
      <Text>User ID: {route.params?.userId}</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}
```

## Native APIs

### Camera

```tsx
import { Camera } from 'philjs-native';

// Request permission
const status = await Camera.requestPermission();

// Take a photo
const photo = await Camera.takePicture({
  quality: 0.8,
  base64: true,
});

// Pick from library
const image = await Camera.pickImage({
  allowsEditing: true,
  aspect: [4, 3],
});
```

### Geolocation

```tsx
import { Geolocation, useLocation } from 'philjs-native';

// Get current position
const location = await Geolocation.getCurrentPosition({
  accuracy: 'high',
});

// Watch position
const unsubscribe = Geolocation.watchPosition(
  (location) => console.log(location),
  (error) => console.error(error),
  { accuracy: 'balanced' }
);

// Use hook
function LocationComponent() {
  const { location, error, loading } = useLocation();

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return <Text>Lat: {location?.coords.latitude}</Text>;
}
```

### Storage

```tsx
import { Storage, useStorage, getJSON, setJSON } from 'philjs-native';

// Basic operations
await Storage.setItem('key', 'value');
const value = await Storage.getItem('key');
await Storage.removeItem('key');

// JSON helpers
await setJSON('user', { name: 'John', age: 30 });
const user = await getJSON('user');

// Reactive storage hook
function SettingsScreen() {
  const [theme, setTheme] = useStorage('theme', 'light');

  return (
    <Button
      title={`Switch to ${theme() === 'light' ? 'dark' : 'light'}`}
      onPress={() => setTheme(theme() === 'light' ? 'dark' : 'light')}
    />
  );
}
```

### Haptics

```tsx
import { Haptics, impactMedium, notifySuccess } from 'philjs-native';

// Impact feedback
await Haptics.impact('medium');

// Notification feedback
await Haptics.notification('success');

// Selection feedback
await Haptics.selection();

// Convenience functions
await impactMedium();
await notifySuccess();
```

### Notifications

```tsx
import { Notifications, useNotificationReceived } from 'philjs-native';

// Request permission
const status = await Notifications.requestPermission();

// Schedule local notification
const id = await Notifications.scheduleNotification(
  {
    title: 'Reminder',
    body: 'Check your tasks!',
    data: { screen: 'Tasks' },
  },
  { type: 'timeInterval', seconds: 60 }
);

// Listen for notifications
useNotificationReceived((notification) => {
  console.log('Received:', notification);
});
```

### Biometrics

```tsx
import { Biometrics, useBiometrics } from 'philjs-native';

// Check availability
const support = await Biometrics.isAvailable();
if (support.available) {
  console.log('Biometry type:', support.biometryType);
}

// Authenticate
const result = await Biometrics.authenticate({
  promptMessage: 'Verify your identity',
});

if (result.success) {
  // Authenticated
}

// Secure storage
await Biometrics.secureStore('secret', 'myPassword');
const secret = await Biometrics.secureRetrieve('secret');
```

### Clipboard

```tsx
import { Clipboard, useClipboard } from 'philjs-native';

// Copy/paste
await Clipboard.setString('Hello!');
const text = await Clipboard.getString();

// Hook
function CopyButton() {
  const { copy, paste, content } = useClipboard();

  return (
    <View>
      <Button title="Copy" onPress={() => copy('Copied text')} />
      <Text>Clipboard: {content}</Text>
    </View>
  );
}
```

### Share

```tsx
import { Share } from 'philjs-native';

// Share content
const result = await Share.share({
  title: 'Check this out',
  message: 'Amazing content!',
  url: 'https://example.com',
});

// Share to specific app
await Share.social.twitter({ message: 'Hello Twitter!' });
await Share.social.whatsapp({ message: 'Hello WhatsApp!' });
```

## Styling

### StyleSheet

```tsx
import { StyleSheet, platformStyles } from 'philjs-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  // Platform-specific styles
  shadow: platformStyles({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
});
```

### Theming

```tsx
import {
  useTheme,
  useThemedStyles,
  useColorScheme,
  setTheme,
  lightTheme,
  darkTheme,
} from 'philjs-native';

function App() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  // Auto dark mode
  useEffect(() => {
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello!</Text>
    </View>
  );
}

// Themed styles
function ThemedComponent() {
  const styles = useThemedStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    text: {
      ...theme.typography.body1,
      color: theme.colors.text,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Themed content</Text>
    </View>
  );
}
```

### Responsive Design

```tsx
import { responsive, currentBreakpoint, breakpoints } from 'philjs-native';

function ResponsiveComponent() {
  const padding = responsive({
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
  });

  const columns = responsive({
    xs: 1,
    md: 2,
    lg: 3,
  });

  return (
    <View style={{ padding, flexDirection: 'row', flexWrap: 'wrap' }}>
      {/* Items with responsive columns */}
    </View>
  );
}
```

## CLI Commands

```bash
# Create new project
philjs-native init my-app

# Start dev server
philjs-native start

# Run on platform
philjs-native run ios
philjs-native run android
philjs-native run web

# Build for production
philjs-native build --platform ios
philjs-native build --platform android
philjs-native build --platform web

# Add platform
philjs-native add ios
philjs-native add android

# Check environment
philjs-native doctor

# Upgrade
philjs-native upgrade
```

## Platform Detection

```tsx
import {
  detectPlatform,
  getPlatformInfo,
  platformSelect,
  onPlatform,
} from 'philjs-native';

// Get current platform
const platform = detectPlatform(); // 'ios' | 'android' | 'web'

// Platform-specific values
const fontSize = platformSelect({
  ios: 17,
  android: 16,
  web: 16,
  default: 16,
});

// Platform-specific code
onPlatform({
  ios: () => console.log('Running on iOS'),
  android: () => console.log('Running on Android'),
  web: () => console.log('Running on Web'),
});

// Detailed platform info
const info = getPlatformInfo();
console.log(info.deviceType); // 'phone' | 'tablet' | 'desktop'
console.log(info.colorScheme); // 'light' | 'dark'
```

## TypeScript

PhilJS Native is fully typed. Import types as needed:

```tsx
import type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  Platform,
  PlatformInfo,
  Navigation,
  Route,
  Theme,
} from 'philjs-native';
```

## Migration from React Native

PhilJS Native uses a similar API to React Native, making migration straightforward:

| React Native | PhilJS Native |
|--------------|---------------|
| `react-native` | `philjs-native` |
| `@react-navigation/native` | `philjs-native` (built-in) |
| `react-native-gesture-handler` | Built-in |
| `AsyncStorage` | `Storage` |
| `expo-camera` | `Camera` |
| `expo-location` | `Geolocation` |
| `expo-haptics` | `Haptics` |
| `expo-notifications` | `Notifications` |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./runtime, ./components, ./navigation, ./capacitor, ./tauri, ./gestures
- Source files: packages/philjs-native/src/index.ts, packages/philjs-native/src/runtime.ts, packages/philjs-native/src/components/index.ts, packages/philjs-native/src/navigation.ts, packages/philjs-native/src/capacitor/index.ts, packages/philjs-native/src/tauri/index.ts, packages/philjs-native/src/gestures/index.ts

### Public API
- Direct exports: AppLifecycleEvents, AppState, BaseGestureEvent, CapacitorConfig, CapacitorPlugin, CapacitorStatusBar, DeviceInfo, Dimensions, EventHandle, GestureConfig, GestureHandlerOptions, GestureState, InvokeOptions, LifecycleEvent, Link, LinkProps, LongPressGestureConfig, LongPressGestureEvent, NativeApp, NativeAppConfig, NativeBridge, NativeBridgeMessage, NativeBridgeResponse, NativeComponentConfig, NativeStack, NativeTabs, Navigation, NavigationOptions, NavigationState, PanGestureConfig, PanGestureEvent, PinchGestureConfig, PinchGestureEvent, Platform, PlatformInfo, PluginBridge, PluginMessage, PluginResponse, Point, RotationGestureEvent, Route, RouterConfig, ScreenAnimation, ScreenDefinition, ScreenOptions, ScreenPresentation, Signal, SplashScreen, StackNavigatorOptions, SwipeDirection, SwipeGestureConfig, SwipeGestureEvent, TabNavigatorOptions, TapGestureConfig, TapGestureEvent, TauriConfig, TauriEvent, Velocity, WindowOptions, addLifecycleListener, appName, appState, appVersion, callPlugin, centerWindow, closeWindow, createCommand, createGestureHandler, createLongPressGesture, createNativeApp, createNativeRouter, createNativeStack, createNativeTabs, createPanGesture, createPinchGesture, createRotationGesture, createSwipeGesture, createTapGesture, createWindow, currentWindowLabel, detectPlatform, dimensions, emit, exitApp, getAllWindows, getAngle, getAppInfo, getAppName, getAppVersion, getCapacitor, getCapacitorPlatform, getCenter, getCurrentWindow, getDeviceInfo, getDimensions, getDistance, getLaunchUrl, getNativeComponent, getPlatformInfo, getPlugin, getRegisteredComponents, getTauriInternals, getTauriInvoke, getTauriVersion, getVelocity, hasNativeComponent, hasPlugin, hasTauriAPI, hideApp, initCapacitor, initTauri, invoke, invokeSafe, isCapacitor, isNativePlatform, isTauri, listen, maximizeWindow, minimizeWindow, nativeBridge, navigationState, onPlatform, once, openUrl, platformInfo, platformSelect, pluginBridge, registerNativeComponent, registerPlugin, restartApp, setAlwaysOnTop, setFullscreen, setPosition, setSize, setTitle, showApp, tauriVersion, toggleMaximize, unmaximizeWindow, useAppState, useBackButton, useFocusEffect, useGestures, useIsFocused, useLongPressGesture, useNativeNavigation, useOnPause, useOnResume, usePanGesture, usePinchGesture, useRoute, useSwipeGesture, useTapGesture, windowFocused, windowFullscreen, windowMaximized, windowMinimized
- Re-exported names: // ActivityIndicator
  ActivityIndicatorProps, // Additional
  ActivityIndicator, // App
  createNativeApp, // Biometrics
  BiometricType, // Biometrics
  Biometrics, // Button
  ButtonProps, // Camera
  Camera, // Camera
  CameraType, // Clipboard
  Clipboard, // Clipboard
  ClipboardContentType, // Color Scheme
  colorScheme, // Common
  commonStyles, // Components
  Link, // Core
  View, // FlatList
  FlatListProps, // Geolocation
  Geolocation, // Geolocation
  LocationPermissionStatus, // Haptics
  Haptics, // Haptics
  ImpactStyle, // Hooks
  useNativeNavigation, // Image
  ImageProps, // Input
  TextInput, // Input
  TextInputProps, // Layout
  SafeAreaView, // Native Bridge
  NativeBridge, // Notifications
  NotificationPermissionStatus, // Notifications
  Notifications, // Platform
  detectPlatform, // Platform Styles
  platformStyles, // Responsive
  breakpoints, // Router
  createNativeRouter, // SafeArea
  SafeAreaViewProps, // ScrollView
  ScrollViewProps, // Scrolling
  ScrollView, // Share
  Share, // Share
  ShareContent, // Spring
  Spring, // Stack
  createNativeStack, // StatusBar
  StatusBarProps, // Storage
  Storage, // Storage
  StorageOptions, // Style Types
  FlexAlignType, // StyleSheet
  StyleSheet, // Styles
  ViewStyle, // Tabs
  createNativeTabs, // Text
  TextProps, // Theme
  ThemeColors, // Theme
  lightTheme, // Touch
  TouchableOpacity, // Touch
  TouchableOpacityProps, // Transitions
  Transitions, // View
  ViewProps, AccessibilityRole, ActivityIndicator, ActivityIndicatorProps, ActivityIndicatorSize, AdvancedNavigationState, AdvancedScreenOptions, AdvancedStackNavigatorOptions, AdvancedTabNavigatorOptions, Animated, AnimatedInterpolation, AnimatedValue, AnimatedValueXY, AnimationConfig, AnimationResult, AppLifecycleEvents, AppState, AppStateInfo, AppStateType, Appearance, AppearanceChangeHandler, AppearancePreferences, AuthenticationOptions, AuthenticationResult, AutoCapitalize, BaseGestureEvent, BatchCallEntry, BatteryStatus, BatteryThreshold, BiometricSupport, BorderStyle, Bridge, Button, ButtonProps, CameraPermissionStatus, CameraProps, ChainConfig, ClipboardContent, ColorScheme, ColorSchemeName, ColorValue, CompositeAnimation, ConnectionType, DateComponents, DecayConfig, DeepLinkConfig, DevMenuItem, DevMenuOptions, DevTools, DeviceInfo, DeviceInfoType, DimensionChangeHandler, DimensionMetrics, DimensionValue, Dimensions, DimensionsData, DismissKeyboard, DismissKeyboardProps, Display, DrawerNavigatorOptions, Easing, EffectiveConnectionType, EventSubscription, FlashMode, FlatList, FlatListProps, FlatListRef, FlexDirection, FlexJustifyType, FlexWrap, FontWeight, FrameTiming, GeocodingResult, GestureConfig, GestureHandlerOptions, GestureResponderEvent, GestureSpringConfig, GestureSpringController, GestureState, HMRConfig, HeadingResult, HotReloadStatus, Image, ImageErrorEvent, ImageLoadEvent, ImagePriority, ImageProgressEvent, ImageProps, ImageSource, ImageStyle, InterpolationConfig, JSIBinding, Keyboard, KeyboardAvoidingView, KeyboardAvoidingViewProps, KeyboardBehavior, KeyboardDismissMode, KeyboardInfo, KeyboardType, LayoutEvent, LazyModule, LinkProps, ListRenderItemInfo, LocationAccuracy, LocationCoordinates, LocationOptions, LocationRegion, LocationResult, LogLevel, LongPressGestureConfig, LongPressGestureEvent, MMKVStorage, MemoryInfo, MemoryWarning, MemoryWarningLevel, ModuleUpdate, MultiGetResult, MultiSetInput, NamedStyles, NativeApp, NativeAppConfig, NativeBridgeMessage, NativeBridgeResponse, NativeCallback, NativeComponentConfig, NativeEventEmitter, NativeModule, NativeStack, NativeStyle, NativeTabs, Navigation, NavigationAction, NavigationAnimation, NavigationEvent, NavigationObject, NavigationOptions, NavigationRoute, NavigationState, NetworkStatus, NotificationAction, NotificationActionOptions, NotificationAttachment, NotificationCategory, NotificationCategoryOptions, NotificationContent, NotificationResponse, NotificationTrigger, NotificationType, OrientationBreakpoint, OrientationInfo, OrientationLockType, OrientationType, Overflow, PanGestureConfig, PanGestureEvent, Performance, PerformanceEntry, PerformanceMark, PerformanceMeasure, PermissionGroups, PermissionRationale, PermissionResult, PermissionStatus, PermissionType, Permissions, PermissionsResult, PhotoOptions, PhotoResult, PinchGestureConfig, PinchGestureEvent, Platform, PlatformConstants, PlatformInfo, PlatformOS, PlatformSelectSpecifics, PlatformStatic, Point, PointerEvents, PositionType, PresentationStyle, Pressable, PressableProps, PullToRefreshConfig, PushToken, RefreshControl, RefreshControlProps, RefreshIndicator, RefreshIndicatorProps, RefreshState, ResizeMode, ReturnKeyType, RotationGestureEvent, Route, RouteParams, RouterConfig, SafeAreaEdge, SafeAreaInsets, SafeAreaProvider, SafeAreaProviderProps, SafeAreaView, SafeAreaViewProps, ScheduledNotification, Screen, ScreenAnimation, ScreenDefinition, ScreenOptions, ScreenPresentation, ScreenProps, ScreenTransitionConfig, ScrollEvent, ScrollIndicatorInsets, ScrollView, ScrollViewProps, ScrollViewRef, SecureStorage, SecureStoreOptions, ShareFileContent, ShareOptions, ShareResult, Spring2DController, Spring2DState, SpringConfig, SpringController, SpringPhysicsConfig, SpringPresets, SpringState, StackNavigatorOptions, StatusBar, StatusBarAnimation, StatusBarProps, StatusBarStyle, StyleProp, SwipeDirection, SwipeGestureConfig, SwipeGestureEvent, Switch, SwitchProps, SystemColors, TabNavigatorOptions, TapGestureConfig, TapGestureEvent, Text, TextAlign, TextContentType, TextDecorationLine, TextInput, TextInputChangeEvent, TextInputContentSizeChangeEvent, TextInputFocusEvent, TextInputKeyPressEvent, TextInputProps, TextInputRef, TextInputSelection, TextInputSelectionChangeEvent, TextLayoutEvent, TextLine, TextProps, TextStyle, Theme, ThemeSpacing, ThemeTypography, Touch, TouchEvent, TouchableHighlight, TouchableHighlightProps, TouchableOpacity, TouchableOpacityProps, TouchableWithoutFeedback, Transform, TransformTransition, TransformValues, TransitionConfig, TurboModuleSpec, Velocity, VideoOptions, VideoResult, View, ViewProps, ViewToken, ViewabilityConfig, VirtualizationConfig, VirtualizedRange, add, addAppStateListener, addBackgroundListener, addForegroundListener, addNetworkListener, appStateInfo, appearanceColorScheme, batchNativeCalls, batteryStatus, biometricSupport, bottomSheet, breakpoint, buildPath, calculateVirtualizedRange, callNativeMethod, callNativeMethodWithCallback, canRequest, chainTransitions, checkGroup, checkMultiplePermissions, checkPermission, clearDevCache, clearPerformanceData, clipboardContent, colorForScheme, createAdvancedNativeStack, createAdvancedNativeTabs, createAnimatedComponent, createDrawerNavigator, createEventHooks, createFlatListRef, createGestureHandler, createGestureSpring, createInteractionHandle, createLongPressGesture, createNativeDrawer, createNativeEventEmitter, createNativeModuleWrapper, createPanGesture, createPinchGesture, createRotationGesture, createScreenTransition, createScrollViewRef, createSpring, createSpring2D, createSpringChain, createStackNavigator, createSwipeGesture, createTabNavigator, createTapGesture, createTextInputRef, createTransition, createVirtualizedList, currentBreakpoint, currentLocation, currentTheme, darkTheme, debounce, decay, defaultBreakpoints, devLog, devModeEnabled, deviceError, deviceInfo, deviceLoading, deviceOrientation, deviceType, diffClamp, dimensions, dispatchViewCommand, divide, durations, dynamicColor, easings, endBatch, event, executeNative, fade, fadeIn, fadeOut, fadeQuick, findNodeHandle, flipInX, flipInY, formatDuration, getAngle, getAppState, getAspectRatio, getBatteryCategory, getBatteryColor, getBatteryStatus, getBatteryStatusText, getBreakpoint, getCenter, getConnectionQuality, getDeviceInfoSync, getDeviceOrientation, getDeviceType, getDimensions, getDistance, getFontScaleValue, getFrameStats, getJSON, getMeasures, getMemoryInfo, getNativeComponent, getNativeConstants, getNativeModule, getNetworkStatus, getOrientation, getOrientationBreakpoint, getPixelRatio, getPlatformInfo, getPowerSavingRecommendations, getRegisteredComponents, getTimeRemaining, getTimeSinceActive, getTotalActiveTime, getTotalBackgroundTime, getTurboModule, getVelocity, hasNativeComponent, hasTouchScreen, hideDevMenu, hideErrorOverlay, hidePerformanceMonitor, highContrast, hotReloadStatus, impactHeavy, impactLight, impactMedium, initHMR, installJSIBinding, isAndroid, isAndroidDevice, isBatterySupported, isBlocked, isBreakpointDown, isBreakpointUp, isDarkMode, isDesktop, isDevelopment, isGranted, isIOS, isIOSDevice, isLandscape, isModuleAvailable, isNative, isPortrait, isProduction, isSquareScreen, isUnavailable, isWeb, isWebDevice, keyboardState, lastUpdatedModules, lazy, locationError, locationPermission, lockOrientation, lockToLandscape, lockToPortrait, loop, mark, materialSharedAxis, measure, measureView, memoize, memoryPressure, memoryWarning, modalDismiss, modalPresent, modulo, multiply, nativeBridge, navigationState, networkStatus, notificationPermission, notifyError, notifySuccess, notifyWarning, onPlatform, openSettings, orientation, parallel, parseRoute, pixelRatio, platformInfo, platformOS, platformSelect, platformVersion, popIn, preload, preloadImage, preloadImages, promisifyNativeMethod, pushToken, reducedMotion, refreshBattery, refreshNetworkStatus, registerDevMenuItem, registerNativeComponent, registerNativeModule, requestGroup, requestMultiplePermissions, requestPermission, resetColorScheme, responsive, reverseTransition, rotateIn, rotateOut, roundToNearestPixel, runAfterInteractions, safeAreaInsets, scaleIn, scaleOut, scheduleAnimationFrame, scheduleIdleCallback, scheduleUpdate, screenDimensions, screenFade, selectionFeedback, sequence, setJSON, setTheme, setupDeepLinking, setupDevKeyboardShortcuts, shouldSaveData, shouldSavePower, showDevMenu, showPerformanceMonitor, slideInDown, slideInLeft, slideInRight, slideInUp, slideOutDown, slideOutLeft, slideOutRight, slideOutUp, spring, springConfigs, stackPop, stackPush, stagger, startBatch, startFrameMonitor, startMemoryMonitor, subtract, supportsNetworkInformation, supportsOrientationLock, throttle, timing, toggleColorScheme, toggleInspector, unlockOrientation, updateJSON, useAppState, useAppStateEffect, useAppStateType, useAppearance, useBattery, useBatteryLevel, useBatteryPercentage, useBatteryThreshold, useBiometrics, useBreakpoint, useClipboard, useColorScheme, useConnectionType, useDevice, useDeviceOrientation, useDevicePlatform, useDeviceProperty, useDeviceType, useDimensions, useFocusEffect, useFontScale, useGestures, useHighContrast, useIsActive, useIsBackground, useIsCharging, useIsDarkMode, useIsDesktopDevice, useIsDeviceType, useIsFocused, useIsLandscape, useIsLowBattery, useIsMobile, useIsOffline, useIsOnline, useIsPlatform, useIsPortrait, useKeyboard, useKeyboardEffect, useLocation, useLongPressGesture, useMemoryWarning, useNavigation, useNavigationFocusEffect, useNavigationIsFocused, useNavigationRoute, useNetwork, useNetworkChange, useNotificationReceived, useNotificationResponse, useOnAppStateChange, useOnBackground, useOnChargingChange, useOnCriticalBattery, useOnForeground, useOnMemoryWarning, useOnOffline, useOnOnline, useOrientation, useOrientationAngle, useOrientationBreakpoint, useOrientationEffect, useOrientationForScreen, useOrientationLock, usePanGesture, usePermission, usePermissions, usePinchGesture, usePixelRatio, usePlatform, usePlatformColorScheme, usePlatformValue, usePullToRefresh, useReducedMotion, useRefresh, useRoute, useSafeAreaFrame, useSafeAreaInsets, useScreenDimensions, useSpring, useSpring2D, useStorage, useSwipeGesture, useSwitchState, useTapGesture, useTheme, useThemedStyles, useWatchLocation, useWindowDimensions, wasRecentlyBackgrounded, windowDimensions, zoomIn, zoomOut
- Re-exported modules: ./ActivityIndicator.js, ./Button.js, ./FlatList.js, ./Image.js, ./KeyboardAvoidingView.js, ./RefreshControl.js, ./SafeAreaView.js, ./ScrollView.js, ./StatusBar.js, ./Switch.js, ./Text.js, ./TextInput.js, ./TouchableOpacity.js, ./View.js, ./animations/index.js, ./apis/Permissions.js, ./apis/index.js, ./bridge/index.js, ./commands.js, ./components/KeyboardAvoidingView.js, ./components/RefreshControl.js, ./components/Switch.js, ./components/index.js, ./devtools/index.js, ./dialog.js, ./events.js, ./fs.js, ./gestures/index.js, ./hooks/index.js, ./navigation.js, ./navigation/index.js, ./performance/index.js, ./platform/index.js, ./plugins/index.js, ./runtime.js, ./styles.js, ./window.js
<!-- API_SNAPSHOT_END -->

## License

MIT

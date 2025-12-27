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

## License

MIT

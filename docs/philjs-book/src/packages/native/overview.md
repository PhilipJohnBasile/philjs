# @philjs/native - Cross-Platform Mobile

**Build native iOS, Android, and Web apps with one PhilJS codebase.**

@philjs/native provides React Native-compatible components, navigation, platform APIs, gestures, animations, and hooks for building truly cross-platform applications that feel native on every platform.

## Installation

```bash
npm install @philjs/native
```

## Quick Start

```typescript
import {
  View,
  Text,
  Button,
  StyleSheet,
  createNativeStack,
  useNativeNavigation,
} from '@philjs/native';

function HomeScreen() {
  const navigation = useNativeNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to PhilJS Native</Text>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

## Core Components

### View

The fundamental container component:

```typescript
import { View } from '@philjs/native';

<View
  style={{
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  }}
  accessibilityRole="button"
  accessibilityLabel="Container"
  onLayout={(event) => console.log(event.nativeEvent.layout)}
  onTouchStart={(event) => console.log('Touch started')}
  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
>
  {children}
</View>
```

### Text

Display text with styling:

```typescript
import { Text } from '@philjs/native';

<Text
  style={{
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  }}
  numberOfLines={2}
  ellipsizeMode="tail"
  selectable
>
  Hello, World!
</Text>
```

### Image

Display images with loading states:

```typescript
import { Image } from '@philjs/native';

<Image
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ width: 200, height: 200, borderRadius: 100 }}
  resizeMode="cover"
  onLoad={() => console.log('Loaded')}
  onError={(error) => console.error('Failed to load')}
  onProgress={(event) => console.log(event.nativeEvent.loaded)}
  fadeDuration={300}
/>

// Local image
<Image source={require('./logo.png')} style={{ width: 100, height: 100 }} />
```

### ScrollView

Scrollable container:

```typescript
import { ScrollView, createScrollViewRef } from '@philjs/native';

const scrollRef = createScrollViewRef();

<ScrollView
  ref={scrollRef}
  horizontal={false}
  showsVerticalScrollIndicator
  contentContainerStyle={{ padding: 16 }}
  onScroll={(event) => console.log(event.nativeEvent.contentOffset)}
  scrollEventThrottle={16}
  keyboardDismissMode="on-drag"
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
>
  {content}
</ScrollView>

// Scroll to position
scrollRef.current?.scrollTo({ x: 0, y: 100, animated: true });
scrollRef.current?.scrollToEnd({ animated: true });
```

### FlatList

Optimized list for large datasets:

```typescript
import { FlatList, createFlatListRef } from '@philjs/native';

const flatListRef = createFlatListRef();

<FlatList
  ref={flatListRef}
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item, index }) => <ItemCard item={item} />}
  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
  ListHeaderComponent={() => <Header />}
  ListFooterComponent={() => <Footer />}
  ListEmptyComponent={() => <EmptyState />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  onViewableItemsChanged={({ viewableItems }) => console.log(viewableItems)}
  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
  getItemLayout={(data, index) => ({
    length: 80,
    offset: 80 * index,
    index,
  })}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### TextInput

Text input with keyboard handling:

```typescript
import { TextInput, createTextInputRef } from '@philjs/native';

const inputRef = createTextInputRef();

<TextInput
  ref={inputRef}
  value={text}
  onChangeText={setText}
  placeholder="Enter text..."
  placeholderTextColor="#999"
  style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}
  keyboardType="email-address"
  returnKeyType="done"
  autoCapitalize="none"
  autoCorrect={false}
  secureTextEntry={isPassword}
  multiline={false}
  maxLength={100}
  onFocus={() => console.log('Focused')}
  onBlur={() => console.log('Blurred')}
  onSubmitEditing={() => handleSubmit()}
/>

// Focus programmatically
inputRef.current?.focus();
inputRef.current?.blur();
inputRef.current?.clear();
```

### Touchables

Touch feedback components:

```typescript
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
} from '@philjs/native';

// Opacity feedback
<TouchableOpacity
  onPress={() => console.log('Pressed')}
  activeOpacity={0.7}
  disabled={false}
>
  <Text>Press Me</Text>
</TouchableOpacity>

// Highlight feedback
<TouchableHighlight
  onPress={handlePress}
  underlayColor="#DDDDDD"
>
  <View><Text>Press Me</Text></View>
</TouchableHighlight>

// Advanced pressable
<Pressable
  onPress={handlePress}
  onLongPress={handleLongPress}
  onPressIn={() => setPressed(true)}
  onPressOut={() => setPressed(false)}
  delayLongPress={500}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.buttonPressed,
  ]}
>
  {({ pressed }) => <Text>{pressed ? 'Pressed!' : 'Press Me'}</Text>}
</Pressable>
```

### Button

Simple button component:

```typescript
import { Button } from '@philjs/native';

<Button
  title="Submit"
  onPress={handleSubmit}
  color="#007AFF"
  disabled={loading}
/>
```

### Switch

Toggle switch:

```typescript
import { Switch, useSwitchState } from '@philjs/native';

const [isEnabled, setIsEnabled] = useSwitchState(false);

<Switch
  value={isEnabled}
  onValueChange={setIsEnabled}
  trackColor={{ false: '#767577', true: '#81b0ff' }}
  thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
  ios_backgroundColor="#3e3e3e"
/>
```

### SafeAreaView

Handle device safe areas:

```typescript
import {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
  useSafeAreaFrame,
} from '@philjs/native';

// Wrap your app
function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

// Use safe area
function Screen() {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Text>Screen size: {frame.width} x {frame.height}</Text>
    </View>
  );
}

// Or use the component
<SafeAreaView edges={['top', 'bottom']} style={styles.container}>
  {content}
</SafeAreaView>
```

### StatusBar

Control status bar appearance:

```typescript
import { StatusBar } from '@philjs/native';

<StatusBar
  barStyle="dark-content"  // 'default' | 'light-content' | 'dark-content'
  backgroundColor="#ffffff"
  hidden={false}
  animated
  translucent  // Android only
/>
```

### KeyboardAvoidingView

Handle keyboard:

```typescript
import {
  KeyboardAvoidingView,
  Keyboard,
  DismissKeyboard,
  useKeyboard,
} from '@philjs/native';

// Avoid keyboard
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={100}
  style={{ flex: 1 }}
>
  <TextInput />
  <Button title="Submit" />
</KeyboardAvoidingView>

// Dismiss on tap outside
<DismissKeyboard>
  <View style={{ flex: 1 }}>
    <TextInput />
  </View>
</DismissKeyboard>

// Keyboard hook
function Form() {
  const { isVisible, height, animating } = useKeyboard();

  return (
    <View style={{ paddingBottom: isVisible ? height : 0 }}>
      <TextInput />
    </View>
  );
}
```

### RefreshControl

Pull-to-refresh:

```typescript
import { RefreshControl, usePullToRefresh, useRefresh } from '@philjs/native';

// Manual
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchData();
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#007AFF"
      title="Pull to refresh"
      titleColor="#007AFF"
    />
  }
>
  {content}
</ScrollView>

// Hook-based
function MyList() {
  const { refreshing, onRefresh } = useRefresh(async () => {
    await fetchData();
  });

  return (
    <FlatList
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      data={data}
      renderItem={renderItem}
    />
  );
}
```

### ActivityIndicator

Loading spinner:

```typescript
import { ActivityIndicator } from '@philjs/native';

<ActivityIndicator
  size="large"  // 'small' | 'large' | number
  color="#007AFF"
  animating={loading}
/>
```

## Navigation

### Stack Navigator

```typescript
import { createNativeStack, useNativeNavigation, useRoute, Link } from '@philjs/native';

const Stack = createNativeStack({
  initialRouteName: 'Home',
  screenOptions: {
    headerStyle: { backgroundColor: '#fff' },
    headerTintColor: '#000',
    animation: 'slide_from_right',
  },
});

function App() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

// Navigate
function HomeScreen() {
  const navigation = useNativeNavigation();

  return (
    <View>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate('Profile', { name: 'John' })}
      />
      <Button
        title="Push Settings"
        onPress={() => navigation.push('Settings')}
      />
    </View>
  );
}

// Access route params
function ProfileScreen() {
  const route = useRoute<{ name: string }>();
  return <Text>Hello, {route.params.name}</Text>;
}

// Link component
<Link to="Profile" params={{ name: 'Jane' }}>
  <Text>Go to Jane's Profile</Text>
</Link>
```

### Tab Navigator

```typescript
import { createNativeTabs } from '@philjs/native';

const Tabs = createNativeTabs({
  tabBarPosition: 'bottom',
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#8E8E93',
  tabBarStyle: { backgroundColor: '#fff' },
});

function App() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
          tabBarBadge: 3,
        }}
      />
      <Tabs.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" size={size} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}
```

### Navigation Hooks

```typescript
import {
  useNativeNavigation,
  useRoute,
  useIsFocused,
  useFocusEffect,
} from '@philjs/native';

function Screen() {
  const navigation = useNativeNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  // Run effect when screen is focused
  useFocusEffect(() => {
    console.log('Screen focused');
    fetchData();

    return () => {
      console.log('Screen unfocused');
    };
  });

  // Navigation methods
  navigation.navigate('Screen', { id: 1 });
  navigation.push('Screen', { id: 2 });
  navigation.pop();
  navigation.popToTop();
  navigation.goBack();
  navigation.replace('Other', { id: 3 });
  navigation.reset({ routes: [{ name: 'Home' }], index: 0 });
  navigation.setParams({ id: 4 });
  navigation.setOptions({ title: 'New Title' });
  navigation.canGoBack(); // boolean
  navigation.getState(); // NavigationState
}
```

## Native APIs

### Camera

```typescript
import { Camera } from '@philjs/native';

// Check permissions
const permission = await Camera.requestPermission();

// Take photo
const photo = await Camera.takePhoto({
  quality: 0.8,
  base64: true,
  exif: true,
});

// Record video
const video = await Camera.recordVideo({
  maxDuration: 60,
  quality: 'high',
});

// Pick from library
const image = await Camera.pickFromLibrary({
  mediaTypes: 'Images',
  allowsEditing: true,
  aspect: [4, 3],
});
```

### Geolocation

```typescript
import {
  Geolocation,
  useLocation,
  useWatchLocation,
  currentLocation,
  locationPermission,
} from '@philjs/native';

// One-time location
const location = await Geolocation.getCurrentPosition({
  accuracy: 'high',
  timeout: 15000,
});
console.log(location.coords.latitude, location.coords.longitude);

// Watch location
const subscription = Geolocation.watchPosition(
  (position) => console.log(position),
  (error) => console.error(error),
  { accuracy: 'balanced', distanceFilter: 10 }
);
// Later: subscription.remove();

// Hook-based
function LocationDisplay() {
  const { location, error, loading } = useLocation({ enableHighAccuracy: true });

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <Text>
      Lat: {location?.coords.latitude}, Lng: {location?.coords.longitude}
    </Text>
  );
}

// Watch hook
function Tracker() {
  const { location, error } = useWatchLocation({ distanceFilter: 10 });
  // Location updates automatically
}
```

### Storage

```typescript
import {
  Storage,
  SecureStorage,
  MMKVStorage,
  getJSON,
  setJSON,
  useStorage,
} from '@philjs/native';

// Basic storage
await Storage.setItem('key', 'value');
const value = await Storage.getItem('key');
await Storage.removeItem('key');
await Storage.clear();
const keys = await Storage.getAllKeys();

// Multi operations
await Storage.multiSet([['key1', 'value1'], ['key2', 'value2']]);
const values = await Storage.multiGet(['key1', 'key2']);
await Storage.multiRemove(['key1', 'key2']);

// JSON helpers
await setJSON('user', { name: 'John', age: 30 });
const user = await getJSON<User>('user');

// Secure storage (keychain/keystore)
await SecureStorage.setItem('token', 'secret', {
  accessible: 'whenUnlocked',
});
const token = await SecureStorage.getItem('token');

// MMKV (fast)
MMKVStorage.set('key', 'value');
const val = MMKVStorage.getString('key');

// Hook
function Settings() {
  const [theme, setTheme] = useStorage<string>('theme', 'light');
  return <Switch value={theme === 'dark'} onValueChange={(v) => setTheme(v ? 'dark' : 'light')} />;
}
```

### Haptics

```typescript
import {
  Haptics,
  impactLight,
  impactMedium,
  impactHeavy,
  notifySuccess,
  notifyWarning,
  notifyError,
  selectionFeedback,
} from '@philjs/native';

// Quick functions
impactLight();    // Light tap
impactMedium();   // Medium tap
impactHeavy();    // Strong tap
notifySuccess();  // Success feedback
notifyWarning();  // Warning feedback
notifyError();    // Error feedback
selectionFeedback(); // Selection changed

// Full API
Haptics.impact('light' | 'medium' | 'heavy');
Haptics.notification('success' | 'warning' | 'error');
Haptics.selection();
```

### Notifications

```typescript
import {
  Notifications,
  useNotificationReceived,
  useNotificationResponse,
  notificationPermission,
  pushToken,
} from '@philjs/native';

// Request permission
const permission = await Notifications.requestPermission();

// Get push token
const token = await Notifications.getExpoPushToken();
console.log(token.data);

// Schedule local notification
await Notifications.scheduleLocalNotification({
  title: 'Reminder',
  body: 'Don\'t forget!',
  trigger: { seconds: 60 },
  sound: true,
  badge: 1,
});

// Hooks
function NotificationHandler() {
  useNotificationReceived((notification) => {
    console.log('Received:', notification);
  });

  useNotificationResponse((response) => {
    console.log('User tapped:', response);
    navigation.navigate(response.notification.data.screen);
  });

  return null;
}
```

### Clipboard

```typescript
import { Clipboard, useClipboard, clipboardContent } from '@philjs/native';

// Set content
await Clipboard.setString('Hello, clipboard!');

// Get content
const text = await Clipboard.getString();

// Check for content
const hasContent = await Clipboard.hasString();

// Hook
function CopyButton({ text }) {
  const [copiedText, setCopiedText] = useClipboard();

  return (
    <Button
      title={copiedText === text ? 'Copied!' : 'Copy'}
      onPress={() => setCopiedText(text)}
    />
  );
}
```

### Share

```typescript
import { Share } from '@philjs/native';

// Share content
const result = await Share.share({
  message: 'Check out this awesome app!',
  url: 'https://example.com',
  title: 'Share',
});

if (result.action === 'shared') {
  console.log('Shared with:', result.activityType);
}

// Share file
await Share.shareFile({
  url: 'file://path/to/file.pdf',
  type: 'application/pdf',
});
```

### Biometrics

```typescript
import { Biometrics, useBiometrics, biometricSupport } from '@philjs/native';

// Check support
const support = await Biometrics.getAvailableTypes();
// ['FaceID'] | ['TouchID'] | ['Fingerprint'] | []

// Authenticate
const result = await Biometrics.authenticate({
  promptMessage: 'Authenticate to continue',
  cancelLabel: 'Cancel',
  fallbackLabel: 'Use Passcode',
});

if (result.success) {
  console.log('Authenticated!');
}

// Secure store with biometrics
await Biometrics.setSecureValue('secret', 'value');
const value = await Biometrics.getSecureValue('secret');

// Hook
function BiometricGate({ children }) {
  const { isSupported, isEnrolled, authenticate } = useBiometrics();

  if (!isSupported || !isEnrolled) {
    return <PinScreen />;
  }

  return children;
}
```

### Permissions

```typescript
import {
  Permissions,
  checkPermission,
  requestPermission,
  openSettings,
  usePermission,
} from '@philjs/native';

// Check permission
const status = await checkPermission('camera');
// 'granted' | 'denied' | 'blocked' | 'unavailable'

// Request permission
const result = await requestPermission('camera');

// Multiple permissions
const results = await Permissions.requestMultiple(['camera', 'microphone']);

// Open settings
await openSettings();

// Hook
function CameraScreen() {
  const [status, request] = usePermission('camera');

  if (status === 'blocked') {
    return <Button title="Open Settings" onPress={openSettings} />;
  }

  if (status !== 'granted') {
    return <Button title="Grant Camera Access" onPress={request} />;
  }

  return <CameraView />;
}
```

## Styling

### StyleSheet

```typescript
import { StyleSheet, platformStyles } from '@philjs/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    ...platformStyles({
      ios: { fontFamily: 'SF Pro Display' },
      android: { fontFamily: 'Roboto' },
    }),
  },
  shadow: {
    ...StyleSheet.shadow(4),  // Elevation helper
  },
});

// Flatten styles
const merged = StyleSheet.flatten([styles.container, { padding: 20 }]);

// Absolute fill
const overlay = StyleSheet.absoluteFill;
const overlayObj = StyleSheet.absoluteFillObject;
```

### Theming

```typescript
import {
  useColorScheme,
  useTheme,
  useThemedStyles,
  lightTheme,
  darkTheme,
  setTheme,
} from '@philjs/native';

// Get color scheme
function App() {
  const colorScheme = useColorScheme();  // 'light' | 'dark'

  return (
    <View style={{
      backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
    }}>
      {children}
    </View>
  );
}

// Theme hook
function ThemedComponent() {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
}

// Themed styles
function Card() {
  const styles = useThemedStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    title: {
      ...theme.typography.heading,
      color: theme.colors.text,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Card Title</Text>
    </View>
  );
}
```

### Responsive

```typescript
import {
  useWindowDimensions,
  useBreakpoint,
  responsive,
  breakpoints,
} from '@philjs/native';

function ResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const breakpoint = useBreakpoint();  // 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  const columns = responsive({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
  });

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
    }}>
      {items.map(item => (
        <View key={item.id} style={{ width: width / columns }}>
          <ItemCard item={item} />
        </View>
      ))}
    </View>
  );
}
```

## Gestures

```typescript
import {
  createPanGesture,
  createPinchGesture,
  createSwipeGesture,
  createLongPressGesture,
  createTapGesture,
  usePanGesture,
  usePinchGesture,
} from '@philjs/native';

// Pan gesture
const panGesture = createPanGesture({
  onStart: (event) => console.log('Started at', event.x, event.y),
  onMove: (event) => console.log('Moving', event.translationX, event.translationY),
  onEnd: (event) => console.log('Ended with velocity', event.velocityX, event.velocityY),
});

// Pinch gesture
const pinchGesture = createPinchGesture({
  onScale: (event) => console.log('Scale:', event.scale),
  onEnd: (event) => console.log('Final scale:', event.scale),
});

// Swipe gesture
const swipeGesture = createSwipeGesture({
  direction: 'horizontal',  // 'horizontal' | 'vertical' | 'any'
  onSwipe: (direction) => console.log('Swiped', direction),  // 'left' | 'right' | 'up' | 'down'
});

// Hook-based
function DraggableCard() {
  const { gestureHandler, translateX, translateY } = usePanGesture();

  return (
    <View
      {...gestureHandler}
      style={{
        transform: [
          { translateX: translateX() },
          { translateY: translateY() },
        ],
      }}
    >
      <Text>Drag me!</Text>
    </View>
  );
}
```

## Animations

```typescript
import {
  Animated,
  AnimatedValue,
  timing,
  spring,
  sequence,
  parallel,
  loop,
  Easing,
  useSpring,
} from '@philjs/native';

// Create animated value
const opacity = new AnimatedValue(0);

// Timing animation
timing(opacity, {
  toValue: 1,
  duration: 300,
  easing: Easing.ease,
}).start();

// Spring animation
spring(opacity, {
  toValue: 1,
  tension: 40,
  friction: 7,
}).start();

// Sequence
sequence([
  timing(opacity, { toValue: 1, duration: 200 }),
  timing(opacity, { toValue: 0, duration: 200 }),
]).start();

// Parallel
parallel([
  timing(opacity, { toValue: 1, duration: 300 }),
  timing(scale, { toValue: 1.2, duration: 300 }),
]).start();

// Loop
loop(
  sequence([
    timing(opacity, { toValue: 1, duration: 500 }),
    timing(opacity, { toValue: 0, duration: 500 }),
  ])
).start();

// Spring hook
function BouncyButton() {
  const scale = useSpring(1);

  return (
    <Pressable
      onPressIn={() => scale.value = 0.95}
      onPressOut={() => scale.value = 1}
      style={{ transform: [{ scale: scale.value }] }}
    >
      <Text>Press Me</Text>
    </Pressable>
  );
}
```

### Screen Transitions

```typescript
import {
  fadeIn,
  fadeOut,
  slideInRight,
  slideInLeft,
  slideInUp,
  slideInDown,
  scaleIn,
  modalPresent,
  modalDismiss,
  createScreenTransition,
} from '@philjs/native';

// Use preset transitions
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  options={{
    animation: slideInRight,
  }}
/>

// Create custom transition
const myTransition = createScreenTransition({
  from: { opacity: 0, transform: [{ scale: 0.9 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
  duration: 300,
  easing: Easing.out(Easing.cubic),
});
```

## Platform Utilities

```typescript
import {
  Platform,
  platformOS,
  platformVersion,
  isIOS,
  isAndroid,
  isWeb,
  isNative,
  platformSelect,
} from '@philjs/native';

// Check platform
if (isIOS()) {
  // iOS-specific code
} else if (isAndroid()) {
  // Android-specific code
}

// Platform select
const fontSize = platformSelect({
  ios: 17,
  android: 16,
  web: 14,
  default: 16,
});

// Platform version
const version = platformVersion(); // e.g., '14.5' on iOS
```

## Hooks

```typescript
import {
  useDevice,
  useNetwork,
  useBattery,
  useAppState,
  useOrientation,
} from '@philjs/native';

// Device info
const { type, isPhone, isTablet } = useDevice();

// Network status
const { isOnline, connectionType, isWifi } = useNetwork();

// Battery status
const { level, isCharging, isLowPower } = useBattery();

// App state
const { state, isActive, isBackground } = useAppState();

// Orientation
const { orientation, isPortrait, isLandscape } = useOrientation();
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `View` | Container component |
| `Text` | Text display |
| `Image` | Image display |
| `ScrollView` | Scrollable container |
| `FlatList` | Optimized list |
| `TextInput` | Text input |
| `Button` | Simple button |
| `Switch` | Toggle switch |
| `TouchableOpacity` | Opacity feedback |
| `Pressable` | Advanced pressable |
| `SafeAreaView` | Safe area handling |
| `StatusBar` | Status bar control |
| `KeyboardAvoidingView` | Keyboard handling |
| `RefreshControl` | Pull to refresh |
| `ActivityIndicator` | Loading spinner |

### Navigation

| API | Description |
|-----|-------------|
| `createNativeStack()` | Create stack navigator |
| `createNativeTabs()` | Create tab navigator |
| `useNativeNavigation()` | Access navigation |
| `useRoute()` | Access current route |
| `useIsFocused()` | Check focus state |
| `useFocusEffect()` | Focus effect hook |
| `Link` | Navigation link |

### Native APIs

| API | Description |
|-----|-------------|
| `Camera` | Camera access |
| `Geolocation` | Location services |
| `Storage` | Persistent storage |
| `SecureStorage` | Secure storage |
| `Haptics` | Haptic feedback |
| `Notifications` | Push notifications |
| `Clipboard` | Clipboard access |
| `Share` | Share sheet |
| `Biometrics` | Biometric auth |
| `Permissions` | Permission handling |

## Next Steps

- [Mobile Platform](../../platforms/mobile.md) - Mobile development guide
- [Native Bridges](../../platforms/native-bridge.md) - Native module integration
- [PWA](../../platforms/pwa.md) - Progressive web apps

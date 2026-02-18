/**
 * @philjs/mobile - Native iOS and Android Support
 *
 * Build native mobile apps using the PhilJS component model.
 * This package provides TypeScript bindings for the Rust mobile runtime.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Size in logical pixels
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Point in logical pixels
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle
 */
export interface Rect {
  origin: Point;
  size: Size;
}

/**
 * Color representation
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Edge insets
 */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Layout constraints
 */
export interface Constraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

// ============================================================================
// Platform Types
// ============================================================================

/**
 * Platform type
 */
export type Platform = 'ios' | 'android';

/**
 * Device information
 */
export interface DeviceInfo {
  platform: Platform;
  osVersion: string;
  model: string;
  isSimulator: boolean;
  screenSize: Size;
  pixelRatio: number;
  safeArea: EdgeInsets;
}

/**
 * App lifecycle state
 */
export type AppState = 'active' | 'inactive' | 'background' | 'suspended';

/**
 * Device orientation
 */
export type Orientation =
  | 'portrait'
  | 'portraitUpsideDown'
  | 'landscapeLeft'
  | 'landscapeRight';

// ============================================================================
// Component Types
// ============================================================================

/**
 * Font weight
 */
export type FontWeight =
  | 'thin'
  | 'extraLight'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'extraBold'
  | 'black';

/**
 * Text alignment
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Keyboard type
 */
export type KeyboardType =
  | 'default'
  | 'numeric'
  | 'email'
  | 'phone'
  | 'url'
  | 'numberPad'
  | 'decimalPad'
  | 'password';

/**
 * View component base props
 */
export interface ViewProps {
  style?: ViewStyle;
  onLayout?: (rect: Rect) => void;
}

/**
 * View style properties
 */
export interface ViewStyle {
  // Layout
  flex?: number;
  flexDirection?: 'row' | 'column' | 'rowReverse' | 'columnReverse';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
  alignSelf?: 'auto' | 'start' | 'center' | 'end' | 'stretch';

  // Size
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;

  // Spacing
  margin?: number | EdgeInsets;
  padding?: number | EdgeInsets;
  gap?: number;

  // Position
  position?: 'relative' | 'absolute';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;

  // Background
  backgroundColor?: string | Color;
  backgroundImage?: string;

  // Border
  borderWidth?: number;
  borderColor?: string | Color;
  borderRadius?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';

  // Shadow
  shadowColor?: string | Color;
  shadowOffset?: Point;
  shadowRadius?: number;
  shadowOpacity?: number;

  // Other
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
  transform?: Transform[];
}

/**
 * Transform types
 */
export type Transform =
  | { translateX: number }
  | { translateY: number }
  | { scale: number }
  | { scaleX: number }
  | { scaleY: number }
  | { rotate: string }
  | { rotateX: string }
  | { rotateY: string }
  | { skewX: string }
  | { skewY: string };

/**
 * Text component props
 */
export interface TextProps extends ViewProps {
  fontSize?: number;
  fontWeight?: FontWeight;
  fontFamily?: string;
  color?: string | Color;
  textAlign?: TextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  numberOfLines?: number;
  selectable?: boolean;
}

/**
 * Button component props
 */
export interface ButtonProps extends ViewProps {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  title?: string;
  color?: string | Color;
}

/**
 * TextInput component props
 */
export interface TextInputProps extends ViewProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string | Color;
  keyboardType?: KeyboardType;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
}

/**
 * Image component props
 */
export interface ImageProps extends ViewProps {
  source: { uri: string } | number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * ScrollView component props
 */
export interface ScrollViewProps extends ViewProps {
  horizontal?: boolean;
  pagingEnabled?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  scrollEnabled?: boolean;
  onScroll?: (event: ScrollEvent) => void;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: () => void;
  refreshControl?: RefreshControlProps;
  contentContainerStyle?: ViewStyle;
}

/**
 * Scroll event
 */
export interface ScrollEvent {
  contentOffset: Point;
  contentSize: Size;
  layoutMeasurement: Size;
}

/**
 * RefreshControl props
 */
export interface RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string | Color;
  title?: string;
}

/**
 * FlatList component props
 */
export interface FlatListProps<T> extends ViewProps {
  data: T[];
  renderItem: (info: { item: T; index: number }) => unknown;
  keyExtractor: (item: T, index: number) => string;
  horizontal?: boolean;
  numColumns?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListHeaderComponent?: unknown;
  ListFooterComponent?: unknown;
  ListEmptyComponent?: unknown;
  ItemSeparatorComponent?: unknown;
  refreshing?: boolean;
  onRefresh?: () => void;
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Navigation route
 */
export interface Route<T = unknown> {
  name: string;
  params?: T;
}

/**
 * Navigator interface
 */
export interface Navigator {
  navigate<T>(route: string | Route<T>): void;
  goBack(): void;
  reset(routes: Route[]): void;
  push<T>(route: string | Route<T>): void;
  pop(count?: number): void;
  popToTop(): void;
  replace<T>(route: string | Route<T>): void;
  canGoBack(): boolean;
  getCurrentRoute(): Route | undefined;
}

/**
 * Navigation stack
 */
export interface NavigationStack {
  readonly routes: Route[];
  readonly index: number;
}

/**
 * Screen options
 */
export interface ScreenOptions {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerBackTitle?: string;
  headerTintColor?: string | Color;
  headerStyle?: ViewStyle;
  presentation?: 'card' | 'modal' | 'transparentModal' | 'fullScreenModal';
  animation?: 'default' | 'fade' | 'slide' | 'none';
  gestureEnabled?: boolean;
}

// ============================================================================
// Gesture Types
// ============================================================================

/**
 * Gesture state
 */
export type GestureState = 'began' | 'changed' | 'ended' | 'cancelled' | 'failed';

/**
 * Pan gesture event
 */
export interface PanGestureEvent {
  state: GestureState;
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  absoluteX: number;
  absoluteY: number;
}

/**
 * Pinch gesture event
 */
export interface PinchGestureEvent {
  state: GestureState;
  scale: number;
  velocity: number;
  focalX: number;
  focalY: number;
}

/**
 * Rotation gesture event
 */
export interface RotationGestureEvent {
  state: GestureState;
  rotation: number;
  velocity: number;
  anchorX: number;
  anchorY: number;
}

/**
 * Tap gesture event
 */
export interface TapGestureEvent {
  state: GestureState;
  x: number;
  y: number;
  absoluteX: number;
  absoluteY: number;
}

/**
 * Long press gesture event
 */
export interface LongPressGestureEvent extends TapGestureEvent {
  duration: number;
}

// ============================================================================
// Animation Types
// ============================================================================

/**
 * Animated value
 */
export interface AnimatedValue {
  getValue(): number;
  setValue(value: number): void;
  addListener(callback: (value: number) => void): string;
  removeListener(id: string): void;
  removeAllListeners(): void;
  interpolate(config: InterpolationConfig): AnimatedValue;
}

/**
 * Interpolation config
 */
export interface InterpolationConfig {
  inputRange: number[];
  outputRange: number[] | string[];
  extrapolate?: 'extend' | 'clamp' | 'identity';
  extrapolateLeft?: 'extend' | 'clamp' | 'identity';
  extrapolateRight?: 'extend' | 'clamp' | 'identity';
}

/**
 * Timing animation config
 */
export interface TimingAnimationConfig {
  toValue: number;
  duration?: number;
  delay?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
}

/**
 * Spring animation config
 */
export interface SpringAnimationConfig {
  toValue: number;
  damping?: number;
  mass?: number;
  stiffness?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
  delay?: number;
  useNativeDriver?: boolean;
}

/**
 * Animation handle
 */
export interface AnimationHandle {
  start(callback?: (finished: { finished: boolean }) => void): void;
  stop(): void;
  reset(): void;
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Async storage interface
 */
export interface AsyncStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(pairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

/**
 * Secure storage interface
 */
export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * File system interface
 */
export interface FileSystem {
  readFile(path: string): Promise<string>;
  readFileAsBuffer(path: string): Promise<ArrayBuffer>;
  writeFile(path: string, content: string): Promise<void>;
  writeFileFromBuffer(path: string, content: ArrayBuffer): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<FileStat>;
  copyFile(src: string, dest: string): Promise<void>;
  moveFile(src: string, dest: string): Promise<void>;
}

/**
 * File stat
 */
export interface FileStat {
  name: string;
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  created: Date;
  modified: Date;
}

// ============================================================================
// Permissions Types
// ============================================================================

/**
 * Permission types
 */
export type Permission =
  | 'camera'
  | 'microphone'
  | 'photos'
  | 'contacts'
  | 'calendar'
  | 'location'
  | 'locationAlways'
  | 'locationWhenInUse'
  | 'notifications'
  | 'bluetooth'
  | 'motion'
  | 'mediaLibrary'
  | 'speech';

/**
 * Permission status
 */
export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'limited'
  | 'notDetermined'
  | 'restricted';

// ============================================================================
// Notifications Types
// ============================================================================

/**
 * Local notification
 */
export interface LocalNotification {
  id: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  categoryId?: string;
  trigger?: NotificationTrigger;
}

/**
 * Notification trigger
 */
export type NotificationTrigger =
  | { type: 'immediate' }
  | { type: 'date'; date: Date }
  | { type: 'interval'; seconds: number; repeats?: boolean }
  | { type: 'calendar'; dateComponents: DateComponents; repeats?: boolean };

/**
 * Date components
 */
export interface DateComponents {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  weekday?: number;
}

/**
 * Push notification
 */
export interface PushNotification {
  id: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Camera Types
// ============================================================================

/**
 * Camera options
 */
export interface CameraOptions {
  type?: 'front' | 'back';
  quality?: 'low' | 'medium' | 'high';
  flashMode?: 'on' | 'off' | 'auto';
  autoFocus?: boolean;
  whiteBalance?: 'auto' | 'sunny' | 'cloudy' | 'shadow' | 'fluorescent' | 'incandescent';
}

/**
 * Photo result
 */
export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  exif?: Record<string, unknown>;
}

/**
 * Video result
 */
export interface VideoResult {
  uri: string;
  duration: number;
}

// ============================================================================
// Location Types
// ============================================================================

/**
 * Location coordinates
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Location options
 */
export interface LocationOptions {
  accuracy?: 'best' | 'nearestTenMeters' | 'hundredMeters' | 'kilometer' | 'threeKilometers';
  distanceFilter?: number;
  timeout?: number;
}

// ============================================================================
// Sensor Types
// ============================================================================

/**
 * Accelerometer data
 */
export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

/**
 * Gyroscope data
 */
export interface GyroscopeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

/**
 * Magnetometer data
 */
export interface MagnetometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// ============================================================================
// Haptics Types
// ============================================================================

/**
 * Haptic feedback style
 */
export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error';

// ============================================================================
// Share Types
// ============================================================================

/**
 * Share options
 */
export interface ShareOptions {
  message?: string;
  url?: string;
  title?: string;
  subject?: string;
  files?: string[];
}

/**
 * Share result
 */
export interface ShareResult {
  action: 'shared' | 'dismissed';
  activityType?: string;
}

// ============================================================================
// Biometrics Types
// ============================================================================

/**
 * Biometric type
 */
export type BiometricType = 'fingerprint' | 'faceId' | 'iris' | 'none';

/**
 * Biometric auth options
 */
export interface BiometricAuthOptions {
  reason: string;
  fallbackLabel?: string;
  cancelLabel?: string;
}

// ============================================================================
// In-App Purchase Types
// ============================================================================

/**
 * Product type
 */
export type ProductType = 'consumable' | 'nonConsumable' | 'subscription';

/**
 * Product info
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceValue: number;
  currency: string;
  type: ProductType;
}

/**
 * Purchase result
 */
export interface PurchaseResult {
  productId: string;
  transactionId: string;
  transactionDate: Date;
  receipt?: string;
}

// ============================================================================
// App Configuration
// ============================================================================

/**
 * Mobile app configuration
 */
export interface MobileConfig {
  /** App name */
  name?: string;
  /** Initial orientation */
  orientation?: Orientation;
  /** Status bar style */
  statusBarStyle?: 'default' | 'lightContent' | 'darkContent';
  /** Hide status bar */
  statusBarHidden?: boolean;
  /** Enable background modes */
  backgroundModes?: string[];
}

// ============================================================================
// Runtime Functions
// ============================================================================

/**
 * Run the mobile app
 */
export function run<T>(app: () => T): void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Run the mobile app with config
 */
export function runWithConfig<T>(app: () => T, config: MobileConfig): void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get device info
 */
export function getDeviceInfo(): DeviceInfo {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get current platform
 */
export function getPlatform(): Platform {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get app state
 */
export function getAppState(): AppState {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Listen to app state changes
 */
export function onAppStateChange(callback: (state: AppState) => void): () => void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Request permission
 */
export function requestPermission(permission: Permission): Promise<PermissionStatus> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Check permission
 */
export function checkPermission(permission: Permission): Promise<PermissionStatus> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Trigger haptic feedback
 */
export function hapticFeedback(style: HapticStyle): void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Share content
 */
export function share(options: ShareOptions): Promise<ShareResult> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Authenticate with biometrics
 */
export function authenticateWithBiometrics(
  options: BiometricAuthOptions
): Promise<boolean> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get available biometric type
 */
export function getBiometricType(): Promise<BiometricType> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get current location
 */
export function getCurrentLocation(
  options?: LocationOptions
): Promise<LocationCoordinates> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Watch location changes
 */
export function watchLocation(
  callback: (coords: LocationCoordinates) => void,
  options?: LocationOptions
): () => void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Schedule local notification
 */
export function scheduleNotification(
  notification: LocalNotification
): Promise<string> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Cancel notification
 */
export function cancelNotification(id: string): Promise<void> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get push notification token
 */
export function getPushToken(): Promise<string> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create animated value
 */
export function createAnimatedValue(initial: number): AnimatedValue {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create timing animation
 */
export function timing(
  value: AnimatedValue,
  config: TimingAnimationConfig
): AnimationHandle {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create spring animation
 */
export function spring(
  value: AnimatedValue,
  config: SpringAnimationConfig
): AnimationHandle {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Storage Singletons
// ============================================================================

/**
 * Async storage instance
 */
export const asyncStorage: AsyncStorage = {
  getItem: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  setItem: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  removeItem: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  clear: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  getAllKeys: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  multiGet: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  multiSet: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  multiRemove: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
};

/**
 * Secure storage instance
 */
export const secureStorage: SecureStorage = {
  getItem: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  setItem: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  removeItem: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  clear: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
};

/**
 * File system instance
 */
export const fileSystem: FileSystem = {
  readFile: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  readFileAsBuffer: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  writeFile: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  writeFileFromBuffer: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  deleteFile: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  exists: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  mkdir: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  readdir: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  stat: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  copyFile: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
  moveFile: () => {
    throw new Error('This is a type stub. Use the Rust runtime.');
  },
};

// All types are exported at their declaration points above

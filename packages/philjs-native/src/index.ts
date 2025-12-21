/**
 * PhilJS Native
 *
 * Cross-platform mobile development for PhilJS.
 * Build native iOS, Android, and Web apps with one codebase.
 */

// ============================================================================
// Runtime
// ============================================================================

export {
  // Platform
  detectPlatform,
  getPlatformInfo,
  platformInfo,
  onPlatform,
  platformSelect,
  dimensions,
  getDimensions,
  // Native Bridge
  NativeBridge,
  nativeBridge,
  // App
  createNativeApp,
  registerNativeComponent,
  getNativeComponent,
  hasNativeComponent,
  getRegisteredComponents,
} from './runtime.js';

export type {
  Platform,
  PlatformInfo,
  Dimensions,
  NativeBridgeMessage,
  NativeBridgeResponse,
  NativeComponentConfig,
  NativeAppConfig,
  NativeApp,
  AppState,
  AppLifecycleEvents,
} from './runtime.js';

// ============================================================================
// Components
// ============================================================================

export {
  // Core
  View,
  Text,
  Image,
  // Scrolling
  ScrollView,
  createScrollViewRef,
  FlatList,
  createFlatListRef,
  // Touch
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
  // Input
  TextInput,
  createTextInputRef,
  Button,
  // Layout
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
  useSafeAreaFrame,
  safeAreaInsets,
  StatusBar,
} from './components/index.js';

export type {
  // View
  ViewProps,
  LayoutEvent,
  TouchEvent,
  Touch,
  AccessibilityRole,
  PointerEvents,
  // Text
  TextProps,
  TextLayoutEvent,
  TextLine,
  // Image
  ImageProps,
  ImageSource,
  ResizeMode,
  ImageLoadEvent,
  ImageErrorEvent,
  ImageProgressEvent,
  // ScrollView
  ScrollViewProps,
  ScrollViewRef,
  ScrollEvent,
  KeyboardDismissMode,
  ScrollIndicatorInsets,
  // FlatList
  FlatListProps,
  FlatListRef,
  ListRenderItemInfo,
  ViewToken,
  ViewabilityConfig,
  // Touch
  TouchableOpacityProps,
  TouchableHighlightProps,
  PressableProps,
  GestureResponderEvent,
  // Input
  TextInputProps,
  TextInputRef,
  KeyboardType,
  ReturnKeyType,
  AutoCapitalize,
  TextContentType,
  TextInputSelection,
  TextInputChangeEvent,
  TextInputFocusEvent,
  TextInputContentSizeChangeEvent,
  TextInputSelectionChangeEvent,
  TextInputKeyPressEvent,
  // Button
  ButtonProps,
  // SafeArea
  SafeAreaViewProps,
  SafeAreaProviderProps,
  SafeAreaInsets,
  SafeAreaEdge,
  // StatusBar
  StatusBarProps,
  StatusBarStyle,
  StatusBarAnimation,
} from './components/index.js';

// ============================================================================
// Navigation
// ============================================================================

export {
  // Router
  createNativeRouter,
  navigationState,
  // Stack
  createNativeStack,
  NativeStack,
  // Tabs
  createNativeTabs,
  NativeTabs,
  // Hooks
  useNativeNavigation,
  useRoute,
  useIsFocused,
  useFocusEffect,
  // Components
  Link,
} from './navigation.js';

export type {
  NavigationState,
  Route,
  ScreenOptions,
  ScreenAnimation,
  ScreenPresentation,
  NavigationOptions,
  ScreenDefinition,
  Navigation,
  RouterConfig,
  StackNavigatorOptions,
  TabNavigatorOptions,
  LinkProps,
} from './navigation.js';

// ============================================================================
// Native APIs
// ============================================================================

export {
  // Camera
  Camera,
  // Geolocation
  Geolocation,
  currentLocation,
  locationPermission,
  locationError,
  useLocation,
  useWatchLocation,
  // Storage
  Storage,
  SecureStorage,
  MMKVStorage,
  getJSON,
  setJSON,
  updateJSON,
  useStorage,
  // Haptics
  Haptics,
  impactLight,
  impactMedium,
  impactHeavy,
  notifySuccess,
  notifyWarning,
  notifyError,
  selectionFeedback,
  // Notifications
  Notifications,
  notificationPermission,
  pushToken,
  useNotificationReceived,
  useNotificationResponse,
  // Clipboard
  Clipboard,
  clipboardContent,
  useClipboard,
  // Share
  Share,
  // Biometrics
  Biometrics,
  biometricSupport,
  useBiometrics,
} from './apis/index.js';

export type {
  // Camera
  CameraType,
  FlashMode,
  CameraPermissionStatus,
  PhotoOptions,
  VideoOptions,
  PhotoResult,
  VideoResult,
  CameraProps,
  // Geolocation
  LocationPermissionStatus,
  LocationAccuracy,
  LocationCoordinates,
  LocationResult,
  LocationOptions,
  GeocodingResult,
  HeadingResult,
  // Storage
  StorageOptions,
  MultiGetResult,
  MultiSetInput,
  // Haptics
  ImpactStyle,
  NotificationType,
  // Notifications
  NotificationPermissionStatus,
  NotificationContent,
  NotificationAttachment,
  NotificationTrigger,
  DateComponents,
  LocationRegion,
  ScheduledNotification,
  NotificationResponse,
  NotificationCategory,
  NotificationAction,
  NotificationCategoryOptions,
  NotificationActionOptions,
  PushToken,
  // Clipboard
  ClipboardContentType,
  ClipboardContent,
  // Share
  ShareContent,
  ShareOptions,
  ShareResult,
  ShareFileContent,
  // Biometrics
  BiometricType,
  BiometricSupport,
  AuthenticationOptions,
  AuthenticationResult,
  SecureStoreOptions,
} from './apis/index.js';

// ============================================================================
// Styles
// ============================================================================

export {
  // StyleSheet
  StyleSheet,
  // Color Scheme
  colorScheme,
  useColorScheme,
  // Platform Styles
  platformStyles,
  // Theme
  lightTheme,
  darkTheme,
  currentTheme,
  setTheme,
  useTheme,
  useThemedStyles,
  // Responsive
  breakpoints,
  currentBreakpoint,
  responsive,
  // Common
  commonStyles,
} from './styles.js';

export type {
  // Style Types
  FlexAlignType,
  FlexJustifyType,
  FlexDirection,
  FlexWrap,
  PositionType,
  DimensionValue,
  ColorValue,
  FontWeight,
  TextAlign,
  TextDecorationLine,
  BorderStyle,
  Overflow,
  Display,
  NativeStyle,
  Transform,
  // Styles
  ViewStyle,
  TextStyle,
  ImageStyle,
  NamedStyles,
  StyleProp,
  ColorSchemeName,
  // Theme
  ThemeColors,
  ThemeSpacing,
  ThemeTypography,
  Theme,
} from './styles.js';

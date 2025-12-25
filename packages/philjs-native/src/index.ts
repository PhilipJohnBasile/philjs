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
  // Additional
  ActivityIndicator,
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
  // ActivityIndicator
  ActivityIndicatorProps,
  ActivityIndicatorSize,
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

// ============================================================================
// Additional Components
// ============================================================================

export { Switch, useSwitchState } from './components/Switch.js';
export type { SwitchProps } from './components/Switch.js';

export {
  RefreshControl,
  usePullToRefresh,
  RefreshIndicator,
  useRefresh,
} from './components/RefreshControl.js';
export type {
  RefreshControlProps,
  RefreshState,
  PullToRefreshConfig,
  RefreshIndicatorProps,
} from './components/RefreshControl.js';

export {
  KeyboardAvoidingView,
  keyboardState,
  useKeyboard,
  useKeyboardEffect,
  Keyboard,
  DismissKeyboard,
} from './components/KeyboardAvoidingView.js';
export type {
  KeyboardAvoidingViewProps,
  KeyboardBehavior,
  KeyboardInfo,
  DismissKeyboardProps,
} from './components/KeyboardAvoidingView.js';

// ============================================================================
// Permissions
// ============================================================================

export {
  Permissions,
  check as checkPermission,
  request as requestPermission,
  checkMultiple as checkMultiplePermissions,
  requestMultiple as requestMultiplePermissions,
  openSettings,
  isGranted,
  isBlocked,
  isUnavailable,
  canRequest,
  usePermission,
  usePermissions,
  PermissionGroups,
  requestGroup,
  checkGroup,
} from './apis/Permissions.js';

export type {
  PermissionType,
  PermissionStatus,
  PermissionResult,
  PermissionsResult,
  PermissionRationale,
} from './apis/Permissions.js';

// ============================================================================
// Bridge Utilities
// ============================================================================

export {
  Bridge,
  registerNativeModule,
  getNativeModule,
  isModuleAvailable,
  callNativeMethod,
  callNativeMethodWithCallback,
  batchNativeCalls,
  promisifyNativeMethod,
  createNativeEventEmitter,
  getNativeConstants,
  installJSIBinding,
  getTurboModule,
  createNativeModuleWrapper,
  createEventHooks,
  executeNative,
  dispatchViewCommand,
  findNodeHandle,
  measureView,
} from './bridge/index.js';

export type {
  NativeModule,
  EventSubscription,
  NativeEventEmitter,
  TurboModuleSpec,
  NativeCallback,
  BatchCallEntry,
  JSIBinding,
} from './bridge/index.js';

// ============================================================================
// DevTools & Hot Reloading
// ============================================================================

export {
  DevTools,
  initHMR,
  hotReloadStatus,
  lastUpdatedModules,
  hideErrorOverlay,
  registerDevMenuItem,
  showDevMenu,
  hideDevMenu,
  toggleInspector,
  showPerformanceMonitor,
  hidePerformanceMonitor,
  clearDevCache,
  log as devLog,
  setupDevKeyboardShortcuts,
  devModeEnabled,
} from './devtools/index.js';

export type {
  HotReloadStatus,
  ModuleUpdate,
  HMRConfig,
  DevMenuOptions,
  DevMenuItem,
  PerformanceEntry,
  LogLevel,
} from './devtools/index.js';

// ============================================================================
// Performance Optimizations
// ============================================================================

export {
  Performance,
  mark,
  measure,
  getMeasures,
  clearPerformanceData,
  startFrameMonitor,
  getFrameStats,
  getMemoryInfo,
  memoryPressure,
  startMemoryMonitor,
  calculateVirtualizedRange,
  createVirtualizedList,
  memoize,
  debounce,
  throttle,
  lazy,
  preload,
  startBatch,
  endBatch,
  scheduleUpdate,
  scheduleAnimationFrame,
  scheduleIdleCallback,
  preloadImage,
  preloadImages,
  runAfterInteractions,
  createInteractionHandle,
} from './performance/index.js';

export type {
  PerformanceMark,
  PerformanceMeasure,
  FrameTiming,
  MemoryInfo,
  VirtualizationConfig,
  VirtualizedRange,
  LazyModule,
  ImagePriority,
} from './performance/index.js';

// ============================================================================
// Gestures
// ============================================================================

export {
  createPanGesture,
  createPinchGesture,
  createRotationGesture,
  createSwipeGesture,
  createLongPressGesture,
  createTapGesture,
  createGestureHandler,
  useGestures,
  usePanGesture,
  usePinchGesture,
  useSwipeGesture,
  useLongPressGesture,
  useTapGesture,
  getDistance,
  getAngle,
  getCenter,
  getVelocity,
} from './gestures/index.js';

export type {
  Point,
  Velocity,
  GestureState,
  SwipeDirection,
  BaseGestureEvent,
  PanGestureEvent,
  PinchGestureEvent,
  RotationGestureEvent,
  SwipeGestureEvent,
  LongPressGestureEvent,
  TapGestureEvent,
  GestureConfig,
  PanGestureConfig,
  PinchGestureConfig,
  SwipeGestureConfig,
  LongPressGestureConfig,
  TapGestureConfig,
  GestureHandlerOptions,
} from './gestures/index.js';

// ============================================================================
// Animations
// ============================================================================

export {
  Animated,
  AnimatedValue,
  AnimatedValueXY,
  AnimatedInterpolation,
  Easing,
  timing,
  spring,
  decay,
  sequence,
  parallel,
  stagger,
  loop,
  add,
  subtract,
  multiply,
  divide,
  modulo,
  diffClamp,
  event,
  createAnimatedComponent,
  // Transitions
  Transitions,
  fade,
  fadeIn,
  fadeOut,
  fadeQuick,
  slideInRight,
  slideInLeft,
  slideInUp,
  slideInDown,
  slideOutRight,
  slideOutLeft,
  slideOutUp,
  slideOutDown,
  scaleIn,
  scaleOut,
  zoomIn,
  zoomOut,
  popIn,
  rotateIn,
  rotateOut,
  flipInX,
  flipInY,
  stackPush,
  stackPop,
  modalPresent,
  modalDismiss,
  screenFade,
  materialSharedAxis,
  bottomSheet,
  durations,
  easings,
  springConfigs,
  createTransition,
  createScreenTransition,
  reverseTransition,
  chainTransitions,
  // Spring
  Spring,
  createSpring,
  createSpring2D,
  createGestureSpring,
  createSpringChain,
  SpringPresets,
  useSpring,
  useSpring2D,
} from './animations/index.js';

export type {
  InterpolationConfig,
  AnimationConfig,
  SpringConfig,
  DecayConfig,
  AnimationResult,
  CompositeAnimation,
  TransitionConfig,
  TransformTransition,
  TransformValues,
  ScreenTransitionConfig,
  SpringPhysicsConfig,
  SpringState,
  SpringController,
  Spring2DState,
  Spring2DController,
  GestureSpringConfig,
  GestureSpringController,
  ChainConfig,
} from './animations/index.js';

// ============================================================================
// Platform Utilities
// ============================================================================

export {
  Platform,
  platformOS,
  platformVersion,
  usePlatform,
  useIsPlatform,
  usePlatformValue,
  isIOS,
  isAndroid,
  isWeb,
  isNative,
  isDesktop,
  isDevelopment,
  isProduction,
  Dimensions,
  useWindowDimensions,
  useScreenDimensions,
  useDimensions,
  windowDimensions,
  screenDimensions,
  isLandscape,
  isPortrait,
  getOrientation,
  orientation,
  useOrientation,
  getDeviceType,
  deviceType,
  useDeviceType,
  defaultBreakpoints,
  getBreakpoint,
  breakpoint,
  useBreakpoint,
  isBreakpointUp,
  isBreakpointDown,
  getPixelRatio,
  pixelRatio,
  usePixelRatio,
  roundToNearestPixel,
  getFontScaleValue,
  useFontScale,
  Appearance,
  useColorScheme as usePlatformColorScheme,
  useIsDarkMode,
  useAppearance,
  useReducedMotion,
  useHighContrast,
  colorScheme as appearanceColorScheme,
  isDarkMode,
  reducedMotion,
  highContrast,
  toggleColorScheme,
  resetColorScheme,
  colorForScheme,
  dynamicColor,
  SystemColors,
} from './platform/index.js';

export type {
  PlatformOS,
  PlatformConstants,
  PlatformStatic,
  PlatformSelectSpecifics,
  DimensionMetrics,
  DimensionsData,
  DimensionChangeHandler,
  ColorScheme,
  AppearancePreferences,
  AppearanceChangeHandler,
} from './platform/index.js';

// ============================================================================
// Hooks
// ============================================================================

export {
  useDevice,
  useDeviceProperty,
  useIsDeviceType,
  useIsMobile,
  useIsDesktop as useIsDesktopDevice,
  usePlatform as useDevicePlatform,
  isIOS as isIOSDevice,
  isAndroid as isAndroidDevice,
  isWeb as isWebDevice,
  hasTouchScreen,
  getDeviceInfoSync,
  deviceInfo,
  deviceLoading,
  deviceError,
  useOrientation as useDeviceOrientation,
  useIsPortrait,
  useIsLandscape,
  useOrientationAngle,
  useOrientationLock,
  useOrientationEffect,
  useOrientationForScreen,
  useOrientationBreakpoint,
  lockOrientation,
  unlockOrientation,
  lockToPortrait,
  lockToLandscape,
  getOrientation as getDeviceOrientation,
  supportsOrientationLock,
  getAspectRatio,
  isSquareScreen,
  getOrientationBreakpoint,
  orientation as deviceOrientation,
  useNetwork,
  useIsOnline,
  useIsOffline,
  useConnectionType,
  useNetworkChange,
  useOnOffline,
  useOnOnline,
  getNetworkStatus,
  supportsNetworkInformation,
  getConnectionQuality,
  shouldSaveData,
  refreshNetworkStatus,
  addNetworkListener,
  networkStatus,
  useBattery,
  useBatteryLevel,
  useBatteryPercentage,
  useIsCharging,
  useIsLowBattery,
  useBatteryThreshold,
  useOnCriticalBattery,
  useOnChargingChange,
  getBatteryStatus,
  refreshBattery,
  isBatterySupported,
  getTimeRemaining,
  getBatteryStatusText,
  getBatteryCategory,
  getBatteryColor,
  shouldSavePower,
  getPowerSavingRecommendations,
  batteryStatus,
  useAppState,
  useIsActive,
  useIsBackground,
  useAppStateType,
  useOnAppStateChange,
  useOnForeground,
  useOnBackground,
  useMemoryWarning,
  useOnMemoryWarning,
  useAppStateEffect,
  getAppState,
  getTimeSinceActive,
  getTotalBackgroundTime,
  getTotalActiveTime,
  formatDuration,
  wasRecentlyBackgrounded,
  addAppStateListener,
  addForegroundListener,
  addBackgroundListener,
  appStateInfo,
  memoryWarning,
} from './hooks/index.js';

export type {
  DeviceType as DeviceInfoType,
  DeviceInfo,
  OrientationType,
  OrientationLockType,
  OrientationInfo,
  OrientationBreakpoint,
  ConnectionType,
  EffectiveConnectionType,
  NetworkStatus,
  BatteryStatus,
  BatteryThreshold,
  AppStateType,
  AppStateInfo,
  MemoryWarningLevel,
  MemoryWarning,
} from './hooks/index.js';

// ============================================================================
// Navigation (Advanced)
// ============================================================================

export {
  createStackNavigator,
  createTabNavigator,
  createDrawerNavigator,
  parseRoute,
  buildPath,
  setupDeepLinking,
  useNavigation,
  useRoute as useNavigationRoute,
  useIsFocused as useNavigationIsFocused,
  useFocusEffect as useNavigationFocusEffect,
  createNativeStack as createAdvancedNativeStack,
  createNativeTabs as createAdvancedNativeTabs,
  createNativeDrawer,
} from './navigation/index.js';

export type {
  RouteParams,
  Route as NavigationRoute,
  NavigationState as AdvancedNavigationState,
  ScreenOptions as AdvancedScreenOptions,
  NavigationAnimation,
  PresentationStyle,
  Screen,
  ScreenProps,
  Navigation as NavigationObject,
  NavigationEvent,
  NavigationAction,
  DeepLinkConfig,
  StackNavigatorOptions as AdvancedStackNavigatorOptions,
  TabNavigatorOptions as AdvancedTabNavigatorOptions,
  DrawerNavigatorOptions,
} from './navigation/index.js';

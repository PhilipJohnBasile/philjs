/**
 * PhilJS Native Components
 *
 * Cross-platform UI components for mobile development.
 */

// Core Components
export { View } from './View.js';
export type { ViewProps, LayoutEvent, TouchEvent, Touch, AccessibilityRole, PointerEvents } from './View.js';

export { Text } from './Text.js';
export type { TextProps, TextLayoutEvent, TextLine } from './Text.js';

export { Image } from './Image.js';
export type {
  ImageProps,
  ImageSource,
  ResizeMode,
  ImageLoadEvent,
  ImageErrorEvent,
  ImageProgressEvent,
} from './Image.js';

// Scrolling Components
export { ScrollView, createScrollViewRef } from './ScrollView.js';
export type {
  ScrollViewProps,
  ScrollViewRef,
  ScrollEvent,
  KeyboardDismissMode,
  ScrollIndicatorInsets,
} from './ScrollView.js';

export { FlatList, createFlatListRef } from './FlatList.js';
export type {
  FlatListProps,
  FlatListRef,
  ListRenderItemInfo,
  ViewToken,
  ViewabilityConfig,
} from './FlatList.js';

// Touch Components
export {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Pressable,
} from './TouchableOpacity.js';
export type {
  TouchableOpacityProps,
  TouchableHighlightProps,
  PressableProps,
  GestureResponderEvent,
} from './TouchableOpacity.js';

// Input Components
export { TextInput, createTextInputRef } from './TextInput.js';
export type {
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
} from './TextInput.js';

export { Button } from './Button.js';
export type { ButtonProps } from './Button.js';

// Layout Components
export {
  SafeAreaView,
  SafeAreaProvider,
  useSafeAreaInsets,
  useSafeAreaFrame,
  safeAreaInsets,
} from './SafeAreaView.js';
export type {
  SafeAreaViewProps,
  SafeAreaProviderProps,
  SafeAreaInsets,
  SafeAreaEdge,
} from './SafeAreaView.js';

export { StatusBar } from './StatusBar.js';
export type {
  StatusBarProps,
  StatusBarStyle,
  StatusBarAnimation,
} from './StatusBar.js';

// Additional Components
export { Switch, useSwitchState } from './Switch.js';
export type { SwitchProps } from './Switch.js';

export {
  RefreshControl,
  usePullToRefresh,
  RefreshIndicator,
  useRefresh,
} from './RefreshControl.js';
export type {
  RefreshControlProps,
  RefreshState,
  PullToRefreshConfig,
  RefreshIndicatorProps,
} from './RefreshControl.js';

export {
  KeyboardAvoidingView,
  keyboardState,
  useKeyboard,
  useKeyboardEffect,
  Keyboard,
  DismissKeyboard,
} from './KeyboardAvoidingView.js';
export type {
  KeyboardAvoidingViewProps,
  KeyboardBehavior,
  KeyboardInfo,
  DismissKeyboardProps,
} from './KeyboardAvoidingView.js';

export { ActivityIndicator } from './ActivityIndicator.js';
export type { ActivityIndicatorProps, ActivityIndicatorSize } from './ActivityIndicator.js';

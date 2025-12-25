/**
 * PhilJS Native APIs
 *
 * Native platform APIs for mobile development.
 */

// Camera
export { Camera } from './Camera.js';
export type {
  CameraType,
  FlashMode,
  CameraPermissionStatus,
  PhotoOptions,
  VideoOptions,
  PhotoResult,
  VideoResult,
  CameraProps,
} from './Camera.js';

// Geolocation
export {
  Geolocation,
  currentLocation,
  locationPermission,
  locationError,
  useLocation,
  useWatchLocation,
} from './Geolocation.js';
export type {
  LocationPermissionStatus,
  LocationAccuracy,
  LocationCoordinates,
  LocationResult,
  LocationOptions,
  GeocodingResult,
  HeadingResult,
} from './Geolocation.js';

// Storage
export {
  Storage,
  SecureStorage,
  MMKVStorage,
  getJSON,
  setJSON,
  updateJSON,
  useStorage,
} from './Storage.js';
export type {
  StorageOptions,
  MultiGetResult,
  MultiSetInput,
} from './Storage.js';

// Haptics
export {
  Haptics,
  impactLight,
  impactMedium,
  impactHeavy,
  notifySuccess,
  notifyWarning,
  notifyError,
  selectionFeedback,
} from './Haptics.js';
export type {
  ImpactStyle,
  NotificationType,
} from './Haptics.js';

// Notifications
export {
  Notifications,
  notificationPermission,
  pushToken,
  useNotificationReceived,
  useNotificationResponse,
} from './Notifications.js';
export type {
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
} from './Notifications.js';

// Clipboard
export {
  Clipboard,
  clipboardContent,
  useClipboard,
} from './Clipboard.js';
export type {
  ClipboardContentType,
  ClipboardContent,
} from './Clipboard.js';

// Share
export { Share } from './Share.js';
export type {
  ShareContent,
  ShareOptions,
  ShareResult,
  ShareFileContent,
} from './Share.js';

// Biometrics
export {
  Biometrics,
  biometricSupport,
  useBiometrics,
} from './Biometrics.js';
export type {
  BiometricType,
  BiometricSupport,
  AuthenticationOptions,
  AuthenticationResult,
  SecureStoreOptions,
} from './Biometrics.js';

// Permissions
export {
  Permissions,
  check,
  request,
  checkMultiple,
  requestMultiple,
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
} from './Permissions.js';
export type {
  PermissionType,
  PermissionStatus,
  PermissionResult,
  PermissionsResult,
  PermissionRationale,
} from './Permissions.js';

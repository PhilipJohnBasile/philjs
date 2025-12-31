/**
 * PhilJS Native APIs
 *
 * Native platform APIs for mobile development.
 */
export { Camera } from './Camera.js';
export type { CameraType, FlashMode, CameraPermissionStatus, PhotoOptions, VideoOptions, PhotoResult, VideoResult, CameraProps, } from './Camera.js';
export { Geolocation, currentLocation, locationPermission, locationError, useLocation, useWatchLocation, } from './Geolocation.js';
export type { LocationPermissionStatus, LocationAccuracy, LocationCoordinates, LocationResult, LocationOptions, GeocodingResult, HeadingResult, } from './Geolocation.js';
export { Storage, SecureStorage, MMKVStorage, getJSON, setJSON, updateJSON, useStorage, } from './Storage.js';
export type { StorageOptions, MultiGetResult, MultiSetInput, } from './Storage.js';
export { Haptics, impactLight, impactMedium, impactHeavy, notifySuccess, notifyWarning, notifyError, selectionFeedback, } from './Haptics.js';
export type { ImpactStyle, NotificationType, } from './Haptics.js';
export { Notifications, notificationPermission, pushToken, useNotificationReceived, useNotificationResponse, } from './Notifications.js';
export type { NotificationPermissionStatus, NotificationContent, NotificationAttachment, NotificationTrigger, DateComponents, LocationRegion, ScheduledNotification, NotificationResponse, NotificationCategory, NotificationAction, NotificationCategoryOptions, NotificationActionOptions, PushToken, } from './Notifications.js';
export { Clipboard, clipboardContent, useClipboard, } from './Clipboard.js';
export type { ClipboardContentType, ClipboardContent, } from './Clipboard.js';
export { Share } from './Share.js';
export type { ShareContent, ShareOptions, ShareResult, ShareFileContent, } from './Share.js';
export { Biometrics, biometricSupport, useBiometrics, } from './Biometrics.js';
export type { BiometricType, BiometricSupport, AuthenticationOptions, AuthenticationResult, SecureStoreOptions, } from './Biometrics.js';
export { Permissions, check, request, checkMultiple, requestMultiple, openSettings, isGranted, isBlocked, isUnavailable, canRequest, usePermission, usePermissions, PermissionGroups, requestGroup, checkGroup, } from './Permissions.js';
export type { PermissionType, PermissionStatus, PermissionResult, PermissionsResult, PermissionRationale, } from './Permissions.js';
//# sourceMappingURL=index.d.ts.map
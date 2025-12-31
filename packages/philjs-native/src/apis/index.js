/**
 * PhilJS Native APIs
 *
 * Native platform APIs for mobile development.
 */
// Camera
export { Camera } from './Camera.js';
// Geolocation
export { Geolocation, currentLocation, locationPermission, locationError, useLocation, useWatchLocation, } from './Geolocation.js';
// Storage
export { Storage, SecureStorage, MMKVStorage, getJSON, setJSON, updateJSON, useStorage, } from './Storage.js';
// Haptics
export { Haptics, impactLight, impactMedium, impactHeavy, notifySuccess, notifyWarning, notifyError, selectionFeedback, } from './Haptics.js';
// Notifications
export { Notifications, notificationPermission, pushToken, useNotificationReceived, useNotificationResponse, } from './Notifications.js';
// Clipboard
export { Clipboard, clipboardContent, useClipboard, } from './Clipboard.js';
// Share
export { Share } from './Share.js';
// Biometrics
export { Biometrics, biometricSupport, useBiometrics, } from './Biometrics.js';
// Permissions
export { Permissions, check, request, checkMultiple, requestMultiple, openSettings, isGranted, isBlocked, isUnavailable, canRequest, usePermission, usePermissions, PermissionGroups, requestGroup, checkGroup, } from './Permissions.js';
//# sourceMappingURL=index.js.map
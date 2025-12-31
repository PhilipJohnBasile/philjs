/**
 * PhilJS Native - Capacitor Plugins Index
 *
 * Exports all Capacitor plugin integrations for mobile development.
 */
// ============================================================================
// Camera Plugin
// ============================================================================
export { CapacitorCamera, cameraPermission, lastPhoto, useCameraPermissions, useLastPhoto, } from './camera.js';
// ============================================================================
// Geolocation Plugin
// ============================================================================
export { CapacitorGeolocation, currentPosition, positionError, geolocationPermission, useCurrentPosition, usePositionError, useGeolocationPermissions, useWatchPosition, } from './geolocation.js';
// ============================================================================
// Filesystem Plugin
// ============================================================================
export { CapacitorFilesystem, fileProgress, readJsonFile, writeJsonFile, useFileProgress, } from './filesystem.js';
// ============================================================================
// Haptics Plugin
// ============================================================================
export { CapacitorHaptics, impactLight, impactMedium, impactHeavy, impactSoft, impactRigid, notifySuccess, notifyWarning, notifyError, selectionFeedback, HapticPatterns, } from './haptics.js';
// ============================================================================
// Keyboard Plugin
// ============================================================================
export { CapacitorKeyboard, keyboardVisible, keyboardHeight, useKeyboardVisible, useKeyboardHeight, useKeyboard, useKeyboardEvents, getKeyboardOffset, scrollAboveKeyboard, } from './keyboard.js';
// ============================================================================
// Push Notifications Plugin
// ============================================================================
export { CapacitorPushNotifications, CapacitorLocalNotifications, PushNotifications, LocalNotifications, notificationPermission, pushToken, lastNotification, useNotificationPermission, usePushToken, useLastNotification, useNotificationReceived, useNotificationAction, } from './notifications.js';
// ============================================================================
// Storage Plugin
// ============================================================================
export { CapacitorStorage, SecureStorage, SessionStorage, storageReady, getJSON, setJSON, updateJSON, popJSON, useStorage, useStorageReady, } from './storage.js';
//# sourceMappingURL=index.js.map
/**
 * PhilJS Native - Capacitor Plugins Index
 *
 * Exports all Capacitor plugin integrations for mobile development.
 */
export { CapacitorCamera, cameraPermission, lastPhoto, useCameraPermissions, useLastPhoto, } from './camera.js';
export type { CameraSource, CameraResultType, CameraDirection, CameraPhotoOptions, CameraPhoto, CameraPermissionState, CameraPermissions, } from './camera.js';
export { CapacitorGeolocation, currentPosition, positionError, geolocationPermission, useCurrentPosition, usePositionError, useGeolocationPermissions, useWatchPosition, } from './geolocation.js';
export type { Coordinates, Position, PositionOptions, WatchPositionOptions, GeolocationPermissionState, GeolocationPermissions, GeocodingResult, } from './geolocation.js';
export { CapacitorFilesystem, fileProgress, readJsonFile, writeJsonFile, useFileProgress, } from './filesystem.js';
export type { Directory, Encoding, FileInfo, ReadFileOptions, ReadFileResult, WriteFileOptions, WriteFileResult, AppendFileOptions, DeleteFileOptions, MkdirOptions, RmdirOptions, ReaddirOptions, ReaddirResult, StatOptions, StatResult, CopyOptions, RenameOptions, DownloadFileOptions, DownloadFileResult, } from './filesystem.js';
export { CapacitorHaptics, impactLight, impactMedium, impactHeavy, impactSoft, impactRigid, notifySuccess, notifyWarning, notifyError, selectionFeedback, HapticPatterns, } from './haptics.js';
export type { ImpactStyle, NotificationType, HapticImpactOptions, HapticNotificationOptions, VibrationPattern, } from './haptics.js';
export { CapacitorKeyboard, keyboardVisible, keyboardHeight, useKeyboardVisible, useKeyboardHeight, useKeyboard, useKeyboardEvents, getKeyboardOffset, scrollAboveKeyboard, } from './keyboard.js';
export type { KeyboardInfo, KeyboardStyle, KeyboardResizeMode, KeyboardEvent, KeyboardConfig, } from './keyboard.js';
export { CapacitorPushNotifications, CapacitorLocalNotifications, PushNotifications, LocalNotifications, notificationPermission, pushToken, lastNotification, useNotificationPermission, usePushToken, useLastNotification, useNotificationReceived, useNotificationAction, } from './notifications.js';
export type { NotificationPermissionState, PushNotificationToken, NotificationAction, NotificationChannel, PushNotification, LocalNotificationOptions, NotificationAttachment, NotificationSchedule, NotificationActionPerformed, RegistrationError, } from './notifications.js';
export { CapacitorStorage, SecureStorage, SessionStorage, storageReady, getJSON, setJSON, updateJSON, popJSON, useStorage, useStorageReady, } from './storage.js';
export type { StorageItem, StorageConfig, EncryptionOptions, } from './storage.js';
//# sourceMappingURL=index.d.ts.map
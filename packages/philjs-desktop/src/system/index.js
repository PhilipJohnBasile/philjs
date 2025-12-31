/**
 * System APIs for PhilJS Desktop
 */
// Dialog
export { Dialog, openDialog, saveDialog, showMessage, showConfirm, showAsk, } from './dialog.js';
// File System
export { FileSystem, readTextFile, readBinaryFile, writeTextFile, writeBinaryFile, exists, createDir, removeFile, removeDir, readDir, copyFile, rename, stat, watchPath, } from './filesystem.js';
// Shell
export { Shell, openUrl, openPath, execute, spawn, runScript, powershell, sidecar, } from './shell.js';
// Clipboard
export { Clipboard, ClipboardError, readClipboard, writeClipboard, readClipboardImage, writeClipboardImage, clearClipboard, } from './clipboard.js';
// Notification
export { Notification, NotificationError, requestNotificationPermission, showNotification, notify, scheduleNotification, cancelNotification, } from './notification.js';
// Global Shortcut
export { GlobalShortcut, registerShortcut, unregisterShortcut, unregisterAllShortcuts, isShortcutRegistered, } from './shortcut.js';
// System Tray
export { SystemTray, createTray, setTrayIcon, setTrayTooltip, setTrayMenu, showTray, hideTray, destroyTray, trayItem, traySeparator, traySubmenu, } from './tray.js';
// Auto Launch
export { AutoLaunch, enableAutoLaunch, disableAutoLaunch, isAutoLaunchEnabled, toggleAutoLaunch, } from './autolaunch.js';
//# sourceMappingURL=index.js.map
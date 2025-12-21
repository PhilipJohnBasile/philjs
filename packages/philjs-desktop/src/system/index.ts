/**
 * System APIs for PhilJS Desktop
 */

// Dialog
export {
  Dialog,
  openDialog,
  saveDialog,
  showMessage,
  showConfirm,
  showAsk,
} from './dialog';
export type {
  OpenDialogOptions,
  SaveDialogOptions,
  DialogFilter,
  MessageDialogOptions,
  ConfirmDialogOptions,
} from './dialog';

// File System
export {
  FileSystem,
  readTextFile,
  readBinaryFile,
  writeTextFile,
  writeBinaryFile,
  exists,
  createDir,
  removeFile,
  removeDir,
  readDir,
  copyFile,
  rename,
  stat,
  watchPath,
} from './filesystem';
export type {
  FileEntry,
  ReadOptions,
  WriteOptions,
  CopyOptions,
  BaseDirectory,
} from './filesystem';

// Shell
export {
  Shell,
  openUrl,
  openPath,
  execute,
  spawn,
  runScript,
  powershell,
  sidecar,
} from './shell';
export type {
  CommandOptions,
  CommandOutput,
  SpawnedProcess,
} from './shell';

// Clipboard
export {
  Clipboard,
  readClipboard,
  writeClipboard,
  readClipboardImage,
  writeClipboardImage,
  clearClipboard,
} from './clipboard';

// Notification
export {
  Notification,
  requestNotificationPermission,
  showNotification,
  notify,
  scheduleNotification,
  cancelNotification,
} from './notification';
export type {
  NotificationOptions,
  NotificationAction,
  ScheduledNotificationOptions,
} from './notification';

// Global Shortcut
export {
  GlobalShortcut,
  registerShortcut,
  unregisterShortcut,
  unregisterAllShortcuts,
  isShortcutRegistered,
} from './shortcut';
export type {
  ShortcutHandler,
} from './shortcut';

// System Tray
export {
  SystemTray,
  createTray,
  setTrayIcon,
  setTrayTooltip,
  setTrayMenu,
  showTray,
  hideTray,
  destroyTray,
  trayItem,
  traySeparator,
  traySubmenu,
} from './tray';
export type {
  TrayOptions,
  TrayMenuItem,
  TrayClickEvent,
} from './tray';

// Auto Launch
export {
  AutoLaunch,
  enableAutoLaunch,
  disableAutoLaunch,
  isAutoLaunchEnabled,
  toggleAutoLaunch,
} from './autolaunch';
export type {
  AutoLaunchOptions,
} from './autolaunch';

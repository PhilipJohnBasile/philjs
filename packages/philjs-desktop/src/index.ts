/**
 * PhilJS Desktop - Desktop Application Development with Tauri
 *
 * A comprehensive desktop application framework that provides:
 * - Native window management
 * - System API access (dialogs, file system, clipboard, etc.)
 * - IPC between JavaScript and Rust
 * - App lifecycle management
 * - Electron compatibility layer for easy migration
 *
 * @example
 * ```typescript
 * import { createDesktopApp, useTauri, invoke } from 'philjs-desktop';
 *
 * createDesktopApp({
 *   component: App,
 *   config: {
 *     appName: 'My App',
 *     window: { width: 1024, height: 768 }
 *   }
 * });
 *
 * // Access Tauri APIs
 * const { isTauri } = useTauri();
 *
 * // Invoke Rust commands
 * const result = await invoke('my_command', { arg: 'value' });
 * ```
 */

// Tauri Integration
export {
  // Context and hooks
  initTauriContext,
  getTauriContext,
  useTauri,
  isTauri,
  resetTauriContext,
  // App creation
  createDesktopApp,
  onBeforeClose,
  isAppInitialized,
  getLoadedPlugins,
  createDefaultConfig,
  getAppVersion,
  getAppName,
  getTauriVersion,
  // Command invocation
  invoke,
  createCommand,
  defineCommand,
  batchInvoke,
  invokeWithTimeout,
  invokeWithRetry,
  // Events
  listen,
  once,
  emit,
  onTauriEvent,
  createEventEmitter,
  createTypedListener,
  waitForEvent,
  removeAllListeners,
  removeAllEventListeners,
  TauriEvents,
} from './tauri';

export type {
  TauriConfig,
  WindowConfig,
  TauriContext,
  AppInfo,
  Event,
  EventCallback,
  UnlistenFn,
  InvokeArgs,
  TauriPlugin,
  DesktopAppOptions,
  CommandDefinition,
  TypedCommand,
  TauriEventType,
} from './tauri';

// Window Management
export {
  WindowHandle,
  createWindow,
  getCurrentWindow,
  useWindow,
  getAllWindows,
  getWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  setTitle,
  setSize,
  setFullscreen,
  setAlwaysOnTop,
  center,
  setPosition,
  getPrimaryMonitor,
  getAllMonitors,
} from './window';

export type {
  WindowOptions,
  WindowSize,
  WindowPosition,
  PhysicalSize,
  PhysicalPosition,
  Monitor,
  WindowState,
} from './window';

// System APIs
export {
  // Dialog
  Dialog,
  openDialog,
  saveDialog,
  showMessage,
  showConfirm,
  showAsk,
  // File System
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
  // Shell
  Shell,
  openUrl,
  openPath,
  execute,
  spawn,
  runScript,
  powershell,
  sidecar,
  // Clipboard
  Clipboard,
  ClipboardError,
  readClipboard,
  writeClipboard,
  readClipboardImage,
  writeClipboardImage,
  clearClipboard,
  // Notification
  Notification,
  NotificationError,
  requestNotificationPermission,
  showNotification,
  notify,
  scheduleNotification,
  cancelNotification,
  // Global Shortcut
  GlobalShortcut,
  registerShortcut,
  unregisterShortcut,
  unregisterAllShortcuts,
  isShortcutRegistered,
  // System Tray
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
  // Auto Launch
  AutoLaunch,
  enableAutoLaunch,
  disableAutoLaunch,
  isAutoLaunchEnabled,
  toggleAutoLaunch,
} from './system';

export type {
  OpenDialogOptions,
  SaveDialogOptions,
  DialogFilter,
  MessageDialogOptions,
  ConfirmDialogOptions,
  FileEntry,
  ReadOptions,
  WriteOptions,
  CopyOptions,
  BaseDirectory,
  CommandOptions,
  CommandOutput,
  SpawnedProcess,
  NotificationOptions,
  NotificationAction,
  ScheduledNotificationOptions,
  ShortcutHandler,
  TrayOptions,
  TrayMenuItem,
  TrayClickEvent,
  AutoLaunchOptions,
} from './system';

// IPC Bridge
export {
  createIPCBridge,
  registerCommand,
  exposeToRust,
  createTypedIPC,
  createChannel,
  createRequestChannel,
} from './ipc';

export type {
  IPCBridge,
  IPCBridgeOptions,
  TypedIPCSchema,
} from './ipc';

// Lifecycle
export {
  initLifecycle,
  destroyLifecycle,
  onAppReady,
  onWindowClose,
  onBeforeQuit,
  onWillQuit,
  onQuit,
  onFocus,
  onBlur,
  onAppUpdate,
  onUpdateDownloaded,
  checkForUpdates,
  installUpdate,
  restartApp,
  quitApp,
  hideApp,
  showApp,
  isAppReady,
  useLifecycle,
  createAppState,
} from './lifecycle';

export type {
  UpdateInfo,
  UpdateStatus,
  LifecycleEvent,
  AppState,
} from './lifecycle';

// Electron Compatibility Layer
// These exports are disabled pending TypeScript compatibility fixes.
// PhilJS Desktop uses Tauri as the primary desktop runtime.
// For Electron migration, see docs/migration/electron-to-tauri.md
//
// export {
//   BrowserWindow,
//   ipcMain,
//   ipcRenderer,
//   contextBridge,
//   app,
//   createMigrationHelper,
//   ElectronToTauriMapper,
// } from './electron';
//
// export type {
//   BrowserWindowOptions,
//   IpcEvent,
// } from './electron';

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
export { initTauriContext, getTauriContext, useTauri, isTauri, resetTauriContext, createDesktopApp, onBeforeClose, isAppInitialized, getLoadedPlugins, createDefaultConfig, getAppVersion, getAppName, getTauriVersion, invoke, createCommand, defineCommand, batchInvoke, invokeWithTimeout, invokeWithRetry, listen, once, emit, onTauriEvent, createEventEmitter, createTypedListener, waitForEvent, removeAllListeners, removeAllEventListeners, TauriEvents, } from './tauri/index.js';
export type { TauriConfig, WindowConfig, TauriContext, AppInfo, Event, EventCallback, UnlistenFn, InvokeArgs, TauriPlugin, DesktopAppOptions, CommandDefinition, TypedCommand, TauriEventType, } from './tauri/index.js';
export { WindowHandle, createWindow, getCurrentWindow, useWindow, getAllWindows, getWindow, closeWindow, minimizeWindow, maximizeWindow, setTitle, setSize, setFullscreen, setAlwaysOnTop, center, setPosition, getPrimaryMonitor, getAllMonitors, } from './window.js';
export type { WindowOptions, WindowSize, WindowPosition, PhysicalSize, PhysicalPosition, Monitor, WindowState, } from './window.js';
export { Dialog, openDialog, saveDialog, showMessage, showConfirm, showAsk, FileSystem, readTextFile, readBinaryFile, writeTextFile, writeBinaryFile, exists, createDir, removeFile, removeDir, readDir, copyFile, rename, stat, watchPath, Shell, openUrl, openPath, execute, spawn, runScript, powershell, sidecar, Clipboard, ClipboardError, readClipboard, writeClipboard, readClipboardImage, writeClipboardImage, clearClipboard, Notification, NotificationError, requestNotificationPermission, showNotification, notify, scheduleNotification, cancelNotification, GlobalShortcut, registerShortcut, unregisterShortcut, unregisterAllShortcuts, isShortcutRegistered, SystemTray, createTray, setTrayIcon, setTrayTooltip, setTrayMenu, showTray, hideTray, destroyTray, trayItem, traySeparator, traySubmenu, AutoLaunch, enableAutoLaunch, disableAutoLaunch, isAutoLaunchEnabled, toggleAutoLaunch, } from './system/index.js';
export type { OpenDialogOptions, SaveDialogOptions, DialogFilter, MessageDialogOptions, ConfirmDialogOptions, FileEntry, ReadOptions, WriteOptions, CopyOptions, BaseDirectory, CommandOptions, CommandOutput, SpawnedProcess, NotificationOptions, NotificationAction, ScheduledNotificationOptions, ShortcutHandler, TrayOptions, TrayMenuItem, TrayClickEvent, AutoLaunchOptions, } from './system/index.js';
export { createIPCBridge, registerCommand, exposeToRust, createTypedIPC, createChannel, createRequestChannel, } from './ipc.js';
export type { IPCBridge, IPCBridgeOptions, TypedIPCSchema, } from './ipc.js';
export { initLifecycle, destroyLifecycle, onAppReady, onWindowClose, onBeforeQuit, onWillQuit, onQuit, onFocus, onBlur, onAppUpdate, onUpdateDownloaded, checkForUpdates, installUpdate, restartApp, quitApp, hideApp, showApp, isAppReady, useLifecycle, createAppState, } from './lifecycle.js';
export type { UpdateInfo, UpdateStatus, LifecycleEvent, AppState, } from './lifecycle.js';
//# sourceMappingURL=index.d.ts.map
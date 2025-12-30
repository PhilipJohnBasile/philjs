/**
 * PhilJS Native - Tauri Type Definitions
 *
 * Complete type definitions for Tauri APIs to enable proper TypeScript
 * checking without @ts-nocheck directives.
 */

// ============================================================================
// Global Window Augmentation
// ============================================================================

declare global {
  interface Window {
    __TAURI__?: TauriInternals;
    __TAURI_IPC__?: TauriIPC;
  }
}

// ============================================================================
// Core Tauri Types
// ============================================================================

/**
 * Tauri IPC handler
 */
export interface TauriIPC {
  (message: TauriIPCMessage): void;
}

/**
 * Tauri IPC message
 */
export interface TauriIPCMessage {
  cmd: string;
  callback: number;
  error: number;
  payload: unknown;
  options?: Record<string, unknown>;
}

/**
 * Main Tauri internals object
 */
export interface TauriInternals {
  invoke: TauriInvoke;
  tauri?: {
    invoke: TauriInvoke;
  };
  event?: TauriEventModule;
  window?: TauriWindowModule;
  app?: TauriAppModule;
  process?: TauriProcessModule;
  fs?: TauriFsModule;
  dialog?: TauriDialogModule;
  path?: TauriPathModule;
  shell?: TauriShellModule;
  clipboard?: TauriClipboardModule;
  notification?: TauriNotificationModule;
  globalShortcut?: TauriGlobalShortcutModule;
  os?: TauriOsModule;
  updater?: TauriUpdaterModule;
}

/**
 * Tauri invoke function
 */
export type TauriInvoke = <T = unknown>(
  cmd: string,
  args?: Record<string, unknown>
) => Promise<T>;

// ============================================================================
// Event Module
// ============================================================================

/**
 * Tauri event payload
 */
export interface TauriEvent<T = unknown> {
  event: string;
  windowLabel: string;
  id: number;
  payload: T;
}

/**
 * Event handler function
 */
export type TauriEventHandler<T = unknown> = (event: TauriEvent<T>) => void;

/**
 * Unlisten function returned by event listeners
 */
export type TauriUnlistenFn = () => void;

/**
 * Event module interface
 */
export interface TauriEventModule {
  listen: <T = unknown>(
    event: string,
    handler: TauriEventHandler<T>
  ) => Promise<TauriUnlistenFn>;
  once: <T = unknown>(
    event: string,
    handler: TauriEventHandler<T>
  ) => Promise<TauriUnlistenFn>;
  emit: (event: string, payload?: unknown) => Promise<void>;
}

// ============================================================================
// Window Module
// ============================================================================

/**
 * Logical size
 */
export interface TauriLogicalSize {
  width: number;
  height: number;
}

/**
 * Logical position
 */
export interface TauriLogicalPosition {
  x: number;
  y: number;
}

/**
 * Physical size
 */
export interface TauriPhysicalSize {
  width: number;
  height: number;
}

/**
 * Physical position
 */
export interface TauriPhysicalPosition {
  x: number;
  y: number;
}

/**
 * Window options for creating new windows
 */
export interface TauriWindowOptions {
  url?: string;
  title?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  fullscreen?: boolean;
  focus?: boolean;
  center?: boolean;
  x?: number;
  y?: number;
  decorations?: boolean;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
  fileDropEnabled?: boolean;
  transparent?: boolean;
  maximized?: boolean;
  visible?: boolean;
  closable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
}

/**
 * Monitor information
 */
export interface TauriMonitor {
  name: string | null;
  size: TauriPhysicalSize;
  position: TauriPhysicalPosition;
  scaleFactor: number;
}

/**
 * Window effects (Windows 10/11)
 */
export interface TauriWindowEffects {
  effects: Array<'blur' | 'acrylic' | 'mica' | 'tabbed'>;
}

/**
 * Webview window instance
 */
export interface TauriWebviewWindow {
  label: string;
  close: () => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  unminimize: () => Promise<void>;
  show: () => Promise<void>;
  hide: () => Promise<void>;
  setFullscreen: (fullscreen: boolean) => Promise<void>;
  setTitle: (title: string) => Promise<void>;
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>;
  setDecorations: (decorations: boolean) => Promise<void>;
  setResizable: (resizable: boolean) => Promise<void>;
  setClosable: (closable: boolean) => Promise<void>;
  setMinimizable: (minimizable: boolean) => Promise<void>;
  setMaximizable: (maximizable: boolean) => Promise<void>;
  setSkipTaskbar: (skip: boolean) => Promise<void>;
  setIgnoreCursorEvents: (ignore: boolean) => Promise<void>;
  setIcon: (icon: string | Uint8Array) => Promise<void>;
  setFocus: () => Promise<void>;
  center: () => Promise<void>;
  setSize: (size: TauriLogicalSize) => Promise<void>;
  setMinSize: (size: TauriLogicalSize) => Promise<void>;
  setMaxSize: (size: TauriLogicalSize) => Promise<void>;
  setPosition: (position: TauriLogicalPosition) => Promise<void>;
  innerSize: () => Promise<TauriPhysicalSize>;
  outerSize: () => Promise<TauriPhysicalSize>;
  innerPosition: () => Promise<TauriPhysicalPosition>;
  outerPosition: () => Promise<TauriPhysicalPosition>;
  isMaximized: () => Promise<boolean>;
  isMinimized: () => Promise<boolean>;
  isFullscreen: () => Promise<boolean>;
  isFocused: () => Promise<boolean>;
  isVisible: () => Promise<boolean>;
  isDecorated: () => Promise<boolean>;
  isResizable: () => Promise<boolean>;
  isClosable: () => Promise<boolean>;
  isMinimizable: () => Promise<boolean>;
  isMaximizable: () => Promise<boolean>;
  theme: () => Promise<'light' | 'dark' | null>;
  currentMonitor: () => Promise<TauriMonitor | null>;
  setEffects: (effects: TauriWindowEffects) => Promise<void>;
  clearEffects: () => Promise<void>;
}

/**
 * Webview window constructor
 */
export interface TauriWebviewWindowConstructor {
  new (label: string, options?: TauriWindowOptions): TauriWebviewWindow;
  getByLabel: (label: string) => TauriWebviewWindow | null;
}

/**
 * Logical size constructor
 */
export interface TauriLogicalSizeConstructor {
  new (width: number, height: number): TauriLogicalSize;
}

/**
 * Logical position constructor
 */
export interface TauriLogicalPositionConstructor {
  new (x: number, y: number): TauriLogicalPosition;
}

/**
 * Window module interface
 */
export interface TauriWindowModule {
  getCurrent: () => TauriWebviewWindow;
  appWindow: TauriWebviewWindow;
  getAll: () => Promise<TauriWebviewWindow[]>;
  WebviewWindow: TauriWebviewWindowConstructor;
  LogicalSize: TauriLogicalSizeConstructor;
  LogicalPosition: TauriLogicalPositionConstructor;
  primaryMonitor: () => Promise<TauriMonitor | null>;
  availableMonitors: () => Promise<TauriMonitor[]>;
}

// ============================================================================
// App Module
// ============================================================================

/**
 * App module interface
 */
export interface TauriAppModule {
  getName: () => Promise<string>;
  getVersion: () => Promise<string>;
  getTauriVersion: () => Promise<string>;
  show: () => Promise<void>;
  hide: () => Promise<void>;
}

// ============================================================================
// Process Module
// ============================================================================

/**
 * Process module interface
 */
export interface TauriProcessModule {
  exit: (exitCode?: number) => Promise<void>;
  relaunch: () => Promise<void>;
}

// ============================================================================
// Filesystem Module
// ============================================================================

/**
 * File entry
 */
export interface TauriFileEntry {
  path: string;
  name?: string;
  children?: TauriFileEntry[];
}

/**
 * FS options
 */
export interface TauriFsOptions {
  dir?: TauriBaseDirectory;
}

/**
 * Base directories
 */
export type TauriBaseDirectory =
  | 'App'
  | 'AppConfig'
  | 'AppData'
  | 'AppLocalData'
  | 'AppCache'
  | 'AppLog'
  | 'Audio'
  | 'Cache'
  | 'Config'
  | 'Data'
  | 'Desktop'
  | 'Document'
  | 'Download'
  | 'Executable'
  | 'Font'
  | 'Home'
  | 'LocalData'
  | 'Log'
  | 'Picture'
  | 'Public'
  | 'Resource'
  | 'Runtime'
  | 'Temp'
  | 'Template'
  | 'Video';

/**
 * Filesystem module interface
 */
export interface TauriFsModule {
  readTextFile: (path: string, options?: TauriFsOptions) => Promise<string>;
  readBinaryFile: (path: string, options?: TauriFsOptions) => Promise<Uint8Array>;
  writeTextFile: (path: string, contents: string, options?: TauriFsOptions) => Promise<void>;
  writeBinaryFile: (path: string, contents: ArrayBuffer | Uint8Array, options?: TauriFsOptions) => Promise<void>;
  readDir: (path: string, options?: TauriFsOptions & { recursive?: boolean }) => Promise<TauriFileEntry[]>;
  createDir: (path: string, options?: TauriFsOptions & { recursive?: boolean }) => Promise<void>;
  removeDir: (path: string, options?: TauriFsOptions & { recursive?: boolean }) => Promise<void>;
  copyFile: (source: string, destination: string, options?: TauriFsOptions) => Promise<void>;
  removeFile: (path: string, options?: TauriFsOptions) => Promise<void>;
  renameFile: (oldPath: string, newPath: string, options?: TauriFsOptions) => Promise<void>;
  exists: (path: string, options?: TauriFsOptions) => Promise<boolean>;
}

// ============================================================================
// Dialog Module
// ============================================================================

/**
 * Open dialog options
 */
export interface TauriOpenDialogOptions {
  defaultPath?: string;
  directory?: boolean;
  filters?: TauriDialogFilter[];
  multiple?: boolean;
  title?: string;
}

/**
 * Save dialog options
 */
export interface TauriSaveDialogOptions {
  defaultPath?: string;
  filters?: TauriDialogFilter[];
  title?: string;
}

/**
 * Dialog filter
 */
export interface TauriDialogFilter {
  name: string;
  extensions: string[];
}

/**
 * Message dialog options
 */
export interface TauriMessageDialogOptions {
  title?: string;
  type?: 'info' | 'warning' | 'error';
  okLabel?: string;
}

/**
 * Confirm dialog options
 */
export interface TauriConfirmDialogOptions {
  title?: string;
  type?: 'info' | 'warning' | 'error';
  okLabel?: string;
  cancelLabel?: string;
}

/**
 * Dialog module interface
 */
export interface TauriDialogModule {
  open: (options?: TauriOpenDialogOptions) => Promise<string | string[] | null>;
  save: (options?: TauriSaveDialogOptions) => Promise<string | null>;
  message: (message: string, options?: TauriMessageDialogOptions) => Promise<void>;
  ask: (message: string, options?: TauriConfirmDialogOptions) => Promise<boolean>;
  confirm: (message: string, options?: TauriConfirmDialogOptions) => Promise<boolean>;
}

// ============================================================================
// Path Module
// ============================================================================

/**
 * Path module interface
 */
export interface TauriPathModule {
  appConfigDir: () => Promise<string>;
  appDataDir: () => Promise<string>;
  appLocalDataDir: () => Promise<string>;
  appCacheDir: () => Promise<string>;
  appLogDir: () => Promise<string>;
  audioDir: () => Promise<string>;
  cacheDir: () => Promise<string>;
  configDir: () => Promise<string>;
  dataDir: () => Promise<string>;
  desktopDir: () => Promise<string>;
  documentDir: () => Promise<string>;
  downloadDir: () => Promise<string>;
  executableDir: () => Promise<string>;
  fontDir: () => Promise<string>;
  homeDir: () => Promise<string>;
  localDataDir: () => Promise<string>;
  pictureDir: () => Promise<string>;
  publicDir: () => Promise<string>;
  resourceDir: () => Promise<string>;
  runtimeDir: () => Promise<string>;
  templateDir: () => Promise<string>;
  videoDir: () => Promise<string>;
  tempDir: () => Promise<string>;
  resolve: (...paths: string[]) => Promise<string>;
  normalize: (path: string) => Promise<string>;
  join: (...paths: string[]) => Promise<string>;
  dirname: (path: string) => Promise<string>;
  extname: (path: string) => Promise<string>;
  basename: (path: string, ext?: string) => Promise<string>;
  isAbsolute: (path: string) => Promise<boolean>;
  sep: string;
  delimiter: string;
}

// ============================================================================
// Shell Module
// ============================================================================

/**
 * Shell command options
 */
export interface TauriShellCommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  encoding?: string;
}

/**
 * Shell output
 */
export interface TauriShellOutput {
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
}

/**
 * Shell module interface
 */
export interface TauriShellModule {
  open: (path: string, openWith?: string) => Promise<void>;
  Command: {
    new (program: string, args?: string | string[], options?: TauriShellCommandOptions): TauriCommand;
    sidecar: (program: string, args?: string | string[], options?: TauriShellCommandOptions) => TauriCommand;
  };
}

/**
 * Command instance
 */
export interface TauriCommand {
  execute: () => Promise<TauriShellOutput>;
  spawn: () => Promise<TauriChildProcess>;
  on: (event: 'close' | 'error', handler: (data: unknown) => void) => void;
  stdout: {
    on: (event: 'data', handler: (line: string) => void) => void;
  };
  stderr: {
    on: (event: 'data', handler: (line: string) => void) => void;
  };
}

/**
 * Child process
 */
export interface TauriChildProcess {
  pid: number;
  kill: () => Promise<void>;
  write: (data: string | Uint8Array) => Promise<void>;
}

// ============================================================================
// Clipboard Module
// ============================================================================

/**
 * Clipboard module interface
 */
export interface TauriClipboardModule {
  readText: () => Promise<string>;
  writeText: (text: string) => Promise<void>;
}

// ============================================================================
// Notification Module
// ============================================================================

/**
 * Notification options
 */
export interface TauriNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  sound?: string;
}

/**
 * Notification module interface
 */
export interface TauriNotificationModule {
  isPermissionGranted: () => Promise<boolean>;
  requestPermission: () => Promise<'granted' | 'denied' | 'default'>;
  sendNotification: (options: string | TauriNotificationOptions) => void;
}

// ============================================================================
// Global Shortcut Module
// ============================================================================

/**
 * Global shortcut module interface
 */
export interface TauriGlobalShortcutModule {
  register: (shortcut: string, handler: () => void) => Promise<void>;
  registerAll: (shortcuts: string[], handler: () => void) => Promise<void>;
  unregister: (shortcut: string) => Promise<void>;
  unregisterAll: () => Promise<void>;
  isRegistered: (shortcut: string) => Promise<boolean>;
}

// ============================================================================
// OS Module
// ============================================================================

/**
 * OS type
 */
export type TauriOsType = 'Linux' | 'Darwin' | 'Windows_NT';

/**
 * OS module interface
 */
export interface TauriOsModule {
  platform: () => Promise<string>;
  version: () => Promise<string>;
  type: () => Promise<TauriOsType>;
  arch: () => Promise<string>;
  tempdir: () => Promise<string>;
  hostname: () => Promise<string>;
  locale: () => Promise<string | null>;
}

// ============================================================================
// Updater Module
// ============================================================================

/**
 * Update manifest
 */
export interface TauriUpdateManifest {
  version: string;
  date: string;
  body: string;
}

/**
 * Update result
 */
export interface TauriUpdateResult {
  shouldUpdate: boolean;
  manifest?: TauriUpdateManifest;
}

/**
 * Updater module interface
 */
export interface TauriUpdaterModule {
  checkUpdate: () => Promise<TauriUpdateResult>;
  installUpdate: () => Promise<void>;
  onUpdaterEvent: (handler: (event: TauriUpdaterEvent) => void) => Promise<TauriUnlistenFn>;
}

/**
 * Updater event
 */
export interface TauriUpdaterEvent {
  status: 'PENDING' | 'ERROR' | 'DONE' | 'UPTODATE';
  error?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is TauriInternals
 */
export function isTauriInternals(value: unknown): value is TauriInternals {
  return (
    typeof value === 'object' &&
    value !== null &&
    'invoke' in value &&
    typeof (value as TauriInternals).invoke === 'function'
  );
}

/**
 * Check if value is TauriWebviewWindow
 */
export function isTauriWebviewWindow(value: unknown): value is TauriWebviewWindow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    'close' in value &&
    typeof (value as TauriWebviewWindow).close === 'function'
  );
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract return type from async function
 */
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> =
  T extends (...args: unknown[]) => Promise<infer R> ? R : never;

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export {};

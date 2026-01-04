// @ts-nocheck
/**
 * PhilJS Native - Tauri Integration
 *
 * Provides a unified interface to Tauri APIs for building
 * cross-platform desktop applications with web technologies.
 */

import { signal, effect, batch, type Signal } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

/**
 * Tauri invoke options
 */
export interface InvokeOptions {
  /** Headers for the command (if applicable) */
  headers?: Record<string, string>;
}

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
 * Event listener handle
 */
export interface EventHandle {
  unlisten: () => void;
}

/**
 * Window options
 */
export interface WindowOptions {
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
 * Tauri configuration
 */
export interface TauriConfig {
  appName: string;
  appVersion: string;
  tauriVersion: string;
}

// ============================================================================
// Tauri Detection
// ============================================================================

/**
 * Check if running in Tauri
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window || '__TAURI_IPC__' in window;
}

/**
 * Check if Tauri API is available
 */
export function hasTauriAPI(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).__TAURI__;
}

/**
 * Get Tauri internals
 */
export function getTauriInternals(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).__TAURI__;
}

/**
 * Get Tauri invoke handler
 */
export function getTauriInvoke(): ((cmd: string, args?: any) => Promise<any>) | null {
  const internals = getTauriInternals();
  return internals?.invoke || internals?.tauri?.invoke || null;
}

// ============================================================================
// Command Invocation
// ============================================================================

/**
 * Invoke a Tauri command
 */
export async function invoke<T = unknown>(
  cmd: string,
  args?: Record<string, unknown>,
  options?: InvokeOptions
): Promise<T> {
  if (!isTauri()) {
    throw new Error('Tauri is not available. This function only works in a Tauri app.');
  }

  const tauriInvoke = getTauriInvoke();
  if (!tauriInvoke) {
    throw new Error('Tauri invoke API not found');
  }

  try {
    const result = await tauriInvoke(cmd, args);
    return result as T;
  } catch (error) {
    throw new Error(`Tauri command "${cmd}" failed: ${error}`);
  }
}

/**
 * Invoke with automatic error handling
 */
export async function invokeSafe<T = unknown>(
  cmd: string,
  args?: Record<string, unknown>,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.warn(`Tauri command "${cmd}" failed:`, error);
    return defaultValue;
  }
}

/**
 * Create a typed command invoker
 */
export function createCommand<TArgs extends Record<string, unknown>, TResult>(
  name: string
): (args?: TArgs) => Promise<TResult> {
  return (args?: TArgs) => invoke<TResult>(name, args);
}

// ============================================================================
// Event System
// ============================================================================

/**
 * Active event listeners
 */
const eventListeners = new Map<string, Set<(event: TauriEvent) => void>>();
const unlistenHandles = new Map<string, () => void>();

/**
 * Listen to a Tauri event
 */
export async function listen<T = unknown>(
  event: string,
  handler: (event: TauriEvent<T>) => void
): Promise<() => void> {
  if (!isTauri()) {
    // Return no-op for non-Tauri environment
    return () => {};
  }

  const internals = getTauriInternals();
  const listenFn = internals?.event?.listen;

  if (!listenFn) {
    // Fallback: use custom event system
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(handler as any);

    return () => {
      eventListeners.get(event)?.delete(handler as any);
    };
  }

  const unlisten = await listenFn(event, handler);
  return unlisten;
}

/**
 * Listen to an event once
 */
export async function once<T = unknown>(
  event: string,
  handler: (event: TauriEvent<T>) => void
): Promise<() => void> {
  if (!isTauri()) {
    return () => {};
  }

  const internals = getTauriInternals();
  const onceFn = internals?.event?.once;

  if (!onceFn) {
    // Fallback: wrap handler to auto-remove
    const wrappedHandler = (e: TauriEvent<T>) => {
      eventListeners.get(event)?.delete(wrappedHandler as any);
      handler(e);
    };

    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(wrappedHandler as any);

    return () => {
      eventListeners.get(event)?.delete(wrappedHandler as any);
    };
  }

  const unlisten = await onceFn(event, handler);
  return unlisten;
}

/**
 * Emit a Tauri event
 */
export async function emit(
  event: string,
  payload?: unknown
): Promise<void> {
  if (!isTauri()) {
    // Emit to local listeners
    const listeners = eventListeners.get(event);
    if (listeners) {
      const tauriEvent: TauriEvent = {
        event,
        windowLabel: 'main',
        id: Date.now(),
        payload,
      };
      listeners.forEach((handler) => handler(tauriEvent));
    }
    return;
  }

  const internals = getTauriInternals();
  const emitFn = internals?.event?.emit;

  if (emitFn) {
    await emitFn(event, payload);
  }
}

// ============================================================================
// Window Management
// ============================================================================

/**
 * Current window label
 */
export const currentWindowLabel: Signal<string> = signal('main');

/**
 * Window focused state
 */
export const windowFocused: Signal<boolean> = signal(true);

/**
 * Window fullscreen state
 */
export const windowFullscreen: Signal<boolean> = signal(false);

/**
 * Window minimized state
 */
export const windowMinimized: Signal<boolean> = signal(false);

/**
 * Window maximized state
 */
export const windowMaximized: Signal<boolean> = signal(false);

/**
 * Get the current window
 */
export function getCurrentWindow(): any {
  if (!isTauri()) return null;

  const internals = getTauriInternals();
  return internals?.window?.getCurrent?.() || internals?.window?.appWindow;
}

/**
 * Create a new window
 */
export async function createWindow(
  label: string,
  options?: WindowOptions
): Promise<any> {
  if (!isTauri()) {
    // Fallback: open a new browser window
    const url = options?.url || '/';
    const features = [
      options?.width ? `width=${options.width}` : '',
      options?.height ? `height=${options.height}` : '',
      options?.resizable === false ? 'resizable=no' : '',
    ]
      .filter(Boolean)
      .join(',');

    window.open(url, label, features);
    return null;
  }

  const internals = getTauriInternals();
  const WebviewWindow = internals?.window?.WebviewWindow;

  if (!WebviewWindow) {
    throw new Error('Tauri WebviewWindow API not found');
  }

  const webview = new WebviewWindow(label, options);
  return webview;
}

/**
 * Get all windows
 */
export async function getAllWindows(): Promise<any[]> {
  if (!isTauri()) return [];

  const internals = getTauriInternals();
  const getAll = internals?.window?.getAll;

  if (!getAll) return [];

  return await getAll();
}

/**
 * Close current window
 */
export async function closeWindow(): Promise<void> {
  if (!isTauri()) {
    window.close();
    return;
  }

  const win = getCurrentWindow();
  await win?.close?.();
}

/**
 * Minimize current window
 */
export async function minimizeWindow(): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  await win?.minimize?.();
  windowMinimized.set(true);
}

/**
 * Maximize current window
 */
export async function maximizeWindow(): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  await win?.maximize?.();
  windowMaximized.set(true);
}

/**
 * Unmaximize current window
 */
export async function unmaximizeWindow(): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  await win?.unmaximize?.();
  windowMaximized.set(false);
}

/**
 * Toggle maximize
 */
export async function toggleMaximize(): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  await win?.toggleMaximize?.();
  windowMaximized.set(!windowMaximized());
}

/**
 * Set fullscreen
 */
export async function setFullscreen(fullscreen: boolean): Promise<void> {
  if (!isTauri()) {
    if (fullscreen && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else if (!fullscreen && document.exitFullscreen) {
      await document.exitFullscreen();
    }
    windowFullscreen.set(fullscreen);
    return;
  }

  const win = getCurrentWindow();
  await win?.setFullscreen?.(fullscreen);
  windowFullscreen.set(fullscreen);
}

/**
 * Set window title
 */
export async function setTitle(title: string): Promise<void> {
  if (!isTauri()) {
    document.title = title;
    return;
  }

  const win = getCurrentWindow();
  await win?.setTitle?.(title);
}

/**
 * Set window always on top
 */
export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  await win?.setAlwaysOnTop?.(alwaysOnTop);
}

/**
 * Center window
 */
export async function centerWindow(): Promise<void> {
  if (!isTauri()) return;

  const win = getCurrentWindow();
  await win?.center?.();
}

/**
 * Set window size
 */
export async function setSize(width: number, height: number): Promise<void> {
  if (!isTauri()) {
    window.resizeTo(width, height);
    return;
  }

  const win = getCurrentWindow();
  const internals = getTauriInternals();
  const LogicalSize = internals?.window?.LogicalSize;

  if (LogicalSize) {
    await win?.setSize?.(new LogicalSize(width, height));
  }
}

/**
 * Set window position
 */
export async function setPosition(x: number, y: number): Promise<void> {
  if (!isTauri()) {
    window.moveTo(x, y);
    return;
  }

  const win = getCurrentWindow();
  const internals = getTauriInternals();
  const LogicalPosition = internals?.window?.LogicalPosition;

  if (LogicalPosition) {
    await win?.setPosition?.(new LogicalPosition(x, y));
  }
}

// ============================================================================
// App Information
// ============================================================================

/**
 * App name
 */
export const appName: Signal<string> = signal('');

/**
 * App version
 */
export const appVersion: Signal<string> = signal('');

/**
 * Tauri version
 */
export const tauriVersion: Signal<string> = signal('');

/**
 * Get app name
 */
export async function getAppName(): Promise<string> {
  if (!isTauri()) return document.title || 'App';

  try {
    const name = await invoke<string>('tauri', { __tauriModule: 'App', message: { cmd: 'getAppName' } });
    appName.set(name);
    return name;
  } catch {
    const internals = getTauriInternals();
    const name = await internals?.app?.getName?.() || 'App';
    appName.set(name);
    return name;
  }
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  if (!isTauri()) return '1.0.0';

  try {
    const internals = getTauriInternals();
    const version = await internals?.app?.getVersion?.() || '1.0.0';
    appVersion.set(version);
    return version;
  } catch {
    return '1.0.0';
  }
}

/**
 * Get Tauri version
 */
export async function getTauriVersion(): Promise<string> {
  if (!isTauri()) return '0.0.0';

  try {
    const internals = getTauriInternals();
    const version = await internals?.app?.getTauriVersion?.() || '0.0.0';
    tauriVersion.set(version);
    return version;
  } catch {
    return '0.0.0';
  }
}

/**
 * Get app info (combined name and version)
 */
export async function getAppInfo(): Promise<{ name: string; version: string }> {
  const [name, version] = await Promise.all([getAppName(), getAppVersion()]);
  return { name, version };
}

/**
 * Show the app (macOS)
 */
export async function showApp(): Promise<void> {
  if (!isTauri()) return;

  const internals = getTauriInternals();
  await internals?.app?.show?.();
}

/**
 * Hide the app (macOS)
 */
export async function hideApp(): Promise<void> {
  if (!isTauri()) return;

  const internals = getTauriInternals();
  await internals?.app?.hide?.();
}

/**
 * Exit the app
 */
export async function exitApp(exitCode = 0): Promise<void> {
  if (!isTauri()) {
    window.close();
    return;
  }

  const internals = getTauriInternals();
  await internals?.process?.exit?.(exitCode);
}

/**
 * Restart the app
 */
export async function restartApp(): Promise<void> {
  if (!isTauri()) {
    window.location.reload();
    return;
  }

  const internals = getTauriInternals();
  await internals?.process?.relaunch?.();
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize Tauri integration
 */
export async function initTauri(): Promise<TauriConfig | null> {
  if (!isTauri()) {
    return null;
  }

  // Set up window event listeners
  await setupWindowListeners();

  // Get app info
  const [name, version, tauri] = await Promise.all([
    getAppName(),
    getAppVersion(),
    getTauriVersion(),
  ]);

  const config: TauriConfig = {
    appName: name,
    appVersion: version,
    tauriVersion: tauri,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[PhilJS Native] Tauri initialized:', config);
  }

  return config;
}

/**
 * Set up window event listeners
 */
async function setupWindowListeners(): Promise<void> {
  // Focus events
  listen('tauri://focus', () => {
    windowFocused.set(true);
  });

  listen('tauri://blur', () => {
    windowFocused.set(false);
  });

  // Resize events
  listen('tauri://resize', () => {
    // Update window state
  });

  // Move events
  listen('tauri://move', () => {
    // Update window position
  });

  // Close requested
  listen('tauri://close-requested', () => {
    // Handle close request
  });

  // Theme changed
  listen('tauri://theme-changed', (event) => {
    // Handle theme change
  });
}

// ============================================================================
// Exports
// ============================================================================

export * from './commands.js';
export * from './events.js';
export * from './window.js';
export * from './fs.js';
export * from './dialog.js';

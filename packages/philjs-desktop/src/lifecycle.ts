/**
 * App Lifecycle for PhilJS Desktop
 */

import { isTauri } from './tauri/context';
import { invoke } from './tauri/invoke';
import { listen, emit, TauriEvents } from './tauri/events';
import type { UnlistenFn } from './tauri/types';

// Lifecycle types
export interface UpdateInfo {
  /** Update version */
  version: string;
  /** Release date */
  date?: string;
  /** Release notes */
  body?: string;
  /** Download URL */
  url?: string;
}

export interface UpdateStatus {
  /** Update status */
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'upToDate';
  /** Progress percentage (0-100) */
  progress?: number;
  /** Error message if status is 'error' */
  error?: string;
  /** Update info if available */
  info?: UpdateInfo;
}

export type LifecycleEvent =
  | 'ready'
  | 'window-close'
  | 'before-quit'
  | 'will-quit'
  | 'quit'
  | 'focus'
  | 'blur'
  | 'update-available'
  | 'update-downloaded';

// Lifecycle state
let appReady = false;
const lifecycleHandlers: Map<LifecycleEvent, Set<Function>> = new Map();
const unlistenFns: UnlistenFn[] = [];

/**
 * Initialize lifecycle management
 */
export async function initLifecycle(): Promise<void> {
  if (!isTauri()) return;

  // Set up Tauri event listeners
  const events: Array<[string, LifecycleEvent]> = [
    [TauriEvents.WINDOW_CLOSE_REQUESTED, 'window-close'],
    [TauriEvents.WINDOW_FOCUS, 'focus'],
    [TauriEvents.WINDOW_BLUR, 'blur'],
    [TauriEvents.UPDATE_AVAILABLE, 'update-available'],
  ];

  for (const [tauriEvent, lifecycleEvent] of events) {
    const unlisten = await listen(tauriEvent, (e) => {
      emitLifecycle(lifecycleEvent, e.payload);
    });
    unlistenFns.push(unlisten);
  }

  appReady = true;
  emitLifecycle('ready');
}

/**
 * Clean up lifecycle listeners
 */
export function destroyLifecycle(): void {
  unlistenFns.forEach(fn => fn());
  unlistenFns.length = 0;
  lifecycleHandlers.clear();
  appReady = false;
}

/**
 * Emit a lifecycle event
 */
function emitLifecycle(event: LifecycleEvent, payload?: unknown): void {
  const handlers = lifecycleHandlers.get(event);
  if (handlers) {
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[PhilJS Desktop] Lifecycle handler error:`, error);
      }
    }
  }
}

/**
 * Register a lifecycle event handler
 */
function onLifecycle(event: LifecycleEvent, handler: Function): () => void {
  if (!lifecycleHandlers.has(event)) {
    lifecycleHandlers.set(event, new Set());
  }
  lifecycleHandlers.get(event)!.add(handler);

  return () => {
    lifecycleHandlers.get(event)?.delete(handler);
  };
}

/**
 * Called when app is ready
 */
export function onAppReady(callback: () => void): () => void {
  if (appReady) {
    // Already ready, call immediately
    setTimeout(callback, 0);
    return () => {};
  }
  return onLifecycle('ready', callback);
}

/**
 * Called before window closes
 * Return false to prevent closing
 */
export function onWindowClose(callback: () => boolean | void | Promise<boolean | void>): () => void {
  return onLifecycle('window-close', callback);
}

/**
 * Called before app quits
 */
export function onBeforeQuit(callback: () => void): () => void {
  return onLifecycle('before-quit', callback);
}

/**
 * Called when app will quit
 */
export function onWillQuit(callback: () => void): () => void {
  return onLifecycle('will-quit', callback);
}

/**
 * Called when app quits
 */
export function onQuit(callback: () => void): () => void {
  return onLifecycle('quit', callback);
}

/**
 * Called when app gains focus
 */
export function onFocus(callback: () => void): () => void {
  return onLifecycle('focus', callback);
}

/**
 * Called when app loses focus
 */
export function onBlur(callback: () => void): () => void {
  return onLifecycle('blur', callback);
}

/**
 * Called when an update is available
 */
export function onAppUpdate(callback: (info: UpdateInfo) => void): () => void {
  return onLifecycle('update-available', callback);
}

/**
 * Called when update is downloaded and ready to install
 */
export function onUpdateDownloaded(callback: (info: UpdateInfo) => void): () => void {
  return onLifecycle('update-downloaded', callback);
}

/**
 * Check for app updates
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  if (!isTauri()) {
    console.warn('[PhilJS Desktop] Updates not available in browser');
    return null;
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (update?.available) {
      const info: UpdateInfo = {
        version: update.version,
        date: update.date,
        body: update.body,
      };
      emitLifecycle('update-available', info);
      return info;
    }

    return null;
  } catch (error) {
    console.error('[PhilJS Desktop] Update check failed:', error);
    return null;
  }
}

/**
 * Download and install update
 */
export async function installUpdate(
  onProgress?: (progress: number) => void
): Promise<void> {
  if (!isTauri()) {
    console.warn('[PhilJS Desktop] Updates not available in browser');
    return;
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (!update?.available) {
      throw new Error('No update available');
    }

    // Download with progress
    await update.downloadAndInstall((event) => {
      if (event.event === 'Progress') {
        const { chunkLength, contentLength } = event.data;
        if (contentLength && onProgress) {
          // Calculate progress percentage
          onProgress(Math.round((chunkLength / contentLength) * 100));
        }
      }
    });

    // Emit downloaded event
    emitLifecycle('update-downloaded', {
      version: update.version,
      date: update.date,
      body: update.body,
    });
  } catch (error) {
    console.error('[PhilJS Desktop] Update install failed:', error);
    throw error;
  }
}

/**
 * Restart app to apply update
 */
export async function restartApp(): Promise<void> {
  if (!isTauri()) {
    window.location.reload();
    return;
  }

  try {
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch {
    // Fallback
    await invoke('plugin:process|restart');
  }
}

/**
 * Quit the app
 */
export async function quitApp(exitCode = 0): Promise<void> {
  if (!isTauri()) {
    window.close();
    return;
  }

  emitLifecycle('before-quit');
  emitLifecycle('will-quit');

  try {
    const { exit } = await import('@tauri-apps/plugin-process');
    await exit(exitCode);
  } catch {
    await invoke('plugin:process|exit', { code: exitCode });
  }

  emitLifecycle('quit');
}

/**
 * Hide the app (macOS)
 */
export async function hideApp(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().hide();
  } catch {
    // Ignore
  }
}

/**
 * Show the app
 */
export async function showApp(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().show();
    await getCurrentWindow().setFocus();
  } catch {
    // Ignore
  }
}

/**
 * Get app ready state
 */
export function isAppReady(): boolean {
  return appReady;
}

/**
 * Hook for lifecycle state
 */
export function useLifecycle(): {
  isReady: boolean;
  onReady: (callback: () => void) => () => void;
  onClose: (callback: () => boolean | void) => () => void;
  onFocus: (callback: () => void) => () => void;
  onBlur: (callback: () => void) => () => void;
} {
  return {
    isReady: appReady,
    onReady: onAppReady,
    onClose: onWindowClose,
    onFocus,
    onBlur,
  };
}

/**
 * App state management
 */
export interface AppState<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (callback: (value: T) => void) => () => void;
}

/**
 * Create persistent app state
 */
export function createAppState<T>(key: string, defaultValue: T): AppState<T> {
  let value = defaultValue;
  const subscribers = new Set<(value: T) => void>();

  // Load from storage
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(`philjs_state_${key}`);
      if (stored) {
        value = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }

  return {
    get() {
      return value;
    },

    set(newValue: T) {
      value = newValue;

      // Save to storage
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(`philjs_state_${key}`, JSON.stringify(value));
        } catch {
          // Ignore
        }
      }

      // Notify subscribers
      for (const callback of subscribers) {
        callback(value);
      }
    },

    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);
      callback(value); // Initial call
      return () => {
        subscribers.delete(callback);
      };
    },
  };
}

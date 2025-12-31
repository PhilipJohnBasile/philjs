/**
 * App Lifecycle for PhilJS Desktop
 */
import { isTauri } from './tauri/context.js';
import { invoke } from './tauri/invoke.js';
import { listen, emit, TauriEvents } from './tauri/events.js';
// Lifecycle state
let appReady = false;
const lifecycleHandlers = new Map();
const unlistenFns = [];
/**
 * Initialize lifecycle management
 */
export async function initLifecycle() {
    if (!isTauri())
        return;
    // Set up Tauri event listeners
    const events = [
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
export function destroyLifecycle() {
    unlistenFns.forEach(fn => fn());
    unlistenFns.length = 0;
    lifecycleHandlers.clear();
    appReady = false;
}
/**
 * Emit a lifecycle event
 */
function emitLifecycle(event, payload) {
    const handlers = lifecycleHandlers.get(event);
    if (handlers) {
        for (const handler of handlers) {
            try {
                handler(payload);
            }
            catch (error) {
                console.error(`[PhilJS Desktop] Lifecycle handler error:`, error);
            }
        }
    }
}
/**
 * Register a lifecycle event handler
 */
function onLifecycle(event, handler) {
    if (!lifecycleHandlers.has(event)) {
        lifecycleHandlers.set(event, new Set());
    }
    lifecycleHandlers.get(event).add(handler);
    return () => {
        lifecycleHandlers.get(event)?.delete(handler);
    };
}
/**
 * Called when app is ready
 */
export function onAppReady(callback) {
    if (appReady) {
        // Already ready, call immediately
        setTimeout(callback, 0);
        return () => { };
    }
    return onLifecycle('ready', callback);
}
/**
 * Called before window closes
 * Return false to prevent closing
 */
export function onWindowClose(callback) {
    return onLifecycle('window-close', callback);
}
/**
 * Called before app quits
 */
export function onBeforeQuit(callback) {
    return onLifecycle('before-quit', callback);
}
/**
 * Called when app will quit
 */
export function onWillQuit(callback) {
    return onLifecycle('will-quit', callback);
}
/**
 * Called when app quits
 */
export function onQuit(callback) {
    return onLifecycle('quit', callback);
}
/**
 * Called when app gains focus
 */
export function onFocus(callback) {
    return onLifecycle('focus', callback);
}
/**
 * Called when app loses focus
 */
export function onBlur(callback) {
    return onLifecycle('blur', callback);
}
/**
 * Called when an update is available
 */
export function onAppUpdate(callback) {
    return onLifecycle('update-available', callback);
}
/**
 * Called when update is downloaded and ready to install
 */
export function onUpdateDownloaded(callback) {
    return onLifecycle('update-downloaded', callback);
}
/**
 * Check for app updates
 */
export async function checkForUpdates() {
    if (!isTauri()) {
        console.warn('[PhilJS Desktop] Updates not available in browser');
        return null;
    }
    try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (update?.available) {
            const info = {
                version: update.version,
            };
            if (update.date !== undefined)
                info.date = update.date;
            if (update.body !== undefined)
                info.body = update.body;
            emitLifecycle('update-available', info);
            return info;
        }
        return null;
    }
    catch (error) {
        console.error('[PhilJS Desktop] Update check failed:', error);
        return null;
    }
}
/**
 * Download and install update
 */
export async function installUpdate(onProgress) {
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
                const data = event.data;
                if (data.contentLength && onProgress) {
                    // Calculate progress percentage
                    onProgress(Math.round((data.chunkLength / data.contentLength) * 100));
                }
            }
        });
        // Emit downloaded event
        emitLifecycle('update-downloaded', {
            version: update.version,
            date: update.date,
            body: update.body,
        });
    }
    catch (error) {
        console.error('[PhilJS Desktop] Update install failed:', error);
        throw error;
    }
}
/**
 * Restart app to apply update
 */
export async function restartApp() {
    if (!isTauri()) {
        window.location.reload();
        return;
    }
    try {
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
    }
    catch {
        // Fallback
        await invoke('plugin:process|restart');
    }
}
/**
 * Quit the app
 */
export async function quitApp(exitCode = 0) {
    if (!isTauri()) {
        window.close();
        return;
    }
    emitLifecycle('before-quit');
    emitLifecycle('will-quit');
    try {
        const { exit } = await import('@tauri-apps/plugin-process');
        await exit(exitCode);
    }
    catch {
        await invoke('plugin:process|exit', { code: exitCode });
    }
    emitLifecycle('quit');
}
/**
 * Hide the app (macOS)
 */
export async function hideApp() {
    if (!isTauri())
        return;
    try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().hide();
    }
    catch {
        // Ignore
    }
}
/**
 * Show the app
 */
export async function showApp() {
    if (!isTauri())
        return;
    try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().show();
        await getCurrentWindow().setFocus();
    }
    catch {
        // Ignore
    }
}
/**
 * Get app ready state
 */
export function isAppReady() {
    return appReady;
}
/**
 * Hook for lifecycle state
 */
export function useLifecycle() {
    return {
        isReady: appReady,
        onReady: onAppReady,
        onClose: onWindowClose,
        onFocus,
        onBlur,
    };
}
/**
 * Create persistent app state
 */
export function createAppState(key, defaultValue) {
    let value = defaultValue;
    const subscribers = new Set();
    // Load from storage
    if (typeof localStorage !== 'undefined') {
        try {
            const stored = localStorage.getItem(`philjs_state_${key}`);
            if (stored) {
                value = JSON.parse(stored);
            }
        }
        catch {
            // Ignore
        }
    }
    return {
        get() {
            return value;
        },
        set(newValue) {
            value = newValue;
            // Save to storage
            if (typeof localStorage !== 'undefined') {
                try {
                    localStorage.setItem(`philjs_state_${key}`, JSON.stringify(value));
                }
                catch {
                    // Ignore
                }
            }
            // Notify subscribers
            for (const callback of subscribers) {
                callback(value);
            }
        },
        subscribe(callback) {
            subscribers.add(callback);
            callback(value); // Initial call
            return () => {
                subscribers.delete(callback);
            };
        },
    };
}
//# sourceMappingURL=lifecycle.js.map
// @ts-nocheck
/**
 * PhilJS Native - Tauri Integration
 *
 * Provides a unified interface to Tauri APIs for building
 * cross-platform desktop applications with web technologies.
 */
import { signal, effect, batch } from 'philjs-core';
// ============================================================================
// Tauri Detection
// ============================================================================
/**
 * Check if running in Tauri
 */
export function isTauri() {
    if (typeof window === 'undefined')
        return false;
    return '__TAURI__' in window || '__TAURI_IPC__' in window;
}
/**
 * Check if Tauri API is available
 */
export function hasTauriAPI() {
    if (typeof window === 'undefined')
        return false;
    return !!window.__TAURI__;
}
/**
 * Get Tauri internals
 */
export function getTauriInternals() {
    if (typeof window === 'undefined')
        return null;
    return window.__TAURI__;
}
/**
 * Get Tauri invoke handler
 */
export function getTauriInvoke() {
    const internals = getTauriInternals();
    return internals?.invoke || internals?.tauri?.invoke || null;
}
// ============================================================================
// Command Invocation
// ============================================================================
/**
 * Invoke a Tauri command
 */
export async function invoke(cmd, args, options) {
    if (!isTauri()) {
        throw new Error('Tauri is not available. This function only works in a Tauri app.');
    }
    const tauriInvoke = getTauriInvoke();
    if (!tauriInvoke) {
        throw new Error('Tauri invoke API not found');
    }
    try {
        const result = await tauriInvoke(cmd, args);
        return result;
    }
    catch (error) {
        throw new Error(`Tauri command "${cmd}" failed: ${error}`);
    }
}
/**
 * Invoke with automatic error handling
 */
export async function invokeSafe(cmd, args, defaultValue) {
    try {
        return await invoke(cmd, args);
    }
    catch (error) {
        console.warn(`Tauri command "${cmd}" failed:`, error);
        return defaultValue;
    }
}
/**
 * Create a typed command invoker
 */
export function createCommand(name) {
    return (args) => invoke(name, args);
}
// ============================================================================
// Event System
// ============================================================================
/**
 * Active event listeners
 */
const eventListeners = new Map();
const unlistenHandles = new Map();
/**
 * Listen to a Tauri event
 */
export async function listen(event, handler) {
    if (!isTauri()) {
        // Return no-op for non-Tauri environment
        return () => { };
    }
    const internals = getTauriInternals();
    const listenFn = internals?.event?.listen;
    if (!listenFn) {
        // Fallback: use custom event system
        if (!eventListeners.has(event)) {
            eventListeners.set(event, new Set());
        }
        eventListeners.get(event).add(handler);
        return () => {
            eventListeners.get(event)?.delete(handler);
        };
    }
    const unlisten = await listenFn(event, handler);
    return unlisten;
}
/**
 * Listen to an event once
 */
export async function once(event, handler) {
    if (!isTauri()) {
        return () => { };
    }
    const internals = getTauriInternals();
    const onceFn = internals?.event?.once;
    if (!onceFn) {
        // Fallback: wrap handler to auto-remove
        const wrappedHandler = (e) => {
            eventListeners.get(event)?.delete(wrappedHandler);
            handler(e);
        };
        if (!eventListeners.has(event)) {
            eventListeners.set(event, new Set());
        }
        eventListeners.get(event).add(wrappedHandler);
        return () => {
            eventListeners.get(event)?.delete(wrappedHandler);
        };
    }
    const unlisten = await onceFn(event, handler);
    return unlisten;
}
/**
 * Emit a Tauri event
 */
export async function emit(event, payload) {
    if (!isTauri()) {
        // Emit to local listeners
        const listeners = eventListeners.get(event);
        if (listeners) {
            const tauriEvent = {
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
export const currentWindowLabel = signal('main');
/**
 * Window focused state
 */
export const windowFocused = signal(true);
/**
 * Window fullscreen state
 */
export const windowFullscreen = signal(false);
/**
 * Window minimized state
 */
export const windowMinimized = signal(false);
/**
 * Window maximized state
 */
export const windowMaximized = signal(false);
/**
 * Get the current window
 */
export function getCurrentWindow() {
    if (!isTauri())
        return null;
    const internals = getTauriInternals();
    return internals?.window?.getCurrent?.() || internals?.window?.appWindow;
}
/**
 * Create a new window
 */
export async function createWindow(label, options) {
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
export async function getAllWindows() {
    if (!isTauri())
        return [];
    const internals = getTauriInternals();
    const getAll = internals?.window?.getAll;
    if (!getAll)
        return [];
    return await getAll();
}
/**
 * Close current window
 */
export async function closeWindow() {
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
export async function minimizeWindow() {
    if (!isTauri())
        return;
    const win = getCurrentWindow();
    await win?.minimize?.();
    windowMinimized.set(true);
}
/**
 * Maximize current window
 */
export async function maximizeWindow() {
    if (!isTauri())
        return;
    const win = getCurrentWindow();
    await win?.maximize?.();
    windowMaximized.set(true);
}
/**
 * Unmaximize current window
 */
export async function unmaximizeWindow() {
    if (!isTauri())
        return;
    const win = getCurrentWindow();
    await win?.unmaximize?.();
    windowMaximized.set(false);
}
/**
 * Toggle maximize
 */
export async function toggleMaximize() {
    if (!isTauri())
        return;
    const win = getCurrentWindow();
    await win?.toggleMaximize?.();
    windowMaximized.set(!windowMaximized());
}
/**
 * Set fullscreen
 */
export async function setFullscreen(fullscreen) {
    if (!isTauri()) {
        if (fullscreen && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
        else if (!fullscreen && document.exitFullscreen) {
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
export async function setTitle(title) {
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
export async function setAlwaysOnTop(alwaysOnTop) {
    if (!isTauri())
        return;
    const win = getCurrentWindow();
    await win?.setAlwaysOnTop?.(alwaysOnTop);
}
/**
 * Center window
 */
export async function centerWindow() {
    if (!isTauri())
        return;
    const win = getCurrentWindow();
    await win?.center?.();
}
/**
 * Set window size
 */
export async function setSize(width, height) {
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
export async function setPosition(x, y) {
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
export const appName = signal('');
/**
 * App version
 */
export const appVersion = signal('');
/**
 * Tauri version
 */
export const tauriVersion = signal('');
/**
 * Get app name
 */
export async function getAppName() {
    if (!isTauri())
        return document.title || 'App';
    try {
        const name = await invoke('tauri', { __tauriModule: 'App', message: { cmd: 'getAppName' } });
        appName.set(name);
        return name;
    }
    catch {
        const internals = getTauriInternals();
        const name = await internals?.app?.getName?.() || 'App';
        appName.set(name);
        return name;
    }
}
/**
 * Get app version
 */
export async function getAppVersion() {
    if (!isTauri())
        return '1.0.0';
    try {
        const internals = getTauriInternals();
        const version = await internals?.app?.getVersion?.() || '1.0.0';
        appVersion.set(version);
        return version;
    }
    catch {
        return '1.0.0';
    }
}
/**
 * Get Tauri version
 */
export async function getTauriVersion() {
    if (!isTauri())
        return '0.0.0';
    try {
        const internals = getTauriInternals();
        const version = await internals?.app?.getTauriVersion?.() || '0.0.0';
        tauriVersion.set(version);
        return version;
    }
    catch {
        return '0.0.0';
    }
}
/**
 * Show the app (macOS)
 */
export async function showApp() {
    if (!isTauri())
        return;
    const internals = getTauriInternals();
    await internals?.app?.show?.();
}
/**
 * Hide the app (macOS)
 */
export async function hideApp() {
    if (!isTauri())
        return;
    const internals = getTauriInternals();
    await internals?.app?.hide?.();
}
/**
 * Exit the app
 */
export async function exitApp(exitCode = 0) {
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
export async function restartApp() {
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
export async function initTauri() {
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
    const config = {
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
async function setupWindowListeners() {
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
//# sourceMappingURL=index.js.map
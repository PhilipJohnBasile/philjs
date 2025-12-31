/**
 * PhilJS Native - Tauri Integration
 *
 * Provides a unified interface to Tauri APIs for building
 * cross-platform desktop applications with web technologies.
 */
import { type Signal } from 'philjs-core';
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
/**
 * Check if running in Tauri
 */
export declare function isTauri(): boolean;
/**
 * Check if Tauri API is available
 */
export declare function hasTauriAPI(): boolean;
/**
 * Get Tauri internals
 */
export declare function getTauriInternals(): any;
/**
 * Get Tauri invoke handler
 */
export declare function getTauriInvoke(): ((cmd: string, args?: any) => Promise<any>) | null;
/**
 * Invoke a Tauri command
 */
export declare function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>, options?: InvokeOptions): Promise<T>;
/**
 * Invoke with automatic error handling
 */
export declare function invokeSafe<T = unknown>(cmd: string, args?: Record<string, unknown>, defaultValue?: T): Promise<T | undefined>;
/**
 * Create a typed command invoker
 */
export declare function createCommand<TArgs extends Record<string, unknown>, TResult>(name: string): (args?: TArgs) => Promise<TResult>;
/**
 * Listen to a Tauri event
 */
export declare function listen<T = unknown>(event: string, handler: (event: TauriEvent<T>) => void): Promise<() => void>;
/**
 * Listen to an event once
 */
export declare function once<T = unknown>(event: string, handler: (event: TauriEvent<T>) => void): Promise<() => void>;
/**
 * Emit a Tauri event
 */
export declare function emit(event: string, payload?: unknown): Promise<void>;
/**
 * Current window label
 */
export declare const currentWindowLabel: Signal<string>;
/**
 * Window focused state
 */
export declare const windowFocused: Signal<boolean>;
/**
 * Window fullscreen state
 */
export declare const windowFullscreen: Signal<boolean>;
/**
 * Window minimized state
 */
export declare const windowMinimized: Signal<boolean>;
/**
 * Window maximized state
 */
export declare const windowMaximized: Signal<boolean>;
/**
 * Get the current window
 */
export declare function getCurrentWindow(): any;
/**
 * Create a new window
 */
export declare function createWindow(label: string, options?: WindowOptions): Promise<any>;
/**
 * Get all windows
 */
export declare function getAllWindows(): Promise<any[]>;
/**
 * Close current window
 */
export declare function closeWindow(): Promise<void>;
/**
 * Minimize current window
 */
export declare function minimizeWindow(): Promise<void>;
/**
 * Maximize current window
 */
export declare function maximizeWindow(): Promise<void>;
/**
 * Unmaximize current window
 */
export declare function unmaximizeWindow(): Promise<void>;
/**
 * Toggle maximize
 */
export declare function toggleMaximize(): Promise<void>;
/**
 * Set fullscreen
 */
export declare function setFullscreen(fullscreen: boolean): Promise<void>;
/**
 * Set window title
 */
export declare function setTitle(title: string): Promise<void>;
/**
 * Set window always on top
 */
export declare function setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
/**
 * Center window
 */
export declare function centerWindow(): Promise<void>;
/**
 * Set window size
 */
export declare function setSize(width: number, height: number): Promise<void>;
/**
 * Set window position
 */
export declare function setPosition(x: number, y: number): Promise<void>;
/**
 * App name
 */
export declare const appName: Signal<string>;
/**
 * App version
 */
export declare const appVersion: Signal<string>;
/**
 * Tauri version
 */
export declare const tauriVersion: Signal<string>;
/**
 * Get app name
 */
export declare function getAppName(): Promise<string>;
/**
 * Get app version
 */
export declare function getAppVersion(): Promise<string>;
/**
 * Get Tauri version
 */
export declare function getTauriVersion(): Promise<string>;
/**
 * Show the app (macOS)
 */
export declare function showApp(): Promise<void>;
/**
 * Hide the app (macOS)
 */
export declare function hideApp(): Promise<void>;
/**
 * Exit the app
 */
export declare function exitApp(exitCode?: number): Promise<void>;
/**
 * Restart the app
 */
export declare function restartApp(): Promise<void>;
/**
 * Initialize Tauri integration
 */
export declare function initTauri(): Promise<TauriConfig | null>;
export * from './commands.js';
export * from './events.js';
export * from './window.js';
export * from './fs.js';
export * from './dialog.js';
//# sourceMappingURL=index.d.ts.map
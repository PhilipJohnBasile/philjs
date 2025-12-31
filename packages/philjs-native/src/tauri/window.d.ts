/**
 * PhilJS Native - Tauri Window Management
 *
 * Comprehensive window management utilities for Tauri applications
 * including multi-window support, positioning, and state management.
 */
import { type Signal } from 'philjs-core';
import { type WindowOptions } from './index.js';
/**
 * Window position
 */
export interface WindowPosition {
    x: number;
    y: number;
}
/**
 * Window size
 */
export interface WindowSize {
    width: number;
    height: number;
}
/**
 * Window state
 */
export interface WindowState {
    label: string;
    title: string;
    position: WindowPosition;
    size: WindowSize;
    isFullscreen: boolean;
    isMaximized: boolean;
    isMinimized: boolean;
    isFocused: boolean;
    isVisible: boolean;
    isDecorated: boolean;
    isResizable: boolean;
    isClosable: boolean;
    isMinimizable: boolean;
    isMaximizable: boolean;
    isAlwaysOnTop: boolean;
}
/**
 * Monitor info
 */
export interface Monitor {
    name: string;
    size: WindowSize;
    position: WindowPosition;
    scaleFactor: number;
}
/**
 * Window effect (Windows 10/11)
 */
export type WindowEffect = 'blur' | 'acrylic' | 'mica' | 'tabbed';
/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';
/**
 * Current window state
 */
export declare const windowState: Signal<WindowState>;
/**
 * All windows state
 */
export declare const allWindows: Signal<Map<string, WindowState>>;
/**
 * Current theme
 */
export declare const currentTheme: Signal<ThemeMode>;
/**
 * Primary monitor
 */
export declare const primaryMonitor: Signal<Monitor | null>;
/**
 * All monitors
 */
export declare const allMonitors: Signal<Monitor[]>;
/**
 * Window manager class
 */
export declare class WindowManager {
    private win;
    private label;
    constructor(label?: string);
    /**
     * Get window instance
     */
    getWindow(): any;
    /**
     * Get window label
     */
    getLabel(): string;
    getPosition(): Promise<WindowPosition>;
    setPosition(x: number, y: number): Promise<void>;
    getSize(): Promise<WindowSize>;
    setSize(width: number, height: number): Promise<void>;
    setMinSize(width: number, height: number): Promise<void>;
    setMaxSize(width: number, height: number): Promise<void>;
    center(): Promise<void>;
    minimize(): Promise<void>;
    unminimize(): Promise<void>;
    maximize(): Promise<void>;
    unmaximize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    setFullscreen(fullscreen: boolean): Promise<void>;
    toggleFullscreen(): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    focus(): Promise<void>;
    close(): Promise<void>;
    setTitle(title: string): Promise<void>;
    setDecorations(decorations: boolean): Promise<void>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
    setResizable(resizable: boolean): Promise<void>;
    setClosable(closable: boolean): Promise<void>;
    setMinimizable(minimizable: boolean): Promise<void>;
    setMaximizable(maximizable: boolean): Promise<void>;
    setSkipTaskbar(skip: boolean): Promise<void>;
    setIgnoreCursorEvents(ignore: boolean): Promise<void>;
    setIcon(icon: string | Uint8Array): Promise<void>;
    setWindowEffect(effect: WindowEffect | null): Promise<void>;
    isMaximized(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    isFullscreen(): Promise<boolean>;
    isFocused(): Promise<boolean>;
    isVisible(): Promise<boolean>;
    getState(): Promise<WindowState>;
}
/**
 * Create a new window
 */
export declare function openWindow(label: string, options?: WindowOptions): Promise<WindowManager>;
/**
 * Get all window managers
 */
export declare function getWindows(): Promise<WindowManager[]>;
/**
 * Get window by label
 */
export declare function getWindowByLabel(label: string): WindowManager | null;
/**
 * Get primary monitor
 */
export declare function getPrimaryMonitor(): Promise<Monitor | null>;
/**
 * Get all monitors
 */
export declare function getMonitors(): Promise<Monitor[]>;
/**
 * Get current monitor (where window is located)
 */
export declare function getCurrentMonitor(): Promise<Monitor | null>;
/**
 * Get system theme
 */
export declare function getTheme(): Promise<ThemeMode>;
/**
 * Set window theme (if supported)
 */
export declare function setTheme(theme: ThemeMode): Promise<void>;
/**
 * Main window manager instance
 */
export declare const mainWindow: WindowManager;
/**
 * Hook to get window state
 */
export declare function useWindowState(): WindowState;
/**
 * Hook to manage window
 */
export declare function useWindow(label?: string): WindowManager;
/**
 * Hook for window position
 */
export declare function useWindowPosition(): WindowPosition;
/**
 * Hook for window size
 */
export declare function useWindowSize(): WindowSize;
/**
 * Hook for theme
 */
export declare function useTheme(): ThemeMode;
/**
 * Initialize window state tracking
 */
export declare function initWindowState(): Promise<void>;
declare const _default: {
    WindowManager: typeof WindowManager;
    mainWindow: WindowManager;
    openWindow: typeof openWindow;
    getWindows: typeof getWindows;
    getWindowByLabel: typeof getWindowByLabel;
    getPrimaryMonitor: typeof getPrimaryMonitor;
    getMonitors: typeof getMonitors;
    getCurrentMonitor: typeof getCurrentMonitor;
    getTheme: typeof getTheme;
    setTheme: typeof setTheme;
    initWindowState: typeof initWindowState;
};
export default _default;
//# sourceMappingURL=window.d.ts.map
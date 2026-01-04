/**
 * Window Management for PhilJS Desktop
 */
import type { UnlistenFn } from './tauri/types.js';
export interface WindowOptions {
    /** Window label (unique identifier) */
    label?: string;
    /** Window title */
    title?: string;
    /** Window width */
    width?: number;
    /** Window height */
    height?: number;
    /** Minimum width */
    minWidth?: number;
    /** Minimum height */
    minHeight?: number;
    /** Maximum width */
    maxWidth?: number;
    /** Maximum height */
    maxHeight?: number;
    /** X position */
    x?: number;
    /** Y position */
    y?: number;
    /** Center window on screen */
    center?: boolean;
    /** Resizable */
    resizable?: boolean;
    /** Decorations (title bar, etc.) */
    decorations?: boolean;
    /** Always on top */
    alwaysOnTop?: boolean;
    /** Fullscreen */
    fullscreen?: boolean;
    /** Visible on creation */
    visible?: boolean;
    /** Focus on creation */
    focus?: boolean;
    /** Transparent */
    transparent?: boolean;
    /** URL to load */
    url?: string;
    /** Parent window label */
    parent?: string;
    /** Skip taskbar */
    skipTaskbar?: boolean;
}
export interface WindowSize {
    width: number;
    height: number;
}
export interface WindowPosition {
    x: number;
    y: number;
}
export interface PhysicalSize {
    width: number;
    height: number;
}
export interface PhysicalPosition {
    x: number;
    y: number;
}
export interface Monitor {
    name: string | null;
    size: PhysicalSize;
    position: PhysicalPosition;
    scaleFactor: number;
}
export interface WindowState {
    label: string;
    title: string;
    isVisible: boolean;
    isFullscreen: boolean;
    isMaximized: boolean;
    isMinimized: boolean;
    isFocused: boolean;
    isDecorated: boolean;
    isResizable: boolean;
    isAlwaysOnTop: boolean;
    size: WindowSize;
    position: WindowPosition;
}
/**
 * Window handle class
 */
export declare class WindowHandle {
    private label;
    private tauriWindow;
    constructor(label: string, tauriWindow?: any);
    getLabel(): string;
    close(): Promise<void>;
    destroy(): Promise<void>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    unmaximize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    show(): Promise<void>;
    hide(): Promise<void>;
    setTitle(title: string): Promise<void>;
    setSize(width: number, height: number): Promise<void>;
    setMinSize(width: number, height: number): Promise<void>;
    setMaxSize(width: number, height: number): Promise<void>;
    setPosition(x: number, y: number): Promise<void>;
    center(): Promise<void>;
    setFullscreen(enabled: boolean): Promise<void>;
    setAlwaysOnTop(enabled: boolean): Promise<void>;
    setResizable(enabled: boolean): Promise<void>;
    setDecorations(enabled: boolean): Promise<void>;
    setFocus(): Promise<void>;
    setSkipTaskbar(skip: boolean): Promise<void>;
    requestUserAttention(type: 'critical' | 'informational' | null): Promise<void>;
    getSize(): Promise<WindowSize>;
    getPosition(): Promise<WindowPosition>;
    isVisible(): Promise<boolean>;
    isMaximized(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    isFullscreen(): Promise<boolean>;
    isFocused(): Promise<boolean>;
    getState(): Promise<WindowState>;
    onResize(callback: (size: WindowSize) => void): Promise<UnlistenFn>;
    onMove(callback: (position: WindowPosition) => void): Promise<UnlistenFn>;
    onFocus(callback: () => void): Promise<UnlistenFn>;
    onBlur(callback: () => void): Promise<UnlistenFn>;
    onCloseRequested(callback: () => void): Promise<UnlistenFn>;
    startDragging(): Promise<void>;
}
/**
 * Create a new window
 */
export declare function createWindow(options?: WindowOptions): Promise<WindowHandle>;
/**
 * Get the current window
 */
export declare function getCurrentWindow(): Promise<WindowHandle>;
/**
 * Hook to get the current window
 */
export declare function useWindow(): WindowHandle;
/**
 * Get all windows
 */
export declare function getAllWindows(): Promise<WindowHandle[]>;
/**
 * Get a window by label
 */
export declare function getWindow(label: string): Promise<WindowHandle | null>;
export declare function closeWindow(): Promise<void>;
export declare function minimizeWindow(): Promise<void>;
export declare function maximizeWindow(): Promise<void>;
export declare function setTitle(title: string): Promise<void>;
export declare function setSize(width: number, height: number): Promise<void>;
export declare function setFullscreen(enabled: boolean): Promise<void>;
export declare function setAlwaysOnTop(enabled: boolean): Promise<void>;
export declare function center(): Promise<void>;
export declare function setPosition(x: number, y: number): Promise<void>;
/**
 * Get primary monitor info
 */
export declare function getPrimaryMonitor(): Promise<Monitor | null>;
/**
 * Get all monitors
 */
export declare function getAllMonitors(): Promise<Monitor[]>;
//# sourceMappingURL=window.d.ts.map
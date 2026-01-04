/**
 * App Lifecycle for PhilJS Desktop
 */
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
export type LifecycleEvent = 'ready' | 'window-close' | 'before-quit' | 'will-quit' | 'quit' | 'focus' | 'blur' | 'update-available' | 'update-downloaded';
/**
 * Initialize lifecycle management
 */
export declare function initLifecycle(): Promise<void>;
/**
 * Clean up lifecycle listeners
 */
export declare function destroyLifecycle(): void;
/**
 * Called when app is ready
 */
export declare function onAppReady(callback: () => void): () => void;
/**
 * Called before window closes
 * Return false to prevent closing
 */
export declare function onWindowClose(callback: () => boolean | void | Promise<boolean | void>): () => void;
/**
 * Called before app quits
 */
export declare function onBeforeQuit(callback: () => void): () => void;
/**
 * Called when app will quit
 */
export declare function onWillQuit(callback: () => void): () => void;
/**
 * Called when app quits
 */
export declare function onQuit(callback: () => void): () => void;
/**
 * Called when app gains focus
 */
export declare function onFocus(callback: () => void): () => void;
/**
 * Called when app loses focus
 */
export declare function onBlur(callback: () => void): () => void;
/**
 * Called when an update is available
 */
export declare function onAppUpdate(callback: (info: UpdateInfo) => void): () => void;
/**
 * Called when update is downloaded and ready to install
 */
export declare function onUpdateDownloaded(callback: (info: UpdateInfo) => void): () => void;
/**
 * Check for app updates
 */
export declare function checkForUpdates(): Promise<UpdateInfo | null>;
/**
 * Download and install update
 */
export declare function installUpdate(onProgress?: (progress: number) => void): Promise<void>;
/**
 * Restart app to apply update
 */
export declare function restartApp(): Promise<void>;
/**
 * Quit the app
 */
export declare function quitApp(exitCode?: number): Promise<void>;
/**
 * Hide the app (macOS)
 */
export declare function hideApp(): Promise<void>;
/**
 * Show the app
 */
export declare function showApp(): Promise<void>;
/**
 * Get app ready state
 */
export declare function isAppReady(): boolean;
/**
 * Hook for lifecycle state
 */
export declare function useLifecycle(): {
    isReady: boolean;
    onReady: (callback: () => void) => () => void;
    onClose: (callback: () => boolean | void) => () => void;
    onFocus: (callback: () => void) => () => void;
    onBlur: (callback: () => void) => () => void;
};
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
export declare function createAppState<T>(key: string, defaultValue: T): AppState<T>;
//# sourceMappingURL=lifecycle.d.ts.map
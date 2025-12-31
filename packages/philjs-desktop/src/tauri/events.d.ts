/**
 * Tauri event system utilities
 */
import type { EventCallback, UnlistenFn } from './types.js';
/**
 * Listen to a Tauri event
 * @param event - Event name
 * @param callback - Event callback
 * @returns Unlisten function
 */
export declare function listen<T = unknown>(event: string, callback: EventCallback<T>): Promise<UnlistenFn>;
/**
 * Listen to an event once
 * @param event - Event name
 * @param callback - Event callback
 * @returns Unlisten function
 */
export declare function once<T = unknown>(event: string, callback: EventCallback<T>): Promise<UnlistenFn>;
/**
 * Emit an event to Rust backend
 * @param event - Event name
 * @param payload - Event payload
 */
export declare function emit(event: string, payload?: unknown): Promise<void>;
/**
 * Subscribe to Tauri event with decorator-style API
 * Returns a cleanup function
 */
export declare function onTauriEvent<T = unknown>(event: string, handler: EventCallback<T>): () => void;
/**
 * Create an event emitter for a specific event type
 */
export declare function createEventEmitter<T>(eventName: string): {
    emit: (payload: T) => Promise<void>;
    listen: (callback: EventCallback<T>) => Promise<UnlistenFn>;
    once: (callback: EventCallback<T>) => Promise<UnlistenFn>;
};
/**
 * Create a typed event listener
 */
export declare function createTypedListener<T>(eventName: string): (callback: (payload: T) => void) => Promise<UnlistenFn>;
/**
 * Wait for an event
 * @param event - Event name
 * @param timeout - Timeout in milliseconds
 * @returns Promise with event payload
 */
export declare function waitForEvent<T = unknown>(event: string, timeout?: number): Promise<T>;
/**
 * Remove all listeners for an event
 */
export declare function removeAllListeners(event: string): void;
/**
 * Remove all event listeners
 */
export declare function removeAllEventListeners(): void;
export declare const TauriEvents: {
    readonly WINDOW_RESIZED: "tauri://resize";
    readonly WINDOW_MOVED: "tauri://move";
    readonly WINDOW_CLOSE_REQUESTED: "tauri://close-requested";
    readonly WINDOW_CREATED: "tauri://window-created";
    readonly WINDOW_DESTROYED: "tauri://destroyed";
    readonly WINDOW_FOCUS: "tauri://focus";
    readonly WINDOW_BLUR: "tauri://blur";
    readonly WINDOW_SCALE_CHANGE: "tauri://scale-change";
    readonly WINDOW_THEME_CHANGED: "tauri://theme-changed";
    readonly WINDOW_FILE_DROP: "tauri://file-drop";
    readonly WINDOW_FILE_DROP_HOVER: "tauri://file-drop-hover";
    readonly WINDOW_FILE_DROP_CANCELLED: "tauri://file-drop-cancelled";
    readonly MENU: "tauri://menu";
    readonly UPDATE_AVAILABLE: "tauri://update-available";
    readonly UPDATE_INSTALL: "tauri://update-install";
    readonly UPDATE_STATUS: "tauri://update-status";
};
export type TauriEventType = (typeof TauriEvents)[keyof typeof TauriEvents];
//# sourceMappingURL=events.d.ts.map
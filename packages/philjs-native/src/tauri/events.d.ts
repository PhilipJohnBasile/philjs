/**
 * PhilJS Native - Tauri Event Handling
 *
 * Provides a comprehensive event system for Tauri applications
 * with typed events, namespaces, and reactive integration.
 */
import { type Signal } from 'philjs-core';
import { type TauriEvent } from './index.js';
/**
 * Event handler function
 */
export type EventHandler<T = unknown> = (payload: T, event: TauriEvent<T>) => void;
/**
 * Event subscription options
 */
export interface EventOptions {
    /** Only listen once */
    once?: boolean;
    /** Event namespace/prefix */
    namespace?: string;
    /** Filter events by window label */
    windowLabel?: string;
}
/**
 * Event channel for streaming events
 */
export interface EventChannel<T> {
    subscribe: (handler: EventHandler<T>) => () => void;
    latest: Signal<T | null>;
    history: Signal<T[]>;
    clear: () => void;
}
/**
 * Subscribe to a Tauri event
 */
export declare function subscribe<T = unknown>(event: string, handler: EventHandler<T>, options?: EventOptions): Promise<() => void>;
/**
 * Subscribe to event once
 */
export declare function subscribeOnce<T = unknown>(event: string, handler: EventHandler<T>, options?: Omit<EventOptions, 'once'>): Promise<() => void>;
/**
 * Publish an event
 */
export declare function publish<T = unknown>(event: string, payload: T, options?: {
    namespace?: string;
}): Promise<void>;
/**
 * Unsubscribe all handlers for an event
 */
export declare function unsubscribeAll(event: string): void;
/**
 * Clear all subscriptions
 */
export declare function clearAllSubscriptions(): void;
/**
 * Create an event channel for streaming events
 */
export declare function createEventChannel<T>(event: string, options?: EventOptions & {
    maxHistory?: number;
}): EventChannel<T>;
/**
 * Get an existing channel
 */
export declare function getEventChannel<T>(event: string, namespace?: string): EventChannel<T> | null;
/**
 * Create a namespaced event system
 */
export declare function createEventNamespace(namespace: string): {
    subscribe: <T>(event: string, handler: EventHandler<T>, options?: Omit<EventOptions, "namespace">) => Promise<() => void>;
    subscribeOnce: <T>(event: string, handler: EventHandler<T>, options?: Omit<EventOptions, "namespace" | "once">) => Promise<() => void>;
    publish: <T>(event: string, payload: T) => Promise<void>;
    createChannel: <T>(event: string, options?: Omit<EventOptions, "namespace"> & {
        maxHistory?: number;
    }) => EventChannel<T>;
    unsubscribeAll: (event: string) => void;
};
/**
 * Window events
 */
export declare const WindowEvents: {
    onFocus(handler: () => void): Promise<() => void>;
    onBlur(handler: () => void): Promise<() => void>;
    onResize(handler: (size: {
        width: number;
        height: number;
    }) => void): Promise<() => void>;
    onMove(handler: (position: {
        x: number;
        y: number;
    }) => void): Promise<() => void>;
    onCloseRequested(handler: (event: {
        preventDefault: () => void;
    }) => void): Promise<() => void>;
    onScaleChange(handler: (scale: {
        scaleFactor: number;
    }) => void): Promise<() => void>;
    onThemeChanged(handler: (theme: "light" | "dark") => void): Promise<() => void>;
    onFileDrop(handler: (paths: string[]) => void): Promise<() => void>;
    onFileDropHover(handler: (paths: string[]) => void): Promise<() => void>;
    onFileDropCancelled(handler: () => void): Promise<() => void>;
};
/**
 * Menu events
 */
export declare const MenuEvents: {
    onMenuItemClick(handler: (menuId: string) => void): Promise<() => void>;
};
/**
 * Update events
 */
export declare const UpdateEvents: {
    onUpdateAvailable(handler: (manifest: {
        version: string;
        date: string;
        body: string;
    }) => void): Promise<() => void>;
    onUpdateProgress(handler: (progress: {
        chunkLength: number;
        contentLength: number;
    }) => void): Promise<() => void>;
    onUpdateInstalled(handler: () => void): Promise<() => void>;
};
/**
 * Hook to subscribe to an event
 */
export declare function useEvent<T>(event: string, handler: EventHandler<T>, options?: EventOptions): void;
/**
 * Hook to get latest event value
 */
export declare function useEventValue<T>(event: string, options?: EventOptions): T | null;
/**
 * Hook to get event history
 */
export declare function useEventHistory<T>(event: string, options?: EventOptions & {
    maxHistory?: number;
}): T[];
/**
 * Hook for window focus state
 */
export declare function useWindowFocus(): boolean;
/**
 * Hook for window size
 */
export declare function useWindowSize(): {
    width: number;
    height: number;
};
/**
 * Hook for file drop events
 */
export declare function useFileDrop(options?: {
    onDrop?: (paths: string[]) => void;
    onHover?: (paths: string[]) => void;
    onCancel?: () => void;
}): {
    isHovering: boolean;
    droppedFiles: string[];
};
declare const _default: {
    subscribe: typeof subscribe;
    subscribeOnce: typeof subscribeOnce;
    publish: typeof publish;
    unsubscribeAll: typeof unsubscribeAll;
    clearAllSubscriptions: typeof clearAllSubscriptions;
    createEventChannel: typeof createEventChannel;
    getEventChannel: typeof getEventChannel;
    createEventNamespace: typeof createEventNamespace;
    WindowEvents: {
        onFocus(handler: () => void): Promise<() => void>;
        onBlur(handler: () => void): Promise<() => void>;
        onResize(handler: (size: {
            width: number;
            height: number;
        }) => void): Promise<() => void>;
        onMove(handler: (position: {
            x: number;
            y: number;
        }) => void): Promise<() => void>;
        onCloseRequested(handler: (event: {
            preventDefault: () => void;
        }) => void): Promise<() => void>;
        onScaleChange(handler: (scale: {
            scaleFactor: number;
        }) => void): Promise<() => void>;
        onThemeChanged(handler: (theme: "light" | "dark") => void): Promise<() => void>;
        onFileDrop(handler: (paths: string[]) => void): Promise<() => void>;
        onFileDropHover(handler: (paths: string[]) => void): Promise<() => void>;
        onFileDropCancelled(handler: () => void): Promise<() => void>;
    };
    MenuEvents: {
        onMenuItemClick(handler: (menuId: string) => void): Promise<() => void>;
    };
    UpdateEvents: {
        onUpdateAvailable(handler: (manifest: {
            version: string;
            date: string;
            body: string;
        }) => void): Promise<() => void>;
        onUpdateProgress(handler: (progress: {
            chunkLength: number;
            contentLength: number;
        }) => void): Promise<() => void>;
        onUpdateInstalled(handler: () => void): Promise<() => void>;
    };
};
export default _default;
//# sourceMappingURL=events.d.ts.map
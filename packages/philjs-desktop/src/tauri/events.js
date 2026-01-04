/**
 * Tauri event system utilities
 */
import { getTauriContext, isTauri } from './context.js';
// Store for event listeners
const eventListeners = new Map();
/**
 * Listen to a Tauri event
 * @param event - Event name
 * @param callback - Event callback
 * @returns Unlisten function
 */
export async function listen(event, callback) {
    const context = getTauriContext();
    const unlisten = await context.listen(event, callback);
    // Store reference for cleanup
    if (!eventListeners.has(event)) {
        eventListeners.set(event, new Map());
    }
    eventListeners.get(event).set(callback, unlisten);
    return () => {
        unlisten();
        eventListeners.get(event)?.delete(callback);
    };
}
/**
 * Listen to an event once
 * @param event - Event name
 * @param callback - Event callback
 * @returns Unlisten function
 */
export async function once(event, callback) {
    const context = getTauriContext();
    return context.once(event, callback);
}
/**
 * Emit an event to Rust backend
 * @param event - Event name
 * @param payload - Event payload
 */
export async function emit(event, payload) {
    const context = getTauriContext();
    return context.emit(event, payload);
}
/**
 * Subscribe to Tauri event with decorator-style API
 * Returns a cleanup function
 */
export function onTauriEvent(event, handler) {
    let unlisten = null;
    // Start listening
    listen(event, handler).then(fn => {
        unlisten = fn;
    });
    // Return cleanup function
    return () => {
        unlisten?.();
    };
}
/**
 * Create an event emitter for a specific event type
 */
export function createEventEmitter(eventName) {
    return {
        emit: (payload) => emit(eventName, payload),
        listen: (callback) => listen(eventName, callback),
        once: (callback) => once(eventName, callback),
    };
}
/**
 * Create a typed event listener
 */
export function createTypedListener(eventName) {
    return (callback) => {
        return listen(eventName, (event) => callback(event.payload));
    };
}
/**
 * Wait for an event
 * @param event - Event name
 * @param timeout - Timeout in milliseconds
 * @returns Promise with event payload
 */
export function waitForEvent(event, timeout) {
    return new Promise((resolve, reject) => {
        let timeoutId;
        let unlisten;
        if (timeout) {
            timeoutId = setTimeout(() => {
                unlisten?.();
                reject(new Error(`Timeout waiting for event "${event}"`));
            }, timeout);
        }
        once(event, (e) => {
            if (timeoutId)
                clearTimeout(timeoutId);
            resolve(e.payload);
        }).then(fn => {
            unlisten = fn;
        });
    });
}
/**
 * Remove all listeners for an event
 */
export function removeAllListeners(event) {
    const listeners = eventListeners.get(event);
    if (listeners) {
        for (const unlisten of listeners.values()) {
            unlisten();
        }
        eventListeners.delete(event);
    }
}
/**
 * Remove all event listeners
 */
export function removeAllEventListeners() {
    for (const event of eventListeners.keys()) {
        removeAllListeners(event);
    }
}
// Built-in Tauri events
export const TauriEvents = {
    WINDOW_RESIZED: 'tauri://resize',
    WINDOW_MOVED: 'tauri://move',
    WINDOW_CLOSE_REQUESTED: 'tauri://close-requested',
    WINDOW_CREATED: 'tauri://window-created',
    WINDOW_DESTROYED: 'tauri://destroyed',
    WINDOW_FOCUS: 'tauri://focus',
    WINDOW_BLUR: 'tauri://blur',
    WINDOW_SCALE_CHANGE: 'tauri://scale-change',
    WINDOW_THEME_CHANGED: 'tauri://theme-changed',
    WINDOW_FILE_DROP: 'tauri://file-drop',
    WINDOW_FILE_DROP_HOVER: 'tauri://file-drop-hover',
    WINDOW_FILE_DROP_CANCELLED: 'tauri://file-drop-cancelled',
    MENU: 'tauri://menu',
    UPDATE_AVAILABLE: 'tauri://update-available',
    UPDATE_INSTALL: 'tauri://update-install',
    UPDATE_STATUS: 'tauri://update-status',
};
//# sourceMappingURL=events.js.map
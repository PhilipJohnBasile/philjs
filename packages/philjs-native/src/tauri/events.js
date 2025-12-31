// @ts-nocheck
/**
 * PhilJS Native - Tauri Event Handling
 *
 * Provides a comprehensive event system for Tauri applications
 * with typed events, namespaces, and reactive integration.
 */
import { signal, effect } from 'philjs-core';
import { listen, once, emit, isTauri } from './index.js';
// ============================================================================
// Event Manager
// ============================================================================
/**
 * Active subscriptions
 */
const subscriptions = new Map();
/**
 * Event channels
 */
const channels = new Map();
/**
 * Subscribe to a Tauri event
 */
export async function subscribe(event, handler, options) {
    const fullEventName = options?.namespace ? `${options.namespace}:${event}` : event;
    const wrappedHandler = (e) => {
        // Filter by window label if specified
        if (options?.windowLabel && e.windowLabel !== options.windowLabel) {
            return;
        }
        handler(e.payload, e);
    };
    const unlisten = options?.once
        ? await once(fullEventName, wrappedHandler)
        : await listen(fullEventName, wrappedHandler);
    // Track subscription for cleanup
    if (!subscriptions.has(fullEventName)) {
        subscriptions.set(fullEventName, new Set());
    }
    subscriptions.get(fullEventName).add(unlisten);
    return () => {
        unlisten();
        subscriptions.get(fullEventName)?.delete(unlisten);
    };
}
/**
 * Subscribe to event once
 */
export async function subscribeOnce(event, handler, options) {
    return subscribe(event, handler, { ...options, once: true });
}
/**
 * Publish an event
 */
export async function publish(event, payload, options) {
    const fullEventName = options?.namespace ? `${options.namespace}:${event}` : event;
    await emit(fullEventName, payload);
}
/**
 * Unsubscribe all handlers for an event
 */
export function unsubscribeAll(event) {
    const handlers = subscriptions.get(event);
    if (handlers) {
        handlers.forEach((unlisten) => unlisten());
        handlers.clear();
        subscriptions.delete(event);
    }
}
/**
 * Clear all subscriptions
 */
export function clearAllSubscriptions() {
    subscriptions.forEach((handlers) => {
        handlers.forEach((unlisten) => unlisten());
    });
    subscriptions.clear();
}
// ============================================================================
// Event Channels
// ============================================================================
/**
 * Create an event channel for streaming events
 */
export function createEventChannel(event, options) {
    const key = options?.namespace ? `${options.namespace}:${event}` : event;
    // Return existing channel if exists
    if (channels.has(key)) {
        return channels.get(key);
    }
    const latest = signal(null);
    const history = signal([]);
    const maxHistory = options?.maxHistory || 100;
    // Subscribe to the event
    subscribe(event, (payload) => {
        latest.set(payload);
        const currentHistory = history();
        const newHistory = [...currentHistory, payload];
        if (newHistory.length > maxHistory) {
            newHistory.shift();
        }
        history.set(newHistory);
    }, options);
    const channel = {
        subscribe: (handler) => {
            return effect(() => {
                const value = latest();
                if (value !== null) {
                    handler(value, {
                        event,
                        windowLabel: 'main',
                        id: Date.now(),
                        payload: value,
                    });
                }
            });
        },
        latest,
        history,
        clear: () => {
            latest.set(null);
            history.set([]);
        },
    };
    channels.set(key, channel);
    return channel;
}
/**
 * Get an existing channel
 */
export function getEventChannel(event, namespace) {
    const key = namespace ? `${namespace}:${event}` : event;
    return channels.get(key) || null;
}
// ============================================================================
// Event Namespace
// ============================================================================
/**
 * Create a namespaced event system
 */
export function createEventNamespace(namespace) {
    return {
        subscribe: (event, handler, options) => subscribe(event, handler, { ...options, namespace }),
        subscribeOnce: (event, handler, options) => subscribeOnce(event, handler, { ...options, namespace }),
        publish: (event, payload) => publish(event, payload, { namespace }),
        createChannel: (event, options) => createEventChannel(event, { ...options, namespace }),
        unsubscribeAll: (event) => unsubscribeAll(`${namespace}:${event}`),
    };
}
// ============================================================================
// Built-in Tauri Events
// ============================================================================
/**
 * Window events
 */
export const WindowEvents = {
    async onFocus(handler) {
        return subscribe('tauri://focus', handler);
    },
    async onBlur(handler) {
        return subscribe('tauri://blur', handler);
    },
    async onResize(handler) {
        return subscribe('tauri://resize', handler);
    },
    async onMove(handler) {
        return subscribe('tauri://move', handler);
    },
    async onCloseRequested(handler) {
        return subscribe('tauri://close-requested', (_, e) => {
            let prevented = false;
            handler({
                preventDefault: () => {
                    prevented = true;
                },
            });
            // Handle prevention if needed
        });
    },
    async onScaleChange(handler) {
        return subscribe('tauri://scale-change', handler);
    },
    async onThemeChanged(handler) {
        return subscribe('tauri://theme-changed', handler);
    },
    async onFileDrop(handler) {
        return subscribe('tauri://file-drop', handler);
    },
    async onFileDropHover(handler) {
        return subscribe('tauri://file-drop-hover', handler);
    },
    async onFileDropCancelled(handler) {
        return subscribe('tauri://file-drop-cancelled', handler);
    },
};
/**
 * Menu events
 */
export const MenuEvents = {
    async onMenuItemClick(handler) {
        return subscribe('tauri://menu', (payload) => {
            handler(payload.menuId);
        });
    },
};
/**
 * Update events
 */
export const UpdateEvents = {
    async onUpdateAvailable(handler) {
        return subscribe('tauri://update-available', handler);
    },
    async onUpdateProgress(handler) {
        return subscribe('tauri://update-download-progress', handler);
    },
    async onUpdateInstalled(handler) {
        return subscribe('tauri://update-install', handler);
    },
};
// ============================================================================
// Reactive Event Hooks
// ============================================================================
/**
 * Hook to subscribe to an event
 */
export function useEvent(event, handler, options) {
    effect(() => {
        let cleanup;
        subscribe(event, handler, options).then((unlisten) => {
            cleanup = unlisten;
        });
        return () => {
            cleanup?.();
        };
    });
}
/**
 * Hook to get latest event value
 */
export function useEventValue(event, options) {
    const channel = createEventChannel(event, options);
    return channel.latest();
}
/**
 * Hook to get event history
 */
export function useEventHistory(event, options) {
    const channel = createEventChannel(event, options);
    return channel.history();
}
/**
 * Hook for window focus state
 */
export function useWindowFocus() {
    const focused = signal(true);
    effect(() => {
        let cleanup1;
        let cleanup2;
        WindowEvents.onFocus(() => focused.set(true)).then((u) => (cleanup1 = u));
        WindowEvents.onBlur(() => focused.set(false)).then((u) => (cleanup2 = u));
        return () => {
            cleanup1?.();
            cleanup2?.();
        };
    });
    return focused();
}
/**
 * Hook for window size
 */
export function useWindowSize() {
    const size = signal({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });
    effect(() => {
        let cleanup;
        WindowEvents.onResize((newSize) => size.set(newSize)).then((u) => (cleanup = u));
        return () => cleanup?.();
    });
    return size();
}
/**
 * Hook for file drop events
 */
export function useFileDrop(options) {
    const isHovering = signal(false);
    const droppedFiles = signal([]);
    effect(() => {
        const cleanups = [];
        WindowEvents.onFileDrop((paths) => {
            isHovering.set(false);
            droppedFiles.set(paths);
            options?.onDrop?.(paths);
        }).then((u) => cleanups.push(u));
        WindowEvents.onFileDropHover((paths) => {
            isHovering.set(true);
            options?.onHover?.(paths);
        }).then((u) => cleanups.push(u));
        WindowEvents.onFileDropCancelled(() => {
            isHovering.set(false);
            options?.onCancel?.();
        }).then((u) => cleanups.push(u));
        return () => cleanups.forEach((c) => c());
    });
    return {
        isHovering: isHovering(),
        droppedFiles: droppedFiles(),
    };
}
// ============================================================================
// Exports
// ============================================================================
export default {
    subscribe,
    subscribeOnce,
    publish,
    unsubscribeAll,
    clearAllSubscriptions,
    createEventChannel,
    getEventChannel,
    createEventNamespace,
    WindowEvents,
    MenuEvents,
    UpdateEvents,
};
//# sourceMappingURL=events.js.map
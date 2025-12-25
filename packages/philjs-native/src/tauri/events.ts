/**
 * PhilJS Native - Tauri Event Handling
 *
 * Provides a comprehensive event system for Tauri applications
 * with typed events, namespaces, and reactive integration.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { listen, once, emit, isTauri, type TauriEvent } from './index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Event Manager
// ============================================================================

/**
 * Active subscriptions
 */
const subscriptions = new Map<string, Set<() => void>>();

/**
 * Event channels
 */
const channels = new Map<string, EventChannel<any>>();

/**
 * Subscribe to a Tauri event
 */
export async function subscribe<T = unknown>(
  event: string,
  handler: EventHandler<T>,
  options?: EventOptions
): Promise<() => void> {
  const fullEventName = options?.namespace ? `${options.namespace}:${event}` : event;

  const wrappedHandler = (e: TauriEvent<T>) => {
    // Filter by window label if specified
    if (options?.windowLabel && e.windowLabel !== options.windowLabel) {
      return;
    }
    handler(e.payload, e);
  };

  const unlisten = options?.once
    ? await once<T>(fullEventName, wrappedHandler)
    : await listen<T>(fullEventName, wrappedHandler);

  // Track subscription for cleanup
  if (!subscriptions.has(fullEventName)) {
    subscriptions.set(fullEventName, new Set());
  }
  subscriptions.get(fullEventName)!.add(unlisten);

  return () => {
    unlisten();
    subscriptions.get(fullEventName)?.delete(unlisten);
  };
}

/**
 * Subscribe to event once
 */
export async function subscribeOnce<T = unknown>(
  event: string,
  handler: EventHandler<T>,
  options?: Omit<EventOptions, 'once'>
): Promise<() => void> {
  return subscribe<T>(event, handler, { ...options, once: true });
}

/**
 * Publish an event
 */
export async function publish<T = unknown>(
  event: string,
  payload: T,
  options?: { namespace?: string }
): Promise<void> {
  const fullEventName = options?.namespace ? `${options.namespace}:${event}` : event;
  await emit(fullEventName, payload);
}

/**
 * Unsubscribe all handlers for an event
 */
export function unsubscribeAll(event: string): void {
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
export function clearAllSubscriptions(): void {
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
export function createEventChannel<T>(
  event: string,
  options?: EventOptions & { maxHistory?: number }
): EventChannel<T> {
  const key = options?.namespace ? `${options.namespace}:${event}` : event;

  // Return existing channel if exists
  if (channels.has(key)) {
    return channels.get(key)!;
  }

  const latest: Signal<T | null> = signal(null);
  const history: Signal<T[]> = signal([]);
  const maxHistory = options?.maxHistory || 100;

  // Subscribe to the event
  subscribe<T>(event, (payload) => {
    latest.set(payload);

    const currentHistory = history();
    const newHistory = [...currentHistory, payload];
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    }
    history.set(newHistory);
  }, options);

  const channel: EventChannel<T> = {
    subscribe: (handler: EventHandler<T>) => {
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
export function getEventChannel<T>(event: string, namespace?: string): EventChannel<T> | null {
  const key = namespace ? `${namespace}:${event}` : event;
  return channels.get(key) || null;
}

// ============================================================================
// Event Namespace
// ============================================================================

/**
 * Create a namespaced event system
 */
export function createEventNamespace(namespace: string) {
  return {
    subscribe: <T>(event: string, handler: EventHandler<T>, options?: Omit<EventOptions, 'namespace'>) =>
      subscribe<T>(event, handler, { ...options, namespace }),

    subscribeOnce: <T>(event: string, handler: EventHandler<T>, options?: Omit<EventOptions, 'namespace' | 'once'>) =>
      subscribeOnce<T>(event, handler, { ...options, namespace }),

    publish: <T>(event: string, payload: T) =>
      publish<T>(event, payload, { namespace }),

    createChannel: <T>(event: string, options?: Omit<EventOptions, 'namespace'> & { maxHistory?: number }) =>
      createEventChannel<T>(event, { ...options, namespace }),

    unsubscribeAll: (event: string) =>
      unsubscribeAll(`${namespace}:${event}`),
  };
}

// ============================================================================
// Built-in Tauri Events
// ============================================================================

/**
 * Window events
 */
export const WindowEvents = {
  async onFocus(handler: () => void): Promise<() => void> {
    return subscribe('tauri://focus', handler);
  },

  async onBlur(handler: () => void): Promise<() => void> {
    return subscribe('tauri://blur', handler);
  },

  async onResize(handler: (size: { width: number; height: number }) => void): Promise<() => void> {
    return subscribe('tauri://resize', handler);
  },

  async onMove(handler: (position: { x: number; y: number }) => void): Promise<() => void> {
    return subscribe('tauri://move', handler);
  },

  async onCloseRequested(handler: (event: { preventDefault: () => void }) => void): Promise<() => void> {
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

  async onScaleChange(handler: (scale: { scaleFactor: number }) => void): Promise<() => void> {
    return subscribe('tauri://scale-change', handler);
  },

  async onThemeChanged(handler: (theme: 'light' | 'dark') => void): Promise<() => void> {
    return subscribe('tauri://theme-changed', handler);
  },

  async onFileDrop(handler: (paths: string[]) => void): Promise<() => void> {
    return subscribe('tauri://file-drop', handler);
  },

  async onFileDropHover(handler: (paths: string[]) => void): Promise<() => void> {
    return subscribe('tauri://file-drop-hover', handler);
  },

  async onFileDropCancelled(handler: () => void): Promise<() => void> {
    return subscribe('tauri://file-drop-cancelled', handler);
  },
};

/**
 * Menu events
 */
export const MenuEvents = {
  async onMenuItemClick(handler: (menuId: string) => void): Promise<() => void> {
    return subscribe('tauri://menu', (payload: { menuId: string }) => {
      handler(payload.menuId);
    });
  },
};

/**
 * Update events
 */
export const UpdateEvents = {
  async onUpdateAvailable(handler: (manifest: { version: string; date: string; body: string }) => void): Promise<() => void> {
    return subscribe('tauri://update-available', handler);
  },

  async onUpdateProgress(handler: (progress: { chunkLength: number; contentLength: number }) => void): Promise<() => void> {
    return subscribe('tauri://update-download-progress', handler);
  },

  async onUpdateInstalled(handler: () => void): Promise<() => void> {
    return subscribe('tauri://update-install', handler);
  },
};

// ============================================================================
// Reactive Event Hooks
// ============================================================================

/**
 * Hook to subscribe to an event
 */
export function useEvent<T>(
  event: string,
  handler: EventHandler<T>,
  options?: EventOptions
): void {
  effect(() => {
    let cleanup: (() => void) | undefined;

    subscribe<T>(event, handler, options).then((unlisten) => {
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
export function useEventValue<T>(
  event: string,
  options?: EventOptions
): T | null {
  const channel = createEventChannel<T>(event, options);
  return channel.latest();
}

/**
 * Hook to get event history
 */
export function useEventHistory<T>(
  event: string,
  options?: EventOptions & { maxHistory?: number }
): T[] {
  const channel = createEventChannel<T>(event, options);
  return channel.history();
}

/**
 * Hook for window focus state
 */
export function useWindowFocus(): boolean {
  const focused = signal(true);

  effect(() => {
    let cleanup1: (() => void) | undefined;
    let cleanup2: (() => void) | undefined;

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
export function useWindowSize(): { width: number; height: number } {
  const size = signal({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  effect(() => {
    let cleanup: (() => void) | undefined;

    WindowEvents.onResize((newSize) => size.set(newSize)).then((u) => (cleanup = u));

    return () => cleanup?.();
  });

  return size();
}

/**
 * Hook for file drop events
 */
export function useFileDrop(options?: {
  onDrop?: (paths: string[]) => void;
  onHover?: (paths: string[]) => void;
  onCancel?: () => void;
}): { isHovering: boolean; droppedFiles: string[] } {
  const isHovering = signal(false);
  const droppedFiles = signal<string[]>([]);

  effect(() => {
    const cleanups: Array<() => void> = [];

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

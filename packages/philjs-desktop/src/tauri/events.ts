/**
 * Tauri event system utilities
 */

import type { Event, EventCallback, UnlistenFn } from './types';
import { getTauriContext, isTauri } from './context';

// Store for event listeners
const eventListeners = new Map<string, Map<EventCallback, UnlistenFn>>();

/**
 * Listen to a Tauri event
 * @param event - Event name
 * @param callback - Event callback
 * @returns Unlisten function
 */
export async function listen<T = unknown>(
  event: string,
  callback: EventCallback<T>
): Promise<UnlistenFn> {
  const context = getTauriContext();
  const unlisten = await context.listen<T>(event, callback);

  // Store reference for cleanup
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Map());
  }
  eventListeners.get(event)!.set(callback as EventCallback, unlisten);

  return () => {
    unlisten();
    eventListeners.get(event)?.delete(callback as EventCallback);
  };
}

/**
 * Listen to an event once
 * @param event - Event name
 * @param callback - Event callback
 * @returns Unlisten function
 */
export async function once<T = unknown>(
  event: string,
  callback: EventCallback<T>
): Promise<UnlistenFn> {
  const context = getTauriContext();
  return context.once<T>(event, callback);
}

/**
 * Emit an event to Rust backend
 * @param event - Event name
 * @param payload - Event payload
 */
export async function emit(event: string, payload?: unknown): Promise<void> {
  const context = getTauriContext();
  return context.emit(event, payload);
}

/**
 * Subscribe to Tauri event with decorator-style API
 * Returns a cleanup function
 */
export function onTauriEvent<T = unknown>(
  event: string,
  handler: EventCallback<T>
): () => void {
  let unlisten: UnlistenFn | null = null;

  // Start listening
  listen<T>(event, handler).then(fn => {
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
export function createEventEmitter<T>(eventName: string) {
  return {
    emit: (payload: T) => emit(eventName, payload),
    listen: (callback: EventCallback<T>) => listen<T>(eventName, callback),
    once: (callback: EventCallback<T>) => once<T>(eventName, callback),
  };
}

/**
 * Create a typed event listener
 */
export function createTypedListener<T>(eventName: string) {
  return (callback: (payload: T) => void): Promise<UnlistenFn> => {
    return listen<T>(eventName, (event) => callback(event.payload));
  };
}

/**
 * Wait for an event
 * @param event - Event name
 * @param timeout - Timeout in milliseconds
 * @returns Promise with event payload
 */
export function waitForEvent<T = unknown>(
  event: string,
  timeout?: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    let unlisten: UnlistenFn | undefined;

    if (timeout) {
      timeoutId = setTimeout(() => {
        unlisten?.();
        reject(new Error(`Timeout waiting for event "${event}"`));
      }, timeout);
    }

    once<T>(event, (e) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(e.payload);
    }).then(fn => {
      unlisten = fn;
    });
  });
}

/**
 * Remove all listeners for an event
 */
export function removeAllListeners(event: string): void {
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
export function removeAllEventListeners(): void {
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
} as const;

export type TauriEventType = (typeof TauriEvents)[keyof typeof TauriEvents];

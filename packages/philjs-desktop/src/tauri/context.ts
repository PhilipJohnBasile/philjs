/**
 * Tauri Context and Hook
 */

import type { TauriContext, AppInfo, EventCallback, UnlistenFn } from './types.js';

// Check if we're in a Tauri environment
function getTauriRoot(): Window | typeof globalThis | null {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return null;
}

function checkTauriEnvironment(): boolean {
  const root = getTauriRoot();
  if (!root) return false;
  return '__TAURI__' in root || '__TAURI_INTERNALS__' in root;
}

// Get Tauri internals
function getTauriInternals(): any {
  const root = getTauriRoot();
  if (!root) return null;
  return (root as any).__TAURI_INTERNALS__ || (root as any).__TAURI__;
}

function getTauriEvents(): any {
  const root = getTauriRoot();
  return root ? (root as any).__TAURI_EVENTS__ : null;
}

// Current Tauri context
let currentContext: TauriContext | null = null;

/**
 * Initialize and get Tauri context
 */
export async function initTauriContext(): Promise<TauriContext> {
  if (currentContext) return currentContext;

  const isTauri = checkTauriEnvironment();

  if (!isTauri) {
    // Return mock context for non-Tauri environments
    currentContext = createMockContext();
    return currentContext;
  }

  const internals = getTauriInternals();
  const events = getTauriEvents();

  // Get app info
  let appInfo: AppInfo;
  try {
    const safeInvoke = async (command: string, fallback: string) => {
      if (!internals?.invoke) return fallback;
      try {
        const result = await Promise.resolve(internals.invoke(command));
        return result ?? fallback;
      } catch {
        return fallback;
      }
    };
    const [name, version, tauriVersion] = await Promise.all([
      safeInvoke('plugin:app|name', 'Unknown'),
      safeInvoke('plugin:app|version', '0.0.0'),
      safeInvoke('plugin:app|tauri_version', '2.0.0'),
    ]);
    appInfo = { name, version, tauriVersion };
  } catch {
    appInfo = { name: 'PhilJS App', version: '1.0.0', tauriVersion: '2.0.0' };
  }

  currentContext = {
    isTauri: true,
    invoke: async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
      return internals.invoke(command, args);
    },
    listen: async <T>(event: string, callback: EventCallback<T>): Promise<UnlistenFn> => {
      if (events?.listen) {
        return await Promise.resolve(events.listen(event, callback as any));
      }
      const { listen } = await import('@tauri-apps/api/event');
      return listen(event, callback as any);
    },
    once: async <T>(event: string, callback: EventCallback<T>): Promise<UnlistenFn> => {
      if (events?.once) {
        return await Promise.resolve(events.once(event, callback as any));
      }
      const { once } = await import('@tauri-apps/api/event');
      return once(event, callback as any);
    },
    emit: async (event: string, payload?: unknown): Promise<void> => {
      if (events?.emit) {
        await Promise.resolve(events.emit(event, payload));
        return;
      }
      const { emit } = await import('@tauri-apps/api/event');
      return emit(event, payload);
    },
    app: appInfo,
  };

  return currentContext;
}

/**
 * Create a mock context for non-Tauri environments
 */
function createMockContext(): TauriContext {
  const listeners = new Map<string, Set<EventCallback>>();

  return {
    isTauri: false,
    invoke: async <T>(_command: string, _args?: Record<string, unknown>): Promise<T> => {
      console.warn('[PhilJS Desktop] invoke() called outside Tauri environment');
      throw new Error('Not running in Tauri environment');
    },
    listen: async <T>(event: string, callback: EventCallback<T>): Promise<UnlistenFn> => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(callback as EventCallback);
      return () => {
        listeners.get(event)?.delete(callback as EventCallback);
      };
    },
    once: async <T>(event: string, callback: EventCallback<T>): Promise<UnlistenFn> => {
      const unlisten = await createMockContext().listen<T>(event, (e) => {
        callback(e);
        unlisten();
      });
      return unlisten;
    },
    emit: async (_event: string, _payload?: unknown): Promise<void> => {
      console.warn('[PhilJS Desktop] emit() called outside Tauri environment');
    },
    app: {
      name: 'Mock App',
      version: '0.0.0',
      tauriVersion: '0.0.0',
    },
  };
}

/**
 * Get the current Tauri context
 * Must be called after initTauriContext()
 */
export function getTauriContext(): TauriContext {
  if (!currentContext) {
    throw new Error('Tauri context not initialized. Call initTauriContext() first.');
  }
  return currentContext;
}

/**
 * Hook to access Tauri APIs
 * Returns the Tauri context with invoke, listen, emit, etc.
 */
export function useTauri(): TauriContext {
  return getTauriContext();
}

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return checkTauriEnvironment();
}

/**
 * Reset context (for testing)
 */
export function resetTauriContext(): void {
  currentContext = null;
}

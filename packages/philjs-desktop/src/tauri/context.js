/**
 * Tauri Context and Hook
 */
// Check if we're in a Tauri environment
function getTauriRoot() {
    if (typeof window !== 'undefined')
        return window;
    if (typeof globalThis !== 'undefined')
        return globalThis;
    return null;
}
function checkTauriEnvironment() {
    const root = getTauriRoot();
    if (!root)
        return false;
    return '__TAURI__' in root || '__TAURI_INTERNALS__' in root;
}
// Get Tauri internals
function getTauriInternals() {
    const root = getTauriRoot();
    if (!root)
        return null;
    return root.__TAURI_INTERNALS__ || root.__TAURI__;
}
function getTauriEvents() {
    const root = getTauriRoot();
    return root ? root.__TAURI_EVENTS__ : null;
}
// Current Tauri context
let currentContext = null;
/**
 * Initialize and get Tauri context
 */
export async function initTauriContext() {
    if (currentContext)
        return currentContext;
    const isTauri = checkTauriEnvironment();
    if (!isTauri) {
        // Return mock context for non-Tauri environments
        currentContext = createMockContext();
        return currentContext;
    }
    const internals = getTauriInternals();
    const events = getTauriEvents();
    // Get app info
    let appInfo;
    try {
        const safeInvoke = async (command, fallback) => {
            if (!internals?.invoke)
                return fallback;
            try {
                const result = await Promise.resolve(internals.invoke(command));
                return result ?? fallback;
            }
            catch {
                return fallback;
            }
        };
        const [name, version, tauriVersion] = await Promise.all([
            safeInvoke('plugin:app|name', 'Unknown'),
            safeInvoke('plugin:app|version', '0.0.0'),
            safeInvoke('plugin:app|tauri_version', '2.0.0'),
        ]);
        appInfo = { name, version, tauriVersion };
    }
    catch {
        appInfo = { name: 'PhilJS App', version: '1.0.0', tauriVersion: '2.0.0' };
    }
    currentContext = {
        isTauri: true,
        invoke: async (command, args) => {
            return internals.invoke(command, args);
        },
        listen: async (event, callback) => {
            if (events?.listen) {
                return await Promise.resolve(events.listen(event, callback));
            }
            const { listen } = await import('@tauri-apps/api/event');
            return listen(event, callback);
        },
        once: async (event, callback) => {
            if (events?.once) {
                return await Promise.resolve(events.once(event, callback));
            }
            const { once } = await import('@tauri-apps/api/event');
            return once(event, callback);
        },
        emit: async (event, payload) => {
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
function createMockContext() {
    const listeners = new Map();
    return {
        isTauri: false,
        invoke: async (_command, _args) => {
            console.warn('[PhilJS Desktop] invoke() called outside Tauri environment');
            throw new Error('Not running in Tauri environment');
        },
        listen: async (event, callback) => {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event).add(callback);
            return () => {
                listeners.get(event)?.delete(callback);
            };
        },
        once: async (event, callback) => {
            const unlisten = await createMockContext().listen(event, (e) => {
                callback(e);
                unlisten();
            });
            return unlisten;
        },
        emit: async (_event, _payload) => {
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
export function getTauriContext() {
    if (!currentContext) {
        throw new Error('Tauri context not initialized. Call initTauriContext() first.');
    }
    return currentContext;
}
/**
 * Hook to access Tauri APIs
 * Returns the Tauri context with invoke, listen, emit, etc.
 */
export function useTauri() {
    return getTauriContext();
}
/**
 * Check if running in Tauri environment
 */
export function isTauri() {
    return checkTauriEnvironment();
}
/**
 * Reset context (for testing)
 */
export function resetTauriContext() {
    currentContext = null;
}
//# sourceMappingURL=context.js.map
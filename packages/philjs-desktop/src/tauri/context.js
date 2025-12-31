/**
 * Tauri Context and Hook
 */
// Check if we're in a Tauri environment
function checkTauriEnvironment() {
    if (typeof window === 'undefined')
        return false;
    return '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
}
// Get Tauri internals
function getTauriInternals() {
    if (typeof window === 'undefined')
        return null;
    return window.__TAURI_INTERNALS__ || window.__TAURI__;
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
    // Get app info
    let appInfo;
    try {
        const [name, version, tauriVersion] = await Promise.all([
            internals.invoke('plugin:app|name').catch(() => 'Unknown'),
            internals.invoke('plugin:app|version').catch(() => '0.0.0'),
            internals.invoke('plugin:app|tauri_version').catch(() => '2.0.0'),
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
            const { listen } = await import('@tauri-apps/api/event');
            return listen(event, callback);
        },
        once: async (event, callback) => {
            const { once } = await import('@tauri-apps/api/event');
            return once(event, callback);
        },
        emit: async (event, payload) => {
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
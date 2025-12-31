/**
 * NetInfo API
 *
 * Network connectivity status and monitoring.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Configuration
// ============================================================================
const defaultConfig = {
    reachabilityUrl: 'https://clients3.google.com/generate_204',
    reachabilityMethod: 'HEAD',
    reachabilityTimeout: 15000,
    reachabilityCheckInterval: 30000,
    shouldFetchWhenOffline: false,
};
let config = { ...defaultConfig };
/**
 * Configure NetInfo
 */
export function configure(options) {
    config = { ...config, ...options };
}
// ============================================================================
// State
// ============================================================================
/**
 * Get initial network state
 */
function getInitialState() {
    if (typeof navigator === 'undefined') {
        return {
            type: 'unknown',
            isConnected: null,
            isInternetReachable: null,
            isConnectionExpensive: false,
            details: null,
        };
    }
    const connection = navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
    let type = 'unknown';
    let isConnectionExpensive = false;
    if (connection) {
        // Map connection type
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') {
            type = 'wifi'; // Could be wifi or 4g
        }
        else if (effectiveType === '3g' || effectiveType === '2g') {
            type = 'cellular';
        }
        isConnectionExpensive = connection.saveData || false;
    }
    const isConnected = navigator.onLine;
    return {
        type: isConnected ? type : 'none',
        isConnected,
        isInternetReachable: null, // Will be determined by reachability check
        isConnectionExpensive,
        details: null,
    };
}
/**
 * Network state signal
 */
const networkState = signal(getInitialState());
/**
 * Subscribers for state changes
 */
const subscribers = new Set();
/**
 * Reachability check interval
 */
let reachabilityInterval = null;
// ============================================================================
// Reachability Check
// ============================================================================
/**
 * Check if internet is reachable
 */
async function checkReachability() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.reachabilityTimeout);
        const response = await fetch(config.reachabilityUrl, {
            method: config.reachabilityMethod,
            cache: 'no-cache',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok || response.status === 204;
    }
    catch {
        return false;
    }
}
/**
 * Update network state with reachability
 */
async function updateNetworkState() {
    const current = networkState();
    const isInternetReachable = current.isConnected ? await checkReachability() : false;
    const newState = {
        ...getInitialState(),
        isInternetReachable,
    };
    networkState.set(newState);
    // Notify subscribers
    subscribers.forEach(handler => {
        try {
            handler(newState);
        }
        catch (error) {
            console.error('Error in NetInfo change handler:', error);
        }
    });
}
// ============================================================================
// Event Listeners
// ============================================================================
if (typeof window !== 'undefined') {
    // Online/offline events
    window.addEventListener('online', () => {
        updateNetworkState();
    });
    window.addEventListener('offline', () => {
        const current = networkState();
        const newState = {
            ...current,
            type: 'none',
            isConnected: false,
            isInternetReachable: false,
        };
        networkState.set(newState);
        subscribers.forEach(handler => handler(newState));
    });
    // Connection change event
    const connection = navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
    if (connection) {
        connection.addEventListener('change', () => {
            updateNetworkState();
        });
    }
}
// ============================================================================
// NetInfo API
// ============================================================================
/**
 * NetInfo - Network connectivity information
 */
export const NetInfo = {
    /**
     * Configure NetInfo
     */
    configure,
    /**
     * Get current network state
     */
    async fetch() {
        const platform = detectPlatform();
        if (platform !== 'web') {
            // Get from native
            const state = await nativeBridge.call('NetInfo', 'fetch');
            networkState.set(state);
            return state;
        }
        // Update and return current state
        await updateNetworkState();
        return networkState();
    },
    /**
     * Refresh network state
     */
    async refresh() {
        return this.fetch();
    },
    /**
     * Subscribe to network state changes
     */
    addEventListener(type, handler) {
        subscribers.add(handler);
        // Start reachability interval if not running
        if (reachabilityInterval === null && config.reachabilityCheckInterval > 0) {
            reachabilityInterval = setInterval(updateNetworkState, config.reachabilityCheckInterval);
        }
        // Return unsubscribe function
        return () => {
            subscribers.delete(handler);
            // Stop interval if no subscribers
            if (subscribers.size === 0 && reachabilityInterval !== null) {
                clearInterval(reachabilityInterval);
                reachabilityInterval = null;
            }
        };
    },
    /**
     * Use as event emitter (for compatibility)
     */
    useNetInfo: undefined,
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get network state
 */
export function useNetInfo() {
    return networkState();
}
/**
 * Hook to check if connected
 */
export function useIsConnected() {
    return networkState().isConnected === true;
}
/**
 * Hook to check if internet is reachable
 */
export function useIsInternetReachable() {
    return networkState().isInternetReachable;
}
/**
 * Hook to get network type
 */
export function useNetworkType() {
    return networkState().type;
}
// Attach hook to NetInfo
NetInfo.useNetInfo = useNetInfo;
// ============================================================================
// Signals
// ============================================================================
/**
 * Reactive network state signal
 */
export const netInfoState = networkState;
/**
 * Reactive connected signal
 */
export const isConnected = signal(networkState().isConnected === true);
/**
 * Reactive internet reachable signal
 */
export const isInternetReachable = signal(networkState().isInternetReachable);
/**
 * Reactive network type signal
 */
export const networkType = signal(networkState().type);
// Keep signals in sync
effect(() => {
    const state = networkState();
    isConnected.set(state.isConnected === true);
    isInternetReachable.set(state.isInternetReachable);
    networkType.set(state.type);
});
// ============================================================================
// Utilities
// ============================================================================
/**
 * Execute callback when network becomes available
 */
export function whenConnected(callback) {
    if (networkState().isConnected) {
        callback();
        return () => { };
    }
    return NetInfo.addEventListener('connectionChange', (state) => {
        if (state.isConnected) {
            callback();
        }
    });
}
/**
 * Execute callback when internet becomes reachable
 */
export function whenReachable(callback) {
    if (networkState().isInternetReachable) {
        callback();
        return () => { };
    }
    return NetInfo.addEventListener('connectionChange', (state) => {
        if (state.isInternetReachable) {
            callback();
        }
    });
}
/**
 * Check if on WiFi
 */
export function isOnWifi() {
    return networkState().type === 'wifi';
}
/**
 * Check if on cellular
 */
export function isOnCellular() {
    return networkState().type === 'cellular';
}
/**
 * Check if on expensive connection
 */
export function isExpensiveConnection() {
    return networkState().isConnectionExpensive;
}
export default NetInfo;
//# sourceMappingURL=NetInfo.js.map
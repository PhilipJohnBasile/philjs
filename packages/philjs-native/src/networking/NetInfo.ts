/**
 * NetInfo API
 *
 * Network connectivity status and monitoring.
 */

import { signal, effect, type Signal } from '@philjs/core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Network state type
 */
export type NetInfoStateType =
  | 'unknown'
  | 'none'
  | 'wifi'
  | 'cellular'
  | 'bluetooth'
  | 'ethernet'
  | 'wimax'
  | 'vpn'
  | 'other';

/**
 * Cellular generation
 */
export type CellularGeneration = '2g' | '3g' | '4g' | '5g' | null;

/**
 * Network state details for cellular
 */
export interface NetInfoCellularState {
  /**
   * Whether the carrier allows VoIP
   */
  isConnectionExpensive: boolean;

  /**
   * Cellular generation
   */
  cellularGeneration: CellularGeneration;

  /**
   * Carrier name
   */
  carrier?: string;
}

/**
 * Network state details for wifi
 */
export interface NetInfoWifiState {
  /**
   * Whether the connection uses metered data
   */
  isConnectionExpensive: boolean;

  /**
   * SSID of the connected network
   */
  ssid?: string;

  /**
   * BSSID of the connected network
   */
  bssid?: string;

  /**
   * Signal strength
   */
  strength?: number;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * Subnet mask
   */
  subnet?: string;

  /**
   * Link speed in Mbps
   */
  linkSpeed?: number;

  /**
   * Frequency in MHz
   */
  frequency?: number;
}

/**
 * Full network state
 */
export interface NetInfoState {
  /**
   * Type of connection
   */
  type: NetInfoStateType;

  /**
   * Whether connected
   */
  isConnected: boolean | null;

  /**
   * Whether the internet is reachable
   */
  isInternetReachable: boolean | null;

  /**
   * Whether using an expensive connection
   */
  isConnectionExpensive: boolean;

  /**
   * Whether WiFi is enabled
   */
  isWifiEnabled?: boolean;

  /**
   * WiFi details (if connected via WiFi)
   */
  details: NetInfoCellularState | NetInfoWifiState | null;
}

/**
 * Network state change handler
 */
export type NetInfoChangeHandler = (state: NetInfoState) => void;

/**
 * Configuration for fetch
 */
export interface NetInfoConfiguration {
  /**
   * URL to check for internet reachability
   */
  reachabilityUrl: string;

  /**
   * HTTP method to use for reachability check
   */
  reachabilityMethod: 'HEAD' | 'GET';

  /**
   * Timeout for reachability check in ms
   */
  reachabilityTimeout: number;

  /**
   * Interval between reachability checks in ms
   */
  reachabilityCheckInterval: number;

  /**
   * Whether to check reachability on reconnect
   */
  shouldFetchWhenOffline: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const defaultConfig: NetInfoConfiguration = {
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
export function configure(options: Partial<NetInfoConfiguration>): void {
  config = { ...config, ...options };
}

// ============================================================================
// State
// ============================================================================

/**
 * Get initial network state
 */
function getInitialState(): NetInfoState {
  if (typeof navigator === 'undefined') {
    return {
      type: 'unknown',
      isConnected: null,
      isInternetReachable: null,
      isConnectionExpensive: false,
      details: null,
    };
  }

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  let type: NetInfoStateType = 'unknown';
  let isConnectionExpensive = false;

  if (connection) {
    // Map connection type
    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') {
      type = 'wifi'; // Could be wifi or 4g
    } else if (effectiveType === '3g' || effectiveType === '2g') {
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
const networkState: Signal<NetInfoState> = signal(getInitialState());

/**
 * Subscribers for state changes
 */
const subscribers = new Set<NetInfoChangeHandler>();

/**
 * Reachability check interval
 */
let reachabilityInterval: ReturnType<typeof setInterval> | null = null;

// ============================================================================
// Reachability Check
// ============================================================================

/**
 * Check if internet is reachable
 */
async function checkReachability(): Promise<boolean> {
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
  } catch {
    return false;
  }
}

/**
 * Update network state with reachability
 */
async function updateNetworkState(): Promise<void> {
  const current = networkState();
  const isInternetReachable = current.isConnected ? await checkReachability() : false;

  const newState: NetInfoState = {
    ...getInitialState(),
    isInternetReachable,
  };

  networkState.set(newState);

  // Notify subscribers
  subscribers.forEach(handler => {
    try {
      handler(newState);
    } catch (error) {
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
    const newState: NetInfoState = {
      ...current,
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    };
    networkState.set(newState);
    subscribers.forEach(handler => handler(newState));
  });

  // Connection change event
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

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
  async fetch(): Promise<NetInfoState> {
    const platform = detectPlatform();

    if (platform !== 'web') {
      // Get from native
      const state = await nativeBridge.call<NetInfoState>('NetInfo', 'fetch');
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
  async refresh(): Promise<NetInfoState> {
    return this.fetch();
  },

  /**
   * Subscribe to network state changes
   */
  addEventListener(
    type: 'connectionChange',
    handler: NetInfoChangeHandler
  ): () => void {
    subscribers.add(handler);

    // Start reachability interval if not running
    if (reachabilityInterval === null && config.reachabilityCheckInterval > 0) {
      reachabilityInterval = setInterval(
        updateNetworkState,
        config.reachabilityCheckInterval
      );
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
  useNetInfo: undefined as unknown as () => NetInfoState,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get network state
 */
export function useNetInfo(): NetInfoState {
  return networkState();
}

/**
 * Hook to check if connected
 */
export function useIsConnected(): boolean {
  return networkState().isConnected === true;
}

/**
 * Hook to check if internet is reachable
 */
export function useIsInternetReachable(): boolean | null {
  return networkState().isInternetReachable;
}

/**
 * Hook to get network type
 */
export function useNetworkType(): NetInfoStateType {
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
export const netInfoState: Signal<NetInfoState> = networkState;

/**
 * Reactive connected signal
 */
export const isConnected: Signal<boolean> = signal(
  networkState().isConnected === true
);

/**
 * Reactive internet reachable signal
 */
export const isInternetReachable: Signal<boolean | null> = signal(
  networkState().isInternetReachable
);

/**
 * Reactive network type signal
 */
export const networkType: Signal<NetInfoStateType> = signal(
  networkState().type
);

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
export function whenConnected(callback: () => void): () => void {
  if (networkState().isConnected) {
    callback();
    return () => {};
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
export function whenReachable(callback: () => void): () => void {
  if (networkState().isInternetReachable) {
    callback();
    return () => {};
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
export function isOnWifi(): boolean {
  return networkState().type === 'wifi';
}

/**
 * Check if on cellular
 */
export function isOnCellular(): boolean {
  return networkState().type === 'cellular';
}

/**
 * Check if on expensive connection
 */
export function isExpensiveConnection(): boolean {
  return networkState().isConnectionExpensive;
}

export default NetInfo;

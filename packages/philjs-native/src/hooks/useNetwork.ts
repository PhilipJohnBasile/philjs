/**
 * PhilJS Native - useNetwork Hook
 *
 * Provides network connectivity status with connection type,
 * speed estimation, and online/offline detection.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { isCapacitor, callPlugin, isNativePlatform, addLifecycleListener } from '../capacitor/index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Network connection type
 */
export type ConnectionType =
  | 'wifi'
  | 'cellular'
  | '2g'
  | '3g'
  | '4g'
  | '5g'
  | 'ethernet'
  | 'bluetooth'
  | 'none'
  | 'unknown';

/**
 * Effective connection type (from Network Information API)
 */
export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

/**
 * Network status
 */
export interface NetworkStatus {
  /** Whether device is online */
  isOnline: boolean;
  /** Whether device is offline */
  isOffline: boolean;
  /** Connection type */
  connectionType: ConnectionType;
  /** Effective connection type */
  effectiveType: EffectiveConnectionType | null;
  /** Whether connection is metered (cellular) */
  isMetered: boolean;
  /** Downlink speed in Mbps */
  downlink: number | null;
  /** Round-trip time in ms */
  rtt: number | null;
  /** Data saver mode enabled */
  saveData: boolean;
  /** Last status change timestamp */
  lastChanged: Date;
}

// ============================================================================
// State
// ============================================================================

/**
 * Network status signal
 */
const networkStatusSignal: Signal<NetworkStatus> = signal(getInitialNetworkStatus());

/**
 * Network change listeners
 */
const networkChangeListeners = new Set<(status: NetworkStatus) => void>();

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Get initial network status
 */
function getInitialNetworkStatus(): NetworkStatus {
  if (typeof navigator === 'undefined') {
    return {
      isOnline: true,
      isOffline: false,
      connectionType: 'unknown',
      effectiveType: null,
      isMetered: false,
      downlink: null,
      rtt: null,
      saveData: false,
      lastChanged: new Date(),
    };
  }

  const isOnline = navigator.onLine;
  const connection = getNetworkConnection();

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType: getConnectionType(connection),
    effectiveType: connection?.effectiveType || null,
    isMetered: isMeteredConnection(connection),
    downlink: connection?.downlink || null,
    rtt: connection?.rtt || null,
    saveData: connection?.saveData || false,
    lastChanged: new Date(),
  };
}

/**
 * Get Network Information API connection
 */
function getNetworkConnection(): any {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
}

/**
 * Get connection type
 */
function getConnectionType(connection: any): ConnectionType {
  if (!connection) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'none';
    }
    return 'unknown';
  }

  const type = connection.type?.toLowerCase();

  switch (type) {
    case 'wifi':
      return 'wifi';
    case 'cellular':
      // Check for specific cellular type
      const effectiveType = connection.effectiveType;
      if (effectiveType === '4g') return '4g';
      if (effectiveType === '3g') return '3g';
      if (effectiveType === '2g' || effectiveType === 'slow-2g') return '2g';
      return 'cellular';
    case 'ethernet':
      return 'ethernet';
    case 'bluetooth':
      return 'bluetooth';
    case 'none':
      return 'none';
    default:
      return 'unknown';
  }
}

/**
 * Check if connection is metered
 */
function isMeteredConnection(connection: any): boolean {
  if (!connection) return false;

  // Check connection type
  if (connection.type === 'cellular') return true;

  // Check effective type for low bandwidth
  const effectiveType = connection.effectiveType;
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return true;

  // Check if explicitly metered
  if (connection.metered !== undefined) return connection.metered;

  return false;
}

/**
 * Update network status
 */
function updateNetworkStatus(): void {
  const newStatus = getInitialNetworkStatus();
  const currentStatus = networkStatusSignal();

  // Only update if something changed
  if (
    newStatus.isOnline !== currentStatus.isOnline ||
    newStatus.connectionType !== currentStatus.connectionType ||
    newStatus.effectiveType !== currentStatus.effectiveType
  ) {
    newStatus.lastChanged = new Date();
    networkStatusSignal.set(newStatus);

    // Notify listeners
    networkChangeListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Set up network listeners
 */
function setupNetworkListeners(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    updateNetworkStatus();
  };

  const handleOffline = () => {
    const status = networkStatusSignal();
    networkStatusSignal.set({
      ...status,
      isOnline: false,
      isOffline: true,
      connectionType: 'none',
      lastChanged: new Date(),
    });

    networkChangeListeners.forEach((listener) => {
      try {
        listener(networkStatusSignal());
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  };

  const handleConnectionChange = () => {
    updateNetworkStatus();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Network Information API
  const connection = getNetworkConnection();
  if (connection) {
    connection.addEventListener('change', handleConnectionChange);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange);
    }
  };
}

// Initialize listeners
if (typeof window !== 'undefined') {
  setupNetworkListeners();
}

// ============================================================================
// Native Network Status (Capacitor)
// ============================================================================

/**
 * Get native network status
 */
async function getNativeNetworkStatus(): Promise<NetworkStatus | null> {
  if (!isNativePlatform()) return null;

  try {
    const status = await callPlugin<never, {
      connected: boolean;
      connectionType: string;
    }>('Network', 'getStatus');

    return {
      isOnline: status.connected,
      isOffline: !status.connected,
      connectionType: status.connectionType as ConnectionType,
      effectiveType: null,
      isMetered: status.connectionType === 'cellular',
      downlink: null,
      rtt: null,
      saveData: false,
      lastChanged: new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * Set up native network listener
 */
async function setupNativeNetworkListener(): Promise<() => void> {
  if (!isNativePlatform()) return () => {};

  try {
    // Get initial status
    const nativeStatus = await getNativeNetworkStatus();
    if (nativeStatus) {
      networkStatusSignal.set(nativeStatus);
    }

    // Set up listener (Capacitor)
    const capacitor = (window as any).Capacitor;
    if (capacitor?.Plugins?.Network) {
      const handle = capacitor.Plugins.Network.addListener(
        'networkStatusChange',
        (status: { connected: boolean; connectionType: string }) => {
          networkStatusSignal.set({
            isOnline: status.connected,
            isOffline: !status.connected,
            connectionType: status.connectionType as ConnectionType,
            effectiveType: null,
            isMetered: status.connectionType === 'cellular',
            downlink: null,
            rtt: null,
            saveData: false,
            lastChanged: new Date(),
          });

          networkChangeListeners.forEach((listener) => {
            listener(networkStatusSignal());
          });
        }
      );

      return () => handle.remove();
    }
  } catch {
    // Fall back to web API
  }

  return () => {};
}

// Initialize native listener
if (typeof window !== 'undefined' && isNativePlatform()) {
  setupNativeNetworkListener();
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to get network status
 */
export function useNetwork(): NetworkStatus {
  return networkStatusSignal();
}

/**
 * Hook for online/offline status
 */
export function useIsOnline(): boolean {
  return networkStatusSignal().isOnline;
}

/**
 * Hook for offline status
 */
export function useIsOffline(): boolean {
  return networkStatusSignal().isOffline;
}

/**
 * Hook for connection type
 */
export function useConnectionType(): ConnectionType {
  return networkStatusSignal().connectionType;
}

/**
 * Hook with network change callback
 */
export function useNetworkChange(
  callback: (status: NetworkStatus) => void
): NetworkStatus {
  effect(() => {
    networkChangeListeners.add(callback);
    return () => {
      networkChangeListeners.delete(callback);
    };
  });

  return networkStatusSignal();
}

/**
 * Hook for when connection goes offline
 */
export function useOnOffline(callback: () => void): void {
  effect(() => {
    const handler = (status: NetworkStatus) => {
      if (status.isOffline) {
        callback();
      }
    };

    networkChangeListeners.add(handler);
    return () => {
      networkChangeListeners.delete(handler);
    };
  });
}

/**
 * Hook for when connection comes online
 */
export function useOnOnline(callback: () => void): void {
  effect(() => {
    const handler = (status: NetworkStatus) => {
      if (status.isOnline) {
        callback();
      }
    };

    networkChangeListeners.add(handler);
    return () => {
      networkChangeListeners.delete(handler);
    };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current network status synchronously
 */
export function getNetworkStatus(): NetworkStatus {
  return networkStatusSignal();
}

/**
 * Check if Network Information API is supported
 */
export function supportsNetworkInformation(): boolean {
  return !!getNetworkConnection();
}

/**
 * Estimate connection quality
 */
export function getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'none' {
  const status = networkStatusSignal();

  if (!status.isOnline) return 'none';

  // Use effective type if available
  if (status.effectiveType) {
    switch (status.effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
        return 'fair';
      case 'slow-2g':
        return 'poor';
    }
  }

  // Use connection type
  switch (status.connectionType) {
    case 'wifi':
    case 'ethernet':
      return 'excellent';
    case '4g':
    case '5g':
      return 'good';
    case '3g':
    case 'cellular':
      return 'fair';
    case '2g':
      return 'poor';
    default:
      return 'good'; // Assume good if unknown but online
  }
}

/**
 * Check if should save data
 */
export function shouldSaveData(): boolean {
  const status = networkStatusSignal();
  return status.saveData || status.isMetered;
}

/**
 * Refresh network status
 */
export async function refreshNetworkStatus(): Promise<NetworkStatus> {
  const nativeStatus = await getNativeNetworkStatus();
  if (nativeStatus) {
    networkStatusSignal.set(nativeStatus);
    return nativeStatus;
  }

  updateNetworkStatus();
  return networkStatusSignal();
}

/**
 * Add network change listener
 */
export function addNetworkListener(
  callback: (status: NetworkStatus) => void
): () => void {
  networkChangeListeners.add(callback);
  return () => {
    networkChangeListeners.delete(callback);
  };
}

// ============================================================================
// Exports
// ============================================================================

export { networkStatusSignal as networkStatus };

export default useNetwork;

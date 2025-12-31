/**
 * PhilJS Native - useNetwork Hook
 *
 * Provides network connectivity status with connection type,
 * speed estimation, and online/offline detection.
 */
import { type Signal } from 'philjs-core';
/**
 * Network connection type
 */
export type ConnectionType = 'wifi' | 'cellular' | '2g' | '3g' | '4g' | '5g' | 'ethernet' | 'bluetooth' | 'none' | 'unknown';
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
/**
 * Network status signal
 */
declare const networkStatusSignal: Signal<NetworkStatus>;
/**
 * Hook to get network status
 */
export declare function useNetwork(): NetworkStatus;
/**
 * Hook for online/offline status
 */
export declare function useIsOnline(): boolean;
/**
 * Hook for offline status
 */
export declare function useIsOffline(): boolean;
/**
 * Hook for connection type
 */
export declare function useConnectionType(): ConnectionType;
/**
 * Hook with network change callback
 */
export declare function useNetworkChange(callback: (status: NetworkStatus) => void): NetworkStatus;
/**
 * Hook for when connection goes offline
 */
export declare function useOnOffline(callback: () => void): void;
/**
 * Hook for when connection comes online
 */
export declare function useOnOnline(callback: () => void): void;
/**
 * Get current network status synchronously
 */
export declare function getNetworkStatus(): NetworkStatus;
/**
 * Check if Network Information API is supported
 */
export declare function supportsNetworkInformation(): boolean;
/**
 * Estimate connection quality
 */
export declare function getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'none';
/**
 * Check if should save data
 */
export declare function shouldSaveData(): boolean;
/**
 * Refresh network status
 */
export declare function refreshNetworkStatus(): Promise<NetworkStatus>;
/**
 * Add network change listener
 */
export declare function addNetworkListener(callback: (status: NetworkStatus) => void): () => void;
export { networkStatusSignal as networkStatus };
export default useNetwork;
//# sourceMappingURL=useNetwork.d.ts.map
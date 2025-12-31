/**
 * NetInfo API
 *
 * Network connectivity status and monitoring.
 */
import { type Signal } from 'philjs-core';
/**
 * Network state type
 */
export type NetInfoStateType = 'unknown' | 'none' | 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'wimax' | 'vpn' | 'other';
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
/**
 * Configure NetInfo
 */
export declare function configure(options: Partial<NetInfoConfiguration>): void;
/**
 * NetInfo - Network connectivity information
 */
export declare const NetInfo: {
    /**
     * Configure NetInfo
     */
    configure: typeof configure;
    /**
     * Get current network state
     */
    fetch(): Promise<NetInfoState>;
    /**
     * Refresh network state
     */
    refresh(): Promise<NetInfoState>;
    /**
     * Subscribe to network state changes
     */
    addEventListener(type: "connectionChange", handler: NetInfoChangeHandler): () => void;
    /**
     * Use as event emitter (for compatibility)
     */
    useNetInfo: () => NetInfoState;
};
/**
 * Hook to get network state
 */
export declare function useNetInfo(): NetInfoState;
/**
 * Hook to check if connected
 */
export declare function useIsConnected(): boolean;
/**
 * Hook to check if internet is reachable
 */
export declare function useIsInternetReachable(): boolean | null;
/**
 * Hook to get network type
 */
export declare function useNetworkType(): NetInfoStateType;
/**
 * Reactive network state signal
 */
export declare const netInfoState: Signal<NetInfoState>;
/**
 * Reactive connected signal
 */
export declare const isConnected: Signal<boolean>;
/**
 * Reactive internet reachable signal
 */
export declare const isInternetReachable: Signal<boolean | null>;
/**
 * Reactive network type signal
 */
export declare const networkType: Signal<NetInfoStateType>;
/**
 * Execute callback when network becomes available
 */
export declare function whenConnected(callback: () => void): () => void;
/**
 * Execute callback when internet becomes reachable
 */
export declare function whenReachable(callback: () => void): () => void;
/**
 * Check if on WiFi
 */
export declare function isOnWifi(): boolean;
/**
 * Check if on cellular
 */
export declare function isOnCellular(): boolean;
/**
 * Check if on expensive connection
 */
export declare function isExpensiveConnection(): boolean;
export default NetInfo;
//# sourceMappingURL=NetInfo.d.ts.map
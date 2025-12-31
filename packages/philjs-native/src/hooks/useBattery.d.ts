/**
 * PhilJS Native - useBattery Hook
 *
 * Provides battery status information including level,
 * charging state, and time estimates.
 */
import { type Signal } from 'philjs-core';
/**
 * Battery status
 */
export interface BatteryStatus {
    /** Battery level (0-1) */
    level: number;
    /** Battery level as percentage (0-100) */
    percentage: number;
    /** Whether device is charging */
    isCharging: boolean;
    /** Time until fully charged (seconds), null if not charging */
    chargingTime: number | null;
    /** Time until discharged (seconds), null if charging */
    dischargingTime: number | null;
    /** Whether battery status is supported */
    isSupported: boolean;
    /** Last update timestamp */
    lastUpdated: Date;
}
/**
 * Battery threshold
 */
export interface BatteryThreshold {
    level: number;
    callback: () => void;
    direction: 'above' | 'below' | 'cross';
}
/**
 * Battery status signal
 */
declare const batteryStatusSignal: Signal<BatteryStatus>;
/**
 * Hook to get battery status
 */
export declare function useBattery(): BatteryStatus;
/**
 * Hook for battery level
 */
export declare function useBatteryLevel(): number;
/**
 * Hook for battery percentage
 */
export declare function useBatteryPercentage(): number;
/**
 * Hook for charging status
 */
export declare function useIsCharging(): boolean;
/**
 * Hook for low battery detection
 */
export declare function useIsLowBattery(threshold?: number): boolean;
/**
 * Hook with battery threshold callback
 */
export declare function useBatteryThreshold(level: number, callback: () => void, direction?: 'above' | 'below' | 'cross'): void;
/**
 * Hook for when battery reaches critical level
 */
export declare function useOnCriticalBattery(callback: () => void, criticalLevel?: number): void;
/**
 * Hook for charging state changes
 */
export declare function useOnChargingChange(callback: (isCharging: boolean) => void): void;
/**
 * Get battery status synchronously
 */
export declare function getBatteryStatus(): BatteryStatus;
/**
 * Refresh battery status
 */
export declare function refreshBattery(): Promise<BatteryStatus>;
/**
 * Check if Battery API is supported
 */
export declare function isBatterySupported(): boolean;
/**
 * Get estimated battery time remaining
 */
export declare function getTimeRemaining(): {
    hours: number;
    minutes: number;
    formatted: string;
} | null;
/**
 * Get battery status text
 */
export declare function getBatteryStatusText(): string;
/**
 * Get battery level category
 */
export declare function getBatteryCategory(): 'full' | 'high' | 'medium' | 'low' | 'critical';
/**
 * Get battery color based on level and charging
 */
export declare function getBatteryColor(): string;
/**
 * Check if should enable power saving mode
 */
export declare function shouldSavePower(): boolean;
/**
 * Get power saving recommendations
 */
export declare function getPowerSavingRecommendations(): string[];
export { batteryStatusSignal as batteryStatus };
export default useBattery;
//# sourceMappingURL=useBattery.d.ts.map
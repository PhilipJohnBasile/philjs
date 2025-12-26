// @ts-nocheck
/**
 * PhilJS Native - useBattery Hook
 *
 * Provides battery status information including level,
 * charging state, and time estimates.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { isNativePlatform, callPlugin } from '../capacitor/index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// State
// ============================================================================

/**
 * Battery status signal
 */
const batteryStatusSignal: Signal<BatteryStatus> = signal({
  level: 1,
  percentage: 100,
  isCharging: false,
  chargingTime: null,
  dischargingTime: null,
  isSupported: false,
  lastUpdated: new Date(),
});

/**
 * Battery manager reference
 */
let batteryManager: any = null;

/**
 * Battery thresholds
 */
const batteryThresholds: BatteryThreshold[] = [];

/**
 * Previous battery level for threshold checking
 */
let previousLevel = 1;

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Get battery status from Battery API
 */
async function getBatteryFromAPI(): Promise<BatteryStatus | null> {
  if (typeof navigator === 'undefined') return null;

  try {
    // Use existing manager or get new one
    if (!batteryManager && 'getBattery' in navigator) {
      batteryManager = await (navigator as any).getBattery();
      setupBatteryListeners(batteryManager);
    }

    if (batteryManager) {
      return {
        level: batteryManager.level,
        percentage: Math.round(batteryManager.level * 100),
        isCharging: batteryManager.charging,
        chargingTime: batteryManager.chargingTime === Infinity ? null : batteryManager.chargingTime,
        dischargingTime: batteryManager.dischargingTime === Infinity ? null : batteryManager.dischargingTime,
        isSupported: true,
        lastUpdated: new Date(),
      };
    }
  } catch {
    // Battery API not available or failed
  }

  return null;
}

/**
 * Get battery status from Capacitor
 */
async function getBatteryFromCapacitor(): Promise<BatteryStatus | null> {
  if (!isNativePlatform()) return null;

  try {
    const result = await callPlugin<never, {
      batteryLevel: number;
      isCharging: boolean;
    }>('Device', 'getBatteryInfo');

    return {
      level: result.batteryLevel,
      percentage: Math.round(result.batteryLevel * 100),
      isCharging: result.isCharging,
      chargingTime: null,
      dischargingTime: null,
      isSupported: true,
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * Update battery status
 */
async function updateBatteryStatus(): Promise<void> {
  // Try Capacitor first
  let status = await getBatteryFromCapacitor();

  // Fall back to Battery API
  if (!status) {
    status = await getBatteryFromAPI();
  }

  if (status) {
    // Check thresholds before updating
    checkThresholds(previousLevel, status.level);
    previousLevel = status.level;

    batteryStatusSignal.set(status);
  }
}

/**
 * Set up Battery API event listeners
 */
function setupBatteryListeners(battery: any): void {
  if (!battery) return;

  const update = () => updateBatteryStatus();

  battery.addEventListener('chargingchange', update);
  battery.addEventListener('levelchange', update);
  battery.addEventListener('chargingtimechange', update);
  battery.addEventListener('dischargingtimechange', update);
}

/**
 * Check battery thresholds
 */
function checkThresholds(prevLevel: number, newLevel: number): void {
  batteryThresholds.forEach((threshold) => {
    const prevAbove = prevLevel > threshold.level;
    const newAbove = newLevel > threshold.level;

    if (threshold.direction === 'below' && prevAbove && !newAbove) {
      threshold.callback();
    } else if (threshold.direction === 'above' && !prevAbove && newAbove) {
      threshold.callback();
    } else if (threshold.direction === 'cross' && prevAbove !== newAbove) {
      threshold.callback();
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize battery monitoring
 */
async function initBattery(): Promise<void> {
  await updateBatteryStatus();
}

// Initialize on load
if (typeof window !== 'undefined') {
  initBattery();
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to get battery status
 */
export function useBattery(): BatteryStatus {
  return batteryStatusSignal();
}

/**
 * Hook for battery level
 */
export function useBatteryLevel(): number {
  return batteryStatusSignal().level;
}

/**
 * Hook for battery percentage
 */
export function useBatteryPercentage(): number {
  return batteryStatusSignal().percentage;
}

/**
 * Hook for charging status
 */
export function useIsCharging(): boolean {
  return batteryStatusSignal().isCharging;
}

/**
 * Hook for low battery detection
 */
export function useIsLowBattery(threshold = 0.2): boolean {
  const status = batteryStatusSignal();
  return status.level <= threshold && !status.isCharging;
}

/**
 * Hook with battery threshold callback
 */
export function useBatteryThreshold(
  level: number,
  callback: () => void,
  direction: 'above' | 'below' | 'cross' = 'below'
): void {
  effect(() => {
    const threshold: BatteryThreshold = { level, callback, direction };
    batteryThresholds.push(threshold);

    return () => {
      const index = batteryThresholds.indexOf(threshold);
      if (index !== -1) {
        batteryThresholds.splice(index, 1);
      }
    };
  });
}

/**
 * Hook for when battery reaches critical level
 */
export function useOnCriticalBattery(
  callback: () => void,
  criticalLevel = 0.1
): void {
  useBatteryThreshold(criticalLevel, callback, 'below');
}

/**
 * Hook for charging state changes
 */
export function useOnChargingChange(
  callback: (isCharging: boolean) => void
): void {
  let lastChargingState = batteryStatusSignal().isCharging;

  effect(() => {
    const listener = () => {
      const currentState = batteryStatusSignal().isCharging;
      if (currentState !== lastChargingState) {
        lastChargingState = currentState;
        callback(currentState);
      }
    };

    // Subscribe to status changes
    const unsubscribe = effect(() => {
      batteryStatusSignal();
      listener();
    });

    return unsubscribe;
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get battery status synchronously
 */
export function getBatteryStatus(): BatteryStatus {
  return batteryStatusSignal();
}

/**
 * Refresh battery status
 */
export async function refreshBattery(): Promise<BatteryStatus> {
  await updateBatteryStatus();
  return batteryStatusSignal();
}

/**
 * Check if Battery API is supported
 */
export function isBatterySupported(): boolean {
  return batteryStatusSignal().isSupported;
}

/**
 * Get estimated battery time remaining
 */
export function getTimeRemaining(): {
  hours: number;
  minutes: number;
  formatted: string;
} | null {
  const status = batteryStatusSignal();

  const seconds = status.isCharging
    ? status.chargingTime
    : status.dischargingTime;

  if (seconds === null) return null;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return {
    hours,
    minutes,
    formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
  };
}

/**
 * Get battery status text
 */
export function getBatteryStatusText(): string {
  const status = batteryStatusSignal();

  if (status.isCharging) {
    const time = getTimeRemaining();
    if (time) {
      return `Charging - ${time.formatted} until full`;
    }
    return 'Charging';
  }

  const time = getTimeRemaining();
  if (time) {
    return `${status.percentage}% - ${time.formatted} remaining`;
  }

  return `${status.percentage}%`;
}

/**
 * Get battery level category
 */
export function getBatteryCategory(): 'full' | 'high' | 'medium' | 'low' | 'critical' {
  const level = batteryStatusSignal().level;

  if (level >= 0.9) return 'full';
  if (level >= 0.5) return 'high';
  if (level >= 0.2) return 'medium';
  if (level >= 0.1) return 'low';
  return 'critical';
}

/**
 * Get battery color based on level and charging
 */
export function getBatteryColor(): string {
  const status = batteryStatusSignal();

  if (status.isCharging) return '#34C759'; // Green

  const level = status.level;
  if (level >= 0.5) return '#34C759'; // Green
  if (level >= 0.2) return '#FFCC00'; // Yellow
  return '#FF3B30'; // Red
}

// ============================================================================
// Power Saving Mode
// ============================================================================

/**
 * Check if should enable power saving mode
 */
export function shouldSavePower(): boolean {
  const status = batteryStatusSignal();
  return status.level < 0.2 && !status.isCharging;
}

/**
 * Get power saving recommendations
 */
export function getPowerSavingRecommendations(): string[] {
  const status = batteryStatusSignal();
  const recommendations: string[] = [];

  if (status.level < 0.2) {
    recommendations.push('Enable low power mode');
    recommendations.push('Reduce screen brightness');
    recommendations.push('Disable background app refresh');
    recommendations.push('Turn off location services');
  }

  if (status.level < 0.1) {
    recommendations.push('Close unused apps');
    recommendations.push('Enable airplane mode');
  }

  return recommendations;
}

// ============================================================================
// Exports
// ============================================================================

export { batteryStatusSignal as batteryStatus };

export default useBattery;

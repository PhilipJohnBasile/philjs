// @ts-nocheck
/**
 * PhilJS Native - useBattery Hook
 *
 * Provides battery status information including level,
 * charging state, and time estimates.
 */
import { signal, effect } from 'philjs-core';
import { isNativePlatform, callPlugin } from '../capacitor/index.js';
// ============================================================================
// State
// ============================================================================
/**
 * Battery status signal
 */
const batteryStatusSignal = signal({
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
let batteryManager = null;
/**
 * Battery thresholds
 */
const batteryThresholds = [];
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
async function getBatteryFromAPI() {
    if (typeof navigator === 'undefined')
        return null;
    try {
        // Use existing manager or get new one
        if (!batteryManager && 'getBattery' in navigator) {
            batteryManager = await navigator.getBattery();
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
    }
    catch {
        // Battery API not available or failed
    }
    return null;
}
/**
 * Get battery status from Capacitor
 */
async function getBatteryFromCapacitor() {
    if (!isNativePlatform())
        return null;
    try {
        const result = await callPlugin('Device', 'getBatteryInfo');
        return {
            level: result.batteryLevel,
            percentage: Math.round(result.batteryLevel * 100),
            isCharging: result.isCharging,
            chargingTime: null,
            dischargingTime: null,
            isSupported: true,
            lastUpdated: new Date(),
        };
    }
    catch {
        return null;
    }
}
/**
 * Update battery status
 */
async function updateBatteryStatus() {
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
function setupBatteryListeners(battery) {
    if (!battery)
        return;
    const update = () => updateBatteryStatus();
    battery.addEventListener('chargingchange', update);
    battery.addEventListener('levelchange', update);
    battery.addEventListener('chargingtimechange', update);
    battery.addEventListener('dischargingtimechange', update);
}
/**
 * Check battery thresholds
 */
function checkThresholds(prevLevel, newLevel) {
    batteryThresholds.forEach((threshold) => {
        const prevAbove = prevLevel > threshold.level;
        const newAbove = newLevel > threshold.level;
        if (threshold.direction === 'below' && prevAbove && !newAbove) {
            threshold.callback();
        }
        else if (threshold.direction === 'above' && !prevAbove && newAbove) {
            threshold.callback();
        }
        else if (threshold.direction === 'cross' && prevAbove !== newAbove) {
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
async function initBattery() {
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
export function useBattery() {
    return batteryStatusSignal();
}
/**
 * Hook for battery level
 */
export function useBatteryLevel() {
    return batteryStatusSignal().level;
}
/**
 * Hook for battery percentage
 */
export function useBatteryPercentage() {
    return batteryStatusSignal().percentage;
}
/**
 * Hook for charging status
 */
export function useIsCharging() {
    return batteryStatusSignal().isCharging;
}
/**
 * Hook for low battery detection
 */
export function useIsLowBattery(threshold = 0.2) {
    const status = batteryStatusSignal();
    return status.level <= threshold && !status.isCharging;
}
/**
 * Hook with battery threshold callback
 */
export function useBatteryThreshold(level, callback, direction = 'below') {
    effect(() => {
        const threshold = { level, callback, direction };
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
export function useOnCriticalBattery(callback, criticalLevel = 0.1) {
    useBatteryThreshold(criticalLevel, callback, 'below');
}
/**
 * Hook for charging state changes
 */
export function useOnChargingChange(callback) {
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
export function getBatteryStatus() {
    return batteryStatusSignal();
}
/**
 * Refresh battery status
 */
export async function refreshBattery() {
    await updateBatteryStatus();
    return batteryStatusSignal();
}
/**
 * Check if Battery API is supported
 */
export function isBatterySupported() {
    return batteryStatusSignal().isSupported;
}
/**
 * Get estimated battery time remaining
 */
export function getTimeRemaining() {
    const status = batteryStatusSignal();
    const seconds = status.isCharging
        ? status.chargingTime
        : status.dischargingTime;
    if (seconds === null)
        return null;
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
export function getBatteryStatusText() {
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
export function getBatteryCategory() {
    const level = batteryStatusSignal().level;
    if (level >= 0.9)
        return 'full';
    if (level >= 0.5)
        return 'high';
    if (level >= 0.2)
        return 'medium';
    if (level >= 0.1)
        return 'low';
    return 'critical';
}
/**
 * Get battery color based on level and charging
 */
export function getBatteryColor() {
    const status = batteryStatusSignal();
    if (status.isCharging)
        return '#34C759'; // Green
    const level = status.level;
    if (level >= 0.5)
        return '#34C759'; // Green
    if (level >= 0.2)
        return '#FFCC00'; // Yellow
    return '#FF3B30'; // Red
}
// ============================================================================
// Power Saving Mode
// ============================================================================
/**
 * Check if should enable power saving mode
 */
export function shouldSavePower() {
    const status = batteryStatusSignal();
    return status.level < 0.2 && !status.isCharging;
}
/**
 * Get power saving recommendations
 */
export function getPowerSavingRecommendations() {
    const status = batteryStatusSignal();
    const recommendations = [];
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
//# sourceMappingURL=useBattery.js.map
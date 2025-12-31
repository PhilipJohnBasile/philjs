/**
 * PhilJS Native - Hooks Index
 *
 * Exports all native mobile hooks for device, orientation,
 * network, battery, and app lifecycle.
 */
// ============================================================================
// Device Hook
// ============================================================================
export { useDevice, useDeviceProperty, useIsDeviceType, useIsMobile, useIsDesktop, usePlatform, isIOS, isAndroid, isWeb, hasTouchScreen, getDeviceInfoSync, deviceInfo, deviceLoading, deviceError, } from './useDevice.js';
// ============================================================================
// Orientation Hook
// ============================================================================
export { useOrientation, useIsPortrait, useIsLandscape, useOrientationAngle, useOrientationLock, useOrientationEffect, useOrientationForScreen, useOrientationBreakpoint, lockOrientation, unlockOrientation, lockToPortrait, lockToLandscape, getOrientation, supportsOrientationLock, getAspectRatio, isSquareScreen, getOrientationBreakpoint, orientation, } from './useOrientation.js';
// ============================================================================
// Network Hook
// ============================================================================
export { useNetwork, useIsOnline, useIsOffline, useConnectionType, useNetworkChange, useOnOffline, useOnOnline, getNetworkStatus, supportsNetworkInformation, getConnectionQuality, shouldSaveData, refreshNetworkStatus, addNetworkListener, networkStatus, } from './useNetwork.js';
// ============================================================================
// Battery Hook
// ============================================================================
export { useBattery, useBatteryLevel, useBatteryPercentage, useIsCharging, useIsLowBattery, useBatteryThreshold, useOnCriticalBattery, useOnChargingChange, getBatteryStatus, refreshBattery, isBatterySupported, getTimeRemaining, getBatteryStatusText, getBatteryCategory, getBatteryColor, shouldSavePower, getPowerSavingRecommendations, batteryStatus, } from './useBattery.js';
// ============================================================================
// App State Hook
// ============================================================================
export { useAppState, useIsActive, useIsBackground, useAppStateType, useOnAppStateChange, useOnForeground, useOnBackground, useMemoryWarning, useOnMemoryWarning, useAppStateEffect, getAppState, getTimeSinceActive, getTotalBackgroundTime, getTotalActiveTime, formatDuration, wasRecentlyBackgrounded, addAppStateListener, addForegroundListener, addBackgroundListener, appStateInfo, memoryWarning, } from './useAppState.js';
//# sourceMappingURL=index.js.map
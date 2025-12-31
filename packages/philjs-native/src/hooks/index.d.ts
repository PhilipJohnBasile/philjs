/**
 * PhilJS Native - Hooks Index
 *
 * Exports all native mobile hooks for device, orientation,
 * network, battery, and app lifecycle.
 */
export { useDevice, useDeviceProperty, useIsDeviceType, useIsMobile, useIsDesktop, usePlatform, isIOS, isAndroid, isWeb, hasTouchScreen, getDeviceInfoSync, deviceInfo, deviceLoading, deviceError, } from './useDevice.js';
export type { DeviceType, DeviceInfo, } from './useDevice.js';
export { useOrientation, useIsPortrait, useIsLandscape, useOrientationAngle, useOrientationLock, useOrientationEffect, useOrientationForScreen, useOrientationBreakpoint, lockOrientation, unlockOrientation, lockToPortrait, lockToLandscape, getOrientation, supportsOrientationLock, getAspectRatio, isSquareScreen, getOrientationBreakpoint, orientation, } from './useOrientation.js';
export type { OrientationType, OrientationLockType, OrientationInfo, OrientationBreakpoint, } from './useOrientation.js';
export { useNetwork, useIsOnline, useIsOffline, useConnectionType, useNetworkChange, useOnOffline, useOnOnline, getNetworkStatus, supportsNetworkInformation, getConnectionQuality, shouldSaveData, refreshNetworkStatus, addNetworkListener, networkStatus, } from './useNetwork.js';
export type { ConnectionType, EffectiveConnectionType, NetworkStatus, } from './useNetwork.js';
export { useBattery, useBatteryLevel, useBatteryPercentage, useIsCharging, useIsLowBattery, useBatteryThreshold, useOnCriticalBattery, useOnChargingChange, getBatteryStatus, refreshBattery, isBatterySupported, getTimeRemaining, getBatteryStatusText, getBatteryCategory, getBatteryColor, shouldSavePower, getPowerSavingRecommendations, batteryStatus, } from './useBattery.js';
export type { BatteryStatus, BatteryThreshold, } from './useBattery.js';
export { useAppState, useIsActive, useIsBackground, useAppStateType, useOnAppStateChange, useOnForeground, useOnBackground, useMemoryWarning, useOnMemoryWarning, useAppStateEffect, getAppState, getTimeSinceActive, getTotalBackgroundTime, getTotalActiveTime, formatDuration, wasRecentlyBackgrounded, addAppStateListener, addForegroundListener, addBackgroundListener, appStateInfo, memoryWarning, } from './useAppState.js';
export type { AppStateType, AppStateInfo, MemoryWarningLevel, MemoryWarning, } from './useAppState.js';
//# sourceMappingURL=index.d.ts.map
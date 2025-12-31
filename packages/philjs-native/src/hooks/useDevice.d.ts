/**
 * PhilJS Native - useDevice Hook
 *
 * Provides device information including platform, model,
 * OS version, and hardware capabilities.
 */
import { type Signal } from 'philjs-core';
/**
 * Device type
 */
export type DeviceType = 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown';
/**
 * Device information
 */
export interface DeviceInfo {
    /** Platform type */
    platform: 'ios' | 'android' | 'web' | 'macos' | 'windows' | 'linux';
    /** Device type */
    deviceType: DeviceType;
    /** Device model */
    model: string;
    /** Manufacturer */
    manufacturer: string;
    /** Operating system */
    os: string;
    /** OS version */
    osVersion: string;
    /** Browser name (web only) */
    browserName: string;
    /** Browser version (web only) */
    browserVersion: string;
    /** Device UUID */
    uuid: string;
    /** Whether running on a virtual device/emulator */
    isVirtual: boolean;
    /** Whether device supports touch */
    hasTouch: boolean;
    /** Whether device is in standalone mode (PWA) */
    isStandalone: boolean;
    /** Screen pixel ratio */
    pixelRatio: number;
    /** Device memory (if available) */
    memoryGB: number | null;
    /** Number of CPU cores */
    cpuCores: number;
    /** Whether reduced motion is preferred */
    prefersReducedMotion: boolean;
    /** Whether dark mode is preferred */
    prefersDarkMode: boolean;
    /** User agent string */
    userAgent: string;
    /** App name */
    appName: string;
    /** App version */
    appVersion: string;
}
/**
 * Device info signal
 */
declare const deviceInfoSignal: Signal<DeviceInfo | null>;
/**
 * Loading state
 */
declare const loadingSignal: Signal<boolean>;
/**
 * Error state
 */
declare const errorSignal: Signal<Error | null>;
/**
 * Hook to get device information
 */
export declare function useDevice(): {
    device: DeviceInfo | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
/**
 * Hook to get specific device property
 */
export declare function useDeviceProperty<K extends keyof DeviceInfo>(property: K): DeviceInfo[K] | null;
/**
 * Hook to check if device is a specific type
 */
export declare function useIsDeviceType(type: DeviceType): boolean;
/**
 * Hook to check if on mobile device
 */
export declare function useIsMobile(): boolean;
/**
 * Hook to check if on desktop
 */
export declare function useIsDesktop(): boolean;
/**
 * Hook to get platform
 */
export declare function usePlatform(): DeviceInfo['platform'] | null;
/**
 * Check if iOS device
 */
export declare function isIOS(): boolean;
/**
 * Check if Android device
 */
export declare function isAndroid(): boolean;
/**
 * Check if web platform
 */
export declare function isWeb(): boolean;
/**
 * Check if touch device
 */
export declare function hasTouchScreen(): boolean;
/**
 * Get device info synchronously (cached)
 */
export declare function getDeviceInfoSync(): DeviceInfo | null;
export { deviceInfoSignal as deviceInfo, loadingSignal as deviceLoading, errorSignal as deviceError, };
export default useDevice;
//# sourceMappingURL=useDevice.d.ts.map
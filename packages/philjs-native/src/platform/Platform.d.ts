/**
 * Platform Detection API
 *
 * Utilities for detecting and responding to platform-specific features.
 */
import { type Signal } from 'philjs-core';
/**
 * Supported platforms
 */
export type PlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos';
/**
 * Platform constants
 */
export interface PlatformConstants {
    /**
     * Whether the app is running in test mode
     */
    isTesting: boolean;
    /**
     * Whether the app is running in SSR
     */
    isSSR: boolean;
    /**
     * The React Native version (if applicable)
     */
    reactNativeVersion?: {
        major: number;
        minor: number;
        patch: number;
        prerelease?: string;
    };
    /**
     * iOS-specific constants
     */
    ios?: {
        /**
         * System name (e.g., "iOS", "iPadOS")
         */
        systemName: string;
        /**
         * Interface idiom (phone, pad, tv, carPlay)
         */
        interfaceIdiom: 'phone' | 'pad' | 'tv' | 'carPlay' | 'unknown';
        /**
         * Whether running in Catalyst mode
         */
        isMacCatalyst: boolean;
    };
    /**
     * Android-specific constants
     */
    android?: {
        /**
         * API level
         */
        apiLevel: number;
        /**
         * Build fingerprint
         */
        fingerprint: string;
        /**
         * Whether running on a TV
         */
        isTV: boolean;
    };
    /**
     * Web-specific constants
     */
    web?: {
        /**
         * User agent string
         */
        userAgent: string;
        /**
         * Whether running in PWA mode
         */
        isPWA: boolean;
        /**
         * Browser name
         */
        browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
    };
}
/**
 * Platform static methods and properties
 */
export interface PlatformStatic {
    /**
     * Current platform OS
     */
    OS: PlatformOS;
    /**
     * Platform version string
     */
    Version: string | number;
    /**
     * Platform-specific constants
     */
    constants: PlatformConstants;
    /**
     * Whether this is a native platform (iOS/Android)
     */
    isNative: boolean;
    /**
     * Whether this is a TV device
     */
    isTV: boolean;
    /**
     * Whether this is an iPad
     */
    isPad: boolean;
    /**
     * Whether this is running on Vision Pro
     */
    isVision: boolean;
    /**
     * Select platform-specific value
     */
    select<T>(specifics: PlatformSelectSpecifics<T>): T;
}
/**
 * Platform select specifics
 */
export interface PlatformSelectSpecifics<T> {
    ios?: T;
    android?: T;
    web?: T;
    windows?: T;
    macos?: T;
    native?: T;
    default?: T;
}
/**
 * Platform API
 */
export declare const Platform: PlatformStatic;
/**
 * Reactive platform OS signal
 */
export declare const platformOS: Signal<PlatformOS>;
/**
 * Reactive platform version signal
 */
export declare const platformVersion: Signal<string | number>;
/**
 * Get current platform
 */
export declare function usePlatform(): PlatformOS;
/**
 * Check if specific platform
 */
export declare function useIsPlatform(os: PlatformOS): boolean;
/**
 * Platform-specific value hook
 */
export declare function usePlatformValue<T>(specifics: PlatformSelectSpecifics<T>): T;
/**
 * Check if running on iOS
 */
export declare function isIOS(): boolean;
/**
 * Check if running on Android
 */
export declare function isAndroid(): boolean;
/**
 * Check if running on web
 */
export declare function isWeb(): boolean;
/**
 * Check if running on native platform
 */
export declare function isNative(): boolean;
/**
 * Check if running on desktop
 */
export declare function isDesktop(): boolean;
/**
 * Check if running in development mode
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in production mode
 */
export declare function isProduction(): boolean;
export default Platform;
//# sourceMappingURL=Platform.d.ts.map
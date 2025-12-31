// @ts-nocheck
/**
 * Platform Detection API
 *
 * Utilities for detecting and responding to platform-specific features.
 */
import { signal } from 'philjs-core';
// ============================================================================
// Platform Detection
// ============================================================================
/**
 * Detect the current platform OS
 */
function detectOS() {
    // Check for native bridges
    if (typeof globalThis.__PHILJS_IOS__ !== 'undefined') {
        return 'ios';
    }
    if (typeof globalThis.__PHILJS_ANDROID__ !== 'undefined') {
        return 'android';
    }
    if (typeof globalThis.__PHILJS_WINDOWS__ !== 'undefined') {
        return 'windows';
    }
    if (typeof globalThis.__PHILJS_MACOS__ !== 'undefined') {
        return 'macos';
    }
    // Web detection with platform hints
    if (typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.userAgentData?.platform?.toLowerCase() || '';
        // Check for macOS
        if (platform === 'macos' || /macintosh|mac os x/.test(userAgent)) {
            // Could be macOS web or macOS native
            if (typeof globalThis.__PHILJS_MACOS__ !== 'undefined') {
                return 'macos';
            }
        }
        // Check for Windows
        if (platform === 'windows' || /win32|win64|windows/.test(userAgent)) {
            if (typeof globalThis.__PHILJS_WINDOWS__ !== 'undefined') {
                return 'windows';
            }
        }
    }
    return 'web';
}
/**
 * Get platform version
 */
function getVersion() {
    const os = detectOS();
    if (os === 'ios' || os === 'android') {
        return globalThis.__PHILJS_VERSION__ || '0.0.0';
    }
    if (typeof navigator !== 'undefined') {
        const match = navigator.userAgent.match(/\d+\.\d+(\.\d+)?/);
        return match ? match[0] : '0.0.0';
    }
    return '0.0.0';
}
/**
 * Get platform constants
 */
function getConstants() {
    const os = detectOS();
    const isTesting = typeof globalThis.__PHILJS_TESTING__ !== 'undefined';
    const isSSR = typeof window === 'undefined';
    const constants = {
        isTesting,
        isSSR,
    };
    if (os === 'ios') {
        constants.ios = globalThis.__PHILJS_IOS_CONSTANTS__ || {
            systemName: 'iOS',
            interfaceIdiom: 'phone',
            isMacCatalyst: false,
        };
    }
    if (os === 'android') {
        constants.android = globalThis.__PHILJS_ANDROID_CONSTANTS__ || {
            apiLevel: 30,
            fingerprint: '',
            isTV: false,
        };
    }
    if (os === 'web' && typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent;
        let browser = 'unknown';
        if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
            browser = 'chrome';
        }
        else if (/firefox/i.test(userAgent)) {
            browser = 'firefox';
        }
        else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
            browser = 'safari';
        }
        else if (/edge|edg/i.test(userAgent)) {
            browser = 'edge';
        }
        else if (/opera|opr/i.test(userAgent)) {
            browser = 'opera';
        }
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        constants.web = {
            userAgent,
            isPWA,
            browser,
        };
    }
    return constants;
}
/**
 * Check if TV device
 */
function checkIsTV() {
    const os = detectOS();
    if (os === 'ios') {
        return globalThis.__PHILJS_IOS_CONSTANTS__?.interfaceIdiom === 'tv';
    }
    if (os === 'android') {
        return globalThis.__PHILJS_ANDROID_CONSTANTS__?.isTV === true;
    }
    return false;
}
/**
 * Check if iPad
 */
function checkIsPad() {
    const os = detectOS();
    if (os === 'ios') {
        return globalThis.__PHILJS_IOS_CONSTANTS__?.interfaceIdiom === 'pad';
    }
    if (typeof navigator !== 'undefined') {
        // Check for iPad on web
        return /ipad/i.test(navigator.userAgent) ||
            (/macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);
    }
    return false;
}
/**
 * Check if Vision Pro
 */
function checkIsVision() {
    const os = detectOS();
    if (os === 'ios') {
        return globalThis.__PHILJS_IOS_CONSTANTS__?.systemName === 'visionOS';
    }
    return false;
}
// ============================================================================
// Platform Object
// ============================================================================
/**
 * Platform API
 */
export const Platform = {
    get OS() {
        return detectOS();
    },
    get Version() {
        return getVersion();
    },
    get constants() {
        return getConstants();
    },
    get isNative() {
        const os = detectOS();
        return os === 'ios' || os === 'android';
    },
    get isTV() {
        return checkIsTV();
    },
    get isPad() {
        return checkIsPad();
    },
    get isVision() {
        return checkIsVision();
    },
    select(specifics) {
        const os = detectOS();
        const isNative = os === 'ios' || os === 'android';
        // Check platform-specific value first
        if (os === 'ios' && specifics.ios !== undefined) {
            return specifics.ios;
        }
        if (os === 'android' && specifics.android !== undefined) {
            return specifics.android;
        }
        if (os === 'web' && specifics.web !== undefined) {
            return specifics.web;
        }
        if (os === 'windows' && specifics.windows !== undefined) {
            return specifics.windows;
        }
        if (os === 'macos' && specifics.macos !== undefined) {
            return specifics.macos;
        }
        // Check native fallback
        if (isNative && specifics.native !== undefined) {
            return specifics.native;
        }
        // Return default
        return specifics.default;
    },
};
// ============================================================================
// Platform Signals
// ============================================================================
/**
 * Reactive platform OS signal
 */
export const platformOS = signal(detectOS());
/**
 * Reactive platform version signal
 */
export const platformVersion = signal(getVersion());
// ============================================================================
// Platform Hooks
// ============================================================================
/**
 * Get current platform
 */
export function usePlatform() {
    return platformOS();
}
/**
 * Check if specific platform
 */
export function useIsPlatform(os) {
    return platformOS() === os;
}
/**
 * Platform-specific value hook
 */
export function usePlatformValue(specifics) {
    return Platform.select(specifics);
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Check if running on iOS
 */
export function isIOS() {
    return detectOS() === 'ios';
}
/**
 * Check if running on Android
 */
export function isAndroid() {
    return detectOS() === 'android';
}
/**
 * Check if running on web
 */
export function isWeb() {
    return detectOS() === 'web';
}
/**
 * Check if running on native platform
 */
export function isNative() {
    const os = detectOS();
    return os === 'ios' || os === 'android';
}
/**
 * Check if running on desktop
 */
export function isDesktop() {
    const os = detectOS();
    return os === 'windows' || os === 'macos';
}
/**
 * Check if running in development mode
 */
export function isDevelopment() {
    return (typeof globalThis.__DEV__ !== 'undefined' &&
        globalThis.__DEV__ === true);
}
/**
 * Check if running in production mode
 */
export function isProduction() {
    return !isDevelopment();
}
export default Platform;
//# sourceMappingURL=Platform.js.map
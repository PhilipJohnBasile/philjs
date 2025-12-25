/**
 * Platform Detection API
 *
 * Utilities for detecting and responding to platform-specific features.
 */

import { signal, type Signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Detect the current platform OS
 */
function detectOS(): PlatformOS {
  // Check for native bridges
  if (typeof (globalThis as any).__PHILJS_IOS__ !== 'undefined') {
    return 'ios';
  }
  if (typeof (globalThis as any).__PHILJS_ANDROID__ !== 'undefined') {
    return 'android';
  }
  if (typeof (globalThis as any).__PHILJS_WINDOWS__ !== 'undefined') {
    return 'windows';
  }
  if (typeof (globalThis as any).__PHILJS_MACOS__ !== 'undefined') {
    return 'macos';
  }

  // Web detection with platform hints
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || '';

    // Check for macOS
    if (platform === 'macos' || /macintosh|mac os x/.test(userAgent)) {
      // Could be macOS web or macOS native
      if (typeof (globalThis as any).__PHILJS_MACOS__ !== 'undefined') {
        return 'macos';
      }
    }

    // Check for Windows
    if (platform === 'windows' || /win32|win64|windows/.test(userAgent)) {
      if (typeof (globalThis as any).__PHILJS_WINDOWS__ !== 'undefined') {
        return 'windows';
      }
    }
  }

  return 'web';
}

/**
 * Get platform version
 */
function getVersion(): string | number {
  const os = detectOS();

  if (os === 'ios' || os === 'android') {
    return (globalThis as any).__PHILJS_VERSION__ || '0.0.0';
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
function getConstants(): PlatformConstants {
  const os = detectOS();
  const isTesting = typeof (globalThis as any).__PHILJS_TESTING__ !== 'undefined';
  const isSSR = typeof window === 'undefined';

  const constants: PlatformConstants = {
    isTesting,
    isSSR,
  };

  if (os === 'ios') {
    constants.ios = (globalThis as any).__PHILJS_IOS_CONSTANTS__ || {
      systemName: 'iOS',
      interfaceIdiom: 'phone',
      isMacCatalyst: false,
    };
  }

  if (os === 'android') {
    constants.android = (globalThis as any).__PHILJS_ANDROID_CONSTANTS__ || {
      apiLevel: 30,
      fingerprint: '',
      isTV: false,
    };
  }

  if (os === 'web' && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent;
    let browser: PlatformConstants['web']['browser'] = 'unknown';

    if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
      browser = 'chrome';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browser = 'safari';
    } else if (/edge|edg/i.test(userAgent)) {
      browser = 'edge';
    } else if (/opera|opr/i.test(userAgent)) {
      browser = 'opera';
    }

    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

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
function checkIsTV(): boolean {
  const os = detectOS();

  if (os === 'ios') {
    return (globalThis as any).__PHILJS_IOS_CONSTANTS__?.interfaceIdiom === 'tv';
  }

  if (os === 'android') {
    return (globalThis as any).__PHILJS_ANDROID_CONSTANTS__?.isTV === true;
  }

  return false;
}

/**
 * Check if iPad
 */
function checkIsPad(): boolean {
  const os = detectOS();

  if (os === 'ios') {
    return (globalThis as any).__PHILJS_IOS_CONSTANTS__?.interfaceIdiom === 'pad';
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
function checkIsVision(): boolean {
  const os = detectOS();

  if (os === 'ios') {
    return (globalThis as any).__PHILJS_IOS_CONSTANTS__?.systemName === 'visionOS';
  }

  return false;
}

// ============================================================================
// Platform Object
// ============================================================================

/**
 * Platform API
 */
export const Platform: PlatformStatic = {
  get OS(): PlatformOS {
    return detectOS();
  },

  get Version(): string | number {
    return getVersion();
  },

  get constants(): PlatformConstants {
    return getConstants();
  },

  get isNative(): boolean {
    const os = detectOS();
    return os === 'ios' || os === 'android';
  },

  get isTV(): boolean {
    return checkIsTV();
  },

  get isPad(): boolean {
    return checkIsPad();
  },

  get isVision(): boolean {
    return checkIsVision();
  },

  select<T>(specifics: PlatformSelectSpecifics<T>): T {
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
    return specifics.default as T;
  },
};

// ============================================================================
// Platform Signals
// ============================================================================

/**
 * Reactive platform OS signal
 */
export const platformOS: Signal<PlatformOS> = signal(detectOS());

/**
 * Reactive platform version signal
 */
export const platformVersion: Signal<string | number> = signal(getVersion());

// ============================================================================
// Platform Hooks
// ============================================================================

/**
 * Get current platform
 */
export function usePlatform(): PlatformOS {
  return platformOS();
}

/**
 * Check if specific platform
 */
export function useIsPlatform(os: PlatformOS): boolean {
  return platformOS() === os;
}

/**
 * Platform-specific value hook
 */
export function usePlatformValue<T>(specifics: PlatformSelectSpecifics<T>): T {
  return Platform.select(specifics);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return detectOS() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return detectOS() === 'android';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return detectOS() === 'web';
}

/**
 * Check if running on native platform
 */
export function isNative(): boolean {
  const os = detectOS();
  return os === 'ios' || os === 'android';
}

/**
 * Check if running on desktop
 */
export function isDesktop(): boolean {
  const os = detectOS();
  return os === 'windows' || os === 'macos';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return (
    typeof (globalThis as any).__DEV__ !== 'undefined' &&
    (globalThis as any).__DEV__ === true
  );
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

export default Platform;

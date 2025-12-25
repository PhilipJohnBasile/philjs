/**
 * PhilJS Native - useDevice Hook
 *
 * Provides device information including platform, model,
 * OS version, and hardware capabilities.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, platformInfo } from '../runtime.js';
import { isCapacitor, getCapacitorPlatform, getDeviceInfo } from '../capacitor/index.js';
import { isTauri, getAppInfo } from '../tauri/index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// State
// ============================================================================

/**
 * Device info signal
 */
const deviceInfoSignal: Signal<DeviceInfo | null> = signal(null);

/**
 * Loading state
 */
const loadingSignal: Signal<boolean> = signal(true);

/**
 * Error state
 */
const errorSignal: Signal<Error | null> = signal(null);

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Detect device type
 */
function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const minDimension = Math.min(screenWidth, screenHeight);

  // Check for TV
  if (/tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|viera/i.test(ua)) {
    return 'tv';
  }

  // Check for tablet
  if (/ipad/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    return 'tablet';
  }

  // Check screen size for tablet detection
  if (/android|iphone|ipod/i.test(ua)) {
    return minDimension >= 600 ? 'tablet' : 'phone';
  }

  // Desktop
  if (/windows|macintosh|linux/i.test(ua) && !('ontouchstart' in window)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Detect platform
 */
function detectPlatformType(): DeviceInfo['platform'] {
  if (typeof window === 'undefined') return 'web';

  if (isCapacitor()) {
    return getCapacitorPlatform();
  }

  if (isTauri()) {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'macos';
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux')) return 'linux';
  }

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh/.test(ua)) return 'macos';
  if (/windows/.test(ua)) return 'windows';
  if (/linux/.test(ua)) return 'linux';

  return 'web';
}

/**
 * Detect browser
 */
function detectBrowser(): { name: string; version: string } {
  if (typeof navigator === 'undefined') {
    return { name: 'unknown', version: '' };
  }

  const ua = navigator.userAgent;

  // Chrome
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) {
    const match = ua.match(/chrome\/(\d+)/i);
    return { name: 'Chrome', version: match?.[1] || '' };
  }

  // Firefox
  if (/firefox/i.test(ua)) {
    const match = ua.match(/firefox\/(\d+)/i);
    return { name: 'Firefox', version: match?.[1] || '' };
  }

  // Safari
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    const match = ua.match(/version\/(\d+)/i);
    return { name: 'Safari', version: match?.[1] || '' };
  }

  // Edge
  if (/edge|edg/i.test(ua)) {
    const match = ua.match(/edg?\/(\d+)/i);
    return { name: 'Edge', version: match?.[1] || '' };
  }

  return { name: 'unknown', version: '' };
}

/**
 * Detect OS version
 */
function detectOSVersion(): { os: string; version: string } {
  if (typeof navigator === 'undefined') {
    return { os: 'unknown', version: '' };
  }

  const ua = navigator.userAgent;

  // iOS
  if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os\s+(\d+[._]\d+)/i);
    return { os: 'iOS', version: match?.[1]?.replace('_', '.') || '' };
  }

  // Android
  if (/android/i.test(ua)) {
    const match = ua.match(/android\s+(\d+(\.\d+)?)/i);
    return { os: 'Android', version: match?.[1] || '' };
  }

  // macOS
  if (/macintosh/i.test(ua)) {
    const match = ua.match(/mac\s+os\s+x\s+(\d+[._]\d+)/i);
    return { os: 'macOS', version: match?.[1]?.replace('_', '.') || '' };
  }

  // Windows
  if (/windows/i.test(ua)) {
    if (ua.includes('Windows NT 10')) return { os: 'Windows', version: '10/11' };
    if (ua.includes('Windows NT 6.3')) return { os: 'Windows', version: '8.1' };
    if (ua.includes('Windows NT 6.2')) return { os: 'Windows', version: '8' };
    if (ua.includes('Windows NT 6.1')) return { os: 'Windows', version: '7' };
    return { os: 'Windows', version: '' };
  }

  // Linux
  if (/linux/i.test(ua)) {
    return { os: 'Linux', version: '' };
  }

  return { os: 'unknown', version: '' };
}

/**
 * Generate device UUID
 */
function generateUUID(): string {
  // Try to get a persistent ID from storage
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('philjs_device_uuid');
    if (stored) return stored;

    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    localStorage.setItem('philjs_device_uuid', uuid);
    return uuid;
  }

  return 'unknown';
}

/**
 * Get web device info
 */
async function getWebDeviceInfo(): Promise<DeviceInfo> {
  const browser = detectBrowser();
  const osInfo = detectOSVersion();
  const platform = detectPlatformType();
  const deviceType = detectDeviceType();

  return {
    platform,
    deviceType,
    model: navigator.platform || 'Web Browser',
    manufacturer: browser.name,
    os: osInfo.os,
    osVersion: osInfo.version,
    browserName: browser.name,
    browserVersion: browser.version,
    uuid: generateUUID(),
    isVirtual: false,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true,
    pixelRatio: window.devicePixelRatio || 1,
    memoryGB: (navigator as any).deviceMemory || null,
    cpuCores: navigator.hardwareConcurrency || 1,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    userAgent: navigator.userAgent,
    appName: document.title || 'App',
    appVersion: '1.0.0',
  };
}

/**
 * Get full device info
 */
async function getFullDeviceInfo(): Promise<DeviceInfo> {
  let baseInfo = await getWebDeviceInfo();

  // Enhance with Capacitor info
  if (isCapacitor()) {
    try {
      const capacitorInfo = await getDeviceInfo();
      baseInfo = {
        ...baseInfo,
        platform: capacitorInfo.platform,
        model: capacitorInfo.model,
        manufacturer: capacitorInfo.manufacturer,
        osVersion: capacitorInfo.osVersion,
        uuid: capacitorInfo.uuid,
        isVirtual: capacitorInfo.isVirtual,
      };
    } catch {
      // Use web info
    }
  }

  // Enhance with Tauri info
  if (isTauri()) {
    try {
      const tauriInfo = await getAppInfo();
      baseInfo = {
        ...baseInfo,
        appName: tauriInfo.name,
        appVersion: tauriInfo.version,
      };
    } catch {
      // Use web info
    }
  }

  return baseInfo;
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize device info
 */
async function initDeviceInfo(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    loadingSignal.set(true);
    const info = await getFullDeviceInfo();
    deviceInfoSignal.set(info);
  } catch (error) {
    errorSignal.set(error as Error);
  } finally {
    loadingSignal.set(false);
  }
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  initDeviceInfo();
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to get device information
 */
export function useDevice(): {
  device: DeviceInfo | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  return {
    device: deviceInfoSignal(),
    loading: loadingSignal(),
    error: errorSignal(),
    refresh: initDeviceInfo,
  };
}

/**
 * Hook to get specific device property
 */
export function useDeviceProperty<K extends keyof DeviceInfo>(
  property: K
): DeviceInfo[K] | null {
  const device = deviceInfoSignal();
  return device ? device[property] : null;
}

/**
 * Hook to check if device is a specific type
 */
export function useIsDeviceType(type: DeviceType): boolean {
  const device = deviceInfoSignal();
  return device?.deviceType === type;
}

/**
 * Hook to check if on mobile device
 */
export function useIsMobile(): boolean {
  const device = deviceInfoSignal();
  return device?.deviceType === 'phone' || device?.deviceType === 'tablet';
}

/**
 * Hook to check if on desktop
 */
export function useIsDesktop(): boolean {
  const device = deviceInfoSignal();
  return device?.deviceType === 'desktop';
}

/**
 * Hook to get platform
 */
export function usePlatform(): DeviceInfo['platform'] | null {
  const device = deviceInfoSignal();
  return device?.platform || null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if iOS device
 */
export function isIOS(): boolean {
  const device = deviceInfoSignal();
  return device?.platform === 'ios';
}

/**
 * Check if Android device
 */
export function isAndroid(): boolean {
  const device = deviceInfoSignal();
  return device?.platform === 'android';
}

/**
 * Check if web platform
 */
export function isWeb(): boolean {
  const device = deviceInfoSignal();
  return device?.platform === 'web';
}

/**
 * Check if touch device
 */
export function hasTouchScreen(): boolean {
  const device = deviceInfoSignal();
  return device?.hasTouch || false;
}

/**
 * Get device info synchronously (cached)
 */
export function getDeviceInfoSync(): DeviceInfo | null {
  return deviceInfoSignal();
}

// ============================================================================
// Exports
// ============================================================================

export {
  deviceInfoSignal as deviceInfo,
  loadingSignal as deviceLoading,
  errorSignal as deviceError,
};

export default useDevice;

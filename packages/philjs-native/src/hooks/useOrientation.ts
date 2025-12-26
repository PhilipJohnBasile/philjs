// @ts-nocheck
/**
 * PhilJS Native - useOrientation Hook
 *
 * Provides screen orientation tracking with support for
 * locking orientation and handling orientation changes.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { isCapacitor, callPlugin, isNativePlatform } from '../capacitor/index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Orientation type
 */
export type OrientationType =
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape'
  | 'landscape-primary'
  | 'landscape-secondary';

/**
 * Orientation lock type
 */
export type OrientationLockType =
  | 'any'
  | 'natural'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape'
  | 'landscape-primary'
  | 'landscape-secondary';

/**
 * Orientation info
 */
export interface OrientationInfo {
  /** Current orientation type */
  type: OrientationType;
  /** Rotation angle in degrees */
  angle: number;
  /** Whether in portrait mode */
  isPortrait: boolean;
  /** Whether in landscape mode */
  isLandscape: boolean;
  /** Whether orientation is locked */
  isLocked: boolean;
  /** Current lock type (if locked) */
  lockType: OrientationLockType | null;
  /** Screen width */
  width: number;
  /** Screen height */
  height: number;
}

// ============================================================================
// State
// ============================================================================

/**
 * Orientation signal
 */
const orientationSignal: Signal<OrientationInfo> = signal(getInitialOrientation());

/**
 * Orientation lock state
 */
const lockStateSignal: Signal<{
  isLocked: boolean;
  lockType: OrientationLockType | null;
}> = signal({
  isLocked: false,
  lockType: null,
});

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Get initial orientation
 */
function getInitialOrientation(): OrientationInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'portrait',
      angle: 0,
      isPortrait: true,
      isLandscape: false,
      isLocked: false,
      lockType: null,
      width: 375,
      height: 812,
    };
  }

  const angle = getOrientationAngle();
  const type = getOrientationType(angle);
  const isPortrait = type.startsWith('portrait');
  const isLandscape = type.startsWith('landscape');

  return {
    type,
    angle,
    isPortrait,
    isLandscape,
    isLocked: false,
    lockType: null,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Get orientation angle
 */
function getOrientationAngle(): number {
  if (typeof window === 'undefined') return 0;

  // Use Screen Orientation API if available
  if (screen.orientation) {
    return screen.orientation.angle;
  }

  // Fallback to window.orientation (deprecated but still used on some devices)
  if ('orientation' in window) {
    return (window as any).orientation || 0;
  }

  // Fallback based on dimensions
  return window.innerWidth > window.innerHeight ? 90 : 0;
}

/**
 * Get orientation type from angle
 */
function getOrientationType(angle: number): OrientationType {
  // Use Screen Orientation API if available
  if (typeof screen !== 'undefined' && screen.orientation) {
    return screen.orientation.type as OrientationType;
  }

  // Fallback based on angle
  switch (angle) {
    case 0:
      return 'portrait-primary';
    case 90:
      return 'landscape-primary';
    case 180:
      return 'portrait-secondary';
    case 270:
    case -90:
      return 'landscape-secondary';
    default:
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }
}

/**
 * Update orientation state
 */
function updateOrientation(): void {
  const angle = getOrientationAngle();
  const type = getOrientationType(angle);
  const isPortrait = type.startsWith('portrait');
  const isLandscape = type.startsWith('landscape');
  const lockState = lockStateSignal();

  orientationSignal.set({
    type,
    angle,
    isPortrait,
    isLandscape,
    isLocked: lockState.isLocked,
    lockType: lockState.lockType,
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Set up orientation listeners
 */
function setupOrientationListeners(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Use Screen Orientation API
  if (screen.orientation) {
    const handler = () => updateOrientation();
    screen.orientation.addEventListener('change', handler);
    return () => screen.orientation.removeEventListener('change', handler);
  }

  // Fallback to window events
  const handleResize = () => {
    // Debounce to handle orientation change
    setTimeout(updateOrientation, 100);
  };

  const handleOrientationChange = () => {
    // Delay to get accurate dimensions
    setTimeout(updateOrientation, 50);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleOrientationChange);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
  };
}

// Initialize listeners
if (typeof window !== 'undefined') {
  setupOrientationListeners();
}

// ============================================================================
// Orientation Control
// ============================================================================

/**
 * Lock screen orientation
 */
export async function lockOrientation(
  orientation: OrientationLockType
): Promise<boolean> {
  // Try native first
  if (isNativePlatform()) {
    try {
      await callPlugin('ScreenOrientation', 'lock', { orientation });
      lockStateSignal.set({ isLocked: true, lockType: orientation });
      updateOrientation();
      return true;
    } catch {
      // Fall through to web API
    }
  }

  // Use Screen Orientation API
  if (screen.orientation && 'lock' in screen.orientation) {
    try {
      await (screen.orientation as any).lock(orientation);
      lockStateSignal.set({ isLocked: true, lockType: orientation });
      updateOrientation();
      return true;
    } catch (error) {
      console.warn('Orientation lock failed:', error);
      return false;
    }
  }

  console.warn('Screen orientation lock not supported');
  return false;
}

/**
 * Unlock screen orientation
 */
export async function unlockOrientation(): Promise<void> {
  // Try native first
  if (isNativePlatform()) {
    try {
      await callPlugin('ScreenOrientation', 'unlock');
      lockStateSignal.set({ isLocked: false, lockType: null });
      updateOrientation();
      return;
    } catch {
      // Fall through to web API
    }
  }

  // Use Screen Orientation API
  if (screen.orientation && 'unlock' in screen.orientation) {
    try {
      (screen.orientation as any).unlock();
      lockStateSignal.set({ isLocked: false, lockType: null });
      updateOrientation();
    } catch (error) {
      console.warn('Orientation unlock failed:', error);
    }
  }
}

/**
 * Lock to portrait mode
 */
export async function lockToPortrait(): Promise<boolean> {
  return lockOrientation('portrait');
}

/**
 * Lock to landscape mode
 */
export async function lockToLandscape(): Promise<boolean> {
  return lockOrientation('landscape');
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to get screen orientation
 */
export function useOrientation(): OrientationInfo {
  return orientationSignal();
}

/**
 * Hook for portrait mode
 */
export function useIsPortrait(): boolean {
  return orientationSignal().isPortrait;
}

/**
 * Hook for landscape mode
 */
export function useIsLandscape(): boolean {
  return orientationSignal().isLandscape;
}

/**
 * Hook for orientation angle
 */
export function useOrientationAngle(): number {
  return orientationSignal().angle;
}

/**
 * Hook with orientation lock controls
 */
export function useOrientationLock(): {
  orientation: OrientationInfo;
  lock: (type: OrientationLockType) => Promise<boolean>;
  unlock: () => Promise<void>;
  lockPortrait: () => Promise<boolean>;
  lockLandscape: () => Promise<boolean>;
} {
  return {
    orientation: orientationSignal(),
    lock: lockOrientation,
    unlock: unlockOrientation,
    lockPortrait: lockToPortrait,
    lockLandscape: lockToLandscape,
  };
}

/**
 * Hook to run effect on orientation change
 */
export function useOrientationEffect(
  callback: (orientation: OrientationInfo) => void | (() => void)
): void {
  effect(() => {
    const orientation = orientationSignal();
    const cleanup = callback(orientation);
    return cleanup;
  });
}

/**
 * Hook to lock orientation for a screen
 */
export function useOrientationForScreen(
  lockType: OrientationLockType,
  options?: { unlockOnUnmount?: boolean }
): void {
  effect(() => {
    lockOrientation(lockType);

    if (options?.unlockOnUnmount !== false) {
      return () => {
        unlockOrientation();
      };
    }
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current orientation synchronously
 */
export function getOrientation(): OrientationInfo {
  return orientationSignal();
}

/**
 * Check if device supports orientation lock
 */
export function supportsOrientationLock(): boolean {
  if (typeof screen === 'undefined') return false;
  return !!screen.orientation && 'lock' in screen.orientation;
}

/**
 * Get aspect ratio based on orientation
 */
export function getAspectRatio(): number {
  const { width, height } = orientationSignal();
  return width / height;
}

/**
 * Check if screen is square-ish (for responsive layouts)
 */
export function isSquareScreen(threshold = 0.2): boolean {
  const ratio = getAspectRatio();
  return Math.abs(ratio - 1) < threshold;
}

// ============================================================================
// Responsive Breakpoints
// ============================================================================

/**
 * Orientation-aware breakpoint type
 */
export type OrientationBreakpoint = 'phone-portrait' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

/**
 * Get current breakpoint based on orientation and size
 */
export function getOrientationBreakpoint(): OrientationBreakpoint {
  const { width, height, isLandscape } = orientationSignal();
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  // Phone (< 600px width in portrait)
  if (minDimension < 600) {
    return isLandscape ? 'phone-landscape' : 'phone-portrait';
  }

  // Tablet (600-1024px width in portrait)
  if (minDimension < 1024) {
    return isLandscape ? 'tablet-landscape' : 'tablet-portrait';
  }

  // Desktop
  return 'desktop';
}

/**
 * Hook for orientation breakpoint
 */
export function useOrientationBreakpoint(): OrientationBreakpoint {
  orientationSignal(); // Subscribe to changes
  return getOrientationBreakpoint();
}

// ============================================================================
// Exports
// ============================================================================

export { orientationSignal as orientation };

export default useOrientation;

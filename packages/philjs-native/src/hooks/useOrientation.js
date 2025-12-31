// @ts-nocheck
/**
 * PhilJS Native - useOrientation Hook
 *
 * Provides screen orientation tracking with support for
 * locking orientation and handling orientation changes.
 */
import { signal, effect } from 'philjs-core';
import { isCapacitor, callPlugin, isNativePlatform } from '../capacitor/index.js';
// ============================================================================
// State
// ============================================================================
/**
 * Orientation signal
 */
const orientationSignal = signal(getInitialOrientation());
/**
 * Orientation lock state
 */
const lockStateSignal = signal({
    isLocked: false,
    lockType: null,
});
// ============================================================================
// Detection Functions
// ============================================================================
/**
 * Get initial orientation
 */
function getInitialOrientation() {
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
function getOrientationAngle() {
    if (typeof window === 'undefined')
        return 0;
    // Use Screen Orientation API if available
    if (screen.orientation) {
        return screen.orientation.angle;
    }
    // Fallback to window.orientation (deprecated but still used on some devices)
    if ('orientation' in window) {
        return window.orientation || 0;
    }
    // Fallback based on dimensions
    return window.innerWidth > window.innerHeight ? 90 : 0;
}
/**
 * Get orientation type from angle
 */
function getOrientationType(angle) {
    // Use Screen Orientation API if available
    if (typeof screen !== 'undefined' && screen.orientation) {
        return screen.orientation.type;
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
function updateOrientation() {
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
function setupOrientationListeners() {
    if (typeof window === 'undefined') {
        return () => { };
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
export async function lockOrientation(orientation) {
    // Try native first
    if (isNativePlatform()) {
        try {
            await callPlugin('ScreenOrientation', 'lock', { orientation });
            lockStateSignal.set({ isLocked: true, lockType: orientation });
            updateOrientation();
            return true;
        }
        catch {
            // Fall through to web API
        }
    }
    // Use Screen Orientation API
    if (screen.orientation && 'lock' in screen.orientation) {
        try {
            await screen.orientation.lock(orientation);
            lockStateSignal.set({ isLocked: true, lockType: orientation });
            updateOrientation();
            return true;
        }
        catch (error) {
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
export async function unlockOrientation() {
    // Try native first
    if (isNativePlatform()) {
        try {
            await callPlugin('ScreenOrientation', 'unlock');
            lockStateSignal.set({ isLocked: false, lockType: null });
            updateOrientation();
            return;
        }
        catch {
            // Fall through to web API
        }
    }
    // Use Screen Orientation API
    if (screen.orientation && 'unlock' in screen.orientation) {
        try {
            screen.orientation.unlock();
            lockStateSignal.set({ isLocked: false, lockType: null });
            updateOrientation();
        }
        catch (error) {
            console.warn('Orientation unlock failed:', error);
        }
    }
}
/**
 * Lock to portrait mode
 */
export async function lockToPortrait() {
    return lockOrientation('portrait');
}
/**
 * Lock to landscape mode
 */
export async function lockToLandscape() {
    return lockOrientation('landscape');
}
// ============================================================================
// Hook
// ============================================================================
/**
 * Hook to get screen orientation
 */
export function useOrientation() {
    return orientationSignal();
}
/**
 * Hook for portrait mode
 */
export function useIsPortrait() {
    return orientationSignal().isPortrait;
}
/**
 * Hook for landscape mode
 */
export function useIsLandscape() {
    return orientationSignal().isLandscape;
}
/**
 * Hook for orientation angle
 */
export function useOrientationAngle() {
    return orientationSignal().angle;
}
/**
 * Hook with orientation lock controls
 */
export function useOrientationLock() {
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
export function useOrientationEffect(callback) {
    effect(() => {
        const orientation = orientationSignal();
        const cleanup = callback(orientation);
        return cleanup;
    });
}
/**
 * Hook to lock orientation for a screen
 */
export function useOrientationForScreen(lockType, options) {
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
export function getOrientation() {
    return orientationSignal();
}
/**
 * Check if device supports orientation lock
 */
export function supportsOrientationLock() {
    if (typeof screen === 'undefined')
        return false;
    return !!screen.orientation && 'lock' in screen.orientation;
}
/**
 * Get aspect ratio based on orientation
 */
export function getAspectRatio() {
    const { width, height } = orientationSignal();
    return width / height;
}
/**
 * Check if screen is square-ish (for responsive layouts)
 */
export function isSquareScreen(threshold = 0.2) {
    const ratio = getAspectRatio();
    return Math.abs(ratio - 1) < threshold;
}
/**
 * Get current breakpoint based on orientation and size
 */
export function getOrientationBreakpoint() {
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
export function useOrientationBreakpoint() {
    orientationSignal(); // Subscribe to changes
    return getOrientationBreakpoint();
}
// ============================================================================
// Exports
// ============================================================================
export { orientationSignal as orientation };
export default useOrientation;
//# sourceMappingURL=useOrientation.js.map
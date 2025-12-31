/**
 * PhilJS Native - useOrientation Hook
 *
 * Provides screen orientation tracking with support for
 * locking orientation and handling orientation changes.
 */
import { type Signal } from 'philjs-core';
/**
 * Orientation type
 */
export type OrientationType = 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape' | 'landscape-primary' | 'landscape-secondary';
/**
 * Orientation lock type
 */
export type OrientationLockType = 'any' | 'natural' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape' | 'landscape-primary' | 'landscape-secondary';
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
/**
 * Orientation signal
 */
declare const orientationSignal: Signal<OrientationInfo>;
/**
 * Lock screen orientation
 */
export declare function lockOrientation(orientation: OrientationLockType): Promise<boolean>;
/**
 * Unlock screen orientation
 */
export declare function unlockOrientation(): Promise<void>;
/**
 * Lock to portrait mode
 */
export declare function lockToPortrait(): Promise<boolean>;
/**
 * Lock to landscape mode
 */
export declare function lockToLandscape(): Promise<boolean>;
/**
 * Hook to get screen orientation
 */
export declare function useOrientation(): OrientationInfo;
/**
 * Hook for portrait mode
 */
export declare function useIsPortrait(): boolean;
/**
 * Hook for landscape mode
 */
export declare function useIsLandscape(): boolean;
/**
 * Hook for orientation angle
 */
export declare function useOrientationAngle(): number;
/**
 * Hook with orientation lock controls
 */
export declare function useOrientationLock(): {
    orientation: OrientationInfo;
    lock: (type: OrientationLockType) => Promise<boolean>;
    unlock: () => Promise<void>;
    lockPortrait: () => Promise<boolean>;
    lockLandscape: () => Promise<boolean>;
};
/**
 * Hook to run effect on orientation change
 */
export declare function useOrientationEffect(callback: (orientation: OrientationInfo) => void | (() => void)): void;
/**
 * Hook to lock orientation for a screen
 */
export declare function useOrientationForScreen(lockType: OrientationLockType, options?: {
    unlockOnUnmount?: boolean;
}): void;
/**
 * Get current orientation synchronously
 */
export declare function getOrientation(): OrientationInfo;
/**
 * Check if device supports orientation lock
 */
export declare function supportsOrientationLock(): boolean;
/**
 * Get aspect ratio based on orientation
 */
export declare function getAspectRatio(): number;
/**
 * Check if screen is square-ish (for responsive layouts)
 */
export declare function isSquareScreen(threshold?: number): boolean;
/**
 * Orientation-aware breakpoint type
 */
export type OrientationBreakpoint = 'phone-portrait' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';
/**
 * Get current breakpoint based on orientation and size
 */
export declare function getOrientationBreakpoint(): OrientationBreakpoint;
/**
 * Hook for orientation breakpoint
 */
export declare function useOrientationBreakpoint(): OrientationBreakpoint;
export { orientationSignal as orientation };
export default useOrientation;
//# sourceMappingURL=useOrientation.d.ts.map
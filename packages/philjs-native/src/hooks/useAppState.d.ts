/**
 * PhilJS Native - useAppState Hook
 *
 * Provides app lifecycle state tracking including foreground/background,
 * suspend/resume, and memory warnings.
 */
import { type Signal } from 'philjs-core';
/**
 * App state type
 */
export type AppStateType = 'active' | 'background' | 'inactive' | 'unknown';
/**
 * App state info
 */
export interface AppStateInfo {
    /** Current state */
    state: AppStateType;
    /** Previous state */
    previousState: AppStateType | null;
    /** Whether app is in foreground */
    isActive: boolean;
    /** Whether app is in background */
    isBackground: boolean;
    /** Whether app is inactive (iOS transitioning) */
    isInactive: boolean;
    /** Time app entered current state */
    stateChangedAt: Date;
    /** Time spent in background (ms) */
    backgroundTime: number;
    /** Total time app has been active (ms) */
    activeTime: number;
    /** Number of times app went to background */
    backgroundCount: number;
}
/**
 * Memory warning level
 */
export type MemoryWarningLevel = 'normal' | 'moderate' | 'critical';
/**
 * Memory warning info
 */
export interface MemoryWarning {
    level: MemoryWarningLevel;
    timestamp: Date;
}
/**
 * App state signal
 */
declare const appStateSignal: Signal<AppStateInfo>;
/**
 * Memory warning signal
 */
declare const memoryWarningSignal: Signal<MemoryWarning | null>;
/**
 * Hook to get app state
 */
export declare function useAppState(): AppStateInfo;
/**
 * Hook for active state
 */
export declare function useIsActive(): boolean;
/**
 * Hook for background state
 */
export declare function useIsBackground(): boolean;
/**
 * Hook for current state type
 */
export declare function useAppStateType(): AppStateType;
/**
 * Hook with state change callback
 */
export declare function useOnAppStateChange(callback: (state: AppStateInfo) => void): void;
/**
 * Hook for when app enters foreground
 */
export declare function useOnForeground(callback: () => void): void;
/**
 * Hook for when app enters background
 */
export declare function useOnBackground(callback: () => void): void;
/**
 * Hook for memory warnings
 */
export declare function useMemoryWarning(): MemoryWarning | null;
/**
 * Hook for memory warning callback
 */
export declare function useOnMemoryWarning(callback: (warning: MemoryWarning) => void): void;
/**
 * Hook to pause/resume operations based on app state
 */
export declare function useAppStateEffect(onActive: () => void | (() => void), onBackground?: () => void): void;
/**
 * Get app state synchronously
 */
export declare function getAppState(): AppStateInfo;
/**
 * Get time since app was last active
 */
export declare function getTimeSinceActive(): number;
/**
 * Get total background time
 */
export declare function getTotalBackgroundTime(): number;
/**
 * Get total active time
 */
export declare function getTotalActiveTime(): number;
/**
 * Format time duration
 */
export declare function formatDuration(ms: number): string;
/**
 * Check if app was recently backgrounded
 */
export declare function wasRecentlyBackgrounded(thresholdMs?: number): boolean;
/**
 * Add state change listener
 */
export declare function addAppStateListener(callback: (state: AppStateInfo) => void): () => void;
/**
 * Add foreground listener
 */
export declare function addForegroundListener(callback: () => void): () => void;
/**
 * Add background listener
 */
export declare function addBackgroundListener(callback: () => void): () => void;
export { appStateSignal as appStateInfo, memoryWarningSignal as memoryWarning, };
export default useAppState;
//# sourceMappingURL=useAppState.d.ts.map
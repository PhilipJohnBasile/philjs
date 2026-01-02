// @ts-nocheck
/**
 * PhilJS Native - useAppState Hook
 *
 * Provides app lifecycle state tracking including foreground/background,
 * suspend/resume, and memory warnings.
 */

import { signal, effect, type Signal } from '@philjs/core';
import {
  isCapacitor,
  isNativePlatform,
  addLifecycleListener,
  appState as capacitorAppState,
} from '../capacitor/index.js';
import { isTauri, listen } from '../tauri/index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// State
// ============================================================================

/**
 * App state signal
 */
const appStateSignal: Signal<AppStateInfo> = signal({
  state: 'active',
  previousState: null,
  isActive: true,
  isBackground: false,
  isInactive: false,
  stateChangedAt: new Date(),
  backgroundTime: 0,
  activeTime: 0,
  backgroundCount: 0,
});

/**
 * Memory warning signal
 */
const memoryWarningSignal: Signal<MemoryWarning | null> = signal(null);

/**
 * Listeners
 */
const stateChangeListeners = new Set<(state: AppStateInfo) => void>();
const foregroundListeners = new Set<() => void>();
const backgroundListeners = new Set<() => void>();
const memoryWarningListeners = new Set<(warning: MemoryWarning) => void>();

/**
 * Tracking
 */
let backgroundStartTime: number | null = null;
let activeStartTime = Date.now();

// ============================================================================
// State Management
// ============================================================================

/**
 * Update app state
 */
function updateAppState(newState: AppStateType): void {
  const currentInfo = appStateSignal();
  const now = Date.now();

  // Calculate times
  let backgroundTime = currentInfo.backgroundTime;
  let activeTime = currentInfo.activeTime;
  let backgroundCount = currentInfo.backgroundCount;

  if (currentInfo.state === 'background' && newState === 'active') {
    // Coming from background
    if (backgroundStartTime !== null) {
      backgroundTime += now - backgroundStartTime;
      backgroundStartTime = null;
    }
    activeStartTime = now;

    // Notify foreground listeners
    foregroundListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Foreground listener error:', error);
      }
    });
  } else if (currentInfo.state === 'active' && newState === 'background') {
    // Going to background
    backgroundStartTime = now;
    activeTime += now - activeStartTime;
    backgroundCount++;

    // Notify background listeners
    backgroundListeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Background listener error:', error);
      }
    });
  }

  const newInfo: AppStateInfo = {
    state: newState,
    previousState: currentInfo.state,
    isActive: newState === 'active',
    isBackground: newState === 'background',
    isInactive: newState === 'inactive',
    stateChangedAt: new Date(),
    backgroundTime,
    activeTime,
    backgroundCount,
  };

  appStateSignal.set(newInfo);

  // Notify state change listeners
  stateChangeListeners.forEach((listener) => {
    try {
      listener(newInfo);
    } catch (error) {
      console.error('State change listener error:', error);
    }
  });
}

/**
 * Handle memory warning
 */
function handleMemoryWarning(level: MemoryWarningLevel): void {
  const warning: MemoryWarning = {
    level,
    timestamp: new Date(),
  };

  memoryWarningSignal.set(warning);

  memoryWarningListeners.forEach((listener) => {
    try {
      listener(warning);
    } catch (error) {
      console.error('Memory warning listener error:', error);
    }
  });
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Set up web visibility listeners
 */
function setupWebListeners(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateAppState('active');
    } else if (document.visibilityState === 'hidden') {
      updateAppState('background');
    }
  };

  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      updateAppState('active');
    }
  };

  const handlePageHide = () => {
    updateAppState('background');
  };

  const handleBlur = () => {
    // Mark as inactive briefly when window loses focus
    if (document.visibilityState === 'visible') {
      updateAppState('inactive');
    }
  };

  const handleFocus = () => {
    if (document.visibilityState === 'visible') {
      updateAppState('active');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
  };
}

/**
 * Set up Capacitor listeners
 */
function setupCapacitorListeners(): () => void {
  if (!isCapacitor()) {
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  // App state change
  cleanups.push(
    addLifecycleListener('appStateChange', (data: { isActive: boolean }) => {
      updateAppState(data.isActive ? 'active' : 'background');
    })
  );

  // Pause (going to background)
  cleanups.push(
    addLifecycleListener('pause', () => {
      updateAppState('background');
    })
  );

  // Resume (coming to foreground)
  cleanups.push(
    addLifecycleListener('resume', () => {
      updateAppState('active');
    })
  );

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

/**
 * Set up Tauri listeners
 */
async function setupTauriListeners(): Promise<() => void> {
  if (!isTauri()) {
    return () => {};
  }

  const cleanups: Array<() => void> = [];

  // Window focus
  cleanups.push(
    await listen('tauri://focus', () => {
      updateAppState('active');
    })
  );

  // Window blur
  cleanups.push(
    await listen('tauri://blur', () => {
      updateAppState('inactive');
    })
  );

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

// Initialize listeners
if (typeof window !== 'undefined') {
  setupWebListeners();
  setupCapacitorListeners();
  setupTauriListeners();
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to get app state
 */
export function useAppState(): AppStateInfo {
  return appStateSignal();
}

/**
 * Hook for active state
 */
export function useIsActive(): boolean {
  return appStateSignal().isActive;
}

/**
 * Hook for background state
 */
export function useIsBackground(): boolean {
  return appStateSignal().isBackground;
}

/**
 * Hook for current state type
 */
export function useAppStateType(): AppStateType {
  return appStateSignal().state;
}

/**
 * Hook with state change callback
 */
export function useOnAppStateChange(
  callback: (state: AppStateInfo) => void
): void {
  effect(() => {
    stateChangeListeners.add(callback);
    return () => {
      stateChangeListeners.delete(callback);
    };
  });
}

/**
 * Hook for when app enters foreground
 */
export function useOnForeground(callback: () => void): void {
  effect(() => {
    foregroundListeners.add(callback);
    return () => {
      foregroundListeners.delete(callback);
    };
  });
}

/**
 * Hook for when app enters background
 */
export function useOnBackground(callback: () => void): void {
  effect(() => {
    backgroundListeners.add(callback);
    return () => {
      backgroundListeners.delete(callback);
    };
  });
}

/**
 * Hook for memory warnings
 */
export function useMemoryWarning(): MemoryWarning | null {
  return memoryWarningSignal();
}

/**
 * Hook for memory warning callback
 */
export function useOnMemoryWarning(
  callback: (warning: MemoryWarning) => void
): void {
  effect(() => {
    memoryWarningListeners.add(callback);
    return () => {
      memoryWarningListeners.delete(callback);
    };
  });
}

/**
 * Hook to pause/resume operations based on app state
 */
export function useAppStateEffect(
  onActive: () => void | (() => void),
  onBackground?: () => void
): void {
  effect(() => {
    const state = appStateSignal();
    let cleanup: (() => void) | void;

    if (state.isActive) {
      cleanup = onActive();
    } else if (state.isBackground && onBackground) {
      onBackground();
    }

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get app state synchronously
 */
export function getAppState(): AppStateInfo {
  return appStateSignal();
}

/**
 * Get time since app was last active
 */
export function getTimeSinceActive(): number {
  const state = appStateSignal();
  if (state.isActive) return 0;

  return Date.now() - state.stateChangedAt.getTime();
}

/**
 * Get total background time
 */
export function getTotalBackgroundTime(): number {
  const state = appStateSignal();
  let total = state.backgroundTime;

  if (state.isBackground && backgroundStartTime !== null) {
    total += Date.now() - backgroundStartTime;
  }

  return total;
}

/**
 * Get total active time
 */
export function getTotalActiveTime(): number {
  const state = appStateSignal();
  let total = state.activeTime;

  if (state.isActive) {
    total += Date.now() - activeStartTime;
  }

  return total;
}

/**
 * Format time duration
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Check if app was recently backgrounded
 */
export function wasRecentlyBackgrounded(thresholdMs = 1000): boolean {
  const state = appStateSignal();
  if (!state.isActive) return false;
  if (state.previousState !== 'background') return false;

  const timeSinceChange = Date.now() - state.stateChangedAt.getTime();
  return timeSinceChange < thresholdMs;
}

/**
 * Add state change listener
 */
export function addAppStateListener(
  callback: (state: AppStateInfo) => void
): () => void {
  stateChangeListeners.add(callback);
  return () => {
    stateChangeListeners.delete(callback);
  };
}

/**
 * Add foreground listener
 */
export function addForegroundListener(callback: () => void): () => void {
  foregroundListeners.add(callback);
  return () => {
    foregroundListeners.delete(callback);
  };
}

/**
 * Add background listener
 */
export function addBackgroundListener(callback: () => void): () => void {
  backgroundListeners.add(callback);
  return () => {
    backgroundListeners.delete(callback);
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  appStateSignal as appStateInfo,
  memoryWarningSignal as memoryWarning,
};

export default useAppState;

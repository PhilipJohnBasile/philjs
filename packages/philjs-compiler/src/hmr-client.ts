/**
 * Client-side HMR helper for PhilJS
 *
 * This module provides client-side HMR state management that works
 * with the Vite plugin to preserve signal state across hot updates.
 *
 * It should be automatically injected by the Vite plugin during development.
 */

import {
  snapshotHMRState,
  restoreHMRState,
  rollbackHMRState,
  cleanupHMREffects,
  getHMRStats,
  isHMRInProgress,
  type HMROptions,
} from 'philjs-core/signals';

import {
  showHMRErrorOverlay,
  type HMRErrorType,
} from './hmr-overlay';

/**
 * HMR client state
 */
interface HMRClientState {
  lastSnapshot: Map<string, any> | null;
  updateCount: number;
  failureCount: number;
  totalDuration: number;
  isActive: boolean;
}

const clientState: HMRClientState = {
  lastSnapshot: null,
  updateCount: 0,
  failureCount: 0,
  totalDuration: 0,
  isActive: false,
};

/**
 * HMR event data from Vite plugin
 */
interface HMREventData {
  file: string;
  hasComponents?: boolean;
  hasSignals?: boolean;
  hasEffects?: boolean;
  moduleCount?: number;
  error?: string;
  stack?: string;
  shouldReload?: boolean;
}

/**
 * Setup HMR client handlers
 *
 * This should be called automatically when the module is imported in dev mode.
 */
export function setupHMRClient(options: HMROptions = {}): void {
  if (typeof window === 'undefined' || !import.meta.hot) {
    return;
  }

  const verbose = options.verbose ?? false;

  // Listen for HMR snapshot events
  import.meta.hot.on('philjs:hmr-snapshot', (data: HMREventData) => {
    const startTime = performance.now();

    try {
      if (verbose) {
        console.log('[PhilJS HMR] Snapshotting state before update:', data);
      }

      // Cleanup old effects to prevent memory leaks
      if (data.hasEffects) {
        cleanupHMREffects({ verbose });
      }

      // Take snapshot of current state
      const snapshot = snapshotHMRState({ verbose });
      clientState.lastSnapshot = snapshot;
      clientState.isActive = true;

      const duration = performance.now() - startTime;

      if (verbose) {
        const stats = getHMRStats();
        console.log(
          `[PhilJS HMR] Snapshot complete in ${duration.toFixed(2)}ms`,
          `(${stats.signalCount} signals, ${stats.effectCount} effects)`
        );
      }

      // Warn if snapshot took too long
      if (duration > 100) {
        showHMRErrorOverlay({
          type: 'timeout',
          message: `HMR snapshot took ${duration.toFixed(2)}ms (target: <100ms)`,
          file: data.file,
          suggestion: 'Consider reducing the number of signals or optimizing signal values for serialization.',
          canRetry: true,
          canRollback: false,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('[PhilJS HMR] Snapshot failed:', error);

      showHMRErrorOverlay({
        type: 'snapshot-failed',
        message: error instanceof Error ? error.message : String(error),
        file: data.file,
        stack: error instanceof Error ? error.stack : undefined,
        canRetry: true,
        canRollback: false,
        timestamp: Date.now(),
      });

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  // Listen for HMR error events
  import.meta.hot.on('philjs:hmr-error', (data: HMREventData) => {
    if (verbose) {
      console.error('[PhilJS HMR] Update failed:', data);
    }

    clientState.failureCount++;

    showHMRErrorOverlay({
      type: 'update-failed',
      message: data.error || 'HMR update failed',
      file: data.file,
      stack: data.stack,
      suggestion: 'Check the console for detailed error information. You can try rolling back to the previous state or reload the page.',
      canRetry: true,
      canRollback: clientState.lastSnapshot !== null,
      timestamp: Date.now(),
    });

    // Attempt rollback if we have a snapshot
    if (clientState.lastSnapshot) {
      try {
        rollbackHMRState(clientState.lastSnapshot, { verbose });

        if (verbose) {
          console.log('[PhilJS HMR] State rolled back successfully');
        }
      } catch (rollbackError) {
        console.error('[PhilJS HMR] Rollback failed:', rollbackError);

        showHMRErrorOverlay({
          type: 'restore-failed',
          message: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          file: data.file,
          stack: rollbackError instanceof Error ? rollbackError.stack : undefined,
          suggestion: 'State rollback failed. A full page reload is recommended.',
          canRetry: false,
          canRollback: false,
          timestamp: Date.now(),
        });
      }
    }

    // Full reload if suggested
    if (data.shouldReload) {
      console.warn('[PhilJS HMR] Performing full page reload...');
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  // Hook into Vite's HMR accept
  import.meta.hot.on('vite:beforeUpdate', () => {
    if (!isHMRInProgress()) {
      return;
    }

    const startTime = performance.now();

    try {
      if (verbose) {
        console.log('[PhilJS HMR] Applying update...');
      }

      // State will be restored after modules are re-evaluated
      // This happens automatically via the snapshot/restore mechanism

      clientState.updateCount++;
      const duration = performance.now() - startTime;
      clientState.totalDuration += duration;

      if (verbose) {
        console.log(`[PhilJS HMR] Update applied in ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('[PhilJS HMR] Update failed:', error);
      clientState.failureCount++;

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  // Hook into Vite's after update to restore state
  import.meta.hot.on('vite:afterUpdate', () => {
    if (!clientState.isActive) {
      return;
    }

    const startTime = performance.now();

    try {
      // Restore state after update
      restoreHMRState({ verbose });

      const duration = performance.now() - startTime;

      if (verbose) {
        const avgDuration = clientState.totalDuration / clientState.updateCount;
        console.log(
          `[PhilJS HMR] State restored in ${duration.toFixed(2)}ms`,
          `(avg: ${avgDuration.toFixed(2)}ms, ` +
          `updates: ${clientState.updateCount}, ` +
          `failures: ${clientState.failureCount})`
        );
      }

      clientState.isActive = false;
    } catch (error) {
      console.error('[PhilJS HMR] Restore failed:', error);

      // Attempt rollback
      if (clientState.lastSnapshot) {
        try {
          rollbackHMRState(clientState.lastSnapshot, { verbose });
          console.warn('[PhilJS HMR] Rolled back to previous state');
        } catch (rollbackError) {
          console.error('[PhilJS HMR] Rollback failed:', rollbackError);
          console.warn('[PhilJS HMR] Performing full page reload...');
          window.location.reload();
        }
      }

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  if (verbose) {
    console.log('[PhilJS HMR] Client initialized');
  }
}

/**
 * Get HMR client statistics
 */
export function getHMRClientStats(): HMRClientState & ReturnType<typeof getHMRStats> {
  return {
    ...clientState,
    ...getHMRStats(),
  };
}

/**
 * Reset HMR client statistics
 */
export function resetHMRClientStats(): void {
  clientState.updateCount = 0;
  clientState.failureCount = 0;
  clientState.totalDuration = 0;
}

// Auto-setup in development mode
if (import.meta.env?.DEV && import.meta.hot) {
  setupHMRClient({
    verbose: import.meta.env?.VITE_PHILJS_HMR_VERBOSE === 'true',
  });
}

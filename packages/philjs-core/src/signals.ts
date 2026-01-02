/**
 * Fine-grained reactive signals implementation for PhilJS.
 * Inspired by SolidJS with automatic dependency tracking.
 */

import type {
  Signal,
  Memo,
  LinkedSignal,
  LinkedSignalOptions,
  Resource,
  EffectCleanup,
  EffectFunction,
  ResourceFetcher,
  Computation,
  Owner,
  Setter
} from './types.js';

// Re-export types for backwards compatibility
export type {
  Signal,
  Memo,
  LinkedSignal,
  LinkedSignalOptions,
  Resource,
  EffectCleanup,
  EffectFunction,
  ResourceFetcher
};

// ============================================================================
// Reactive Context
// ============================================================================

let activeComputation: Computation | null = null;
let batchDepth = 0;
let batchedUpdates = new Set<() => void>();

let currentOwner: Owner | null = null;
let currentNestedDisposers: Array<() => void> | null = null;

// ============================================================================
// HMR State Management (Development Only)
// ============================================================================

// HMR state is only tracked in development mode to reduce production bundle size
const isDev = typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';

/**
 * Global HMR state registry for preserving signal values across hot updates.
 * Maps signal IDs to their current values.
 */
const hmrStateRegistry = isDev ? new Map<string, any>() : null;

/**
 * Track all active signals for HMR snapshot/restore.
 * Weak references to avoid memory leaks.
 */
const activeSignals = isDev ? new Set<{ id: string; get: () => any; set: (v: any) => void }>() : null;

/**
 * Track all active effects for proper cleanup during HMR.
 */
const activeEffects = isDev ? new Set<{ id: string; dispose: () => void }>() : null;

/**
 * Counter for generating unique signal IDs.
 */
let signalIdCounter = 0;

/**
 * Flag to indicate if HMR is in progress.
 */
let hmrInProgress = false;

/**
 * Snapshot of state before HMR update (for rollback on error).
 */
let hmrStateSnapshot: Map<string, any> | null = null;

// ============================================================================
// Core Signal Implementation
// ============================================================================

/**
 * Create a reactive signal with automatic dependency tracking.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * console.log(count()); // 0
 * count.set(5);
 * console.log(count()); // 5
 * count.set(c => c + 1); // Updater function
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Computation>();

  const read = (() => {
    // Track this signal as a dependency of the active computation
    if (activeComputation) {
      subscribers.add(activeComputation);
      activeComputation.dependencies.add(subscribers);
    }
    return value;
  }) as Signal<T>;

  read.set = (nextValue: T | ((prev: T) => T)) => {
    // Handle updater function: if nextValue is a function, call it with current value
    const newValue = typeof nextValue === "function"
      ? (nextValue as (prev: T) => T)(value)
      : nextValue;

    // Only update if value actually changed (reference equality)
    if (Object.is(value, newValue)) return;

    value = newValue;

    // Notify all subscribers
    const toNotify = Array.from(subscribers);
    if (batchDepth > 0) {
      // Queue updates for batching
      for (const computation of toNotify) {
        batchedUpdates.add(computation.execute);
      }
    } else {
      // Execute immediately
      for (const computation of toNotify) {
        computation.execute();
      }
    }
  };

  read.subscribe = (fn: (v: T) => void) => {
    const computation: Computation = {
      execute: () => fn(value),
      dependencies: new Set(),
    };
    subscribers.add(computation);
    return () => subscribers.delete(computation);
  };

  // Peek reads the value without tracking dependencies
  read.peek = () => value;

  // Register signal for HMR tracking (development only)
  if (isDev && activeSignals && hmrStateRegistry) {
    const signalId = `signal_${signalIdCounter++}`;
    const signalHandle = {
      id: signalId,
      get: () => value,
      set: (v: any) => read.set(v as T),
    };
    activeSignals.add(signalHandle);
    hmrStateRegistry.set(signalId, initialValue);
  }

  return read;
}

// ============================================================================
// Computed Values (Memos)
// ============================================================================

/**
 * Create a memoized computation that automatically tracks dependencies.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const doubled = memo(() => count() * 2);
 * console.log(doubled()); // 0
 * count.set(5);
 * console.log(doubled()); // 10
 * ```
 */
export function memo<T>(calc: () => T): Memo<T> {
  let cachedValue: T;
  let isStale = true;
  const subscribers = new Set<Computation>();

  const computation: Computation = {
    execute: () => {
      isStale = true;
      // Notify subscribers that we're stale
      for (const sub of Array.from(subscribers)) {
        sub.execute();
      }
    },
    dependencies: new Set(),
  };

  const read = (() => {
    if (isStale) {
      // Clear old dependencies
      for (const deps of computation.dependencies) {
        deps.delete(computation);
      }
      computation.dependencies.clear();

      // Track new dependencies
      const prevComputation = activeComputation;
      activeComputation = computation;

      try {
        cachedValue = calc();
        isStale = false;
      } finally {
        activeComputation = prevComputation;
      }
    }

    // Track this memo as a dependency if we're in a computation
    if (activeComputation && activeComputation !== computation) {
      subscribers.add(activeComputation);
      activeComputation.dependencies.add(subscribers);
    }

    return cachedValue;
  }) as Memo<T> & { subscribe: (fn: (v: T) => void) => () => void };

  // Add subscribe method for JSX reactivity
  read.subscribe = (fn: (v: T) => void) => {
    const subscriberComputation: Computation = {
      execute: () => fn(read()),
      dependencies: new Set(),
    };
    subscribers.add(subscriberComputation);
    return () => subscribers.delete(subscriberComputation);
  };

  // Initialize the memo
  read();

  return read;
}

// ============================================================================
// Linked Signals (Writable Computed)
// ============================================================================

/**
 * Create a writable computed signal (like Angular's linkedSignal).
 * Acts like a memo by default, but can be manually overridden.
 * When dependencies change, it resets to the computed value unless configured otherwise.
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
 *
 * console.log(fullName()); // "John Doe"
 * fullName.set('Jane Smith'); // Manual override
 * console.log(fullName()); // "Jane Smith"
 * console.log(fullName.isOverridden()); // true
 *
 * firstName.set('Bob'); // Dependency changed - resets to computed
 * console.log(fullName()); // "Bob Doe"
 * console.log(fullName.isOverridden()); // false
 * ```
 */
export function linkedSignal<T>(
  computation: () => T,
  options: LinkedSignalOptions = {}
): LinkedSignal<T> {
  const { resetOnChange = true } = options;

  let cachedValue: T;
  let isOverridden = false;
  let isStale = true;
  const subscribers = new Set<Computation>();

  const comp: Computation = {
    execute: () => {
      // When dependencies change, mark as stale
      if (resetOnChange || !isOverridden) {
        isStale = true;
        isOverridden = false;
      }

      // Notify subscribers
      for (const sub of Array.from(subscribers)) {
        sub.execute();
      }
    },
    dependencies: new Set(),
  };

  const read = (() => {
    if (isStale && !isOverridden) {
      // Clear old dependencies
      for (const deps of comp.dependencies) {
        deps.delete(comp);
      }
      comp.dependencies.clear();

      // Track new dependencies
      const prevComputation = activeComputation;
      activeComputation = comp;

      try {
        cachedValue = computation();
        isStale = false;
      } finally {
        activeComputation = prevComputation;
      }
    }

    // Track this linked signal as a dependency if we're in a computation
    if (activeComputation && activeComputation !== comp) {
      subscribers.add(activeComputation);
      activeComputation.dependencies.add(subscribers);
    }

    return cachedValue;
  }) as LinkedSignal<T>;

  read.set = (nextValue: T | ((prev: T) => T)) => {
    const newValue = typeof nextValue === "function"
      ? (nextValue as (prev: T) => T)(cachedValue)
      : nextValue;

    if (Object.is(cachedValue, newValue)) return;

    cachedValue = newValue;
    isOverridden = true;
    isStale = false;

    // Notify all subscribers
    const toNotify = Array.from(subscribers);
    if (batchDepth > 0) {
      for (const subscriber of toNotify) {
        batchedUpdates.add(subscriber.execute);
      }
    } else {
      for (const subscriber of toNotify) {
        subscriber.execute();
      }
    }
  };

  read.reset = () => {
    isOverridden = false;
    isStale = true;

    // Force recomputation
    read();

    // Notify subscribers about the reset
    const toNotify = Array.from(subscribers);
    if (batchDepth > 0) {
      for (const subscriber of toNotify) {
        batchedUpdates.add(subscriber.execute);
      }
    } else {
      for (const subscriber of toNotify) {
        subscriber.execute();
      }
    }
  };

  read.isOverridden = () => isOverridden;

  // Initialize
  read();

  return read;
}

// ============================================================================
// Side Effects
// ============================================================================

/**
 * Create a side effect that automatically tracks dependencies and re-runs when they change.
 * Returns a cleanup function to dispose the effect.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('Count is:', count());
 *   return () => console.log('Cleanup!');
 * });
 *
 * count.set(5); // Logs: "Cleanup!" then "Count is: 5"
 * dispose(); // Stop the effect
 * ```
 */
export function effect(fn: EffectFunction): EffectCleanup {
  let cleanup: void | EffectCleanup;
  let isDisposed = false;

  let owner: Owner | null = null;
  let nestedDisposers: Array<() => void> = [];

  const computation: Computation = {
    execute: () => {
      if (isDisposed) return;

      // Run cleanup from previous execution
      if (typeof cleanup === "function") {
        cleanup();
      }

      // Run onCleanup callbacks from previous execution
      if (owner) {
        owner.cleanups.forEach(fn => fn());
        owner.cleanups = [];
      }

      // Dispose nested effects from previous execution
      const toDispose = [...nestedDisposers];
      nestedDisposers = [];
      for (const nestedDispose of toDispose) {
        nestedDispose();
      }

      // Clear old dependencies
      for (const deps of computation.dependencies) {
        deps.delete(computation);
      }
      computation.dependencies.clear();

      // Create owner for this effect
      const prevOwner = currentOwner;
      owner = {
        cleanups: [],
        owned: [],
      };
      currentOwner = owner;
      if (prevOwner) {
        prevOwner.owned.push(owner);
      }

      // Track new dependencies
      const prevComputation = activeComputation;
      activeComputation = computation;

      // Track nested effect disposers
      const prevNestedDisposers = currentNestedDisposers;
      currentNestedDisposers = nestedDisposers;

      try {
        cleanup = fn();
      } finally {
        activeComputation = prevComputation;
        currentOwner = prevOwner;
        currentNestedDisposers = prevNestedDisposers;
      }
    },
    dependencies: new Set(),
  };

  // Return cleanup function
  const dispose = () => {
    if (isDisposed) return;
    isDisposed = true;

    if (typeof cleanup === "function") {
      cleanup();
    }

    // Run onCleanup callbacks
    if (owner) {
      owner.cleanups.forEach(fn => fn());
      owner.cleanups = [];
    }

    // Dispose nested effects
    for (const nestedDispose of nestedDisposers) {
      nestedDispose();
    }
    nestedDisposers = [];

    // Clear dependencies
    for (const deps of computation.dependencies) {
      deps.delete(computation);
    }
    computation.dependencies.clear();

    // Unregister from HMR tracking (development only)
    if (isDev && activeEffects && effectHandle) {
      activeEffects.delete(effectHandle);
    }
  };

  // Register effect for HMR tracking (development only)
  let effectHandle: { id: string; dispose: () => void } | null = null;
  if (isDev && activeEffects) {
    const effectId = `effect_${signalIdCounter++}`;
    effectHandle = {
      id: effectId,
      dispose,
    };
    activeEffects.add(effectHandle);
  }

  // Register this effect's dispose with parent if we're inside another effect
  if (currentNestedDisposers) {
    currentNestedDisposers.push(dispose);
  }

  // Register dispose with current owner for root disposal
  if (currentOwner) {
    currentOwner.cleanups.push(dispose);
  }

  // Run the effect initially
  computation.execute();

  return dispose;
}

// ============================================================================
// Batching
// ============================================================================

/**
 * Batch multiple signal updates into a single update cycle.
 * This prevents unnecessary re-computations.
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * batch(() => {
 *   firstName.set('Jane');
 *   lastName.set('Smith');
 * }); // Only triggers one update to dependents
 * ```
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && batchedUpdates.size > 0) {
      // Execute all batched updates
      const updates = batchedUpdates;
      batchedUpdates = new Set();
      for (const update of updates) {
        update();
      }
    }
  }
}

// ============================================================================
// Untrack
// ============================================================================

/**
 * Run a function without tracking dependencies.
 * Useful for reading signals without creating dependencies.
 *
 * @example
 * ```ts
 * const a = signal(1);
 * const b = signal(2);
 *
 * const sum = memo(() => {
 *   const aVal = a(); // Tracked
 *   const bVal = untrack(() => b()); // Not tracked
 *   return aVal + bVal;
 * });
 *
 * b.set(100); // Won't trigger sum to recompute
 * a.set(5); // Will trigger sum to recompute
 * ```
 */
export function untrack<T>(fn: () => T): T {
  const prevComputation = activeComputation;
  activeComputation = null;
  try {
    return fn();
  } finally {
    activeComputation = prevComputation;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Register a cleanup function to be called when the current effect is disposed.
 *
 * @example
 * ```ts
 * effect(() => {
 *   const timer = setInterval(() => console.log('tick'), 1000);
 *   onCleanup(() => clearInterval(timer));
 * });
 * ```
 */
export function onCleanup(cleanup: EffectCleanup): void {
  if (currentOwner) {
    currentOwner.cleanups.push(cleanup);
  }
}

// ============================================================================
// Root (Owner Management)
// ============================================================================

/**
 * Create a root scope for effects that lives until explicitly disposed.
 * Useful for managing long-lived reactive scopes.
 *
 * @example
 * ```ts
 * const dispose = createRoot(dispose => {
 *   const count = signal(0);
 *   effect(() => console.log(count()));
 *   return dispose; // Return dispose function
 * });
 *
 * // Later...
 * dispose(); // Clean up all effects
 * ```
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const prevOwner = currentOwner;
  const owner: Owner = {
    cleanups: [],
    owned: [],
  };
  currentOwner = owner;

  const dispose = () => {
    // Dispose all owned children
    owner.owned.forEach(child => disposeOwner(child));
    owner.owned = [];

    // Run cleanups
    owner.cleanups.forEach(cleanup => cleanup());
    owner.cleanups = [];
  };

  try {
    return fn(dispose);
  } finally {
    currentOwner = prevOwner;
  }
}

function disposeOwner(owner: Owner): void {
  owner.owned.forEach(child => disposeOwner(child));
  owner.owned = [];
  owner.cleanups.forEach(cleanup => cleanup());
  owner.cleanups = [];
}

// ============================================================================
// Resources (Async Signals)
// ============================================================================

/**
 * Create a resource that tracks loading and error states.
 *
 * @example
 * ```ts
 * const userId = signal(1);
 * const user = resource(async () => {
 *   const response = await fetch(`/api/users/${userId()}`);
 *   return response.json();
 * });
 *
 * if (user.loading()) {
 *   return <div>Loading...</div>;
 * }
 * if (user.error()) {
 *   return <div>Error: {user.error().message}</div>;
 * }
 * return <div>User: {user().name}</div>;
 * ```
 */
export function resource<T>(fetcher: ResourceFetcher<T>): Resource<T> {
  const data = signal<T | undefined>(undefined);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const refresh = () => {
    loading.set(true);
    error.set(null);

    try {
      const result = fetcher();

      if (result instanceof Promise) {
        result
          .then(value => {
            data.set(value as T);
            loading.set(false);
          })
          .catch(err => {
            error.set(err instanceof Error ? err : new Error(String(err)));
            loading.set(false);
          });
      } else {
        data.set(result);
        loading.set(false);
      }
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    }
  };

  // Initial fetch
  refresh();

  const read = (() => {
    if (error()) throw error();
    return data() as T;
  }) as Resource<T>;

  read.refresh = refresh;
  read.loading = () => loading();
  read.error = () => error();

  return read;
}

// ============================================================================
// HMR API
// ============================================================================

/**
 * Options for HMR operations
 */
export interface HMROptions {
  /**
   * Enable verbose logging for debugging HMR issues
   */
  verbose?: boolean;

  /**
   * Custom error handler for HMR failures
   */
  onError?: (error: Error) => void;

  /**
   * Timeout for HMR operations in milliseconds
   * @default 100
   */
  timeout?: number;
}

/**
 * Snapshot all signal state for HMR preservation.
 * Called before a hot update to save current state.
 *
 * @param options - HMR configuration options
 * @returns The snapshot that can be used for rollback
 *
 * @example
 * ```ts
 * // Before HMR update
 * const snapshot = snapshotHMRState();
 *
 * try {
 *   // Apply HMR update
 *   applyUpdate();
 *   restoreHMRState();
 * } catch (error) {
 *   // Rollback on error
 *   rollbackHMRState(snapshot);
 * }
 * ```
 */
export function snapshotHMRState(options: HMROptions = {}): Map<string, any> {
  const snapshot = new Map<string, any>();

  if (!isDev || !activeSignals || !hmrStateRegistry) {
    return snapshot;
  }

  const startTime = performance.now();

  hmrInProgress = true;

  // Snapshot all active signal values
  for (const signal of activeSignals) {
    try {
      const value = signal.get();
      snapshot.set(signal.id, value);
      hmrStateRegistry.set(signal.id, value);
    } catch (error) {
      if (options.verbose) {
        console.warn(`[PhilJS HMR] Failed to snapshot signal ${signal.id}:`, error);
      }
    }
  }

  // Store snapshot for potential rollback
  hmrStateSnapshot = snapshot;

  if (options.verbose) {
    const duration = performance.now() - startTime;
    console.log(`[PhilJS HMR] Snapshotted ${snapshot.size} signals in ${duration.toFixed(2)}ms`);
  }

  return snapshot;
}

/**
 * Restore signal state from HMR registry.
 * Called after a hot update to restore preserved state.
 *
 * @param options - HMR configuration options
 *
 * @example
 * ```ts
 * // After HMR update
 * restoreHMRState({ verbose: true });
 * ```
 */
export function restoreHMRState(options: HMROptions = {}): void {
  if (!isDev || !activeSignals || !hmrStateRegistry) {
    return;
  }

  const startTime = performance.now();
  let restoredCount = 0;
  let failedCount = 0;

  // Restore state to all active signals
  for (const signal of activeSignals) {
    if (hmrStateRegistry.has(signal.id)) {
      try {
        const savedValue = hmrStateRegistry.get(signal.id);
        signal.set(savedValue);
        restoredCount++;
      } catch (error) {
        failedCount++;
        if (options.verbose) {
          console.warn(`[PhilJS HMR] Failed to restore signal ${signal.id}:`, error);
        }
        if (options.onError) {
          options.onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }

  hmrInProgress = false;

  if (options.verbose) {
    const duration = performance.now() - startTime;
    console.log(
      `[PhilJS HMR] Restored ${restoredCount} signals` +
      (failedCount > 0 ? ` (${failedCount} failed)` : '') +
      ` in ${duration.toFixed(2)}ms`
    );
  }
}

/**
 * Rollback to a previous HMR snapshot.
 * Used when an HMR update fails and we need to restore the previous state.
 *
 * @param snapshot - The snapshot to restore (from snapshotHMRState)
 * @param options - HMR configuration options
 *
 * @example
 * ```ts
 * const snapshot = snapshotHMRState();
 * try {
 *   applyHMRUpdate();
 * } catch (error) {
 *   rollbackHMRState(snapshot);
 *   throw error;
 * }
 * ```
 */
export function rollbackHMRState(snapshot: Map<string, any>, options: HMROptions = {}): void {
  if (!isDev || !activeSignals || !hmrStateRegistry) {
    return;
  }

  const startTime = performance.now();
  let rolledBackCount = 0;

  // Restore from snapshot
  for (const [id, value] of snapshot) {
    try {
      // Find the signal by ID
      for (const signal of activeSignals) {
        if (signal.id === id) {
          signal.set(value);
          rolledBackCount++;
          break;
        }
      }
      // Update registry
      hmrStateRegistry.set(id, value);
    } catch (error) {
      if (options.verbose) {
        console.warn(`[PhilJS HMR] Failed to rollback signal ${id}:`, error);
      }
    }
  }

  hmrInProgress = false;

  if (options.verbose) {
    const duration = performance.now() - startTime;
    console.log(`[PhilJS HMR] Rolled back ${rolledBackCount} signals in ${duration.toFixed(2)}ms`);
  }
}

/**
 * Cleanup all effects before HMR update.
 * Ensures proper cleanup to avoid memory leaks and stale subscriptions.
 *
 * @param options - HMR configuration options
 *
 * @example
 * ```ts
 * cleanupHMREffects();
 * // Apply HMR update...
 * // Effects will be re-created with new component code
 * ```
 */
export function cleanupHMREffects(options: HMROptions = {}): void {
  if (!isDev || !activeEffects) {
    return;
  }

  const startTime = performance.now();
  let cleanedCount = 0;

  // Dispose all active effects
  const effectsToClean = Array.from(activeEffects);

  for (const effectHandle of effectsToClean) {
    try {
      effectHandle.dispose();
      activeEffects.delete(effectHandle);
      cleanedCount++;
    } catch (error) {
      if (options.verbose) {
        console.warn(`[PhilJS HMR] Failed to cleanup effect ${effectHandle.id}:`, error);
      }
    }
  }

  if (options.verbose) {
    const duration = performance.now() - startTime;
    console.log(`[PhilJS HMR] Cleaned up ${cleanedCount} effects in ${duration.toFixed(2)}ms`);
  }
}

/**
 * Clear the HMR state registry.
 * Useful for testing or when you want to start fresh.
 *
 * @example
 * ```ts
 * clearHMRState();
 * ```
 */
export function clearHMRState(): void {
  if (!isDev || !hmrStateRegistry || !activeSignals || !activeEffects) {
    return;
  }

  hmrStateRegistry.clear();
  activeSignals.clear();
  activeEffects.clear();
  hmrStateSnapshot = null;
  hmrInProgress = false;
}

/**
 * Check if HMR is currently in progress.
 * Useful for conditional logic during hot updates.
 *
 * @returns True if HMR is in progress
 *
 * @example
 * ```ts
 * if (isHMRInProgress()) {
 *   // Skip expensive operations during HMR
 * }
 * ```
 */
export function isHMRInProgress(): boolean {
  return hmrInProgress;
}

/**
 * Get HMR state statistics for debugging.
 *
 * @returns Statistics about the current HMR state
 *
 * @example
 * ```ts
 * const stats = getHMRStats();
 * console.log(`Active signals: ${stats.signalCount}`);
 * ```
 */
export function getHMRStats(): {
  signalCount: number;
  effectCount: number;
  registrySize: number;
  hasSnapshot: boolean;
  inProgress: boolean;
} {
  return {
    signalCount: activeSignals?.size ?? 0,
    effectCount: activeEffects?.size ?? 0,
    registrySize: hmrStateRegistry?.size ?? 0,
    hasSnapshot: hmrStateSnapshot !== null,
    inProgress: hmrInProgress,
  };
}

/**
 * Alias for memo - creates a computed/derived value.
 * @alias memo
 */
export const computed = memo;

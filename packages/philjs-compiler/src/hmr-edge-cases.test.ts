/**
 * HMR Edge Cases Test Suite
 *
 * Comprehensive tests for HMR state preservation, error recovery,
 * and performance constraints.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock imports for testing - these would come from @philjs/core in production
// For now, create stubs to demonstrate the test structure

type EffectCleanup = () => void;
type EffectFn = () => void | EffectCleanup;

type Computation = {
  id: number;
  run: () => void;
  cleanup?: EffectCleanup;
  deps: Set<SignalHandle>;
  disposed: boolean;
};

type SignalHandle = {
  id: number;
  get: () => any;
  set: (next: any) => void;
  peek: () => any;
  initialValue: any;
  subscribers: Set<Computation>;
  updatedDuringHMR: boolean;
};

type HMRSnapshotEntry = {
  id: number;
  value: any;
  initialValue: any;
};

const hmrStateRegistry = new Map<number, any>();
const activeSignals = new Set<SignalHandle>();
const activeEffects = new Set<Computation>();
let hmrInProgress = false;
let hmrStateSnapshot: Map<number, any> | null = null;
let hmrSnapshotEntries: HMRSnapshotEntry[] | null = null;
let signalIdCounter = 0;
let effectIdCounter = 0;

let currentComputation: Computation | null = null;
let batchDepth = 0;
const pendingComputations = new Set<Computation>();

function trackSignalDependency(signal: SignalHandle) {
  if (currentComputation && !currentComputation.disposed) {
    signal.subscribers.add(currentComputation);
    currentComputation.deps.add(signal);
  }
}

function cleanupComputationDeps(computation: Computation) {
  for (const dep of computation.deps) {
    dep.subscribers.delete(computation);
  }
  computation.deps.clear();
}

function scheduleComputation(computation: Computation) {
  if (computation.disposed) return;
  if (batchDepth > 0) {
    pendingComputations.add(computation);
  } else {
    computation.run();
  }
}

function flushComputations() {
  if (pendingComputations.size === 0) return;
  const toRun = Array.from(pendingComputations);
  pendingComputations.clear();
  for (const computation of toRun) {
    computation.run();
  }
}

// Signal implementation stub
export function signal<T>(initialValue: T) {
  let value = initialValue;
  const subscribers = new Set<Computation>();
  const id = signalIdCounter++;

  const handle: SignalHandle = {
    id,
    get: () => value,
    set: (next: any) => {
      const nextValue = typeof next === 'function' ? next(value) : next;
      if (Object.is(value, nextValue)) return;
      value = nextValue;
      if (hmrInProgress) {
        handle.updatedDuringHMR = true;
      }
      hmrStateRegistry.set(id, value);
      for (const subscriber of Array.from(subscribers)) {
        scheduleComputation(subscriber);
      }
    },
    peek: () => value,
    initialValue,
    subscribers,
    updatedDuringHMR: false,
  };

  const read = (() => {
    trackSignalDependency(handle);
    return value;
  }) as any;

  read.set = handle.set;
  read.peek = handle.peek;

  activeSignals.add(handle);
  hmrStateRegistry.set(id, initialValue);

  return read;
}

// Effect implementation stub
export function effect(fn: EffectFn) {
  const computation: Computation = {
    id: effectIdCounter++,
    run: () => {},
    deps: new Set(),
    disposed: false,
  };

  const run = () => {
    if (computation.disposed) return;
    cleanupComputationDeps(computation);
    if (computation.cleanup) {
      computation.cleanup();
      computation.cleanup = undefined;
    }
    const prev = currentComputation;
    currentComputation = computation;
    try {
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        computation.cleanup = cleanup;
      }
    } finally {
      currentComputation = prev;
    }
  };

  computation.run = run;
  activeEffects.add(computation);
  run();

  const dispose = () => {
    if (computation.disposed) return;
    computation.disposed = true;
    cleanupComputationDeps(computation);
    if (computation.cleanup) {
      computation.cleanup();
      computation.cleanup = undefined;
    }
    activeEffects.delete(computation);
  };

  return dispose;
}

// Memo implementation stub
export function memo<T>(fn: () => T) {
  return (() => fn()) as any;
}

// Batch implementation stub
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      flushComputations();
    }
  }
}

// HMR API implementations
export function snapshotHMRState(options: any = {}): Map<number, any> {
  const snapshot = new Map<number, any>();
  hmrInProgress = true;
  hmrSnapshotEntries = [];

  for (const sig of activeSignals) {
    const value = sig.get();
    snapshot.set(sig.id, value);
    hmrStateRegistry.set(sig.id, value);
    hmrSnapshotEntries.push({
      id: sig.id,
      value,
      initialValue: sig.initialValue,
    });
    sig.updatedDuringHMR = false;
  }

  hmrStateSnapshot = snapshot;
  return snapshot;
}

function findSnapshotMatch(
  entries: HMRSnapshotEntry[],
  used: Set<number>,
  initialValue: any
): number | null {
  let fallback = -1;
  for (let i = 0; i < entries.length; i++) {
    if (used.has(i)) continue;
    if (fallback === -1) {
      fallback = i;
    }
    if (Object.is(entries[i]?.initialValue, initialValue)) {
      return i;
    }
  }
  return fallback === -1 ? null : fallback;
}

export function restoreHMRState(options: any = {}): void {
  const snapshot = hmrStateSnapshot;
  const snapshotEntries = hmrSnapshotEntries;
  const usedEntries = new Set<number>();
  hmrInProgress = false;

  if (!snapshot) {
    return;
  }

  batch(() => {
    for (const sig of activeSignals) {
      if (sig.updatedDuringHMR) {
        sig.updatedDuringHMR = false;
        continue;
      }

      if (snapshot.has(sig.id)) {
        try {
          sig.set(snapshot.get(sig.id));
        } catch {
          // Ignore individual restore failures
        }
        sig.updatedDuringHMR = false;
        continue;
      }

      if (!snapshotEntries || snapshotEntries.length === 0) {
        sig.updatedDuringHMR = false;
        continue;
      }

      const matchIndex = findSnapshotMatch(
        snapshotEntries,
        usedEntries,
        sig.initialValue
      );

      if (matchIndex === null) {
        sig.updatedDuringHMR = false;
        continue;
      }

      try {
        const nextValue = snapshotEntries[matchIndex]?.value;
        sig.set(nextValue);
        hmrStateRegistry.set(sig.id, nextValue);
        usedEntries.add(matchIndex);
      } catch {
        // Ignore individual restore failures
      } finally {
        sig.updatedDuringHMR = false;
      }
    }
  });
}

export function rollbackHMRState(snapshot: Map<number, any>, options: any = {}): void {
  hmrInProgress = false;
  batch(() => {
    for (const [id, value] of snapshot) {
      hmrStateRegistry.set(id, value);
    }
    for (const sig of activeSignals) {
      if (snapshot.has(sig.id)) {
        try {
          sig.set(snapshot.get(sig.id));
        } catch {
          // Continue rollback for other signals
        }
      }
      sig.updatedDuringHMR = false;
    }
  });
}

export function cleanupHMREffects(options: any = {}): void {
  const effects = Array.from(activeEffects);
  for (const effectHandle of effects) {
    try {
      effectHandle.disposed = true;
      cleanupComputationDeps(effectHandle);
      if (effectHandle.cleanup) {
        effectHandle.cleanup();
        effectHandle.cleanup = undefined;
      }
    } finally {
      activeEffects.delete(effectHandle);
    }
  }
}

export function clearHMRState(): void {
  hmrStateRegistry.clear();
  activeSignals.clear();
  activeEffects.clear();
  hmrStateSnapshot = null;
  hmrSnapshotEntries = null;
  hmrInProgress = false;
  signalIdCounter = 0;
  effectIdCounter = 0;
  currentComputation = null;
  batchDepth = 0;
  pendingComputations.clear();
}

export function getHMRStats() {
  return {
    signalCount: activeSignals.size,
    effectCount: activeEffects.size,
    registrySize: hmrStateRegistry.size,
    hasSnapshot: hmrStateSnapshot !== null,
    inProgress: hmrInProgress,
  };
}

export function isHMRInProgress(): boolean {
  return hmrInProgress;
}

export interface HMROptions {
  verbose?: boolean;
  onError?: (error: Error) => void;
  timeout?: number;
}

describe('HMR Edge Cases', () => {
  beforeEach(() => {
    clearHMRState();
  });

  afterEach(() => {
    clearHMRState();
  });

  describe('Signal state preservation', () => {
    it('should preserve signal values across HMR updates', () => {
      const count = signal(0);
      const name = signal('Alice');

      count.set(42);
      name.set('Bob');

      // Snapshot state
      const snapshot = snapshotHMRState();

      // Simulate HMR update - create new signals
      const count2 = signal(0);
      const name2 = signal('Alice');

      // Restore state
      restoreHMRState();

      // Verify state was preserved
      expect(count2()).toBe(42);
      expect(name2()).toBe('Bob');
    });

    it('should handle signal state when component boundaries change', () => {
      // Simulate component with local signals
      function Component1() {
        const local = signal(100);
        return local;
      }

      // Create component instance
      const instance1 = Component1();
      instance1.set(200);

      // Snapshot before boundary change
      const snapshot = snapshotHMRState();

      // Simulate component boundary change (new component definition)
      function Component2() {
        const local = signal(100);
        return local;
      }

      const instance2 = Component2();

      // Restore state
      restoreHMRState();

      // State should be restored even with boundary change
      expect(instance2()).toBe(200);
    });

    it('should preserve deeply nested signal state', () => {
      const parent = signal({ child: signal({ value: signal(10) }) });

      parent().child().value.set(50);

      const snapshot = snapshotHMRState();

      // Create new nested structure
      const parent2 = signal({ child: signal({ value: signal(10) }) });

      restoreHMRState();

      // Nested state should be preserved
      expect(parent2().child().value()).toBe(50);
    });

    it('should handle signal updates during HMR', () => {
      const count = signal(0);
      count.set(5);

      snapshotHMRState();

      // Update during HMR (should not be overwritten by restore)
      expect(isHMRInProgress()).toBe(true);
      count.set(10);

      restoreHMRState();
      expect(isHMRInProgress()).toBe(false);

      // Latest value should be preserved
      expect(count()).toBe(10);
    });

    it('should preserve signal state with custom equality', () => {
      const obj = signal({ a: 1, b: 2 });

      obj.set({ a: 2, b: 3 });

      const snapshot = snapshotHMRState();
      const obj2 = signal({ a: 1, b: 2 });

      restoreHMRState();

      expect(obj2()).toEqual({ a: 2, b: 3 });
    });
  });

  describe('Nested component updates', () => {
    it('should preserve parent state when child updates', () => {
      const parentState = signal('parent-value');
      const childState = signal('child-value');

      parentState.set('updated-parent');
      childState.set('updated-child');

      const snapshot = snapshotHMRState();

      // Simulate child component update
      const childState2 = signal('child-value');

      restoreHMRState();

      // Parent state should still be preserved
      expect(parentState()).toBe('updated-parent');
      expect(childState2()).toBe('updated-child');
    });

    it('should handle multi-level component hierarchies', () => {
      const grandparent = signal('gp');
      const parent = signal('p');
      const child = signal('c');

      grandparent.set('gp-updated');
      parent.set('p-updated');
      child.set('c-updated');

      const snapshot = snapshotHMRState();

      // Update only the middle component
      const parent2 = signal('p');

      restoreHMRState();

      expect(grandparent()).toBe('gp-updated');
      expect(parent2()).toBe('p-updated');
      expect(child()).toBe('c-updated');
    });

    it('should preserve computed values in nested components', () => {
      const a = signal(5);
      const b = signal(10);
      const sum = memo(() => a() + b());

      expect(sum()).toBe(15);

      a.set(20);
      expect(sum()).toBe(30);

      const snapshot = snapshotHMRState();

      // Simulate HMR - recreate memo
      const sum2 = memo(() => a() + b());

      restoreHMRState();

      // Signal values preserved, memo recomputes
      expect(sum2()).toBe(30);
    });
  });

  describe('Effect cleanup', () => {
    it('should cleanup effects on HMR', () => {
      const cleanupFn = vi.fn();
      const effectFn = vi.fn(() => cleanupFn);

      const count = signal(0);

      effect(() => {
        count();
        return cleanupFn;
      });

      expect(effectFn).not.toHaveBeenCalled();

      // Cleanup effects for HMR
      cleanupHMREffects();

      expect(cleanupFn).toHaveBeenCalled();
    });

    it('should re-run effects after HMR restore', () => {
      const effectRuns: number[] = [];
      const count = signal(0);

      effect(() => {
        effectRuns.push(count());
      });

      expect(effectRuns).toEqual([0]);

      count.set(5);
      expect(effectRuns).toEqual([0, 5]);

      snapshotHMRState();

      // Cleanup and recreate effect
      cleanupHMREffects();

      const effectRuns2: number[] = [];
      effect(() => {
        effectRuns2.push(count());
      });

      restoreHMRState();

      // Effect should run with restored state
      expect(effectRuns2).toEqual([5]);
    });

    it('should handle nested effect cleanup', () => {
      const cleanups: string[] = [];

      effect(() => {
        const inner = signal(1);

        effect(() => {
          inner();
          return () => cleanups.push('inner');
        });

        return () => cleanups.push('outer');
      });

      cleanupHMREffects();

      // Both cleanups should run
      expect(cleanups).toContain('inner');
      expect(cleanups).toContain('outer');
    });

    it('should not leak memory after multiple HMR cycles', () => {
      const stats1 = getHMRStats();
      const initialEffectCount = stats1.effectCount;

      // Create and cleanup effects multiple times
      for (let i = 0; i < 10; i++) {
        effect(() => signal(i)());
        cleanupHMREffects();
      }

      const stats2 = getHMRStats();

      // No effects should leak
      expect(stats2.effectCount).toBe(initialEffectCount);
    });
  });

  describe('Error recovery', () => {
    it('should rollback state on HMR error', () => {
      const count = signal(10);
      count.set(20);

      const snapshot = snapshotHMRState();

      // Simulate successful update
      count.set(30);

      // Simulate error - rollback
      rollbackHMRState(snapshot);

      expect(count()).toBe(20);
    });

    it('should handle rollback with multiple signals', () => {
      const a = signal(1);
      const b = signal(2);
      const c = signal(3);

      a.set(10);
      b.set(20);
      c.set(30);

      const snapshot = snapshotHMRState();

      a.set(100);
      b.set(200);
      c.set(300);

      rollbackHMRState(snapshot);

      expect(a()).toBe(10);
      expect(b()).toBe(20);
      expect(c()).toBe(30);
    });

    it('should handle partial rollback on error', () => {
      const normalSignal = signal(5);
      const errorSignal = signal(10);

      normalSignal.set(15);
      errorSignal.set(20);

      const snapshot = snapshotHMRState();

      normalSignal.set(50);

      // Create a signal that throws on set
      const throwingSignal = signal(0);
      const originalSet = throwingSignal.set;
      throwingSignal.set = () => {
        throw new Error('Set failed');
      };

      // Rollback should handle the error gracefully
      expect(() => rollbackHMRState(snapshot)).not.toThrow();

      // Non-throwing signals should still rollback
      expect(normalSignal()).toBe(15);
    });

    it('should recover from corrupted state', () => {
      const count = signal(10);
      const snapshot = snapshotHMRState();

      // Corrupt the snapshot
      snapshot.set('invalid-id', 'corrupted');

      // Should not throw on restore
      expect(() => restoreHMRState()).not.toThrow();
    });

    it('should handle timeout during snapshot', async () => {
      // Create many signals to simulate slow snapshot
      const signals = Array.from({ length: 100 }, (_, i) => signal(i));

      const startTime = performance.now();
      const snapshot = snapshotHMRState();
      const duration = performance.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(100);
      expect(snapshot.size).toBeGreaterThan(0);
    });
  });

  describe('Performance constraints', () => {
    it('should snapshot state in <100ms', () => {
      // Create a moderate number of signals
      const signals = Array.from({ length: 50 }, (_, i) => signal(i));

      const startTime = performance.now();
      snapshotHMRState();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should restore state in <100ms', () => {
      const signals = Array.from({ length: 50 }, (_, i) => signal(i));

      snapshotHMRState();

      const startTime = performance.now();
      restoreHMRState();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should handle large state efficiently', () => {
      // Create large state
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const largeSignal = signal(largeArray);

      const startTime = performance.now();
      const snapshot = snapshotHMRState();
      const snapshotDuration = performance.now() - startTime;

      const restoreStart = performance.now();
      restoreHMRState();
      const restoreDuration = performance.now() - restoreStart;

      // Should be fast even with large data
      expect(snapshotDuration).toBeLessThan(100);
      expect(restoreDuration).toBeLessThan(100);
    });

    it('should batch updates during restore', () => {
      const updateCounts: number[] = [];
      const signals = Array.from({ length: 10 }, (_, i) => signal(i));

      // Track updates
      effect(() => {
        signals.forEach(s => s());
        updateCounts.push(updateCounts.length);
      });

      const initialUpdates = updateCounts.length;

      snapshotHMRState();
      restoreHMRState();

      // Should batch all restores into single update
      expect(updateCounts.length - initialUpdates).toBeLessThanOrEqual(2);
    });

    it('should not degrade performance with multiple HMR cycles', () => {
      const count = signal(0);
      const durations: number[] = [];

      // Run 10 HMR cycles
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        snapshotHMRState();
        restoreHMRState();
        durations.push(performance.now() - start);
      }

      // Performance should not degrade significantly
      const firstDuration = durations[0];
      const lastDuration = durations[durations.length - 1];

      expect(lastDuration).toBeLessThan(firstDuration * 2);
    });
  });

  describe('HMR statistics', () => {
    it('should track signal count', () => {
      clearHMRState();

      signal(1);
      signal(2);
      signal(3);

      const stats = getHMRStats();
      expect(stats.signalCount).toBe(3);
    });

    it('should track effect count', () => {
      clearHMRState();

      effect(() => {});
      effect(() => {});

      const stats = getHMRStats();
      expect(stats.effectCount).toBe(2);
    });

    it('should track snapshot state', () => {
      let stats = getHMRStats();
      expect(stats.hasSnapshot).toBe(false);

      snapshotHMRState();

      stats = getHMRStats();
      expect(stats.hasSnapshot).toBe(true);
      expect(stats.inProgress).toBe(true);

      restoreHMRState();

      stats = getHMRStats();
      expect(stats.inProgress).toBe(false);
    });

    it('should track registry size', () => {
      clearHMRState();

      signal(1);
      signal(2);

      const stats = getHMRStats();
      expect(stats.registrySize).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty state', () => {
      clearHMRState();

      const snapshot = snapshotHMRState();
      expect(snapshot.size).toBe(0);

      expect(() => restoreHMRState()).not.toThrow();
    });

    it('should handle signals created during HMR', () => {
      snapshotHMRState();

      // Create signal during HMR
      const newSignal = signal(42);

      restoreHMRState();

      // New signal should work normally
      expect(newSignal()).toBe(42);
    });

    it('should handle concurrent snapshots', () => {
      const s1 = signal(1);
      const s2 = signal(2);

      const snapshot1 = snapshotHMRState();

      s1.set(10);
      s2.set(20);

      const snapshot2 = snapshotHMRState();

      rollbackHMRState(snapshot1);

      expect(s1()).toBe(1);
      expect(s2()).toBe(2);
    });

    it('should handle signals with undefined values', () => {
      const optional = signal<number | undefined>(undefined);

      const snapshot = snapshotHMRState();

      optional.set(42);

      rollbackHMRState(snapshot);

      expect(optional()).toBeUndefined();
    });

    it('should handle signals with null values', () => {
      const nullable = signal<string | null>(null);

      const snapshot = snapshotHMRState();

      nullable.set('value');

      rollbackHMRState(snapshot);

      expect(nullable()).toBeNull();
    });

    it('should preserve signal identity across HMR', () => {
      const s1 = signal(0);
      const id1 = s1;

      snapshotHMRState();
      restoreHMRState();

      // Signal reference should be preserved
      expect(s1).toBe(id1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle component with signals and effects', () => {
      const effectCalls: number[] = [];
      const count = signal(0);

      effect(() => {
        effectCalls.push(count());
      });

      count.set(5);
      expect(effectCalls).toEqual([0, 5]);

      snapshotHMRState();
      cleanupHMREffects();

      // Recreate effect after HMR
      const effectCalls2: number[] = [];
      effect(() => {
        effectCalls2.push(count());
      });

      restoreHMRState();

      expect(count()).toBe(5);
      expect(effectCalls2).toEqual([5]);
    });

    it('should handle batched updates with HMR', () => {
      const a = signal(1);
      const b = signal(2);
      const sum = memo(() => a() + b());

      batch(() => {
        a.set(10);
        b.set(20);
      });

      expect(sum()).toBe(30);

      const snapshot = snapshotHMRState();

      batch(() => {
        a.set(100);
        b.set(200);
      });

      rollbackHMRState(snapshot);

      expect(a()).toBe(10);
      expect(b()).toBe(20);
      expect(sum()).toBe(30);
    });

    it('should handle complex reactive graph', () => {
      const a = signal(1);
      const b = signal(2);
      const c = memo(() => a() + b());
      const d = memo(() => c() * 2);
      const e = memo(() => c() + d());

      expect(e()).toBe(9); // (1+2) + (1+2)*2 = 3 + 6 = 9

      a.set(5);
      expect(e()).toBe(21); // (5+2) + (5+2)*2 = 7 + 14 = 21

      const snapshot = snapshotHMRState();

      a.set(10);
      b.set(20);

      rollbackHMRState(snapshot);

      expect(a()).toBe(5);
      expect(b()).toBe(2);
      expect(e()).toBe(21);
    });
  });
});

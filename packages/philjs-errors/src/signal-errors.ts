/**
 * Signal-specific error detection and handling
 *
 * Detects common signal-related errors:
 * - Reading signal during its own update
 * - Circular dependencies
 * - Missing cleanup in effects
 * - Excessive re-computations
 */

import { createPhilJSError, type PhilJSError } from './error-codes';
import { getPrimaryLocation } from './stack-trace';

/**
 * Dependency tracking for circular dependency detection
 */
class DependencyGraph {
  private edges = new Map<string, Set<string>>();
  private currentPath: string[] = [];

  addDependency(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);
  }

  detectCycle(node: string): string[] | null {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (current: string, path: string[]): string[] | null => {
      visited.add(current);
      recStack.add(current);
      path.push(current);

      const neighbors = this.edges.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            const cycle = dfs(neighbor, [...path]);
            if (cycle) return cycle;
          } else if (recStack.has(neighbor)) {
            // Found a cycle
            const cycleStart = path.indexOf(neighbor);
            return path.slice(cycleStart).concat(neighbor);
          }
        }
      }

      recStack.delete(current);
      return null;
    };

    return dfs(node, []);
  }

  clear(): void {
    this.edges.clear();
    this.currentPath = [];
  }
}

const dependencyGraph = new DependencyGraph();

/**
 * Track active signal computations to detect read-during-update
 */
const activeUpdates = new Map<string, { name: string; stack: string }>();

/**
 * Track signal access patterns
 */
interface SignalAccess {
  signalName: string;
  timestamp: number;
  operation: 'read' | 'write';
  stack: string;
}

const recentAccesses: SignalAccess[] = [];
const MAX_ACCESS_HISTORY = 100;

/**
 * Record a signal access
 */
export function recordSignalAccess(
  signalName: string,
  operation: 'read' | 'write'
): void {
  const access: SignalAccess = {
    signalName,
    timestamp: Date.now(),
    operation,
    stack: new Error().stack || '',
  };

  recentAccesses.push(access);

  // Keep only recent history
  if (recentAccesses.length > MAX_ACCESS_HISTORY) {
    recentAccesses.shift();
  }

  // Check for read-during-update
  if (operation === 'read') {
    const updateInProgress = activeUpdates.get(signalName);
    if (updateInProgress) {
      throw createSignalReadDuringUpdateError(signalName);
    }
  }
}

/**
 * Mark signal update start
 */
export function markSignalUpdateStart(signalName: string): void {
  activeUpdates.set(signalName, {
    name: signalName,
    stack: new Error().stack || '',
  });
}

/**
 * Mark signal update end
 */
export function markSignalUpdateEnd(signalName: string): void {
  activeUpdates.delete(signalName);
}

/**
 * Create PHIL-001 error: Signal Read During Update
 */
function createSignalReadDuringUpdateError(signalName: string): PhilJSError {
  const error = createPhilJSError('PHIL-001', { signalName });
  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }
  return error;
}

/**
 * Add dependency relationship for cycle detection
 */
export function addDependency(from: string, to: string): void {
  dependencyGraph.addDependency(from, to);

  // Check for cycles
  const cycle = dependencyGraph.detectCycle(from);
  if (cycle) {
    throw createCircularDependencyError(cycle);
  }
}

/**
 * Create PHIL-002 error: Circular Dependency
 */
function createCircularDependencyError(cycle: string[]): PhilJSError {
  const error = createPhilJSError('PHIL-002', { cycle });
  const location = getPrimaryLocation(error);
  if (location) {
    error.sourceLocation = location;
  }
  return error;
}

/**
 * Clear dependency graph (useful for testing or resetting)
 */
export function clearDependencyGraph(): void {
  dependencyGraph.clear();
}

/**
 * Detect consecutive signal updates (batching opportunity)
 */
interface UpdateBatch {
  signals: string[];
  startTime: number;
  endTime?: number;
}

let currentBatch: UpdateBatch | null = null;
const BATCH_WINDOW_MS = 10; // Consider updates within 10ms as a batch

/**
 * Record signal update for batch detection
 */
export function recordSignalUpdate(signalName: string): void {
  const now = Date.now();

  if (!currentBatch) {
    currentBatch = {
      signals: [signalName],
      startTime: now,
    };
  } else if (now - currentBatch.startTime <= BATCH_WINDOW_MS) {
    currentBatch.signals.push(signalName);
  } else {
    // Batch window closed, check if we should warn
    if (currentBatch.signals.length >= 3) {
      console.warn(
        createUnbatchedUpdatesWarning(currentBatch.signals.length)
      );
    }

    // Start new batch
    currentBatch = {
      signals: [signalName],
      startTime: now,
    };
  }
}

/**
 * Create PHIL-003 warning: Unbatched Updates
 */
function createUnbatchedUpdatesWarning(count: number): PhilJSError {
  return createPhilJSError('PHIL-003', { count });
}

/**
 * Effect cleanup tracking
 */
const effectsWithoutCleanup = new Set<string>();

/**
 * Register an effect and check for cleanup
 */
export function registerEffect(
  effectId: string,
  hasCleanup: boolean,
  location?: string
): void {
  if (!hasCleanup) {
    effectsWithoutCleanup.add(effectId);

    // Create warning
    const warning = createEffectMissingCleanupWarning(location);
    console.warn(warning.message);
  }
}

/**
 * Create PHIL-004 warning: Effect Missing Cleanup
 */
function createEffectMissingCleanupWarning(location?: string): PhilJSError {
  return createPhilJSError('PHIL-004', { location });
}

/**
 * Check if effect has cleanup registered
 */
export function hasEffectCleanup(effectId: string): boolean {
  return !effectsWithoutCleanup.has(effectId);
}

/**
 * Track memo computations
 */
interface MemoComputation {
  id: string;
  lastValue: any;
  computeCount: number;
  lastComputeTime: number;
}

const memoComputations = new Map<string, MemoComputation>();

/**
 * Record memo computation
 */
export function recordMemoComputation(
  memoId: string,
  value: any
): void {
  const existing = memoComputations.get(memoId);

  if (existing) {
    existing.computeCount++;
    existing.lastValue = value;
    existing.lastComputeTime = Date.now();

    // Check for excessive recomputations
    if (existing.computeCount > 100) {
      console.warn(
        `Memo '${memoId}' has been recomputed ${existing.computeCount} times. ` +
        'This may indicate a performance issue.'
      );
    }
  } else {
    memoComputations.set(memoId, {
      id: memoId,
      lastValue: value,
      computeCount: 1,
      lastComputeTime: Date.now(),
    });
  }

  // Warn if memo returns undefined
  if (value === undefined) {
    const warning = createMemoReturningUndefinedWarning(memoId);
    console.warn(warning.message);
  }
}

/**
 * Create PHIL-005 warning: Memo Returning Undefined
 */
function createMemoReturningUndefinedWarning(
  location?: string
): PhilJSError {
  return createPhilJSError('PHIL-005', { location });
}

/**
 * Get signal error statistics
 */
export function getSignalErrorStats(): {
  totalAccesses: number;
  recentReads: number;
  recentWrites: number;
  activeUpdates: number;
  effectsWithoutCleanup: number;
  memoComputations: number;
} {
  const now = Date.now();
  const recentWindow = 1000; // 1 second

  return {
    totalAccesses: recentAccesses.length,
    recentReads: recentAccesses.filter(
      a => a.operation === 'read' && now - a.timestamp < recentWindow
    ).length,
    recentWrites: recentAccesses.filter(
      a => a.operation === 'write' && now - a.timestamp < recentWindow
    ).length,
    activeUpdates: activeUpdates.size,
    effectsWithoutCleanup: effectsWithoutCleanup.size,
    memoComputations: memoComputations.size,
  };
}

/**
 * Clear all signal error tracking (useful for testing)
 */
export function clearSignalErrorTracking(): void {
  recentAccesses.length = 0;
  activeUpdates.clear();
  effectsWithoutCleanup.clear();
  memoComputations.clear();
  currentBatch = null;
  clearDependencyGraph();
}

/**
 * Enable/disable signal error tracking
 */
let trackingEnabled = true;

export function setSignalErrorTracking(enabled: boolean): void {
  trackingEnabled = enabled;
  if (!enabled) {
    clearSignalErrorTracking();
  }
}

export function isSignalErrorTrackingEnabled(): boolean {
  return trackingEnabled;
}

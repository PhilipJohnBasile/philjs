/**
 * Signal-specific error detection and handling
 *
 * Detects common signal-related errors:
 * - Reading signal during its own update
 * - Circular dependencies
 * - Missing cleanup in effects
 * - Excessive re-computations
 */
import { createPhilJSError } from './error-codes.js';
import { getPrimaryLocation } from './stack-trace.js';
/**
 * Dependency tracking for circular dependency detection
 */
class DependencyGraph {
    edges = new Map();
    currentPath = [];
    addDependency(from, to) {
        if (!this.edges.has(from)) {
            this.edges.set(from, new Set());
        }
        this.edges.get(from).add(to);
    }
    detectCycle(node) {
        const visited = new Set();
        const recStack = new Set();
        const dfs = (current, path) => {
            visited.add(current);
            recStack.add(current);
            path.push(current);
            const neighbors = this.edges.get(current);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        const cycle = dfs(neighbor, [...path]);
                        if (cycle)
                            return cycle;
                    }
                    else if (recStack.has(neighbor)) {
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
    clear() {
        this.edges.clear();
        this.currentPath = [];
    }
}
const dependencyGraph = new DependencyGraph();
/**
 * Track active signal computations to detect read-during-update
 */
const activeUpdates = new Map();
const recentAccesses = [];
const MAX_ACCESS_HISTORY = 100;
/**
 * Record a signal access
 */
export function recordSignalAccess(signalName, operation) {
    const access = {
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
export function markSignalUpdateStart(signalName) {
    activeUpdates.set(signalName, {
        name: signalName,
        stack: new Error().stack || '',
    });
}
/**
 * Mark signal update end
 */
export function markSignalUpdateEnd(signalName) {
    activeUpdates.delete(signalName);
}
/**
 * Create PHIL-001 error: Signal Read During Update
 */
function createSignalReadDuringUpdateError(signalName) {
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
export function addDependency(from, to) {
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
function createCircularDependencyError(cycle) {
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
export function clearDependencyGraph() {
    dependencyGraph.clear();
}
let currentBatch = null;
const BATCH_WINDOW_MS = 10; // Consider updates within 10ms as a batch
/**
 * Record signal update for batch detection
 */
export function recordSignalUpdate(signalName) {
    const now = Date.now();
    if (!currentBatch) {
        currentBatch = {
            signals: [signalName],
            startTime: now,
        };
    }
    else if (now - currentBatch.startTime <= BATCH_WINDOW_MS) {
        currentBatch.signals.push(signalName);
    }
    else {
        // Batch window closed, check if we should warn
        if (currentBatch.signals.length >= 3) {
            console.warn(createUnbatchedUpdatesWarning(currentBatch.signals.length));
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
function createUnbatchedUpdatesWarning(count) {
    return createPhilJSError('PHIL-003', { count });
}
/**
 * Effect cleanup tracking
 */
const effectsWithoutCleanup = new Set();
/**
 * Register an effect and check for cleanup
 */
export function registerEffect(effectId, hasCleanup, location) {
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
function createEffectMissingCleanupWarning(location) {
    return createPhilJSError('PHIL-004', { location });
}
/**
 * Check if effect has cleanup registered
 */
export function hasEffectCleanup(effectId) {
    return !effectsWithoutCleanup.has(effectId);
}
const memoComputations = new Map();
/**
 * Record memo computation
 */
export function recordMemoComputation(memoId, value) {
    const existing = memoComputations.get(memoId);
    if (existing) {
        existing.computeCount++;
        existing.lastValue = value;
        existing.lastComputeTime = Date.now();
        // Check for excessive recomputations
        if (existing.computeCount > 100) {
            console.warn(`Memo '${memoId}' has been recomputed ${existing.computeCount} times. ` +
                'This may indicate a performance issue.');
        }
    }
    else {
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
function createMemoReturningUndefinedWarning(location) {
    return createPhilJSError('PHIL-005', { location });
}
/**
 * Get signal error statistics
 */
export function getSignalErrorStats() {
    const now = Date.now();
    const recentWindow = 1000; // 1 second
    return {
        totalAccesses: recentAccesses.length,
        recentReads: recentAccesses.filter(a => a.operation === 'read' && now - a.timestamp < recentWindow).length,
        recentWrites: recentAccesses.filter(a => a.operation === 'write' && now - a.timestamp < recentWindow).length,
        activeUpdates: activeUpdates.size,
        effectsWithoutCleanup: effectsWithoutCleanup.size,
        memoComputations: memoComputations.size,
    };
}
/**
 * Clear all signal error tracking (useful for testing)
 */
export function clearSignalErrorTracking() {
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
export function setSignalErrorTracking(enabled) {
    trackingEnabled = enabled;
    if (!enabled) {
        clearSignalErrorTracking();
    }
}
export function isSignalErrorTrackingEnabled() {
    return trackingEnabled;
}
//# sourceMappingURL=signal-errors.js.map
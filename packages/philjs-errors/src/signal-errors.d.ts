/**
 * Signal-specific error detection and handling
 *
 * Detects common signal-related errors:
 * - Reading signal during its own update
 * - Circular dependencies
 * - Missing cleanup in effects
 * - Excessive re-computations
 */
/**
 * Record a signal access
 */
export declare function recordSignalAccess(signalName: string, operation: 'read' | 'write'): void;
/**
 * Mark signal update start
 */
export declare function markSignalUpdateStart(signalName: string): void;
/**
 * Mark signal update end
 */
export declare function markSignalUpdateEnd(signalName: string): void;
/**
 * Add dependency relationship for cycle detection
 */
export declare function addDependency(from: string, to: string): void;
/**
 * Clear dependency graph (useful for testing or resetting)
 */
export declare function clearDependencyGraph(): void;
/**
 * Record signal update for batch detection
 */
export declare function recordSignalUpdate(signalName: string): void;
/**
 * Register an effect and check for cleanup
 */
export declare function registerEffect(effectId: string, hasCleanup: boolean, location?: string): void;
/**
 * Check if effect has cleanup registered
 */
export declare function hasEffectCleanup(effectId: string): boolean;
/**
 * Record memo computation
 */
export declare function recordMemoComputation(memoId: string, value: any): void;
/**
 * Get signal error statistics
 */
export declare function getSignalErrorStats(): {
    totalAccesses: number;
    recentReads: number;
    recentWrites: number;
    activeUpdates: number;
    effectsWithoutCleanup: number;
    memoComputations: number;
};
/**
 * Clear all signal error tracking (useful for testing)
 */
export declare function clearSignalErrorTracking(): void;
export declare function setSignalErrorTracking(enabled: boolean): void;
export declare function isSignalErrorTrackingEnabled(): boolean;
//# sourceMappingURL=signal-errors.d.ts.map
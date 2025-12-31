/**
 * PhilJS Testing - Snapshot Testing Utilities
 */
export interface SnapshotOptions {
    /**
     * Maximum number of characters to include in snapshot
     */
    maxLength?: number;
    /**
     * Whether to include signal values in snapshot
     */
    includeSignals?: boolean;
    /**
     * Custom serializer function
     */
    serializer?: (element: Element) => string;
}
export interface SnapshotResult {
    /**
     * The snapshot string
     */
    snapshot: string;
    /**
     * Match against expected snapshot
     */
    toMatch(expected: string): boolean;
    /**
     * Get differences from expected
     */
    diff(expected: string): string;
}
/**
 * Take a snapshot of a DOM element
 */
export declare function takeSnapshot(element: Element | null, options?: SnapshotOptions): SnapshotResult;
/**
 * Snapshot matcher for testing frameworks
 */
export declare class SnapshotMatcher {
    private snapshots;
    private updateMode;
    constructor(options?: {
        updateMode?: boolean;
    });
    /**
     * Match a snapshot by name
     */
    matchSnapshot(name: string, element: Element | null, options?: SnapshotOptions): void;
    /**
     * Get all snapshots
     */
    getSnapshots(): Record<string, string>;
    /**
     * Load snapshots from data
     */
    loadSnapshots(data: Record<string, string>): void;
    /**
     * Clear all snapshots
     */
    clear(): void;
}
/**
 * Create a snapshot matcher instance
 */
export declare function createSnapshotMatcher(options?: {
    updateMode?: boolean;
}): SnapshotMatcher;
/**
 * Snapshot a component's state
 */
export declare function snapshotSignalState(signals: Record<string, {
    get(): any;
}>): string;
/**
 * Compare signal state snapshots
 */
export declare function compareSignalSnapshots(actual: Record<string, {
    get(): any;
}>, expected: Record<string, any>): {
    match: boolean;
    diff: string;
};
//# sourceMappingURL=snapshot.d.ts.map
/**
 * Time-Travel Debugging System
 *
 * Provides:
 * - State history tracking with snapshots
 * - Time-travel navigation (undo/redo)
 * - Timeline branching (explore "what if" scenarios)
 * - State diffing and visualization
 * - Export/import sessions for bug reports
 */
import { type Signal } from "philjs-core";
export type StateSnapshot<T = any> = {
    id: string;
    timestamp: number;
    state: T;
    action?: string;
    metadata?: Record<string, any>;
    parentId?: string;
};
export type TimelineNode<T = any> = {
    snapshot: StateSnapshot<T>;
    children: TimelineNode<T>[];
    parent?: TimelineNode<T>;
};
export type TimeTravelConfig = {
    maxSnapshots?: number;
    captureInterval?: number;
    enableBranching?: boolean;
    captureActions?: boolean;
};
export type DiffType = "added" | "removed" | "modified" | "unchanged";
export type StateDiff = {
    path: string[];
    type: DiffType;
    oldValue?: any;
    newValue?: any;
};
/**
 * Calculate diff between two states
 */
export declare function diffState(oldState: any, newState: any, path?: string[]): StateDiff[];
export declare class TimeTravelDebugger<T = any> {
    private history;
    private timeline;
    private currentNode;
    private currentIndex;
    private lastCaptureTime;
    private config;
    isTimeTraveling: Signal<boolean>;
    canUndo: Signal<boolean>;
    canRedo: Signal<boolean>;
    constructor(config?: TimeTravelConfig);
    /**
     * Capture current state snapshot
     */
    capture(state: T, action?: string, metadata?: Record<string, any>): void;
    /**
     * Go back in time (undo)
     */
    undo(): StateSnapshot<T> | null;
    /**
     * Go forward in time (redo)
     */
    redo(): StateSnapshot<T> | null;
    /**
     * Jump to specific snapshot
     */
    jumpTo(snapshotId: string): StateSnapshot<T> | null;
    /**
     * Get current snapshot
     */
    getCurrent(): StateSnapshot<T> | null;
    /**
     * Get all snapshots
     */
    getHistory(): StateSnapshot<T>[];
    /**
     * Get timeline tree
     */
    getTimeline(): TimelineNode<T> | null;
    /**
     * Get diff between two snapshots
     */
    getDiff(fromId: string, toId: string): StateDiff[];
    /**
     * Stop time traveling (return to present)
     */
    stopTimeTraveling(): void;
    /**
     * Clear history
     */
    clear(): void;
    /**
     * Export session for bug reports
     */
    exportSession(): string;
    /**
     * Import session from JSON
     */
    importSession(json: string): void;
    /**
     * Get statistics
     */
    getStats(): {
        totalSnapshots: number;
        currentIndex: number;
        timeRange: {
            start: Date;
            end: Date;
        } | null;
        branches: number;
    };
    private cloneState;
    private updateNavigation;
    private findNodeById;
    private rebuildTimeline;
    private countBranches;
}
export declare function initTimeTravel<T>(config?: TimeTravelConfig): TimeTravelDebugger<T>;
export declare function getTimeTravelDebugger<T>(): TimeTravelDebugger<T> | null;
export declare function debugSignal<T>(sig: Signal<T>, name: string, timeTravelDebugger?: TimeTravelDebugger<any>): Signal<T>;
//# sourceMappingURL=time-travel.d.ts.map
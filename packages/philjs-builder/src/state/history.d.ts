/**
 * Undo/Redo history management for the builder
 */
import type { HistoryEntry, HistoryState, BuilderState } from '../types.js';
export interface HistoryManagerOptions {
    /**
     * Maximum number of history entries to keep
     * @default 100
     */
    maxEntries?: number;
    /**
     * Callback when an undo operation is performed
     */
    onUndo?: (entry: HistoryEntry) => void;
    /**
     * Callback when a redo operation is performed
     */
    onRedo?: (entry: HistoryEntry) => void;
    /**
     * Callback when history changes
     */
    onChange?: (state: HistoryState) => void;
    /**
     * Debounce time for combining similar actions (in ms)
     * @default 300
     */
    debounceTime?: number;
}
export interface HistoryManager {
    /**
     * Push a new entry to the history stack
     */
    push: (entry: HistoryEntry) => void;
    /**
     * Undo the last action
     */
    undo: () => void;
    /**
     * Redo the last undone action
     */
    redo: () => void;
    /**
     * Check if undo is available
     */
    canUndo: () => boolean;
    /**
     * Check if redo is available
     */
    canRedo: () => boolean;
    /**
     * Get the current history state
     */
    getState: () => HistoryState;
    /**
     * Get all history entries
     */
    getEntries: () => HistoryEntry[];
    /**
     * Get the current position in history
     */
    getCurrentIndex: () => number;
    /**
     * Go to a specific point in history
     */
    goTo: (index: number) => void;
    /**
     * Clear all history
     */
    clear: () => void;
    /**
     * Start a transaction (group multiple changes)
     */
    startTransaction: (description: string) => void;
    /**
     * End the current transaction
     */
    endTransaction: () => void;
    /**
     * Cancel the current transaction
     */
    cancelTransaction: () => void;
    /**
     * Check if a transaction is in progress
     */
    isInTransaction: () => boolean;
    /**
     * Get a summary of the history for debugging
     */
    getSummary: () => string[];
}
/**
 * Create a new history manager
 */
export declare function createHistoryManager(options?: HistoryManagerOptions): HistoryManager;
/**
 * Create keyboard shortcuts for undo/redo
 */
export declare function createHistoryKeyboardHandler(history: HistoryManager): (event: KeyboardEvent) => void;
/**
 * Create a decorator that automatically records history
 */
export declare function withHistory<T extends (...args: any[]) => any>(fn: T, history: HistoryManager, getDescription: (...args: Parameters<T>) => string, getStateSnapshot: () => Partial<BuilderState>): T;
//# sourceMappingURL=history.d.ts.map
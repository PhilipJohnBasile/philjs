/**
 * Redux DevTools Integration for PhilJS
 *
 * Provides:
 * - Action tracking
 * - State history
 * - Time travel debugging
 * - Action replay
 * - State persistence
 * - State import/export
 */
import { TimeTravelDebugger, type StateSnapshot, type StateDiff } from './time-travel.js';
export interface ReduxAction {
    type: string;
    payload?: any;
    meta?: any;
}
export interface ReduxDevToolsConfig {
    name?: string;
    maxAge?: number;
    actionSanitizer?: (action: ReduxAction, id: number) => ReduxAction;
    stateSanitizer?: (state: any, index: number) => any;
    actionsBlacklist?: string[];
    actionsWhitelist?: string[];
    trace?: boolean;
    traceLimit?: number;
}
export interface DevToolsState<T = any> {
    currentState: T;
    history: Array<{
        action: ReduxAction;
        state: T;
        timestamp: number;
    }>;
    isTimeTravel: boolean;
}
export declare class ReduxDevTools<T = any> {
    private extension;
    private unsubscribe?;
    private config;
    private timeTravelDebugger;
    currentState: any;
    isConnected: any;
    isLocked: any;
    isPaused: any;
    constructor(initialState: T, config?: ReduxDevToolsConfig, timeTravelDebugger?: TimeTravelDebugger<T>);
    /**
     * Connect to Redux DevTools Extension
     */
    private connect;
    /**
     * Disconnect from Redux DevTools
     */
    disconnect(): void;
    /**
     * Send an action to DevTools
     */
    send(action: ReduxAction, state: T): void;
    /**
     * Handle messages from DevTools
     */
    private handleMessage;
    /**
     * Handle dispatch commands from DevTools
     */
    private handleDispatch;
    /**
     * Handle custom actions from DevTools
     */
    private handleAction;
    /**
     * Reset to initial state
     */
    private handleReset;
    /**
     * Commit current state as new baseline
     */
    private handleCommit;
    /**
     * Rollback to last committed state
     */
    private handleRollback;
    /**
     * Jump to a specific state in history
     */
    private handleJump;
    /**
     * Toggle action (skip/unskip)
     */
    private handleToggleAction;
    /**
     * Import state from DevTools
     */
    private handleImport;
    /**
     * Get current state snapshot
     */
    getSnapshot(): StateSnapshot<T> | null;
    /**
     * Get state history
     */
    getHistory(): StateSnapshot<T>[];
    /**
     * Get diff between two states
     */
    getDiff(fromIndex: number, toIndex: number): StateDiff[];
    /**
     * Export state for persistence
     */
    exportState(): string;
    /**
     * Import state from JSON
     */
    importState(json: string): void;
    /**
     * Event handlers (set by consumers)
     */
    onStateChange?: (state: T) => void;
    onCustomAction?: (action: ReduxAction) => void;
}
/**
 * Initialize Redux DevTools integration
 *
 * @example
 * ```ts
 * const devTools = initReduxDevTools(
 *   { count: 0, user: null },
 *   { name: 'MyApp', maxAge: 100 }
 * );
 *
 * // Track actions
 * devTools.send({ type: 'INCREMENT' }, { count: 1 });
 * devTools.send({ type: 'SET_USER' }, { count: 1, user: { name: 'John' } });
 * ```
 */
export declare function initReduxDevTools<T>(initialState: T, config?: ReduxDevToolsConfig): ReduxDevTools<T>;
/**
 * Get global Redux DevTools instance
 */
export declare function getReduxDevTools<T>(): ReduxDevTools<T> | null;
/**
 * Disconnect and cleanup Redux DevTools
 */
export declare function disconnectReduxDevTools(): void;
export declare class ActionReplayer<T = any> {
    private actions;
    private currentIndex;
    private isReplaying;
    record(action: ReduxAction, state: T): void;
    replay(onAction: (action: ReduxAction, state: T) => void, speed?: number): Promise<void>;
    stop(): void;
    clear(): void;
    getActions(): Array<{
        action: ReduxAction;
        state: T;
    }>;
    isPlaying(): boolean;
}
export interface PersistenceConfig {
    key: string;
    storage?: Storage;
    version?: number;
    migrate?: (persistedState: any, version: number) => any;
}
/**
 * Persist state to localStorage/sessionStorage
 *
 * @example
 * ```ts
 * const persistence = new StatePersistence({
 *   key: 'my-app-state',
 *   storage: localStorage,
 *   version: 1,
 * });
 *
 * // Save state
 * persistence.save({ count: 5, user: { name: 'John' } });
 *
 * // Load state
 * const state = persistence.load();
 * ```
 */
export declare class StatePersistence<T = any> {
    private config;
    constructor(config: PersistenceConfig);
    save(state: T): void;
    load(): T | null;
    clear(): void;
}
//# sourceMappingURL=redux-devtools.d.ts.map
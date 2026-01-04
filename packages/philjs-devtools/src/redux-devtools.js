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
import { signal } from '@philjs/core';
import { TimeTravelDebugger, diffState, } from './time-travel.js';
// ============================================================================
// Redux DevTools Connection
// ============================================================================
export class ReduxDevTools {
    extension;
    unsubscribe;
    config;
    timeTravelDebugger;
    currentState = signal(null);
    isConnected = signal(false);
    isLocked = signal(false);
    isPaused = signal(false);
    constructor(initialState, config = {}, timeTravelDebugger) {
        this.config = {
            name: config.name || 'PhilJS Store',
            maxAge: config.maxAge || 50,
            actionSanitizer: config.actionSanitizer || ((action) => action),
            stateSanitizer: config.stateSanitizer || ((state) => state),
            actionsBlacklist: config.actionsBlacklist || [],
            actionsWhitelist: config.actionsWhitelist || [],
            trace: config.trace || false,
            traceLimit: config.traceLimit || 10,
        };
        this.timeTravelDebugger =
            timeTravelDebugger || new TimeTravelDebugger({ maxSnapshots: this.config.maxAge });
        this.currentState.set(initialState);
        this.connect();
    }
    /**
     * Connect to Redux DevTools Extension
     */
    connect() {
        if (typeof window === 'undefined')
            return;
        const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
        if (!devTools) {
            console.warn('[PhilJS DevTools] Redux DevTools Extension not found. Install from: https://github.com/reduxjs/redux-devtools');
            return;
        }
        this.extension = devTools.connect({
            name: this.config.name,
            maxAge: this.config.maxAge,
            trace: this.config.trace,
            traceLimit: this.config.traceLimit,
            features: {
                pause: true,
                lock: true,
                persist: true,
                export: true,
                import: 'custom',
                jump: true,
                skip: true,
                reorder: true,
                dispatch: true,
                test: true,
            },
        });
        this.isConnected.set(true);
        // Initialize with current state
        this.extension.init(this.currentState());
        // Subscribe to messages from DevTools
        this.unsubscribe = this.extension.subscribe((message) => {
            this.handleMessage(message);
        });
    }
    /**
     * Disconnect from Redux DevTools
     */
    disconnect() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }
        if (this.extension) {
            this.extension.disconnect();
            this.extension = null;
        }
        this.isConnected.set(false);
    }
    /**
     * Send an action to DevTools
     */
    send(action, state) {
        if (!this.extension || this.isPaused())
            return;
        // Filter by whitelist/blacklist
        if (this.config.actionsBlacklist.includes(action.type))
            return;
        if (this.config.actionsWhitelist.length > 0 &&
            !this.config.actionsWhitelist.includes(action.type)) {
            return;
        }
        // Sanitize
        const sanitizedAction = this.config.actionSanitizer(action, Date.now());
        const sanitizedState = this.config.stateSanitizer(state, Date.now());
        // Update current state
        this.currentState.set(state);
        // Capture in time travel debugger
        this.timeTravelDebugger.capture(state, action.type, { action });
        // Send to DevTools
        this.extension.send(sanitizedAction, sanitizedState);
    }
    /**
     * Handle messages from DevTools
     */
    handleMessage(message) {
        switch (message.type) {
            case 'DISPATCH':
                this.handleDispatch(message);
                break;
            case 'ACTION':
                this.handleAction(message);
                break;
            case 'START':
                this.isPaused.set(false);
                break;
            case 'STOP':
                this.isPaused.set(true);
                break;
            case 'LOCK':
                this.isLocked.set(message.status);
                break;
        }
    }
    /**
     * Handle dispatch commands from DevTools
     */
    handleDispatch(message) {
        switch (message.payload.type) {
            case 'RESET':
                this.handleReset();
                break;
            case 'COMMIT':
                this.handleCommit();
                break;
            case 'ROLLBACK':
                this.handleRollback();
                break;
            case 'JUMP_TO_STATE':
            case 'JUMP_TO_ACTION':
                this.handleJump(message);
                break;
            case 'TOGGLE_ACTION':
                this.handleToggleAction(message);
                break;
            case 'IMPORT_STATE':
                this.handleImport(message);
                break;
        }
    }
    /**
     * Handle custom actions from DevTools
     */
    handleAction(message) {
        // User dispatched a custom action from DevTools
        const action = message.payload;
        console.log('[PhilJS DevTools] Custom action dispatched:', action);
        // You can emit this action to your application
        if (this.onCustomAction) {
            this.onCustomAction(action);
        }
    }
    /**
     * Reset to initial state
     */
    handleReset() {
        this.timeTravelDebugger.clear();
        const initialState = this.currentState();
        if (initialState) {
            this.timeTravelDebugger.capture(initialState, 'RESET');
            this.extension.init(initialState);
        }
    }
    /**
     * Commit current state as new baseline
     */
    handleCommit() {
        this.timeTravelDebugger.clear();
        const state = this.currentState();
        if (state) {
            this.timeTravelDebugger.capture(state, 'COMMIT');
            this.extension.init(state);
        }
    }
    /**
     * Rollback to last committed state
     */
    handleRollback() {
        const history = this.timeTravelDebugger.getHistory();
        if (history.length > 0) {
            const lastCommit = history[0];
            this.currentState.set(lastCommit.state);
            this.extension.send({ type: 'ROLLBACK' }, lastCommit.state);
        }
    }
    /**
     * Jump to a specific state in history
     */
    handleJump(message) {
        try {
            let targetState;
            if (message.payload.type === 'JUMP_TO_STATE') {
                targetState = JSON.parse(message.state);
            }
            else {
                // JUMP_TO_ACTION - use action index
                const actionId = message.payload.actionId;
                const history = this.timeTravelDebugger.getHistory();
                if (actionId >= 0 && actionId < history.length) {
                    targetState = history[actionId].state;
                }
                else {
                    return;
                }
            }
            this.currentState.set(targetState);
            // Emit state change event
            if (this.onStateChange) {
                this.onStateChange(targetState);
            }
        }
        catch (error) {
            console.error('[PhilJS DevTools] Failed to jump to state:', error);
        }
    }
    /**
     * Toggle action (skip/unskip)
     */
    handleToggleAction(message) {
        // This would require action replay functionality
        console.log('[PhilJS DevTools] Toggle action:', message.payload);
    }
    /**
     * Import state from DevTools
     */
    handleImport(message) {
        try {
            const importedState = message.payload.nextLiftedState;
            if (importedState.computedStates && importedState.computedStates.length > 0) {
                const lastState = importedState.computedStates[importedState.computedStates.length - 1].state;
                this.currentState.set(lastState);
                this.timeTravelDebugger.importSession(JSON.stringify({ history: [{ state: lastState }] }));
                if (this.onStateChange) {
                    this.onStateChange(lastState);
                }
            }
        }
        catch (error) {
            console.error('[PhilJS DevTools] Failed to import state:', error);
        }
    }
    /**
     * Get current state snapshot
     */
    getSnapshot() {
        return this.timeTravelDebugger.getCurrent();
    }
    /**
     * Get state history
     */
    getHistory() {
        return this.timeTravelDebugger.getHistory();
    }
    /**
     * Get diff between two states
     */
    getDiff(fromIndex, toIndex) {
        const history = this.timeTravelDebugger.getHistory();
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= history.length || toIndex >= history.length) {
            return [];
        }
        return diffState(history[fromIndex].state, history[toIndex].state);
    }
    /**
     * Export state for persistence
     */
    exportState() {
        return this.timeTravelDebugger.exportSession();
    }
    /**
     * Import state from JSON
     */
    importState(json) {
        this.timeTravelDebugger.importSession(json);
        const current = this.timeTravelDebugger.getCurrent();
        if (current) {
            this.currentState.set(current.state);
            if (this.extension) {
                this.extension.send({ type: 'IMPORT' }, current.state);
            }
        }
    }
    /**
     * Event handlers (set by consumers)
     */
    onStateChange;
    onCustomAction;
}
// ============================================================================
// Global Instance
// ============================================================================
let globalReduxDevTools = null;
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
export function initReduxDevTools(initialState, config) {
    if (!globalReduxDevTools) {
        globalReduxDevTools = new ReduxDevTools(initialState, config);
    }
    return globalReduxDevTools;
}
/**
 * Get global Redux DevTools instance
 */
export function getReduxDevTools() {
    return globalReduxDevTools;
}
/**
 * Disconnect and cleanup Redux DevTools
 */
export function disconnectReduxDevTools() {
    if (globalReduxDevTools) {
        globalReduxDevTools.disconnect();
        globalReduxDevTools = null;
    }
}
// ============================================================================
// Action Replay
// ============================================================================
export class ActionReplayer {
    actions = [];
    currentIndex = 0;
    isReplaying = signal(false);
    record(action, state) {
        this.actions.push({ action, state });
    }
    async replay(onAction, speed = 1000) {
        this.isReplaying.set(true);
        this.currentIndex = 0;
        for (const { action, state } of this.actions) {
            if (!this.isReplaying())
                break;
            onAction(action, state);
            this.currentIndex++;
            await new Promise((resolve) => setTimeout(resolve, speed));
        }
        this.isReplaying.set(false);
    }
    stop() {
        this.isReplaying.set(false);
    }
    clear() {
        this.actions = [];
        this.currentIndex = 0;
    }
    getActions() {
        return this.actions.slice();
    }
    isPlaying() {
        return this.isReplaying();
    }
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
export class StatePersistence {
    config;
    constructor(config) {
        this.config = {
            key: config.key,
            storage: config.storage || (typeof window !== 'undefined' ? localStorage : {}),
            version: config.version || 1,
            migrate: config.migrate || ((state) => state),
        };
    }
    save(state) {
        try {
            const data = {
                state,
                version: this.config.version,
                timestamp: Date.now(),
            };
            this.config.storage.setItem(this.config.key, JSON.stringify(data));
        }
        catch (error) {
            console.error('[PhilJS DevTools] Failed to save state:', error);
        }
    }
    load() {
        try {
            const item = this.config.storage.getItem(this.config.key);
            if (!item)
                return null;
            const data = JSON.parse(item);
            // Handle version migration
            if (data.version !== this.config.version) {
                return this.config.migrate(data.state, data.version);
            }
            return data.state;
        }
        catch (error) {
            console.error('[PhilJS DevTools] Failed to load state:', error);
            return null;
        }
    }
    clear() {
        this.config.storage.removeItem(this.config.key);
    }
}
//# sourceMappingURL=redux-devtools.js.map
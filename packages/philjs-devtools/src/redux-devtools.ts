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

import { signal, type Signal } from '@philjs/core';
import {
  TimeTravelDebugger,
  type StateSnapshot,
  type StateDiff,
  diffState,
} from './time-travel.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Redux DevTools Connection
// ============================================================================

export class ReduxDevTools<T = any> {
  private extension: any;
  private unsubscribe?: () => void;
  private config: Required<ReduxDevToolsConfig>;
  private timeTravelDebugger: TimeTravelDebugger<T>;

  public currentState = signal<T | null>(null);
  public isConnected = signal<boolean>(false);
  public isLocked = signal<boolean>(false);
  public isPaused = signal<boolean>(false);

  constructor(
    initialState: T,
    config: ReduxDevToolsConfig = {},
    timeTravelDebugger?: TimeTravelDebugger<T>
  ) {
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
      timeTravelDebugger || new TimeTravelDebugger<T>({ maxSnapshots: this.config.maxAge });

    this.currentState.set(initialState);
    this.connect();
  }

  /**
   * Connect to Redux DevTools Extension
   */
  private connect(): void {
    if (typeof window === 'undefined') return;

    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    if (!devTools) {
      console.warn(
        '[PhilJS DevTools] Redux DevTools Extension not found. Install from: https://github.com/reduxjs/redux-devtools'
      );
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
    this.unsubscribe = this.extension.subscribe((message: any) => {
      this.handleMessage(message);
    });
  }

  /**
   * Disconnect from Redux DevTools
   */
  public disconnect(): void {
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
  public send(action: ReduxAction, state: T): void {
    if (!this.extension || this.isPaused()) return;

    // Filter by whitelist/blacklist
    if (this.config.actionsBlacklist.includes(action.type)) return;
    if (
      this.config.actionsWhitelist.length > 0 &&
      !this.config.actionsWhitelist.includes(action.type)
    ) {
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
  private handleMessage(message: any): void {
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
  private handleDispatch(message: any): void {
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
  private handleAction(message: any): void {
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
  private handleReset(): void {
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
  private handleCommit(): void {
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
  private handleRollback(): void {
    const history = this.timeTravelDebugger.getHistory();
    if (history.length > 0) {
      const lastCommit = history[0]!;
      this.currentState.set(lastCommit.state);
      this.extension.send({ type: 'ROLLBACK' }, lastCommit.state);
    }
  }

  /**
   * Jump to a specific state in history
   */
  private handleJump(message: any): void {
    try {
      let targetState: T;

      if (message.payload.type === 'JUMP_TO_STATE') {
        targetState = JSON.parse(message.state);
      } else {
        // JUMP_TO_ACTION - use action index
        const actionId = message.payload.actionId;
        const history = this.timeTravelDebugger.getHistory();
        if (actionId >= 0 && actionId < history.length) {
          targetState = history[actionId]!.state;
        } else {
          return;
        }
      }

      this.currentState.set(targetState);

      // Emit state change event
      if (this.onStateChange) {
        this.onStateChange(targetState);
      }
    } catch (error) {
      console.error('[PhilJS DevTools] Failed to jump to state:', error);
    }
  }

  /**
   * Toggle action (skip/unskip)
   */
  private handleToggleAction(message: any): void {
    // This would require action replay functionality
    console.log('[PhilJS DevTools] Toggle action:', message.payload);
  }

  /**
   * Import state from DevTools
   */
  private handleImport(message: any): void {
    try {
      const importedState = message.payload.nextLiftedState;

      if (importedState.computedStates && importedState.computedStates.length > 0) {
        const lastState =
          importedState.computedStates[importedState.computedStates.length - 1].state;

        this.currentState.set(lastState);
        this.timeTravelDebugger.importSession(
          JSON.stringify({ history: [{ state: lastState }] })
        );

        if (this.onStateChange) {
          this.onStateChange(lastState);
        }
      }
    } catch (error) {
      console.error('[PhilJS DevTools] Failed to import state:', error);
    }
  }

  /**
   * Get current state snapshot
   */
  public getSnapshot(): StateSnapshot<T> | null {
    return this.timeTravelDebugger.getCurrent();
  }

  /**
   * Get state history
   */
  public getHistory(): StateSnapshot<T>[] {
    return this.timeTravelDebugger.getHistory();
  }

  /**
   * Get diff between two states
   */
  public getDiff(fromIndex: number, toIndex: number): StateDiff[] {
    const history = this.timeTravelDebugger.getHistory();
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= history.length || toIndex >= history.length) {
      return [];
    }

    return diffState(history[fromIndex]!.state, history[toIndex]!.state);
  }

  /**
   * Export state for persistence
   */
  public exportState(): string {
    return this.timeTravelDebugger.exportSession();
  }

  /**
   * Import state from JSON
   */
  public importState(json: string): void {
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
  public onStateChange?: (state: T) => void;
  public onCustomAction?: (action: ReduxAction) => void;
}

// ============================================================================
// Global Instance
// ============================================================================

let globalReduxDevTools: ReduxDevTools<any> | null = null;

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
export function initReduxDevTools<T>(
  initialState: T,
  config?: ReduxDevToolsConfig
): ReduxDevTools<T> {
  if (!globalReduxDevTools) {
    globalReduxDevTools = new ReduxDevTools<T>(initialState, config);
  }
  return globalReduxDevTools as ReduxDevTools<T>;
}

/**
 * Get global Redux DevTools instance
 */
export function getReduxDevTools<T>(): ReduxDevTools<T> | null {
  return globalReduxDevTools as ReduxDevTools<T> | null;
}

/**
 * Disconnect and cleanup Redux DevTools
 */
export function disconnectReduxDevTools(): void {
  if (globalReduxDevTools) {
    globalReduxDevTools.disconnect();
    globalReduxDevTools = null;
  }
}

// ============================================================================
// Action Replay
// ============================================================================

export class ActionReplayer<T = any> {
  private actions: Array<{ action: ReduxAction; state: T }> = [];
  private currentIndex = 0;
  private isReplaying = signal(false);

  public record(action: ReduxAction, state: T): void {
    this.actions.push({ action, state });
  }

  public async replay(
    onAction: (action: ReduxAction, state: T) => void,
    speed: number = 1000
  ): Promise<void> {
    this.isReplaying.set(true);
    this.currentIndex = 0;

    for (const { action, state } of this.actions) {
      if (!this.isReplaying()) break;

      onAction(action, state);
      this.currentIndex++;

      await new Promise((resolve) => setTimeout(resolve, speed));
    }

    this.isReplaying.set(false);
  }

  public stop(): void {
    this.isReplaying.set(false);
  }

  public clear(): void {
    this.actions = [];
    this.currentIndex = 0;
  }

  public getActions(): Array<{ action: ReduxAction; state: T }> {
    return this.actions.slice();
  }

  public isPlaying(): boolean {
    return this.isReplaying();
  }
}

// ============================================================================
// State Persistence
// ============================================================================

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
export class StatePersistence<T = any> {
  private config: Required<PersistenceConfig>;

  constructor(config: PersistenceConfig) {
    this.config = {
      key: config.key,
      storage: config.storage || (typeof window !== 'undefined' ? localStorage : ({} as Storage)),
      version: config.version || 1,
      migrate: config.migrate || ((state) => state),
    };
  }

  public save(state: T): void {
    try {
      const data = {
        state,
        version: this.config.version,
        timestamp: Date.now(),
      };
      this.config.storage.setItem(this.config.key, JSON.stringify(data));
    } catch (error) {
      console.error('[PhilJS DevTools] Failed to save state:', error);
    }
  }

  public load(): T | null {
    try {
      const item = this.config.storage.getItem(this.config.key);
      if (!item) return null;

      const data = JSON.parse(item);

      // Handle version migration
      if (data.version !== this.config.version) {
        return this.config.migrate(data.state, data.version);
      }

      return data.state;
    } catch (error) {
      console.error('[PhilJS DevTools] Failed to load state:', error);
      return null;
    }
  }

  public clear(): void {
    this.config.storage.removeItem(this.config.key);
  }
}
